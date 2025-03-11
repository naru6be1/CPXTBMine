import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Coins, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useAccount, useContractRead, useNetwork, useSwitchNetwork } from 'wagmi';
import { formatUnits, parseUnits } from "viem";
import { TransactionStatus } from "./transaction-status";
import { motion, AnimatePresence } from "framer-motion";
import { type Address, getContract } from 'viem';

// ERC20 ABI with detailed function signatures
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_to", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"name": "success", "type": "bool"}],
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "from", "type": "address"},
      {"indexed": true, "name": "to", "type": "address"},
      {"indexed": false, "name": "value", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
];

// Constants
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const TREASURY_ADDRESS = "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27";
const REQUIRED_CONFIRMATIONS = 3;
const ETHERSCAN_API_URL = "https://api.etherscan.io/api";

// Plan configurations
const PLANS: Record<PlanType, PlanConfig> = {
  daily: {
    amount: parseUnits("1", 6), // 1 USDT
    displayAmount: "1",
    rewardUSD: 1.5,
    duration: "24 hours"
  },
  weekly: {
    amount: parseUnits("100", 6), // 100 USDT
    displayAmount: "100",
    rewardUSD: 15,
    duration: "7 days"
  }
};

type PlanType = 'daily' | 'weekly';

interface PlanConfig {
  amount: bigint;
  displayAmount: string;
  rewardUSD: number;
  duration: string;
}

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
  planType,
  onReset
}: {
  withdrawalAddress: string;
  dailyRewardCPXTB: string;
  activatedAt: string;
  planType: PlanType;
  onReset: () => void;
}) {
  const activationDate = new Date(activatedAt);
  const endDate = new Date(activationDate);
  endDate.setDate(endDate.getDate() + (planType === 'weekly' ? 7 : 1));

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
            <p className="text-sm text-muted-foreground">Plan Type</p>
            <p className="text-lg font-semibold capitalize">{planType} Plan</p>
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
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('weekly');
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [activePlanDetails, setActivePlanDetails] = useState<{
    withdrawalAddress: string;
    dailyRewardCPXTB: string;
    activatedAt: string;
    planType: PlanType;
  } | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchingNetwork } = useSwitchNetwork();

  const currentPlan = PLANS[selectedPlan];
  const cpxtbPrice = 0.002529;
  const dailyRewardCPXTB = (currentPlan.rewardUSD / cpxtbPrice).toFixed(2);

  // USDT Balance Check with improved error handling
  const { data: usdtBalance, isError: isBalanceError, refetch: refetchBalance } = useContractRead({
    address: USDT_CONTRACT_ADDRESS as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as Address],
    enabled: !!address && chain?.id === 1,
    watch: true,
    onError: (error) => {
      console.error('USDT balance read error:', error);
      toast({
        variant: "destructive",
        title: "Balance Check Failed",
        description: "Unable to read USDT balance. Please try again.",
      });
    }
  });

  // Helper to format balance display
  const getBalanceDisplay = () => {
    if (!isConnected) return "Not connected";
    if (chain?.id !== 1) return "Wrong network";
    if (isBalanceError) return "Error loading balance";
    if (!usdtBalance) return "0 USDT";
    try {
      return `${formatUnits(usdtBalance, 6)} USDT`;
    } catch (error) {
      console.error('Error formatting balance:', error);
      return "Error displaying balance";
    }
  };

  // Handle transaction submission
  const handleTransfer = async () => {
    if (!chain || chain.id !== 1) {
      toast({
        variant: "destructive",
        title: "Wrong Network",
        description: "Please switch to Ethereum mainnet"
      });
      return;
    }

    if (!withdrawalAddress) {
      toast({
        variant: "destructive",
        title: "Missing Address",
        description: "Please provide your Base network address for CPXTB rewards"
      });
      return;
    }

    try {
      // Check balance
      const balance = usdtBalance ? BigInt(usdtBalance.toString()) : BigInt(0);
      if (balance < currentPlan.amount) {
        toast({
          variant: "destructive",
          title: "Insufficient Balance",
          description: `You need ${currentPlan.displayAmount} USDT. Current balance: ${formatUnits(balance, 6)} USDT`
        });
        return;
      }

      setIsTransferring(true);

      // Create contract instance
      const contract = getContract({
        address: USDT_CONTRACT_ADDRESS as Address,
        abi: ERC20_ABI,
        chain: chain
      });

      // Send transaction
      const tx = await contract.write.transfer([
        TREASURY_ADDRESS as Address,
        currentPlan.amount
      ]);

      console.log('Transaction submitted:', tx);
      setTransactionHash(tx.hash);
      setIsValidating(true);

      toast({
        title: "Transfer Submitted",
        description: "Transaction sent to network. Waiting for confirmation..."
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setIsConfirmed(true);
        const activationTime = new Date().toISOString();
        const planDetails = {
          withdrawalAddress,
          dailyRewardCPXTB,
          activatedAt: activationTime,
          planType: selectedPlan
        };

        localStorage.setItem('activeMiningPlan', JSON.stringify(planDetails));
        setHasActivePlan(true);
        setActivePlanDetails(planDetails);

        toast({
          title: "Plan Activated",
          description: "Your mining plan has been successfully activated!"
        });
      }

    } catch (error) {
      console.error('Transfer error:', error);
      setIsTransferring(false);
      setIsValidating(false);

      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to transfer USDT"
      });
    }
  };

  const handleResetPlan = () => {
    localStorage.removeItem('activeMiningPlan');
    setHasActivePlan(false);
    setActivePlanDetails(null);
    toast({
      title: "Plan Reset",
      description: "Your mining plan has been reset."
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
            planType={activePlanDetails.planType}
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
          Mining Plans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 mb-6">
          <Button
            variant={selectedPlan === 'daily' ? 'default' : 'outline'}
            onClick={() => setSelectedPlan('daily')}
            className="flex-1"
          >
            Daily Plan
          </Button>
          <Button
            variant={selectedPlan === 'weekly' ? 'default' : 'outline'}
            onClick={() => setSelectedPlan('weekly')}
            className="flex-1"
          >
            Weekly Plan
          </Button>
        </div>

        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold capitalize">{selectedPlan} Mining Plan Details</h3>
          <div className="grid gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Your USDT Balance</p>
              <p className="text-2xl font-bold">{getBalanceDisplay()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Investment Required</p>
              <p className="text-2xl font-bold">{currentPlan.displayAmount} USDT</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Reward</p>
              <p className="text-2xl font-bold text-primary">
                {dailyRewardCPXTB} CPXTB
                <span className="text-sm text-muted-foreground ml-2">
                  (≈${currentPlan.rewardUSD})
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold">{currentPlan.duration}</p>
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
          </div>

          {isConnected && (
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleTransfer}
              disabled={isTransferring || isValidating || isSwitchingNetwork}
            >
              <Coins className="mr-2 h-4 w-4" />
              {isSwitchingNetwork ? "Switching Network..." :
                isTransferring ? "Transferring USDT..." :
                  isValidating ? "Validating Transaction..." :
                    `Activate ${selectedPlan} Plan (${currentPlan.displayAmount} USDT)`}
            </Button>
          )}

          {transactionHash && (
            <TransactionStatus
              hash={transactionHash}
              isValidating={isValidating}
              isConfirmed={isConfirmed}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}