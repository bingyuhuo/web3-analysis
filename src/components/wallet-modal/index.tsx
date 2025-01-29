import Image from 'next/image'
import { useConnect, useAccount } from 'wagmi'
import { useEffect, useState } from 'react'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connectors } = useConnect()
  const { address } = useAccount()
  const [isConnecting, setIsConnecting] = useState(false)
  
  console.log('【WalletModal】Component rendering:', { 
    isOpen, 
    address,
    hasConnectors: connectors.length > 0,
    connectorIds: connectors.map(c => c.id)
  });

  // 只在连接成功后关闭模态框
  useEffect(() => {
    if (isConnecting && address) {
      console.log('【WalletModal】Connection successful, closing modal:', address)
      setIsConnecting(false)
      onClose()
    }
  }, [address, isConnecting, onClose])

  const handleWalletConnect = async (connector: any) => {
    try {
      setIsConnecting(true)
      
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask first')
        window.open('https://metamask.io/download/', '_blank')
        return
      }
      
      await connect({ 
        connector,
        chainId: 137 // Polygon network
      })

    } catch (error) {
      alert('Connection failed: ' + (error as Error).message)
      setIsConnecting(false)
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
            onClick={onClose}
          />
          
          {/* 模态框容器 - 使用 flex 实现居中 */}
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* 模态框内容 */}
            <div className="relative w-full max-w-sm rounded-2xl bg-[#0D1117] border border-[#30363D] p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-purple-400">
                Select Wallet
              </h2>
              
              <button
                onClick={async () => {
                  const connector = connectors.find(c => c.id === 'injected')
                  if (connector) {
                    await handleWalletConnect(connector)
                  }
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl
                         border border-[#30363D] bg-[#161B22] 
                         hover:bg-[#1C2128] hover:border-[#6E7681] 
                         transition-all duration-200 ease-in-out"
              >
                <span className="font-medium text-gray-200">MetaMask</span>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">Click to connect</span>
                  <Image 
                    src="/images/wallets/metamask.svg"
                    alt="MetaMask"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 