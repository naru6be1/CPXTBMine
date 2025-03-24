import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";

export function TestInterface() {
  const { address } = useWallet();
  const { toast } = useToast();
  const [customTime, setCustomTime] = useState("");
  const [rateLimitStatus, setRateLimitStatus] = useState<{
    remainingClaims: number;
    resetTime: string | null;
    timeUntilReset?: number;
  } | null>(null);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Fetch rate limit status periodically
  useEffect(() => {
    if (!address) return;

    const fetchRateLimitStatus = async () => {
      try {
        const response = await fetch(`/api/test/rate-limit-status/${address}`);
        if (!response.ok) throw new Error('Failed to fetch rate limit status');
        const data = await response.json();
        setRateLimitStatus(data);
      } catch (error) {
        console.error('Failed to fetch rate limit status:', error);
      }
    };

    fetchRateLimitStatus();
    const interval = setInterval(fetchRateLimitStatus, 5000);
    return () => clearInterval(interval);
  }, [address]);

  const resetCooldown = async () => {
    try {
      const response = await fetch(`/api/test/reset-cooldown/${address}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reset cooldown');
      toast({
        title: "Success",
        description: "Cooldown reset successful"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset cooldown"
      });
    }
  };

  const resetRateLimit = async () => {
    try {
      const response = await fetch(`/api/test/reset-rate-limit/${address}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reset rate limit');
      toast({
        title: "Success",
        description: "Rate limit reset successful"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset rate limit"
      });
    }
  };

  const setClaimTime = async () => {
    try {
      const response = await fetch(`/api/test/set-claim-time/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: new Date(customTime).toISOString() })
      });
      if (!response.ok) throw new Error('Failed to set claim time');
      toast({
        title: "Success",
        description: "Claim time updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set claim time"
      });
    }
  };

  return (
    <div className="border p-4 rounded-lg space-y-4 mt-4">
      <h3 className="text-lg font-semibold">Test Controls</h3>
      <div className="space-y-2">
        <Button onClick={resetCooldown} variant="outline" className="w-full">
          Reset Cooldown Period
        </Button>
        <Button onClick={resetRateLimit} variant="outline" className="w-full">
          Reset Rate Limit Counter
        </Button>
        <div className="flex gap-2">
          <Input
            type="datetime-local"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            placeholder="Set custom claim time"
          />
          <Button onClick={setClaimTime} variant="outline">
            Set Time
          </Button>
        </div>
        {rateLimitStatus && (
          <div className="bg-muted p-3 rounded-md text-sm">
            <p>Remaining Claims: {rateLimitStatus.remainingClaims}/{MAX_CLAIMS_PER_HOUR}</p>
            {rateLimitStatus.resetTime && (
              <p>Reset Time: {new Date(rateLimitStatus.resetTime).toLocaleString()}</p>
            )}
            {rateLimitStatus.timeUntilReset && rateLimitStatus.timeUntilReset > 0 && (
              <p>Time until reset: {Math.ceil(rateLimitStatus.timeUntilReset / 1000 / 60)} minutes</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}