import { getReportById } from "@/models/report";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('Request ID:', id);

    if (!id) {
      return Response.json({
        code: -1,
        message: "Report ID missing"
      });
    }

    const report = await getReportById(parseInt(id));
    if (!report) {
      return Response.json({
        code: -1,
        message: "Report does not exist"
      });
    }

    return Response.json({
      code: 0,
      message: "ok",
      data: report
    });
  } catch (error) {
    return Response.json({
      code: -1,
      message: "Failed to get report details",
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 