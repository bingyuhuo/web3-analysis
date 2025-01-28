import { getDb } from "./db";
import { Report } from "@/types/report";

export async function insertReport(report: Report) {
  const db = getDb();
  
  // 确保 content 是 JSON 字符串
  const content = typeof report.content === 'string' 
    ? report.content 
    : JSON.stringify(report.content);


  const result = await db.query(
    `INSERT INTO reports (
      project_name, 
      summary,
      content, 
      image_url,
      created_at, 
      user_address
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      report.projectName,
      report.summary,
      content,  // 使用处理后的 content
      report.image_url,
      report.created_at,
      report.user_address
    ]
  );
  return result.rows[0];
}

export async function getReports(limit = 50): Promise<Report[]> {
  const db = await getDb();
  const res = await db.query(
    `SELECT * FROM reports 
     ORDER BY created_at DESC 
     LIMIT $1`,
    [limit]
  );

  return res.rows.map(row => ({
    id: row.id,
    projectName: row.project_name,
    summary: row.summary,
    content: row.content,
    image_url: row.image_url,
    user_address: row.user_address,
    created_at: row.created_at
  }));
}

const reportCache = new Map<number, { data: Report; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export async function getReportById(id: number): Promise<Report | null> {
  // 检查缓存
  const cached = reportCache.get(id);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const db = getDb();
  const result = await db.query(
    'SELECT * FROM reports WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }


  // 解析 content
  let content = result.rows[0].content;
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse content:', error);
    }
  }

  // 如果已经有 socialLinks，就不需要重构
  if (!content.socialLinks) {
    // 只有在没有 socialLinks 时才从 investmentAnalysis 中提取
    content = {
      ...content,
      socialLinks: {
        website: content?.investmentAnalysis?.website,
        docs: content?.investmentAnalysis?.docs,
        github: content?.investmentAnalysis?.github,
        telegram: content?.investmentAnalysis?.telegram,
        twitter: content?.investmentAnalysis?.twitter,
        discord: content?.investmentAnalysis?.discord
      }
    };
  }

  const report = {
    id: result.rows[0].id,
    projectName: result.rows[0].project_name,
    summary: result.rows[0].summary,
    content: content,
    image_url: result.rows[0].image_url,
    user_address: result.rows[0].user_address,
    created_at: result.rows[0].created_at
  };

  // 设置缓存
  reportCache.set(id, { data: report, timestamp: Date.now() });
  
  return report;
}
