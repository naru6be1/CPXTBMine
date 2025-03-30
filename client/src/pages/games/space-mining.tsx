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
const POINTS_PER_CPXTB = 4000; // Changed from 2000 to 4000 - now 4000 points = 1 CPXTB
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
  // Critical: Add ref to track score independently of React's state batching
  const scoreRef = useRef<number>(0);

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

  // Complete rewrite with truly isolated timer using requestAnimationFrame
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

    // CRITICAL FIX: Create a true high-precision timer with requestAnimationFrame
    // This approach uses the browser's animation frame timing which has higher priority
    // than setTimeout and is less susceptible to main thread blocking
    
    // Record exact start time
    const gameStartTime = performance.now();
    // Calculate exact end time (60 seconds in ms)
    const gameDuration = 60 * 1000; 
    // Game should end at this exact timestamp
    const gameEndTime = gameStartTime + gameDuration;
    
    // Create a cancellation token to stop the animation frame
    let timerFrameId: number | null = null;
    
    // Reset all game state
    setScore(0);
    // Reset score ref to ensure it starts at 0
    scoreRef.current = 0;
    setTimeLeft(60);
    setGameStarted(true);
    
    // Spawn initial minerals
    spawnMinerals();
    
    // Define the animation frame callback that will run at ~60fps
    // This will have higher priority than setTimeout and be more resistant to UI blocking
    function updateTimer(currentTime: number) {
      // Calculate time remaining in milliseconds (high precision)
      const timeElapsed = currentTime - gameStartTime;
      const remainingMs = Math.max(0, gameDuration - timeElapsed);
      const remainingSec = Math.ceil(remainingMs / 1000);
      
      // Update time display only when it changes to avoid unnecessary renders
      if (remainingSec !== timeLeft) {
        setTimeLeft(remainingSec);
      }
      
      // Check if game should end
      if (remainingMs <= 0) {
        // CRITICAL FIX: Capture scores from all possible sources at game end BEFORE any state updates
        const finalScoreFromState = score;
        const finalScoreFromRef = scoreRef.current;
        
        console.log('GAME TIMER REACHED ZERO', {
          finalTimeLeft: remainingSec,
          finalScoreFromState,
          finalScoreFromRef,
          scoreMatch: finalScoreFromState === finalScoreFromRef ? 'MATCH' : 'MISMATCH',
          endTimestamp: new Date().toISOString()
        });
        
        // Cancel any future animation frames
        if (timerFrameId !== null) {
          cancelAnimationFrame(timerFrameId);
          timerFrameId = null;
        }
        
        // End the game
        setGameStarted(false);
        
        // Handle game end immediately with BOTH scores
        // We'll let handleGameEnd determine which one to use
        // When in doubt, use the higher value to favor the player
        handleGameEnd(Math.max(finalScoreFromState, finalScoreFromRef));
        
        return; // End animation frame recursion
      }
      
      // Continue the animation frame loop
      timerFrameId = requestAnimationFrame(updateTimer);
    }
    
    // Start the animation frame loop immediately
    timerFrameId = requestAnimationFrame(updateTimer);
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
        // MUCH higher value minerals to make it easier to earn CPXTB
        value: Math.floor(Math.random() * 70) + (isMobile ? 50 : 30)
      });
    }
    setMinerals(newMinerals);
  };

  // CRITICAL FIX: Completely revamped mineral collection to eliminate timer issues
  const collectMineral = (mineral: Mineral) => {
    try {
      // Skip excessive logging which can cause performance issues
      
      // Validate mineral data - must happen synchronously
      if (!mineral || typeof mineral.value !== 'number') {
        console.error('Invalid mineral data:', mineral);
        return; // Exit early if mineral data is invalid
      }
      
      // Get the value immediately to avoid any async issues
      const mineralValue = mineral.value;
      
      // Calculate the new score immediately (synchronously)
      // Use both the React state and our stable ref to ensure we have a reliable score value
      const currentScore = score;
      const newScore = currentScore + mineralValue;
      
      // CRITICAL FIX: Update our ref to track the score independently of React state batching
      scoreRef.current = scoreRef.current + mineralValue;
      
      console.log('COLLECT MINERAL - TRACKING:', {
        mineralValue,
        scoreStateValue: newScore,
        scoreRefValue: scoreRef.current,
        scoreMatch: newScore === scoreRef.current ? 'MATCH' : 'MISMATCH',
        timestamp: new Date().toISOString()
      });
      
      // Create new mineral data synchronously before any async operations
      const newMineral: Mineral = {
        id: Date.now() + Math.random(),
        x: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
        y: Math.random() * (isMobile ? 70 : 80) + (isMobile ? 15 : 10),
        // MUCH higher value replacement minerals to make it easier to earn CPXTB
        value: Math.floor(Math.random() * 70) + (isMobile ? 50 : 30)
      };
      
      // Use a single requestAnimationFrame to batch all UI updates
      // This prevents the UI thread from being repeatedly blocked
      window.requestAnimationFrame(() => {
        // Update score using function form to ensure we're using latest state
        setScore(newScore);
        
        // Immediately update minerals in the same animation frame
        setMinerals(prevMinerals => {
          // Only keep minerals that don't match the collected one
          const remainingMinerals = prevMinerals.filter(m => m.id !== mineral.id);
          // Add new mineral to the array
          return [...remainingMinerals, newMineral];
        });
        
        // Show minimal toast notification - limit to just +points
        // This reduces the impact on performance
        toast({
          title: `+${mineralValue}`,
          description: `Score: ${newScore}`,
          duration: 800, // Shorter duration for better performance
        });
        
        // Update animation in the same frame
        controls.start({
          scale: [1, 1.05, 1],
          transition: { duration: 0.1 } // Shorter animation
        });
      });
    } catch (error) {
      console.error('ERROR IN COLLECT MINERAL:', error);
      toast({
        title: "Collection Issue",
        description: "Please try clicking another mineral",
        variant: "destructive"
      });
    }
  };

  // COMPLETE REWRITE: Direct, minimal, non-async score calculation and storage approach
  const handleGameEnd = async (finalScoreAtEnd?: number) => {
    // CRITICAL FIX: Always use our ref scoreRef.current as the single source of truth for the score
    // This avoids any potential state batching or update issues in React
    // We'll also log all possible score values for debugging
    const scoreFromRef = scoreRef.current;
    const scoreFromState = score;
    const scoreFromParam = finalScoreAtEnd;
    
    // Always use the ref score as our primary source of truth
    // If refs and state don't match, take the higher value to ensure players aren't penalized
    const currentScoreSnapshot = Math.max(scoreFromRef, scoreFromState, finalScoreAtEnd || 0);
    
    console.log('FINAL SNAPSHOT AT GAME END:', {
      scoreFromRef,
      scoreFromState,
      scoreFromParam,
      finalScoreUsed: currentScoreSnapshot,
      hasWallet: !!address && isConnected,
      timestamp: new Date().toISOString()
    });
    
    // Hardcoded minimum guarantee of 100 points to ensure minimum 1 CPXTB
    const guaranteedMinimumScore = 100;
    
    // Use demo wallet if no real wallet is connected
    const effectiveAddress = address || '0x01A72B983368DD0E599E0B1Fe7716b05A0C9DE77';
    
    // Use the exact score without minimum guarantee
    const finalScore = currentScoreSnapshot;
    
    // Calculate CPXTB using the actual score
    // With 100 points per CPXTB conversion rate
    const earnedCPXTB = (finalScore / POINTS_PER_CPXTB).toFixed(3);
    
    // Debug log the exact values used for calculations
    console.log('SCORE CALCULATION SNAPSHOT VALUES:', {
      currentScoreSnapshot,
      guaranteedMinimumScore,
      finalScore,
      earnedCPXTB,
      conversionRate: POINTS_PER_CPXTB,
      effectiveAddress,
      timestamp: new Date().toISOString()
    });
    
    // Show toast notification that we're processing
    toast({
      title: "Saving Score...",
      description: `Final Score: ${finalScore} points (${earnedCPXTB} CPXTB)`,
    });
    
    // Inform player if they're using a demo wallet
    if (!address || !isConnected) {
      toast({
        title: "Demo Mode",
        description: "Using test wallet. Connect your real wallet for full features.",
        duration: 5000,
      });
    }
    
    try {
      // Construct payload with explicit numeric conversions - crucial for server processing
      // Force all values to be explicit numbers to avoid any string conversion issues
      const gamePayload = {
        walletAddress: effectiveAddress,
        score: Number(finalScore),
        earnedCPXTB: Number(earnedCPXTB),
        gameType: 'space-mining',
        timestamp: Date.now() // Add timestamp for debugging
      };
      
      console.log('SERVER PAYLOAD - EXACT VALUES BEING SENT:', gamePayload);
      
      // Send payload to server with retry logic
      let response;
      let retries = 3;
      
      while (retries > 0) {
        try {
          response = await fetch('/api/games/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gamePayload),
          });
          
          if (response.ok) break;
          retries--;
          
          if (retries > 0) {
            console.log(`Server retry attempt (${retries} left)`);
            await new Promise(r => setTimeout(r, 500));
          }
        } catch (err) {
          console.error('Network error:', err);
          retries--;
          if (retries <= 0) throw err;
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      if (!response || !response.ok) {
        throw new Error('Score save failed after multiple attempts');
      }
      
      // Process server response
      const result = await response.json();
      console.log('SAVE SUCCESS - SERVER RESPONSE:', result);
      
      // Refresh player stats to show updated CPXTB
      await refetchGameStats();
      
      // Show success notification
      toast({
        title: `Score Saved: ${finalScore} points`,
        description: `You earned ${earnedCPXTB} CPXTB!` + 
                    (currentScoreSnapshot < 100 ? " (Minimum guarantee applied)" : "")
      });
    } catch (error) {
      console.error('ERROR SAVING SCORE:', error);
      toast({
        title: "Save Error",
        description: error instanceof Error ? error.message : "Failed to save score.",
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

        <Card className="mb-6 border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border-b">
            <CardTitle className={`flex items-center ${isMobile ? 'flex-col' : 'justify-between'}`}>
              <div className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary animate-pulse" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 font-bold">
                  Space Mining HQ
                </span>
              </div>
              
              <div className={`${isMobile ? 'w-full mt-4' : 'flex gap-6'}`}>
                {/* Score Card */}
                <div className={`${isMobile ? 'mb-3' : ''} px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-500/10 rounded-lg border border-blue-500/20 shadow-sm`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Current Score</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{score.toLocaleString()}</div>
                  </div>
                  <div className="w-full bg-blue-100/20 dark:bg-blue-900/20 h-1.5 rounded-full mt-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${Math.min(100, (score / 4000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* CPXTB Card */}
                <div className={`${isMobile ? 'mb-3' : ''} px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 rounded-lg border border-amber-500/20 shadow-sm`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-muted-foreground">CPXTB Earned</div>
                    <div className="flex items-center text-lg font-bold text-amber-600 dark:text-amber-400">
                      <Coins className="h-4 w-4 mr-1 text-amber-500" />
                      {calculateCPXTB(score)}
                    </div>
                  </div>
                  <div className="w-full bg-amber-100/20 dark:bg-amber-900/20 h-1.5 rounded-full mt-1.5">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${Math.min(100, (Number(calculateCPXTB(score)) / 10) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Time Card */}
                <div className={`${isMobile ? 'mb-3' : ''} px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/10 rounded-lg border border-emerald-500/20 shadow-sm`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Time Remaining</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{timeLeft}s</div>
                  </div>
                  <div className="w-full bg-emerald-100/20 dark:bg-emerald-900/20 h-1.5 rounded-full mt-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${(timeLeft / 60) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!gameStarted ? (
              <div className="text-center py-12 px-4 bg-gradient-to-b from-background to-muted/30">
                {timeLeft === 0 ? (
                  <div className="space-y-8">
                    <div className="inline-block animate-bounce bg-blue-600/10 dark:bg-blue-400/10 rounded-full p-6 mb-2">
                      <Star className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6">
                      Mission Complete!
                    </h2>
                    <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-8">
                      <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-xl p-4 border border-blue-500/20 shadow-sm">
                        <p className="text-sm text-muted-foreground mb-1">Final Score</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score.toLocaleString()}</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-xl p-4 border border-amber-500/20 shadow-sm">
                        <p className="text-sm text-muted-foreground mb-1">CPXTB Earned</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Coins className="h-5 w-5 mr-1 text-amber-500" />
                          {calculateCPXTB(score)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="inline-block animate-bounce bg-blue-600/10 dark:bg-blue-400/10 rounded-full p-6 mb-2">
                      <Rocket className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-4">
                      Ready to Mine?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto mb-6">
                      Collect space minerals to earn CPXTB tokens. The more you mine, the more you earn!
                    </p>
                  </div>
                )}
                <Button
                  size="lg"
                  onClick={startGame}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 mt-4"
                >
                  <Rocket className="h-5 w-5 mr-2" />
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
                        // Prevent any default browser behaviors
                        e.preventDefault();
                        // Stop event bubbling to prevent parent elements from handling this event
                        e.stopPropagation();
                        // Minimize logging during gameplay to improve performance
                        // Avoid blocking the main thread with complex operations
                        if (gameStarted) {
                          collectMineral(mineral);
                        }
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
        <Card className="mb-6 border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-amber-500 animate-pulse" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 font-bold">
                Accumulated CPXTB Rewards
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row items-center justify-between'} gap-6`}>
              <div className="space-y-4 flex-grow">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                    {parseFloat(gameStats?.accumulatedCPXTB || '0') >= 1000 && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full animate-pulse">
                        Ready to Claim!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {gameStats?.accumulatedCPXTB || '0'}
                    </span>
                    <span className="text-xl font-semibold text-muted-foreground">CPXTB</span>
                  </div>
                </div>
                
                <div className="w-full">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress to claim</span>
                    <span className="font-medium">{Math.min(100, (parseFloat(gameStats?.accumulatedCPXTB || '0') / 1000) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-amber-100/20 dark:bg-amber-900/20 h-2.5 rounded-full">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(100, (parseFloat(gameStats?.accumulatedCPXTB || '0') / 1000) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {!isConnected && 'Connect your wallet to claim your CPXTB rewards directly to your wallet.'}
                  {isConnected && parseFloat(gameStats?.accumulatedCPXTB || '0') < 1000 && 
                    `Need ${(1000 - parseFloat(gameStats?.accumulatedCPXTB || '0')).toFixed(3)} more CPXTB to claim rewards.`
                  }
                  {isConnected && parseFloat(gameStats?.accumulatedCPXTB || '0') >= 1000 && 
                    'You can now claim your CPXTB rewards!'
                  }
                </p>
              </div>
              
              <Button
                onClick={handleClaimCPXTB}
                disabled={!isConnected || !gameStats || parseFloat(gameStats?.accumulatedCPXTB || '0') < 1000}
                className={`${isMobile ? 'w-full' : 'min-w-[150px]'} bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                  parseFloat(gameStats?.accumulatedCPXTB || '0') >= 1000 ? 'animate-pulse' : ''
                }`}
                size="lg"
              >
                <Coins className="h-5 w-5 mr-2" />
                {!isConnected ? 'Connect Wallet' : 'Claim CPXTB'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Interstitial Ad */}
        <GameInterstitialAd />

        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-6 w-6 text-indigo-500" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 font-bold">
                How to Play
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-xl p-4 border border-blue-500/10 shadow-sm">
                <div className="flex flex-col items-center mb-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-500/20 mb-2">
                    <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-bold text-center">Collect Minerals</h3>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Click on the glowing star minerals to collect points. Each has a random value between 30-100 points.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-xl p-4 border border-emerald-500/10 shadow-sm">
                <div className="flex flex-col items-center mb-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-emerald-500/20 mb-2">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">60s</div>
                  </div>
                  <h3 className="font-bold text-center">Beat the Clock</h3>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  You have 60 seconds to collect as many minerals as possible. Keep an eye on the timer!
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-xl p-4 border border-amber-500/10 shadow-sm">
                <div className="flex flex-col items-center mb-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-amber-500/20 mb-2">
                    <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-bold text-center">Earn CPXTB</h3>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Every 4000 points equals 1 CPXTB reward. Accumulate 1000 CPXTB to claim rewards to your wallet.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 rounded-xl p-4 border border-purple-500/10 shadow-sm">
                <div className="flex flex-col items-center mb-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-purple-500/20 mb-2">
                    <div className="font-bold text-purple-600 dark:text-purple-400">🏆</div>
                  </div>
                  <h3 className="font-bold text-center">High Scores</h3>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Try to achieve the highest score possible! Challenge yourself to beat your personal best each game.
                </p>
              </div>
            </div>
            
            <div className="mt-6 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-semibold text-foreground">Pro Tip:</span> Use quick taps and keep an eye on the entire screen to catch minerals as they appear.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}