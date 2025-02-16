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
        title: 'Project Not Found | Web3 Analysis',
        description: 'The requested project analysis could not be found',
        robots: {
          index: false,
          follow: true,
        }
      };
    }

    const structuredData = generateStructuredData(report);
    const description = report.summary?.slice(0, 160).trim() + '...';

    return {
      title: `${report.projectName} Project Analysis | Web3 Research`,
      description: description,
      openGraph: {
        title: `${report.projectName} Project Analysis`,
        description: description,
        images: [report.image_url || '/og-image.jpg'],
        type: 'article',
        publishedTime: report.created_at,
        modifiedTime: report.created_at,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${report.projectName} Project Analysis`,
        description: description,
        images: [report.image_url || '/og-image.jpg'],
      },
      alternates: {
        canonical: `/report/${params.id}`,
      },
      other: {
        'script:ld+json': JSON.stringify(structuredData),
      },
    };
  } catch (error) {
    return {
      title: 'Web3 Project Analysis',
      description: 'Detailed Web3 project analysis and research',
      robots: {
        index: false,
        follow: true,
      }
    };
  }
} 