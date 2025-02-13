import { ReportProps } from '@/types/report'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/utils/api'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { formatShortDate } from '@/utils/date'

export default function ({ reports }: ReportProps) {
  
  const router = useRouter();
  const { address } = useAccount();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    if (address) {
      fetchUserCredits();
    }
  }, [address]);

  // 限制只显示最新的50份报告
  const limitedReports = reports.slice(0, 50);

  const handleReportClick = async (e: React.MouseEvent, reportId: number | undefined) => {
    e.preventDefault();
    
    if (reportId) {
      router.push(`/report/${reportId}`);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await fetchWithAuth('/api/get-user-credits', {
        method: 'POST',
        body: JSON.stringify({ address: address || '' })
      });

      const data = await response.json();
      
      if (data.code === 0) {
        setCredits(data.data);
      } else {
        console.error('Failed to fetch credits:', data.message);
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#0F172A] to-[#1E293B]">
      <section>
        <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-10 md:py-12">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold md:text-5xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
               Analysis Report List
            </h2> 
            <p className="mt-4 text-gray-400">
              {reports.length} reports generated, showing the latest 50
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {limitedReports.map((report) => (
              <div 
                key={report.id || report.created_at}
                onClick={(e) => handleReportClick(e, report.id)}
                className="block group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl backdrop-blur-md bg-white/5 border border-white/10 transition-all duration-300 hover:scale-105">
                  <img 
                    src={report.image_url || '/placeholder.jpg'} 
                    alt={report.projectName}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-white">{report.projectName}</h3>
                      <span className="text-sm text-gray-300">
                        {formatShortDate(report.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{report.summary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
