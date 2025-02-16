import { getReports } from "@/models/report";

export default async function sitemap() {
  const reports = await getReports();
  const baseUrl = 'https://web3analysis.xyz';
  const currentDate = new Date().toISOString();

  // 基础页面
  const routes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/report`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // 报告详情页
  const reportUrls = reports.map(report => ({
    url: `${baseUrl}/report/${report.id}`,
    lastModified: new Date(report.created_at).toISOString(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...routes, ...reportUrls];
} 