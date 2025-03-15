import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Coins, MessageCircle, Server, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useAccount, useContractRead, useNetwork, useSwitchNetwork, usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits } from "viem";
import { TransactionStatus } from "./transaction-status";
import { type Address } from 'viem';
import { SiTelegram } from 'react-icons/si';
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReferralStats } from "./referral-stats";
import { useLocation } from "wouter";
import { createPublicClient, http } from 'viem';
import { configureChains } from 'wagmi';
import { base } from 'wagmi/chains';


// Standard ERC20 ABI with complete interface
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
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
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// Constants
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const TREASURY_ADDRESS = "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27";
const CPXTB_CONTRACT_ADDRESS = "0x96A0cc3C0fc5D07818E763E1B25bc78ab4170D1b";
const BASE_CHAIN_ID = 8453;
const BASE_RPC_URL = "https://mainnet.base.org";

// Configure Base chain
const baseChain = {
  ...base,
  rpcUrls: {
    default: { http: [BASE_RPC_URL] },
    public: { http: [BASE_RPC_URL] },
  }
};

// Plan configurations
const PLANS: Record<PlanType, PlanConfig> = {
  daily: {
    amount: BigInt("100000"), // 0.1 USDT (6 decimals)
    displayAmount: "0.1",
    rewardUSD: 0.15, // Adjusted reward for 0.1 USDT
    duration: "24 hours"
  },
  weekly: {
    amount: BigInt("100000000"), // 100 USDT (6 decimals)
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

interface MiningPlan {
  id: number;
  walletAddress: string;
  withdrawalAddress: string;
  planType: PlanType;
  amount: string;
  dailyRewardCPXTB: string;
  activatedAt: string;
  expiresAt: string;
  isActive: boolean;
  transactionHash: string;
  hasWithdrawn: boolean;
}

// Add Telegram Support Button Component
function TelegramSupport() {
  return (
    <a
      href="https://t.me/CPXTBase"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-white bg-[#229ED9] hover:bg-[#1e8bc3] rounded-md transition-colors"
    >
      <SiTelegram className="w-5 h-5" />
      Contact Support on Telegram
    </a>
  );
}

function ActivePlanDisplay({
  withdrawalAddress,
  dailyRewardCPXTB,
  activatedAt,
  planType,
  onClaim,
  isExpired,
  hasWithdrawn,
  amount,
  isAdmin,
  walletAddress,
  chain
}: {
  withdrawalAddress: string;
  dailyRewardCPXTB: string;
  activatedAt: string;
  planType: PlanType;
  onClaim: () => void;
  isExpired: boolean;
  hasWithdrawn: boolean;
  amount: string;
  isAdmin: boolean;
  walletAddress: string;
  chain: any;
}) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const activationDate = new Date(activatedAt);
  const endDate = new Date(activationDate);
  endDate.setDate(endDate.getDate() + (planType === 'weekly' ? 7 : 1));

  // Add useEffect for time remaining calculation
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      }
    };

    // Update immediately and then every minute
    updateTimeRemaining();
    const timer = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(timer);
  }, [endDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="bg-primary/10 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
            <Server className="h-6 w-6 animate-pulse" />
            Mining Plan Status
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={cn(
                "text-lg font-semibold flex items-center gap-2",
                isExpired ? "text-red-500" : "text-green-500"
              )}>
                <Cpu className="h-5 w-5 animate-pulse" />
                {isExpired ? "Expired" : "Active"}
                {!isExpired && (
                  <span className="text-sm font-normal ml-2">({timeRemaining})</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan Type</p>
              <p className="text-lg font-semibold capitalize">{planType} Plan ({amount} USDT)</p>
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
            {isAdmin && (
              <div>
                <p className="text-sm text-muted-foreground">User Wallet</p>
                <p className="text-sm font-mono break-all">{walletAddress}</p>
              </div>
            )}

            {isExpired && !hasWithdrawn && (
              <>
                {isAdmin ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Withdrawal Address (Base Network)
                    </p>
                    <p className="text-sm font-mono break-all mb-4">{withdrawalAddress}</p>
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={onClaim}
                    >
                      <Coins className="mr-2 h-4 w-4" />
                      {chain?.id !== 8453
                        ? "Switch to Base Network & Distribute CPXTB"
                        : "Distribute CPXTB Rewards"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground mt-4">
                    Waiting for CPXTB rewards distribution
                  </p>
                )}
              </>
            )}
            {isExpired && hasWithdrawn && (
              <p className="text-sm text-center text-muted-foreground mt-4">
                Rewards have been distributed
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MiningPlan() {
  // State management
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('weekly');
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [location] = useLocation();
  const referralCode = location.split('?')[1] ? new URLSearchParams(location.split('?')[1]).get('ref') : null;

  // Hooks
  const { toast } = useToast();
  const { isConnected, address, user } = useWallet();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchingNetwork } = useSwitchNetwork();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  // Queries
  const { data: activePlans = [], refetch: refetchActivePlans, isLoading: isLoadingActive } = useQuery({
    queryKey: ['activePlans', address],
    queryFn: async () => {
      if (!address) return [];
      const response = await fetch(`/api/mining-plans/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch active plans');
      }
      const data = await response.json();
      console.log('Active plans:', data.plans);
      return data.plans || [];
    },
    enabled: !!address
  });

  const { data: claimablePlansData = { plans: [], isAdmin: false }, refetch: refetchClaimablePlans, isLoading: isLoadingClaimable } = useQuery({
    queryKey: ['claimablePlans', address],
    queryFn: async () => {
      if (!address) return { plans: [], isAdmin: false };
      const response = await fetch(`/api/mining-plans/${address}/claimable`);
      if (!response.ok) {
        throw new Error('Failed to fetch claimable plans');
      }
      const data = await response.json();
      return data;
    },
    enabled: !!address
  });

  const claimablePlans = claimablePlansData.plans;
  const isAdmin = address?.toLowerCase() === TREASURY_ADDRESS.toLowerCase();

  // Current plan configuration
  const currentPlan = PLANS[selectedPlan];
  const cpxtbPrice = 0.002529;
  const dailyRewardCPXTB = (currentPlan.rewardUSD / cpxtbPrice).toFixed(2);

  // USDT Balance Check
  const { data: usdtBalance, isError: isBalanceError } = useContractRead({
    address: USDT_CONTRACT_ADDRESS as Address,
    abi: [
      {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {"name": "_to", "type": "address"},
          {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    functionName: 'balanceOf',
    args: [address as Address],
    enabled: !!address && chain?.id === 1,
    watch: true
  });

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

    if (!walletClient || !publicClient) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet and try again"
      });
      return;
    }

    try {
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

      const { request } = await publicClient.simulateContract({
        address: USDT_CONTRACT_ADDRESS as Address,
        abi: [
          {
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "", "type": "uint256"}],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
          },
          {
            "constant": false,
            "inputs": [
              {"name": "_to", "type": "address"},
              {"name": "_value", "type": "uint256"}
            ],
            "name": "transfer",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'transfer',
        args: [
          TREASURY_ADDRESS as Address,
          currentPlan.amount
        ],
        account: address as Address,
      });

      const hash = await walletClient.writeContract(request);
      setTransactionHash(hash);
      setIsValidating(true);

      let receipt = null;
      const maxRetries = 5;
      const retryDelay = 5000;
      const timeout = 120000;

      for (let i = 0; i < maxRetries; i++) {
        try {
          receipt = await Promise.race([
            publicClient.waitForTransactionReceipt({ hash }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Transaction confirmation timeout')), timeout)
            )
          ]);

          if (receipt && receipt.status === 'success') {
            break;
          }

          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } catch (error) {
          console.log(`Attempt ${i + 1} failed:`, error);
          if (i === maxRetries - 1) throw error;
        }
      }

      if (!receipt || receipt.status !== 'success') {
        throw new Error('Transaction failed or timed out');
      }

      setIsConfirmed(true);
      const activationTime = new Date().toISOString();
      const planDetails = {
        walletAddress: address as string,
        withdrawalAddress,
        planType: selectedPlan,
        amount: currentPlan.displayAmount,
        dailyRewardCPXTB,
        activatedAt: activationTime,
        expiresAt: new Date(new Date(activationTime).getTime() + (selectedPlan === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000).toISOString(),
        transactionHash: hash,
        referralCode: referralCode
      };

      console.log('Creating mining plan with details:', planDetails);

      const response = await fetch('/api/mining-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planDetails),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save mining plan');
      }

      // Refetch active plans and referral stats
      await refetchActivePlans();
      if (user?.referralCode) {
        await queryClient.invalidateQueries({ queryKey: ['referralStats', user.referralCode] });
      }

      toast({
        title: "Plan Activated",
        description: "Your mining plan has been successfully activated!"
      });

    } catch (error) {
      console.error('Transfer error:', error);
      setIsTransferring(false);
      setIsValidating(false);

      toast({
        variant: "destructive",
        title: "Transfer Failed",
        description: error instanceof Error
          ? `Error: ${error.message}. Please try again.`
          : "Failed to transfer USDT. Please try again."
      });
    } finally {
      setIsTransferring(false);
      setIsValidating(false);
    }
  };

  const handleClaimRewards = async (plan: MiningPlan) => {
    if (!walletClient || !publicClient) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to distribute rewards"
      });
      return;
    }

    // Log current chain information
    console.log('Current chain information:', {
      currentChainId: chain?.id,
      requiredChainId: BASE_CHAIN_ID,
      walletAddress: address,
      cpxtbContract: CPXTB_CONTRACT_ADDRESS,
      withdrawalAddress: plan.withdrawalAddress
    });

    // Check if we're on Base network
    if (chain?.id !== BASE_CHAIN_ID) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Base network to distribute CPXTB rewards"
      });

      try {
        await switchNetwork?.(BASE_CHAIN_ID);

        // Wait for the network switch to complete
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          if (chain?.id === BASE_CHAIN_ID) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        // Verify the switch was successful
        if (chain?.id !== BASE_CHAIN_ID) {
          toast({
            variant: "destructive",
            title: "Network Switch Required",
            description: "Please manually switch to Base network in your wallet and try again"
          });
          return;
        }
      } catch (error) {
        console.error('Failed to switch network:', error);
        toast({
          variant: "destructive",
          title: "Network Switch Failed",
          description: "Please manually switch to Base network in your wallet and try again"
        });
        return;
      }
    }

    try {
      setIsTransferring(true);

      // Configure public client with specific Base network settings
      const baseClient = createPublicClient({
        chain: baseChain,
        transport: http(BASE_RPC_URL)
      });

      // Pre-check: Verify contract code exists at the address
      console.log('Verifying contract at address:', CPXTB_CONTRACT_ADDRESS);
      try {
        const code = await baseClient.getBytecode({
          address: CPXTB_CONTRACT_ADDRESS as Address,
        });

        if (!code) {
          console.error('No bytecode found at address:', CPXTB_CONTRACT_ADDRESS);
          throw new Error(`No contract found at address ${CPXTB_CONTRACT_ADDRESS} on Base network`);
        }

        console.log('Contract bytecode found at address:', CPXTB_CONTRACT_ADDRESS, 'length:', code.length);

        // Verify contract implements ERC20 interface
        const name = await baseClient.readContract({
          address: CPXTB_CONTRACT_ADDRESS as Address,
          abi: ERC20_ABI,
          functionName: 'name'
        });
        console.log('CPXTB Contract name:', name);

        const balance = await baseClient.readContract({
          address: CPXTB_CONTRACT_ADDRESS as Address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as Address]
        });
        console.log('Admin CPXTB balance:', balance.toString());

        // Convert CPXTB amount to proper decimals (18 decimals)
        const rewardAmount = parseFloat(plan.dailyRewardCPXTB);
        const rewardInWei = BigInt(Math.floor(rewardAmount * 10 ** 18));

        if (balance < rewardInWei) {
          throw new Error(`Insufficient CPXTB balance. Required: ${rewardAmount}, Available: ${formatUnits(balance, 18)}`);
        }

        // Log transaction details
        console.log('Preparing CPXTB distribution:', {
          amount: rewardAmount,
          amountInWei: rewardInWei.toString(),
          withdrawalAddress: plan.withdrawalAddress,
          contractAddress: CPXTB_CONTRACT_ADDRESS,
          currentChain: chain?.id
        });

        // Final chain verification
        if (chain?.id !== BASE_CHAIN_ID) {
          throw new Error(`Wrong network. Expected Base (${BASE_CHAIN_ID}), got ${chain?.id}`);
        }

        // Create a wallet client specifically for Base
        const baseWalletClient = await walletClient.extend((config) => ({
          chain: baseChain,
          transport: config.transport
        }));

        // Simulate the transaction first
        const { request } = await baseClient.simulateContract({
          address: CPXTB_CONTRACT_ADDRESS as Address,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [plan.withdrawalAddress as Address, rewardInWei],
          account: address as Address
        });

        // Execute the transaction using the Base-specific wallet client
        const hash = await baseWalletClient.writeContract(request);
        setTransactionHash(hash);
        setIsValidating(true);

        const receipt = await baseClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
          await apiRequest("POST", `/api/mining-plans/${plan.id}/withdraw`, {
            transactionHash: hash
          });

          setIsConfirmed(true);
          await refetchClaimablePlans();
          await refetchActivePlans();

          toast({
            title: "Rewards Distributed",
            description: `Successfully sent ${plan.dailyRewardCPXTB} CPXTB to ${plan.withdrawalAddress}`
          });
        }
      } catch (error) {
        console.error('Contract interaction error:', error);
        throw new Error(`Contract verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Distribution error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to distribute rewards";
      console.error('Detailed error:', {
        error,
        chainId: chain?.id,
        contractAddress: CPXTB_CONTRACT_ADDRESS,
        withdrawalAddress: plan.withdrawalAddress
      });
      toast({
        variant: "destructive",
        title: "Distribution Failed",
        description: errorMessage
      });
    } finally {
      setIsTransferring(false);
      setIsValidating(false);
    }
  };

  // Render loading state
  if (isLoadingActive || isLoadingClaimable) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading mining plan status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ReferralStats />
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-6 w-6 text-primary animate-pulse" />
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
              <Cpu className="mr-2 h-4 w-4" />
              Daily Plan
            </Button>
            <Button
              variant={selectedPlan === 'weekly' ? 'default' : 'outline'}
              onClick={() => setSelectedPlan('weekly')}
              className="flex-1"
            >
              <Server className="mr-2 h-4 w-4" />
              Weekly Plan
            </Button>
          </div>

          <div className="bg-muted rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              {selectedPlan} Mining Plan Details
            </h3>
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

      {isConnected && activePlans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Active Mining Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlans.map((plan: MiningPlan) => (
              <ActivePlanDisplay
                key={plan.id}
                withdrawalAddress={plan.withdrawalAddress}
                dailyRewardCPXTB={plan.dailyRewardCPXTB}
                activatedAt={plan.activatedAt}
                planType={plan.planType}
                onClaim={() => handleClaimRewards(plan)}
                isExpired={new Date() > new Date(plan.expiresAt)}
                hasWithdrawn={plan.hasWithdrawn}
                amount={plan.amount}
                isAdmin={isAdmin}
                walletAddress={plan.walletAddress}
                chain={chain}
              />
            ))}
          </div>
        </div>
      )}

      {isConnected && claimablePlans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            {isAdmin ? "All Claimable Plans" : "Your Claimable Plans"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claimablePlans.map((plan: MiningPlan) => (
              <ActivePlanDisplay
                key={plan.id}
                withdrawalAddress={plan.withdrawalAddress}
                dailyRewardCPXTB={plan.dailyRewardCPXTB}
                activatedAt={plan.activatedAt}
                planType={plan.planType}
                onClaim={() => handleClaimRewards(plan)}
                isExpired={true}
                hasWithdrawn={plan.hasWithdrawn}
                amount={plan.amount}
                isAdmin={isAdmin}
                walletAddress={plan.walletAddress}
                chain={chain}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3 text-center">
          Need help? Contact our support team
        </p>
        <TelegramSupport />
      </div>
    </div>
  );
}