import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useToast } from "@/hooks/use-toast"

export function useWallet() {
  const { address, isConnected } = useAccount()
  const { isOpen, open, close } = useWeb3Modal()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()

  const connectWallet = async () => {
    try {
      await open()
    } catch (error) {
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
    isConnecting: isOpen,
    connect: connectWallet,
    disconnect: disconnectWallet,
  }
}