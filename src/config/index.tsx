import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { polygon } from '@reown/appkit/networks'
import { injected } from 'wagmi/connectors'

export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID 

if (!projectId) {
  throw new Error('WalletConnect Project ID is required')
}

// 创建连接器 - 只支持 MetaMask
export const connectors = [
  injected({ 
    target: 'metaMask',
    shimDisconnect: true
  })
]

// 创建 wagmi 适配器
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  networks: [polygon],
  connectors
})

export const config = wagmiAdapter.wagmiConfig