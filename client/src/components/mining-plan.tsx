import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Coins, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment Form Component
function PaymentForm({ withdrawalAddress, amount, onSuccess }: { 
  withdrawalAddress: string;
  amount: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your mining plan has been activated!",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "An unexpected error occurred during payment.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay & Start Mining"}
      </Button>
    </form>
  );
}

export function MiningPlan() {
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();
  const { isConnected } = useWallet();

  // Constants
  const investmentAmount = 100; // USDT
  const dailyRewardUSD = 15; // USD
  const cpxtbPrice = 0.002529; // Current CPXTB price in USD
  const dailyRewardCPXTB = (dailyRewardUSD / cpxtbPrice).toFixed(2); // Calculate CPXTB equivalent

  const handleInvest = async () => {
    if (!withdrawalAddress) {
      toast({
        variant: "destructive",
        title: "Missing Withdrawal Address",
        description: "Please provide your Base network address for CPXTB rewards",
      });
      return;
    }

    try {
      const response = await apiRequest(
        "POST", 
        "/api/create-payment-intent",
        { 
          amount: investmentAmount,
          withdrawalAddress 
        }
      );
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
      });
    }
  };

  const handlePaymentSuccess = () => {
    setClientSecret(null); // Reset payment form
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          Weekly Mining Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Investment Details</h3>
          <div className="grid gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Required Investment</p>
              <p className="text-2xl font-bold">{investmentAmount} USDT</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Reward</p>
              <p className="text-2xl font-bold text-primary">
                {dailyRewardCPXTB} CPXTB
                <span className="text-sm text-muted-foreground ml-2">
                  (≈${dailyRewardUSD})
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="withdrawal">CPXTB Withdrawal Address (Base Network)</Label>
            <Input
              id="withdrawal"
              placeholder="Enter your Base network address for CPXTB withdrawals"
              value={withdrawalAddress}
              onChange={(e) => setWithdrawalAddress(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Please provide your Base network address to receive CPXTB rewards
            </p>
          </div>

          {isConnected && !clientSecret && (
            <Button 
              className="w-full mt-4" 
              size="lg"
              onClick={handleInvest}
            >
              <Coins className="mr-2 h-4 w-4" />
              Start Mining Plan
            </Button>
          )}

          {clientSecret && (
            <div className="mt-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm 
                  withdrawalAddress={withdrawalAddress}
                  amount={investmentAmount}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}