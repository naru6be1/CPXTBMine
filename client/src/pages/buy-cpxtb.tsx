import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { PayPalButton } from "@/components/PayPalButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { useSocialLogin } from "../providers/SocialLoginProvider";

export default function BuyCPXTBPage() {
  const [amount, setAmount] = useState("10.00");
  const [cpxtbAmount, setCpxtbAmount] = useState("5000");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPurchaseComplete, setIsPurchaseComplete] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userInfo, walletAddress } = useSocialLogin();

  // Effect to calculate CPXTB amount based on USD amount
  useEffect(() => {
    // Simple conversion rate: 1 USD = 500 CPXTB
    // In a real app, this would come from the current token price
    const conversionRate = 500;
    const usdAmount = parseFloat(amount) || 0;
    const tokens = (usdAmount * conversionRate).toString();
    setCpxtbAmount(tokens);
  }, [amount]);

  const handlePurchaseSuccess = (data: any) => {
    setIsProcessing(false);
    setIsPurchaseComplete(true);
    console.log("Purchase complete:", data);
  };

  const handlePurchaseError = (errorMessage: string) => {
    setIsProcessing(false);
    toast({
      title: "Purchase Failed",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const handleReturnToPayment = () => {
    // This would navigate back to the payment page
    setLocation("/pay");
  };

  const handleComplete = () => {
    // Redirect to dashboard or payment page as appropriate
    setLocation("/");
  };

  if (!userInfo || !walletAddress) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Card>
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>
              You need to be logged in to purchase CPXTB tokens.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isPurchaseComplete) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <Card>
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-center">Purchase Complete!</CardTitle>
            <CardDescription className="text-center">
              You have successfully purchased {cpxtbAmount} CPXTB tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Details</p>
              <p className="mb-1 text-sm">Amount: ${amount} USD</p>
              <p className="mb-1 text-sm">CPXTB Tokens: {cpxtbAmount}</p>
              <p className="text-sm">Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleComplete} className="w-full">
              Complete
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleReturnToPayment}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <CardTitle>Buy CPXTB Tokens</CardTitle>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>
          <CardDescription>
            Purchase CPXTB tokens using PayPal to complete your payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              placeholder="10.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="1"
              step="0.01"
              disabled={isProcessing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cpxtb-amount">CPXTB Tokens to Receive</Label>
            <Input
              id="cpxtb-amount"
              value={cpxtbAmount}
              disabled
              className="bg-gray-50 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Current exchange rate: 1 USD = 500 CPXTB
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <p>
              Tokens will be sent to:{" "}
              <span className="font-mono">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
              </span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <PayPalButton
            amount={amount}
            cpxtbAmount={cpxtbAmount}
            walletAddress={walletAddress}
            onSuccess={handlePurchaseSuccess}
            onError={handlePurchaseError}
          />
          <Button
            variant="outline"
            onClick={handleReturnToPayment}
            disabled={isProcessing}
            className="w-full"
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}