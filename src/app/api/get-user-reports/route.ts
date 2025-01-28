import { getDb } from '@/models/db';

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    
    if (!address) {
      return Response.json({
        code: -1,
        message: "Address cannot be empty"
      });
    }

    const db = getDb();
    const result = await db.query(
      `SELECT DISTINCT r.* 
       FROM reports r
       JOIN user_reports ur ON r.id = ur.report_id
       WHERE ur.user_address = $1
       ORDER BY r.created_at DESC`,
      [address]
    );

    return Response.json({
      code: 0,
      data: result.rows
    });
  } catch (error) {
    console.error('Failed to get reports:', error);
    return Response.json({
      code: -1,
      message: "Failed to get reports"
    });
  }
} 