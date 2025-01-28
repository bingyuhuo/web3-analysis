import React from 'react';
import { useRouter } from 'next/navigation';

interface InsufficientCreditsProps {
  router: ReturnType<typeof useRouter>;
}

export default function InsufficientCredits({ router }: InsufficientCreditsProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Insufficient points, please purchase points first
      </h3>
      <button
        onClick={() => router.push('/pricing')}
        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold hover:opacity-90 transition-opacity"
      >
        Purchase Points
      </button>
    </div>
  );
} 