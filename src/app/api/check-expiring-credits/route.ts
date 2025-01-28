import { checkExpiringCredits } from "@/models/order";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    const expiringInfo = await checkExpiringCredits(address);
    
    return NextResponse.json({
      code: 0,
      data: expiringInfo
    });
  } catch (error) {
    return NextResponse.json({
      code: -1,
      message: "Failed to check expiring credits"
    });
  }
} 