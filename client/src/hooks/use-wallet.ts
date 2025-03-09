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
      console.log('Attempting to connect wallet...')
      console.log('Available connectors:', connectors.map(c => ({
        name: c.name,
        ready: c.ready,
        id: c.id
      })))

      // Open Web3Modal
      await web3Modal.open()

      toast({
        title: "Choose Your Wallet",
        description: "Select your preferred wallet to connect",
      })
    } catch (error) {
      console.error('Wallet connection error:', error)
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
      await disconnect()
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been successfully disconnected",
      })
    } catch (error) {
      console.error('Wallet disconnect error:', error)
      toast({
        variant: "destructive",
        title: "Disconnect Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "Failed to disconnect wallet. Please try again.",
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