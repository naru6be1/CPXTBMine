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
      // Enhanced logging for connection attempts
      console.log('Attempting to connect wallet with detailed logging...', {
        currentAddress: address,
        isCurrentlyConnected: isConnected,
        availableConnectors: connectors.map(c => ({
          name: c.name,
          ready: c.ready,
          id: c.id
        })),
        timestamp: new Date().toISOString()
      });

      // Open Web3Modal
      await web3Modal.open()

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
          address: address?.toLowerCase(), // Log normalized address
          connectors: connectors.map(c => ({
            name: c.name,
            ready: c.ready,
            id: c.id
          })),
        },
        timestamp: new Date().toISOString()
      })
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "Failed to connect wallet. Please try again.",
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
        address: address?.toLowerCase(), // Log normalized address
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
    address: address?.toLowerCase(), // Log normalized address
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