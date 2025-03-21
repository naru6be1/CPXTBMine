import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { FaTwitter } from "react-icons/fa";

interface SocialShareProps {
  referralCode: string;
}

export function SocialShare({ referralCode }: SocialShareProps) {
  const shareMessage = `🎉 Claim your FREE CPXTB tokens! Use my referral code: ${referralCode}\n\nJoin now and start earning rewards! 💰`;
  const shareUrl = `${window.location.origin}?ref=${referralCode}`;

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(telegramUrl, '_blank');
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground text-center">
        Share with friends to help them claim free CPXTB!
      </p>
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          className="flex-1 bg-[#1DA1F2] text-white hover:bg-[#1a8cd8]"
          onClick={handleTwitterShare}
        >
          <FaTwitter className="mr-2 h-4 w-4" />
          Share on Twitter
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-[#229ED9] text-white hover:bg-[#1e8bc3]"
          onClick={handleTelegramShare}
        >
          <SiTelegram className="mr-2 h-4 w-4" />
          Share on Telegram
        </Button>
      </div>
    </div>
  );
}