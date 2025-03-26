import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface Mineral {
  id: number;
  x: number;
  y: number;
  value: number;
}

export default function SpaceMiningGame() {
  const [score, setScore] = useState(0);
  const [minerals, setMinerals] = useState<Mineral[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds game duration
  const controls = useAnimation();

  // Initialize game
  const startGame = () => {
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

  // Game timer
  useEffect(() => {
    if (!gameStarted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameStarted(false);
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
              <div className="text-xl">
                Score: {score} | Time: {timeLeft}s
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
                  <p className="text-xl mb-4">Final Score: {score}</p>
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

        <Card>
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Click the glowing minerals to collect them</li>
              <li>Each mineral has a random value between 1-10 points</li>
              <li>Collect as many minerals as possible in 60 seconds</li>
              <li>The game ends when the timer reaches zero</li>
              <li>Try to get the highest score possible!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
