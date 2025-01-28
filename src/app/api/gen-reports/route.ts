import { insertReport } from "@/models/report"
import { getOpenAIClient } from "@/service/openai"
import { getDb } from "@/models/db"
import { Report } from "@/types/report"
import { generateProjectAnalysis } from "@/service/report-generator"
import { consumeUserCredits } from '@/models/order';
import { checkProjectAnalyzable } from "@/service/report-generator";
import { createClient } from '@supabase/supabase-js';

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
  
  const db = getDb();
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
  // 在函数开始处定义 headers
  const headers = new Headers({
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
  });

  try {
    const { projectName, address } = await req.json();
    
    // 1. 检查用户积分
    const db = getDb();
    const userCreditsQuery = await db.query(
      `SELECT credits as left_credits FROM user_credits WHERE user_address = $1`,
      [address]
    );

    if (!userCreditsQuery.rows[0] || userCreditsQuery.rows[0].left_credits < 10) {
      return Response.json({
        code: -1,
        message: "Insufficient points"
      }, { headers: headers });
    }

    console.log('用户积分:', userCreditsQuery.rows[0]); // 添加日志

    const client = getOpenAIClient();
    
    // 2. 检查项目可分析性
    try {
      const checkResult = await checkProjectAnalyzable(client, projectName);
      
      if (!checkResult.analyzable) {
        return Response.json({
          code: -2,
          message: checkResult.reason || "This item cannot be analyzed at the moment"
        }, { headers: headers });
      }
    } catch (error: any) {
      return Response.json({
        code: -2,
        message: error.message || "Project check failed"
      }, { headers: headers });
    }

    // 3. 生成报告内容
    let analysis;
    try {
      analysis = await retryOperation(() => generateProjectAnalysis(client, projectName));
      
      if (!analysis || analysis.error || !analysis.summary?.description) {
        return Response.json({
          code: -2,
          message: "Failed to generate report content"
        }, { headers: headers });
      }
    } catch (error: any) {
      return Response.json({
        code: -2,
        message: error.message || "Failed to generate report"
      }, { headers: headers });
    }

    try {
      // 4. 生成图片
      const imageResponse = await client.images.generate({
        model: "dall-e-3",
        prompt: analysis.summary.imageDescription + " in a professional business style, abstract, safe for work",
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      // 5. 保存图片
      const imageUrl = imageResponse.data[0].url;
      const savedImageUrl = imageUrl ? 
        await saveImage(imageUrl, sanitizeFileName(projectName)) : 
        '/placeholder.jpg';

      // 6. 保存报告
      const savedReport = await saveReportAndAddToUser(
        projectName, 
        {
          summary: analysis.summary.description,
          content: analysis
        }, 
        savedImageUrl, 
        address
      );

      // 7. 报告完全保存成功后才扣除积分
      await consumeUserCredits({
        user_address: address,
        amount: 10,
        type: 'generate',
        created_at: new Date().toISOString()
      });

      return new Response(JSON.stringify({
        code: 0,
        message: "ok",
        data: savedReport
      }), { headers: headers });
    } catch (error: any) {
      return Response.json({
        code: -1,
        message: "Failed to save report or deduct credits"
      }, { headers: headers });
    }

  } catch (error: any) {
    return Response.json({
      code: -1,
      message: error.message || "Failed to generate report"
    }, { headers });
  }
}

// 清理文件名的辅助函数
function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 200);
}

