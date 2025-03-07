import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useToast } from "@/hooks/use-toast"

export function useWallet() {
  const { address, isConnected } = useAccount()
  const { connectAsync, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()

  const connectWallet = async () => {
    try {
      const result = await connectAsync()
      if (result) {
        toast({
          title: "Wallet Connected",
          description: "Your wallet has been connected successfully",
        })
      }
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
    isConnecting: isPending,
    connect: connectWallet,
    disconnect: disconnectWallet,
  }
}