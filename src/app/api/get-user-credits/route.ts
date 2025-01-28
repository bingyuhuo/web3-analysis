import { calculateUserCredits } from "@/service/order";
import { getUserOrders } from "@/models/order";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    if (!body) {
      return Response.json({
        code: -1,
        message: 'Request body is empty'
      });
    }

    const { address } = JSON.parse(body);
    
    if (!address) {
      return Response.json({
        code: -1,
        message: 'Address is required'
      });
    }

    const orders = await getUserOrders(address);
    const credits = await calculateUserCredits(orders || [], address);
    
    return NextResponse.json({
      code: 0,
      data: credits,
      message: "success"
    });

  } catch (error) {
    return NextResponse.json({
      code: -1,
      message: error instanceof Error ? error.message : 'Failed to get credits'
    });
  }
} 