import { ethers } from 'ethers';
import { storage } from './storage';
import { CPXTB_TOKEN_ADDRESS, BASE_CHAIN_ID } from './constants';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { payments } from '@shared/schema';

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
    // Convert addresses to checksum format for consistent comparison
    const fromAddress = ethers.getAddress(from.toLowerCase());
    const toAddress = ethers.getAddress(to.toLowerCase());
    
    // Get pending payments sent to this merchant
    const pendingPayments = await storage.getExpiredPayments();
    
    // Check if any pending payment matches this transaction
    for (const payment of pendingPayments) {
      // Skip payments that are not pending
      if (payment.status !== 'pending') continue;
      
      // Get merchant info
      const merchant = await storage.getMerchant(payment.merchantId);
      if (!merchant) continue;
      
      // Check if this transaction is a payment to this merchant
      if (ethers.getAddress(merchant.walletAddress.toLowerCase()) === toAddress) {
        // Verify amount within 1% tolerance (to account for gas/slippage)
        const expectedAmount = BigInt(payment.amountCpxtb);
        const minAmount = expectedAmount - (expectedAmount / BigInt(100));
        
        if (value >= minAmount) {
          console.log(`Payment match found! Payment ID: ${payment.id}, Reference: ${payment.paymentReference}`);
          
          // Update payment status
          await storage.updatePaymentStatus(payment.id, 'completed', txHash);
          
          // Also update in the database directly to be extra safe
          await db.update(payments)
            .set({ 
              status: 'completed',
              transactionHash: txHash,
              updatedAt: new Date()
            })
            .where(eq(payments.id, payment.id));
            
          console.log(`Payment ${payment.id} marked as completed with transaction hash ${txHash}`);
        }
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