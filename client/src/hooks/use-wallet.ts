import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
}

const initialState: WalletState = {
  address: null,
  isConnecting: false,
  isConnected: false,
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(initialState);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        variant: "destructive",
        title: "Wallet Not Found",
        description: "Please install MetaMask to connect your wallet",
      });
      return;
    }

    try {
      setWallet(prev => ({ ...prev, isConnecting: true }));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWallet({
        address,
        isConnecting: false,
        isConnected: true,
      });

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your wallet",
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

  const disconnect = useCallback(() => {
    setWallet(initialState);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);

  return {
    ...wallet,
    connect,
    disconnect,
  };
}