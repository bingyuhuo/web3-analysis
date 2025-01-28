import { getReports } from "@/models/report";

export async function GET(req: Request) {
  try {
    const reports = await getReports();
    
    return Response.json({
      code: 0,
      message: "ok",
      data: reports
    });
  } catch (error) {
    console.error("Get reports failed:", error);
    return Response.json({
      code: -1,
      message: "Get reports failed",
      error: error
    });
  }
}
