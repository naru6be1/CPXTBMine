import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Coins, MessageCircle, Server, Cpu, Gift } from "lucide-react";
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
const DAILY_PLAN_ALLOWED_ADDRESS = "0x01A72B983368DD0E599E0B1Fe7716b05A0C9DE77";

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
  transactionHash
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
}) {
  const isFreeClaimPlan = transactionHash === 'FREE_CPXTB_CLAIM';

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="bg-primary/10 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-primary mb-2 flex items-center gap-2">
            {isFreeClaimPlan ? (
              <>
                <Gift className="h-6 w-6" />
                Free CPXTB Claim
              </>
            ) : (
              <>
                <Server className="h-6 w-6 animate-pulse" />
                Mining Plan Status
              </>
            )}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={cn(
                "text-lg font-semibold flex items-center gap-2",
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
                  </>
                )}
              </p>
            </div>

            {!isFreeClaimPlan && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Plan Type</p>
                  <p className="text-lg font-semibold capitalize">{planType} Plan ({amount} USDT)</p>
                </div>
              </>
            )}

            <div>
              <p className="text-sm text-muted-foreground">CPXTB Reward</p>
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
                    >
                      <Coins className="mr-2 h-4 w-4" />
                      {chain?.id !== 8453
                        ? "Switch to Base Network & Distribute CPXTB"
                        : `Distribute ${dailyRewardCPXTB} CPXTB`}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground mt-4">
                    Waiting for CPXTB distribution from admin
                  </p>
                )}
              </>
            )}
            {hasWithdrawn && (
              <p className="text-sm text-center text-muted-foreground mt-4">
                CPXTB has been distributed
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Update the FreeCPXTBClaim component to show time until next claim
function FreeCPXTBClaim({ onClaim }: { onClaim: (withdrawalAddress: string) => void }) {
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const { address } = useWallet();
  const { data: user } = useQuery({
    queryKey: ['user', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(`/api/users/${address}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json().then(data => data.user);
    },
    enabled: !!address
  });

  const canClaim = !user?.lastFreeClaim ||
    (new Date().getTime() - new Date(user.lastFreeClaim).getTime()) >= 24 * 60 * 60 * 1000;

  const getTimeUntilNextClaim = () => {
    if (!user?.lastFreeClaim) return null;
    const nextClaimTime = new Date(user.lastFreeClaim);
    nextClaimTime.setHours(nextClaimTime.getHours() + 24);
    const now = new Date();
    const diff = nextClaimTime.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const timeUntilNextClaim = getTimeUntilNextClaim();

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-primary" />
          Free CPXTB Claim
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/10 rounded-lg p-4">
          <p className="text-lg font-semibold">Get 10 CPXTB for Free!</p>
          <p className="text-sm text-muted-foreground">
            Claim 10 CPXTB tokens once every 24 hours. Enter your Base network address to receive your tokens.
            {timeUntilNextClaim && (
              <span className="block mt-2">Next claim available in: {timeUntilNextClaim}</span>
            )}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="withdrawal-free">Base Network Address</Label>
          <Input
            id="withdrawal-free"
            placeholder="Enter your Base network address"
            value={withdrawalAddress}
            onChange={(e) => setWithdrawalAddress(e.target.value)}
          />
        </div>
        <Button
          className="w-full"
          onClick={() => onClaim(withdrawalAddress)}
          disabled={!withdrawalAddress || !canClaim}
        >
          <Gift className="mr-2 h-4 w-4" />
          {canClaim ? "Claim Free CPXTB" : "Wait for next claim period"}
        </Button>
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

    if (selectedPlan === 'daily' &&
      address?.toLowerCase() !== DAILY_PLAN_ALLOWED_ADDRESS.toLowerCase()) {
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "You are not authorized to use the daily plan"
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
      const activationTime = new Date();
      const expiresAt = new Date(activationTime.getTime() + (selectedPlan === 'weekly' ? 7 : 1) * 24 * 60 * 60 * 1000);

      const planDetails = {
        walletAddress: address as string,
        withdrawalAddress,
        planType: selectedPlan,
        amount: currentPlan.displayAmount,
        dailyRewardCPXTB,
        activatedAt: activationTime.toISOString(), // Pass Date object directly
        expiresAt: expiresAt.toISOString(), // Pass Date object directly
        transactionHash: hash,
        referralCode: referralCode
      };

      console.log('Creating mining plan with referral:', {
        referralCode: planDetails.referralCode,
        walletAddress: planDetails.walletAddress
      });

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
    if (chain?.id !== BASE_CHAIN_ID) {
      console.log('Current chain:', chain?.id, 'Switching to Base:', BASE_CHAIN_ID);

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
        title: "Rewards Distributed",
        description: `Successfully sent ${plan.dailyRewardCPXTB} CPXTB to ${plan.withdrawalAddress}`
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

  // Add this new function in the MiningPlan component
  const handleClaimFreeCPXTB = async (withdrawalAddress: string) => {
    try {
      const response = await fetch(`/api/users/${address}/claim-free-cpxtb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ withdrawalAddress }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      await refetchUser();
      await refetchActivePlans();

      toast({
        title: "Success!",
        description: "Your free 10 CPXTB tokens have been claimed successfully!"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to claim",
        description: error instanceof Error ? error.message : "Failed to claim free CPXTB"
      });
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

  // Add console.log to debug user data and rendering condition
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
          {/* This is where the edited code's conditional rendering is integrated */}
          {!user?.lastFreeClaim && (
            <FreeCPXTBClaim onClaim={handleClaimFreeCPXTB} />
          )}
          {user?.lastFreeClaim && (
            <p className="text-sm text-muted-foreground text-center">
              {user?.lastFreeClaim ?
                "You have already claimed your free CPXTB." :
                "Connect your wallet to claim free CPXTB."}
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
          <div className="flex gap-4 mb-6">
            {address?.toLowerCase() === DAILY_PLAN_ALLOWED_ADDRESS.toLowerCase() && (
              <Button
                variant={selectedPlan === 'daily' ? 'default' : 'outline'}
                onClick={() => setSelectedPlan('daily')}
                className="flex-1"
              >
                <Cpu className="mr-2 h-4 w-4" />
                Daily Plan
              </Button>
            )}
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
                transactionHash={plan.transactionHash}
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
                transactionHash={plan.transactionHash}
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