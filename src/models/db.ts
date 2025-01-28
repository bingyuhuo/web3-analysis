import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined");
    }

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 30000,
      query_timeout: 30000,
      max: 10,
      idleTimeoutMillis: 60000
    });

    // 添加连接错误监听
    pool.on('error', () => {
      pool = null;
    });

    // 测试连接
    pool.connect((err, client, release) => {
      if (err) {
        pool = null;
      } else {
        release();
      }
    });

    // 定期心跳检查
    setInterval(() => {
      pool?.query('SELECT 1').catch(() => {
        pool = null;
      });
    }, 30000);
  }
  return pool;
}

// 测试连接函数
export async function testConnection() {
  try {
    const db = getDb();
    const result = await db.query('SELECT NOW()');
    
    const tableTest = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    return true;
  } catch (error) {
    return false;
  }
}

// 立即测试连接
testConnection();
