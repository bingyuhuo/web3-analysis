"use client";
import React from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ReportNav from '@/components/report-nav';
import WalletModal from "@/components/wallet-modal";
import {
  PaymentSection,
  ReportContent,
  LoadingView,
  NotFoundView
} from '@/components/report';
import { useReport } from "@/hooks/useReport";
import { sections } from "@/constants/reportSections";

export default function ReportDetail() {
  const { report, loading, credits, hasPaid, isPaying, setIsPaying, showWalletModal, setShowWalletModal } = useReport();
  const { isConnected, address } = useAccount();
  const router = useRouter();

  if (loading) {
    return <LoadingView />;
  }

  if (!report) {
    return <NotFoundView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-gray-100">
      <Header />
      <main className="pt-16 pb-8">
        <div className="w-full px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <ReportNav report={report} sections={sections} />
            </div>

            <div className="md:col-span-3">
              <ReportContent 
                report={report} 
                isConnected={isConnected}
                address={address}
                hasPaid={hasPaid}
              />
              
              <PaymentSection 
                report={report}
                credits={credits}
                hasPaid={hasPaid}
                isConnected={isConnected}
                address={address}
                isPaying={isPaying}
                setIsPaying={setIsPaying}
                router={router}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </div>
  );
}

