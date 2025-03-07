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
      // Log available connectors for debugging
      console.log('Available connectors:', connectors.map(c => c.name))

      // Open the Web3Modal
      web3Modal.open()

      toast({
        title: "Choose Your Wallet",
        description: "Select your preferred wallet to connect",
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