import React from 'react';
import { Report } from '@/types/report';
import { UserCredits } from '@/types/user';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { processPayment } from '@/services/api';
import InsufficientCredits from './InsufficientCredits';
import PaymentButton from './PaymentButton';

interface PaymentSectionProps {
  report: Report;
  credits: UserCredits | null;
  hasPaid: boolean;
  isConnected: boolean;
  address: string | undefined;
  isPaying: boolean;
  setIsPaying: (value: boolean) => void;
  router: AppRouterInstance;
}

export default function PaymentSection({
  report,
  credits,
  hasPaid,
  isConnected,
  address,
  isPaying,
  setIsPaying,
  router
}: PaymentSectionProps) {
  const handlePayment = async () => {
    if (!report.id) return;

    try {
      setIsPaying(true);
      const result = await processPayment(address!, report.id);
      if (result.success) {
        window.location.reload();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert('Payment failed. If points have been deducted, please contact support');
    } finally {
      setIsPaying(false);
    }
  };

  if (!isConnected || !address || hasPaid || report.user_address === address) {
    return null;
  }

  return (
    <div className="text-center p-8 glass-effect rounded-xl">
      {(credits?.left_credits ?? 0) < 5 ? (
        <InsufficientCredits router={router} />
      ) : (
        <PaymentButton 
          credits={credits} 
          isPaying={isPaying} 
          onPayment={handlePayment} 
        />
      )}
    </div>
  );
} 