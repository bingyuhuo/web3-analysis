import { Report } from '@/types/report';
import { formatDate } from '@/utils/date';

interface ReportNavProps {
  report: Report;
  sections: {
    id: string;
    title: string;
    subsections?: { id: string; title: string; }[];
  }[];
}

export default function ReportNav({ report, sections }: ReportNavProps) {
  return (
    <div className="fixed top-20 w-[calc(25%-2rem)] max-w-xs">
      <div className="glass-effect rounded-xl p-6">
        {/* 导航菜单 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Directory Navigation
          </h3>
          <nav className="space-y-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block text-gray-300 hover:text-white transition-colors py-1.5"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>

        {/* 基本信息 */}
        <div className="border-t border-white/10 pt-4">
          <div className="space-y-2 text-sm text-gray-400">
            <p className="flex items-center space-x-2">
              <span className="text-purple-400">Generated time:</span>
              <span>{formatDate(report.created_at)}</span>
            </p>
            <p className="flex items-center space-x-2">
              <span className="text-purple-400">Creator:</span>
              <span className="font-mono">
                {report?.user_address ? `${report.user_address.slice(0,6)}...${report.user_address.slice(-4)}` : 'Unknown'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 