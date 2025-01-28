'use client'

import { wagmiAdapter, projectId, config } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit, useAppKit as useReownAppKit } from '@reown/appkit/react'
import { polygon } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { WagmiProvider, useAccount } from 'wagmi'

const queryClient = new QueryClient()

const metadata = {
  name: 'Web3 Analysis',
  description: 'Web3 project analysis tool',
  url: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://web3analysis.xyz',
  icons: ['/logo.png']
}

// 创建 AppKit 实例
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId!,
  networks: [polygon],
  defaultNetwork: polygon,
  metadata,
  features: {
    analytics: true
  }
})

// 添加 useAppKit hook
export function useAppKit() {
  return useReownAppKit()
}

// 添加 useAppKitAccount hook
export function useAppKitAccount() {
  const { address, isConnected } = useAccount()
  return { address, isConnected }
}

// 导出 ContextProvider 组件
export default function ContextProvider({ 
  children, 
  cookies 
}: { 
  children: ReactNode
  cookies?: string | null 
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
} 