import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi'
import { mainnet, sepolia } from 'viem/chains'
import { http } from 'viem'

// Make sure to use the environment variable for the project ID
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

const metadata = {
  name: 'Web3 DApp',
  description: 'Web3 DApp with multiple wallet support',
  url: 'https://web3-dapp.example.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, sepolia]

// Updated wagmi config with required parameters for v2
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http()
  }
})

createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  }
})