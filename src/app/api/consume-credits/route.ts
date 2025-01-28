import { NextResponse } from 'next/server';
import { consumeUserCredits, checkUserReport } from '@/models/order';

export async function POST(req: Request) {
  try {
    const { address, reportId, type } = await req.json();
    
    if (!address || !type) {
      return NextResponse.json({ 
        code: -1, 
        message: 'Parameter error' 
      });
    }

    // 如果是查看报告，先检查是否已购买
    if (type === 'view' && reportId) {
      const hasReport = await checkUserReport(address, reportId);
      if (hasReport) {
        return NextResponse.json({ 
          code: 0, 
          message: 'This report has been purchased',
          data: { already_purchased: true }
        });
      }
    }

    // 设置消费积分数量
    const amount = type === 'view' ? 5 : 10;

    // 执行积分消费
    const leftCredits = await consumeUserCredits({
      user_address: address,
      amount,
      type,
      report_id: reportId,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ 
      code: 0, 
      message: 'success',
      data: { left_credits: leftCredits }
    });

  } catch (error: any) {
    console.error('Points consumption failed:', error);
    return NextResponse.json({ 
      code: -1, 
      message: error.message || 'Points consumption failed' 
    });
  }
} 