import { checkUserReport } from '@/models/order';

export async function POST(req: Request) {
  try {
    const { address, reportId } = await req.json();
    
    if (!address || !reportId) {
      return Response.json({
        code: -1,
        message: "Parameter error"
      });
    }

    const hasPurchased = await checkUserReport(address, reportId);

    return Response.json({
      code: 0,
      data: { has_purchased: hasPurchased }
    });
  } catch (error) {
    console.error('Check user reports failed:', error);
    return Response.json({
      code: -1,
      message: "Check failed"
    });
  }
} 