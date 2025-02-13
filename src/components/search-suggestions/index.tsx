import { useState, useEffect } from 'react';
import { Report } from '@/types/report';
import Image from 'next/image';

interface Props {
  searchTerm: string;
  onSelect: (report: Report) => void;
}

export default function SearchSuggestions({ searchTerm, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm || searchTerm.length < 2) {  // 至少输入2个字符才开始搜索
        setSuggestions([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search-reports?searchTerm=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code === 0) {
          setSuggestions(data.data || []);
        } else {
          throw new Error(data.message || 'search failed');
        }
      } catch (error) {
        console.error('search failed:', error);
        setError(error instanceof Error ? error.message : 'search failed');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  if (!searchTerm) return null;

  return (
    <div className="absolute w-full bg-white/5 backdrop-blur-lg rounded-lg mt-1 shadow-lg overflow-hidden z-10">
      {loading ? (
        <div className="p-4 text-gray-400">Searching...</div>
      ) : error ? (
        <div className="p-4 text-red-400">{error}</div>
      ) : suggestions.length > 0 ? (
        <ul>
          {suggestions.map((report) => (
            <li
              key={report.id}
              onClick={() => onSelect(report)}
              className="px-4 py-2 hover:bg-white/10 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-grow">
                  <div className="relative w-8 h-8 flex-shrink-0">
                    {report.image_url ? (
                      <Image
                        src={report.image_url}
                        alt={`${report.projectName} project logo`}
                        fill
                        sizes="32px"
                        className="object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.png';
                        }}
                      />
                    ) : (
                      <Image
                        src="/placeholder.png"
                        alt="Project placeholder"
                        fill
                        sizes="32px"
                        className="object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="font-medium">{report.projectName}</div>
                </div>
                <div className="text-sm text-gray-400 ml-4">
                  {new Date(report.created_at).toLocaleDateString('en-US')}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : searchTerm.length >= 2 ? (
        <div className="p-4 text-gray-400">
          <p>No reports found for "{searchTerm}"</p>
          <p className="mt-1 text-purple-400">👉 Click the "Generate Analysis Report" button to create a new report!</p>
        </div>
      ) : null}
    </div>
  );
} 