import React from 'react';
import { Report } from '@/types/report';

interface ReportSectionProps {
  section: {
    id: string;
    title: string;
    subsections?: { id: string; title: string; }[];
  };
  report: Report;
}

export default function ReportSection({ section, report }: ReportSectionProps) {
  // 社交链接的特殊处理
  if (section.id === 'socialLinks') {
    return (
      <div id={section.id} className="space-y-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          {section.title}
        </h2>
        
        <div className="glass-effect rounded-xl p-6">
          <div className="space-y-2">
            {report.content && 
              typeof report.content === 'object' && 
              (report.content as any).socialLinks && 
              Object.entries((report.content as any).socialLinks)
                // 只保留有效的链接（不为空且不为N/A）
                .filter(([_, value]) => value && value !== 'N/A' && value !== '')
                .map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="capitalize min-w-20 text-gray-300">{key}:</span>
                    <a
                      href={value as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors break-all"
                    >
                      {value as string}
                    </a>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    );
  }

  // 其他章节的正常显示
  return (
    <div id={section.id} className="space-y-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        {section.title}
      </h2>
      
      {section.subsections?.map(subsection => (
        <div key={subsection.id} id={subsection.id} className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {subsection.title}
          </h3>
          <div className="space-y-4 text-gray-300">
            {report.content && typeof report.content === 'object' && 
              (report.content as any)[section.id]?.[subsection.id]}
          </div>
        </div>
      ))}
    </div>
  );
} 