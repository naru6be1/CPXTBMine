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
      isAvailable: true
    },
    {
      name: "Memory Match",
      description: "Test your memory by matching crypto pairs and earn CPXTB rewards for each match.",
      difficulty: "Medium",
      link: "/games/memory-match",
      isAvailable: true
    },
    {
      name: "Crypto Defense",
      description: "Protect your mining operations from cyber attacks and earn bonus CPXTB.",
      difficulty: "Medium",
      link: "/games/crypto-defense",
      isAvailable: false
    },
    {
      name: "Mining Empire",
      description: "Build and manage your own mining empire to maximize CPXTB earnings.",
      difficulty: "Hard",
      link: "/games/mining-empire",
      isAvailable: false
    }
  ];

  const handleGameClick = (game: typeof games[0]) => {
    if (!game.isAvailable) {
      alert("Game coming soon! Stay tuned for exciting CPXTB gaming experiences.");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6 text-primary" />
          Recommended Games
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((game, index) => (
            game.isAvailable ? (
              <Link key={index} href={game.link}>
                <Card 
                  className="bg-muted/50 cursor-pointer transition-all hover:shadow-lg hover:bg-muted"
                >
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">{game.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium">Difficulty: {game.difficulty}</p>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Play Now <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card 
                key={index}
                className="bg-muted/50 cursor-pointer transition-all hover:shadow-lg hover:bg-muted"
                onClick={() => handleGameClick(game)}
              >
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{game.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-medium">Difficulty: {game.difficulty}</p>
                    <Button variant="ghost" size="sm" className="gap-1">
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