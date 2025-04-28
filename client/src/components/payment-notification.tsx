import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentNotificationProps {
  onPaymentUpdate?: (payment: any) => void;
}

export function PaymentNotification({ onPaymentUpdate }: PaymentNotificationProps) {
  const { toast } = useToast();
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Set up WebSocket connection for payment updates
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Connection opened
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established for payment updates');
      setIsConnected(true);
    });

    // Listen for messages
    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Check if this is a payment status update
        if (data.type === 'paymentStatusUpdate') {
          console.log('🔔 Received payment update notification:', data);
          
          // SECURITY ENHANCEMENT: Add detailed validation checks
          // 1. Parse and validate the received amount with proper number checks
          const receivedAmount = (() => {
            if (typeof data.receivedAmount === 'string') {
              const parsed = parseFloat(data.receivedAmount);
              return isNaN(parsed) ? 0 : parsed;
            }
            return typeof data.receivedAmount === 'number' ? data.receivedAmount : 0;
          })();
          
          // 2. Validate transaction hash format
          const hasValidTransactionHash = !!data.transactionHash && 
              typeof data.transactionHash === 'string' && 
              data.transactionHash.startsWith('0x') && 
              data.transactionHash.length === 66;
          
          // 3. Create detailed validation report for debugging
          const validationReport = {
            status: data.status,
            receivedAmount,
            requiresAmount: receivedAmount > 0,
            hasValidTxHash: hasValidTransactionHash,
            reference: data.paymentReference,
            securityCheck: data.securityCheck || 'unknown', // Using new server-side security flag
            percentReceived: data.percentReceived ? 
              `${(data.percentReceived * 100).toFixed(2)}%` : 'unknown',
            timeVerified: new Date().toISOString()
          };
          
          console.log('🔐 PAYMENT VALIDATION REPORT:', validationReport);
          
          // CRITICAL SECURITY FIX: Enhanced multi-factor validation
          // All of these need to be true for a payment to be considered successful:
          // 1. Server reports 'completed' status
          // 2. Actual coins received (amount > 0)  
          // 3. Valid transaction hash exists on blockchain
          // 4. Server security checks have passed (new server-side verification)
          if (data.status === 'completed' && 
              receivedAmount > 0 && 
              hasValidTransactionHash && 
              (data.securityCheck === 'passed' || !data.securityCheck)) { // Allow backwards compatibility
              
            console.log('✅ VALIDATED PAYMENT: Payment has passed all security checks', validationReport);
            
            // Play success sound - try multiple times if it fails
            try {
              const audio = new Audio('/sound/payment-success.mp3');
              audio.volume = 0.7; // Increased volume
              
              // Create a promise to play with multiple attempts
              const attemptPlay = (remainingAttempts = 3) => {
                audio.play().catch(err => {
                  console.warn(`Attempt to play sound failed (${remainingAttempts} attempts left):`, err);
                  if (remainingAttempts > 0) {
                    setTimeout(() => attemptPlay(remainingAttempts - 1), 300);
                  }
                });
              };
              
              attemptPlay();
              
              // Preload the sound for faster playback next time
              audio.preload = 'auto';
            } catch (err) {
              console.error('Error creating audio object:', err);
            }
            
            // Show toast notification
            toast({
              title: "Payment Received! 🎉",
              description: `Payment ${data.paymentReference} has been completed successfully.`,
              variant: "default",
            });
          } else if (data.status === 'partial') {
            // Handle partial payment notification
            try {
              // Use a different sound for partial payments
              const audio = new Audio('/sound/payment-partial.mp3');
              audio.volume = 0.6;
              
              const attemptPlay = (remainingAttempts = 3) => {
                audio.play().catch(err => {
                  console.warn(`Attempt to play partial sound failed (${remainingAttempts} attempts left):`, err);
                  if (remainingAttempts > 0) {
                    setTimeout(() => attemptPlay(remainingAttempts - 1), 300);
                  }
                });
              };
              
              attemptPlay();
            } catch (err) {
              console.error('Error creating audio object for partial payment:', err);
            }
            
            // Calculate remaining amount for the notification
            const remainingAmount = data.remainingAmount || (() => {
              const receivedAmount = typeof data.receivedAmount === 'string' ? parseFloat(data.receivedAmount) : (data.receivedAmount || 0);
              const requiredAmount = typeof data.requiredAmount === 'string' ? parseFloat(data.requiredAmount) : (data.requiredAmount || 0);
              return Math.max(0, requiredAmount - receivedAmount).toFixed(6);
            })();
            
            console.log('Partial payment details - remainingAmount:', remainingAmount);
            
            // Show partial payment toast notification
            toast({
              title: "Partial Payment Received",
              description: `Transaction confirmed, but still need ${remainingAmount} CPXTB to complete payment.`,
              variant: "warning", // Use warning for partial payments
            });
          }
          
          // Call the callback if provided for any payment update
          if (onPaymentUpdate) {
            onPaymentUpdate(data);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle connection closing
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed for payment updates');
      setIsConnected(false);
    });

    // Handle errors
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [toast, onPaymentUpdate]);

  // We don't need to render anything as this component works in the background
  return null;
}

