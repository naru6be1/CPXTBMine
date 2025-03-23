import { createWeb3Modal } from '@web3modal/wagmi'
import { configureChains, createConfig } from 'wagmi'
import { mainnet } from 'viem/chains'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  console.error("Missing VITE_WALLETCONNECT_PROJECT_ID environment variable")
  throw new Error("Missing VITE_WALLETCONNECT_PROJECT_ID environment variable")
}

console.log("Initializing Web3Modal with enhanced error handling")

const metadata = {
  name: 'CPXTBMining',
  description: 'CPXTB Mining and Investment Platform',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Configure chains with full provider options
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: 'https://eth.llamarpc.com',
        webSocket: 'wss://eth.llamarpc.com/ws',
      }),
      priority: 1,
      stallTimeout: 3000,
      pollingInterval: 4000,
    }),
    jsonRpcProvider({
      rpc: () => ({
        http: 'https://cloudflare-eth.com',
      }),
      priority: 2,
      stallTimeout: 3000,
    }),
    publicProvider(),
  ],
  {
    pollingInterval: 4000,
    retryCount: 5,
    retryDelay: 1000,
    stallTimeout: 5000,
    batch: {
      multicall: true,
      batchSize: 1024,
      wait: 16,
    }
  }
);

// Updated config with enhanced error handling
const config = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        metadata,
        showQrModal: false,
        relayUrl: 'wss://relay.walletconnect.org',
        retryCount: 3,
        timeout: 10000,
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
      console.error('[Web3 Error]:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }
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
    '--w3m-background-color': 'hsl(var(--background))',
    '--w3m-color': 'hsl(var(--foreground))',
    '--w3m-z-index': '1000'
  }
});

console.log("Web3 configuration completed with enhanced error handling");

export { web3Modal, config, chains }