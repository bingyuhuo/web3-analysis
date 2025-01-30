import { NextResponse } from 'next/server';
import { updateOrderStatus, updateUserCredits } from '@/models/order';
import { findOrderByOrderNo } from '@/models/order';
import { getDb } from '@/models/db';

export async function POST(req: Request) {
  const db = getDb();
  // 开启事务
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { transaction_hash, order_no } = await req.json();
    console.log('Processing order:', { transaction_hash, order_no });

    // 查找订单
    let retries = 5;
    let order = null;
    while (retries > 0) {
      order = await findOrderByOrderNo(order_no);
      if (order) break;
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries--;
      console.log(`订单查询重试次数剩余: ${retries}`);
    }

    if (!order) {
      throw new Error('订单不存在');
    }

    // 更新订单状态
    const paid_at = new Date().toISOString();
    await updateOrderStatus(order_no, 2, paid_at);

    // 更新用户积分
    await updateUserCredits(order.user_address, order.credits, order.plan);

    // 提交事务
    await client.query('COMMIT');
    console.log('订单处理完成');

    return NextResponse.json({ code: 0, message: 'success' });

  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('订单处理失败:', error);
    return NextResponse.json({ code: -1, message: '订单处理失败' });
  } finally {
    // 释放连接
    client.release();
  }
}
