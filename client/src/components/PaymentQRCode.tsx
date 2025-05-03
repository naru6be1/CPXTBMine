import React, { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, ExternalLink } from 'lucide-react';

interface PaymentQRCodeProps {
  merchantAddress: string;
  amount: string;
  amountUSD?: string;
  reference?: string;
  baseUrl?: string;
  className?: string;
}

/**
 * Creates a QR code that allows customers to pay with CPXTB using social login
 * The QR code links to a payment page with all the relevant details
 */
const PaymentQRCode: React.FC<PaymentQRCodeProps> = ({
  merchantAddress,
  amount,
  amountUSD,
  reference,
  baseUrl = window.location.origin,
  className = ''
}) => {
  // Create payment URL with all necessary data
  const paymentUrl = useMemo(() => {
    const url = new URL(`${baseUrl}/easy-payment`);
    url.searchParams.append('to', merchantAddress);
    url.searchParams.append('amount', amount);
    
    if (amountUSD) {
      url.searchParams.append('amountUSD', amountUSD);
    }
    
    if (reference) {
      url.searchParams.append('ref', reference);
    }
    
    return url.toString();
  }, [merchantAddress, amount, amountUSD, reference, baseUrl]);

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quick Payment</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            <span>CPXTB</span>
          </Badge>
        </div>
        <CardDescription>
          Scan or click to pay with social login - No crypto wallet needed
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <a 
          href={paymentUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="cursor-pointer block bg-white p-4 rounded-lg hover:shadow-md transition-shadow"
          title="Click to open payment page"
        >
          <QRCodeSVG 
            value={paymentUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
        </a>
        <div className="mt-4 text-center">
          <p className="font-medium">{amount} CPXTB</p>
          {amountUSD && (
            <p className="text-sm text-muted-foreground">≈ ${amountUSD} USD</p>
          )}
          {reference && (
            <p className="text-xs mt-2 text-muted-foreground">Reference: {reference}</p>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3" 
            onClick={() => window.open(paymentUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Payment Page
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-center text-xs text-muted-foreground flex flex-col gap-1">
        <p>Scan with your phone's camera or click to test on this device</p>
        <p className="text-xs text-muted-foreground">Opens the social login payment page</p>
      </CardFooter>
    </Card>
  );
};

export default PaymentQRCode;