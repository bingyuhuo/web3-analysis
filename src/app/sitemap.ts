import { getReports } from "@/models/report";

export default async function sitemap() {
  const reports = await getReports();
  const baseUrl = 'https://web3analysis.xyz';

  // 基础页面的 URL
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/report`,
      lastModified: new Date(),
    },
  ];

  // 添加所有报告详情页的 URL
  const reportUrls = reports.map(report => ({
    url: `${baseUrl}/report/${report.id}`,
    lastModified: new Date(report.created_at),
  }));

  return [...routes, ...reportUrls];
} 