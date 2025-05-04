import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download, RefreshCw, Check, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimplePaymentQRGeneratorProps {
  merchantId: number;
  merchantName: string;
  apiKey: string;
}

const SimplePaymentQRGenerator: React.FC<SimplePaymentQRGeneratorProps> = ({ 
  merchantId, 
  merchantName,
  apiKey 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generatePaymentQR = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // Create a payment request
      const response = await fetch('/api/merchants/payment-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          amountUsd: parseFloat(amount),
          description: description || `Payment to ${merchantName}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate payment');
      }

      const data = await response.json();
      
      // Create the direct payment URL
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/pay/${data.paymentReference}`;
      
      setPaymentUrl(paymentUrl);
      
      toast({
        title: "QR Code Generated",
        description: "Your payment QR code is ready to share with customers",
      });
    } catch (error) {
      console.error('Error generating payment:', error);
      toast({
        title: "Generation Failed",
        description: "Could not create the payment QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyPaymentUrl = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast({
            title: "URL Copied",
            description: "Payment link copied to clipboard",
          });
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          toast({
            title: "Copy Failed",
            description: "Could not copy to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  const downloadQR = () => {
    if (!paymentUrl) return;

    const canvas = document.getElementById('payment-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `CPXTB-Payment-${new Date().getTime()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast({
      title: "QR Downloaded",
      description: "The QR code image has been saved to your device",
    });
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setPaymentUrl('');
    
    toast({
      title: "Form Reset",
      description: "Create a new payment QR code",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" /> Quick Payment QR
        </CardTitle>
        <CardDescription>
          Generate a QR code for customers to pay without needing a crypto wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paymentUrl ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="border p-3 rounded bg-white">
                <QRCodeSVG
                  id="payment-qr-canvas"
                  value={paymentUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/cpxtb-logo.png",
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              
              <div className="mt-4 text-center space-y-2">
                <p className="text-sm font-medium">Payment Amount</p>
                <p className="text-2xl font-bold">${parseFloat(amount).toFixed(2)}</p>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Payment URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={paymentUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={copyPaymentUrl}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={downloadQR}
              >
                <Download className="mr-2 h-4 w-4" /> Download QR
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={resetForm}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> New Payment
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the amount in USD. It will be automatically converted to CPXTB tokens.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g. Coffee, Groceries, Services"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <Button
              onClick={generatePaymentQR}
              disabled={generating || !amount}
              className="w-full"
            >
              {generating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                'Generate Payment QR'
              )}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <p>
          Customers can scan this QR code and pay without needing their own crypto wallet.
          The CPXTB platform will handle the conversion and payment processing automatically.
        </p>
      </CardFooter>
    </Card>
  );
};

export default SimplePaymentQRGenerator;