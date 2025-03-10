import { createWeb3Modal } from '@web3modal/wagmi'
import { configureChains, createConfig } from 'wagmi'
import { mainnet, base } from 'viem/chains'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

// Get WalletConnect Project ID from environment variable
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.error("Missing VITE_WALLETCONNECT_PROJECT_ID environment variable")
  throw new Error("Missing VITE_WALLETCONNECT_PROJECT_ID environment variable")
}

console.log("Initializing Web3Modal with project ID:", projectId.slice(0, 4) + "...")

const metadata = {
  name: 'CPXTBMining',
  description: 'CPXTB Mining and Investment Platform',
  url: 'https://web3modal.com', // Will be updated with actual URL
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, base], 
  [publicProvider()]
)

// Create wagmi config
const config = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        metadata,
        showQrModal: false // Web3Modal handles QR modal
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

// Create web3Modal instance
const web3Modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  defaultChain: mainnet,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': 'hsl(var(--primary))',
    '--w3m-bg-color': 'hsl(var(--background))',
    '--w3m-color': 'hsl(var(--foreground))',
    '--w3m-z-index': 1000
  }
})

export { web3Modal, config }
