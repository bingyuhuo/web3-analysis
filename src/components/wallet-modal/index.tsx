import { Dialog } from '@headlessui/react'
import Image from 'next/image'
import { useConnect, useAccount } from 'wagmi'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connect, connectors } = useConnect()
  const { address } = useAccount()
  
  const handleWalletConnect = async (connector: any) => {
    try {
      console.log('Start connecting...', connector)
      
      // 检查 MetaMask 是否安装
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask first')
        window.open('https://metamask.io/download/', '_blank')
        return
      }
      
      // 1. 连接钱包
      await connect({ connector })
      
      // 2. 验证连接状态
      if (address) {
        console.log('Connected with address:', address)
        // 3. 连接成功后关闭弹窗
        onClose()
      }

    } catch (error) {
      console.error('Connection failed:', error)
      alert('Connection failed: ' + (error as Error).message)
    }
  }

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '/images/wallets/metamask.svg',
      downloadUrl: 'https://metamask.io/download/',
      check: () => {
        const provider = (window as any).ethereum
        const isInstalled = provider?.isMetaMask && !provider?.isOKX
        console.log('MetaMask check:', { isInstalled, provider })
        return isInstalled
      },
      onClick: async () => {
        try {
          console.log('Clicking MetaMask connect...')
          
          // 使用 injected 连接器
          const connector = connectors.find(c => c.id === 'injected')
          console.log('Found connector:', connector)
          
          if (!connector) {
            throw new Error('Connector not found')
          }
          
          await handleWalletConnect(connector)
        } catch (error) {
          console.error('MetaMask connection failed:', error)
          alert('Connection failed: ' + (error as Error).message)
        }
      }
    }
  ]

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-[#0D1117] border border-[#30363D] p-6 shadow-2xl">
          <Dialog.Title className="text-2xl font-bold mb-6 text-purple-400">
            Select Wallet
          </Dialog.Title>
          <div className="space-y-4">
            {wallets.map(wallet => (
              <button
                key={wallet.id}
                onClick={wallet.onClick}
                className="w-full flex items-center justify-between p-4 rounded-xl
                         border border-[#30363D] bg-[#161B22] 
                         hover:bg-[#1C2128] hover:border-[#6E7681] 
                         transition-all duration-200 ease-in-out"
              >
                <span className="font-medium text-gray-200">{wallet.name}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">Click to connect</span>
                  <div className="w-8 h-8">
                    <Image 
                      src={wallet.icon} 
                      alt={wallet.name} 
                      width={32}
                      height={32}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 