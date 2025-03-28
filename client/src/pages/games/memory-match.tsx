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
import { ArrowLeft, Award, Brain, Clock, Coins, Shuffle } from 'lucide-react';

// Constants
const POINTS_PER_CPXTB = 1000; // 1000 points = 1 CPXTB (same as Space Mining)
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
          
          // Capture current score directly from state before setting other states
          const capturedScore = score;
          console.log('TIME\'S UP! Captured score BEFORE game end:', capturedScore);
          
          // Set final score immediately
          setFinalScore(capturedScore);
          
          // Then set game states
          setIsGameActive(false);
          setGameResult('lose');
          
          // Add a more substantial delay before ending the game to ensure state updates
          setTimeout(() => {
            console.log('TIME\'S UP! Final score state before handleGameEnd:', finalScore);
            handleGameEnd(false, capturedScore);
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
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Game Status
              </CardTitle>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {timeLeft}s
                </Badge>
                
                <Badge variant="outline" className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {matchedPairs}/{DIFFICULTY_LEVELS[difficulty].pairs} Pairs
                </Badge>
                
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  {score} pts
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Progress 
              value={(timeLeft / DIFFICULTY_LEVELS[difficulty].timeLimit) * 100} 
              className="h-2 mb-2" 
            />
            
            <div className="text-sm text-muted-foreground flex items-center justify-between">
              <span>Moves: {moveCount}</span>
              <span>CPXTB: {parseFloat(calculateCPXTB(score)).toFixed(3)}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Game Board */}
        {!isGameActive && !gameResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Difficulty</CardTitle>
              <CardDescription>Higher difficulty gives better rewards!</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(DIFFICULTY_LEVELS).map(([level, config]) => (
                  <Button
                    key={level}
                    onClick={() => initializeGame(level as DifficultyLevel)}
                    variant={level === 'easy' ? 'default' : level === 'medium' ? 'secondary' : 'outline'}
                    className="h-24"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold mb-1">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                      <span className="text-xs">{config.pairs} pairs • {config.timeLimit}s</span>
                      <span className="text-xs mt-1">Reward x{config.multiplier}</span>
                    </div>
                  </Button>
                ))}
              </div>
              
              {gameStats && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Total Accumulated CPXTB:</span>
                    <span className="font-bold">{gameStats.accumulatedCPXTB}</span>
                  </div>
                  
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={handleClaimCPXTB}
                    disabled={!isConnected || !gameStats || parseFloat(gameStats.accumulatedCPXTB) < 1000}
                  >
                    {isConnected ? 'Claim CPXTB Rewards' : 'Connect Wallet to Claim'}
                  </Button>
                  
                  {!isConnected && (
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                      Connect your wallet to claim rewards. Your points are being saved.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Game Results */}
        {!isGameActive && gameResult && (
          <Card className="mb-6 border-2 border-primary">
            <CardHeader className={gameResult === 'win' ? 'bg-primary/10' : 'bg-destructive/10'}>
              <CardTitle>{gameResult === 'win' ? '🎉 Victory!' : '⏰ Time\'s Up!'}</CardTitle>
              <CardDescription>
                {gameResult === 'win' 
                  ? `You matched all pairs with ${moveCount} moves and ${timeLeft} seconds remaining!` 
                  : `You matched ${matchedPairs} out of ${DIFFICULTY_LEVELS[difficulty].pairs} pairs.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-lg">Final Score: <span className="font-bold">{finalScore}</span> points</p>
                  <p className="text-2xl font-bold text-primary mt-2">{parseFloat(calculateCPXTB(finalScore)).toFixed(3)} CPXTB earned</p>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  <Button variant="outline" onClick={() => initializeGame(difficulty)}>
                    <Shuffle className="h-4 w-4 mr-2" />
                    Play Again
                  </Button>
                  <Button variant="default" onClick={() => {
                    setGameResult(null);
                    setDifficulty('easy');
                  }}>
                    Change Difficulty
                  </Button>
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
        
        {/* Game Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Flip cards to find matching crypto pairs</li>
              <li>Match all pairs before time runs out</li>
              <li>Higher difficulty levels give better rewards</li>
              <li>Bonus points for remaining time when you win</li>
              <li>Every 1000 points equals 1 CPXTB reward</li>
              <li>Accumulate 1000 CPXTB to claim your rewards</li>
              <li>Try to get the highest score possible!</li>
            </ul>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Note: Your scores are saved even when playing with a demo wallet. Connect your real wallet to claim rewards.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}