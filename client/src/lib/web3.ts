import { createWeb3Modal } from '@web3modal/wagmi'
import { configureChains, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'viem/chains'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

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

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, sepolia],
  [publicProvider()]
)

// Create wagmi config with connectors
export const config = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        metadata,
        showQrModal: false
      }
    }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      }
    })
  ],
  publicClient,
  webSocketPublicClient
})

try {
  // Initialize web3modal
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    chains,
    defaultChain: mainnet,
    themeMode: 'light'
  })
} catch (error) {
  console.error('Failed to initialize Web3Modal:', error)
  throw error // Re-throw to prevent silent failures
}