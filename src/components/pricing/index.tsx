"use client";

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi'
import { parseUnits } from 'ethers'
import { polygon } from 'viem/chains'
import { USDT_ABI } from '@/config/contracts'
import { useRouter } from 'next/navigation'

export default function Pricing() {
  const { address } = useAccount()
  const [isProcessing, setIsProcessing] = useState(false)
  const [loading, setLoading] = useState({
    approve: false,
    transfer: false
  })
  const chainId = useChainId()
  const router = useRouter()

  const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`
  const RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_RECEIVER_ADDRESS as `0x${string}`

  // 检查授权
  const { data: allowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'allowance',
    args: [address, RECEIVER_ADDRESS]
  })

  // 检查余额
  const { data: balance } = useReadContract({
    address: USDT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [address]
  })

  const { writeContractAsync: approve } = useWriteContract()
  const { writeContractAsync: transfer } = useWriteContract()

  const handlePurchase = async (plan_type: string, amount: number, credits: number) => {
    // 如果已经在处理中，直接返回
    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);

      if (!address) {
        alert('Please connect your wallet first!');
        return;
      }

      // 检查网络
      if (chainId !== polygon.id) {
        alert('Please switch to the Polygon network and try again.');
        return;
      }

      // 先检查余额
      if (!balance || BigInt(balance.toString()) < parseUnits(amount.toString(), 6)) {
        alert('USDT balance is insufficient');
        return;
      }

      // 创建订单
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: plan_type,
          user_address: address,
          amount: amount.toString(),
          credits: credits,
        }),
      });

      const orderData = await createOrderRes.json();
      if (orderData.code !== 0) {
        alert(orderData.message || 'Failed to create order!');
        return;
      }

      // 检查授权
      if (!allowance || BigInt(allowance.toString()) < parseUnits(amount.toString(), 6)) {
        setLoading({ ...loading, approve: true });
        try {
          await approve({
            address: USDT_ADDRESS,
            abi: USDT_ABI,
            functionName: 'approve',
            args: [RECEIVER_ADDRESS, parseUnits(amount.toString(), 6)]
          });
          
        } catch (error: any) {
          if (error.message.includes('User rejected') || error.message.includes('User denied')) {
            console.log('User canceled the authorization');
          } else {
            console.error('Authorization failed:', error);
            alert('Authorization failed, please try again.');
          }
          return;
        } finally {
          setLoading({ ...loading, approve: false });
        }
      }

      // 授权成功后或已经授权的情况下，执行转账
      await handleTransfer(amount, orderData);

    } catch (error: any) {
      if (error.message.includes('User rejected') || error.message.includes('User denied')) {
        console.log('User canceled the payment');
      } else {
        console.error('Payment failed:', error);
        alert('Payment failed, please try again.');
      }
    } finally {
      setLoading({ ...loading, transfer: false });
      setIsProcessing(false);
    }
  }
  
  // 修改转账处理函数
  const handleTransfer = async (amount: number, orderData: any) => {
    try {
      setLoading({ ...loading, transfer: true });
      
      // 1. 执行转账
      const hash = await transfer({
        address: USDT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'transfer',
        args: [RECEIVER_ADDRESS, parseUnits(amount.toString(), 6)]
      }).catch((error) => {
        if (error.message.includes('User rejected') || error.message.includes('User denied')) {
          console.log('User canceled the payment');
          return null;
        }
        throw error;
      });

      // 如果用户取消了交易，直接返回
      if (!hash) {
        return;
      }

      // 2. 直接跳转到成功页面，让成功页面处理验证
      router.push(`/pay-success?tx=${hash}&order_no=${orderData.data.order_no}`);

    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Payment failed, please try again');
    } finally {
      setLoading({ ...loading, transfer: false });
    }
  }

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-5">
        <h2 className="text-center text-4xl font-bold mb-4">Purchase credits</h2>
        <p className="text-center text-gray-600 mb-2">Choose the credit plan that suits you, start using the Web3 project analysis tool</p>
        <p className="text-center text-sm text-yellow-600 mb-12">* Only Polygon network payments are supported</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* 月度计划 */}
          <div className="border rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-purple-600 mb-2">Monthly plan</h3>
              <div className="text-4xl font-bold mb-2">9.9USDT<span className="text-base font-normal text-gray-600">/month</span></div>
              <p className="text-gray-600 mb-6">Suitable for long-term users</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                1000 credits/month
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Automatically update credits every month
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Unused points will be cleared at the end of the month
              </li>
            </ul>
            
            <button
              onClick={() => handlePurchase('monthly', 9.9, 1000)}
              disabled={loading.approve || loading.transfer || chainId !== polygon.id || isProcessing}
              className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading.approve ? 'Authorizing...' : 
               loading.transfer ? 'Paying...' : 
               isProcessing ? 'Processing...' :
               chainId !== polygon.id ? 'Please switch to the Polygon network' :
               'Purchase now'}
            </button>
          </div>

          {/* 一次性计划 */}
          <div className="border rounded-2xl p-8 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-blue-600 mb-2">One-time plan</h3>
              <div className="text-4xl font-bold mb-2">9.9USDT</div>
              <p className="text-gray-600 mb-6">Suitable for temporary users</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                700 credits
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Effective for a long time
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Available at any time
              </li>
            </ul>
            
            <button
              onClick={() => handlePurchase('onetime', 9.9, 700)}
              disabled={loading.approve || loading.transfer || chainId !== polygon.id || isProcessing}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading.approve ? 'Authorizing...' : 
               loading.transfer ? 'Paying...' : 
               isProcessing ? 'Processing...' :
               chainId !== polygon.id ? 'Please switch to the Polygon network' :
               'Purchase now'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
