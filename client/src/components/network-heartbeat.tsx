import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicClient } from "wagmi";
import { Activity } from "lucide-react";

export function NetworkHeartbeat() {
  const [isPulsing, setIsPulsing] = useState(false);
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [lastBlockTime, setLastBlockTime] = useState<Date>(new Date());
  const publicClient = usePublicClient();

  useEffect(() => {
    let unwatch: (() => void) | undefined;

    const watchBlocks = async () => {
      try {
        unwatch = publicClient.watchBlocks({
          onBlock: (block) => {
            setBlockNumber(Number(block.number));
            setLastBlockTime(new Date());
            // Trigger pulse animation
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 1000);
          },
        });
      } catch (error) {
        console.error('Error watching blocks:', error);
      }
    };

    watchBlocks();
    return () => {
      if (unwatch) unwatch();
    };
  }, [publicClient]);

  const timeSinceLastBlock = Math.floor((new Date().getTime() - lastBlockTime.getTime()) / 1000);

  return (
    <div className="relative flex items-center justify-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border">
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence>
          {isPulsing && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute w-8 h-8 bg-primary rounded-full"
            />
          )}
        </AnimatePresence>
      </div>
      <motion.div
        animate={{
          scale: isPulsing ? 1.2 : 1,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="relative flex items-center gap-2 z-10"
      >
        <Activity className={`w-6 h-6 ${isPulsing ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="flex flex-col">
          <p className="text-sm font-medium">Base Network</p>
          <p className="text-xs text-muted-foreground">
            Block #{blockNumber} • {timeSinceLastBlock}s ago
          </p>
        </div>
      </motion.div>
    </div>
  );
}
