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
        
        // Check if this is a payment status update
        if (data.type === 'paymentStatusUpdate' && data.status === 'completed') {
          console.log('Received payment update notification:', data);
          
          // Show toast notification
          toast({
            title: "Payment Received! 🎉",
            description: `Payment ${data.paymentReference} has been completed successfully.`,
            variant: "default",
          });
          
          // Play success sound
          const audio = new Audio('/sound/payment-success.mp3');
          audio.volume = 0.5;
          audio.play().catch(err => console.log('Could not play notification sound', err));
          
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
  // Auto-close after 10 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-md"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
        >
          <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg shadow-lg border-2 border-green-300 dark:border-green-700">
            <div className="flex items-start gap-3">
              <div className="bg-green-500 rounded-full p-1 mt-0.5">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 dark:text-green-100">Payment Received! 🎉</h3>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Payment <span className="font-medium">{reference}</span> has been completed successfully.
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={onClose}
                    className="text-xs bg-green-200 dark:bg-green-800 px-3 py-1 rounded-full 
                             text-green-800 dark:text-green-100 font-medium hover:bg-green-300 dark:hover:bg-green-700 
                             transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}