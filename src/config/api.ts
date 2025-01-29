// 获取 API 基础 URL
export const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://web3analysis.vercel.app'  // 替换为你的实际生产环境域名
  }
  return 'http://localhost:3000'
} 