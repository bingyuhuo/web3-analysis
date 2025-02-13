import { insertReport } from "@/models/report"
import { getOpenAIClient } from "@/service/openai"
import { getDb } from "@/models/db"
import { Report } from "@/types/report"
import { generateProjectAnalysis } from "@/service/report-generator"
import { consumeUserCredits } from '@/models/order';
import { checkProjectAnalyzable } from "@/service/report-generator";
import { createClient } from '@supabase/supabase-js';

// 使用 getDb() 获取数据库实例
const db = getDb();

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

// 添加请求缓存 Map
const recentRequests = new Map<string, number>();
const REQUEST_TIMEOUT = 5 * 60 * 1000; // 5分钟超时

const pendingRequests = new Map<string, {
  timestamp: number;
  projectName: string;
  address: string;
}>();

// 修改保存图片函数
async function saveImage(url: string, projectName: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const fileName = `${Date.now()}-${sanitizeFileName(projectName)}.png`;
  
  try {
    const { error } = await supabase
      .storage
      .from('reports')
      .upload(fileName, buffer, {
        contentType: 'image/png'
      });

    if (error) {
      throw error;
    }
    
    const { data: { publicUrl } } = supabase
      .storage
      .from('reports')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    throw error;
  }
}

// 添加重试函数
async function retryOperation(operation: () => Promise<any>, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.name === 'ProjectNotAnalyzableError') {
        throw error;
      }
      
      if (attempt === maxAttempts) throw error;
      
      const waitTime = 2000 * attempt;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// 保存报告和扣除积分的函数
async function saveReportAndAddToUser(
  projectName: string, 
  fullContent: any, 
  savedImageUrl: string, 
  address: string
) {
  const report: Omit<Report, 'id'> = {
    projectName,
    summary: fullContent.summary,
    content: fullContent.content,
    image_url: savedImageUrl,
    created_at: new Date().toISOString(),
    user_address: address 
  };

  const savedReport = await insertReport(report);
  
  await db.query(
    `INSERT INTO user_reports (
      user_address, report_id, created_at
    ) VALUES ($1, $2, $3)
    ON CONFLICT (user_address, report_id) DO NOTHING`,
    [address, savedReport.id, new Date().toISOString()]
  );

  return savedReport;
}

export async function POST(req: Request) {
  const { projectName, address } = await req.json();
  
  try {
    // 1. 检查用户自己最近5分钟内是否已经生成过这个项目的报告
    const existingReport = await db.query(`
      SELECT r.* 
      FROM reports r
      WHERE r.project_name = $1 
      AND r.user_address = $2
      AND r.created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY r.created_at DESC
      LIMIT 1
    `, [projectName, address]);

    if (existingReport.rows.length > 0) {
      // 如果用户最近已生成过该报告，直接返回
      return Response.json({
        code: 0,
        data: existingReport.rows[0]
      });
    }

    // 2. 检查是否有正在处理的请求
    const pendingRequest = await db.query(`
      SELECT * FROM report_requests 
      WHERE project_name = $1 
      AND wallet_address = $2 
      AND status = 'pending'
      AND created_at > NOW() - INTERVAL '5 minutes'
    `, [projectName, address]);

    if (pendingRequest.rows.length > 0) {
      return Response.json({
        code: 1,
        message: "Your report is being generated, please wait...",
        data: {
          requestId: pendingRequest.rows[0].id,
          status: 'pending'
        }
      });
    }

    // 3. 创建新的请求记录
    const newRequest = await db.query(`
      INSERT INTO report_requests (project_name, wallet_address, status)
      VALUES ($1, $2, 'pending')
      RETURNING id
    `, [projectName, address]);

    // 4. 检查用户积分
    const userCreditsQuery = await db.query(
      `SELECT credits as left_credits FROM user_credits WHERE user_address = $1`,
      [address]
    );

    if (!userCreditsQuery.rows[0] || userCreditsQuery.rows[0].left_credits < 10) {
      // 如果积分不足，更新请求状态为失败
      await db.query(`
        UPDATE report_requests 
        SET status = 'failed', 
            updated_at = NOW() 
        WHERE id = $1
      `, [newRequest.rows[0].id]);

      return Response.json({
        code: -1,
        message: "Insufficient points"
      });
    }

    console.log('用户积分:', userCreditsQuery.rows[0]); // 添加日志

    const client = getOpenAIClient();
    
    // 5. 检查项目可分析性
    try {
      const checkResult = await checkProjectAnalyzable(client, projectName);
      
      if (!checkResult.analyzable) {
        return Response.json({
          code: -2,
          message: checkResult.reason || "This item cannot be analyzed at the moment"
        });
      }
    } catch (error: any) {
      return Response.json({
        code: -2,
        message: error.message || "Project check failed"
      });
    }

    // 6. 生成报告内容
    let analysis;
    try {
      analysis = await retryOperation(() => generateProjectAnalysis(client, projectName));
      
      if (!analysis || analysis.error || !analysis.summary?.description) {
        return Response.json({
          code: -2,
          message: "Failed to generate report content"
        });
      }
    } catch (error: any) {
      return Response.json({
        code: -2,
        message: error.message || "Failed to generate report"
      });
    }

    try {
      // 7. 生成图片
      const imageResponse = await client.images.generate({
        model: "dall-e-3",
        prompt: analysis.summary.imageDescription + " in a professional business style, abstract, safe for work",
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      // 8. 保存图片
      const imageUrl = imageResponse.data[0].url;
      const savedImageUrl = imageUrl ? 
        await saveImage(imageUrl, sanitizeFileName(projectName)) : 
        '/placeholder.jpg';

      // 9. 保存报告
      const savedReport = await saveReportAndAddToUser(
        projectName, 
        {
          summary: analysis.summary.description,
          content: analysis
        }, 
        savedImageUrl, 
        address
      );

      // 10. 报告完全保存成功后才扣除积分
      await consumeUserCredits({
        user_address: address,
        amount: 10,
        type: 'generate',
        created_at: new Date().toISOString()
      });

      // 更新请求状态
      await db.query(`
        UPDATE report_requests 
        SET status = 'completed', updated_at = NOW()
        WHERE id = $1
      `, [newRequest.rows[0].id]);

      return Response.json({
        code: 0,
        data: savedReport
      });
    } catch (error: any) {
      // 更新请求状态为失败
      await db.query(`
        UPDATE report_requests 
        SET status = 'failed', updated_at = NOW()
        WHERE id = $1
      `, [newRequest.rows[0].id]);

      return Response.json({
        code: -1,
        message: "Failed to save report or deduct credits"
      });
    }

  } catch (error: any) {
    console.error('Error generating report:', error);
    return Response.json({
      code: -1,
      message: "Failed to generate report"
    });
  }
}

// 清理文件名的辅助函数
function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 200);
}