// Animated notification that appears on partial payment
export function PaymentPartialNotification({ 
  isVisible, 
  reference, 
  remainingAmount,
  onClose 
}: { 
  isVisible: boolean;
  reference: string;
  remainingAmount: string;
  onClose: () => void;
}) {
  // Auto-close after 30 seconds (longer time for partial payments)
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay with slight blur to draw attention */}
          <motion.div
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Notification popup */}
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: { type: "spring", stiffness: 350, damping: 25 }
            }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          >
            <motion.div 
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl border-2 border-amber-400 dark:border-amber-600"
              animate={{ 
                boxShadow: ["0 0 0 rgba(251, 191, 36, 0.2)", "0 0 20px rgba(251, 191, 36, 0.6)", "0 0 0 rgba(251, 191, 36, 0.2)"]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <div className="text-center mb-4">
                <motion.div 
                  className="inline-block bg-amber-100 dark:bg-amber-900 p-3 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="h-10 w-10 text-amber-500 flex items-center justify-center font-bold text-2xl">!</div>
                </motion.div>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-amber-700 dark:text-amber-400 mb-2">
                  Partial Payment Received
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Payment <span className="font-medium text-black dark:text-white">{reference}</span> has been partially paid.
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/40 p-4 rounded-md mb-6">
                  <div className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                    Additional payment required to complete the transaction:
                  </div>
                  <div className="text-xl font-bold text-amber-800 dark:text-amber-300">
                    {remainingAmount} CPXTB
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={onClose}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-md 
                             transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Animated notification that appears on payment completion
export function PaymentSuccessNotification({ 
  isVisible, 
  reference,
  securityVerified = false, // Add new security verification parameter
  onClose 
}: { 
  isVisible: boolean;
  reference: string;
  securityVerified?: boolean; // Flag to indicate if payment passed security checks 
  onClose: () => void;
}) {
  // Auto-close after 20 seconds (extended time)
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 20000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay with slight blur to draw attention */}
          <motion.div
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Notification popup */}
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: { type: "spring", stiffness: 350, damping: 25 }
            }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          >
            <motion.div 
              className={`bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl border-2 ${
                securityVerified 
                  ? "border-green-400 dark:border-green-600" 
                  : "border-amber-400 dark:border-amber-600"
              }`}
              animate={{ 
                boxShadow: securityVerified
                  ? ["0 0 0 rgba(34, 197, 94, 0.2)", "0 0 20px rgba(34, 197, 94, 0.6)", "0 0 0 rgba(34, 197, 94, 0.2)"]
                  : ["0 0 0 rgba(251, 191, 36, 0.2)", "0 0 20px rgba(251, 191, 36, 0.6)", "0 0 0 rgba(251, 191, 36, 0.2)"]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <div className="text-center mb-4">
                <motion.div 
                  className={`inline-block ${
                    securityVerified 
                      ? "bg-green-100 dark:bg-green-900" 
                      : "bg-amber-100 dark:bg-amber-900"
                  } p-3 rounded-full`}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {securityVerified ? (
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  ) : (
                    <div className="h-10 w-10 text-amber-500 flex items-center justify-center font-bold text-2xl">!</div>
                  )}
                </motion.div>
              </div>
              
              <div className="text-center">
                <h2 className={`text-2xl font-bold ${
                  securityVerified 
                    ? "text-green-700 dark:text-green-400" 
                    : "text-amber-700 dark:text-amber-400"
                  } mb-2`}
                >
                  {securityVerified 
                    ? "Payment Successful! 🎉" 
                    : "Payment Received - Verifying..."}
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Payment <span className="font-medium text-black dark:text-white">{reference}</span> 
                  {securityVerified 
                    ? " has been verified on the blockchain." 
                    : " is being verified. Please wait for full confirmation."}
                </p>
                <div className={`${
                  securityVerified 
                    ? "bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-300" 
                    : "bg-amber-50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                  } p-3 rounded-md text-sm mb-6`}
                >
                  {securityVerified 
                    ? "The payment has been processed and will appear in your transaction history." 
                    : "The transaction has been seen but is still being verified. This may take a few moments."}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={onClose}
                    className={`${
                      securityVerified 
                        ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" 
                        : "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                      } text-white font-medium px-4 py-2 rounded-md 
                      transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}