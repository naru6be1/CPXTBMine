import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Gift, Pickaxe, Users, Wallet, Clock } from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      icon: <Pickaxe className="h-6 w-6" />,
      title: "Mining Plans",
      description: "Choose from Bronze, Silver, and Gold mining plans with different reward rates and durations. Each plan offers unique CPXTB earning potential based on your investment level."
    },
    {
      icon: <Gift className="h-6 w-6" />,
      title: "Free CPXTB Claims",
      description: "Claim free CPXTB tokens every 24 hours. Our IP-based cooldown system ensures fair distribution and prevents abuse while maintaining system integrity."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Referral Program",
      description: "Earn additional rewards by inviting others to join. Our referral system provides commission on referrals' mining plan purchases, creating a win-win ecosystem."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Enhanced Security",
      description: "Advanced IP-based claim protection and robust transaction mechanisms ensure the safety of your investments and mining rewards."
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      title: "Web3 Integration",
      description: "Seamless integration with Web3 wallets via Web3Modal, supporting multiple wallet connections and secure blockchain transactions."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Real-time Updates",
      description: "Monitor your mining progress, rewards, and referral earnings in real-time with our responsive dashboard interface."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Platform Features</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {feature.icon}
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
