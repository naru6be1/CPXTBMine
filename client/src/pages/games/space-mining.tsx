import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Star, ArrowLeft, Coins } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useIsMobile } from '@/hooks/use-mobile';

interface Mineral {
  id: number;
  x: number;
  y: number;
  value: number;
}

// Constants
const POINTS_PER_CPXTB = 10; // Lower to make it easier to accumulate

export default function SpaceMiningGame() {
  const [score, setScore] = useState(0);
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds game duration
  const controls = useAnimation();
  const { toast } = useToast();
  const { address, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Query for user data and registration
  const { data: userData } = useQuery({
    queryKey: ['userData', address],
    queryFn: async () => {
      if (!address) return null;
      const response = await fetch(`/api/users/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch/create user');
      }
      return response.json();
    },
    enabled: !!address
  });

  // Query for accumulated CPXTB
  const { data: gameStats, refetch: refetchGameStats } = useQuery({
    queryKey: ['gameStats', address],
    queryFn: async () => {
      if (!address) return { accumulatedCPXTB: '0' };
      const response = await fetch(`/api/games/stats/${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch game stats');
      }
      return await response.json();
    },
    enabled: !!address && !!userData
  });

  // Mutation for claiming accumulated CPXTB
  const claimCPXTBMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Wallet not connected');
      
      console.log('Attempting to claim CPXTB:', {
        walletAddress: address,
        accumulatedAmount: gameStats?.accumulatedCPXTB || '0',
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch('/api/games/claim-cpxtb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim CPXTB');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "CPXTB Claimed Successfully!",
        description: "Your CPXTB rewards have been sent to your wallet.",
      });
      // Refetch stats to update the UI
      refetchGameStats();
    },
    onError: (error) => {
      console.error('Error claiming CPXTB:', error);
      toast({
        title: "Error Claiming CPXTB",
        description: error instanceof Error ? error.message : "Failed to claim CPXTB",
        variant: "destructive"
      });
    }
  });

  // Calculate CPXTB with precision handling
  const calculateCPXTB = (points: number): string => {
    // Ensure we're working with positive numbers
    const rawPoints = Math.max(0, points);
    // Calculate with 3 decimal places precision
    const cpxtb = (rawPoints / POINTS_PER_CPXTB).toFixed(3);

    console.log('CPXTB Calculation:', {
      rawPoints,
      cpxtb,
      pointsPerCPXTB: POINTS_PER_CPXTB,
      timestamp: new Date().toISOString()
    });

    return cpxtb;
  };

  // Initialize game
  const startGame = () => {
    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to play and earn CPXTB rewards.",
        variant: "destructive"
      });
      return;
    }

    setGameStarted(true);
    setScore(0);
    setTimeLeft(60);
    spawnMinerals();
  };

  // Spawn minerals randomly with adjustments for mobile devices
  const spawnMinerals = () => {
    const newMinerals: Mineral[] = [];
    // Add more minerals on mobile for easier tapping
    const mineralCount = isMobile ? 7 : 5;
    console.log('Spawning minerals for platform:', {
      isMobile,
      mineralCount,
      timestamp: new Date().toISOString()
    });
    
    for (let i = 0; i < mineralCount; i++) {
      newMinerals.push({
        id: Date.now() + Math.random(),
        // More spread out minerals for mobile
        x: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
        y: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
        // Higher value minerals on mobile
        value: Math.floor(Math.random() * 50) + (isMobile ? 20 : 10)
      });
    }
    setMinerals(newMinerals);
  };

  // Handle mineral collection with improved event detection for mobile
  const collectMineral = (mineral: Mineral) => {
    try {
      // Add a clear log when a mineral is clicked
      console.log('Mineral clicked:', {
        mineralId: mineral.id,
        mineralValue: mineral.value,
        mineralPosition: { x: mineral.x, y: mineral.y },
        timestamp: new Date().toISOString()
      });
      
      // Ensure the value is positive with a guaranteed minimum
      const mineralValue = Math.max(20, mineral.value); // Higher minimum value of 20
      
      // Show visual feedback with animation on collection
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 }
      });
      
      // Update score with the new value
      const newScore = score + mineralValue;
      setScore(newScore);
  
      console.log('Score updated:', {
        previousScore: score,
        addedValue: mineralValue,
        newScore: newScore,
        estimatedCPXTB: calculateCPXTB(newScore),
        timestamp: new Date().toISOString()
      });
  
      // Remove the collected mineral
      setMinerals(prev => prev.filter(m => m.id !== mineral.id));
  
      // Spawn new mineral with guaranteed value, using mobile-friendly settings if on mobile
      const newMineral: Mineral = {
        id: Date.now() + Math.random(), // More unique ID
        // Keep minerals appropriately placed and sized for device
        x: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
        y: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
        // Higher value minerals on mobile
        value: Math.floor(Math.random() * 50) + (isMobile ? 20 : 10)
      };
      
      // Add the new mineral
      setMinerals(prev => [...prev, newMineral]);
  
      // Show immediate feedback with toast - smaller and more compact for mobile
      toast({
        title: `+${mineralValue} points!`,
        description: `Current CPXTB: ${calculateCPXTB(newScore)}`,
        duration: 1500, // shorter duration
      });
    } catch (error) {
      console.error('Error collecting mineral:', error);
      toast({
        title: "Error collecting mineral",
        description: "There was a problem collecting this mineral. Try another one.",
        variant: "destructive"
      });
    }
  };

  // Handle game end with better error handling
  const handleGameEnd = async () => {
    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to save your game rewards.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Calculate earned CPXTB without flooring the score
      const earnedCPXTB = score > 0 ? calculateCPXTB(score) : "0.000";
      
      // Make sure we're only recording scores greater than 0
      if (score <= 0) {
        console.log('Game ended with zero score - skipping submission');
        toast({
          title: "No points earned",
          description: "You need to collect minerals to earn CPXTB!",
        });
        return;
      }
      
      console.log('Game ended - submitting score:', {
        walletAddress: address,
        finalScore: score,
        earnedCPXTB,
        earnedCPXTBType: typeof earnedCPXTB,
        earnedCPXTBFloat: parseFloat(earnedCPXTB),
        pointsPerCPXTB: POINTS_PER_CPXTB,
        timestamp: new Date().toISOString()
      });

      const response = await fetch('/api/games/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          score,
          earnedCPXTB
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save game score');
      }

      const result = await response.json();
      console.log('Score save response:', {
        result,
        timestamp: new Date().toISOString()
      });

      await refetchGameStats();

      toast({
        title: "Score Saved!",
        description: `You earned ${earnedCPXTB} CPXTB! Keep playing to accumulate more.`,
      });
    } catch (error) {
      console.error('Error saving score:', error);
      toast({
        title: "Error Saving Score",
        description: error instanceof Error ? error.message : "Failed to save score",
        variant: "destructive"
      });
    }
  };
  
  // Handle claiming accumulated CPXTB
  const handleClaimCPXTB = () => {
    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim your CPXTB rewards.",
        variant: "destructive"
      });
      return;
    }
    
    if (!gameStats || parseFloat(gameStats.accumulatedCPXTB) < 1000) {
      toast({
        title: "Insufficient CPXTB",
        description: "You need at least 1000 CPXTB to claim rewards.",
        variant: "destructive"
      });
      return;
    }
    
    claimCPXTBMutation.mutate();
  };

  // Game timer
  useEffect(() => {
    if (!gameStarted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameStarted(false);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Space Mining Adventure</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className={`flex items-center ${isMobile ? 'flex-col' : 'justify-between'}`}>
              <div className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                Game Status
              </div>
              <div className={`flex items-center ${isMobile ? 'flex-wrap justify-center mt-2' : ''} gap-4`}>
                <div className="text-xl flex items-center">
                  <span className="font-semibold mr-1">Score:</span> {score}
                </div>
                <div className="text-xl flex items-center gap-1">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">{calculateCPXTB(score)}</span>
                </div>
                <div className="text-xl flex items-center">
                  <span className="font-semibold mr-1">Time:</span> {timeLeft}s
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!gameStarted ? (
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">
                  {timeLeft === 0 ? 'Game Over!' : 'Ready to Mine?'}
                </h2>
                {timeLeft === 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xl">Final Score: {score} points</p>
                    <p className="text-xl flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      Earned: {calculateCPXTB(score)} CPXTB
                    </p>
                  </div>
                )}
                <Button
                  size="lg"
                  onClick={startGame}
                  className="gap-2"
                >
                  <Rocket className="h-5 w-5" />
                  {timeLeft === 0 ? 'Play Again' : 'Start Mining'}
                </Button>
              </div>
            ) : (
              <div
                className="relative w-full h-[400px] bg-black rounded-lg overflow-hidden"
                style={{ background: 'linear-gradient(to bottom, #0f172a, #1e293b)' }}
              >
                {/* Game area with improved click targets */}
                {minerals.map(mineral => (
                  <motion.div
                    key={mineral.id}
                    className="absolute cursor-pointer z-10"
                    style={{
                      left: `${mineral.x}%`,
                      top: `${mineral.y}%`,
                      transform: 'translate(-50%, -50%)',
                      padding: '10px', // Larger hit area
                    }}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => collectMineral(mineral)}
                  >
                    <div className="relative">
                      <Star
                        className="h-10 w-10 text-yellow-400 animate-pulse"
                        style={{ 
                          filter: 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.7))',
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-full bg-transparent"
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accumulated CPXTB Card */}
        {isConnected && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-yellow-500" />
                Accumulated CPXTB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-lg">
                    Total Accumulated: <span className="font-bold">{gameStats?.accumulatedCPXTB || '0'} CPXTB</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Claim available at 1000 CPXTB
                  </p>
                </div>
                <Button
                  onClick={handleClaimCPXTB}
                  disabled={!gameStats || parseFloat(gameStats.accumulatedCPXTB) < 1000}
                  className="gap-2"
                >
                  <Coins className="h-4 w-4" />
                  Claim CPXTB
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Click the glowing minerals to collect them</li>
              <li>Each mineral has a random value between 10-60 points</li>
              <li>Collect as many minerals as possible in 60 seconds</li>
              <li>Every 10 points equals 1 CPXTB reward</li>
              <li>Accumulate 1000 CPXTB to claim your rewards</li>
              <li>The game ends when the timer reaches zero</li>
              <li>Try to get the highest score possible!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}