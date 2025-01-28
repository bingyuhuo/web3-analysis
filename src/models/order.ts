import { Order } from "@/types/order";
import { QueryResultRow } from "pg";
import { getDb } from "@/models/db";
import { CreditConsumption } from '@/types/credits';

export async function insertOrder(order: Order) {
  const db = getDb();
  const res = await db.query(
    `INSERT INTO orders 
        (order_no, created_at, user_address, amount, credits, network, 
         transaction_hash, order_status, expired_at, plan, token_address, token_decimals) 
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
    [
      order.order_no,
      order.created_at,
      order.user_address,
      order.amount,
      order.credits,
      order.network,
      order.transaction_hash,
      order.order_status,
      order.expired_at,
      order.plan,
      order.token_address,
      order.token_decimals
    ]
  );

  return res;
}

export async function findOrderByOrderNo(
  order_no: string
): Promise<Order | undefined> {
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM orders WHERE order_no = $1 LIMIT 1`,
    [order_no]
  );
  if (res.rowCount === 0) {
    return undefined;
  }

  const { rows } = res;
  const row = rows[0];
  return formatOrder(row);
}

export async function updateOrderStatus(
  order_no: string,
  order_status: number,
  paied_at: string
) {
  const db = getDb();
  const res = await db.query(
    `UPDATE orders SET order_status=$1, paied_at=$2 WHERE order_no=$3`,
    [order_status, paied_at, order_no]
  );

  return res;
}

export async function getUserOrders(
  user_address: string
): Promise<Order[] | undefined> {
  const now = new Date().toISOString();
  const db = getDb();
  const res = await db.query(
    `SELECT * FROM orders WHERE user_address = $1 AND order_status = 2 AND expired_at >= $2`,
    [user_address, now]
  );
  if (res.rowCount === 0) {
    return undefined;
  }

  return res.rows.map(row => formatOrder(row));
}

export async function updateUserCredits(user_address: string, credits: number, plan: string) {
  const db = getDb();
  const now = new Date().toISOString();
  const expires_at = plan === 'monthly' 
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  
  // 检查用户是否已存在
  const checkUser = await db.query(
    `SELECT * FROM user_credits WHERE user_address = $1`,
    [user_address]
  );

  if (checkUser.rowCount === 0) {
    // 如果用户不存在，创建新记录
    return await db.query(
      `INSERT INTO user_credits 
       (user_address, credits, plan, updated_at, expires_at) 
       VALUES ($1, $2, $3, $4, $5)`,
      [user_address, credits, plan, now, expires_at]
    );
  } else {
    // 如果用户存在，更新积分
    return await db.query(
      `UPDATE user_credits 
       SET credits = credits + $1, 
           plan = $2, 
           updated_at = $3,
           expires_at = CASE 
             WHEN $2 = 'monthly' THEN $4
             ELSE expires_at
           END
       WHERE user_address = $5`,
      [credits, plan, now, expires_at, user_address]
    );
  }
}

// 消费积分
export async function consumeUserCredits(consumption: CreditConsumption) {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // 1. 检查并扣减用户积分
    const updateResult = await client.query(
      `UPDATE user_credits 
       SET credits = credits - $1, 
           used_credits = used_credits + $1,
           updated_at = $2
       WHERE user_address = $3 AND credits >= $1
       RETURNING credits`,
      [consumption.amount, consumption.created_at, consumption.user_address]
    );

    if (updateResult.rowCount === 0) {
      throw new Error('Not enough points');
    }

    // 2. 记录积分消费历史
    await client.query(
      `INSERT INTO credit_consumption (
        user_address, amount, type, report_id, created_at
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        consumption.user_address,
        consumption.amount,
        consumption.type,
        consumption.report_id || null,
        consumption.created_at
      ]
    );

    // 3. 如果是查看报告，添加到用户报告列表
    if (consumption.type === 'view' && consumption.report_id) {
      await client.query(
        `INSERT INTO user_reports (
          user_address, report_id, created_at
        ) VALUES ($1, $2, $3)
        ON CONFLICT (user_address, report_id) DO NOTHING`,
        [consumption.user_address, consumption.report_id, consumption.created_at]
      );
    }

    await client.query('COMMIT');
    return updateResult.rows[0].credits;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// 检查用户是否已购买报告
export async function checkUserReport(user_address: string, report_id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.query(
    `SELECT 1 FROM user_reports 
     WHERE user_address = $1 AND report_id = $2`,
    [user_address, report_id]
  );
  return (result?.rowCount ?? 0) > 0;
}

// 获取用户已购买的报告列表
export async function getUserReports(user_address: string) {
  const db = getDb();
  const result = await db.query(
    `SELECT r.* 
     FROM reports r
     INNER JOIN user_reports ur ON r.id = ur.report_id
     WHERE ur.user_address = $1
     ORDER BY ur.created_at DESC`,
    [user_address]
  );
  return result.rows;
}
// 定期检查用户积分是否过期
export async function checkExpiredCredits(user_address: string) {
  const db = getDb();
  const now = new Date().toISOString();
  
  const result = await db.query(
    `UPDATE user_credits 
     SET credits = 0 
     WHERE user_address = $1 
     AND expires_at < $2 
     AND expires_at IS NOT NULL`,
    [user_address, now]
  );
  
  return (result?.rowCount ?? 0) > 0; // 使用可选链和空值合并
}

export async function checkExpiringCredits(user_address: string): Promise<{
  isExpiring: boolean;
  daysLeft: number;
  credits: number;
} | null> {
  const db = getDb();
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  const result = await db.query(
    `SELECT credits, expires_at 
     FROM user_credits 
     WHERE user_address = $1 
     AND expires_at IS NOT NULL 
     AND expires_at > $2 
     AND expires_at <= $3`,
    [user_address, now.toISOString(), threeDaysLater.toISOString()]
  );
  
  if (result.rows.length === 0) return null;
  
  const daysLeft = Math.ceil(
    (new Date(result.rows[0].expires_at).getTime() - now.getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  return {
    isExpiring: true,
    daysLeft,
    credits: result.rows[0].credits
  };
}

function formatOrder(row: QueryResultRow): Order {
  return {
    order_no: row.order_no,
    created_at: row.created_at,
    user_address: row.user_address,
    amount: row.amount,
    credits: row.credits,
    network: row.network,
    transaction_hash: row.transaction_hash,
    order_status: row.order_status,
    expired_at: row.expired_at,
    paied_at: row.paied_at,
    plan: row.plan,
    token_address: row.token_address,
    token_decimals: row.token_decimals
  };
}
