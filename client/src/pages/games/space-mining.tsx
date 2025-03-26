import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Star, ArrowLeft, Coins } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Mineral {
  id: number;
  x: number;
  y: number;
  value: number;
}

// Constants
const POINTS_PER_CPXTB = 1000;

export default function SpaceMiningGame() {
  const [score, setScore] = useState(0);
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds game duration
  const controls = useAnimation();
  const { toast } = useToast();
  const { address, isConnected } = useWallet();
  const queryClient = useQueryClient();

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

  // Helper function to convert points to CPXTB
  const calculateCPXTB = (points: number): string => {
    return (points / POINTS_PER_CPXTB).toFixed(3);
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

  // Spawn minerals randomly
  const spawnMinerals = () => {
    const newMinerals: Mineral[] = [];
    for (let i = 0; i < 5; i++) {
      newMinerals.push({
        id: Math.random(),
        x: Math.random() * 80 + 10, // Keep minerals within 10-90% of the container
        y: Math.random() * 80 + 10,
        value: Math.floor(Math.random() * 10) + 1
      });
    }
    setMinerals(newMinerals);
  };

  // Handle mineral collection
  const collectMineral = (mineral: Mineral) => {
    setScore(prev => prev + mineral.value);
    setMinerals(prev => prev.filter(m => m.id !== mineral.id));

    // Spawn new mineral when one is collected
    const newMineral: Mineral = {
      id: Math.random(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      value: Math.floor(Math.random() * 10) + 1
    };
    setMinerals(prev => [...prev, newMineral]);
  };

  // Handle game end and save score
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
      // Ensure user exists first
      await fetch(`/api/users/${address}`);

      const earnedCPXTB = calculateCPXTB(score);
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
        throw new Error('Failed to save game score');
      }

      await refetchGameStats();

      toast({
        title: "Score Saved!",
        description: `You earned ${earnedCPXTB} CPXTB! Keep playing to accumulate more.`,
      });
    } catch (error) {
      toast({
        title: "Error Saving Score",
        description: error instanceof Error ? error.message : "Failed to save score",
        variant: "destructive"
      });
    }
  };

  // Handle CPXTB claim
  const handleClaimCPXTB = async () => {
    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim CPXTB.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/games/claim-cpxtb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      await refetchGameStats();

      toast({
        title: "CPXTB Claimed!",
        description: "Your accumulated CPXTB has been successfully claimed.",
      });
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim CPXTB",
        variant: "destructive"
      });
    }
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                Game Status
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xl">
                  Score: {score} points
                </div>
                <div className="text-xl flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  {calculateCPXTB(score)} CPXTB
                </div>
                <div className="text-xl">
                  Time: {timeLeft}s
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
                {/* Game area */}
                {minerals.map(mineral => (
                  <motion.div
                    key={mineral.id}
                    className="absolute cursor-pointer"
                    style={{
                      left: `${mineral.x}%`,
                      top: `${mineral.y}%`,
                    }}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => collectMineral(mineral)}
                  >
                    <Star 
                      className="h-6 w-6 text-yellow-400 animate-pulse" 
                      style={{ filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.5))' }}
                    />
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
              <li>Each mineral has a random value between 1-10 points</li>
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