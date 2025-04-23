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
        if (data.type === 'paymentStatusUpdate' && data.status === 'completed') {
          console.log('🔔 Received payment update notification:', data);
          
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
          
          // Call the callback if provided
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

// Animated notification that appears on payment completion
export function PaymentSuccessNotification({ 
  isVisible, 
  reference, 
  onClose 
}: { 
  isVisible: boolean;
  reference: string;
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
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-2xl border-2 border-green-400 dark:border-green-600"
              animate={{ 
                boxShadow: ["0 0 0 rgba(34, 197, 94, 0.2)", "0 0 20px rgba(34, 197, 94, 0.6)", "0 0 0 rgba(34, 197, 94, 0.2)"]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <div className="text-center mb-4">
                <motion.div 
                  className="inline-block bg-green-100 dark:bg-green-900 p-3 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </motion.div>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
                  Payment Successful! 🎉
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Payment <span className="font-medium text-black dark:text-white">{reference}</span> has been verified on the blockchain.
                </p>
                <div className="bg-green-50 dark:bg-green-900/40 p-3 rounded-md text-sm text-green-800 dark:text-green-300 mb-6">
                  The payment has been processed and will appear in your transaction history.
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={onClose}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-md 
                             transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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