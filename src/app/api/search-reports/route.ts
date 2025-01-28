import { getDb } from '@/models/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('searchTerm')?.toLowerCase();
    
    if (!searchTerm) {
      return NextResponse.json({
        code: -1,
        message: "Search term is required",
        data: []
      });
    }

    const db = getDb();
    const result = await db.query(
      `SELECT id, 
        project_name as "projectName", 
        image_url as "image_url",
        created_at as "created_at" 
       FROM reports 
       WHERE LOWER(project_name) LIKE LOWER($1)  
       ORDER BY created_at DESC 
       LIMIT 10`,
      [`%${searchTerm}%`]
    );

    return NextResponse.json({
      code: 0,
      message: "success",
      data: result.rows
    });

  } catch (error) {
    return NextResponse.json({
      code: -1,
      message: error instanceof Error ? error.message : "Search failed",
      data: []
    });
  }
} 