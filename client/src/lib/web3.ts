// Minimalist Web3 configuration that prevents modal initialization
import { configureChains, createConfig } from 'wagmi'
import { mainnet } from 'viem/chains'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'

// Simplified chain configuration with only essential providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

// Create lightweight config that won't auto-connect or show modals
const config = createConfig({
  autoConnect: false,
  connectors: [
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
});

console.log("Using lightweight Web3 configuration");

// Create a mock web3Modal to satisfy imports
const web3Modal = {
  open: () => console.log("Web3Modal disabled"),
  close: () => {},
  setTheme: () => {},
};

export { web3Modal, config, chains }