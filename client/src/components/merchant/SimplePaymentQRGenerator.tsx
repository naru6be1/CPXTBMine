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
}

export default function SimplePaymentQRGenerator({
  merchantId,
  merchantName,
  apiKey
}: SimplePaymentQRGeneratorProps) {
  const [amount, setAmount] = useState<string>("10.00");
  const [description, setDescription] = useState<string>(`Payment for ${merchantName}`);
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Generate a unique payment reference when component mounts or merchant changes
  useEffect(() => {
    generatePaymentReference();
  }, [merchantId]);

  // Generate payment URL when amount, paymentReference, or merchantId changes
  useEffect(() => {
    if (paymentReference) {
      const baseUrl = window.location.origin;
      const newPaymentLink = `${baseUrl}/pay/${paymentReference}`;
      setPaymentLink(newPaymentLink);
      setQrCodeData(newPaymentLink);
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
      
      // Generate a new payment
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({
          // FIX: Ensure small decimal values like 0.1 are properly processed
          // Use Number() instead of parseFloat() for more precise handling of decimal values
          // This ensures values like "0.1" are properly converted without rounding issues
          // CRITICAL FIX: Send amount as a string to preserve exact decimal value
          // This ensures values like "0.1" are preserved exactly as entered
          // Server will handle proper parsing to prevent any floating point precision issues
          amountUsd: amount,
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
    
    setAmount(value);
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
      
      {paymentReference && (
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            {loading ? (
              <div className="h-48 w-48 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <QRCodeSVG 
                value={qrCodeData}
                size={200}
                level="H"
                className="w-full h-auto"
              />
            )}
          </div>
          
          <div className="text-center space-y-1 w-full">
            <p className="text-sm font-medium">
              <span className="font-semibold">Business:</span> {merchantName}
            </p>
            <p className="text-sm font-medium">
              <span className="font-semibold">Amount:</span> ${Number(amount).toFixed(2)} USD
            </p>
          </div>
          
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
        </div>
      )}
    </div>
  );
}