import { getReportById } from "@/models/report";
import { Metadata } from 'next';

function generateStructuredData(report: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${report.projectName} Project Analysis Report`,
    description: report.summary,
    image: report.image_url,
    datePublished: report.created_at,
    author: {
      '@type': 'Organization',
      name: 'Web3 Project Analysis'
    }
  };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const report = await getReportById(parseInt(params.id));
    
    if (!report) {
      return {
        title: 'Project Not Found',
        description: 'The requested project analysis could not be found'
      };
    }

    const structuredData = generateStructuredData(report);

    return {
      title: `${report.projectName} Project Analysis | Web3 Research`,
      description: report.summary?.slice(0, 160),
      openGraph: {
        title: `${report.projectName} Project Analysis`,
        description: report.summary?.slice(0, 160),
        images: [report.image_url || '/og-image.jpg'],
      },
      // 添加结构化数据
      other: {
        'script:ld+json': JSON.stringify(structuredData),
      },
    };
  } catch (error) {
    return {
      title: 'Web3 Project Analysis',
      description: 'Detailed Web3 project analysis and research'
    };
  }
} 