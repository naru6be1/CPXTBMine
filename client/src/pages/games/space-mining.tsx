import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Rocket, Database, Award, Clock, Users } from "lucide-react";

export default function SpaceMiningGame() {
  const [cpxtbMined, setCpxtbMined] = useState(0);
  const [miningPower, setMiningPower] = useState(1);
  const [miningRate, setMiningRate] = useState(0.1); // CPXTB per click
  const [autoMineRate, setAutoMineRate] = useState(0);
  const [upgrades, setUpgrades] = useState({
    basicDrill: { level: 0, cost: 10, power: 0.2, name: "Basic CPXTB Drill" },
    advancedMiner: { level: 0, cost: 50, power: 0.5, name: "Advanced Mining Rig" },
    quantumExtractor: { level: 0, cost: 200, power: 2, name: "Quantum Extractor" },
    autoMiner: { level: 0, cost: 100, power: 0.05, name: "Auto Miner" },
  });
  
  const [asteroidHealth, setAsteroidHealth] = useState(100);
  const [asteroidMaxHealth, setAsteroidMaxHealth] = useState(100);
  const [asteroidLevel, setAsteroidLevel] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  
  // Limited slots countdown
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [availableSlots, setAvailableSlots] = useState(15);
  
  // Auto mining effect
  useEffect(() => {
    const autoMineInterval = setInterval(() => {
      if (autoMineRate > 0) {
        setCpxtbMined(prev => {
          const newValue = prev + autoMineRate;
          return parseFloat(newValue.toFixed(2));
        });
      }
    }, 1000);
    
    return () => clearInterval(autoMineInterval);
  }, [autoMineRate]);
  
  // Mine function
  const mine = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    const miningAmount = miningRate * miningPower;
    
    // Reduce asteroid health
    const newHealth = asteroidHealth - miningAmount * 10;
    
    if (newHealth <= 0) {
      // Asteroid depleted, spawn a new one
      const bonus = Math.round(asteroidLevel * 5);
      setCpxtbMined(prev => parseFloat((prev + miningAmount + bonus).toFixed(2)));
      setAsteroidLevel(prev => prev + 1);
      const newMaxHealth = 100 + ((asteroidLevel) * 20);
      setAsteroidMaxHealth(newMaxHealth);
      setAsteroidHealth(newMaxHealth);
    } else {
      setAsteroidHealth(newHealth);
      setCpxtbMined(prev => parseFloat((prev + miningAmount).toFixed(2)));
    }
  };
  
  // Purchase upgrade
  const purchaseUpgrade = (upgradeKey: keyof typeof upgrades) => {
    const upgrade = upgrades[upgradeKey];
    
    if (cpxtbMined >= upgrade.cost) {
      setCpxtbMined(prev => parseFloat((prev - upgrade.cost).toFixed(2)));
      
      setUpgrades(prev => {
        const newUpgrades = { ...prev };
        newUpgrades[upgradeKey].level += 1;
        newUpgrades[upgradeKey].cost = Math.ceil(upgrade.cost * 1.5);
        return newUpgrades;
      });
      
      // Update mining stats based on upgrade
      if (upgradeKey === 'autoMiner') {
        setAutoMineRate(prev => parseFloat((prev + upgrade.power).toFixed(2)));
      } else {
        setMiningPower(prev => parseFloat((prev + upgrade.power).toFixed(2)));
      }
    }
  };
  
  // Create particles effect for mining
  const createParticles = (e: React.MouseEvent) => {
    if (!gameRef.current) return;
    
    const rect = gameRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.classList.add('absolute', 'w-2', 'h-2', 'bg-yellow-400', 'rounded-full');
      
      // Random position around click
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 50 + 10;
      
      particle.style.left = `${x + Math.cos(angle) * distance}px`;
      particle.style.top = `${y + Math.sin(angle) * distance}px`;
      
      // Animation
      particle.animate(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: `translate(${Math.cos(angle) * 20}px, ${Math.sin(angle) * 20}px) scale(0)` }
        ],
        {
          duration: 500 + Math.random() * 500,
          easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
        }
      );
      
      gameRef.current.appendChild(particle);
      
      // Remove particle after animation
      setTimeout(() => {
        if (gameRef.current && gameRef.current.contains(particle)) {
          gameRef.current.removeChild(particle);
        }
      }, 1000);
    }
  };
  
  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">CPXTB Space Mining Game</h1>
        <p className="text-muted-foreground mt-2">Mine virtual CPXTB tokens in this fun mini-game</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main mining area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mining Zone - Level {asteroidLevel}</span>
                <Badge variant="outline" className="ml-2">
                  <Database className="w-3 h-3 mr-1" />
                  {cpxtbMined.toFixed(2)} CPXTB
                </Badge>
              </CardTitle>
              <CardDescription>
                Click on the asteroid to mine CPXTB tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="relative overflow-hidden">
              <div ref={gameRef} className="relative w-full aspect-[4/3] bg-gradient-to-b from-slate-900 to-indigo-950 rounded-lg flex items-center justify-center overflow-hidden">
                {/* Stars background */}
                <div className="absolute inset-0">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div 
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full animate-pulse opacity-70"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 3}s`
                      }}
                    />
                  ))}
                </div>
                
                {/* Asteroid */}
                <div 
                  className={`relative w-40 h-40 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer transition-transform ${isAnimating ? 'scale-95' : 'scale-100'}`}
                  onClick={(e) => {
                    mine();
                    createParticles(e);
                  }}
                  style={{
                    backgroundImage: `radial-gradient(circle, #555, #333)`,
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.2)'
                  }}
                >
                  {/* Asteroid texture */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i}
                      className="absolute bg-gray-700 rounded-full"
                      style={{
                        width: `${Math.random() * 15 + 5}px`,
                        height: `${Math.random() * 15 + 5}px`,
                        left: `${Math.random() * 80 + 10}%`,
                        top: `${Math.random() * 80 + 10}%`,
                      }}
                    />
                  ))}
                  
                  {/* Glow when clicked */}
                  <div className={`absolute inset-0 rounded-full bg-yellow-400 opacity-0 ${isAnimating ? 'animate-ping' : ''}`}></div>
                  
                  <span className="relative text-xs text-white font-bold">CLICK</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Asteroid Health</span>
                  <span>{Math.max(0, Math.round(asteroidHealth))} / {asteroidMaxHealth}</span>
                </div>
                <Progress value={(asteroidHealth / asteroidMaxHealth) * 100} className="h-2" />
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm">
                  <Rocket className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Mining Power: {miningPower.toFixed(1)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Database className="w-4 h-4 mr-2 text-green-500" />
                  <span>Per Click: {(miningRate * miningPower).toFixed(2)} CPXTB</span>
                </div>
                <div className="flex items-center text-sm">
                  <Award className="w-4 h-4 mr-2 text-purple-500" />
                  <span>Level Bonus: {(asteroidLevel * 5)} CPXTB</span>
                </div>
                <div className="flex items-center text-sm">
                  <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                  <span>Auto Mining: {autoMineRate.toFixed(2)}/sec</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                *Note: This is just a fun mini-game. These are not real CPXTB tokens.
              </p>
              <Button variant="outline" size="sm" onClick={() => {
                setCpxtbMined(0);
                setMiningPower(1);
                setAutoMineRate(0);
                setAsteroidLevel(1);
                setAsteroidHealth(100);
                setAsteroidMaxHealth(100);
                setUpgrades({
                  basicDrill: { level: 0, cost: 10, power: 0.2, name: "Basic CPXTB Drill" },
                  advancedMiner: { level: 0, cost: 50, power: 0.5, name: "Advanced Mining Rig" },
                  quantumExtractor: { level: 0, cost: 200, power: 2, name: "Quantum Extractor" },
                  autoMiner: { level: 0, cost: 100, power: 0.05, name: "Auto Miner" },
                });
              }}>
                Reset Game
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Upgrades shop */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Mining Upgrades</CardTitle>
              <CardDescription>
                Upgrade your mining equipment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(upgrades).map(([key, upgrade]) => (
                <div 
                  key={key} 
                  className="border rounded-lg p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{upgrade.name}</h4>
                    <Badge variant="secondary">Level {upgrade.level}</Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {key === 'autoMiner' 
                      ? `+${upgrade.power.toFixed(2)} CPXTB/sec` 
                      : `+${upgrade.power.toFixed(1)} mining power`
                    }
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Cost: {upgrade.cost.toFixed(0)} CPXTB
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => purchaseUpgrade(key as keyof typeof upgrades)}
                      disabled={cpxtbMined < upgrade.cost}
                      variant={cpxtbMined >= upgrade.cost ? "default" : "outline"}
                    >
                      {cpxtbMined >= upgrade.cost ? "Purchase" : "Not enough CPXTB"}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-md px-4 py-1">
                  <Database className="w-3 h-3 mr-2" />
                  {cpxtbMined.toFixed(2)} CPXTB Available
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Keep mining to earn more CPXTB for upgrades
                </p>
              </div>
            </CardFooter>
          </Card>
          
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>How to Play</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>1. Click on the asteroid to mine CPXTB</p>
                <p>2. Buy upgrades to increase your mining power</p>
                <p>3. Auto miners will mine CPXTB even when you're not clicking</p>
                <p>4. When an asteroid is depleted, you get a bonus and a new, higher-level asteroid appears</p>
                <p>5. Higher level asteroids have more health but give bigger bonuses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}