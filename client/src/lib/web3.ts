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

// Configure chains & providers with error handling
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, base], 
  [
    publicProvider(),
  ],
  {
    pollingInterval: 5000,
    retryCount: 3,
    retryDelay: 1000,
  }
)

// Create wagmi config with detailed logging
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
  webSocketPublicClient,
  logger: {
    warn: (message) => console.warn(`[Web3 Warning]: ${message}`),
    error: (error) => {
      console.error(`[Web3 Error]: ${error instanceof Error ? error.message : error}`);
      // Add detailed error logging
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          cause: error.cause
        });
      }
    },
  }
});

// Log connection status
console.log("Web3 Configuration:", {
  chainIds: chains.map(c => c.id),
  connectors: config.connectors.map(c => c.name),
  autoConnect: config.autoConnect
});

// Create web3Modal instance with enhanced error handling
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

console.log("Web3Modal initialization completed")

export { web3Modal, config }