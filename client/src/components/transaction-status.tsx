import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface TransactionStatusProps {
  hash: string;
  isValidating: boolean;
  isConfirmed?: boolean;
}

export function TransactionStatus({ hash, isValidating, isConfirmed }: TransactionStatusProps) {
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
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-medium">Confirming Transaction...</span>
            </motion.div>
          ) : isConfirmed ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex items-center gap-2 text-green-500"
            >
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm font-medium">Transaction Confirmed!</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="flex items-center gap-2 text-primary"
            >
              <AlertCircle className="h-6 w-6" />
              <span className="text-sm font-medium">Transaction Submitted</span>
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
              className="text-primary hover:underline mt-2 inline-block text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View on Etherscan
            </motion.a>
          </motion.div>

          {isValidating && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-full h-0.5 bg-primary/20 mt-4"
              style={{ transformOrigin: "left" }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
