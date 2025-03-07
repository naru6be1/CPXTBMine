import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useToast } from "@/hooks/use-toast"

export function useWallet() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isLoading } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()

  const connectWallet = async () => {
    try {
      // Log available connectors for debugging
      console.log('Available connectors:', connectors.map(c => c.name))

      // Let Web3Modal handle the connection process
      connect()
      toast({
        title: "Opening Wallet Connection",
        description: "Please select a wallet to connect",
      })
    } catch (error) {
      console.error('Wallet connection error:', error)
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
      })
    }
  }

  const disconnectWallet = async () => {
    try {
      disconnect()
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      })
    } catch (error) {
      console.error('Wallet disconnect error:', error)
      toast({
        variant: "destructive",
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect wallet",
      })
    }
  }

  return {
    address,
    isConnected,
    isConnecting: isLoading,
    connect: connectWallet,
    disconnect: disconnectWallet,
  }
}