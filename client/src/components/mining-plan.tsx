import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Coins, MessageCircle, Server, Cpu, Gift, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useAccount, useContractRead, useNetwork, useSwitchNetwork, usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits } from "viem";
import { TransactionStatus } from "./transaction-status";
import { type Address } from 'viem';
import { SiTelegram } from 'react-icons/si';
import { FaTwitter } from 'react-icons/fa';
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ReferralStats } from "./referral-stats";
import { useLocation } from "wouter";
import { createPublicClient, http } from 'viem';
import { configureChains } from 'wagmi';
import { base } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

// Configure chains for wagmi
const { chains } = configureChains(
  [base],
  [publicProvider()]
);

// Constants
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Ethereum Mainnet USDT
const TREASURY_ADDRESS = "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27";
const CPXTB_CONTRACT_ADDRESS = "0x96A0cc3C0fc5D07818E763E1B25bc78ab4170D1b"; // Base network CPXTB
const WETH_CONTRACT_ADDRESS = "0x4300000000000000000000000000000000000004"; // Base network WETH
const BASE_CHAIN_ID = 8453;
const BASE_RPC_URL = "https://mainnet.base.org";

// Configure Base chain with correct settings
const baseChain = base;

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

// Update PlanType and PLANS configuration
type PlanType = 'bronze' | 'silver' | 'gold';

interface PlanConfig {
  amount: bigint;
  displayAmount: string;
  rewardUSD: number;
  duration: string;
  name: string;
  description: string;
  color: string;
}

// Plan configurations with enhanced tiers
const PLANS: Record<PlanType, PlanConfig> = {
  bronze: {
    amount: BigInt("100000"), // 0.1 USDT (6 decimals)
    displayAmount: "0.1",
    rewardUSD: 0.15,
    duration: "24 hours",
    name: "Bronze Plan",
    description: "Start mining with minimal investment",
    color: "bronze"
  },
  silver: {
    amount: BigInt("10000000"), // 10 USDT (6 decimals)
    displayAmount: "10",
    rewardUSD: 12, // Updated to 6 USD per day (12 USD for 48 hours)
    duration: "48 hours",
    name: "Silver Plan",
    description: "Enhanced mining power with better rewards (6 USD/day)",
    color: "silver"
  },
  gold: {
    amount: BigInt("100000000"), // 100 USDT (6 decimals)
    displayAmount: "100",
    rewardUSD: 140, // Updated to 20 USD per day (140 USD for 7 days)
    duration: "7 days",
    name: "Gold Plan",
    description: "Maximum mining power with highest rewards (20 USD/day)",
    color: "gold"
  }
};

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

