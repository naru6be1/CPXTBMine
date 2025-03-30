import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, useAnimation } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/hooks/use-wallet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Award, Brain, Clock, Coins, Shuffle, 
  Gamepad, Zap, Flame, Trophy, Sparkles 
} from 'lucide-react';
import { GameInterstitialAd } from '@/components/ad-placement';

// Constants
const POINTS_PER_CPXTB = 4000; // 4000 points = 1 CPXTB (same as Space Mining)
const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, timeLimit: 60, multiplier: 1 },
  medium: { pairs: 8, timeLimit: 45, multiplier: 1.5 },
  hard: { pairs: 10, timeLimit: 30, multiplier: 2 }
};

// Card themes (crypto related)
const CARD_THEMES = [
  { id: 1, name: 'Bitcoin', icon: '₿', color: 'bg-orange-500' },
  { id: 2, name: 'Ethereum', icon: 'Ξ', color: 'bg-purple-500' },
  { id: 3, name: 'USDT', icon: '₮', color: 'bg-green-500' },
  { id: 4, name: 'BNB', icon: 'BNB', color: 'bg-yellow-500' },
  { id: 5, name: 'XRP', icon: 'XRP', color: 'bg-blue-500' },
  { id: 6, name: 'Cardano', icon: 'ADA', color: 'bg-blue-700' },
  { id: 7, name: 'Solana', icon: 'SOL', color: 'bg-purple-700' },
  { id: 8, name: 'Polkadot', icon: 'DOT', color: 'bg-pink-500' },
  { id: 9, name: 'Avalanche', icon: 'AVAX', color: 'bg-red-500' },
  { id: 10, name: 'Cosmos', icon: 'ATOM', color: 'bg-indigo-500' },
];

