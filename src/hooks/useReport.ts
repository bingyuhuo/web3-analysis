import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Report } from '@/types/report';
import { UserCredits } from '@/types/user';
import { fetchReport, fetchUserCredits, checkUserAccess } from '@/services/api';

export function useReport() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { isConnected, address } = useAccount();

  // 获取报告数据
  useEffect(() => {
    const loadReport = async () => {
      if (!params.id) return;
      try {
        const data = await fetchReport(params.id as string);
        setReport(data);
      } catch (error) {
        console.error("Failed to fetch report details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [params.id]);

  // 获取用户积分
  useEffect(() => {
    const loadCredits = async () => {
      if (!address) return;
      try {
        const data = await fetchUserCredits(address);
        setCredits(data);
      } catch (error) {
        setCredits(null);
      }
    };

    if (isConnected && address) {
      loadCredits();
    }
  }, [isConnected, address]);

  // 检查用户访问权限
  useEffect(() => {
    const verifyAccess = async () => {
      if (!address || !report) return;
      
      if (report.user_address === address) {
        setHasPaid(true);
        return;
      }

      try {
        if (!report.id) return;
        const hasAccess = await checkUserAccess(address, report.id);
        setHasPaid(hasAccess);
      } catch (error) {
        setHasPaid(false);
      }
    };

    verifyAccess();
  }, [address, report]);

  return {
    report,
    loading,
    credits,
    hasPaid,
    isPaying,
    setIsPaying,
    showWalletModal,
    setShowWalletModal
  };
} 