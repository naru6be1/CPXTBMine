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
const POINTS_PER_CPXTB = 1000; // 1000 points = 1 CPXTB

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
        // Increased value range for faster CPXTB earning (100-250 points per mineral)
        value: Math.floor(Math.random() * 150) + 100
      });
    }
    setMinerals(newMinerals);
  };

  // Completely rewritten mineral collection function for guaranteed functionality
  const collectMineral = (mineral: Mineral) => {
    try {
      // Heavy logging to diagnose issues
      console.log('COLLECT MINERAL START', {
        mineralId: mineral.id,
        mineralValue: mineral.value,
        position: { x: mineral.x, y: mineral.y },
        timestamp: new Date().toISOString(),
        currentScore: score
      });
      
      // Make sure we have a valid mineral with a value
      if (!mineral || typeof mineral.value !== 'number') {
        console.error('Invalid mineral data:', mineral);
        return; // Exit early if mineral data is invalid
      }
      
      // Use the actual mineral value (now 100-250 range)
      const mineralValue = mineral.value;
      
      // Use a callback form of setState to ensure we're working with the latest state
      setScore(prevScore => {
        const newScore = prevScore + mineralValue;
        
        console.log('SCORE UPDATE', {
          prevScore: prevScore,
          mineralValue: mineralValue,
          newScore: newScore,
          timestamp: new Date().toISOString()
        });
        
        // Show toast with score update
        toast({
          title: `+${mineralValue} points!`,
          description: `Score: ${newScore} (${calculateCPXTB(newScore)} CPXTB)`,
          duration: 1500,
        });
        
        return newScore;
      });
      
      // Wait briefly before handling mineral replacement (reduces chances of race conditions)
      setTimeout(() => {
        // Using the callback form ensures we're working with the latest state
        setMinerals(prevMinerals => {
          // First filter out the collected mineral
          const filteredMinerals = prevMinerals.filter(m => m.id !== mineral.id);
          
          // Create a new mineral with guaranteed value
          const newMineral: Mineral = {
            id: Date.now() + Math.random(), // More unique ID
            x: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
            y: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
            value: Math.floor(Math.random() * 150) + 100 // Same 100-250 point range
          };
          
          console.log('MINERAL REPLACED', {
            removedMineralId: mineral.id,
            newMineralId: newMineral.id,
            newMineralValue: newMineral.value,
            timestamp: new Date().toISOString()
          });
          
          // Return updated minerals array with the new mineral added
          return [...filteredMinerals, newMineral];
        });
      }, 50);
      
      // Flash animation for visual feedback
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 }
      });
      
      console.log('COLLECT MINERAL COMPLETED SUCCESSFULLY');
      
    } catch (error) {
      console.error('ERROR IN COLLECT MINERAL:', error);
      // Show error toast only for real errors, not for normal operation
      toast({
        title: "Collection Issue",
        description: "Please try clicking another mineral",
        variant: "destructive"
      });
    }
  };

  // Completely rewritten game end handler with robust error handling
  const handleGameEnd = async () => {
    console.log('GAME END TRIGGERED', {
      currentScore: score,
      hasWallet: !!address && isConnected,
      timestamp: new Date().toISOString()
    });
    
    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to save your game rewards.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if we have a valid score
      if (typeof score !== 'number' || isNaN(score)) {
        console.error('INVALID SCORE DETECTED:', score);
        toast({
          title: "Error: Invalid Score",
          description: "There was a problem with your game session. Please try again.",
          variant: "destructive"
        });
        return;
      }
      
      // Only use the actual score without forcing a minimum
      const finalScore = score;
      const earnedCPXTB = calculateCPXTB(finalScore);
      
      // Log the final details
      console.log('GAME END - FINAL DETAILS:', {
        walletAddress: address,
        originalScore: score,
        finalScore: finalScore,
        earnedCPXTB,
        timestamp: new Date().toISOString()
      });
      
      // Display saving indicator
      toast({
        title: "Saving Score...",
        description: "Please wait while your score is being saved.",
      });
      
      // Send score to server with multiple retry
      let response;
      let retries = 3;
      
      while (retries > 0) {
        try {
          response = await fetch('/api/games/save-score', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: address,
              score: finalScore,
              earnedCPXTB
            }),
          });
          
          if (response.ok) break;
          retries--;
          
          if (retries > 0) {
            console.log(`Score save attempt failed, retrying... (${retries} attempts left)`);
            await new Promise(r => setTimeout(r, 500)); // Wait before retry
          }
        } catch (err) {
          console.error('Score save attempt error:', err);
          retries--;
          if (retries <= 0) throw err;
          await new Promise(r => setTimeout(r, 500)); // Wait before retry
        }
      }
      
      if (!response || !response.ok) {
        throw new Error('Failed to save score after multiple attempts');
      }

      const result = await response.json();
      console.log('SCORE SAVE SUCCESS:', {
        result,
        timestamp: new Date().toISOString()
      });

      // Refresh game stats
      await refetchGameStats();

      // Show success message
      toast({
        title: "Score Saved Successfully!",
        description: `You earned ${earnedCPXTB} CPXTB! Keep playing to earn more rewards.`,
        variant: "default"
      });
    } catch (error) {
      console.error('CRITICAL ERROR SAVING SCORE:', error);
      toast({
        title: "Error Saving Score",
        description: error instanceof Error ? error.message : "Failed to save your score. Please try again.",
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
                {/* Game area with significantly improved click targets */}
                <div 
                  ref={gameAreaRef}
                  className="absolute inset-0"
                  style={{ touchAction: 'manipulation' }}
                >
                  {minerals.map(mineral => (
                    <motion.button
                      key={mineral.id}
                      type="button"
                      className="absolute cursor-pointer z-10 bg-transparent border-0 p-0"
                      style={{
                        left: `${mineral.x}%`,
                        top: `${mineral.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: isMobile ? '60px' : '50px', // Much larger hit area
                        height: isMobile ? '60px' : '50px',
                        outline: 'none',
                      }}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`Button click on mineral ${mineral.id} at (${mineral.x}, ${mineral.y})`);
                        collectMineral(mineral);
                      }}
                    >
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Star
                          className="h-12 w-12 text-yellow-400 animate-pulse"
                          style={{ 
                            filter: 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.7))',
                          }}
                        />
                      </div>
                    </motion.button>
                  ))}
                </div>
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
              <li>Each mineral has a random value between 100-250 points</li>
              <li>Collect as many minerals as possible in 60 seconds</li>
              <li>Every 1000 points equals 1 CPXTB reward</li>
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