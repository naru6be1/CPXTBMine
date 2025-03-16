import { Button } from "@/components/ui/button";
import { BsTwitterX, BsWhatsapp } from "react-icons/bs";
import { FaTelegramPlane } from "react-icons/fa";
import { PiShareFat } from "react-icons/pi";
import { useToast } from "@/hooks/use-toast";

const SHARE_TEXT = "Join CPXTB Mining - Earn rewards in CPXTB tokens through our mining plans! 🚀";
const WEBSITE_URL = "https://coinpredictiontool.com";

export function SocialShare() {
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(WEBSITE_URL);
      toast({
        title: "Link Copied",
        description: "Website link has been copied to your clipboard!"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try copying the link manually"
      });
    }
  };

  const shareOnTwitter = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(WEBSITE_URL)}`;
    window.open(tweetUrl, '_blank');
  };

  const shareOnTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(WEBSITE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`;
    window.open(telegramUrl, '_blank');
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n${WEBSITE_URL}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-2xl mx-auto bg-card rounded-lg p-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <PiShareFat className="h-5 w-5" />
        Share CPXTB Mining
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <Button
          variant="outline"
          onClick={shareOnTwitter}
          className="w-full"
        >
          <BsTwitterX className="mr-2 h-4 w-4" />
          Twitter
        </Button>

        <Button
          variant="outline"
          onClick={shareOnTelegram}
          className="w-full"
        >
          <FaTelegramPlane className="mr-2 h-4 w-4" />
          Telegram
        </Button>

        <Button
          variant="outline"
          onClick={shareOnWhatsApp}
          className="w-full"
        >
          <BsWhatsapp className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>

        <Button
          variant="outline"
          onClick={handleCopyLink}
          className="w-full"
        >
          <PiShareFat className="mr-2 h-4 w-4" />
          Copy Link
        </Button>
      </div>
    </div>
  );
}