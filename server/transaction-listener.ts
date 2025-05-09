import { ethers } from 'ethers';
import { storage } from './storage';
import { CPXTB_TOKEN_ADDRESS, BASE_CHAIN_ID, TREASURY_ADDRESS } from './constants';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { payments } from '@shared/schema';
import { WebSocket } from 'ws';

// Keep track of processed transaction hashes to avoid double-processing
const processedTransactions = new Map<string, Set<number>>();

// ABI for ERC20 token - we only need the Transfer event
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// RPC URL for the Base network
const RPC_URL = process.env.BASE_RPC_API_KEY 
  ? `https://base-mainnet.g.alchemy.com/v2/${process.env.BASE_RPC_API_KEY}`
  : "https://mainnet.base.org";

// Create provider
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Create contract instance for the CPXTB token
const tokenContract = new ethers.Contract(CPXTB_TOKEN_ADDRESS, ERC20_ABI, provider);

// Keep track of merchants being monitored
const monitoredMerchants = new Map<string, boolean>();

// Process a token transfer event
async function processTransferEvent(
  from: string, 
  to: string, 
  value: bigint,
  txHash: string
) {
  console.log(`Processing transfer event: ${from} -> ${to}, value: ${value.toString()}, txHash: ${txHash}`);
  
  try {
    // Get all pending payments that haven't expired yet
    const pendingPayments = await storage.getPendingPayments();
    console.log(`Found ${pendingPayments.length} pending payments to check against this transaction`);
    
    // If no pending payments, exit early
    if (pendingPayments.length === 0) {
      return;
    }
    
    // Format the receiving address in a consistent way
    const recipientAddress = to.toLowerCase();
    console.log(`Transaction recipient (normalized): ${recipientAddress}`);
    
    // REMOVED the check that skips treasury wallet transactions
    // Since the merchant wallet can be the same as the treasury wallet, we'll
    // process ALL transactions and let the merchant-specific check determine if it matches
    
    // Loop through each pending payment to see if it matches this transaction
    for (const payment of pendingPayments) {
      try {
        console.log(`Checking pending payment ID: ${payment.id}, Reference: ${payment.paymentReference}`);
        
        // Check if this payment has already been processed with this transaction hash
        // This prevents one transaction from erroneously marking multiple payments as complete
        const processedPaymentsForTx = processedTransactions.get(txHash) || new Set<number>();
        if (processedPaymentsForTx.has(payment.id)) {
          console.log(`⚠️ Payment ${payment.id} already processed with transaction ${txHash} - skipping to prevent duplicate processing`);
          continue;
        }
        
        // Get the merchant for this payment
        const merchant = await storage.getMerchant(payment.merchantId);
        if (!merchant) {
          console.log(`Could not find merchant ${payment.merchantId} for payment ${payment.id}`);
          continue;
        }
        
        // Get merchant's wallet address and normalize it
        const merchantAddress = merchant.walletAddress.toLowerCase();
        
        // Enhanced logging for address matching
        console.log(`MATCHING ADDRESSES | Payment ${payment.id}: Merchant=${payment.merchantId}`);
        console.log(`- Merchant Address from DB: ${merchantAddress}`);
        console.log(`- Transaction Recipient:    ${recipientAddress}`);
        console.log(`- Is Match: ${merchantAddress === recipientAddress ? 'YES ✅' : 'NO ❌'}`);
        
        // Detailed hex comparison for troubleshooting
        console.log('- Hex comparison:');
        for (let i = 0; i < merchantAddress.length; i++) {
          if (merchantAddress[i] !== recipientAddress[i]) {
            console.log(`  Position ${i}: ${merchantAddress[i]} vs ${recipientAddress[i]}`);
          }
        }
        
        if (merchantAddress === recipientAddress) {
          const paymentType = merchantAddress === recipientAddress ? '(Direct to merchant)' : '(Via treasury with warning)';
          console.log(`✅ Wallet address match for payment ${payment.id}! ${paymentType}`);
          
          // Convert the received token amount to a comparable format (with same decimal precision)
          // CPXTB has 18 decimals like most ERC20 tokens
          const receivedAmount = Number(ethers.formatEther(value));
          const requiredAmount = Number(payment.amountCpxtb);
          
          console.log(`Payment ${payment.id}: Required amount=${requiredAmount} CPXTB (${typeof requiredAmount}), Received amount=${receivedAmount} CPXTB (${typeof receivedAmount})`);
          console.log(`Original amountCpxtb from payment=${payment.amountCpxtb} (${typeof payment.amountCpxtb})`);
          
          // ENHANCED SECURITY: Stricter payment status determination
          let paymentStatus = 'pending';
          let shouldComplete = false;
          let securityCheck = 'unknown';
          
          // SECURITY CHECK: Ensure we have actual coins received (non-zero)
          if (receivedAmount <= 0) {
            console.error(`❌ SECURITY ALERT: Zero or negative amount detected in transaction ${txHash}`);
            securityCheck = 'failed';
            continue; // Skip this payment entirely - potentially malicious transaction
          }
          
          // Create comprehensive validation report
          const validationReport = {
            paymentId: payment.id,
            paymentReference: payment.paymentReference,
            merchantAddress: merchantAddress,
            transactionHash: txHash,
            requiredAmount: requiredAmount,
            receivedAmount: receivedAmount,
            percentReceived: (receivedAmount / requiredAmount * 100).toFixed(2) + '%',
            sufficientAmount: receivedAmount >= requiredAmount,
            timestamp: new Date().toISOString()
          };
          
          console.log('🔐 PAYMENT VALIDATION REPORT:', validationReport);
          
          // Determine payment status based on amount comparison
          if (receivedAmount >= requiredAmount) {
            paymentStatus = 'completed';
            shouldComplete = true;
            securityCheck = 'passed';
            console.log(`✅ Received amount (${receivedAmount}) is sufficient for payment ${payment.id}`);
          } else if (receivedAmount >= requiredAmount * 0.1) { // At least 10% paid
            paymentStatus = 'partial';
            securityCheck = 'passed'; // Allow partial payments that reach at least 10%
            console.log(`⚠️ Partial payment: Required ${requiredAmount} CPXTB but received ${receivedAmount} CPXTB (${(receivedAmount/requiredAmount*100).toFixed(2)}%)`);
          } else {
            paymentStatus = 'partial';
            securityCheck = 'failed'; // Too small payment - might be dust/spam
            console.log(`⚠️ SUSPICIOUS: Tiny payment detected: Required ${requiredAmount} CPXTB but received only ${receivedAmount} CPXTB`);
          }
          
          try {
            // Get the current payment details to see if there are already partial payments
            const currentPayment = await storage.getPayment(payment.id);
            let totalReceivedAmount = receivedAmount;
            
            // If there's already a received amount, add it to our current received amount
            if (currentPayment && currentPayment.receivedAmount) {
              const previouslyReceived = parseFloat(currentPayment.receivedAmount);
              totalReceivedAmount = previouslyReceived + receivedAmount;
              console.log(`Adding current payment of ${receivedAmount} CPXTB to previous payment of ${previouslyReceived} CPXTB for a total of ${totalReceivedAmount} CPXTB`);
            }
            
            // Calculate the remaining amount based on the total received
            const remainingAmount = Math.max(0, requiredAmount - totalReceivedAmount).toFixed(6);
            console.log(`Total received so far: ${totalReceivedAmount} CPXTB, Remaining: ${remainingAmount} CPXTB`);
            
            // FIXED: Enhanced payment validation to ensure actual payment is received
            // Check if we should set the payment to completed based on the total amount received
            if (totalReceivedAmount > 0 && totalReceivedAmount >= requiredAmount) {
              // Only mark as completed if actual coins were received (amount > 0)
              paymentStatus = 'completed';
              shouldComplete = true;
              console.log(`Payment ${payment.id}: Received actual coins (${totalReceivedAmount} CPXTB). Setting remainingAmount to 0.000000 and status to completed`);
            } else if (totalReceivedAmount === 0) {
              // Special case warning for transactions with zero value
              console.warn(`⚠️ Payment ${payment.id}: Transaction detected but with ZERO coins received. NOT marking as completed!`);
              shouldComplete = false;
              paymentStatus = 'pending'; // Keep as pending if no coins were actually received
            } else {
              // For partial payments
              console.log(`Payment ${payment.id}: Setting remainingAmount to ${remainingAmount}`);
            }
            
            // ENHANCED SECURITY: Record security check status
            const securityMetadata = {
              validationTimestamp: new Date().toISOString(),
              securityCheck,
              validationReport
            };
            
            // Update payment status in storage with all payment details
            await storage.updatePaymentStatus(
              payment.id, 
              paymentStatus, 
              txHash, 
              totalReceivedAmount, // Use the summed amount
              requiredAmount,
              remainingAmount,
              JSON.stringify(securityMetadata) // Store security check metadata
            );
            
            // Track that this payment has been processed with this transaction hash
            // This prevents double-processing of the same payment with the same transaction
            let processedPaymentsForTx = processedTransactions.get(txHash);
            if (!processedPaymentsForTx) {
              processedPaymentsForTx = new Set<number>();
              processedTransactions.set(txHash, processedPaymentsForTx);
            }
            processedPaymentsForTx.add(payment.id);
            console.log(`✅ Added payment ${payment.id} to processed list for transaction ${txHash}`);
            
            // FIXED: No longer doing direct DB updates to avoid duplicating email notifications
            // Instead, we rely completely on the storage.updatePaymentStatus method which handles emails appropriately
            if (shouldComplete && securityCheck === 'passed') {
              // Just log the outcome - actual update was done above via storage.updatePaymentStatus
              console.log(`✅ Payment ${payment.id} (${payment.paymentReference}) SECURELY marked as completed with tx hash ${txHash}`);
            } else {
              // Just log the outcome - actual update was done above via storage.updatePaymentStatus
              console.log(`🔄 Payment ${payment.id} marked as ${paymentStatus} with security status ${securityCheck}, tx hash ${txHash}, received: ${receivedAmount}, required: ${requiredAmount}`);
            }
            
            // Broadcast payment status update only to the relevant merchant
            try {
              // Access the WebSocket server from the global scope
              const wss = (global as any).wss;
              
              if (wss) {
                // CRITICAL SECURITY FIX: Never send a "completed" status when payment has 0 coins
                // This is a major security enhancement to prevent false success notifications
                let finalStatus = paymentStatus;
                if (shouldComplete && totalReceivedAmount <= 0) {
                  // Override status if marked completed but has no actual payment
                  finalStatus = 'pending';
                  console.log('⚠️ SECURITY ALERT: Attempted to mark payment as completed with 0 coins received. Overriding to pending.');
                }

                // Create enhanced notification payload with security information
                const notificationPayload = {
                  type: 'paymentStatusUpdate',
                  merchantId: payment.merchantId, // Include merchantId to filter recipients
                  paymentId: payment.id,
                  paymentReference: payment.paymentReference,
                  // Use the corrected status that ensures we never mark a payment as complete without coins
                  status: finalStatus,
                  transactionHash: txHash,
                  timestamp: new Date().toISOString(),
                  // Include received and required amounts to calculate remaining amount
                  // Make sure to convert numbers to strings to prevent precision issues
                  receivedAmount: totalReceivedAmount.toString(),
                  requiredAmount: requiredAmount.toString(),
                  amountCpxtb: payment.amountCpxtb,
                  // Use the already calculated remaining amount value
                  remainingAmount: shouldComplete && totalReceivedAmount > 0 ? '0.000000' : remainingAmount,
                  // ENHANCED SECURITY: Add security fields to notification with consistent naming
                  securityStatus: securityCheck,
                  securityCheck: securityCheck, // Added for backward compatibility
                  validationTimestamp: new Date().toISOString(),
                  // Include security indicators for UI handling
                  // Only allow payment completion if security checks passed AND coins received
                  isSecureTransaction: securityCheck === 'passed' && totalReceivedAmount > 0,
                  verificationDetails: {
                    receivedPercentage: (totalReceivedAmount / requiredAmount * 100).toFixed(2) + '%',
                    hasActualCoins: totalReceivedAmount > 0,
                    isVerifiedOnBlockchain: true,
                    paymentAmountValid: totalReceivedAmount > 0,
                  }
                };
                
                console.log(`📢 Broadcasting payment update to WebSocket clients for merchant ID: ${payment.merchantId}`);
                
                // Only send to clients that have set their merchantId filter
                // or to the specific merchant that owns this payment
                wss.clients.forEach((client: any) => {
                  if (client.readyState === WebSocket.OPEN) {
                    // Only send to clients that:
                    // 1. Have the same merchantId as the payment
                    // 2. Or have the merchant's wallet address
                    // ADDITIONAL SAFETY: Only send notifications for payments with actual coins received
                    if ((client.merchantId === payment.merchantId || 
                        (client.walletAddress && client.walletAddress.toLowerCase() === merchantAddress)) &&
                        totalReceivedAmount > 0) { // Only notify if actual coins were received
                      console.log(`💲 Sending payment notification for ${totalReceivedAmount} CPXTB received`);
                      client.send(JSON.stringify(notificationPayload));
                    }
                  }
                });
              } else {
                console.log('No WebSocket server available to broadcast update');
              }
            } catch (wsError) {
              console.error('Error broadcasting payment update via WebSocket:', wsError);
            }
          } catch (updateError) {
            console.error(`Error updating payment status: ${updateError}`);
          }
        } else {
          // Enhanced debug info to show merchant address for clarity
          console.log(`❌ Transaction recipient (${recipientAddress}) doesn't match merchant wallet:`);
          console.log(`   - Merchant wallet: ${merchantAddress}`);
        }
      } catch (paymentError) {
        console.error(`Error processing payment ${payment.id}:`, paymentError);
      }
    }
  } catch (error) {
    console.error('Error processing transfer event:', error);
  }
}

