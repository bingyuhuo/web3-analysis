"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';
import { Report } from '@/types/report';

export default function MyReports() {
  const params = useParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        if (!params.address) {
          console.error('Address parameter missing');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/get-user-reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: params.address }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get reports');
        }
        
        const { data } = await response.json();
        setReports(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to get reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReports();
  }, [params.address]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] flex flex-col">
      <Header />
      <div className="container mx-auto max-w-6xl px-4 pt-20 mb-8">
        <h1 className="text-3xl font-bold text-center relative">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent inline-block py-2 px-4">
            My Reports
          </span>
        </h1>
      </div>
      <main className="flex-1 px-4 container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link 
              href={`/report/${report.id}`} 
              key={report.id}
              className="block group"
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
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{report.summary}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
} 