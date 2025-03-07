import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { mainnet, sepolia } from 'viem/chains'
import { http } from 'viem'

// Get WalletConnect Project ID from environment variable
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error("Missing VITE_WALLETCONNECT_PROJECT_ID environment variable")
}

const metadata = {
  name: 'Web3 DApp',
  description: 'Web3 DApp Example',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Configure chains for the application
const chains = [mainnet, sepolia] as const

// Create wagmi config
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  }
})

// Initialize Web3Modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains
})