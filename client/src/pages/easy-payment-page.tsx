import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSearch } from 'wouter/use-location';
import { Web3AuthProvider } from '@/components/SocialLoginProvider';
import EasyPaymentForm from '@/components/EasyPaymentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, ThumbsUp } from 'lucide-react';

/**
 * Easy Payment Page - loaded when a customer scans a QR code
 * Provides a simple interface for making payments with social login
 */
const EasyPaymentPage = () => {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Extract payment details from URL parameters
  const merchantAddress = new URLSearchParams(search).get('to') || '';
  const amount = new URLSearchParams(search).get('amount') || '';
  const amountUSD = new URLSearchParams(search).get('amountUSD') || '';
  const reference = new URLSearchParams(search).get('ref') || '';
  
  // Validation for required parameters
  const isMissingParams = !merchantAddress || !amount;
  
  // Handle payment success
  const handleSuccess = (txHash: string) => {
    setIsSuccess(true);
    // You could report this transaction to your backend here
  };
  
  // Handle payment cancellation
  const handleCancel = () => {
    // Go back or redirect to home
    setLocation('/');
  };

  // Handle going back to merchant site
  const handleBackToMerchant = () => {
    // Try to determine referring page, otherwise go home
    if (document.referrer) {
      window.location.href = document.referrer;
    } else {
      setLocation('/');
    }
  };

  // If parameters are missing, show error
  if (isMissingParams) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2" />
              Invalid Payment Request
            </CardTitle>
            <CardDescription>
              This payment link is missing required information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Please ensure the payment QR code contains the recipient address and payment amount.</p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If payment was successful, show success message
  if (isSuccess) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <ThumbsUp className="mr-2" />
              Payment Successful
            </CardTitle>
            <CardDescription>
              Your payment has been sent successfully!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Thank you for your payment of {amount} CPXTB.</p>
            <p className="text-sm text-muted-foreground">
              You can now return to the merchant website or close this page.
            </p>
            <Button onClick={handleBackToMerchant} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Merchant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main payment view
  return (
    <Web3AuthProvider>
      <div className="container max-w-md mx-auto py-12 px-4">
        <EasyPaymentForm
          merchantAddress={merchantAddress}
          amountCPXTB={amount}
          amountUSD={amountUSD}
          paymentReference={reference}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </Web3AuthProvider>
  );
};

export default EasyPaymentPage;