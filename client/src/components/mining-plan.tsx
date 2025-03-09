import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Coins, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { ethers } from "ethers";
import { useAccount, useContractWrite, useContractRead, usePrepareContractWrite, useNetwork, useSwitchNetwork } from 'wagmi';
import { formatUnits } from "ethers";

// USDT Contract ABI (only including necessary functions)
const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// Update constants with proper addresses and configuration
const USDT_CONTRACT_ADDRESS = "0x6175a8471C2122f4b4475809015bF7D08a58c8E1"; // Sepolia Test USDT
const TREASURY_ADDRESS = "0x1234567890123456789012345678901234567890"; // Update with actual treasury address
const ETHERSCAN_API_URL = "https://api.etherscan.io/api"; //This might need to be updated to a Sepolia explorer API
const REQUIRED_CONFIRMATIONS = 3;

// Function to check transaction status on Etherscan
async function checkTransactionStatus(txHash: string): Promise<boolean> {
  try {
    console.log(`Checking transaction status for hash: ${txHash}`);
    const response = await fetch(`${ETHERSCAN_API_URL}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`); //This might need to be updated to a Sepolia explorer API
    const data = await response.json();
    console.log('Transaction receipt status response:', data);

    if (data.status === "1" && data.result.status === "1") {
      const txResponse = await fetch(`${ETHERSCAN_API_URL}?module=transaction&action=gettxinfo&txhash=${txHash}`); //This might need to be updated to a Sepolia explorer API
      const txData = await txResponse.json();
      console.log('Transaction info response:', txData);

      if (txData.status === "1" && txData.result.confirmations >= REQUIRED_CONFIRMATIONS) {
        console.log(`Transaction confirmed with ${txData.result.confirmations} confirmations`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return false;
  }
}

// ActivePlanDisplay component with end date
function ActivePlanDisplay({
  withdrawalAddress,
  dailyRewardCPXTB,
  activatedAt,
  onReset
}: {
  withdrawalAddress: string;
  dailyRewardCPXTB: string;
  activatedAt: string;
  onReset: () => void;
}) {
  // Calculate end date (7 days from activation)
  const activationDate = new Date(activatedAt);
  const endDate = new Date(activationDate);
  endDate.setDate(endDate.getDate() + 7);

  // Format dates nicely
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="bg-primary/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-primary mb-2">
          🎉 Mining Plan Status
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-semibold text-green-500">Active</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Daily Reward</p>
            <p className="text-lg font-semibold">{dailyRewardCPXTB} CPXTB</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Withdrawal Address</p>
            <p className="text-sm font-mono break-all">{withdrawalAddress}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Activation Time</p>
              <p className="text-lg font-semibold">{formatDate(activationDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Time</p>
              <p className="text-lg font-semibold">{formatDate(endDate)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-primary/10">
            <p className="text-sm text-muted-foreground">
              Your mining plan will be active for 7 days from activation.
            </p>
          </div>
          <Button
            variant="destructive"
            className="w-full mt-4"
            onClick={onReset}
          >
            Reset Mining Plan
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MiningPlan() {
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [activePlanDetails, setActivePlanDetails] = useState<{
    withdrawalAddress: string;
    dailyRewardCPXTB: string;
    activatedAt: string;
  } | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchingNetwork } = useSwitchNetwork();

  // Constants
  const investmentAmount = ethers.parseUnits("100", 6); // 100 USDT (6 decimals)
  const dailyRewardUSD = 15; // USD
  const cpxtbPrice = 0.002529; // Current CPXTB price in USD
  const dailyRewardCPXTB = (dailyRewardUSD / cpxtbPrice).toFixed(2); // Calculate CPXTB equivalent

  // Read USDT balance
  const { data: usdtBalance } = useContractRead({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address && !!chain, // Removed chain.id === 1 check
    watch: true,
  });

  // Contract interactions
  const { config: approveConfig } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'approve',
    args: [TREASURY_ADDRESS as `0x${string}`, investmentAmount],
    enabled: !!USDT_CONTRACT_ADDRESS && !!TREASURY_ADDRESS && !!address,
  });

  const { writeAsync: approveWrite, isLoading: isApproveLoading } = useContractWrite(approveConfig);

  const { config: transferConfig } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'transfer',
    args: [TREASURY_ADDRESS as `0x${string}`, investmentAmount],
    enabled: !!USDT_CONTRACT_ADDRESS && !!TREASURY_ADDRESS && !!address,
  });

  const { writeAsync: transferWrite, isLoading: isTransferLoading } = useContractWrite(transferConfig);

  useEffect(() => {
    const storedPlan = localStorage.getItem('activeMiningPlan');
    if (storedPlan) {
      const plan = JSON.parse(storedPlan);
      setHasActivePlan(true);
      setActivePlanDetails(plan);
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const validateTransaction = async () => {
      if (transactionHash && isValidating) {
        const isConfirmed = await checkTransactionStatus(transactionHash);

        if (isConfirmed) {
          // Transaction confirmed, activate plan
          const activationTime = new Date().toISOString();
          const planDetails = {
            withdrawalAddress,
            dailyRewardCPXTB,
            activatedAt: activationTime
          };

          localStorage.setItem('activeMiningPlan', JSON.stringify(planDetails));
          setHasActivePlan(true);
          setActivePlanDetails(planDetails);
          setIsValidating(false);
          setTransactionHash(null);

          toast({
            title: "Mining Plan Activated",
            description: "Transaction confirmed! Your mining plan has been activated.",
          });
        }
      }
    };

    if (isValidating && transactionHash) {
      intervalId = setInterval(validateTransaction, 15000); // Check every 15 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactionHash, isValidating, withdrawalAddress, dailyRewardCPXTB]);

  // Function to check and switch network
  const ensureTestnetConnection = async () => {
    console.log("Current network state:", {
      chainId: chain?.id,
      chainName: chain?.name,
      switchNetworkAvailable: !!switchNetwork
    });

    if (!chain || chain.id !== 11155111) { // Sepolia chain ID
      if (switchNetwork) {
        console.log("Attempting to switch to Sepolia testnet...");
        try {
          toast({
            title: "Wrong Network",
            description: "Switching to Sepolia testnet...",
          });
          await switchNetwork(11155111);
          console.log("Network switch initiated successfully");
        } catch (error) {
          console.error("Failed to switch network:", error);
          toast({
            variant: "destructive",
            title: "Network Switch Failed",
            description: "Please manually switch to Sepolia testnet in your wallet",
          });
          return false;
        }
      } else {
        console.log("Automatic network switching not available");
        toast({
          variant: "destructive",
          title: "Network Switch Not Supported",
          description: "Please manually switch to Sepolia testnet in your wallet settings",
        });
        return false;
      }
    } else {
      console.log("Already on Sepolia testnet");
    }
    return true;
  };

  const handleActivatePlan = async () => {
    if (!withdrawalAddress) {
      toast({
        variant: "destructive",
        title: "Missing Withdrawal Address",
        description: "Please provide your Base network address for CPXTB rewards",
      });
      return;
    }

    // Check network connection first
    const isTestnet = await ensureTestnetConnection();
    if (!isTestnet) return;

    if (!usdtBalance || usdtBalance.lt(investmentAmount)) {
      const currentBalance = usdtBalance ? formatUnits(usdtBalance, 6) : '0';
      toast({
        variant: "destructive",
        title: "Insufficient USDT Balance",
        description: `You need 100 USDT to activate the mining plan. Your current balance is ${currentBalance} USDT. Visit the Sepolia faucet to get test USDT.`,
      });
      return;
    }

    try {
      console.log("Starting plan activation process...");
      console.log("Current chain:", chain);
      console.log("USDT balance:", usdtBalance?.toString());
      console.log("Investment amount:", investmentAmount.toString());

      // First approve USDT spending
      setIsApproving(true);
      console.log("Initiating USDT approval...");

      if (!approveWrite) {
        throw new Error("Approval function not available. Please check your wallet connection.");
      }

      const approveTx = await approveWrite();
      console.log("Approve transaction submitted:", approveTx);

      toast({
        title: "Approval Initiated",
        description: "Please confirm the approval transaction in your wallet",
      });

      await approveTx.wait(); // Wait for approval confirmation
      setIsApproving(false);

      // Then transfer USDT
      setIsTransferring(true);
      console.log("Initiating USDT transfer...");

      if (!transferWrite) {
        throw new Error("Transfer function not available. Please check your wallet connection.");
      }

      const transferTx = await transferWrite();
      console.log("Transfer transaction submitted:", transferTx);

      const hash = transferTx.hash;
      console.log("Transaction hash:", hash);

      setTransactionHash(hash);
      setIsValidating(true);

      toast({
        title: "Transaction Submitted",
        description: "Waiting for blockchain confirmation. This may take a few minutes.",
      });
    } catch (error) {
      console.error('Error during plan activation:', error);
      toast({
        variant: "destructive",
        title: "Activation Failed",
        description: error instanceof Error
          ? `Error: ${error.message}`
          : "Failed to activate mining plan. Please try again.",
      });
    } finally {
      setIsApproving(false);
      setIsTransferring(false);
    }
  };

  const handleResetPlan = () => {
    localStorage.removeItem('activeMiningPlan');
    setHasActivePlan(false);
    setActivePlanDetails(null);
    toast({
      title: "Mining Plan Reset",
      description: "Your mining plan has been reset. You can now activate a new plan.",
    });
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
              ? "Click the button below to switch networks automatically."
              : "Please switch networks manually in your wallet."}
          </p>
          <a 
            href="https://sepolia-faucet.pk910.de/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline mt-2 inline-block"
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

  useEffect(() => {
    if (address && chain) {
      console.log("Current wallet state:", {
        address,
        chainId: chain.id,
        usdtBalance: usdtBalance ? formatUnits(usdtBalance, 6) : '0',
        requiredAmount: formatUnits(investmentAmount, 6)
      });
    }
  }, [address, chain, usdtBalance, investmentAmount]);


  // Show active plan if exists
  if (hasActivePlan && activePlanDetails) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Active Mining Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivePlanDisplay
            withdrawalAddress={activePlanDetails.withdrawalAddress}
            dailyRewardCPXTB={activePlanDetails.dailyRewardCPXTB}
            activatedAt={activePlanDetails.activatedAt}
            onReset={handleResetPlan}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          Weekly Mining Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-blue-500/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-500 mb-2">Test Mode Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Switch your wallet to Sepolia testnet</li>
              <li>Get test ETH from the <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sepolia faucet</a></li>
              <li>Get test USDT from our test USDT contract (you can mint test tokens)</li>
              <li>Use the test USDT to activate the mining plan</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              Note: This is a test environment. No real tokens will be used.
            </p>
          </div>
        </div>
        <NetworkStatus />
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Mining Plan Details</h3>
          <div className="grid gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Current USDT Balance</p>
              <p className="text-2xl font-bold">
                {usdtBalance ? formatUnits(usdtBalance, 6) : '0.00'} USDT
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Required Investment</p>
              <p className="text-2xl font-bold">100 USDT</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Reward</p>
              <p className="text-2xl font-bold text-primary">
                {dailyRewardCPXTB} CPXTB
                <span className="text-sm text-muted-foreground ml-2">
                  (≈${dailyRewardUSD})
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawal">CPXTB Withdrawal Address (Base Network)</Label>
            <Input
              id="withdrawal"
              placeholder="Enter your Base network address for CPXTB withdrawals"
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Please provide your Base network address to receive CPXTB rewards
            </p>
          </div>

          {isConnected && (
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleActivatePlan}
              disabled={
                isApproving ||
                isTransferring ||
                isValidating ||
                isApproveLoading ||
                isTransferLoading ||
                isSwitchingNetwork ||
                (chain?.id !== 11155111 && !switchNetwork) // Changed to Sepolia chain ID
              }
            >
              <Coins className="mr-2 h-4 w-4" />
              {isSwitchingNetwork ? "Switching Network..." :
                chain?.id !== 11155111 ? "Switch to Sepolia Testnet" : // Changed to Sepolia
                  isApproveLoading ? "Waiting for Approval..." :
                    isApproving ? "Approving USDT..." :
                      isTransferLoading ? "Waiting for Transfer..." :
                        isTransferring ? "Transferring USDT..." :
                          isValidating ? "Validating Transaction..." :
                            "Activate Mining Plan (100 USDT)"}
            </Button>
          )}

          {/* Transaction status section - Always show when transaction hash exists */}
          {transactionHash && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                {isValidating ? "Waiting for transaction confirmation..." : "Transaction submitted:"}
                <br />
                <span className="font-mono text-xs break-all">
                  Transaction Hash: {transactionHash}
                </span>
                <br />
                <a
                  href={`https://etherscan.io/tx/${transactionHash}`} //This might need to be updated to a Sepolia explorer link
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline mt-2 inline-block"
                >
                  View on Etherscan
                </a>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}