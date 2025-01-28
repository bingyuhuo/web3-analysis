import { getDb } from "./db";

export async function insertUser(userData: {
  user_address: string;
  nickname: string;
  avatar_url: string;
}) {
  const db = getDb();
  
  try {
    // 先检查用户是否存在
    const existingUser = await db.query(
      'SELECT user_address FROM users WHERE user_address = $1',
      [userData.user_address]
    );

    if (existingUser.rows.length === 0) {
      // 用户不存在，执行插入
      const result = await db.query(
        `INSERT INTO users (user_address, nickname, avatar_url, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_address) DO UPDATE
         SET nickname = $2, avatar_url = $3
         RETURNING *`,
        [userData.user_address, userData.nickname, userData.avatar_url]
      );
      return result.rows[0];
    } else {
      return existingUser.rows[0];
    }
  } catch (error) {
    throw error; // 抛出错误以便上层处理
  }
}
