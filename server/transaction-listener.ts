import { ethers } from 'ethers';
import { storage } from './storage';
import { CPXTB_TOKEN_ADDRESS, BASE_CHAIN_ID } from './constants';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { payments } from '@shared/schema';
import { WebSocket } from 'ws';

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
    
    // Loop through each pending payment to see if it matches this transaction
    for (const payment of pendingPayments) {
      try {
        console.log(`Checking pending payment ID: ${payment.id}, Reference: ${payment.paymentReference}`);
        
        // Get the merchant for this payment
        const merchant = await storage.getMerchant(payment.merchantId);
        if (!merchant) {
          console.log(`Could not find merchant ${payment.merchantId} for payment ${payment.id}`);
          continue;
        }
        
        // Get merchant's wallet address and normalize it
        const merchantAddress = merchant.walletAddress.toLowerCase();
        
        // Log for debugging
        console.log(`Payment ${payment.id}: Merchant=${payment.merchantId}, Merchant Address=${merchantAddress}, Transaction To=${recipientAddress}`);
        
        // Check if this transaction is going to the merchant's wallet
        if (merchantAddress === recipientAddress) {
          console.log(`✅ Wallet address match for payment ${payment.id}!`);
          
          try {
            // Mark the payment as completed
            await storage.updatePaymentStatus(payment.id, 'completed', txHash);
            
            console.log(`✅ Payment ${payment.id} (${payment.paymentReference}) marked as completed with tx hash ${txHash}`);
            
            // Extra safety - update directly in database too
            await db.update(payments)
              .set({
                status: 'completed',
                transactionHash: txHash,
                updatedAt: new Date(),
                completedAt: new Date()
              })
              .where(eq(payments.id, payment.id));
              
            // Broadcast payment status update to all WebSocket clients
            try {
              // Access the WebSocket server from the global scope
              const wss = (global as any).wss;
              
              if (wss) {
                // Create notification payload
                const notificationPayload = {
                  type: 'paymentStatusUpdate',
                  paymentId: payment.id,
                  paymentReference: payment.paymentReference,
                  status: 'completed',
                  transactionHash: txHash,
                  timestamp: new Date().toISOString()
                };
                
                console.log('📢 Broadcasting payment update to WebSocket clients:', notificationPayload);
                
                // Send to all connected clients
                wss.clients.forEach((client: any) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(notificationPayload));
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
          console.log(`❌ Merchant wallet (${merchantAddress}) doesn't match transaction recipient (${recipientAddress})`);
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
    
    // Listen for Transfer events where the merchant is the recipient
    tokenContract.on("Transfer", async (from, to, value, event) => {
      // Only process if the recipient is our merchant
      if (to.toLowerCase() === walletAddress) {
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
      // Check if this transfer is to any of our monitored merchants
      const txHash = event.log.transactionHash;
      const toAddress = to.toLowerCase();
      
      if (monitoredMerchants.has(toAddress)) {
        await processTransferEvent(from, to, value, txHash);
      }
    });
    
    console.log("Global token transfer monitoring active");
  } catch (error) {
    console.error("Error starting payment monitoring:", error);
  }
}