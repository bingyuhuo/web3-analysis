import { Order } from "@/types/order";
import { UserCredits } from "@/types/user";
import { getDb } from "@/models/db";

// 计算用户积分（业务逻辑）
export async function calculateUserCredits(orders: Order[], user_address: string): Promise<UserCredits> {
  const db = getDb();
  const now = new Date().toISOString();
  
  try {
    // 1. 从 user_credits 表获取基础信息，包括到期时间
    const creditsResult = await db.query(
      `SELECT credits, used_credits, plan, expires_at
       FROM user_credits 
       WHERE user_address = $1 AND (expires_at IS NULL OR expires_at > $2)`,
      [user_address, now]
    );

    let user_credits: UserCredits = {
      one_time_credits: 0,
      monthly_credits: 0,
      total_credits: 0,
      used_credits: creditsResult.rows[0]?.used_credits || 0,
      left_credits: 0,
      expires_at: creditsResult.rows[0]?.expires_at || null,
      days_until_expiry: 0
    };

    // 如果有到期时间，计算剩余天数
    if (user_credits.expires_at) {
      const daysLeft = Math.ceil(
        (new Date(user_credits.expires_at).getTime() - new Date().getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      user_credits.days_until_expiry = daysLeft;
    }

    // 2. 计算各类型积分
    orders.forEach((order: Order) => {
      if (order.order_status === 2) {
        user_credits.total_credits += order.credits;
        if (order.plan === "monthly") {
          user_credits.monthly_credits += order.credits;
        } else {
          user_credits.one_time_credits += order.credits;
        }
      }
    });

    // 3. 计算剩余积分
    user_credits.left_credits = user_credits.total_credits - user_credits.used_credits;
    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    return user_credits;
  } catch (error) {
    console.error('Failed to calculate user credits:', error);
    throw error;
  }
}

// 获取用户积分（API 调用）
export async function getUserCredits(user_address: string): Promise<UserCredits> {
  try {
    // 在服务端需要完整的 URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/get-user-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address: user_address })
    });
    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch user credits:", error);
    return {
      one_time_credits: 0,
      monthly_credits: 0,
      total_credits: 0,
      used_credits: 0,
      left_credits: 0,
      expires_at: null,
      days_until_expiry: 0
    };
  }
}

