import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PayPalButtonProps {
  amount: string;
  cpxtbAmount: string;
  walletAddress: string;
  onSuccess?: (transactionData: any) => void;
  onError?: (error: string) => void;
}

/**
 * PayPal button component for purchasing CPXTB tokens
 * This component handles the PayPal payment flow:
 * 1. Creates a PayPal order
 * 2. Redirects to PayPal for payment
 * 3. Captures payment on return
 * 4. Processes token purchase
 */
export function PayPalButton({
  amount,
  cpxtbAmount,
  walletAddress,
  onSuccess,
  onError
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPayPalConfigured, setIsPayPalConfigured] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const { toast } = useToast();

  // Check if PayPal is configured when component mounts
  useEffect(() => {
    const checkPayPalConfig = async () => {
      try {
        setIsCheckingConfig(true);
        const response = await apiRequest("GET", "/api/paypal/status");
        const data = await response.json();
        setIsPayPalConfigured(data.configured);
      } catch (error) {
        console.error("Error checking PayPal configuration:", error);
        setIsPayPalConfigured(false);
      } finally {
        setIsCheckingConfig(false);
      }
    };

    checkPayPalConfig();
  }, []);

  // Function to create PayPal order and redirect to PayPal
  const handlePayPalPurchase = async () => {
    try {
      setIsLoading(true);
      
      // Create PayPal order
      const orderResponse = await apiRequest("POST", "/api/paypal/create-token-order", {
        amount,
        cpxtbAmount,
        currency: "USD"
      });
      
      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create PayPal order");
      }
      
      console.log("PayPal order created:", orderData);
      
      // Normally we would redirect to PayPal using the approvalUrl
      // For now, we'll just simulate a successful payment for demo purposes
      // In production, we would do: window.location.href = orderData.approvalUrl;
      
      // This is just for our demo implementation until we have real PayPal credentials
      // In production, the flow would be different - user would be redirected to PayPal,
      // then back to our site where we'd capture the payment and process the token purchase
      
      setTimeout(async () => {
        try {
          // Normally this would happen after redirect back from PayPal
          const captureResponse = await apiRequest(
            "POST", 
            `/api/paypal/capture-payment/${orderData.orderId}`,
            {}
          );
          
          const captureData = await captureResponse.json();
          
          if (!captureData.success) {
            throw new Error(captureData.message || "Failed to capture PayPal payment");
          }
          
          console.log("PayPal payment captured:", captureData);
          
          // Process token purchase
          const purchaseResponse = await apiRequest(
            "POST",
            "/api/paypal/process-token-purchase",
            {
              orderId: orderData.orderId,
              walletAddress,
              amount,
              cpxtbAmount
            }
          );
          
          const purchaseData = await purchaseResponse.json();
          
          if (!purchaseData.success) {
            throw new Error(purchaseData.message || "Failed to process token purchase");
          }
          
          console.log("Token purchase processed:", purchaseData);
          
          toast({
            title: "Purchase Successful",
            description: `Successfully purchased ${cpxtbAmount} CPXTB tokens`,
            variant: "success",
          });
          
          if (onSuccess) {
            onSuccess(purchaseData);
          }
        } catch (error: any) {
          console.error("Error in payment process:", error);
          toast({
            title: "Purchase Failed",
            description: error.message || "Failed to complete purchase",
            variant: "destructive",
          });
          
          if (onError) {
            onError(error.message || "Payment failed");
          }
        } finally {
          setIsLoading(false);
        }
      }, 2000); // Simulate network delay for demo
      
    } catch (error: any) {
      console.error("PayPal payment error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred with PayPal",
        variant: "destructive",
      });
      
      if (onError) {
        onError(error.message || "Payment error");
      }
      
      setIsLoading(false);
    }
  };

  if (isCheckingConfig) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Checking payment options...
      </Button>
    );
  }

  if (!isPayPalConfigured) {
    return (
      <div className="w-full rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
        <p className="text-center">
          PayPal payment is not available at this time. Please try another payment method.
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={handlePayPalPurchase}
      disabled={isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.5 3h15a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 0 5 10.5v9a1.5 1.5 0 0 1-1.5 1.5h0A1.5 1.5 0 0 1 2 19.5v-15A1.5 1.5 0 0 1 3.5 3z" />
            <path d="M8 8h8" />
            <path d="M8 12h12" />
            <path d="M8 16h5" />
          </svg>
          Pay with PayPal
        </>
      )}
    </Button>
  );
}

export default PayPalButton;