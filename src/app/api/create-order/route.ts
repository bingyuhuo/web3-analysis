import { insertOrder } from "@/models/order";
import { Order } from "@/types/order";
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    const { plan_type, user_address, amount, credits } = await req.json()
    
    // 计算过期时间
    const expired_at = plan_type === 'monthly' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000*50).toISOString(); // 一次性购买设置为50年后过期
    
    const order: Order = {
      order_no: nanoid(), // 生成唯一订单号
      created_at: new Date().toISOString(),
      user_address,
      amount,
      credits,
      network: 'polygon',
      transaction_hash: '',
      order_status: 0, // 0: 待支付
      expired_at, // 使用计算好的过期时间
      plan: plan_type,
      token_address: process.env.NEXT_PUBLIC_USDT_ADDRESS!,
      token_decimals: 6
    }

    await insertOrder(order)

    return Response.json({
      code: 0,
      message: "ok",
      data: order
    })
  } catch (error) {
    console.error("Failed to create order:", error)
    return Response.json({
      code: -1,
      message: "Failed to create order"
    })
  }
}