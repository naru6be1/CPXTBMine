import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Gift, Pickaxe, Users, Wallet, Clock, BarChart, Rocket, LineChart, Share2, Coins } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: <Pickaxe className="h-6 w-6" />,
      title: "Tiered Mining Plans",
      description: "Choose from Bronze, Silver, and Gold mining plans with increasing reward rates. Each tier offers optimized CPXTB earning based on your investment level, with our smart contract ensuring transparent reward distribution."
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Optimized Mining Rewards",
      description: "Earn CPXTB tokens through our optimized mining system that delivers consistent returns. Our advanced algorithms ensure fair reward distribution based on your selected mining plan tier."
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
      description: "Connect with popular Web3 wallets via WalletConnect or browser injections. The platform requires wallet authorization only when needed for transactions and claiming rewards."
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "Real-time Analytics",
      description: "Track your mining progress and referral statistics through our intuitive dashboard. Real-time CPXTB price feeds from Uniswap keep you informed on current token values."
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "Social Integration",
      description: "Share your mining successes directly to social media platforms. Our integrated sharing tools help you grow your referral network and showcase your accomplishments."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time-Based Rewards",
      description: "Mining plans mature over specific time periods, with higher tier plans offering optimized reward rates. Our system automatically tracks maturity and distributes rewards without manual intervention."
    },
    {
      icon: <Coins className="h-6 w-6" />,
      title: "Multi-Revenue Streams",
      description: "Maximize your earnings through multiple channels simultaneously: active mining plans, referral commissions, and free daily claims all contribute to your CPXTB balance."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Platform Features</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Our CPXTB ecosystem provides a revolutionary approach to cryptocurrency mining,
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
