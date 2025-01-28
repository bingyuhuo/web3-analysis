import { getUserCredits } from "@/service/order";
import { insertUser } from "@/models/user";


export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address) {
      return Response.json({
        code: -1,
        message: "Wallet not connected"
      });
    }

    try {
      const userData = {
        user_address: address,
        nickname: `User_${address.slice(0, 6)}`,
        avatar_url: '',
      };
      await insertUser(userData);
    } catch (err) {
      // 继续执行
    }

    const user_credits = await getUserCredits(address);

    return Response.json({
      code: 0,
      message: "ok",
      data: {
        credits: user_credits,
      },
    });
  } catch (error) {
    return Response.json({
      code: -1,
      message: "Failed to process user information",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
