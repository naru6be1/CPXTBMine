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
import { TransactionStatus } from "./transaction-status";
import { motion, AnimatePresence } from "framer-motion";

// Update the USDT ABI to include more detailed function definitions
const USDT_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "success", type: "bool" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    type: "function"
  }
];

// Update constants with proper addresses and configuration
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const TREASURY_ADDRESS = "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27"; // New treasury address
const REQUIRED_CONFIRMATIONS = 3;
const ETHERSCAN_API_URL = "https://api.etherscan.io/api";

// Plan types
type PlanType = 'daily' | 'weekly';

interface PlanConfig {
  investmentAmount: bigint;
  displayAmount: string;
  rewardUSD: number;
  duration: string;
}

const PLANS: Record<PlanType, PlanConfig> = {
  daily: {
    investmentAmount: ethers.parseUnits("1", 6), // 1 USDT
    displayAmount: "1",
    rewardUSD: 1.5, // 1.5 USD daily reward
    duration: "24 hours"
  },
  weekly: {
    investmentAmount: ethers.parseUnits("100", 6), // 100 USDT
    displayAmount: "100",
    rewardUSD: 15, // 15 USD daily reward
    duration: "7 days"
  }
};


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
  const [isApproving, setIsApproving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchingNetwork } = useSwitchNetwork();

  const currentPlan = PLANS[selectedPlan];
  const cpxtbPrice = 0.002529; // Current CPXTB price in USD
  const dailyRewardCPXTB = (currentPlan.rewardUSD / cpxtbPrice).toFixed(2);

  // Update the balance reading section with improved error handling and logging
  const { data: usdtBalance, isError: isBalanceError, refetch: refetchBalance } = useContractRead({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    enabled: !!address && chain?.id === 1, // Only enable on Ethereum mainnet
    watch: true,
    cacheTime: 5000, // Reduce cache time to 5 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error('Error reading USDT balance:', error);
      console.error('Contract parameters:', {
        contractAddress: USDT_CONTRACT_ADDRESS,
        userAddress: address,
        chainId: chain?.id,
        isEnabled: !!address && chain?.id === 1,
        isConnected: isConnected
      });

      // Check if it's an RPC error and show appropriate message
      if (error.message?.includes('Internal error') || error.message?.includes('Cannot fulfill request')) {
        toast({
          variant: "destructive",
          title: "Network Connection Error",
          description: "Having trouble connecting to Ethereum network. Please try again in a moment.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Balance Check Failed",
          description: "Unable to read your USDT balance. Please ensure you're connected to Ethereum mainnet.",
        });
      }
    },
    onSuccess: (data) => {
      console.log('USDT balance read successfully:', {
        raw: data?.toString(),
        formatted: data ? formatUnits(data, 6) : '0',
        chainId: chain?.id,
        userAddress: address,
        contractAddress: USDT_CONTRACT_ADDRESS
      });
    },
  });

  // Add manual balance check function
  const checkBalance = async () => {
    try {
      if (!isConnected || !address || chain?.id !== 1) {
        console.log('Balance check skipped:', {
          isConnected,
          address,
          chainId: chain?.id
        });
        return;
      }

      console.log('Manually checking balance...');
      await refetchBalance();
    } catch (error) {
      console.error('Manual balance check failed:', error);
    }
  };

  // Add effect to check balance on network/wallet changes
  useEffect(() => {
    checkBalance();
  }, [isConnected, address, chain?.id]);

  // Update balance refresh interval
  useEffect(() => {
    if (isConnected && chain?.id === 1 && address) {
      console.log('Setting up balance refresh interval');
      const interval = setInterval(checkBalance, 5000);
      return () => {
        console.log('Clearing balance refresh interval');
        clearInterval(interval);
      };
    }
  }, [isConnected, chain?.id, address]);

  // Add effect to log wallet state changes
  useEffect(() => {
    console.log('Wallet state changed:', {
      isConnected,
      address,
      chainId: chain?.id,
      usdtBalance: usdtBalance ? formatUnits(usdtBalance, 6) : '0',
      requiredAmount: formatUnits(currentPlan.investmentAmount, 6)
    });
  }, [isConnected, address, chain, usdtBalance, currentPlan.investmentAmount]);

  // Helper to format balance display
  const getBalanceDisplay = () => {
    if (!isConnected) return "Not connected";
    if (chain?.id !== 1) return "Wrong network";
    if (isBalanceError) return "Error loading balance";
    return `${usdtBalance ? formatUnits(usdtBalance, 6) : '0'} USDT`;
  };

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
          setIsConfirmed(true);

          // Animate confirmation before activating plan
          setTimeout(() => {
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
            setIsValidating(false);
            setTransactionHash(null);
            setIsConfirmed(false);

            toast({
              title: "Mining Plan Activated",
              description: "Transaction confirmed! Your mining plan has been activated.",
            });
          }, 1500); // Give time for the confirmation animation
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
  }, [transactionHash, isValidating, withdrawalAddress, dailyRewardCPXTB, selectedPlan]);

  // Function to check and switch network
  const ensureMainnetConnection = async () => {
    console.log("Current network state:", {
      chainId: chain?.id,
      chainName: chain?.name,
      switchNetworkAvailable: !!switchNetwork
    });

    if (!chain || chain.id !== 1) {
      if (switchNetwork) {
        console.log("Attempting to switch to Ethereum mainnet...");
        try {
          toast({
            title: "Wrong Network",
            description: "Switching to Ethereum mainnet...",
          });
          await switchNetwork(1);
          console.log("Network switch initiated successfully");
        } catch (error) {
          console.error("Failed to switch network:", error);
          toast({
            variant: "destructive",
            title: "Network Switch Failed",
            description: "Please manually switch to Ethereum mainnet in your wallet",
          });
          return false;
        }
      } else {
        console.log("Automatic network switching not available");
        toast({
          variant: "destructive",
          title: "Network Switch Not Supported",
          description: "Please manually switch to Ethereum mainnet in your wallet settings",
        });
        return false;
      }
    } else {
      console.log("Already on Ethereum mainnet");
    }
    return true;
  };

  const { config: approveConfig, error: approveConfigError } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'approve',
    args: [TREASURY_ADDRESS as `0x${string}`, currentPlan.investmentAmount],
    enabled: !!USDT_CONTRACT_ADDRESS && !!TREASURY_ADDRESS && !!address,
  });

  const {
    write: approveWrite,
    isLoading: isApproveLoading,
    isSuccess: isApproveSuccess,
    error: approveError
  } = useContractWrite(approveConfig);

  const { config: transferConfig, error: transferConfigError } = usePrepareContractWrite({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'transfer',
    args: [TREASURY_ADDRESS as `0x${string}`, currentPlan.investmentAmount],
    enabled: !!USDT_CONTRACT_ADDRESS && !!TREASURY_ADDRESS && !!address,
  });

  const {
    write: transferWrite,
    isLoading: isTransferLoading,
    isSuccess: isTransferSuccess,
    error: transferError
  } = useContractWrite(transferConfig);

  useEffect(() => {
    if (approveConfigError || approveError) {
      console.error('Approve error:', approveConfigError || approveError);
      toast({
        variant: "destructive",
        title: "Approval Error",
        description: (approveConfigError || approveError)?.message || "Failed to approve USDT transfer",
      });
    }
  }, [approveConfigError, approveError]);

  useEffect(() => {
    if (transferConfigError || transferError) {
      console.error('Transfer error:', transferConfigError || transferError);
      toast({
        variant: "destructive",
        title: "Transfer Error",
        description: (transferConfigError || transferError)?.message || "Failed to transfer USDT",
      });
    }
  }, [transferConfigError, transferError]);

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
    if (!chain || chain.id !== 1) {
      toast({
        variant: "destructive",
        title: "Wrong Network",
        description: "Please switch to Ethereum mainnet to continue",
      });
      return;
    }

    if (!usdtBalance || usdtBalance.lt(currentPlan.investmentAmount)) {
      const currentBalance = usdtBalance ? formatUnits(usdtBalance, 6) : '0';
      toast({
        variant: "destructive",
        title: "Insufficient USDT Balance",
        description: `You need ${currentPlan.displayAmount} USDT to activate the ${selectedPlan} plan. Your current balance is ${currentBalance} USDT.`,
      });
      return;
    }

    try {
      console.log('Starting plan activation with parameters:', {
        withdrawalAddress,
        planType: selectedPlan,
        investmentAmount: formatUnits(currentPlan.investmentAmount, 6),
        currentBalance: usdtBalance ? formatUnits(usdtBalance, 6) : '0',
        chainId: chain.id,
        userAddress: address
      });

      setIsApproving(true);

      if (!approveWrite) {
        throw new Error('Failed to prepare approval transaction');
      }

      approveWrite();

      toast({
        title: "Approval Initiated",
        description: "Please confirm the approval transaction in your wallet",
      });

      // Wait for approval success
      await new Promise<void>((resolve, reject) => {
        const checkApproval = setInterval(() => {
          if (isApproveSuccess) {
            clearInterval(checkApproval);
            resolve();
          }
          if (approveError) {
            clearInterval(checkApproval);
            reject(approveError);
          }
        }, 1000);
      });

      setIsApproving(false);
      setIsTransferring(true);

      if (!transferWrite) {
        throw new Error('Failed to prepare transfer transaction');
      }

      transferWrite();

      // Wait for transfer success and get transaction hash
      const transferResult = await new Promise<string>((resolve, reject) => {
        const checkTransfer = setInterval(() => {
          if (isTransferSuccess) {
            clearInterval(checkTransfer);
            // Get transaction hash from event
            const hash = localStorage.getItem('lastTransactionHash');
            if (hash) resolve(hash);
            else reject(new Error('Transaction hash not found'));
          }
          if (transferError) {
            clearInterval(checkTransfer);
            reject(transferError);
          }
        }, 1000);
      });

      setTransactionHash(transferResult);
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

  // Add network status display component
  const NetworkStatus = () => {
    if (!chain) return null;

    return chain.id !== 1 ? (
      <div className="mb-4 p-4 bg-yellow-500/10 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-500 mb-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Network Switch Required</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Please connect to Ethereum mainnet to view your USDT balance. {switchNetwork
            ? "Click the button below to switch networks automatically."
            : "Please switch networks manually in your wallet."}
        </p>
        {switchNetwork && (
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => switchNetwork(1)}
            disabled={isSwitchingNetwork}
          >
            {isSwitchingNetwork ? "Switching..." : "Switch to Ethereum Mainnet"}
          </Button>
        )}
      </div>
    ) : null;
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
        <NetworkStatus />
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
              <p className="text-2xl font-bold">
                {getBalanceDisplay()}
              </p>
              {chain?.id !== 1 && (
                <p className="text-sm text-red-500 mt-1">
                  Please switch to Ethereum mainnet
                </p>
              )}
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
                (chain?.id !== 1 && !switchNetwork)
              }
            >
              <Coins className="mr-2 h-4 w-4" />
              {isSwitchingNetwork ? "Switching Network..." :
                chain?.id !== 1 ? "Switch to Ethereum Mainnet" :
                  isApproveLoading ? "Waiting for Approval..." :
                    isApproving ? "Approving USDT..." :
                      isTransferLoading ? "Waiting for Transfer..." :
                        isTransferring ? "Transferring USDT..." :
                          isValidating ? "Validating Transaction..." :
                            `Activate ${selectedPlan} Plan (${currentPlan.displayAmount} USDT)`}
            </Button>
          )}

          {/* Transaction status section */}
          <AnimatePresence>
            {transactionHash && (
              <TransactionStatus
                hash={transactionHash}
                isValidating={isValidating}
                isConfirmed={isConfirmed}
              />
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}