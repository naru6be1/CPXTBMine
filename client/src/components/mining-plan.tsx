import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Coins, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { ethers } from "ethers";
import { useAccount, useContractWrite, useContractRead, usePrepareContractWrite, useNetwork, useSwitchNetwork } from 'wagmi';
import { formatUnits } from "ethers";

// Update the USDT ABI to make it simpler
const USDT_ABI = [
  "function mint(address to, uint256 amount) external", // Mint function for test tokens
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address recipient, uint256 amount) external returns (bool)"
];

// Update constants with proper addresses and configuration
const USDT_CONTRACT_ADDRESS = "0x6175a8471C2122f4b4475809015bF7D08a58c8E1"; // Sepolia Test USDT
const TREASURY_ADDRESS = "0x1234567890123456789012345678901234567890"; // Update with actual treasury address
const ETHERSCAN_API_URL = "https://api-sepolia.etherscan.io/api"; // Updated to Sepolia explorer API
const REQUIRED_CONFIRMATIONS = 3;

export function MiningPlan() {
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchingNetwork } = useSwitchNetwork();

  // Read USDT balance
  const { data: usdtBalance } = useContractRead({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address && !!chain,
    watch: true,
  });

  // Mint Test USDT
  const { config: mintConfig } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'mint',
    args: [address as `0x${string}`, ethers.parseUnits("1000", 6)], // Mint 1000 test USDT
    enabled: !!address && chain?.id === 11155111,
  });

  const { write: mintWrite, isLoading: isMinting } = useContractWrite({
    ...mintConfig,
    onSuccess(data) {
      console.log("Mint transaction submitted:", data.hash);
      toast({
        title: "Transaction Submitted",
        description: "Your test USDT minting transaction has been submitted.",
      });
    },
    onError(error) {
      console.error("Mint error:", error);
      toast({
        variant: "destructive",
        title: "Minting Failed",
        description: error instanceof Error ? error.message : "Failed to mint test USDT",
      });
    },
  });

  const handleMintTestUSDT = async () => {
    console.log("Starting mint process...");
    console.log("Current chain:", chain?.id);
    console.log("Contract address:", USDT_CONTRACT_ADDRESS);
    console.log("User address:", address);

    if (!address || chain?.id !== 11155111) {
      console.log("Network check failed:", { address, chainId: chain?.id });
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Please connect to Sepolia testnet first",
      });
      return;
    }

    try {
      console.log("Attempting to mint USDT...");
      if (!mintWrite) {
        console.error("Mint function not available. Contract config:", mintConfig);
        throw new Error("Mint function not available. Please make sure you're connected to Sepolia testnet.");
      }

      mintWrite();
    } catch (error) {
      console.error("Error minting test USDT:", error);
      toast({
        variant: "destructive",
        title: "Minting Failed",
        description: error instanceof Error ? error.message : "Failed to mint test USDT",
      });
    }
  };

  // Network status component with more detailed information
  const NetworkStatus = () => {
    if (!chain) return null;

    if (chain.id !== 11155111) {
      return (
        <div className="mb-4 p-4 bg-yellow-500/10 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Test Mode: Switch to Sepolia</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Please connect to Sepolia testnet to test with test USDT. {switchNetwork
              ? "Click below to switch networks."
              : "Please switch networks manually in your wallet."}
          </p>
          {switchNetwork && (
            <Button 
              onClick={() => switchNetwork(11155111)}
              variant="outline"
              className="mt-2"
              disabled={isSwitchingNetwork}
            >
              {isSwitchingNetwork ? "Switching..." : "Switch to Sepolia"}
            </Button>
          )}
          <a
            href="https://sepolia-faucet.pk910.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline mt-2 block"
          >
            Get test ETH from Sepolia faucet
          </a>
        </div>
      );
    }

    return (
      <div className="mb-4 p-4 bg-green-500/10 rounded-lg">
        <div className="flex items-center gap-2 text-green-500">
          <span className="font-semibold">✓ Connected to Sepolia Testnet</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Testing mode active. Using test USDT on Sepolia network.
        </p>
      </div>
    );
  };

  // Show wallet status and simple balance display
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          Get Test USDT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-blue-500/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-500 mb-2">Simple Test Mode</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Switch your wallet to Sepolia testnet</li>
              <li>Get test ETH from the <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sepolia faucet</a></li>
              <li>Click the button below to mint test USDT tokens</li>
            </ol>
            <div className="mt-4">
              <Button
                onClick={handleMintTestUSDT}
                disabled={!address || chain?.id !== 11155111 || isMinting}
                className="w-full"
              >
                {isMinting ? "Minting..." : "Get 1000 Test USDT"}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Note: This is a test environment. These are not real tokens.
              </p>
            </div>
          </div>
        </div>
        <NetworkStatus />
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Current Balance</h3>
          <div className="grid gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Your USDT Balance</p>
              <p className="text-2xl font-bold">
                {usdtBalance ? formatUnits(usdtBalance, 6) : '0.00'} USDT
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}