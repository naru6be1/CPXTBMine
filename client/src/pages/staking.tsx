import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowRight, Calendar, Clock, Coins, LockKeyhole, Trophy, Wallet } from "lucide-react";

// Types for staking data
interface StakingPlan {
  id: number;
  name: string;
  description: string;
  minAmount: string;
  lockPeriodDays: number;
  aprPercentage: string;
  isActive: boolean;
}

interface StakingPosition {
  id: number;
  userId: number;
  stakingPlanId: number;
  walletAddress: string;
  amountStaked: string;
  rewardsEarned: string;
  lastRewardCalculation: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  transactionHash: string;
  withdrawalTransactionHash: string | null;
  hasWithdrawn: boolean;
}

interface StakingStats {
  activePositionsCount: number;
  totalStaked: string;
  totalRewards: string;
  totalPlatformStake: string;
}

export default function StakingPage() {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: tokenBalance } = useBalance({
    address,
    token: "0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b" as `0x${string}`,
    enabled: !!address,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stakingAmount, setStakingAmount] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  
  // Fetch staking plans
  const { data: stakingPlans = [] } = useQuery({
    queryKey: ["/api/staking/plans"],
    queryFn: async () => {
      const res = await fetch("/api/staking/plans?activeOnly=true");
      if (!res.ok) throw new Error("Failed to fetch staking plans");
      return res.json();
    },
  });
  
  // Fetch active staking positions
  const { data: activePositions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["/api/staking/positions/active"],
    queryFn: async () => {
      if (!user) return [];
      try {
        const res = await apiRequest("GET", "/api/staking/positions/active");
        if (!res.ok) throw new Error("Failed to fetch active positions");
        return await res.json();
      } catch (error) {
        console.error("Error fetching staking positions:", error);
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Fetch completed staking positions
  const { data: completedPositions = [] } = useQuery({
    queryKey: ["/api/staking/positions/completed"],
    queryFn: async () => {
      if (!user) return [];
      try {
        const res = await apiRequest("GET", "/api/staking/positions/completed");
        if (!res.ok) throw new Error("Failed to fetch completed positions");
        return await res.json();
      } catch (error) {
        console.error("Error fetching completed positions:", error);
        return [];
      }
    },
    enabled: !!user,
  });
  
  // Fetch staking stats
  const { data: stakingStats } = useQuery({
    queryKey: ["/api/staking/stats"],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await apiRequest("GET", "/api/staking/stats");
        if (!res.ok) throw new Error("Failed to fetch staking stats");
        return await res.json();
      } catch (error) {
        console.error("Error fetching staking stats:", error);
        return null;
      }
    },
    enabled: !!user,
  });
  
  // Mutation for creating a staking position
  const stakingMutation = useMutation({
    mutationFn: async ({ planId, amount }: { planId: number, amount: string }) => {
      if (!walletConnected || !address) {
        throw new Error("Wallet not connected");
      }
      
      // First, initiate the blockchain transaction
      // This is a simplified example - in a real app, you would:
      // 1. Create a smart contract call to approve tokens for staking
      // 2. Create another call to transfer tokens to the staking contract
      // Here we're just simulating the transaction hash
      
      // Simulate a transaction hash - in a real implementation, this would come from the blockchain
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      // Then record the staking position on our backend
      const res = await apiRequest("POST", "/api/staking/positions", {
        stakingPlanId: planId,
        walletAddress: address,
        amountStaked: amount,
        startDate: new Date().toISOString(),
        transactionHash: txHash,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create staking position");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Staking successful",
        description: "Your tokens have been staked successfully!",
      });
      
      // Clear form and refresh data
      setStakingAmount("");
      setSelectedPlanId(null);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/staking/positions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Staking failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating rewards
  const updateRewardsMutation = useMutation({
    mutationFn: async (positionId: number) => {
      const res = await apiRequest("POST", `/api/staking/positions/${positionId}/update-rewards`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update rewards");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rewards updated",
        description: `Added ${parseFloat(data.rewardsAdded).toFixed(8)} CPXTB to your rewards!`,
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/staking/positions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update rewards",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for withdrawing a position
  const withdrawMutation = useMutation({
    mutationFn: async (positionId: number) => {
      // Simulate a transaction hash - in a real implementation, this would come from the blockchain
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      const res = await apiRequest("POST", `/api/staking/positions/${positionId}/withdraw`, {
        transactionHash: txHash,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to withdraw staking position");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal successful",
        description: "Your staked tokens and rewards have been withdrawn!",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/staking/positions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/positions/completed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staking/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleStakeTokens = async () => {
    if (!selectedPlanId) {
      toast({
        title: "No plan selected",
        description: "Please select a staking plan first",
        variant: "destructive",
      });
      return;
    }
    
    if (!stakingAmount || parseFloat(stakingAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid staking amount",
        variant: "destructive",
      });
      return;
    }
    
    const selectedPlan = stakingPlans.find((plan: StakingPlan) => plan.id === selectedPlanId);
    if (!selectedPlan) {
      toast({
        title: "Plan not found",
        description: "The selected staking plan could not be found",
        variant: "destructive",
      });
      return;
    }
    
    // Check if staking amount meets minimum requirement
    if (parseFloat(stakingAmount) < parseFloat(selectedPlan.minAmount)) {
      toast({
        title: "Insufficient amount",
        description: `The minimum staking amount for this plan is ${selectedPlan.minAmount} CPXTB`,
        variant: "destructive",
      });
      return;
    }
    
    // Check if user has enough balance
    if (parseFloat(balance || "0") < parseFloat(stakingAmount)) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough CPXTB tokens in your wallet",
        variant: "destructive",
      });
      return;
    }
    
    // Execute staking
    stakingMutation.mutate({ planId: selectedPlanId, amount: stakingAmount });
  };
  
  const handleUpdateRewards = (positionId: number) => {
    updateRewardsMutation.mutate(positionId);
  };
  
  const handleWithdraw = (positionId: number) => {
    withdrawMutation.mutate(positionId);
  };
  
  // Helper function to format CPXTB amounts
  const formatCPXTB = (amount: string | number) => {
    return parseFloat(amount.toString()).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }) + " CPXTB";
  };
  
  // Check if a position is ready to withdraw (lock period ended)
  const isWithdrawable = (position: StakingPosition) => {
    const endDate = new Date(position.endDate);
    return endDate <= new Date();
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">CPXTB Staking</h1>
      
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Staked</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stakingStats ? formatCPXTB(stakingStats.totalStaked) : "0 CPXTB"}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Rewards Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stakingStats ? formatCPXTB(stakingStats.totalRewards) : "0 CPXTB"}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stakingStats?.activePositionsCount || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Platform Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stakingStats ? formatCPXTB(stakingStats.totalPlatformStake) : "0 CPXTB"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Staking Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stakingPlans.map((plan: StakingPlan) => (
            <Card key={plan.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selectedPlanId === plan.id ? 'border-primary border-2' : ''}`}
              onClick={() => setSelectedPlanId(plan.id)}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">APR:</span>
                    <span className="font-bold text-green-600">{plan.aprPercentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lock Period:</span>
                    <span>{plan.lockPeriodDays} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Min Amount:</span>
                    <span>{formatCPXTB(plan.minAmount)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant={selectedPlanId === plan.id ? "default" : "outline"} className="w-full">
                  {selectedPlanId === plan.id ? "Selected" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Stake CPXTB Tokens</CardTitle>
            <CardDescription>Lock your CPXTB tokens to earn passive interest</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!walletConnected ? (
                <Button onClick={connectWallet} className="w-full">Connect Wallet to Stake</Button>
              ) : (
                <>
                  <div>
                    <Label htmlFor="stake-amount">Amount to Stake</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="stake-amount"
                        type="number"
                        placeholder="Enter CPXTB amount"
                        value={stakingAmount}
                        onChange={(e) => setStakingAmount(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" 
                          onClick={() => setStakingAmount(balance || "0")}>
                          Max
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Available Balance: {formatCPXTB(balance || "0")}
                    </p>
                  </div>
                  
                  {selectedPlanId ? (
                    <div className="bg-primary/10 p-3 rounded-md">
                      <h4 className="font-medium mb-2">Selected Plan</h4>
                      {(() => {
                        const plan = stakingPlans.find((p: StakingPlan) => p.id === selectedPlanId);
                        if (!plan) return <p>No plan selected</p>;
                        return (
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Name</p>
                              <p className="font-medium">{plan.name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">APR</p>
                              <p className="font-medium text-green-600">{plan.aprPercentage}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Lock Period</p>
                              <p className="font-medium">{plan.lockPeriodDays} days</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Please select a staking plan above</p>
                  )}
                  
                  <Button 
                    onClick={handleStakeTokens} 
                    disabled={!selectedPlanId || !stakingAmount || parseFloat(stakingAmount) <= 0 || stakingMutation.isPending}
                    className="w-full"
                  >
                    {stakingMutation.isPending ? "Processing..." : "Stake CPXTB Tokens"}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <Tabs defaultValue="active">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Staking Positions</h2>
            <TabsList>
              <TabsTrigger value="active">Active Positions</TabsTrigger>
              <TabsTrigger value="completed">Completed Positions</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="active">
            {isLoadingPositions ? (
              <div className="text-center py-8">
                <p>Loading your staking positions...</p>
              </div>
            ) : activePositions.length > 0 ? (
              <div className="space-y-4">
                {activePositions.map((position: StakingPosition) => {
                  const stakingPlan = stakingPlans.find((plan: StakingPlan) => plan.id === position.stakingPlanId);
                  const startDate = new Date(position.startDate);
                  const endDate = new Date(position.endDate);
                  const progressPercent = Math.min(
                    100,
                    ((new Date().getTime() - startDate.getTime()) / 
                     (endDate.getTime() - startDate.getTime())) * 100
                  );
                  return (
                    <Card key={position.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{stakingPlan?.name || `Plan #${position.stakingPlanId}`}</CardTitle>
                          <Badge variant={isWithdrawable(position) ? "default" : "secondary"}>
                            {isWithdrawable(position) ? "Ready to Withdraw" : "Locked"}
                          </Badge>
                        </div>
                        <CardDescription>APR: {stakingPlan?.aprPercentage || "0"}%</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Staked Amount</p>
                              <p className="font-bold">{formatCPXTB(position.amountStaked)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Rewards Earned</p>
                              <p className="font-bold text-green-600">{formatCPXTB(position.rewardsEarned)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">Start Date</p>
                                <p>{format(startDate, 'MMM d, yyyy')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm text-muted-foreground">End Date</p>
                                <p>{format(endDate, 'MMM d, yyyy')}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-muted-foreground">Staking Progress</span>
                              <span className="text-sm">
                                {endDate > new Date() 
                                  ? `Unlocks in ${formatDistanceToNow(endDate, { addSuffix: false })}`
                                  : "Ready to withdraw"}
                              </span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => handleUpdateRewards(position.id)}
                          disabled={updateRewardsMutation.isPending}
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          {updateRewardsMutation.isPending ? "Updating..." : "Update Rewards"}
                        </Button>
                        
                        <Button 
                          onClick={() => handleWithdraw(position.id)}
                          disabled={!isWithdrawable(position) || withdrawMutation.isPending}
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <LockKeyhole className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-xl font-medium">No Active Staking Positions</h3>
                <p className="text-muted-foreground mt-1">Stake your CPXTB tokens to start earning rewards</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {completedPositions.length > 0 ? (
              <div className="space-y-4">
                {completedPositions.map((position: StakingPosition) => {
                  const stakingPlan = stakingPlans.find((plan: StakingPlan) => plan.id === position.stakingPlanId);
                  return (
                    <Card key={position.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{stakingPlan?.name || `Plan #${position.stakingPlanId}`}</CardTitle>
                          <Badge variant="outline">{position.hasWithdrawn ? "Withdrawn" : "Expired"}</Badge>
                        </div>
                        <CardDescription>
                          {format(new Date(position.startDate), 'MMM d, yyyy')} - {format(new Date(position.endDate), 'MMM d, yyyy')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Staked Amount</p>
                            <p className="font-bold">{formatCPXTB(position.amountStaked)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Rewards</p>
                            <p className="font-bold text-green-600">{formatCPXTB(position.rewardsEarned)}</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="w-full truncate">
                          <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                          <p className="text-xs font-mono truncate">
                            {position.hasWithdrawn ? position.withdrawalTransactionHash : position.transactionHash}
                          </p>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <Coins className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-xl font-medium">No Completed Positions</h3>
                <p className="text-muted-foreground mt-1">Your completed staking history will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How Staking Works</CardTitle>
          <CardDescription>Earn passive income by locking your CPXTB tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <LockKeyhole className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">1. Choose a Staking Plan</h3>
                <p className="text-sm text-muted-foreground">Select from our different staking plans with varying APR rates and lock periods.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">2. Stake Your Tokens</h3>
                <p className="text-sm text-muted-foreground">Lock your CPXTB tokens for the duration of the staking period.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">3. Earn Rewards</h3>
                <p className="text-sm text-muted-foreground">Rewards accrue based on your staking plan's APR. Update your rewards regularly to see your earnings grow.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">4. Withdraw When Ready</h3>
                <p className="text-sm text-muted-foreground">Once the lock period ends, withdraw your staked tokens along with all earned rewards.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}