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
import { GameInterstitialAd } from '@/components/ad-placement';

interface Mineral {
  id: number;
  x: number;
  y: number;
  value: number;
}

// Constants
const POINTS_PER_CPXTB = 1000; // Changed from 10 to 1000 - 1000 points = 1 CPXTB
const DEBUG_MODE = false; // Set to false for production

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

  // Always use a default address for testing purposes if no wallet is connected
  const effectiveAddress = address || '0x01A72B983368DD0E599E0B1Fe7716b05A0C9DE77';

  // Query for accumulated CPXTB - always use effectiveAddress
  const { data: gameStats, refetch: refetchGameStats } = useQuery({
    queryKey: ['gameStats', effectiveAddress],
    queryFn: async () => {
      const response = await fetch(`/api/games/stats/${effectiveAddress}`);
      if (!response.ok) {
        throw new Error('Failed to fetch game stats');
      }
      return await response.json();
    },
    enabled: true // Always enabled with fallback address
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

  // Initialize game - completely separated from UI operations
  const startGame = () => {
    // Prevent multiple game starts - only start if not already running
    if (gameStarted) {
      toast({
        title: "Game Already Running",
        description: "Please wait for current game to finish",
        duration: 2000,
      });
      return;
    }

    // Show wallet connection warning but continue anyway
    if (!address || !isConnected) {
      toast({
        title: "Demo Mode Active",
        description: "Using test wallet for rewards. Connect your real wallet for full features.",
        duration: 5000,
      });
      // Continue with game start despite no wallet
    }

    // Log game start to help with debugging
    console.log('GAME STARTING', {
      timestamp: new Date().toISOString()
    });

    // Create a fixed game end time that won't change regardless of UI operations
    const gameEndTime = Date.now() + 60000; // 60 seconds from now
    
    // Store the end time in a ref to access it from other functions
    const gameEndTimeRef = { current: gameEndTime };
    
    // Reset all game state
    setScore(0);
    
    // Set the initial time left (this will be updated by our dedicated timer)
    setTimeLeft(60);
    
    // Start the game
    setGameStarted(true);
    
    // Spawn initial minerals
    spawnMinerals();
    
    // Create a dedicated timer using setTimeout recursion
    // This technique ensures the timer keeps running even if the UI is busy
    function runGameTimer() {
      // Calculate the remaining time
      const now = Date.now();
      const remainingMs = Math.max(0, gameEndTimeRef.current - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      
      // Update the timeLeft (asynchronously)
      setTimeLeft(remainingSec);
      
      // If time is up, end the game
      if (remainingSec <= 0) {
        console.log('GAME TIMER REACHED ZERO');
        
        // Set the final score
        const finalScore = score; // Capture current score
        
        // End the game
        setGameStarted(false);
        
        // Handle game end (after UI update)
        setTimeout(() => {
          handleGameEnd();
        }, 100);
        
        return; // Stop the timer recursion
      }
      
      // Continue the timer if the game is still running
      // Using setTimeout instead of setInterval ensures each timer tick starts
      // only after the previous one finishes, preventing timer drift
      setTimeout(runGameTimer, 250); // Update 4 times per second for smooth countdown
    }
    
    // Start the timer immediately
    runGameTimer();
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

  // Optimized mineral collection function to prevent timer blocking
  const collectMineral = (mineral: Mineral) => {
    try {
      // Reduce logging to improve performance
      console.log('Collecting mineral:', mineral.id);
      
      // Make sure we have a valid mineral with a value
      if (!mineral || typeof mineral.value !== 'number') {
        console.error('Invalid mineral data:', mineral);
        return; // Exit early if mineral data is invalid
      }
      
      // CRITICAL FIX: Use the actual mineral value with no minimum
      const mineralValue = mineral.value;
      
      // Use requestAnimationFrame for smoother UI updates
      // This prevents blocking the main thread during UI operations
      requestAnimationFrame(() => {
        // Update the score using the callback form to ensure latest state
        setScore(prevScore => {
          const newScore = prevScore + mineralValue;
          
          // Show toast with score update - keep this minimal
          toast({
            title: `+${mineralValue}`,
            description: `Score: ${newScore}`,
            duration: 1000,
          });
          
          return newScore;
        });
        
        // Create a new mineral outside the setState callback
        const newMineral: Mineral = {
          id: Date.now() + Math.random(), // More unique ID
          x: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
          y: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
          value: Math.floor(Math.random() * 50) + (isMobile ? 25 : 15) // Higher values
        };
        
        // Use requestAnimationFrame again for the mineral update
        requestAnimationFrame(() => {
          // Update minerals state
          setMinerals(prevMinerals => {
            // Filter out the collected mineral
            const filteredMinerals = prevMinerals.filter(m => m.id !== mineral.id);
            // Add the new mineral
            return [...filteredMinerals, newMineral];
          });
          
          // Flash animation for visual feedback - use requestAnimationFrame for this too
          requestAnimationFrame(() => {
            controls.start({
              scale: [1, 1.1, 1],
              transition: { duration: 0.2 }
            });
          });
        });
      });
    } catch (error) {
      console.error('ERROR IN COLLECT MINERAL:', error);
      // Show error toast only for real errors
      toast({
        title: "Collection Issue",
        description: "Please try clicking another mineral",
        variant: "destructive"
      });
    }
  };

  // Completely rewritten game end handler that ensures the correct score is sent to the server
  const handleGameEnd = async () => {
    console.log('GAME END TRIGGERED', {
      currentScore: score,
      hasWallet: !!address && isConnected,
      timestamp: new Date().toISOString()
    });
    
    // CRITICAL FIX: Don't save scores of 0
    if (score <= 0) {
      console.log('Not saving zero score');
      toast({
        title: "Game Over",
        description: "No points were earned in this game",
        variant: "destructive"
      });
      return;
    }
    
    // CRITICAL FIX: Use default address for non-connected wallets - hardcoded for demo
    const effectiveAddress = address || '0x01A72B983368DD0E599E0B1Fe7716b05A0C9DE77';
    
    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Using test wallet to save game rewards. Connect your real wallet for full features.",
        variant: "default"
      });
      // Continue execution
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
      
      // Make sure score is positive
      const finalScore = Math.max(1, score); // Ensure at least 1 point
      const earnedCPXTB = calculateCPXTB(finalScore);
      
      // Double check that we have CPXTB to award
      if (parseFloat(earnedCPXTB) <= 0) {
        console.log('Not enough points to earn CPXTB:', {finalScore, earnedCPXTB});
        toast({
          title: "No CPXTB Earned",
          description: `Score of ${finalScore} is too low to earn CPXTB. Need at least ${POINTS_PER_CPXTB} points.`,
          variant: "destructive"
        });
        return;
      }
      
      console.log('GAME END - FINAL DETAILS:', {
        walletAddress: address,
        effectiveAddress, // This is what will actually be sent
        originalScore: score,
        finalScore: finalScore,
        earnedCPXTB,
        pointsPerCPXTB: POINTS_PER_CPXTB,
        timestamp: new Date().toISOString()
      });
      
      // Show saving indicator with GUARANTEED non-zero CPXTB amount
      toast({
        title: "Saving Score...",
        description: `Final Score: ${finalScore} = ${earnedCPXTB} CPXTB`,
      });
      
      // Create payload with correct data - using effectiveAddress for non-connected wallets
      const gamePayload = {
        walletAddress: effectiveAddress, // Using our fallback address if needed
        score: finalScore, // Using the guaranteed positive score
        earnedCPXTB: earnedCPXTB, // Correctly calculated CPXTB
        gameType: 'space-mining' // Specify game type
      };
      
      console.log('SENDING PAYLOAD TO SERVER:', gamePayload);
      
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
            body: JSON.stringify(gamePayload),
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

      // Show success message with actual earned amount
      toast({
        title: `Score Saved: ${finalScore} points!`,
        description: `You earned ${earnedCPXTB} CPXTB! Keep playing to earn more rewards.`
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
      // Show wallet connection error since we can't directly connect from here
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

  // The timer is now entirely managed within the startGame function
  // We've removed the separate useEffect timer to avoid any potential conflicts
  // This ensures that there is only one authoritative source for the game timing

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

        {/* Accumulated CPXTB Card - Show to everyone but require wallet only for claiming */}
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
                  {!isConnected && 'Connect wallet to claim rewards'}
                  {isConnected && 'Claim available at 1000 CPXTB'}
                </p>
              </div>
              <Button
                onClick={handleClaimCPXTB}
                disabled={!isConnected || !gameStats || parseFloat(gameStats?.accumulatedCPXTB || '0') < 1000}
                className="gap-2"
              >
                <Coins className="h-4 w-4" />
                {!isConnected ? 'Connect Wallet' : 'Claim CPXTB'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Interstitial Ad */}
        <GameInterstitialAd />

        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Click the glowing minerals to collect them</li>
              <li>Each mineral has a random value between 10-60 points</li>
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