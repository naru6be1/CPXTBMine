import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Server, Cpu, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionStatusProps {
  hash: string;
  isValidating: boolean;
  isConfirmed?: boolean;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function TransactionStatus({ hash, isValidating, isConfirmed, onRetry, showRetry }: TransactionStatusProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mt-4 p-4 bg-primary/5 rounded-lg overflow-hidden"
      >
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isValidating ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex items-center gap-2 text-primary"
            >
              <div className="relative">
                <Loader2 className="h-6 w-6 animate-spin" />
                <Server className="h-4 w-4 absolute -top-1 -right-1 animate-pulse text-primary" />
              </div>
              <span className="text-sm font-medium">
                Mining Transaction... This may take a few minutes.
              </span>
            </motion.div>
          ) : isConfirmed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex items-center gap-2 text-green-500"
            >
              <div className="relative">
                <CheckCircle2 className="h-6 w-6" />
                <Cpu className="h-4 w-4 absolute -top-1 -right-1 text-primary" />
              </div>
              <span className="text-sm font-medium">Mining Completed!</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex items-center gap-2 text-primary"
            >
              <div className="relative">
                <AlertCircle className="h-6 w-6" />
                <Server className="h-4 w-4 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-sm font-medium">Mining Started</span>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Transaction Hash:
              <br />
              <span className="font-mono text-xs break-all">
                {hash}
              </span>
            </p>
            <motion.a
              href={`https://etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mt-2 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View on Etherscan
              <ExternalLink className="h-4 w-4" />
            </motion.a>
          </motion.div>

          {showRetry && onRetry && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 w-full"
            >
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={onRetry}
              >
                <RefreshCw className="h-4 w-4" />
                Retry Transaction Validation
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Click to check if your transaction was confirmed and activate your mining plan
              </p>
            </motion.div>
          )}

          {isValidating && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-full h-0.5 bg-primary/20 mt-4"
              style={{ transformOrigin: "left" }}
            />
          )}

          {isValidating && (
            <p className="text-xs text-muted-foreground mt-2">
              Please wait while we confirm your transaction on the Ethereum network.
              This process typically takes 2-5 minutes.
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}