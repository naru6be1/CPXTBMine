import { useEffect, useState } from "react";
import { Clock, Percent, Tag } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

// Define the discount percentage
const DISCOUNT_PERCENT = 10;

// Regular prices (in USDT)
const REGULAR_PRICES = {
  bronze: "25.00",
  silver: "50.00",
  gold: "100.00"
};

// Calculate discounted prices
const DISCOUNTED_PRICES = {
  bronze: (parseFloat(REGULAR_PRICES.bronze) * (100 - DISCOUNT_PERCENT) / 100).toFixed(2),
  silver: (parseFloat(REGULAR_PRICES.silver) * (100 - DISCOUNT_PERCENT) / 100).toFixed(2),
  gold: (parseFloat(REGULAR_PRICES.gold) * (100 - DISCOUNT_PERCENT) / 100).toFixed(2)
};

interface NewUserDiscountProps {
  className?: string;
  userHasUsedDiscount?: boolean;
}

export function NewUserDiscount({ className, userHasUsedDiscount = false }: NewUserDiscountProps) {
  const { toast } = useToast();
  const { isConnected } = useWallet();
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpiring, setIsExpiring] = useState(false);
  
  // Random end date - between 1-3 days from now
  useEffect(() => {
    // For marketing purposes, create a random expiration between 1-3 days
    const randomHours = Math.floor(Math.random() * 48) + 24; // 24-72 hours
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + randomHours);
    
    const updateTimeLeft = () => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Offer expired');
        return;
      }
      
      // Set warning state if less than 6 hours remaining
      setIsExpiring(diff < 6 * 60 * 60 * 1000);
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };
    
    // Initial update
    updateTimeLeft();
    
    // Update every minute
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // If user has already used their discount, don't show this component
  if (userHasUsedDiscount) {
    return null;
  }
  
  return (
    <Card className={cn("border-primary/20 overflow-hidden relative", className)}>
      <Badge 
        variant="destructive" 
        className={cn(
          "absolute top-0 right-0 rounded-tl-none rounded-br-none font-semibold", 
          isExpiring ? "animate-pulse" : ""
        )}
      >
        <Clock className="h-3 w-3 mr-1" /> {timeLeft}
      </Badge>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <Tag className="h-5 w-5 mr-2 text-primary" />
          Limited-Time Offer
        </CardTitle>
        <CardDescription>
          Special discount for new CPXTB miners
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="text-center my-2">
          <span className="text-4xl font-bold text-primary flex items-center justify-center">
            {DISCOUNT_PERCENT}% <Percent className="h-6 w-6 ml-1" />
          </span>
          <p className="text-sm text-muted-foreground mt-1">off your first mining plan</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 rounded-lg bg-accent/50">
            <div className="font-semibold">Bronze</div>
            <div className="text-xs line-through text-muted-foreground">${REGULAR_PRICES.bronze}</div>
            <div className="text-sm font-bold text-primary">${DISCOUNTED_PRICES.bronze}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/50">
            <div className="font-semibold">Silver</div>
            <div className="text-xs line-through text-muted-foreground">${REGULAR_PRICES.silver}</div>
            <div className="text-sm font-bold text-primary">${DISCOUNTED_PRICES.silver}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/50">
            <div className="font-semibold">Gold</div>
            <div className="text-xs line-through text-muted-foreground">${REGULAR_PRICES.gold}</div>
            <div className="text-sm font-bold text-primary">${DISCOUNTED_PRICES.gold}</div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        <p>Discount automatically applied at checkout. {isConnected ? "Select any mining plan to claim." : "Connect wallet to claim."}</p>
      </CardFooter>
    </Card>
  );
}