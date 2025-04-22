import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TimerIcon, Trophy, RotateCw, Sparkles } from "lucide-react";

type CardData = {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
};

export default function MemoryMatchGame() {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedCount, setFlippedCount] = useState(0);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [bestScores, setBestScores] = useState({
    easy: localStorage.getItem("cpxtb-memory-easy") ? JSON.parse(localStorage.getItem("cpxtb-memory-easy") || "0") : 0,
    medium: localStorage.getItem("cpxtb-memory-medium") ? JSON.parse(localStorage.getItem("cpxtb-memory-medium") || "0") : 0,
    hard: localStorage.getItem("cpxtb-memory-hard") ? JSON.parse(localStorage.getItem("cpxtb-memory-hard") || "0") : 0
  });

  // Define card symbols based on crypto/blockchain theme
  const symbols = [
    "₿", "Ξ", "Ł", "Ð", "©", "Ƀ", "₮", "Ӿ", "Ø", "₳", 
    "₽", "Ⱥ", "Đ", "Ƒ", "Ⱦ", "Ⱡ", "Ꝗ", "Ꞗ", "Ꜯ", "Ȿ"
  ];

  // Define difficulty settings
  const difficultyConfig = {
    easy: { pairs: 6, timeLimit: 60 },
    medium: { pairs: 10, timeLimit: 90 },
    hard: { pairs: 15, timeLimit: 120 }
  };

  // Initialize game
  const initializeGame = () => {
    const { pairs } = difficultyConfig[difficulty];
    const gameSymbols = symbols.slice(0, pairs);
    
    // Create pairs of cards
    let newCards: CardData[] = [];
    gameSymbols.forEach((symbol, index) => {
      newCards.push({ id: index * 2, symbol, flipped: false, matched: false });
      newCards.push({ id: index * 2 + 1, symbol, flipped: false, matched: false });
    });
    
    // Shuffle cards
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    
    setCards(newCards);
    setFlippedCount(0);
    setFlippedIndexes([]);
    setMoves(0);
    setGameOver(false);
    setTimer(difficultyConfig[difficulty].timeLimit);
    setGameStarted(true);
  };

  // Handle card flip
  const handleCardClick = (index: number) => {
    // Prevent flipping if the game is over or two cards are already flipped
    if (gameOver || flippedCount >= 2) return;
    // Prevent flipping a card that's already flipped or matched
    if (cards[index].flipped || cards[index].matched) return;

    // Create a copy of the cards array
    let newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    
    // Check if this is the first or second card flipped
    if (flippedCount === 0) {
      setFlippedCount(1);
      setFlippedIndexes([index]);
    } else {
      setFlippedCount(2);
      setFlippedIndexes([...flippedIndexes, index]);
      
      // Increment move counter
      setMoves(moves + 1);
      
      // Check for match
      if (newCards[flippedIndexes[0]].symbol === newCards[index].symbol) {
        newCards[flippedIndexes[0]].matched = true;
        newCards[index].matched = true;
        setCards(newCards);
        
        // Reset flipped count and indexes
        setTimeout(() => {
          setFlippedCount(0);
          setFlippedIndexes([]);
          
          // Check if all cards are matched
          if (newCards.every(card => card.matched)) {
            handleGameWin();
          }
        }, 500);
      } else {
        // Not a match, flip both cards back
        setTimeout(() => {
          newCards[flippedIndexes[0]].flipped = false;
          newCards[index].flipped = false;
          setCards(newCards);
          setFlippedCount(0);
          setFlippedIndexes([]);
        }, 1000);
      }
    }
  };

  // Handle game win
  const handleGameWin = () => {
    setGameOver(true);
    setGameStarted(false);
    
    // Calculate score (more moves = lower score, more time left = higher score)
    const timeBonus = timer;
    const movesPenalty = moves;
    const score = timeBonus * 10 - movesPenalty * 5;
    
    // Check if it's a new best score
    if (score > bestScores[difficulty]) {
      setBestScores({
        ...bestScores,
        [difficulty]: score
      });
      localStorage.setItem(`cpxtb-memory-${difficulty}`, JSON.stringify(score));
      
      toast({
        title: "New Best Score!",
        description: `You set a new record for ${difficulty} difficulty: ${score} points!`,
        variant: "default",
      });
    } else {
      toast({
        title: "Game Complete!",
        description: `You scored ${score} points`,
        variant: "default",
      });
    }
  };

  // Handle game over (time's up)
  const handleTimeout = () => {
    if (!gameOver && gameStarted) {
      setGameOver(true);
      setGameStarted(false);
      
      toast({
        title: "Time's Up!",
        description: "You ran out of time. Try again!",
        variant: "destructive",
      });
    }
  };

  // Timer effect
  useEffect(() => {
    let timerId: number | undefined;
    
    if (gameStarted && !gameOver && timer > 0) {
      timerId = window.setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            handleTimeout();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [gameStarted, gameOver, timer]);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Crypto Memory Match</h1>
        <p className="text-muted-foreground mt-2">
          Match the crypto symbols to win! Train your memory while having fun.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game controls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Game Controls</CardTitle>
              <CardDescription>
                Adjust settings and track your progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Difficulty:</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={difficulty === "easy" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty("easy")}
                    disabled={gameStarted}
                  >
                    Easy
                  </Button>
                  <Button 
                    variant={difficulty === "medium" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty("medium")}
                    disabled={gameStarted}
                  >
                    Medium
                  </Button>
                  <Button 
                    variant={difficulty === "hard" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty("hard")}
                    disabled={gameStarted}
                  >
                    Hard
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center">
                    <TimerIcon className="w-4 h-4 mr-1" />
                    Time Left:
                  </span>
                  <Badge variant="outline" className="text-amber-500">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Moves:</span>
                  <Badge variant="outline">{moves}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pairs:</span>
                  <Badge variant="outline">
                    {cards.filter(card => card.matched).length / 2} / {difficultyConfig[difficulty].pairs}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  className="w-full"
                  onClick={initializeGame}
                  disabled={gameStarted && !gameOver}
                >
                  {gameStarted ? "Restart Game" : "Start Game"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Best Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Easy:</span>
                <Badge variant="secondary">{bestScores.easy || "No score"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Medium:</span>
                <Badge variant="secondary">{bestScores.medium || "No score"}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Hard:</span>
                <Badge variant="secondary">{bestScores.hard || "No score"}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Game board */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Memory Match</span>
                <Badge variant={gameOver ? "destructive" : gameStarted ? "default" : "outline"}>
                  {gameOver ? "Game Over" : gameStarted ? "Game In Progress" : "Ready To Start"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Click on cards to flip them and find matching pairs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!gameStarted && !gameOver ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="text-lg font-medium text-center">
                    Welcome to Crypto Memory Match!
                  </div>
                  <div className="text-sm text-center text-muted-foreground max-w-md">
                    Test your memory by matching pairs of crypto symbols. Select your difficulty and click "Start Game" to begin.
                  </div>
                  <Sparkles className="w-16 h-16 text-primary opacity-20" />
                  <Button onClick={initializeGame} size="lg">
                    Start Game
                  </Button>
                </div>
              ) : cards.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <RotateCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className={`grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 ${gameOver ? 'opacity-60' : ''}`}>
                  {cards.map((card, index) => (
                    <div
                      key={card.id}
                      className={`
                        aspect-square flex items-center justify-center text-2xl md:text-3xl 
                        border rounded-lg cursor-pointer transform transition-all duration-300
                        ${card.flipped ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                        ${card.matched ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-400' : ''}
                        ${(!card.flipped && !card.matched) ? 'hover:bg-muted/70' : ''}
                        ${gameOver ? 'cursor-not-allowed' : ''}
                      `}
                      onClick={() => handleCardClick(index)}
                      style={{
                        transform: `rotateY(${card.flipped ? 180 : 0}deg)`,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      {card.flipped || card.matched ? card.symbol : '?'}
                    </div>
                  ))}
                </div>
              )}
              
              {gameOver && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={initializeGame}
                    variant="default"
                    className="mx-auto"
                  >
                    Play Again
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Tip: Focus on patterns and positions to improve your memory!
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setCards([]);
                  setGameStarted(false);
                  setGameOver(false);
                }}
                disabled={!gameStarted}
              >
                Reset
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}