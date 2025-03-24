import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";

export function TestInterface() {
  const { address } = useWallet();
  const { toast } = useToast();
  const [customTime, setCustomTime] = useState("");

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

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
      </div>
    </div>
  );
}
