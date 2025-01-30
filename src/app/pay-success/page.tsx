"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaySuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing...');
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    const txHash = searchParams.get('tx');
    const orderNo = searchParams.get('order_no');

    if (!txHash || !orderNo) {
      // 使用 setTimeout 避免在渲染时导航
      setTimeout(() => {
        router.push('/');
      }, 0);
      return;
    }

    const processOrder = async () => {
      try {
        let retries = 5;
        let success = false;

        while (retries > 0 && !success) {
          const response = await fetch('/api/verify-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction_hash: txHash, order_no: orderNo }),
          });

          const data = await response.json();
          
          if (data.code === 0) {
            success = true;
            setStatus('Payment successful!');
            break;
          }

          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        if (!success) {
          setStatus('Order processing failed, please try again');
        }
      } catch (error) {
        console.error('Order processing failed:', error);
        setStatus('Order processing failed, please try again');
      }
    };

    processOrder();

    // 单独处理倒计时和导航
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 使用 setTimeout 避免在渲染时导航
          setTimeout(() => {
            router.push('/');
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{status}</h1>
      <p> Return to homepage after {countdown} seconds...</p>
    </div>
  );
}

