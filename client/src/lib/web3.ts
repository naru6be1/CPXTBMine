import { createWeb3Modal } from '@web3modal/wagmi'
import { configureChains, createConfig } from 'wagmi'
import { sepolia } from 'viem/chains'
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
  name: 'CPXTB Mining DApp',
  description: 'CPXTB Mining and Investment Platform',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Configure chains & providers - Only using Sepolia for testing
export const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia],
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

// Create web3Modal instance
const web3Modal = createWeb3Modal({
  wagmiConfig: config,
  projectId,
  chains,
  defaultChain: sepolia,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': 'hsl(var(--primary))',
    '--w3m-background': 'hsl(var(--background))',
    '--w3m-text-color': 'hsl(var(--foreground))',
    '--w3m-z-index': '1000'
  }
})

export { web3Modal, config }