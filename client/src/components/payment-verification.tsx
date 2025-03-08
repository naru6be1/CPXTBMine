import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";
import { ethers } from 'ethers';

// USDT ERC20 ABI for transfer event
const USDT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT Contract
const REQUIRED_AMOUNT = ethers.parseUnits("100", 6); // USDT has 6 decimals

export function PaymentVerification({ 
  onVerificationComplete 
}: { 
  onVerificationComplete: (success: boolean) => void 
}) {
  const [txHash, setTxHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  const verifyTransaction = async () => {
    if (!txHash) {
      toast({
        variant: "destructive",
        title: "Missing Transaction Hash",
        description: "Please provide the transaction hash of your USDT payment",
      });
      return;
    }

    setVerifying(true);
    try {
      console.log('Starting transaction verification for hash:', txHash);

      // Create provider for Ethereum mainnet
      const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");

      // Wait for transaction receipt
      console.log('Fetching transaction receipt...');
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        throw new Error("Transaction not found or pending");
      }

      console.log('Transaction receipt found:', receipt);

      // Create USDT contract interface
      const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);

      // Filter and parse Transfer events
      console.log('Parsing transfer events...');
      const transferEvent = receipt.logs
        .filter(log => log.address.toLowerCase() === USDT_ADDRESS.toLowerCase())
        .map(log => {
          try {
            return usdtContract.interface.parseLog({
              topics: [...log.topics],
              data: log.data
            });
          } catch (error) {
            console.error('Error parsing log:', error);
            return null;
          }
        })
        .find(event => event && event.name === "Transfer");

      if (!transferEvent) {
        throw new Error("No USDT transfer found in transaction");
      }

      console.log('Transfer event found:', transferEvent);

      // Verify amount and recipient
      const amount = transferEvent.args[2];
      const recipient = transferEvent.args[1].toLowerCase();
      const targetAddress = "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27".toLowerCase();

      console.log('Verifying payment details:', {
        amount: amount.toString(),
        recipient,
        targetAddress,
        required: REQUIRED_AMOUNT.toString()
      });

      if (amount.toString() !== REQUIRED_AMOUNT.toString()) {
        throw new Error("Incorrect payment amount");
      }

      if (recipient !== targetAddress) {
        throw new Error("Payment sent to wrong address");
      }

      console.log('Payment verification successful');
      toast({
        title: "Payment Verified",
        description: "Your USDT payment has been confirmed. Starting your mining plan!",
      });

      onVerificationComplete(true);

    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify payment",
      });
      onVerificationComplete(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-primary" />
          Verify Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Enter your transaction hash"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Paste the transaction hash from your 100 USDT payment
          </p>
        </div>
        <Button 
          className="w-full" 
          onClick={verifyTransaction}
          disabled={verifying}
        >
          {verifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Payment
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Verify Payment
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}