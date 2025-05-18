import { useState, useEffect, createContext, useContext } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useWalletClient } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { formatEther, parseEther } from "viem";
import { CPXTB_TOKEN_ADDRESS } from "@/lib/constants";

interface WalletContextType {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | undefined;
  walletConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (to: `0x${string}`, value: string) => Promise<`0x${string}` | undefined>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { data: tokenBalance } = useBalance({
    address,
    token: CPXTB_TOKEN_ADDRESS as `0x${string}`,
    enabled: !!address,
    watch: true,
  });
  
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  
  const [balance, setBalance] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (tokenBalance) {
      setBalance(tokenBalance.formatted);
    } else {
      setBalance(undefined);
    }
  }, [tokenBalance]);
  
  const connectWallet = async () => {
    try {
      const connector = connectors[0]; // Use the first available connector (usually injected connector like MetaMask)
      
      if (connector) {
        await connect({ connector });
        toast({
          title: "Wallet connected",
          description: "Your wallet has been connected successfully",
        });
      } else {
        toast({
          title: "No wallet available",
          description: "Please install a compatible web3 wallet extension",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };
  
  const disconnect = async () => {
    try {
      await wagmiDisconnect();
      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };
  
  const sendTransaction = async (to: `0x${string}`, value: string): Promise<`0x${string}` | undefined> => {
    if (!walletClient || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return undefined;
    }
    
    try {
      // Convert value from ether to wei
      const valueInWei = parseEther(value);
      
      // Send the transaction
      const hash = await walletClient.sendTransaction({
        to,
        value: valueInWei,
        account: address,
      });
      
      toast({
        title: "Transaction sent",
        description: `Transaction hash: ${hash.slice(0, 10)}...`,
      });
      
      return hash;
    } catch (error) {
      console.error("Error sending transaction:", error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to send transaction",
        variant: "destructive",
      });
      return undefined;
    }
  };
  
  return (
    <WalletContext.Provider 
      value={{ 
        address, 
        isConnected, 
        isConnecting, 
        balance, 
        walletConnected: isConnected, 
        connectWallet, 
        disconnect,
        sendTransaction
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}