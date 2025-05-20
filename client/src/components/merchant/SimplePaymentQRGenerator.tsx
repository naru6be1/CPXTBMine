import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimplePaymentQRGeneratorProps {
  merchantId: number;
  merchantName: string;
  apiKey: string;
  // State props for persistence between tab changes
  amount: string;
  setAmount: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  paymentReference: string;
  setPaymentReference: (value: string) => void;
  qrCodeData: string;
  setQrCodeData: (value: string) => void;
  paymentLink: string;
  setPaymentLink: (value: string) => void;
}

export default function SimplePaymentQRGenerator({
  merchantId,
  merchantName,
  apiKey,
  // Using the persistent state from parent component
  amount,
  setAmount,
  description,
  setDescription,
  paymentReference,
  setPaymentReference,
  qrCodeData,
  setQrCodeData,
  paymentLink,
  setPaymentLink
}: SimplePaymentQRGeneratorProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Initialize description if empty and merchant name changes
  useEffect(() => {
    if (!description && merchantName) {
      setDescription(`Payment for ${merchantName}`);
    }
  }, [merchantName, description, setDescription]);

  // FIXED: Don't auto-generate payment on component mount
  // Instead, we'll only generate when the user explicitly clicks the button

  // Generate payment URL when amount, paymentReference, or merchantId changes
  useEffect(() => {
    if (paymentReference) {
      const baseUrl = window.location.origin;
      // Include paymentContext parameter to ensure we stay on payment page after login
      const newPaymentLink = `${baseUrl}/pay/${paymentReference}?paymentContext=true`;
      setPaymentLink(newPaymentLink);
      setQrCodeData(newPaymentLink);
      
      console.log("Generated QR code payment link with context:", newPaymentLink);
    }
  }, [paymentReference, amount, merchantId]);

  // Generate a unique payment reference
  const generatePaymentReference = async () => {
    setLoading(true);
    try {
      // Create a unique reference format
      const timestamp = Date.now();
      const randomChars = Math.random().toString(36).substring(2, 8);
      const newRef = `SOCIAL-${merchantId}-${timestamp}-${randomChars}`;
      
      // Log the input before sending
      console.log(`Creating payment with amount: "${amount}" of type ${typeof amount}`);
      
      // Generate a new payment
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({
          // CRITICAL FIX: Always convert to string and preserve the exact representation
          // This was causing issues with small decimal values like 0.1 displaying as 10 USD
          // By explicitly converting to string here, we ensure values like "0.1" remain intact
          amountUsd: String(amount), // Explicit string conversion to preserve exact decimal
          description: description,
          paymentReference: newRef,
          expiresIn: 24 * 60 * 60, // 24 hours in seconds
          socialEnabled: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const data = await response.json();
      setPaymentReference(data.paymentReference || newRef);
      
      toast({
        title: "QR Code Generated",
        description: "New social payment QR code is ready to share",
      });
    } catch (error) {
      console.error('Error generating payment reference:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
      
      // Still set a reference so we have something to display
      const timestamp = Date.now();
      const randomChars = Math.random().toString(36).substring(2, 8);
      const fallbackRef = `SOCIAL-${merchantId}-${timestamp}-${randomChars}`;
      setPaymentReference(fallbackRef);
    } finally {
      setLoading(false);
    }
  };

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove any non-numeric characters except decimal point
    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length > 1 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // CRITICAL FIX: Ensure we always use string representation for amounts
    // This is crucial for small decimal values like 0.1 to be correctly processed
    setAmount(value);
    
    // Debug: Log the current amount value to verify proper format
    console.log(`Amount changed to: "${value}", type: ${typeof value}`);
  };

  // Handle copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast({
      title: "Copied",
      description: "Payment link copied to clipboard",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
            <Input
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              className="pl-7"
              placeholder="10.00"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Payment description"
          />
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={generatePaymentReference} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="mb-4"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" /> Generate New QR</>
          )}
        </Button>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        {/* QR Code Area - Shows placeholder or actual QR */}
        <div className={`${paymentReference ? 'bg-white' : 'bg-muted'} p-6 rounded-lg shadow-md h-[200px] w-[200px] flex items-center justify-center`}>
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paymentReference ? (
            <QRCodeSVG 
              value={qrCodeData}
              size={180}
              level="H"
              className="w-full h-auto"
            />
          ) : (
            <div className="text-muted-foreground text-center">
              <p className="text-sm">Click "Generate New QR" to create a payment</p>
            </div>
          )}
        </div>
        
        {/* Business and Amount Info - Always show */}
        <div className="text-center space-y-1 w-full">
          <p className="text-sm font-medium">
            <span className="font-semibold">Business:</span> {merchantName}
          </p>
          <p className="text-sm font-medium">
            <span className="font-semibold">Amount:</span> ${amount} USD
          </p>
        </div>
        
        {/* Payment Link - Only show when we have a reference */}
        {paymentReference && (
          <div className="w-full space-y-2">
            <Label htmlFor="payment-link">Payment Link</Label>
            <div className="flex items-center gap-2">
              <Input
                id="payment-link"
                value={paymentLink}
                readOnly
                className="text-xs font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center mt-2">
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open in new tab
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}