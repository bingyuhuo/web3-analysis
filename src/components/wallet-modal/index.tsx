import { Dialog } from '@headlessui/react'
import Image from 'next/image'
import { useConnect, useAccount } from 'wagmi'
import { useEffect } from 'react'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connectors } = useConnect()
  const { address } = useAccount()
  
  // 添加调试日志
  console.log('WalletModal render:', { isOpen, address })

  // 监听地址变化，当地址存在时关闭模态框
  useEffect(() => {
    if (address) {
      console.log('Address detected, closing modal:', address)
      onClose()
    }
  }, [address, onClose])

  const handleWalletConnect = async (connector: any) => {
    try {
      console.log('Start connecting...', connector)
      
      // 检查 MetaMask 是否安装
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask first')
        window.open('https://metamask.io/download/', '_blank')
        return
      }
      
      // 连接钱包
      await connect({ connector })

    } catch (error) {
      console.error('Connection failed:', error)
      alert('Connection failed: ' + (error as Error).message)
    }
  }

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-[#0D1117] border border-[#30363D] p-6 shadow-2xl">
          <Dialog.Title className="text-2xl font-bold mb-6 text-purple-400">
            Select Wallet
          </Dialog.Title>
          <div className="space-y-4">
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 