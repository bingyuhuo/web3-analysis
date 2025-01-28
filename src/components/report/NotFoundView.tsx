import React from 'react';

export function NotFoundView() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] flex items-center justify-center">
      <div className="text-center text-gray-300">
        <h1 className="text-3xl font-bold mb-4">Report Not Found</h1>
        <p>The report you are looking for does not exist.</p>
      </div>
    </div>
  );
} 