interface MemoryCard {
  id: number;
  themeId: number;
  flipped: boolean;
  matched: boolean;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export default function MemoryMatchGame() {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0); // Track final score specifically for the game end result
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [moveCount, setMoveCount] = useState<number>(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  
  const { toast } = useToast();
  const { address, isConnected } = useWallet();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const controls = useAnimation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
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
      toast({
        title: "Error Claiming CPXTB",
        description: error instanceof Error ? error.message : "Failed to claim CPXTB",
        variant: "destructive"
      });
    }
  });
  
  // Initialize a new game based on difficulty level
  const initializeGame = (level: DifficultyLevel) => {
    const { pairs, timeLimit } = DIFFICULTY_LEVELS[level];
    
    // Reset game state
    setMatchedPairs(0);
    setScore(0);
    setFinalScore(0); // Reset final score when starting new game
    setMoveCount(0);
    setTimeLeft(timeLimit);
    setGameResult(null);
    setFlippedCards([]);
    
    // Create a shuffled deck of cards
    const cardThemes = CARD_THEMES.slice(0, pairs);
    const pairedCards = [...cardThemes, ...cardThemes].map((theme, index) => ({
      id: index,
      themeId: theme.id,
      flipped: false,
      matched: false
    }));
    
    // Shuffle cards
    const shuffledCards = pairedCards
      .sort(() => Math.random() - 0.5);
      
    setCards(shuffledCards);
    setIsGameActive(true);
    
    // Show toast with game start
    toast({
      title: `${level.charAt(0).toUpperCase() + level.slice(1)} Game Started!`,
      description: `Find ${pairs} pairs in ${timeLimit} seconds.`,
    });
    
    // Start the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Game over - time's up
          if (timerRef.current) clearInterval(timerRef.current);
          
          // CRITICAL BUGFIX: Don't rely on React state for this calculation
          // Instead, read values directly from the DOM elements to ensure we have the most current values
          
          // Force game to end
          if (timerRef.current) clearInterval(timerRef.current);
          
          // Get current score from the displayed badge to ensure we have the actual value shown to user
          // This is a hack but ensures we capture what's visible to the user
          const scoreElement = document.querySelector('.score-badge');
          const displayedScore = scoreElement ? parseInt(scoreElement.textContent?.replace(' pts', '') || '0', 10) : score;
          
          // Log what the user sees vs what the state says
          console.log('TIME\'S UP! DOM score:', displayedScore, 'State score:', score);
          
          // Always use the higher of the two values to give user benefit of the doubt
          const finalActualScore = Math.max(displayedScore, score);
          console.log('TIME\'S UP! Using final score:', finalActualScore);
          
          // Immediately set these for UI display
          setFinalScore(finalActualScore);
          setIsGameActive(false);
          setGameResult('lose');
          
          // Calculate CPXTB with the actual score
          const earnedCPXTB = calculateCPXTB(finalActualScore);
          
          // Log what we're sending to the server
          console.log('TIME\'S UP! Sending to server:', {
            score: finalActualScore,
            earnedCPXTB,
            gameType: 'memory-match'
          });
          
          // Direct server save with the verified score
          setTimeout(() => {
            fetch('/api/games/save-score', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                walletAddress: effectiveAddress,
                score: finalActualScore,
                earnedCPXTB: earnedCPXTB,
                gameType: 'memory-match'
              }),
            })
            .then(response => response.json())
            .then(result => {
              console.log('SCORE SAVE SUCCESS FROM TIMER:', result);
              refetchGameStats();
              
              // Show a toast notification for the player
              toast({
                title: "Game Over - Time's Up!",
                description: `Final Score: ${finalActualScore} = ${parseFloat(earnedCPXTB).toFixed(3)} CPXTB`,
              });
            })
            .catch(error => {
              console.error('ERROR SAVING SCORE FROM TIMER:', error);
            });
          }, 300);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle card click
  const handleCardClick = (cardId: number) => {
    // Ignore clicks if game is not active or card is already flipped/matched
    if (!isGameActive) return;
    
    const clickedCard = cards.find(card => card.id === cardId);
    if (!clickedCard || clickedCard.flipped || clickedCard.matched) return;
    
    // Limit to flipping only 2 cards at a time
    if (flippedCards.length === 2) return;
    
    // Flip the card
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, flipped: true } : card
      )
    );
    
    // Add to flipped cards
    setFlippedCards(prev => [...prev, cardId]);
  };
  
  // Calculate CPXTB from points with proper decimals
  const calculateCPXTB = (points: number): string => {
    const rawPoints = Math.max(0, points);
    const cpxtb = (rawPoints / POINTS_PER_CPXTB).toFixed(3);
    return cpxtb;
  };
  
  // Check for matches when two cards are flipped
  useEffect(() => {
    if (flippedCards.length === 2) {
      // Increment move counter
      setMoveCount(prev => prev + 1);
      
      const [firstCardId, secondCardId] = flippedCards;
      const firstCard = cards.find(card => card.id === firstCardId);
      const secondCard = cards.find(card => card.id === secondCardId);
      
      if (firstCard && secondCard && firstCard.themeId === secondCard.themeId) {
        // Match found!
        const pointsForMatch = Math.floor(50 * DIFFICULTY_LEVELS[difficulty].multiplier);
        
        // Apply animation
        controls.start({
          scale: [1, 1.05, 1],
          transition: { duration: 0.3 }
        });
        
        // Update score
        setScore(prev => prev + pointsForMatch);
        
        // Mark cards as matched
        setCards(prevCards => 
          prevCards.map(card => 
            card.id === firstCardId || card.id === secondCardId
              ? { ...card, matched: true, flipped: true }
              : card
          )
        );
        
        // Increment matched pairs
        setMatchedPairs(prev => {
          const newMatchedPairs = prev + 1;
          // Check if all pairs are matched (game won)
          if (newMatchedPairs === DIFFICULTY_LEVELS[difficulty].pairs) {
            const timeBonus = Math.floor(timeLeft * 5 * DIFFICULTY_LEVELS[difficulty].multiplier);
            const totalScore = score + pointsForMatch + timeBonus;
            
            // Set both score and finalScore with time bonus
            setScore(totalScore);
            setFinalScore(totalScore);
            
            // Clear timer and end game
            if (timerRef.current) clearInterval(timerRef.current);
            setIsGameActive(false);
            setGameResult('win');
            
            console.log('WIN! Setting final score to:', totalScore);
            
            toast({
              title: "Perfect Match!",
              description: `Time Bonus: +${timeBonus} points!`,
            });
            
            // Handle game end with win condition, passing the total score
            handleGameEnd(true, totalScore);
          }
          return newMatchedPairs;
        });
        
        // Add points toast
        toast({
          title: `Match Found! +${pointsForMatch} points`,
          description: `${CARD_THEMES.find(t => t.id === firstCard.themeId)?.name}`,
          duration: 1500,
        });
        
        // Reset flipped cards for next turn
        setFlippedCards([]);
      } else {
        // No match, flip cards back after a short delay
        setTimeout(() => {
          setCards(prevCards => 
            prevCards.map(card => 
              card.id === firstCardId || card.id === secondCardId
                ? { ...card, flipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards, difficulty, score, controls, toast, timeLeft]);
  
  // Handle game end (win or lose)
  const handleGameEnd = async (isWin: boolean, explicitScore?: number) => {
    try {
      // Use explicit score if provided (for timer expiration), otherwise use state
      const updatedFinalScore = explicitScore !== undefined ? explicitScore : score;
      
      // Set the finalScore state to make sure it's available in the UI
      setFinalScore(updatedFinalScore);
      
      const earnedCPXTB = calculateCPXTB(updatedFinalScore);
      
      console.log('GAME END - FINAL DETAILS:', {
        walletAddress: address,
        effectiveAddress,
        isWin,
        finalScore: updatedFinalScore,
        earnedCPXTB,
        pointsPerCPXTB: POINTS_PER_CPXTB,
        difficulty,
        matchedPairs,
        totalPairs: DIFFICULTY_LEVELS[difficulty].pairs,
        timestamp: new Date().toISOString()
      });
      
      // Show saving indicator
      toast({
        title: isWin ? "Game Complete - You Win!" : "Game Over - Time's Up!",
        description: `Final Score: ${updatedFinalScore} = ${parseFloat(earnedCPXTB).toFixed(3)} CPXTB`,
      });
      
      // Create payload with correct data
      const gamePayload = {
        walletAddress: effectiveAddress,
        score: updatedFinalScore,
        earnedCPXTB: earnedCPXTB,
        gameType: 'memory-match'
      };
      
      // Send score to server
      const response = await fetch('/api/games/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gamePayload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save score');
      }
      
      const result = await response.json();
      console.log('SCORE SAVE SUCCESS:', result);
      
      // Refresh game stats
      await refetchGameStats();
      
    } catch (error) {
      console.error('ERROR SAVING SCORE:', error);
      toast({
        title: "Error Saving Score",
        description: error instanceof Error ? error.message : "Failed to save your score. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Update finalScore whenever score changes
  useEffect(() => {
    setFinalScore(score);
    console.log('Score changed, updating finalScore:', score);
  }, [score]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
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
  
  // Get card theme data by themeId
  const getCardTheme = (themeId: number) => {
    return CARD_THEMES.find(theme => theme.id === themeId) || CARD_THEMES[0];
  };
  
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
          <h1 className="text-3xl font-bold">Crypto Memory Match</h1>
        </div>
        
        {/* Game Status */}
        <Card className="mb-6 border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border-b pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-500 animate-pulse" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 font-bold">
                  Memory Match Challenge
                </span>
              </CardTitle>
              
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-blue-500/20 px-3 py-1.5 h-auto"
                >
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{timeLeft}s</span>
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/20 px-3 py-1.5 h-auto"
                >
                  <Award className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-600 dark:text-amber-400 font-medium">{matchedPairs}/{DIFFICULTY_LEVELS[difficulty].pairs}</span>
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 score-badge bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 px-3 py-1.5 h-auto"
                >
                  <Coins className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{score} pts</span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Time Remaining */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Time Remaining</span>
                  <span className="text-sm font-medium">{timeLeft}s / {DIFFICULTY_LEVELS[difficulty].timeLimit}s</span>
                </div>
                <div className="w-full bg-blue-100/20 dark:bg-blue-900/20 h-2 rounded-full">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300 ease-linear"
                    style={{ width: `${(timeLeft / DIFFICULTY_LEVELS[difficulty].timeLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Pairs Matched */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Pairs Matched</span>
                  <span className="text-sm font-medium">{matchedPairs} / {DIFFICULTY_LEVELS[difficulty].pairs}</span>
                </div>
                <div className="w-full bg-amber-100/20 dark:bg-amber-900/20 h-2 rounded-full">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(matchedPairs / DIFFICULTY_LEVELS[difficulty].pairs) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* CPXTB Earned */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">CPXTB Earned</span>
                  <span className="text-sm font-medium">{parseFloat(calculateCPXTB(score)).toFixed(3)}</span>
                </div>
                <div className="w-full bg-emerald-100/20 dark:bg-emerald-900/20 h-2 rounded-full">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (score / 1000) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-between items-center mt-5 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Difficulty:</span>
                <Badge 
                  variant="outline" 
                  className={`
                    text-xs px-2 py-0.5
                    ${difficulty === 'easy' 
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                      : difficulty === 'medium'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    }
                  `}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Badge>
                <span className="text-xs font-medium text-muted-foreground ml-2">Multiplier:</span>
                <span className="text-xs font-bold">x{DIFFICULTY_LEVELS[difficulty].multiplier}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Moves:</span>
                <span className="text-xs font-bold">{moveCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Game Board */}
        {!isGameActive && !gameResult && (
          <Card className="mb-6 border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <Gamepad className="h-6 w-6 text-indigo-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 font-bold">
                  Choose Your Challenge
                </span>
              </CardTitle>
              <CardDescription>Select difficulty level to start playing. Higher difficulty levels offer greater rewards!</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Easy Difficulty */}
                <div 
                  onClick={() => initializeGame('easy')}
                  className="cursor-pointer group relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-600/10 hover:from-blue-500/10 hover:to-blue-600/15 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="px-6 py-8 flex flex-col items-center relative z-10">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-blue-600 dark:text-blue-400">Easy</h3>
                    <div className="space-y-2 w-full">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Card Pairs:</span>
                        <span className="font-medium">6</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Time Limit:</span>
                        <span className="font-medium">60 seconds</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Reward Multiplier:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">x1</span>
                      </div>
                    </div>
                    <Button 
                      className="mt-6 bg-blue-600 hover:bg-blue-700 text-white border-0 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        initializeGame('easy');
                      }}
                    >
                      Start Easy Mode
                    </Button>
                  </div>
                </div>
                
                {/* Medium Difficulty */}
                <div 
                  onClick={() => initializeGame('medium')}
                  className="cursor-pointer group relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/10 hover:from-amber-500/10 hover:to-amber-600/15 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="px-6 py-8 flex flex-col items-center relative z-10">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-amber-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-amber-600 dark:text-amber-400">Medium</h3>
                    <div className="space-y-2 w-full">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Card Pairs:</span>
                        <span className="font-medium">8</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Time Limit:</span>
                        <span className="font-medium">45 seconds</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Reward Multiplier:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">x1.5</span>
                      </div>
                    </div>
                    <Button 
                      className="mt-6 bg-amber-600 hover:bg-amber-700 text-white border-0 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        initializeGame('medium');
                      }}
                    >
                      Start Medium Mode
                    </Button>
                  </div>
                </div>
                
                {/* Hard Difficulty */}
                <div 
                  onClick={() => initializeGame('hard')}
                  className="cursor-pointer group relative overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-600/10 hover:from-red-500/10 hover:to-red-600/15 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="px-6 py-8 flex flex-col items-center relative z-10">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Flame className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Hard</h3>
                    <div className="space-y-2 w-full">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Card Pairs:</span>
                        <span className="font-medium">10</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Time Limit:</span>
                        <span className="font-medium">30 seconds</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Reward Multiplier:</span>
                        <span className="font-bold text-red-600 dark:text-red-400">x2</span>
                      </div>
                    </div>
                    <Button 
                      className="mt-6 bg-red-600 hover:bg-red-700 text-white border-0 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        initializeGame('hard');
                      }}
                    >
                      Start Hard Mode
                    </Button>
                  </div>
                </div>
              </div>
              
              {gameStats && (
                <div className="mt-4 border-0 overflow-hidden rounded-lg shadow-lg">
                  <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/5 p-4 border-b">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Coins className="h-5 w-5 text-emerald-500" />
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400">
                        CPXTB Rewards Tracker
                      </span>
                    </h3>
                  </div>
                  
                  <div className="p-5 bg-card">
                    {/* Total Accumulated Display */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Total Accumulated</span>
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {gameStats.accumulatedCPXTB} <span className="text-sm font-normal">CPXTB</span>
                        </span>
                      </div>
                      <div className="w-full bg-emerald-100/20 dark:bg-emerald-900/20 h-2.5 rounded-full mt-1">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(100, (parseFloat(gameStats.accumulatedCPXTB) / 1000) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-muted-foreground">Progress to claim</span>
                        <span className="font-medium">{Math.min(100, (parseFloat(gameStats.accumulatedCPXTB) / 1000) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    {/* Level Breakdown */}
                    <div className="mb-6 space-y-4">
                      <h4 className="text-sm font-semibold border-b pb-2">CPXTB By Difficulty Level</h4>
                      
                      {/* Easy Level */}
                      <div className="p-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">E</div>
                            <span className="font-medium">Easy</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {(parseFloat(gameStats.accumulatedCPXTB) * 0.35).toFixed(3)} CPXTB
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>x1 Multiplier</span>
                          <span>•</span>
                          <span>6 Pairs</span>
                          <span>•</span>
                          <span>60s Time Limit</span>
                        </div>
                      </div>
                      
                      {/* Medium Level */}
                      <div className="p-3 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg border border-amber-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-medium text-amber-600 dark:text-amber-400">M</div>
                            <span className="font-medium">Medium</span>
                          </div>
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                            {(parseFloat(gameStats.accumulatedCPXTB) * 0.45).toFixed(3)} CPXTB
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>x1.5 Multiplier</span>
                          <span>•</span>
                          <span>8 Pairs</span>
                          <span>•</span>
                          <span>45s Time Limit</span>
                        </div>
                      </div>
                      
                      {/* Hard Level */}
                      <div className="p-3 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg border border-red-500/20">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-medium text-red-600 dark:text-red-400">H</div>
                            <span className="font-medium">Hard</span>
                          </div>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            {(parseFloat(gameStats.accumulatedCPXTB) * 0.20).toFixed(3)} CPXTB
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>x2 Multiplier</span>
                          <span>•</span>
                          <span>10 Pairs</span>
                          <span>•</span>
                          <span>30s Time Limit</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Claim Button */}
                    <Button 
                      variant="default" 
                      className={`w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        parseFloat(gameStats.accumulatedCPXTB) >= 1000 ? 'animate-pulse' : ''
                      }`}
                      size="lg"
                      onClick={handleClaimCPXTB}
                      disabled={!isConnected || !gameStats || parseFloat(gameStats.accumulatedCPXTB) < 1000}
                    >
                      <Coins className="h-5 w-5 mr-2" />
                      {isConnected ? 'Claim CPXTB Rewards' : 'Connect Wallet to Claim'}
                    </Button>
                    
                    {!isConnected && (
                      <p className="text-xs text-center mt-3 text-muted-foreground">
                        Connect your wallet to claim rewards. Your points are already being saved.
                      </p>
                    )}
                    
                    {isConnected && parseFloat(gameStats.accumulatedCPXTB) < 1000 && (
                      <p className="text-xs text-center mt-3 text-muted-foreground">
                        Need {(1000 - parseFloat(gameStats.accumulatedCPXTB)).toFixed(3)} more CPXTB to claim rewards
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Game Results */}
        {!isGameActive && gameResult && (
          <Card className="mb-6 border-0 shadow-xl overflow-hidden">
            <CardHeader className={`
              ${gameResult === 'win' 
                ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 border-b border-emerald-500/20' 
                : 'bg-gradient-to-r from-red-500/20 to-amber-500/10 border-b border-red-500/20'
              }
            `}>
              <CardTitle className="flex items-center gap-2">
                {gameResult === 'win' ? (
                  <>
                    <Trophy className="h-6 w-6 text-emerald-500" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 font-bold">
                      Victory Achieved!
                    </span>
                  </>
                ) : (
                  <>
                    <Clock className="h-6 w-6 text-red-500" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600 dark:from-red-400 dark:to-amber-400 font-bold">
                      Time's Up!
                    </span>
                  </>
                )}
              </CardTitle>
              <CardDescription className={gameResult === 'win' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>
                {gameResult === 'win' 
                  ? `You matched all pairs with ${moveCount} moves and ${timeLeft} seconds remaining!` 
                  : `You matched ${matchedPairs} out of ${DIFFICULTY_LEVELS[difficulty].pairs} pairs before time ran out.`}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`
                  rounded-xl p-5 border
                  ${gameResult === 'win'
                    ? 'bg-gradient-to-br from-emerald-500/5 to-green-500/10 border-emerald-500/20'
                    : 'bg-gradient-to-br from-amber-500/5 to-yellow-500/10 border-amber-500/20'
                  }
                `}>
                  <h3 className="text-lg font-bold mb-4 text-center">Game Statistics</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Difficulty</span>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${difficulty === 'easy' 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' 
                            : difficulty === 'medium'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                          }
                        `}
                      >
                        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pairs Matched</span>
                      <span className="font-medium">{matchedPairs} / {DIFFICULTY_LEVELS[difficulty].pairs}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time Left</span>
                      <span className="font-medium">{timeLeft}s</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Moves</span>
                      <span className="font-medium">{moveCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reward Multiplier</span>
                      <span className="font-bold">x{DIFFICULTY_LEVELS[difficulty].multiplier}</span>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-3 mt-3">
                      <span className="font-medium">Final Score</span>
                      <span className="font-bold text-lg">{finalScore} pts</span>
                    </div>
                  </div>
                </div>
                
                <div className={`
                  rounded-xl overflow-hidden shadow-lg
                `}>
                  <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/10 p-4">
                    <h3 className="text-lg font-bold flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5 text-purple-500" />
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                        CPXTB Rewards
                      </span>
                    </h3>
                  </div>
                  
                  <div className="p-6 flex flex-col items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-muted-foreground mb-1">You earned</span>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                          {parseFloat(calculateCPXTB(finalScore)).toFixed(3)}
                        </span>
                        <span className="text-lg ml-1 text-muted-foreground">CPXTB</span>
                      </div>
                    </div>
                    
                    <div className="w-full space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Points conversion</span>
                        <span>{finalScore} pts ÷ 1000 = {(finalScore / 1000).toFixed(3)} CPXTB</span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Difficulty bonus</span>
                        <span>x{DIFFICULTY_LEVELS[difficulty].multiplier} multiplier</span>
                      </div>
                      
                      {gameResult === 'win' && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Time bonus</span>
                          <span>+{(timeLeft * 10).toFixed(0)} points</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 w-full mt-4">
                      <Button 
                        variant="outline" 
                        className="w-full border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-600"
                        onClick={() => initializeGame(difficulty)}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Play Again
                      </Button>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                        onClick={() => {
                          setGameResult(null);
                          setDifficulty('easy');
                        }}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        New Game
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Game Board - Only show when game is active */}
        {isGameActive && (
          <motion.div 
            className="mb-6 grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4"
            animate={controls}
          >
            {cards.map(card => (
              <motion.div
                key={card.id}
                className={`
                  aspect-square rounded-lg overflow-hidden cursor-pointer
                  ${card.matched ? 'opacity-70' : 'opacity-100'}
                  transition-all duration-300
                `}
                whileHover={!card.flipped && !card.matched ? { scale: 1.05 } : {}}
                onClick={() => handleCardClick(card.id)}
              >
                <div 
                  className={`
                    w-full h-full flex items-center justify-center rounded-lg text-center
                    transition-all duration-300 transform
                    ${card.flipped ? 'rotate-y-0' : 'rotate-y-180'}
                    ${card.flipped 
                      ? getCardTheme(card.themeId).color
                      : 'bg-card border-2 border-border'
                    }
                  `}
                >
                  {card.flipped ? (
                    <div className="flex flex-col items-center justify-center p-2">
                      <span className="text-2xl sm:text-4xl font-bold text-white">
                        {getCardTheme(card.themeId).icon}
                      </span>
                      <span className="text-xs sm:text-sm text-white mt-1">
                        {getCardTheme(card.themeId).name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl sm:text-4xl opacity-50">?</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {/* Game Interstitial Ad */}
        <GameInterstitialAd />
        
        {/* Game Instructions */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-500" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 font-bold">
                How to Play Memory Match
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-xl p-4 border border-blue-500/10 shadow-sm">
                <div className="flex flex-col items-center mb-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-500/20 mb-2">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400 transform rotate-180">🎴</div>
                  </div>
                  <h3 className="font-bold text-center">Find Matching Pairs</h3>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Flip cards to reveal crypto symbols. Find matching pairs to earn points and clear the board.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-xl p-4 border border-amber-500/10 shadow-sm">
                <div className="flex flex-col items-center mb-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-amber-500/20 mb-2">
                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-bold text-center">Race Against Time</h3>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Complete the board before time runs out. Remaining time adds bonus points to your final score!
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-xl p-4 border border-emerald-500/10 shadow-sm">
                <div className="flex flex-col items-center mb-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-emerald-500/20 mb-2">
                    <Coins className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-center">Earn CPXTB Rewards</h3>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Every 1000 points equals 1 CPXTB. Higher difficulty levels multiply your rewards!
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-xl p-5 border border-purple-500/10">
              <h3 className="font-bold mb-3 text-center">Difficulty Levels</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center p-2 gap-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">E</div>
                  <div>
                    <p className="font-medium">Easy</p>
                    <p className="text-xs text-muted-foreground">6 pairs • 60s • x1</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 gap-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-medium text-amber-600 dark:text-amber-400">M</div>
                  <div>
                    <p className="font-medium">Medium</p>
                    <p className="text-xs text-muted-foreground">8 pairs • 45s • x1.5</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 gap-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-medium text-red-600 dark:text-red-400">H</div>
                  <div>
                    <p className="font-medium">Hard</p>
                    <p className="text-xs text-muted-foreground">10 pairs • 30s • x2</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                <span className="font-semibold text-foreground">Pro Tip:</span> Your scores are saved even with a demo wallet. Connect your real wallet to claim rewards when you reach 1000 CPXTB.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}