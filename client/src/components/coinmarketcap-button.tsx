import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// CoinMarketCap direct URL for CPXTB
const CMC_URL = 'https://coinmarketcap.com/currencies/coin-prediction-tool-on-base/';

interface CoinMarketCapButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showTooltip?: boolean;
}

export function CoinMarketCapButton({ 
  className = "", 
  variant = "outline", 
  size = "sm",
  showTooltip = true
}: CoinMarketCapButtonProps) {
  const { toast } = useToast();
  
  const handleCMCClick = () => {
    window.open(CMC_URL, '_blank', 'noopener,noreferrer');
    toast({
      title: "Opening CoinMarketCap",
      description: "Click the star icon on CoinMarketCap to add CPXTB to your watchlist",
    });
  };

  const button = (
    <Button 
      variant={variant} 
      size={size}
      className={`flex items-center gap-2 ${variant === 'outline' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none' : ''} ${className}`}
      onClick={handleCMCClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={variant === 'outline' ? "white" : "currentColor"} className="mr-1">
        <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-3.5-6H7v-4h1.5v4zm5 0H12v-4h1.5v4zm-1-8h-1v4h1V6zm5 4h-1.5v4H18v-4z"/>
      </svg>
      View on CoinMarketCap
      <ExternalLink size={14} />
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <p>Click the star icon on CoinMarketCap to add to your watchlist</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}