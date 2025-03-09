import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { ethers } from "ethers";
import { useAccount, useContractWrite, useContractRead, usePrepareContractWrite } from 'wagmi';

// USDT Contract ABI (only including necessary functions)
const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// Constants
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const TREASURY_ADDRESS = "0x123..."; // Replace with your treasury address
const ETHERSCAN_API_URL = "https://api.etherscan.io/api";
const REQUIRED_CONFIRMATIONS = 3;

// Function to check transaction status on Etherscan
async function checkTransactionStatus(txHash: string): Promise<boolean> {
  try {
    console.log(`Checking transaction status for hash: ${txHash}`);
    const response = await fetch(`${ETHERSCAN_API_URL}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`);
    const data = await response.json();
    console.log('Transaction receipt status response:', data);

    if (data.status === "1" && data.result.status === "1") {
      const txResponse = await fetch(`${ETHERSCAN_API_URL}?module=transaction&action=gettxinfo&txhash=${txHash}`);
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

  // Constants
  const investmentAmount = ethers.parseUnits("100", 6); // 100 USDT (6 decimals)
  const dailyRewardUSD = 15; // USD
  const cpxtbPrice = 0.002529; // Current CPXTB price in USD
  const dailyRewardCPXTB = (dailyRewardUSD / cpxtbPrice).toFixed(2); // Calculate CPXTB equivalent

  // Contract interactions
  const { config: approveConfig } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`, // Add type assertion
    abi: USDT_ABI,
    functionName: 'approve',
    args: [TREASURY_ADDRESS as `0x${string}`, investmentAmount],
    enabled: !!USDT_CONTRACT_ADDRESS && !!TREASURY_ADDRESS, // Add enabled condition
  });

  const { writeAsync: approveWrite, isLoading: isApproveLoading } = useContractWrite(approveConfig);

  const { config: transferConfig } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`, // Add type assertion
    abi: USDT_ABI,
    functionName: 'transfer',
    args: [TREASURY_ADDRESS as `0x${string}`, investmentAmount],
    enabled: !!USDT_CONTRACT_ADDRESS && !!TREASURY_ADDRESS, // Add enabled condition
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

  const handleActivatePlan = async () => {
    if (!withdrawalAddress) {
      toast({
        variant: "destructive",
        title: "Missing Withdrawal Address",
        description: "Please provide your Base network address for CPXTB rewards",
      });
      return;
    }

    try {
      console.log("Starting plan activation process...");

      // First approve USDT spending
      setIsApproving(true);
      console.log("Initiating USDT approval...");
      const approveTx = await approveWrite?.();

      if (!approveTx) {
        throw new Error("Failed to initiate approval transaction");
      }

      console.log("Approve transaction submitted:", approveTx);
      toast({
        title: "Approval Initiated",
        description: "Please confirm the approval transaction in your wallet",
      });

      setIsApproving(false);

      // Then transfer USDT
      setIsTransferring(true);
      console.log("Initiating USDT transfer...");
      const transferTx = await transferWrite?.();

      if (!transferTx) {
        throw new Error("Failed to initiate transfer transaction");
      }

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
        description: error instanceof Error ? error.message : "Failed to activate mining plan. Please try again.",
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
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Mining Plan Details</h3>
          <div className="grid gap-3">
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
              disabled={isApproving || isTransferring || isValidating || isApproveLoading || isTransferLoading}
            >
              <Coins className="mr-2 h-4 w-4" />
              {isApproveLoading ? "Waiting for Approval..." :
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
                  href={`https://etherscan.io/tx/${transactionHash}`}
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