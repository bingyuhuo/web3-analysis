"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaySuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const txHash = searchParams.get('tx');
  const orderNo = searchParams.get('order_no');
  const [countdown, setCountdown] = useState(5);
  const [status, setStatus] = useState('Processing');

  useEffect(() => {
    // 使用变量来跟踪组件是否已卸载
    let isSubscribed = true;

    if (!txHash || !orderNo) {
      // 使用 setTimeout 来避免渲染时的路由更新
      setTimeout(() => {
        if (isSubscribed) {
          router.push('/');
        }
      }, 0);
      return;
    }

    let timer: NodeJS.Timeout;

    // 处理订单
    const processOrder = async () => {
      try {
        // 添加重试机制
        let retries = 3;
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
            // 开始倒计时
            timer = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer);
                  router.push('/');
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            break;
          }

          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        if (!success) {
          setStatus('Order processing failed');
          setTimeout(() => router.push('/'), 3000);
        }

      } catch (error) {
        console.error('Failed to process order:', error);
        setStatus('Order processing error');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    processOrder();

    // 清理函数
    return () => {
      isSubscribed = false;
      if (timer) clearInterval(timer);
    };
  }, [txHash, orderNo, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{status}</h1>
      <div className="flex flex-col items-center space-y-2">
        <p className="text-gray-600">Transaction Hash:</p>
        <a 
          href={`https://polygonscan.com/tx/${txHash}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-500 hover:text-purple-700 break-all max-w-md text-center"
        >
          {txHash}
        </a>
      </div>
      <p className="text-gray-600 mt-4">{countdown} seconds to redirect...</p>
    </div>
  );
}

