import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { QRCodeSVG } from 'qrcode.react';
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, Copy, AlertCircle, CheckCircle2, MessageCircle, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaymentSuccessNotification, PaymentPartialNotification } from "@/components/payment-notification";

export default function PaymentPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State for payment data
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState({
    primaryColor: "#3B82F6", // Default primary color
    secondaryColor: "#1D4ED8", // Default secondary color
    accentColor: "#DBEAFE", // Default accent color
    fontFamily: "'Inter', sans-serif", // Default font family
    borderRadius: 8, // Default border radius
    darkMode: false, // Default dark mode
    customCss: "", // Custom CSS
    customHeader: "", // Custom header HTML
    customFooter: "", // Custom footer HTML
  });
  
  // Get payment reference from URL
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('ref');
  
  // WebSocket state for real-time updates
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // State for payment notification modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");

  // COMPLETELY REWRITTEN to add multiple layers of status checking
  useEffect(() => {
    if (!reference) {
      setError("No payment reference provided");
      setLoading(false);
      return;
    }

    const fetchPaymentData = async () => {
      try {
        console.log("Fetching payment data for reference:", reference);
        
        // Timestamp query parameter to bypass all caching
        const timestamp = Date.now(); 
        
        // The URL includes the payment reference, but no authentication
        // The endpoint should be accessible publicly
        const response = await fetch(`/api/payments/public/${reference}?nocache=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(response.statusText || 'Failed to load payment');
        }
        
        const data = await response.json();
        console.log("⭐ NEW PAYMENT DATA LOADED ⭐ Reference:", reference);
        
        // Debug raw payment data
        console.log("🔍 DIAGNOSTIC - Raw payment data:", {
          id: data.payment.id,
          ref: data.payment.paymentReference,
          status: data.payment.status,
          receivedAmount: data.payment.receivedAmount,
          requiredAmount: data.payment.requiredAmount || data.payment.amountCpxtb,
          amountCpxtb: data.payment.amountCpxtb,
          remainingAmount: data.payment.remainingAmount,
          timestamp: new Date().toISOString()
        });
        
        // SUPER ENHANCED: Fully rewritten status checking with multiple redundant checks
        // -----------------------------------------------------------------------------
        const originalStatus = data.payment.status;
        
        // Parse all numeric values for comparison
        const receivedAmount = parseFloat(data.payment.receivedAmount || '0');
        const requiredAmount = parseFloat(data.payment.requiredAmount || data.payment.amountCpxtb || '0');
        const remainingAmount = parseFloat(data.payment.remainingAmount || '0');
        
        // Define all possible completion conditions
        const conditions = {
          explicitlyCompleted: data.payment.status === 'completed',
          zeroRemaining: remainingAmount <= 0,
          zeroRemainingExact: data.payment.remainingAmount === '0.000000',
          receivedEnough: receivedAmount >= requiredAmount,
          hasTransactionHash: !!data.payment.transactionHash,
          hasCompletedTimestamp: !!data.payment.completedAt
        };
        
        // Decision logic - if ANY completion condition is true, treat as completed
        const isEffectivelyCompleted = 
          conditions.explicitlyCompleted || 
          conditions.zeroRemaining || 
          conditions.zeroRemainingExact || 
          conditions.receivedEnough;
        
        // Debug the decision process
        console.log("🔍 COMPLETION CHECK - All conditions:", {
          ...conditions,
          isEffectivelyCompleted,
          statusBeforeCheck: data.payment.status,
          calculatedRemaining: (requiredAmount - receivedAmount).toFixed(6)
        });
        
        // If any condition indicates completion, force status to 'completed'
        if (isEffectivelyCompleted && data.payment.status !== 'completed') {
          console.log("🚨 AUTO-CORRECTING status from", data.payment.status, "to completed", {
            reason: "Payment has sufficient funds but incorrect status",
            receivedAmount, 
            requiredAmount,
            remainingAmount
          });
          
          // Force the status
          data.payment.status = 'completed';
          
          // Also ensure remaining amount is 0
          data.payment.remainingAmount = '0.000000';
        }
        
        // Apply merchant theme if available
        if (data.theme) {
          setTheme({
            primaryColor: data.theme.primaryColor || theme.primaryColor,
            secondaryColor: data.theme.secondaryColor || theme.secondaryColor,
            accentColor: data.theme.accentColor || theme.accentColor,
            fontFamily: data.theme.fontFamily || theme.fontFamily,
            borderRadius: data.theme.borderRadius || theme.borderRadius,
            darkMode: data.theme.darkMode ?? theme.darkMode,
            customCss: data.theme.customCss || theme.customCss,
            customHeader: data.theme.customHeader || theme.customHeader,
            customFooter: data.theme.customFooter || theme.customFooter,
          });
        }
        
        // If status changed, log the change
        if (originalStatus !== data.payment.status) {
          console.log(`🔄 Payment status changed: ${originalStatus} -> ${data.payment.status}`);
        }
        
        // Update payment state with corrected data
        setPayment(data.payment);
        
      } catch (err: any) {
        console.error("Error loading payment:", err);
        setError(err.message || "Failed to load payment information");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPaymentData();

    // Set up a more aggressive polling interval to refresh payment data every 3 seconds
    // This ensures we get frequent status updates even if WebSocket fails
    const pollingInterval = setInterval(() => {
      console.log("⏱️ Polling for payment status update...");
      
      // Rather than using fetch directly, reuse our fetchPaymentData function
      // to ensure consistent status correction logic
      fetchPaymentData();
      
    }, 3000); // 3 seconds for even more responsive updates

    // Cleanup interval on component unmount
    return () => clearInterval(pollingInterval);
  }, [reference]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (!reference) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
      
      // Subscribe to updates for this payment reference
      ws.send(JSON.stringify({ 
        type: 'subscribeToPayment', 
        reference 
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("🔄 WebSocket message received:", data);
        
        if ((data.type === 'paymentUpdate' && data.reference === reference) ||
            (data.type === 'paymentStatusUpdate' && data.paymentReference === payment?.paymentReference)) {
          console.log("✨ WEBSOCKET UPDATE - Processing payment data", {
            reference: data.reference || data.paymentReference,
            status: data.status,
            receivedAmount: data.receivedAmount,
            requiredAmount: data.requiredAmount || data.payment?.requiredAmount
          });
          
          // ENHANCED WEBSOCKET STATUS CHECK: Apply same thorough status checking to WS messages
          let correctedStatus = data.status;
          
          // Parse all numeric values for comparison
          const receivedAmount = parseFloat(data.receivedAmount || '0');
          const requiredAmount = parseFloat(
            data.requiredAmount || 
            (payment?.requiredAmount ? payment.requiredAmount : payment?.amountCpxtb) || 
            '0'
          );
          const remainingAmount = parseFloat(data.remainingAmount || '0');
          
          // Define all possible completion conditions
          const conditions = {
            explicitlyCompleted: data.status === 'completed',
            zeroRemaining: remainingAmount <= 0,
            zeroRemainingExact: data.remainingAmount === '0.000000',
            receivedEnough: receivedAmount >= requiredAmount,
            hasTransactionHash: !!data.transactionHash,
          };
          
          // Decision logic - if ANY completion condition is true, treat as completed
          const isEffectivelyCompleted = 
            conditions.explicitlyCompleted || 
            conditions.zeroRemaining || 
            conditions.zeroRemainingExact || 
            conditions.receivedEnough;
          
          // Debug the decision process
          console.log("🔍 WEBSOCKET COMPLETION CHECK - All conditions:", {
            ...conditions,
            isEffectivelyCompleted,
            statusReceived: data.status,
            receivedAmount,
            requiredAmount,
            remainingAmount,
            calculatedRemaining: (requiredAmount - receivedAmount).toFixed(6)
          });
          
          // If any condition indicates completion, force status to 'completed'
          if (isEffectivelyCompleted && data.status !== 'completed') {
            console.log("🚨 WEBSOCKET AUTO-CORRECTING status from", data.status, "to completed", {
              reason: "Payment has sufficient funds but incorrect status",
              receivedAmount, 
              requiredAmount,
              remainingAmount
            });
            
            // Force the status
            correctedStatus = 'completed';
            data.status = 'completed'; // Update the original data too
            data.remainingAmount = '0.000000';
          }
          
          // Update payment status with all available data, applying any status corrections
          setPayment((prevPayment: any) => ({
            ...prevPayment,
            status: correctedStatus, // Use corrected status
            transactionHash: data.transactionHash || prevPayment.transactionHash,
            // Store received amount data if provided by server
            receivedAmount: data.receivedAmount || prevPayment.receivedAmount,
            requiredAmount: data.requiredAmount || prevPayment.requiredAmount || prevPayment.amountCpxtb,
            // Store pre-calculated remaining amount if available or zero if completed
            remainingAmount: correctedStatus === 'completed' ? '0.000000' : (data.remainingAmount || prevPayment.remainingAmount)
          }));
          
          // Show notification
          if (data.status === 'completed') {
            toast({
              title: "Payment Completed!",
              description: "The transaction has been confirmed on the blockchain",
            });
            
            // Play sound notification
            const audio = new Audio('/payment-success.mp3');
            audio.play().catch(e => console.error("Error playing audio:", e));
            
            // Show success modal
            setShowSuccessModal(true);
          } else if (data.status === 'partial') {
            // Use remaining amount provided by server, or calculate it if not available
            const remainingAmount = data.remainingAmount || (() => {
              console.log("WebSocket update: calculating remaining amount from scratch");
              const receivedAmount = typeof data.receivedAmount === 'string' ? parseFloat(data.receivedAmount) : (data.receivedAmount || 0);
              const requiredAmount = typeof data.requiredAmount === 'string' ? parseFloat(data.requiredAmount) : (data.requiredAmount || Number(payment?.amountCpxtb || 0));
              return Math.max(0, requiredAmount - receivedAmount).toFixed(6);
            })();
            
            console.log("Partial payment WebSocket update - remainingAmount:", remainingAmount);
            
            toast({
              title: "Partial Payment Received",
              description: `Transaction confirmed, but still need ${remainingAmount} CPXTB to complete payment`,
              variant: "destructive", // Use destructive variant instead of warning (not supported by our toast)
            });
            
            // Save the remaining amount for the modal
            setPartialAmount(remainingAmount);
            
            // Play sound notification (different sound for partial payments)
            const audio = new Audio('/payment-partial.mp3');
            audio.play().catch(e => console.error("Error playing audio:", e));
            
            // Show partial payment modal
            setShowPartialModal(true);
          }
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };
    
    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };
    
    setSocket(ws);
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [reference, payment, toast]);

  // Generate dynamic styles based on theme
  const generateStyles = () => {
    return {
      container: {
        fontFamily: theme.fontFamily,
        backgroundColor: theme.darkMode ? '#1c1c1c' : '#f8f9fa',
        color: theme.darkMode ? '#ffffff' : '#333333',
        minHeight: '100vh',
        width: '100%',
      },
      header: {
        backgroundColor: theme.primaryColor,
        padding: '1rem',
        textAlign: 'center' as const,
        color: '#ffffff',
      },
      card: {
        backgroundColor: theme.darkMode ? '#2d2d2d' : '#ffffff',
        borderRadius: `${theme.borderRadius}px`,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        margin: '1rem',
      },
      qrContainer: {
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: `${theme.borderRadius}px`,
      },
      button: {
        backgroundColor: theme.secondaryColor,
        color: '#ffffff',
        border: 'none',
        borderRadius: `${theme.borderRadius / 2}px`,
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.875rem',
      },
      warning: {
        backgroundColor: theme.darkMode ? '#422' : '#fee2e2',
        color: theme.darkMode ? '#f87171' : '#b91c1c',
        padding: '0.75rem',
        borderRadius: `${theme.borderRadius / 2}px`,
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
      },
      alert: {
        backgroundColor: theme.darkMode ? '#422' : '#fee2e2',
        color: theme.darkMode ? '#f87171' : '#b91c1c',
        padding: '0.75rem',
        borderRadius: `${theme.borderRadius / 2}px`,
        marginTop: '1rem',
        fontWeight: 'bold',
      },
      statusCompleted: {
        backgroundColor: theme.darkMode ? '#132' : '#d1fae5',
        color: theme.darkMode ? '#10b981' : '#047857',
        padding: '0.75rem',
        borderRadius: `${theme.borderRadius / 2}px`,
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      },
      statusPending: {
        backgroundColor: theme.darkMode ? '#422' : '#fef3c7',
        color: theme.darkMode ? '#fbbf24' : '#92400e',
        padding: '0.75rem',
        borderRadius: `${theme.borderRadius / 2}px`,
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      },
      statusExpired: {
        backgroundColor: theme.darkMode ? '#422' : '#fee2e2',
        color: theme.darkMode ? '#f87171' : '#b91c1c',
        padding: '0.75rem',
        borderRadius: `${theme.borderRadius / 2}px`,
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      },
      statusPartial: {
        backgroundColor: theme.darkMode ? '#473112' : '#fff7e0',
        color: theme.darkMode ? '#f59e0b' : '#b45309',
        padding: '0.75rem',
        borderRadius: `${theme.borderRadius / 2}px`,
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        borderLeft: '4px solid #f59e0b',
      },
      footer: {
        backgroundColor: theme.darkMode ? '#2d2d2d' : '#f1f5f9',
        padding: '1rem',
        textAlign: 'center' as const,
        marginTop: '2rem',
        fontSize: '0.875rem',
        color: theme.darkMode ? '#9ca3af' : '#64748b',
      },
      section: {
        padding: '1rem',
      },
      infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.darkMode ? '#444' : '#e5e7eb'}`,
        padding: '0.5rem 0',
      },
      copyWrapper: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '0.5rem',
      },
      copyButton: {
        padding: '0.25rem 0.5rem',
        marginLeft: '0.5rem',
        backgroundColor: theme.darkMode ? '#374151' : '#e5e7eb',
        color: theme.darkMode ? '#d1d5db' : '#1f2937',
        borderRadius: `${theme.borderRadius / 4}px`,
        fontSize: '0.75rem',
        cursor: 'pointer',
      },
      walletAddress: {
        wordBreak: 'break-all' as const,
        fontSize: '0.875rem',
        padding: '0.5rem',
        backgroundColor: theme.darkMode ? '#374151' : '#f3f4f6',
        borderRadius: `${theme.borderRadius / 4}px`,
        fontFamily: 'monospace',
      },
      socialButton: {
        backgroundColor: theme.darkMode ? '#374151' : '#e5e7eb',
        color: theme.darkMode ? '#d1d5db' : '#1f2937',
        padding: '0.5rem',
        borderRadius: `${theme.borderRadius / 2}px`,
        marginRight: '0.5rem',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.75rem',
      },
    };
  };
  
  const styles = generateStyles();

  // Apply custom CSS if available
  useEffect(() => {
    if (theme.customCss) {
      const styleElement = document.createElement('style');
      styleElement.innerHTML = theme.customCss;
      document.head.appendChild(styleElement);
      
      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [theme.customCss]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: theme.darkMode ? '#1c1c1c' : '#f8f9fa'
      }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: theme.darkMode ? '#1c1c1c' : '#f8f9fa',
        color: theme.darkMode ? '#ffffff' : '#333333',
        padding: '1rem'
      }}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Payment Error</h1>
        <p className="text-center mb-4">{error}</p>
        <Button onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: theme.darkMode ? '#1c1c1c' : '#f8f9fa',
        color: theme.darkMode ? '#ffffff' : '#333333',
        padding: '1rem'
      }}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Payment Not Found</h1>
        <p className="text-center mb-4">The requested payment could not be found.</p>
        <Button onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  // Generate wallet URI for QR code
  const walletUri = `ethereum:${payment.merchantWalletAddress}?value=0&token=${payment.tokenAddress}`;

  // Format timestamp for display
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: message,
    });
  };
  
  // Calculate remaining amount if payment is partial
  let remainingAmount = '0.000000';
  if (payment) {
    console.log('Payment object for calculation:', {
      status: payment.status,
      receivedAmount: payment.receivedAmount,
      requiredAmount: payment.requiredAmount,
      amountCpxtb: payment.amountCpxtb,
      remainingAmount: payment.remainingAmount // Check if we already have this from WebSocket
    });
    
    if (payment.status === 'partial') {
      // First check if remainingAmount is already provided by the server via WebSocket
      if (payment.remainingAmount) {
        console.log('Using server-provided remainingAmount:', payment.remainingAmount);
        remainingAmount = typeof payment.remainingAmount === 'string' 
          ? payment.remainingAmount 
          : payment.remainingAmount.toFixed(6);
      } else {
        // Otherwise calculate it manually
        // Convert received and required amounts to numbers, ensuring we have valid values
        let receivedAmount = 0;
        let requiredAmount = 0;
        
        // Check if received amount is available from the payment data
        if (payment.receivedAmount !== undefined && payment.receivedAmount !== null) {
          console.log('Raw receivedAmount:', payment.receivedAmount, 'type:', typeof payment.receivedAmount);
          receivedAmount = typeof payment.receivedAmount === 'number' 
            ? payment.receivedAmount 
            : parseFloat(payment.receivedAmount);
        }
        
        // Determine required amount - either from payment.requiredAmount or fall back to amountCpxtb
        if (payment.requiredAmount !== undefined && payment.requiredAmount !== null) {
          console.log('Raw requiredAmount:', payment.requiredAmount, 'type:', typeof payment.requiredAmount);
          requiredAmount = typeof payment.requiredAmount === 'number'
            ? payment.requiredAmount
            : parseFloat(payment.requiredAmount);
        } else if (payment.amountCpxtb) {
          console.log('Using amountCpxtb as fallback:', payment.amountCpxtb, 'type:', typeof payment.amountCpxtb);
          requiredAmount = typeof payment.amountCpxtb === 'number'
            ? payment.amountCpxtb
            : parseFloat(payment.amountCpxtb);
        }
        
        console.log('After conversion - receivedAmount:', receivedAmount, 'requiredAmount:', requiredAmount);
        
        // Calculate the remaining amount needed to complete the payment
        const remaining = Math.max(0, requiredAmount - receivedAmount);
        
        // Format with 6 decimal places for CPXTB token precision
        remainingAmount = remaining.toFixed(6);
        
        console.log('Manual calculation - Partial payment details:', {
          receivedAmount,
          requiredAmount,
          remaining,
          remainingAmount
        });
      }
    } else {
      console.log('Payment not partial, status:', payment.status);
    }
  }

  // Super aggressive status indicator that prioritizes completion detection
  const renderStatus = () => {
    // FINAL FIX: Much more aggressive checking to ensure payment is shown as completed
    // when it actually is completed
    
    // Calculate payment completion status from scratch regardless of the status field
    const receivedAmount = parseFloat(payment.receivedAmount || '0');
    const requiredAmount = parseFloat(payment.requiredAmount || payment.amountCpxtb || '0');
    const calculatedRemainingAmount = Math.max(0, requiredAmount - receivedAmount).toFixed(6);
    
    // Define multiple conditions that indicate completion
    const hasZeroRemaining = 
      payment.remainingAmount === '0.000000' || 
      parseFloat(payment.remainingAmount || '1') <= 0 ||
      calculatedRemainingAmount === '0.000000' ||
      parseFloat(calculatedRemainingAmount) <= 0;
    
    const hasReceivedEnough = receivedAmount >= requiredAmount;
    const isExplicitlyCompleted = payment.status === 'completed';
    
    // If ANY condition indicates completion, show as completed
    const isEffectivelyCompleted = isExplicitlyCompleted || hasZeroRemaining || hasReceivedEnough;
    
    // Extensive logging to diagnose the issue
    console.log('🔬 ENHANCED Payment status check (QR code page):', {
      actualStatus: payment.status,
      effectiveStatus: isEffectivelyCompleted ? 'completed' : payment.status,
      receivedAmount,
      requiredAmount,
      storedRemainingAmount: payment.remainingAmount,
      calculatedRemainingAmount,
      isZeroRemaining: hasZeroRemaining,
      hasReceivedEnough,
      isExplicitlyCompleted,
      paymentId: payment.id,
      reference: payment.paymentReference,
      transactionHash: payment.transactionHash,
      completionTimestamp: new Date().toISOString()
    });
    
    // If effectively completed, show completion status
    if (isEffectivelyCompleted) {
      // If we're fixing a status mismatch, log that fact
      if (!isExplicitlyCompleted) {
        console.log('⚠️ Auto-correcting display from ' + payment.status + ' to completed - zero remaining or received enough');
      }
      
      return (
        <div style={styles.statusCompleted}>
          <CheckCircle2 className="h-5 w-5" />
          <span>Payment Completed!</span>
          {payment.transactionHash && (
            <a 
              href={`https://basescan.org/tx/${payment.transactionHash}`} 
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                marginLeft: 'auto',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <ExternalLink className="h-3 w-3" />
              View Transaction
            </a>
          )}
        </div>
      );
    } else if (payment.status === 'partial') {
      // We already calculated remainingAmount above, no need to recalculate it here
      // Additional debug logging
      console.log('Rendering partial payment status - Payment data:', {
        status: payment.status,
        receivedAmount: payment.receivedAmount,
        requiredAmount: payment.requiredAmount,
        remainingAmount: payment.remainingAmount
      });
      
      return (
        <div style={styles.statusPartial}>
          <div style={{ 
            height: '0.75rem', 
            width: '0.75rem', 
            borderRadius: '50%', 
            backgroundColor: 'currentColor',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }} />
          <div>
            <span>Partial Payment Received</span>
            
            {/* Prominent display of remaining amount with larger font and contrast */}
            <div style={{ 
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: theme.darkMode ? 'rgba(255, 153, 0, 0.2)' : 'rgba(255, 153, 0, 0.1)',
              borderRadius: '0.25rem',
              borderLeft: '3px solid #ff9900',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'normal' }}>Still needed:</div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                marginTop: '0.25rem',
                color: theme.darkMode ? '#ffb84d' : '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <span>{remainingAmount} CPXTB</span>
                <button
                  onClick={() => copyToClipboard(
                    remainingAmount,
                    "Remaining amount copied to clipboard"
                  )}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px',
                    borderRadius: '4px',
                    color: 'inherit',
                    fontSize: '0.75rem'
                  }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            {payment.transactionHash && (
              <a 
                href={`https://basescan.org/tx/${payment.transactionHash}`} 
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  fontSize: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginTop: '0.25rem'
                }}
              >
                <ExternalLink className="h-3 w-3" />
                View Transaction
              </a>
            )}
          </div>
        </div>
      );
    } else if (payment.status === 'expired') {
      return (
        <div style={styles.statusExpired}>
          <div style={{ height: '0.75rem', width: '0.75rem', borderRadius: '50%', backgroundColor: 'currentColor' }} />
          <span>Payment Expired</span>
        </div>
      );
    } else {
      // Debug why we're reaching the pending state
      console.log('⚠️ Rendering PENDING status even though we should be completed! Payment data:', {
        status: payment.status,
        receivedAmount: payment.receivedAmount,
        requiredAmount: payment.requiredAmount,
        remainingAmount: payment.remainingAmount,
        isZeroRemaining: payment.remainingAmount === '0.000000' || parseFloat(payment.remainingAmount || '1') <= 0
      });
      
      // Force check if payment should actually be shown as completed
      const shouldBeCompleted = payment.remainingAmount === '0.000000' || 
                             parseFloat(payment.remainingAmount || '1') <= 0 ||
                             payment.status === 'completed';
      
      if (shouldBeCompleted) {
        console.log('🔄 Detected payment should be completed - forcing completed display');
        return (
          <div style={styles.statusCompleted}>
            <CheckCircle2 className="h-5 w-5" />
            <span>Payment Completed! (Auto-corrected)</span>
            {payment.transactionHash && (
              <a 
                href={`https://basescan.org/tx/${payment.transactionHash}`} 
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  marginLeft: 'auto',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <ExternalLink className="h-3 w-3" />
                View Transaction
              </a>
            )}
          </div>
        );
      }
      
      // If we get here, it's genuinely pending
      return (
        <div style={styles.statusPending}>
          <div style={{ 
            height: '0.75rem', 
            width: '0.75rem', 
            borderRadius: '50%', 
            backgroundColor: 'currentColor',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }} />
          <span>Payment Pending</span>
        </div>
      );
    }
  };

  // Render custom HTML with sanitization
  const renderCustomHTML = (html: string) => {
    // Basic sanitization
    const sanitized = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+=/gi, '');
      
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
  };

  return (
    <div style={styles.container}>
      {/* Custom Header */}
      {theme.customHeader && (
        <div className="custom-header">
          {renderCustomHTML(theme.customHeader)}
        </div>
      )}
      
      {/* Default Header */}
      {!theme.customHeader && (
        <header style={styles.header}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>CPXTB Payment</h1>
        </header>
      )}
      
      <main style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '1rem', 
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={styles.card}>
          <div style={styles.section}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>
              {payment.businessName || 'CPXTB Payment'}
            </h2>
            
            <div style={styles.infoRow}>
              <span>Amount (USD)</span>
              <span style={{ fontWeight: 'bold' }}>${Number(payment.amountUsd).toFixed(2)}</span>
            </div>
            
            <div style={styles.infoRow}>
              <span>Amount (CPXTB)</span>
              <span style={{ fontWeight: 'bold' }}>{Number(payment.amountCpxtb).toFixed(6)} CPXTB</span>
            </div>
            
            <div style={styles.infoRow}>
              <span>Reference</span>
              <span>{payment.reference}</span>
            </div>
            
            <div style={styles.infoRow}>
              <span>Created</span>
              <span>{formatDate(payment.createdAt)}</span>
            </div>
            
            <div style={styles.infoRow}>
              <span>Expires</span>
              <span>{formatDate(payment.expiresAt)}</span>
            </div>
            
            {payment.orderId && (
              <div style={styles.infoRow}>
                <span>Order ID</span>
                <span>{payment.orderId}</span>
              </div>
            )}
            
            {payment.description && (
              <div style={styles.infoRow}>
                <span>Description</span>
                <span>{payment.description}</span>
              </div>
            )}
          </div>
        </div>
        
        <div style={styles.card}>
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.125rem' }}>
              {payment.status === 'partial' && parseFloat(remainingAmount) > 0 ? (
                <>Scan to Pay <span style={{ color: '#ff9900', fontWeight: 'bold' }}>{remainingAmount}</span> CPXTB</>
              ) : (
                <>Scan to Pay {Number(payment.amountCpxtb).toFixed(6)} CPXTB</>
              )}
            </h3>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={styles.qrContainer}>
                <QRCodeSVG 
                  value={walletUri}
                  size={200}
                  level="H"
                  className="w-full h-auto"
                />
              </div>
              
              <div style={styles.alert}>
                ⚠️ SEND ONLY CPXTB TOKENS!
              </div>
              
              <div>
                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {payment.status === 'partial' && parseFloat(remainingAmount) > 0 ? (
                    <>Send exactly <span style={{ color: '#ff9900' }}>{remainingAmount}</span> CPXTB to:</>
                  ) : (
                    <>Send exactly {Number(payment.amountCpxtb).toFixed(6)} CPXTB to:</>
                  )}
                </p>
                
                <div style={styles.walletAddress}>
                  {payment.merchantWalletAddress}
                </div>
                
                <div style={styles.copyWrapper}>
                  <button 
                    style={styles.copyButton}
                    onClick={() => copyToClipboard(
                      payment.merchantWalletAddress, 
                      "Wallet address copied to clipboard"
                    )}
                  >
                    <Copy className="h-3 w-3 inline-block mr-1" /> Copy Address
                  </button>
                  
                  <button 
                    style={styles.copyButton}
                    onClick={() => copyToClipboard(
                      payment.status === 'partial' ? remainingAmount : payment.amountCpxtb.toString(), 
                      payment.status === 'partial' ? "Remaining amount copied to clipboard" : "Amount copied to clipboard"
                    )}
                  >
                    <Copy className="h-3 w-3 inline-block mr-1" /> 
                    {payment.status === 'partial' ? 'Copy Remaining' : 'Copy Amount'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div style={styles.section}>
            {renderStatus()}
            
            <div style={styles.warning}>
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p style={{ fontWeight: 'bold', marginTop: 0, marginBottom: '0.25rem' }}>
                  ⚠️ IMPORTANT: CPXTB TOKENS ONLY!
                </p>
                <p style={{ margin: 0 }}>
                  Do NOT send ETH or BASE coins - they will be lost!
                </p>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Share this payment:
              </p>
              
              <div>
                <a 
                  href={`https://twitter.com/intent/tweet?text=Please%20send%20me%20${payment.status === 'partial' ? remainingAmount : payment.amountCpxtb || ''}%20CPXTB%20to%20${payment.merchantWalletAddress || ''}&hashtags=CPXTB,Crypto`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.socialButton}
                >
                  <Twitter className="h-4 w-4 mr-1" /> Share on Twitter
                </a>
                
                <a 
                  href={`https://t.me/share/url?url=${window.location.href}&text=Please%20send%20me%20${payment.status === 'partial' ? remainingAmount : payment.amountCpxtb || ''}%20CPXTB%20to%20${payment.merchantWalletAddress || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.socialButton}
                >
                  <MessageCircle className="h-4 w-4 mr-1" /> Share on Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Custom Footer */}
      {theme.customFooter && (
        <div className="custom-footer">
          {renderCustomHTML(theme.customFooter)}
        </div>
      )}
      
      {/* Default Footer */}
      {!theme.customFooter && (
        <footer style={styles.footer}>
          <p>© {new Date().getFullYear()} CPXTB Platform — All rights reserved</p>
          <small>Powered by Base Network</small>
        </footer>
      )}
      
      {/* Payment notification modals */}
      <PaymentSuccessNotification 
        isVisible={showSuccessModal}
        reference={payment?.paymentReference || ''}
        onClose={() => setShowSuccessModal(false)}
      />
      
      <PaymentPartialNotification
        isVisible={showPartialModal}
        reference={payment?.paymentReference || ''}
        remainingAmount={partialAmount}
        onClose={() => setShowPartialModal(false)}
      />
    </div>
  );
}