// Update the ActivePlanDisplay component to handle free CPXTB claims
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
  chain,
  transactionHash,
  expiresAt
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
  transactionHash: string;
  expiresAt: string;
}) {
  const isFreeClaimPlan = transactionHash === 'FREE_CPXTB_CLAIM';
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const plan = PLANS[planType];

  // Add useEffect for time remaining calculation
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

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
  }, [expiresAt]);

  return (
    <Card className={`w-full border-${plan.color}`}>
      <CardContent className="pt-6">
        <div className={`bg-${plan.color}/10 rounded-lg p-6`}>
          <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
            {isFreeClaimPlan ? (
              <>
                <Gift className="h-6 w-6" />
                Free CPXTB Claim
              </>
            ) : (
              <>
                <Server className="h-6 w-6 animate-pulse" />
                {plan.name} Status
              </>
            )}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={cn(
                "text-lg font-semibold",
                isExpired ? "text-red-500" : "text-green-500"
              )}>
                {isFreeClaimPlan ? (
                  <>
                    <Gift className="h-5 w-5" />
                    {hasWithdrawn ? "Claimed" : "Ready to Claim"}
                  </>
                ) : (
                  <>
                    <Cpu className="h-5 w-5 animate-pulse" />
                    {isExpired ? "Expired" : "Active"}
                    {!isExpired && (
                      <span className="text-sm font-normal ml-2">({timeRemaining})</span>
                    )}
                  </>
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Plan Details</p>
              <p className="text-lg font-semibold">{plan.name} ({amount} USDT)</p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{plan.duration}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Daily CPXTB Reward</p>
              <p className="text-lg font-semibold">
                {planType === 'silver' ? '6' : planType === 'gold' ? '20' : '0.15'} USD
                <span className="text-sm text-muted-foreground ml-2">
                  ({(parseFloat(dailyRewardCPXTB) / (planType === 'gold' ? 7 : planType === 'silver' ? 2 : 1)).toFixed(2)} CPXTB per day)
                </span>
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Total Reward</p>
              <p className="text-lg font-semibold">{dailyRewardCPXTB} CPXTB</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Withdrawal Address</p>
              <p className="text-sm font-mono break-all">{withdrawalAddress}</p>
            </div>

            {isAdmin && (
              <div>
                <p className="text-sm text-muted-foreground">User Wallet</p>
                <p className="text-sm font-mono break-all">{walletAddress}</p>
              </div>
            )}

            {!hasWithdrawn && (
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
                      disabled={!isExpired}
                    >
                      <Coins className="mr-2 h-4 w-4" />
                      {chain?.id !== 8453
                        ? "Switch to Base Network & Distribute CPXTB"
                        : `Distribute ${dailyRewardCPXTB} CPXTB`}
                    </Button>
                  </div>
                ) : (
                  <>
                    {isExpired ? (
                      <p className="text-sm text-center text-muted-foreground mt-4">
                        {isFreeClaimPlan
                          ? "Waiting for admin to distribute your CPXTB claim"
                          : "Waiting for CPXTB distribution from admin"}
                      </p>
                    ) : (
                      <p className="text-sm text-center text-muted-foreground mt-4">
                        {isFreeClaimPlan
                          ? "Your CPXTB claim is being processed"
                          : `Plan will mature in ${timeRemaining}`}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
            {hasWithdrawn && (
              <p className="text-sm text-center text-muted-foreground mt-4">
                {isFreeClaimPlan
                  ? "CPXTB claim has been distributed"
                  : "CPXTB has been distributed"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Update the FreeCPXTBClaim component with stronger device-level restriction
function FreeCPXTBClaim({ onClaim }: { onClaim: () => void }) {
  const { isConnected, address } = useWallet();
  const [deviceCooldownMessage, setDeviceCooldownMessage] = useState<string>("");
  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(`/api/users/${address}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      return data.user;
    },
    enabled: !!address
  });

  useEffect(() => {
    // Generate a persistent device ID if not exists
    if (!localStorage.getItem('global_device_id')) {
      localStorage.setItem('global_device_id', `device_${Math.random().toString(36).substring(2)}`);
    }

    // Check device-wide cooldown
    const checkDeviceCooldown = () => {
      const lastDeviceClaim = localStorage.getItem('global_lastCPXTBClaimTime');
      console.log('Device cooldown check:', {
        deviceId: localStorage.getItem('global_device_id'),
        lastClaim: lastDeviceClaim,
        currentTime: new Date().toISOString()
      });

      if (lastDeviceClaim) {
        const lastClaimTime = new Date(lastDeviceClaim);
        const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const nextAvailableTime = new Date(lastClaimTime.getTime() + cooldownPeriod);
        const now = new Date();

        if (nextAvailableTime > now) {
          const diffMs = nextAvailableTime.getTime() - now.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setDeviceCooldownMessage(
            `Next claim available in ${hours}h ${minutes}m`
          );
        } else {
          setDeviceCooldownMessage("");
        }
      }
    };

    // Check immediately and then update every second
    checkDeviceCooldown();
    const interval = setInterval(checkDeviceCooldown, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const handleClaim = async () => {
    try {
      // Check device cooldown before proceeding
      const lastDeviceClaim = localStorage.getItem('global_lastCPXTBClaimTime');
      if (lastDeviceClaim) {
        const lastClaimTime = new Date(lastDeviceClaim);
        const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const nextAvailableTime = new Date(lastClaimTime.getTime() + cooldownPeriod);
        const now = new Date();

        if (nextAvailableTime > now) {
          console.log('Claim blocked by device cooldown:', {
            deviceId: localStorage.getItem('global_device_id'),
            lastClaim: lastDeviceClaim,
            nextAvailable: nextAvailableTime.toISOString(),
            currentTime: new Date().toISOString()
          });
          return; // Don't proceed if device is in cooldown
        }
      }

      await onClaim();

      // Store both device ID and claim time for global device-wide tracking
      localStorage.setItem('global_lastCPXTBClaimTime', new Date().toISOString());
      console.log('Claim successful, updated device cooldown:', {
        deviceId: localStorage.getItem('global_device_id'),
        claimTime: new Date().toISOString()
      });
    } catch (error) {
      console.error('Claim error:', error);
    }
  };

  if (!isConnected || !address) {
    return (
      <Card className="w-full max-w-2xl mx-auto mb-6">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            Please connect your wallet to claim free CPXTB.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isDeviceCoolingDown = !!deviceCooldownMessage;

  if (isDeviceCoolingDown) {
    return (
      <Card className="w-full max-w-2xl mx-auto mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Daily Free CPXTB Claim
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 rounded-lg p-4">
            <p className="text-lg font-semibold text-destructive">Device Cooldown Active</p>
            <p className="text-sm text-muted-foreground">
              {deviceCooldownMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          Daily Free CPXTB Claim
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="text-lg font-semibold">Get 10 CPXTB Daily!</p>
          <p className="text-sm text-muted-foreground">
            Claim 10 CPXTB tokens every 24 hours. Your connected wallet address ({address}) will be used to receive the tokens.
          </p>
        </div>
        <Button
          className="w-full"
          onClick={handleClaim}
          disabled={isDeviceCoolingDown}
        >
          <Gift className="mr-2 h-4 w-4" />
          Claim Free CPXTB
        </Button>
      </CardContent>
    </Card>
  );
}

// Add social sharing component
const createShareMessage = (amount: string, type: 'claim' | 'reward') => {
  const baseMessage = type === 'claim'
    ? `Just claimed ${amount} CPXTB tokens on CPXTBMining! 🎉`
    : `Successfully earned ${amount} CPXTB from my mining rewards! 💰`;
  return `${baseMessage}\n\nJoin the mining revolution: https://cpxtbmining.com`;
};

// Update the SocialShareButtons component
function SocialShareButtons({ amount, type }: { amount: string, type: 'claim' | 'reward' }) {
  const message = createShareMessage(amount, type);
  const encodedMessage = encodeURIComponent(message);

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodedMessage}`, '_blank');
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=https://cpxtbmining.com&text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex gap-2 justify-center mt-4">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={shareToTwitter}
      >
        <FaTwitter className="w-4 h-4 text-[#1DA1F2]" />
        Share on Twitter
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={shareToTelegram}
      >
        <SiTelegram className="w-4 h-4 text-[#229ED9]" />
        Share on Telegram
      </Button>
    </div>
  );
}


// Update the handleDistributeAll function
const handleDistributeAll = async () => {
  try {
    setIsTransferring(true);

    // First, verify and enforce Base network
    await verifyBaseNetwork();

    toast({
      title: "Processing Distributions",
      description: "Starting the distribution process, please wait..."
    });

    const response = await fetch('/api/mining-plans/distribute-all', {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Distribution results:', data);

    const successCount = data.results.filter((r: any) => r.success).length;
    const failedCount = data.results.length - successCount;

    toast({
      variant: successCount > 0 ? "default" : "destructive",
      title: "Distribution Status",
      description: `${data.message}${failedCount > 0 ?
        `\nFailed distributions: ${failedCount}. Check Base network connection or try again.` : ''}`
    });

    // Refresh the plans
    await refetchClaimablePlans();
    await refetchActivePlans();
  } catch (error) {
    console.error('Distribution error:', error);
    toast({ variant: "destructive",
      title: "Distribution Failed",
      description: error instanceof Error ? error.message : "Failed to process distributions"
    });
  } finally {
    setIsTransferring(false);
  }
};

// Update mining plan selection UI
function MiningPlanSelection({ onSelect }: { onSelect: (plan: PlanType) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {(Object.entries(PLANS) as [PlanType, PlanConfig][]).map(([type, plan]) => (
        <Card
          key={type}
          className={`cursor-pointer hover:border-${plan.color} transition-colors`}
          onClick={() => onSelect(type)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className={`h-6 w-6 text-${plan.color}`} />
              {plan.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold">{plan.displayAmount} USDT</p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="space-y-1">
                <p className="text-sm">✓ {plan.duration} duration</p>
                <p className="text-sm">✓ Daily Reward: {type === 'silver' ? '6' : type === 'gold' ? '20' : '0.15'} USD</p>
                <p className="text-sm text-muted-foreground">({(plan.rewardUSD / 0.002529).toFixed(2)} CPXTB total)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MiningPlan() {
  // State management
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('bronze');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [location] = useLocation();
  const referralCode = location.split('?')[1] ? new URLSearchParams(location.split('?')[1]).get('ref') : null;

  // Hooks
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
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

  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ['user', address],
    queryFn: async () => {
      if (!address) return null;
      console.log('Fetching user data for address:', address);
      const apiUrl = referralCode
        ? `/api/users/${address}?ref=${referralCode}`
        : `/api/users/${address}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      console.log('Received user data:', data);
      return data.user;
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

    if (!address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to continue"
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

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      setIsConfirmed(true);
      const activationTime = new Date();
      const expiresAt = new Date(activationTime.getTime() + (selectedPlan === 'gold' ? 7 : (selectedPlan === 'silver' ? 2 : 1)) * 24 * 60 * 60 * 1000);

      const planDetails = {
        walletAddress: address,
        withdrawalAddress: address, // Use connected address for withdrawals
        planType: selectedPlan,
        amount: currentPlan.displayAmount,
        dailyRewardCPXTB,
        activatedAt: activationTime.toISOString(), // Pass Date object directly
        expiresAt: expiresAt.toISOString(), // Pass Date object directly
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

  // Function to verify and enforce Base network
  const verifyBaseNetwork = async () => {
    if (chain?.id !== BASE_CHAIN_ID) {      console.log('Current chain:', chain?.id, 'Switchingto Base:', BASE_CHAIN_ID);

      try {
        if (!switchNetwork) {
          throw new Error('Network switching not supported');
        }

        await switchNetwork(BASE_CHAIN_ID);

        // Wait for network switch with timeout
        const timeout = 30000; // 30 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
          if (chain?.id === BASE_CHAIN_ID) {
            console.log('Successfully switched to Base network');
            return true;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Waiting for network switch, current chain:', chain?.id);
        }

        throw new Error('Network switch timeout');
      } catch (error) {
        console.error('Network switch error:', error);
        throw new Error(`Failed to switch to Base network: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    return true;
  };

  const handleClaimRewards = async (plan: MiningPlan) => {
    try {
      // First, verify and enforce Base network
      await verifyBaseNetwork();

      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }

      // Create Base-specific client
      const baseClient = createPublicClient({
        chain: baseChain,
        transport: http(BASE_RPC_URL)
      });

      // Verify contract exists
      const code = await baseClient.getBytecode({
        address: CPXTB_CONTRACT_ADDRESS as Address
      });

      if (!code) {
        throw new Error(`No contract found at ${CPXTB_CONTRACT_ADDRESS} on Base network`);
      }

      console.log('Contract verification successful');

      // Convert reward amount to proper decimals (18 decimals for CPXTB)
      const rewardAmount = parseFloat(plan.dailyRewardCPXTB);
      const rewardInWei = BigInt(Math.floor(rewardAmount * 10 ** 18));

      console.log('Distribution details:', {
        amount: rewardAmount,
        amountInWei: rewardInWei.toString(),
        recipient: plan.withdrawalAddress,
        contract: CPXTB_CONTRACT_ADDRESS,
        chainId: chain?.id
      });

      // Use the wallet client directly with the Base chain
      const { request } = await baseClient.simulateContract({
        address: CPXTB_CONTRACT_ADDRESS as Address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [plan.withdrawalAddress as Address, rewardInWei],
        account: address as Address,
        chain: baseChain
      });

      // Execute the transaction
      const hash = await walletClient.writeContract({
        ...request,
        chain: baseChain
      });

      setTransactionHash(hash);
      setIsValidating(true);

      const receipt = await baseClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      // Update backend
      await apiRequest("POST", `/api/mining-plans/${plan.id}/withdraw`, {
        transactionHash: hash
      });

      setIsConfirmed(true);
      await refetchClaimablePlans();
      await refetchActivePlans();

      toast({
        title: "Success!",
        description: (
          <div className="space-y-2">
            <p>Successfully distributed {plan.dailyRewardCPXTB} CPXTB!</p>
            <SocialShareButtons amount={plan.dailyRewardCPXTB} type="reward" />
          </div>
        )
      });

    } catch (error) {
      console.error('Distribution error:', error);
      toast({
        variant: "destructive",
        title: "Distribution Failed",
        description: error instanceof Error ? error.message : "Failed to distribute rewards"
      });
    } finally {
      setIsTransferring(false);
      setIsValidating(false);
    }
  };

  // Handle free CPXTB claim
  const handleClaimFreeCPXTB = async () => {
    if (!address || !isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim free CPXTB"
      });
      return;
    }

    // Check device cooldown before proceeding
    const lastDeviceClaim = localStorage.getItem('global_lastCPXTBClaimTime');
    if (lastDeviceClaim) {
      const lastClaimTime = new Date(lastDeviceClaim);
      const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const nextAvailableTime = new Date(lastClaimTime.getTime() + cooldownPeriod);
      const now = new Date();

      if (nextAvailableTime > now) {
        const diffMs = nextAvailableTime.getTime() - now.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        toast({
          variant: "destructive",
          title: "Device Cooldown Active",
          description: `Please wait ${hours}h ${minutes}m before claiming from this device`
        });
        return;
      }
    }

    try {
      const response = await fetch(`/api/users/${address}/claim-free-cpxtb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ withdrawalAddress: address }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      // Store the claim time in localStorage for global device tracking
      localStorage.setItem('global_lastCPXTBClaimTime', new Date().toISOString());

      await refetchUser();
      await refetchActivePlans();

      toast({
        title: "Success!",
        description: (
          <div className="space-y-2">
            <p>Your free 10 CPXTB tokens have been claimed successfully!</p>
            <SocialShareButtons amount="10" type="claim" />
          </div>
        )
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to claim",
        description: error instanceof Error ? error.message : "Failed to claim free CPXTB"
      });
    }
  };

  // Update the handleDistributeAll function
  const handleDistributeAll = async () => {
    try {
      setIsTransferring(true);

      // First, verify and enforce Base network
      await verifyBaseNetwork();

      toast({
        title: "Processing Distributions",
        description: "Starting the distribution process, please wait..."
      });

      const response = await fetch('/api/mining-plans/distribute-all', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      console.log('Distribution results:', data);

      const successCount = data.results.filter((r: any) => r.success).length;
      const failedCount = data.results.length - successCount;

      toast({
        variant: successCount > 0 ? "default" : "destructive",
        title: "Distribution Status",
        description: `${data.message}${failedCount > 0 ?
          `\nFailed distributions: ${failedCount}. Check Base network connection or try again.` : ''}`
      });

      // Refresh the plans
      await refetchClaimablePlans();
      await refetchActivePlans();
    } catch (error) {
      console.error('Distribution error:', error);
      toast({ variant: "destructive",
        title: "Distribution Failed",
        description: error instanceof Error ? error.message : "Failed to process distributions"
      });
    } finally {
      setIsTransferring(false);
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

  console.log('User data in component:', {
    isConnected,
    address,
    user,
    hasClaimedFreeCPXTB: user?.hasClaimedFreeCPXTB
  });

  return (
    <div className="space-y-6">
      <ReferralStats />
      {isConnected && (
        <div>
          {!user?.hasClaimedFreeCPXTB ? (
            <FreeCPXTBClaim onClaim={handleClaimFreeCPXTB} />
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              You have already claimed your free CPXTB.
            </p>
          )}
        </div>
      )}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-6 w-6 text-primary animate-pulse" />
            Mining Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <MiningPlanSelection onSelect={setSelectedPlan} />
          <div className="bg-muted rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              {currentPlan.name} Details
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
            <p className="text-sm text-muted-foreground text-center">
              Your connected wallet address will be used to receive CPXTB rewards.
            </p>

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
                      `Activate ${currentPlan.name} (${currentPlan.displayAmount} USDT)`}
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
                transactionHash={plan.transactionHash}
                expiresAt={plan.expiresAt}
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
          <div className="grid gridcols-1 md:grid-cols-2 gap-4">
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
                transactionHash={plan.transactionHash}
                expiresAt={plan.expiresAt}
              />
            ))}
          </div>
        </div>
      )}

      {/* Update the admin actions card */}
      {isAdmin && (
        <Card className="w-full max-w-2xl mx-auto mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-primary" />
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleDistributeAll}
              className="w-full"
              variant="default"
              disabled={isTransferring}
            >
              {isTransferring ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing Distributions...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Distribute All Matured Plans
                </>
              )}
            </Button>
          </CardContent>
        </Card>
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