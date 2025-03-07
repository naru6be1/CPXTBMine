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

// Configure chains & providers with error handling
let chains, publicClient, webSocketPublicClient;
try {
  const configured = configureChains(
    [mainnet, sepolia],
    [publicProvider()]
  );
  chains = configured.chains;
  publicClient = configured.publicClient;
  webSocketPublicClient = configured.webSocketPublicClient;
} catch (error) {
  console.error("Error configuring chains:", error);
  throw error;
}

// Create wagmi config
export const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
  connectors: [
    new InjectedConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        metadata
      }
    })
  ]
})

// Initialize modal after config creation with error handling
try {
  createWeb3Modal({ 
    wagmiConfig: config, 
    projectId, 
    chains,
    themeMode: 'light',
    themeVariables: {
      '--w3m-z-index': 1000
    }
  })
} catch (error) {
  console.error("Error initializing Web3Modal:", error);
  // Don't throw here to allow app to continue loading
}