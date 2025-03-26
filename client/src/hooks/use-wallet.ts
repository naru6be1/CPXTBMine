import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useToast } from "@/hooks/use-toast"
import { web3Modal } from '@/lib/web3'

export function useWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isLoading } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()

  const connectWallet = async () => {
    try {
      // Log connection attempt
      console.log('Attempting to connect wallet...', {
        currentAddress: address,
        isCurrentlyConnected: isConnected,
        availableConnectors: connectors.map(c => ({
          name: c.name,
          ready: c.ready,
          id: c.id
        })),
        timestamp: new Date().toISOString()
      });

      // First check if Web3Modal is available
      if (!web3Modal) {
        throw new Error('Web3Modal not initialized');
      }

      // Open Web3Modal
      await web3Modal.open();

      // Show toast only after successful connection
      toast({
        title: "Choose Your Wallet",
        description: "Select your preferred wallet to connect",
      })
    } catch (error) {
      console.error('Wallet connection error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorObject: error,
        connectionParams: {
          isConnected,
          address: address?.toLowerCase(),
          connectors: connectors.map(c => ({
            name: c.name,
            ready: c.ready,
            id: c.id
          })),
        },
        timestamp: new Date().toISOString()
      });

      // Show error toast with more descriptive message
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error 
          ? `Please ensure you have a wallet installed and try again. Error: ${error.message}`
          : "Failed to connect wallet. Please ensure you have a wallet installed and try again.",
      })
    }
  }

  const disconnectWallet = async () => {
    try {
      console.log('Attempting to disconnect wallet:', {
        currentAddress: address,
        timestamp: new Date().toISOString()
      });

      await disconnect()
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been successfully disconnected",
      })

      // Clear local storage for this wallet address
      if (address) {
        localStorage.removeItem(`global_device_id_${address.toLowerCase()}`);
        localStorage.removeItem(`global_lastCPXTBClaimTime_${address.toLowerCase()}`);
      }
    } catch (error) {
      console.error('Wallet disconnect error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        address: address?.toLowerCase(),
        timestamp: new Date().toISOString()
      })
      toast({
        variant: "destructive",
        title: "Disconnect Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "Failed to disconnect wallet. Please try again.",
      })
    }
  }

  // Enhanced wallet state logging
  console.log('Wallet Hook State:', {
    isConnected,
    address: address?.toLowerCase(), 
    isConnecting: isLoading,
    availableConnectors: connectors.map(c => ({
      name: c.name,
      ready: c.ready,
      id: c.id
    })),
    timestamp: new Date().toISOString()
  })

  return {
    address,
    isConnected,
    isConnecting: isLoading,
    connect: connectWallet,
    disconnect: disconnectWallet,
  }
}