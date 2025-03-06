import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

export const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: import.meta.env.VITE_INFURA_ID || "",
      },
    },
  },
  theme: "light",
});

export async function connectWallet() {
  try {
    const instance = await web3Modal.connect();
    const provider = new ethers.BrowserProvider(instance);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    return {
      provider,
      signer,
      address,
      chainId: (await provider.getNetwork()).chainId,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
    throw error;
  }
}

export async function disconnectWallet() {
  web3Modal.clearCachedProvider();
}
