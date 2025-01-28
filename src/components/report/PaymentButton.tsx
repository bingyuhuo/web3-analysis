import React from 'react';
import { UserCredits } from '@/types/user';

interface PaymentButtonProps {
  credits: UserCredits | null;
  isPaying: boolean;
  onPayment: () => void;
}

export default function PaymentButton({ credits, isPaying, onPayment }: PaymentButtonProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">
        Pay 5 points to view the full content
      </h3>
      <p className="text-gray-300 mb-6">
        Your current points balance: {credits?.left_credits ?? 0}
      </p>
      <button
        disabled={isPaying}
        onClick={onPayment}
        className={`px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-semibold transition-opacity ${
          isPaying ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        {isPaying ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Pay 5 points to view full content'
        )}
      </button>
    </div>
  );
} 