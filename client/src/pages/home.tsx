import { ConnectWallet } from "@/components/connect-wallet";
import { PriceDisplay } from "@/components/price-display";
import { MiningPlan } from "@/components/mining-plan";
import { useWallet } from "@/hooks/use-wallet";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HomePageTopAd, ContentBottomAd } from "@/components/ad-placement";

// Add GameRecommendations component
function GameRecommendations() {
  const games = [
    {
      name: "Space Mining Adventure",
      description: "Explore the galaxy while mining rare minerals and earning CPXTB rewards.",
      difficulty: "Easy",
      link: "/games/space-mining",
      isAvailable: true,
      icon: "🚀",
      color: "from-blue-500/20 to-indigo-500/20",
      borderColor: "border-blue-500/50",
      buttonColor: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400"
    },
    {
      name: "Memory Match",
      description: "Test your memory by matching crypto pairs and earn CPXTB rewards for each match.",
      difficulty: "Medium",
      link: "/games/memory-match",
      isAvailable: true,
      icon: "🎮",
      color: "from-emerald-500/20 to-green-500/20",
      borderColor: "border-emerald-500/50",
      buttonColor: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
    },
    {
      name: "Crypto Defense",
      description: "Protect your mining operations from cyber attacks and earn bonus CPXTB.",
      difficulty: "Medium",
      link: "/games/crypto-defense",
      isAvailable: false,
      icon: "🛡️",
      color: "from-amber-500/20 to-yellow-500/20",
      borderColor: "border-amber-500/50",
      buttonColor: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400"
    },
    {
      name: "Mining Empire",
      description: "Build and manage your own mining empire to maximize CPXTB earnings.",
      difficulty: "Hard",
      link: "/games/mining-empire",
      isAvailable: false,
      icon: "⛏️",
      color: "from-purple-500/20 to-violet-500/20",
      borderColor: "border-purple-500/50",
      buttonColor: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400"
    }
  ];

  const handleGameClick = (game: typeof games[0]) => {
    if (!game.isAvailable) {
      alert("Game coming soon! Stay tuned for exciting CPXTB gaming experiences.");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto overflow-hidden border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-primary" />
          Featured Games
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game, index) => (
            game.isAvailable ? (
              <Link key={index} href={game.link} className="block">
                <Card 
                  className={`h-full border border-transparent hover:${game.borderColor} bg-gradient-to-br ${game.color} shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{game.icon}</span>
                      <h3 className="font-bold text-lg">{game.name}</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground flex-grow mb-4">{game.description}</p>
                    
                    <div className="flex justify-between items-center mt-auto">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${game.buttonColor}`}>
                        {game.difficulty}
                      </span>
                      <Button variant="ghost" size="sm" className={`gap-1 ${game.buttonColor}`}>
                        Play Now <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Score Display */}
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Your best score</span>
                        <span className="font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          4,000+ points
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card 
                key={index}
                className={`h-full border border-transparent bg-gradient-to-br ${game.color} opacity-80 shadow transition-all duration-300 overflow-hidden`}
                onClick={() => handleGameClick(game)}
              >
                <CardContent className="p-6 h-full flex flex-col relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                    <div className="text-lg font-bold text-center px-6 py-3 rounded-full bg-muted/80 shadow-md">
                      Coming Soon
                    </div>
                  </div>
                
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{game.icon}</span>
                    <h3 className="font-bold text-lg">{game.name}</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground flex-grow mb-4">{game.description}</p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${game.buttonColor}`}>
                      {game.difficulty}
                    </span>
                    <Button variant="ghost" size="sm" className={`gap-1 ${game.buttonColor}`}>
                      Coming Soon <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { isConnected, address } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect your wallet and view real-time CPXTB/WETH prices
          </p>
        </div>

        <PriceDisplay />
        
        {/* Top Ad Banner */}
        <HomePageTopAd />

        {/* Add GameRecommendations before MiningPlan */}
        <GameRecommendations />
        <MiningPlan />
        
        {/* Bottom Content Ad */}
        <ContentBottomAd />

        <div className="max-w-md mx-auto">
          <ConnectWallet />
        </div>

        {isConnected && address && (
          <div className="animate-fade-in">
            <div className="bg-primary/5 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                🎉 Successfully Connected!
              </h2>
              <p className="text-muted-foreground">
                Your wallet ({address.slice(0, 6)}...{address.slice(-4)}) is now connected to our DApp
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with links */}
      <footer className="w-full max-w-4xl mx-auto mt-16 mb-8 px-4">
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-muted-foreground">
            <Link href="/about-us" className="hover:text-primary transition-colors">
              About Us
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <span className="hidden md:inline">•</span>
            <Link href="/contact" className="hover:text-primary transition-colors">
              Contact Us
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            © 2025 CPXTB Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}