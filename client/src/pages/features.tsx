import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Gift, Pickaxe, Users, Wallet, Clock, Gamepad2, Trophy, Rocket, LineChart, Share2, Coins } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: <Pickaxe className="h-6 w-6" />,
      title: "Tiered Mining Plans",
      description: "Choose from Bronze, Silver, and Gold mining plans with increasing reward rates. Each tier offers optimized CPXTB earning based on your investment level, with our smart contract ensuring transparent reward distribution."
    },
    {
      icon: <Gamepad2 className="h-6 w-6" />,
      title: "Play-to-Earn Gaming",
      description: "Earn CPXTB tokens by playing our integrated games. Navigate through asteroid fields in Space Mining or test your memory in our Memory Match game - both offering CPXTB rewards based on your skill level."
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: "Free CPXTB Claims",
      description: "Claim free CPXTB tokens every 24 hours with no investment required. Our IP-based cooldown system ensures fair distribution while preventing abuse, making cryptocurrency accessible to everyone."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Referral Program",
      description: "Build your mining network with our referral system. Share your unique code to earn commission on referrals' mining activities without affecting their earnings, creating a sustainable growth ecosystem."
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Base Network Integration",
      description: "Operating on Coinbase's Base network, our platform offers high-speed transactions with minimal fees. CPXTB token (contract: 0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b) powers all platform activities."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enhanced Security",
      description: "Multi-layered protection systems including IP-based claim verification, secure wallet connections, and robust smart contract architecture keep your assets and activities protected at all times."
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Flexible Wallet Integration",
      description: "Connect with popular Web3 wallets via WalletConnect or browser injections. The platform allows gameplay without connection and only requires wallet authorization when claiming rewards."
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "Real-time Analytics",
      description: "Track your mining progress, game earnings, and referral statistics through our intuitive dashboard. Real-time CPXTB price feeds from Uniswap keep you informed on current token values."
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: "Game Score Tracking",
      description: "Our platform maintains detailed records of your gaming achievements across different game types. The unified reward system converts all game points at 1000:1 ratio to CPXTB tokens."
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "Social Integration",
      description: "Share your mining successes and game achievements directly to social media platforms. Our integrated sharing tools help you grow your referral network and showcase your accomplishments."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time-Based Rewards",
      description: "Mining plans mature over specific time periods, with higher tier plans offering optimized reward rates. Our system automatically tracks maturity and distributes rewards without manual intervention."
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Multi-Revenue Streams",
      description: "Maximize your earnings through multiple channels simultaneously: active mining plans, gaming rewards, referral commissions, and free daily claims all contribute to your CPXTB balance."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Platform Features</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Our CPXTB ecosystem combines traditional cryptocurrency mining with innovative play-to-earn mechanics, 
        creating multiple pathways to earn tokens regardless of technical expertise or investment capacity.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-primary/10 p-2 rounded-md text-primary">
                  {feature.icon}
                </div>
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
