import { NextResponse } from 'next/server';
import { updateOrderStatus, updateUserCredits } from '@/models/order';
import { findOrderByOrderNo } from '@/models/order';

export async function POST(req: Request) {
  try {
    const { transaction_hash, order_no } = await req.json();
    console.log('Processing order:', { transaction_hash, order_no });

    // 添加重试机制
    let retries = 3;
    let order = null;

    while (retries > 0) {
      order = await findOrderByOrderNo(order_no);
      if (order) break;
      await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      retries--;
    }

    if (!order) {
      return NextResponse.json({ 
        code: -1, 
        message: 'Order does not exist' 
      });
    }

    // 直接更新订单状态和用户积分
    const paid_at = new Date().toISOString();
    await updateOrderStatus(order_no, 2, paid_at);
    await updateUserCredits(order.user_address, order.credits, order.plan);
    console.log('Order processing completed');

    return NextResponse.json({ 
      code: 0, 
      message: 'success' 
    });

  } catch (error) {
    console.error('Failed to process order:', error);
    return NextResponse.json({ 
      code: -1, 
      message: 'Failed to process order' 
    });
  }
}
