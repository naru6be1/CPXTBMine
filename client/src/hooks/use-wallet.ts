import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { connectWallet, disconnectWallet, web3Modal } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  signer: ethers.Signer | null;
  provider: ethers.Provider | null;
  chainId: bigint | null;
}

const initialState: WalletState = {
  address: null,
  isConnecting: false,
  isConnected: false,
  signer: null,
  provider: null,
  chainId: null,
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(initialState);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    try {
      setWallet(prev => ({ ...prev, isConnecting: true }));
      const { provider, signer, address, chainId } = await connectWallet();
      
      setWallet({
        address,
        isConnecting: false,
        isConnected: true,
        signer,
        provider,
        chainId,
      });
    } catch (error) {
      setWallet(initialState);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
      });
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setWallet(initialState);
  }, []);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  return {
    ...wallet,
    connect,
    disconnect,
  };
}