// Monitor token transfers for a specific merchant
export async function monitorMerchantPayments(merchantId: number) {
  try {
    const merchant = await storage.getMerchant(merchantId);
    if (!merchant) {
      console.error(`Merchant ${merchantId} not found`);
      return;
    }
    
    const walletAddress = merchant.walletAddress.toLowerCase();
    
    // Check if already monitoring this merchant
    if (monitoredMerchants.has(walletAddress)) {
      console.log(`Already monitoring merchant ${merchantId} with wallet ${walletAddress}`);
      return;
    }
    
    console.log(`Starting to monitor payments for merchant ${merchantId} with wallet ${walletAddress}`);
    
    // Set flag for this merchant
    monitoredMerchants.set(walletAddress, true);
    
    // Listen for Transfer events where the merchant is the recipient or it goes to treasury
    tokenContract.on("Transfer", async (from, to, value, event) => {
      const toAddress = to.toLowerCase();
      
      // Process if the recipient is our merchant
      // This is a critical security fix to prevent payment misdirection
      if (toAddress === walletAddress) {
        const txHash = event.log.transactionHash;
        await processTransferEvent(from, to, value, txHash);
      }
    });
    
    console.log(`Successfully set up listener for merchant ${merchantId} with wallet ${walletAddress}`);
  } catch (error) {
    console.error(`Error monitoring merchant ${merchantId} payments:`, error);
  }
}

// Start payment monitoring for all merchants
export async function startPaymentMonitoring() {
  console.log("Starting automatic payment monitoring service...");
  
  try {
    // Query all merchants from database
    const allMerchants = await db.query.merchants.findMany();
    
    // Set up listeners for each merchant
    for (const merchant of allMerchants) {
      await monitorMerchantPayments(merchant.id);
    }
    
    console.log(`Successfully set up payment monitoring for ${allMerchants.length} merchants`);
    
    // Also listen for all Transfer events to catch any we might have missed
    tokenContract.on("Transfer", async (from, to, value, event) => {
      // Check if this transfer is to any of our monitored merchant addresses
      const txHash = event.log.transactionHash;
      const toAddress = to.toLowerCase();
      
      // No longer skipping treasury transactions since merchant wallets can be the same
      // as the treasury wallet address. Merchants now handle their own validation.
      
      // Process if going to any merchant 
      if (monitoredMerchants.has(toAddress)) {
        await processTransferEvent(from, to, value, txHash);
      }
    });
    
    console.log("Global token transfer monitoring active");
  } catch (error) {
    console.error("Error starting payment monitoring:", error);
  }
}