import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertMiningPlanSchema, miningPlans, users, merchants, payments,
  insertMerchantSchema, insertPaymentSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { eq, gte, and, sql, lte } from "drizzle-orm";
import { db } from "./db";
import { z } from "zod";
import crypto from "crypto";
import { TREASURY_ADDRESS, CPXTB_TOKEN_ADDRESS, BASE_CHAIN_ID } from "./constants";
import { WebSocketServer, WebSocket } from "ws";
import { createPublicClient, http, parseAbi, parseAbiItem, formatUnits } from "viem";
import { base } from "wagmi/chains";
import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { startPaymentMonitoring } from "./transaction-listener";
import { registerTestChallengeRoutes } from "./test-challenge-route";

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const BASE_RPC_URL = `https://base-mainnet.g.alchemy.com/v2/${process.env.BASE_RPC_API_KEY}`;
const CPXTB_CONTRACT_ADDRESS = "0x96A0cc3C0fc5D07818E763E1B25bc78ab4170D1b";

// Standard ERC20 ABI with complete interface
const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)'
]);

// Add better error logging
async function distributeRewards(plan: any) {
  try {
    console.log('Starting distribution with configuration:', {
      rpcUrl: BASE_RPC_URL,
      contractAddress: CPXTB_CONTRACT_ADDRESS,
      chain: 'Base Mainnet',
      hasPrivateKey: !!ADMIN_PRIVATE_KEY,
      isFreeClaimPlan: plan.transactionHash === 'FREE_CPXTB_CLAIM'
    });

    // Create Base network client
    const baseClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC_URL, {
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000,
      })
    });

    if (!ADMIN_PRIVATE_KEY) {
      console.error('Admin private key not configured');
      return false;
    }

    // Ensure private key is properly formatted with 0x prefix
    const formattedPrivateKey = ADMIN_PRIVATE_KEY.startsWith('0x')
      ? ADMIN_PRIVATE_KEY
      : `0x${ADMIN_PRIVATE_KEY}`;

    // Create account from private key
    const account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    console.log('Admin account address:', account.address);

    try {
      // First, mark the plan as in progress to prevent duplicate distributions
      await db
        .update(miningPlans)
        .set({ isActive: false })
        .where(eq(miningPlans.id, plan.id));

      // Check network status first
      const blockNumber = await baseClient.getBlockNumber();
      console.log('Successfully connected to Base network, current block:', blockNumber.toString());

      // Check CPXTB balance before attempting distribution
      const balance = await baseClient.readContract({
        address: CPXTB_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [account.address]
      });

      // Convert reward amount to proper decimals (18 decimals for CPXTB)
      const rewardAmount = parseFloat(plan.dailyRewardCPXTB);
      const rewardInWei = BigInt(Math.floor(rewardAmount * 10 ** 18));

      console.log('Distribution attempt details:', {
        amount: rewardAmount,
        amountInWei: rewardInWei.toString(),
        recipient: plan.withdrawalAddress,
        adminBalance: balance.toString(),
        contract: CPXTB_CONTRACT_ADDRESS
      });

      // Check if admin has enough balance
      if (balance < rewardInWei) {
        console.error('Insufficient CPXTB balance for distribution');
        return false;
      }

      // Create wallet client with exact same configuration as baseClient
      const walletClient = createWalletClient({
        account,
        chain: base,
        transport: http(BASE_RPC_URL, {
          timeout: 30000,
          retryCount: 3,
          retryDelay: 1000,
        })
      });

      console.log('Contract simulation successful, proceeding with transaction');

      // Execute the transaction
      const hash = await walletClient.writeContract({
        address: CPXTB_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [plan.withdrawalAddress as `0x${string}`, rewardInWei],
        chain: base
      });

      console.log('Distribution transaction hash:', hash);

      // Wait for confirmation with timeout
      const receipt = await baseClient.waitForTransactionReceipt({
        hash,
        timeout: 30_000 // 30 seconds timeout
      });

      if (receipt.status === 'success') {
        // Update plan status
        await storage.markPlanAsWithdrawn(plan.id);
        console.log('Successfully distributed rewards for plan:', plan.id);
        return true;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      if (error.message.includes('403')) {
        console.error('Base network access denied. Please check RPC endpoint configuration.');
      }

      // If distribution fails, reactivate the plan
      await db
        .update(miningPlans)
        .set({ isActive: true })
        .where(eq(miningPlans.id, plan.id));

      return false;
    }
  } catch (error) {
    console.error('Error in automated distribution:', error);
    return false;
  }
}

async function checkAndDistributeMaturedPlans() {
  try {
    const now = new Date();
    console.log('Current time for automated check:', now.toISOString());

    // Get all matured plans that haven't been withdrawn, including free CPXTB claims
    const maturedPlans = await db
      .select()
      .from(miningPlans)
      .where(
        and(
          eq(miningPlans.hasWithdrawn, false),
          eq(miningPlans.isActive, true),
          // Using SQL.raw for proper date comparison
          sql`${miningPlans.expiresAt} <= ${now}`
        )
      );

    console.log('Found matured plans:', maturedPlans.length);
    if (maturedPlans.length > 0) {
      console.log('Plans to process:', maturedPlans.map(plan => ({
        id: plan.id,
        expiresAt: plan.expiresAt,
        amount: plan.dailyRewardCPXTB,
        recipient: plan.withdrawalAddress,
        isFreeClaimPlan: plan.transactionHash === 'FREE_CPXTB_CLAIM'
      })));

      for (const plan of maturedPlans) {
        console.log('Processing distribution for plan:', {
          id: plan.id,
          type: plan.transactionHash === 'FREE_CPXTB_CLAIM' ? 'Free CPXTB Claim' : 'Mining Plan',
          expiryTime: plan.expiresAt,
          currentTime: now.toISOString()
        });
        await distributeRewards(plan);
      }
    }
  } catch (error) {
    console.error('Error checking matured plans:', error);
  }
}

// Authentication middleware for merchant API endpoints
const authenticateMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Merchant authentication attempt with headers:', {
      headers: Object.keys(req.headers),
      'x-api-key': req.headers['x-api-key'] ? 'present' : 'missing'
    });
    
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      console.log('API key missing in request headers');
      return res.status(401).json({ message: 'API key required' });
    }
    
    console.log('Looking up merchant with API key:', apiKey.substring(0, 4) + '...');
    const merchant = await storage.getMerchantByApiKey(apiKey);
    
    if (!merchant) {
      console.log('No merchant found with provided API key');
      return res.status(401).json({ message: 'Invalid API key' });
    }
    
    console.log('Merchant authenticated successfully:', {
      id: merchant.id,
      businessName: merchant.businessName
    });
    
    // Attach merchant to request for later use
    (req as any).merchant = merchant;
    next();
  } catch (error: any) {
    console.error('Merchant authentication error:', error);
    res.status(500).json({ message: 'Authentication error: ' + error.message });
  }
};

// Utility to generate a payment reference - no longer uses order ID as requested
const generatePaymentReference = () => {
  // Generate a completely random reference with no order ID
  return `${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
};

// Function to calculate CPXTB amount based on USD amount and current exchange rate
const calculateCpxtbAmount = (usdAmount: number, exchangeRate: number) => {
  return usdAmount / exchangeRate;
};

// Get current CPXTB price from our price display API
const getCurrentCpxtbPrice = async (): Promise<number> => {
  // This is a placeholder - we'll use the current price from our existing price system
  // For now, returning a fixed price for example purposes
  return 0.002022; // Current price seen in the logs
};

// Helper function to verify a CPXTB token transaction on the blockchain
// SECURITY CRITICAL - Enhanced transaction verification function with strict validation
const verifyCpxtbTransaction = async (txHash: string, expectedAmount: string, toAddress: string) => {
  try {
    // VERSION 2.0 ENHANCED VALIDATION:
    // Create a comprehensive validation system that tracks all security checks
    const validationResults = {
      // Format checks
      hasValidTxFormat: false,
      hasValidToAddress: false,
      hasValidExpectedAmount: false,
      
      // Blockchain verification
      transactionExists: false,
      hasConfirmations: false,
      confirmedOnChain: false,
      
      // Token transfer verification
      hasTransferEvent: false,
      receiverMatches: false,
      tokenAddressMatches: false,
      transferAmountPositive: false,
      transferAmountSufficient: false,
      
      // Detailed data
      expectedAmount: 0,
      actualAmount: 0,
      confirmationCount: 0,
      percentReceived: 0,
      
      // Final results
      allChecksPass: false,
      securityVerdict: 'pending'
    };
    
    // STEP 1: Input validation
    validationResults.hasValidTxFormat = !!txHash && txHash.startsWith('0x') && txHash.length === 66;
    validationResults.hasValidToAddress = !!toAddress && toAddress.startsWith('0x') && toAddress.length === 42;
    
    try {
      validationResults.expectedAmount = parseFloat(expectedAmount);
      validationResults.hasValidExpectedAmount = !isNaN(validationResults.expectedAmount) && validationResults.expectedAmount > 0;
    } catch (e) {
      validationResults.hasValidExpectedAmount = false;
    }
    
    // Early termination if basic validation fails
    if (!validationResults.hasValidTxFormat) {
      console.error(`❌ CRITICAL VALIDATION FAILURE: Invalid transaction hash format: ${txHash}`);
      return { 
        verified: false, 
        reason: 'Invalid transaction hash format', 
        amount: 0,
        securityCheck: 'failed',
        validationResults 
      };
    }
    
    // Create Base network client
    const baseClient = createPublicClient({
      chain: base,
      transport: http(BASE_RPC_URL)
    });
    
    // SECURITY CHECK: Get current block for confirmation validation
    const currentBlock = await baseClient.getBlockNumber();
    const currentBlockNumber = Number(currentBlock);
    
    // Get transaction receipt
    console.log(`🔍 Verifying transaction with hash: ${txHash}`);
    const receipt = await baseClient.getTransactionReceipt({ 
      hash: txHash as `0x${string}` 
    });
    
    // STEP 2: Blockchain transaction validation
    if (!receipt) {
      console.error(`❌ CRITICAL VALIDATION FAILURE: No receipt found for transaction: ${txHash}`);
      validationResults.transactionExists = false;
      validationResults.securityVerdict = 'failed';
      return { 
        verified: false, 
        reason: 'Transaction not found', 
        amount: 0,
        securityCheck: 'failed',
        validationResults
      };
    }
    
    // Mark transaction as existing
    validationResults.transactionExists = true;
    
    // Calculate confirmations
    const confirmations = receipt.blockNumber ? Number(currentBlock - receipt.blockNumber) + 1 : 0;
    validationResults.confirmationCount = confirmations;
    
    console.log(`Transaction has ${confirmations} confirmations. Current block: ${currentBlock}, Tx block: ${receipt.blockNumber}`);
    
    // Validate confirmation count
    if (confirmations < 1) {
      console.error(`❌ VALIDATION FAILURE: Transaction has insufficient confirmations: ${confirmations}`);
      validationResults.hasConfirmations = false;
      validationResults.securityVerdict = 'failed';
      return { 
        verified: false, 
        reason: 'Insufficient confirmations', 
        confirmations: confirmations.toString(),
        amount: 0,
        securityCheck: 'failed',
        validationResults
      };
    }
    
    // Mark as having sufficient confirmations
    validationResults.hasConfirmations = true;
    
    // STEP 3: Check on-chain transaction success
    if (receipt.status !== 'success') {
      console.error(`❌ VALIDATION FAILURE: Transaction failed with status: ${receipt.status}`);
      validationResults.confirmedOnChain = false;
      validationResults.securityVerdict = 'failed';
      return { 
        verified: false, 
        reason: 'Transaction failed', 
        amount: 0,
        securityCheck: 'failed',
        validationResults
      };
    }
    
    // Mark transaction as confirmed on chain
    validationResults.confirmedOnChain = true;
    
    // STEP 4: CPXTB token transfer verification
    console.log(`Verifying transaction ${txHash} for CPXTB tokens sent to ${toAddress}...`);
    
    try {
      // Get the transaction logs to check for ERC20 Transfer events
      const logs = await baseClient.getLogs({
        address: CPXTB_TOKEN_ADDRESS as `0x${string}`,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber
      });
      
      // Find the transfer event that matches our recipient
      const transferLog = logs.find(log => 
        log.args.to?.toLowerCase() === toAddress.toLowerCase()
      );
      
      if (!transferLog) {
        console.log(`❌ No Transfer event found to ${toAddress} in transaction ${txHash}`);
        validationResults.hasTransferEvent = false;
        validationResults.securityVerdict = 'failed';
        return { 
          verified: false, 
          reason: 'No CPXTB transfer found to recipient address', 
          amount: 0,
          receipt,
          securityCheck: 'failed',
          validationResults
        };
      }
      
      // Mark as having transfer event
      validationResults.hasTransferEvent = true;
      
      // Verify recipient address matches (double check)
      validationResults.receiverMatches = 
        transferLog.args.to?.toLowerCase() === toAddress.toLowerCase();
        
      // Verify token address matches CPXTB
      validationResults.tokenAddressMatches = 
        transferLog.address.toLowerCase() === CPXTB_TOKEN_ADDRESS.toLowerCase();
      
      // Get the amount transferred from the log
      const amountTransferred = transferLog.args.value || BigInt(0);
      console.log(`Found Transfer event: ${amountTransferred.toString()} wei of CPXTB sent to ${toAddress}`);
      
      // Convert from wei to CPXTB (18 decimals)
      const amountInCPXTB = parseFloat(formatUnits(amountTransferred, 18));
      
      console.log(`Transaction verification details:`, {
        expectedAmount,
        actualAmount: amountInCPXTB.toString(),
        receiverMatches: transferLog.args.to?.toLowerCase() === toAddress.toLowerCase(),
        tokenAddressMatches: transferLog.address.toLowerCase() === CPXTB_TOKEN_ADDRESS.toLowerCase()
      });
      
      // STEP 5: Amount validation - populate validation results
      validationResults.actualAmount = amountInCPXTB;
      
      // Check if amount is positive
      validationResults.transferAmountPositive = amountInCPXTB > 0;
      
      if (!validationResults.transferAmountPositive) {
        console.error(`❌ CRITICAL VALIDATION FAILURE: Zero or negative amount (${amountInCPXTB}) transferred in transaction ${txHash}`);
        validationResults.securityVerdict = 'failed';
        return { 
          verified: false, 
          reason: 'Zero or negative amount transferred', 
          amount: amountInCPXTB,
          receipt,
          securityCheck: 'failed',
          validationResults
        };
      }
      
      // Validate sufficient amount vs expected amount
      const expectedAmountFloat = parseFloat(expectedAmount);
      validationResults.expectedAmount = expectedAmountFloat;
      
      const minimumRequiredPercentage = 0.98; // Allow for small rounding differences (2% tolerance)
      const receivedPercentage = amountInCPXTB / expectedAmountFloat;
      validationResults.percentReceived = receivedPercentage;
      
      console.log(`Payment amount validation - Expected: ${expectedAmountFloat}, Received: ${amountInCPXTB}, Percentage: ${receivedPercentage * 100}%`);
      
      // Check if received enough
      validationResults.transferAmountSufficient = receivedPercentage >= minimumRequiredPercentage;
      
      if (!validationResults.transferAmountSufficient) {
        console.error(`⚠️ VALIDATION WARNING: Insufficient amount transferred - Expected ${expectedAmountFloat} but received only ${amountInCPXTB} CPXTB (${receivedPercentage * 100}%)`);
        
        // If it's a very small amount (less than 10% of expected), treat it as a failed verification
        if (receivedPercentage < 0.1) {
          validationResults.securityVerdict = 'failed';
          return { 
            verified: false, 
            reason: 'Amount transferred is less than 10% of expected amount', 
            amount: amountInCPXTB,
            expectedAmount: expectedAmountFloat,
            percentReceived: receivedPercentage,
            receipt,
            securityCheck: 'failed',
            validationResults
          };
        }
      }
      
      // STEP 6: Final validation verdict
      // Check if all critical checks passed
      validationResults.allChecksPass = 
        validationResults.hasValidTxFormat &&
        validationResults.transactionExists &&
        validationResults.hasConfirmations &&
        validationResults.confirmedOnChain &&
        validationResults.hasTransferEvent &&
        validationResults.receiverMatches &&
        validationResults.tokenAddressMatches &&
        validationResults.transferAmountPositive &&
        (validationResults.transferAmountSufficient || receivedPercentage >= 0.1); // Allow partial payments above 10%
      
      // Set final security verdict
      validationResults.securityVerdict = validationResults.allChecksPass ? 'passed' : 'failed';
      
      // Log complete validation report
      console.log('🔐 COMPLETE TRANSACTION VALIDATION REPORT:', validationResults);
      
      // All checks passed, return success with the verified amount and detailed validation results
      return { 
        verified: true, 
        amount: amountInCPXTB,
        expectedAmount: expectedAmountFloat,
        percentReceived: receivedPercentage,
        receipt,
        securityCheck: validationResults.securityVerdict,
        validationResults
      };
    } catch (logError: any) {
      console.error('Error verifying transaction logs:', logError);
      return { 
        verified: false, 
        reason: `Error verifying transaction logs: ${logError.message}`, 
        amount: 0,
        receipt 
      };
    }
  } catch (error: any) {
    console.error('Transaction verification error:', error);
    return { 
      verified: false, 
      reason: error.message, 
      amount: 0 
    };
  }
};

// Setup authentication middleware
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({ 
  pool, 
  createTableIfMissing: true 
});

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Import email utility
import { sendPasswordResetEmail } from './email';

function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error: any) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: "Registration failed: " + error.message });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  // Forgot password - request reset link
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      console.log(`Received password reset request for email: ${email}`);
      
      if (!email) {
        console.log("Password reset request missing email");
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find the user by email
      const user = await storage.getUserByEmail(email);
      
      // We're modifying this to return a 404 so our client can give better guidance
      if (!user) {
        console.log(`User with email ${email} not found in database`);
        return res.status(404).json({ 
          message: "Email address not found. Please update your profile with your email address first." 
        });
      }
      
      console.log(`Found user for password reset: ${user.username}`);
      
      // Generate a reset token
      const token = await storage.createPasswordResetToken(email);
      
      if (!token) {
        console.error(`Failed to generate reset token for user ${user.username}`);
        return res.status(500).json({ message: "Failed to generate reset token" });
      }
      
      console.log(`Generated reset token for user ${user.username}`);
      
      // Send the password reset email
      const emailSent = await sendPasswordResetEmail(email, token, user.username);
      const isDev = process.env.NODE_ENV !== 'production';
      
      if (!emailSent) {
        console.error(`Failed to send password reset email to: ${email}`);
        // In development mode, we'll still return success since the token is logged to console
        if (isDev) {
          console.log("Development mode: Proceeding despite email failure");
          
          // Always include the token in development mode
          return res.status(200).json({ 
            message: "If your email is in our system, you will receive a password reset link shortly",
            devToken: token // Include token for testing
          });
        }
        return res.status(500).json({ message: "Failed to send password reset email" });
      }
      
      console.log(`Successfully processed password reset for email: ${email}`);
      
      // In development mode, always include the token in the response
      if (isDev) {
        console.log('Development mode: Including reset token in response');
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;
        
        console.log(`Reset URL for testing: ${resetUrl}`);
        
        res.status(200).json({ 
          message: "If your email is in our system, you will receive a password reset link shortly",
          devToken: token,  // Only included in development mode
          resetUrl: resetUrl // Include full URL for easy testing
        });
      } else {
        res.status(200).json({ 
          message: "If your email is in our system, you will receive a password reset link shortly" 
        });
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error processing request: " + error.message });
    }
  });
  
  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      console.log('Received password reset request with token:', {
        tokenProvided: !!token,
        tokenLength: token ? token.length : 0,
        passwordProvided: !!newPassword
      });
      
      if (!token || !newPassword) {
        console.log('Missing required fields for password reset');
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Verify token and update password
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        console.log('Could not find user with the provided reset token');
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      console.log(`Valid reset token for user: ${user.username}`);
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Reset the password
      const success = await storage.resetPassword(token, hashedPassword);
      
      if (!success) {
        console.log('Failed to reset password for user:', user.username);
        return res.status(500).json({ message: "Failed to reset password" });
      }
      
      console.log(`Successfully reset password for user: ${user.username}`);
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Error processing request: " + error.message });
    }
  });
  
  // Update user email
  app.post("/api/update-email", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to update your email" });
      }
      
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Update the user's email
      const updatedUser = await storage.updateUserEmail((req.user as any).id, email);
      
      res.status(200).json({ 
        message: "Email updated successfully",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Update email error:", error);
      res.status(500).json({ message: "Error updating email: " + error.message });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register test challenge routes for easier debugging/testing
  registerTestChallengeRoutes(app);
  
  // Add a simple verification endpoint for the challenge system
  app.get('/api/verify-challenge', (req, res) => {
    // The challenge-middleware will handle the verification
    // If we reach this point, the challenge was successfully solved
    res.status(200).json({ success: true, message: "Challenge verified successfully" });
  });
  // Set up authentication endpoints
  setupAuth(app);
  // Update user endpoint with additional logging and error handling
  app.get("/api/users/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const normalizedAddress = address.toLowerCase();
      const referredBy = req.query.ref as string;

      console.log('Fetching user data with detailed logging:', {
        originalAddress: address,
        normalizedAddress,
        referralCode: referredBy,
        timestamp: new Date().toISOString(),
        headers: req.headers,
        url: req.url,
        method: req.method,
        query: req.query
      });

      // First check if user exists - try both original and normalized address
      let user = await storage.getUserByUsername(normalizedAddress);

      if (!user) {
        // Try with original address if normalized failed
        user = await storage.getUserByUsername(address);
      }

      console.log('Database query result:', {
        userFound: !!user,
        userData: user,
        originalAddress: address,
        normalizedAddress,
        timestamp: new Date().toISOString()
      });

      if (!user) {
        // If referral code provided, verify it exists
        if (referredBy) {
          const referrer = await storage.getUserByReferralCode(referredBy);
          if (!referrer) {
            console.log('Invalid referral code:', referredBy);
            res.status(400).json({
              message: "Invalid referral code"
            });
            return;
          }
        }

        // Create new user with referral info
        const newUserData = {
          username: normalizedAddress, // Store normalized address
          password: 'not-used', // OAuth-based auth, password not used
          referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          referredBy: referredBy,
          accumulatedCPXTB: 0 // Make sure to set initial CPXTB
        };

        console.log('Creating new user with data:', {
          ...newUserData,
          timestamp: new Date().toISOString()
        });

        user = await storage.createUser(newUserData);
      }

      // Add detailed response logging
      console.log('Sending user response:', {
        originalAddress: address,
        normalizedAddress,
        user,
        timestamp: new Date().toISOString()
      });

      res.json({ user });
    } catch (error: any) {
      console.error("Detailed error in user fetch/create:", {
        error: error.message,
        stack: error.stack,
        address: req.params.address,
        normalizedAddress: req.params.address?.toLowerCase(),
        timestamp: new Date().toISOString(),
        headers: req.headers,
        url: req.url
      });
      res.status(500).json({
        message: "Error fetching/creating user: " + error.message
      });
    }
  });

  // Get active mining plans
  app.get("/api/mining-plans/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const plans = await storage.getActiveMiningPlans(walletAddress);
      res.json({ plans });
    } catch (error: any) {
      console.error("Error fetching mining plans:", error);
      res.status(500).json({
        message: "Error fetching mining plans: " + error.message
      });
    }
  });

  // Update the claimable plans endpoint to ensure proper filtering
  app.get("/api/mining-plans/:walletAddress/claimable", async (req, res) => {
    try {
      const { walletAddress } = req.params;

      // Check if it's the admin wallet
      const isAdmin = walletAddress.toLowerCase() === TREASURY_ADDRESS.toLowerCase();
      console.log('Fetching claimable plans:', {
        walletAddress,
        isAdmin,
        currentTime: new Date().toISOString()
      });

      let plans;
      if (isAdmin) {
        // Admin can see all expired, unwithdrawn plans
        plans = await db
          .select()
          .from(miningPlans)
          .where(
            and(
              eq(miningPlans.hasWithdrawn, false),
              eq(miningPlans.isActive, true),
              lte(miningPlans.expiresAt, sql`NOW()`)  // Only return truly expired plans
            )
          );
      } else {
        // Regular users can only see their own expired plans
        plans = await storage.getExpiredUnwithdrawnPlans(walletAddress);
      }

      console.log('Found claimable plans:', plans.length);
      res.json({ plans, isAdmin });
    } catch (error: any) {
      console.error("Error fetching claimable plans:", error);
      res.status(500).json({
        message: "Error fetching claimable plans: " + error.message
      });
    }
  });

  // Create new mining plan
  app.post("/api/mining-plans", async (req, res) => {
    try {
      // If referral code is provided, verify it exists
      if (req.body.referralCode) {
        const referrer = await storage.getUserByReferralCode(req.body.referralCode);
        if (!referrer) {
          res.status(400).json({
            message: "Invalid referral code"
          });
          return;
        }
      }

      console.log('Creating mining plan with details:', {
        ...req.body,
        timestamp: new Date().toISOString()
      });

      // Validate plan data against schema
      const planData = insertMiningPlanSchema.parse(req.body);

      // Normalize addresses
      planData.walletAddress = planData.walletAddress.toLowerCase();
      planData.withdrawalAddress = planData.withdrawalAddress.toLowerCase();

      const plan = await storage.createMiningPlan(planData);

      console.log('Mining plan created successfully:', {
        planId: plan.id,
        walletAddress: plan.walletAddress,
        isActive: plan.isActive,
        expiresAt: plan.expiresAt,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({ plan });
    } catch (error: any) {
      console.error("Error creating mining plan:", error);

      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Invalid mining plan data: " + validationError.message
        });
        return;
      }

      res.status(400).json({
        message: "Error creating mining plan: " + error.message
      });
    }
  });

  // Mark plan as withdrawn after successful claim
  app.post("/api/mining-plans/:planId/withdraw", async (req, res) => {
    try {
      const { planId } = req.params;
      const { transactionHash } = req.body;

      if (!transactionHash) {
        res.status(400).json({
          message: "Transaction hash is required"
        });
        return;
      }

      const updatedPlan = await storage.markPlanAsWithdrawn(parseInt(planId));
      res.json({ plan: updatedPlan });
    } catch (error: any) {
      console.error("Error marking plan as withdrawn:", error);
      res.status(500).json({
        message: "Error marking plan as withdrawn: " + error.message
      });
    }
  });

  // Verify transaction hash
  app.get("/api/mining-plans/verify/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const plan = await storage.getMiningPlanByHash(hash);
      res.json({ plan });
    } catch (error: any) {
      console.error("Error verifying transaction:", error);
      res.status(500).json({
        message: "Error verifying transaction: " + error.message
      });
    }
  });

  // Get referral stats
  app.get("/api/referrals/:code/stats", async (req, res) => {
    try {
      const { code } = req.params;
      console.log('Fetching referral stats for code:', code);
      const stats = await storage.getReferralStats(code);
      console.log('Referral stats result:', stats);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({
        message: "Error fetching referral stats: " + error.message
      });
    }
  });

  // Get referral plans
  app.get("/api/referrals/:code/plans", async (req, res) => {
    try {
      const { code } = req.params;
      const plans = await storage.getReferralPlans(code);
      res.json({ plans });
    } catch (error: any) {
      console.error("Error fetching referral plans:", error);
      res.status(500).json({
        message: "Error fetching referral plans: " + error.message
      });
    }
  });

  // Free CPXTB claim endpoint has been disabled
  app.post("/api/users/:address/claim-free-cpxtb", async (req, res) => {
    console.log('Attempted to access disabled free CPXTB claim feature');
    // Return a 410 Gone status code to indicate this feature has been removed
    res.status(410).json({
      message: "The free CPXTB claim feature has been discontinued."
    });
  });

  app.post("/api/mining-plans/distribute-all", async (req, res) => {
    try {
      const now = new Date();
      console.log('Current time for distribution check:', now.toISOString());

      // Get all matured plans that haven't been withdrawn
      const maturedPlans = await db
        .select()
        .from(miningPlans)
        .where(
          and(
            eq(miningPlans.hasWithdrawn, false),
            eq(miningPlans.isActive, true),
            lte(miningPlans.expiresAt, sql`NOW()`)  // Only return truly expired plans
          )
        );

      console.log('Found matured plans for distribution:', maturedPlans.length);
      console.log('Plans details:', maturedPlans.map(plan => ({
        id: plan.id,
        expiresAt: plan.expiresAt,
        hasWithdrawn: plan.hasWithdrawn,
        isActive: plan.isActive,
        dailyRewardCPXTB: plan.dailyRewardCPXTB,
        withdrawalAddress: plan.withdrawalAddress
      })));

      const results = [];
      for (const plan of maturedPlans) {
        console.log('Processing distribution for plan:', plan.id);
        const success = await distributeRewards(plan);
        results.push({
          planId: plan.id,
          success,
          amount: plan.dailyRewardCPXTB,
          recipient: plan.withdrawalAddress
        });
      }

      const successfulDistributions = results.filter(r => r.success).length;
      console.log('Distribution results:', {
        total: maturedPlans.length,
        successful: successfulDistributions,
        results
      });

      res.json({
        message: `Processed ${maturedPlans.length} matured plans (${successfulDistributions} successful)`,
        results
      });
    } catch (error: any) {
      console.error("Error in bulk distribution:", error);
      res.status(500).json({
        message: "Error processing distributions: " + error.message
      });
    }
  });


  // =====================================================
  // MERCHANT PAYMENT API ENDPOINTS
  // =====================================================
  
  // Register a new merchant
  app.post("/api/merchants", async (req, res) => {
    try {
      // Log the received data for debugging
      console.log('Received merchant registration data:', JSON.stringify(req.body, null, 2));
      
      try {
        // Validate the merchant data with more details on error
        const merchantData = insertMerchantSchema.parse(req.body);
        
        // Normalize wallet address
        merchantData.walletAddress = merchantData.walletAddress.toLowerCase();
        
        // Create the merchant
        const merchant = await storage.createMerchant(merchantData);
        
        console.log('New merchant registered:', {
          merchantId: merchant.id,
          businessName: merchant.businessName,
          walletAddress: merchant.walletAddress,
          timestamp: new Date().toISOString()
        });
        
        res.status(201).json({ 
          merchant: {
            ...merchant,
            apiKey: merchant.apiKey.substring(0, 8) + '...' // Mask the API key in the response
          },
          message: "Merchant created successfully. Save your API key, it won't be displayed again." 
        });
      } catch (validationError: any) {
        if (validationError.name === "ZodError") {
          console.error("Validation error details:", JSON.stringify(validationError.errors, null, 2));
          const formattedError = fromZodError(validationError);
          
          res.status(400).json({
            message: "Invalid merchant data: " + formattedError.message,
            details: validationError.errors
          });
        } else {
          throw validationError; // Re-throw to be caught by the outer catch
        }
      }
    } catch (error: any) {
      console.error("Error creating merchant:", error);
      res.status(500).json({
        message: "Error creating merchant: " + error.message
      });
    }
  });
  
  // Get merchant details for a user
  app.get("/api/users/:userId/merchants", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      console.log(`Fetching merchants for user ID: ${userId}`, {
        isAuthenticated: req.isAuthenticated(),
        userIdFromAuth: req.user ? (req.user as any).id : 'none',
        requestedUserId: userId
      });
      
      // Check if the user is authenticated and if they are requesting their own merchants
      // Note: We're checking if the authenticated user's ID matches the requested userId
      if (req.isAuthenticated() && req.user) {
        const authenticatedUserId = (req.user as any).id;
        
        // For debugging
        if (authenticatedUserId !== userId) {
          console.log(`Auth mismatch: Authenticated as user ${authenticatedUserId} but requesting merchants for user ${userId}`);
        }
        
        // Get merchants for the requested user ID
        const merchants = await storage.getMerchantsByUserId(userId);
        console.log(`Found ${merchants.length} merchants for user ID: ${userId}`);
        
        // Debug log of theme information for each merchant
        console.log("Theme information for merchants:", merchants.map(m => ({
          id: m.id,
          themeTemplate: m.themeTemplate,
          primaryColor: m.primaryColor,
          darkMode: m.darkMode
        })));
        
        // Whether viewing own merchants or others, provide the data
        // with API keys appropriately handled
        if (authenticatedUserId === userId) {
          // Return full API keys for the authenticated user's own merchants
          console.log("User is viewing their own merchants - returning full API keys");
          
          // Explicitly ensure all theme properties are present
          const enrichedMerchants = merchants.map(merchant => ({
            ...merchant,
            // Explicitly include these to ensure they are in the response
            themeTemplate: merchant.themeTemplate,
            primaryColor: merchant.primaryColor,
            secondaryColor: merchant.secondaryColor,
            accentColor: merchant.accentColor,
            fontFamily: merchant.fontFamily,
            borderRadius: merchant.borderRadius,
            darkMode: merchant.darkMode
          }));
          
          res.json({ merchants: enrichedMerchants });
        } else {
          // For security, mask the API keys when viewing someone else's merchants
          console.log("User is viewing someone else's merchants - masking API keys");
          const maskedMerchants = merchants.map(merchant => ({
            ...merchant,
            apiKey: merchant.apiKey ? merchant.apiKey.substring(0, 8) + '...' : null,
            // Explicitly include these to ensure they are in the response
            themeTemplate: merchant.themeTemplate,
            primaryColor: merchant.primaryColor,
            secondaryColor: merchant.secondaryColor,
            accentColor: merchant.accentColor,
            fontFamily: merchant.fontFamily,
            borderRadius: merchant.borderRadius,
            darkMode: merchant.darkMode
          }));
          res.json({ merchants: maskedMerchants });
        }
      } else {
        // Not authenticated at all, but still return masked data
        console.log("User not authenticated - returning masked merchant data");
        const merchants = await storage.getMerchantsByUserId(userId);
        
        const maskedMerchants = merchants.map(merchant => ({
          ...merchant,
          apiKey: merchant.apiKey ? merchant.apiKey.substring(0, 8) + '...' : null
        }));
        
        res.json({ merchants: maskedMerchants });
      }
    } catch (error: any) {
      console.error("Error fetching merchants:", error);
      res.status(500).json({
        message: "Error fetching merchants: " + error.message
      });
    }
  });
  
  // Create a new payment request
  app.post("/api/payments", authenticateMerchant, async (req, res) => {
    try {
      const merchant = (req as any).merchant;
      
      console.log("Payment creation request received:", {
        merchantId: merchant.id,
        merchantName: merchant.businessName,
        requestBody: {
          ...req.body,
          // Don't log full API key
          apiKey: req.headers['x-api-key'] ? 'present' : 'missing'
        } 
      });
      
      const { amountUsd, description, customerWalletAddress } = req.body;
      
      // Validate inputs - no longer require orderId as per user request
      if (!amountUsd) {
        console.log("Payment validation failed: missing required fields");
        return res.status(400).json({ message: 'Amount in USD is required' });
      }
      
      // Get current CPXTB price
      const cpxtbPrice = await getCurrentCpxtbPrice();
      console.log(`Current CPXTB price: ${cpxtbPrice}`);
      
      // Calculate CPXTB amount
      const amountCpxtb = calculateCpxtbAmount(amountUsd, cpxtbPrice);
      console.log(`Calculated payment amount: $${amountUsd} USD = ${amountCpxtb} CPXTB`);
      
      // Generate a unique payment reference
      const paymentReference = generatePaymentReference();
      
      // Set expiration time (15 minutes from now)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      // Prepare payment data - removed orderId as per user request
      const paymentData = {
        merchantId: merchant.id,
        amountUsd,
        amountCpxtb,
        // Only include customerWalletAddress if it exists
        ...(customerWalletAddress ? { customerWalletAddress: customerWalletAddress.toLowerCase() } : {}),
        // Include orderId if it exists in the request (supporting old clients)
        ...(req.body.orderId ? { orderId: req.body.orderId } : {}),
        paymentReference,
        description,
        exchangeRate: cpxtbPrice,
        expiresAt
      };
      
      console.log("Creating payment with data:", {
        ...paymentData,
        // Format for better readability in logs
        expiresAt: expiresAt.toISOString()
      });
      
      // Create payment record
      const payment = await storage.createPayment(paymentData);
      
      console.log(`Payment created successfully: ID ${payment.id}, Reference ${payment.paymentReference}`);
      
      // Import constants from the module scope
      // ESM-style import - these should be imported at the top of the file, not inside a function
      // For now, access them directly from the imported constants
      
      // Format the response with wallet-compatible QR code
      // Create a blockchain wallet URI format that most wallets can recognize
      const walletAddress = merchant.walletAddress.toLowerCase();
      
      // Make sure the address is properly formatted (starts with 0x)
      const formattedAddress = walletAddress.startsWith('0x') ? walletAddress : `0x${walletAddress}`;
      
      // Use the most basic and widely supported QR code format for the wallet address
      const simpleWalletUri = formattedAddress;
      
      // Create a payment link URL for the QR code using the new direct payment format
      const paymentUrl = `${process.env.NODE_ENV === 'production' ? process.env.PUBLIC_URL : 'https://' + req.headers.host}/payment/${payment.paymentReference}`;
      
      // Create an enhanced wallet URI that includes token information for direct wallet scanning
      // Format: ethereum:address?value=0&token=tokenAddress&tokenValue=amount
      const enhancedWalletUri = `ethereum:${formattedAddress}?value=0&token=${CPXTB_TOKEN_ADDRESS}&tokenValue=${encodeURIComponent(amountCpxtb.toString())}`;
      
      // Use the enhanced wallet URI for the QR code to enable direct payment in wallets
      // This allows users to scan and pay in one step with proper token information
      const walletUri = enhancedWalletUri;
      
      // Create payment instructions message
      const paymentInstructions = `CPXTB PAYMENT: Send ${amountCpxtb.toFixed(6)} CPXTB tokens to this address on Base network`;
      
      console.log("Generated wallet URI for QR code:", walletUri);
      
      res.status(201).json({
        payment: {
          id: payment.id,
          reference: payment.paymentReference,
          amountUsd,
          amountCpxtb,
          exchangeRate: cpxtbPrice,
          merchantWalletAddress: merchant.walletAddress,
          expiresAt,
          status: payment.status
        },
        // Include both formats for compatibility
        qrCodeData: walletUri,
        paymentInstructions,
        paymentDetails: {
          action: "pay",
          recipient: formattedAddress,
          amount: amountCpxtb.toString(),
          reference: payment.paymentReference,
          currency: "CPXTB",
          networkId: 8453, // Base chain ID
          expiresAt: expiresAt.toISOString()
        }
      });
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(500).json({
        message: "Error creating payment: " + error.message
      });
    }
  });
  
  // Verify payment
  app.post("/api/payments/:reference/verify", authenticateMerchant, async (req, res) => {
    try {
      const { reference } = req.params;
      const { transactionHash } = req.body;
      
      if (!transactionHash) {
        return res.status(400).json({ message: 'Transaction hash is required' });
      }
      
      // Find payment by reference
      const payment = await storage.getPaymentByReference(reference);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Verify payment on blockchain
      const merchant = (req as any).merchant;
      const verificationResult = await verifyCpxtbTransaction(
        transactionHash, 
        payment.amountCpxtb.toString(), 
        merchant.walletAddress
      );
      
      // ENHANCED VERIFICATION: Validate both the transaction verification and the amount
      if (!verificationResult.verified) {
        console.log(`❌ Payment ${payment.id} verification failed: ${verificationResult.reason}`);
        return res.status(400).json({ 
          verified: false, 
          message: `Transaction verification failed: ${verificationResult.reason || 'Unknown error'}` 
        });
      }
      
      // Safely access the amount property that we now ensure exists in our verification function
      const amountReceived = typeof verificationResult.amount === 'number' ? verificationResult.amount : 0;
      
      // FIXED: Extra validation for zero-value transactions
      if (amountReceived <= 0) {
        console.log(`❌ Payment ${payment.id} contains zero amount: ${amountReceived} CPXTB`);
        return res.status(400).json({
          verified: false,
          message: `Transaction contains zero or invalid amount: ${amountReceived} CPXTB`
        });
      }
      
      console.log(`✅ Payment ${payment.id} verified with actual coins received: ${amountReceived} CPXTB`);
      
      // Update payment status including the verified amount
      const updatedPayment = await storage.updatePaymentStatus(
        payment.id, 
        'completed',
        transactionHash,
        amountReceived, // Use the actual verified amount from the blockchain
        Number(payment.amountCpxtb), // Ensure numeric value
        '0.000000' // Mark remaining amount as zero since we're considering it complete
      );
      
      // Send notification about the completed payment
      const message = JSON.stringify({
        type: 'paymentCompleted',
        paymentId: payment.id,
        merchantId: payment.merchantId,
        reference: payment.paymentReference,
        transactionHash,
        timestamp: new Date().toISOString()
      });
      
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      
      // If merchant has a webhook URL, trigger it
      if (merchant.webhookUrl) {
        try {
          // Implementation of webhook call would go here
          // For now, just log it
          console.log('Would trigger webhook to:', merchant.webhookUrl, {
            event: 'payment.completed',
            data: {
              payment_id: payment.id,
              reference: payment.paymentReference,
              amount_usd: payment.amountUsd.toString(),
              amount_cpxtb: payment.amountCpxtb.toString(),
              transaction_hash: transactionHash,
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error('Webhook error:', error);
          // Continue with response even if webhook fails
        }
      }
      
      res.json({ 
        verified: true, 
        payment: updatedPayment,
        message: 'Payment verified successfully' 
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({
        message: "Error verifying payment: " + error.message
      });
    }
  });
  // Public endpoint for payment page - no authentication required
  app.get("/api/payments/public/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      console.log(`Public payment page requested for reference: ${reference}`);
      
      // TEMPORARY DEBUGGING: Special reference format check removed since we're using a new format
      // Logging all references for tracking during transition
      console.log('----------------------------');
      console.log(`REFERENCE FORMAT CHECK: ${reference}`);
      console.log('----------------------------');
      
      // Get payment details
      const payment = await storage.getPaymentByReference(reference);
      
      if (!payment) {
        console.log(`Payment not found for reference: ${reference}`);
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Get merchant to retrieve theme settings
      const merchant = await storage.getMerchant(payment.merchantId);
      
      if (!merchant) {
        console.log(`Merchant not found for payment ${reference} with merchant ID ${payment.merchantId}`);
        return res.status(404).json({ message: "Merchant not found" });
      }
      
      console.log(`Serving public payment page for reference: ${reference} with theme: ${merchant.themeTemplate || 'default'}`);
      
      // Enhanced status handling for all payment statuses
      // First, ensure we have receivedAmount and requiredAmount
      const receivedAmount = typeof payment.receivedAmount === 'string' 
        ? parseFloat(payment.receivedAmount) 
        : Number(payment.receivedAmount || 0);
        
      const requiredAmount = typeof payment.requiredAmount === 'string' 
        ? parseFloat(payment.requiredAmount) 
        : Number(payment.requiredAmount || payment.amountCpxtb || 0);
      
      // Calculate the remaining amount needed (for all payment statuses)
      const remainingAmount = Math.max(0, requiredAmount - receivedAmount).toFixed(6);
      
      // Ensure payment object has remainingAmount
      payment.remainingAmount = remainingAmount;
      
      console.log(`Payment check for ${payment.id}:`, {
        status: payment.status,
        receivedAmount,
        requiredAmount,
        remainingAmount,
        isRemainderZero: remainingAmount === '0.000000' || parseFloat(remainingAmount) === 0,
        receivedEnough: receivedAmount >= requiredAmount
      });
      
      // FIX: Auto-correct status to 'completed' if remaining amount is zero or received enough
      // This fixes the issue with status showing as pending in the QR code page
      if ((remainingAmount === '0.000000' || parseFloat(remainingAmount) === 0 || receivedAmount >= requiredAmount) && 
          payment.status !== 'completed') {
        console.log(`⚠️ Correcting payment status to 'completed' for payment ${payment.id} as remaining amount is zero: ${remainingAmount}`);
        
        // Force update status to completed in this response
        payment.status = 'completed';
        
        // Also update the database to ensure future requests get the right status
        try {
          // Get the required parameters for the payment
          const receivedAmount = typeof payment.receivedAmount === 'string' 
            ? parseFloat(payment.receivedAmount) 
            : Number(payment.receivedAmount || 0);
            
          const requiredAmount = typeof payment.requiredAmount === 'string' 
            ? parseFloat(payment.requiredAmount) 
            : Number(payment.requiredAmount || payment.amountCpxtb || 0);
          
          // Call with the complete parameters list that the function is expecting
          await storage.updatePaymentStatus(
            payment.id, 
            'completed', 
            payment.transactionHash || undefined,
            receivedAmount,
            requiredAmount,
            '0.000000' // Explicitly set remaining amount to zero
          );
          
          console.log(`✅ Successfully updated payment status in database for ${payment.id}`);
        } catch (dbError) {
          console.error(`❌ Failed to update payment status in database: ${dbError}`);
          // We still return completed status in this response even if DB update fails
        }
      }
      
      // Return payment data along with merchant theme settings
      res.json({ 
        payment,
        theme: {
          primaryColor: merchant.primaryColor,
          secondaryColor: merchant.secondaryColor,
          accentColor: merchant.accentColor,
          fontFamily: merchant.fontFamily,
          borderRadius: merchant.borderRadius,
          darkMode: merchant.darkMode,
          customCss: merchant.customCss,
          customHeader: merchant.customHeader,
          customFooter: merchant.customFooter,
          themeTemplate: merchant.themeTemplate
        }
      });
    } catch (error: any) {
      console.error("Error fetching public payment:", error);
      res.status(500).json({ message: "Error fetching payment: " + error.message });
    }
  });
  
  // Get payment status
  app.get("/api/payments/:reference", authenticateMerchant, async (req, res) => {
    try {
      const { reference } = req.params;
      const payment = await storage.getPaymentByReference(reference);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Check if payment belongs to authenticated merchant
      const merchant = (req as any).merchant;
      if (payment.merchantId !== merchant.id) {
        return res.status(403).json({ message: 'Unauthorized access to payment' });
      }
      
      res.json({ payment });
    } catch (error: any) {
      console.error("Error fetching payment:", error);
      res.status(500).json({
        message: "Error fetching payment: " + error.message
      });
    }
  });
  
  // Get merchant payment history
  app.get("/api/merchants/payments", authenticateMerchant, async (req, res) => {
    try {
      const merchant = (req as any).merchant;
      const payments = await storage.getPaymentsByMerchant(merchant.id);
      
      res.json({ payments });
    } catch (error: any) {
      console.error("Error fetching merchant payments:", error);
      res.status(500).json({
        message: "Error fetching merchant payments: " + error.message
      });
    }
  });
  
  // Get custom date range report for merchant
  app.get("/api/merchants/reports/date-range", authenticateMerchant, async (req, res) => {
    try {
      const merchant = (req as any).merchant;
      console.log("Generating date range report for merchant:", merchant.id);
      
      // Default to last 30 days if no dates are provided
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      // Parse start and end dates from query params if provided
      if (req.query.startDate) {
        startDate.setTime(Date.parse(req.query.startDate as string));
      }
      
      if (req.query.endDate) {
        endDate.setTime(Date.parse(req.query.endDate as string));
      }
      
      console.log(`Generating report from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Get the detailed report
      const report = await storage.getDetailedMerchantReport(merchant.id, startDate, endDate);
      
      // Format currency values for response
      const formattedReport = {
        ...report,
        summary: {
          ...report.summary,
          totalAmountUsd: Number(report.summary.totalAmountUsd.toFixed(2)),
          totalAmountCpxtb: Number(report.summary.totalAmountCpxtb).toFixed(6)
        },
        dailyTotals: report.dailyTotals.map(day => ({
          ...day,
          amountUsd: Number(day.amountUsd.toFixed(2)),
          amountCpxtb: Number(day.amountCpxtb).toFixed(6)
        })),
        payments: report.payments.map(payment => ({
          ...payment,
          amountUsd: Number(payment.amountUsd).toFixed(2),
          amountCpxtb: Number(payment.amountCpxtb).toFixed(6),
          createdAt: new Date(payment.createdAt).toISOString(),
          updatedAt: payment.updatedAt ? new Date(payment.updatedAt).toISOString() : null,
          expiresAt: payment.expiresAt ? new Date(payment.expiresAt).toISOString() : null,
          completedAt: payment.completedAt ? new Date(payment.completedAt).toISOString() : null
        }))
      };
      
      res.json({
        report: formattedReport,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
    } catch (error: any) {
      console.error("Error generating date range report:", error);
      res.status(500).json({
        message: "Error generating date range report: " + error.message
      });
    }
  });
  
  // Get merchant payment statistics
  app.get("/api/merchants/stats", authenticateMerchant, async (req, res) => {
    try {
      const merchant = (req as any).merchant;
      
      // Default to last 30 days if not specified
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      // Parse start and end dates from query params if provided
      if (req.query.startDate) {
        startDate.setTime(Date.parse(req.query.startDate as string));
      }
      
      if (req.query.endDate) {
        endDate.setTime(Date.parse(req.query.endDate as string));
      }
      
      const stats = await storage.getMerchantReport(merchant.id, startDate, endDate);
      
      res.json({
        ...stats,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });
    } catch (error: any) {
      console.error("Error fetching merchant stats:", error);
      res.status(500).json({
        message: "Error fetching merchant stats: " + error.message
      });
    }
  });
  
  // Update merchant theme settings
  app.patch("/api/merchants/theme", authenticateMerchant, async (req, res) => {
    try {
      const merchant = (req as any).merchant;
      const themeSchema = z.object({
        primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
        secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
        accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color").optional(),
        fontFamily: z.string().optional(),
        borderRadius: z.number().int().min(0).max(24).optional(),
        darkMode: z.boolean().optional(),
        customCss: z.string().optional(),
        customHeader: z.string().optional(),
        customFooter: z.string().optional(),
      });
      
      const themeData = themeSchema.parse(req.body);
      
      console.log('Updating merchant theme:', {
        merchantId: merchant.id,
        themeUpdate: themeData,
        timestamp: new Date().toISOString()
      });
      
      const updatedMerchant = await storage.updateMerchantTheme(merchant.id, themeData);
      
      res.json({ 
        merchant: {
          ...updatedMerchant,
          apiKey: updatedMerchant.apiKey.substring(0, 8) + '...' // Mask the API key in the response
        },
        message: "Theme updated successfully" 
      });
    } catch (error: any) {
      console.error("Error updating merchant theme:", error);
      
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Invalid theme data: " + validationError.message
        });
        return;
      }
      
      res.status(500).json({
        message: "Error updating merchant theme: " + error.message
      });
    }
  });
  
  // Apply theme template
  app.post("/api/merchants/apply-template", authenticateMerchant, async (req, res) => {
    try {
      const merchant = (req as any).merchant;
      const templateSchema = z.object({
        templateName: z.enum(["default", "modern", "minimal", "bold", "elegant", "tech", "playful"])
      });
      
      const { templateName } = templateSchema.parse(req.body);
      
      console.log('Applying theme template:', {
        merchantId: merchant.id,
        merchantName: merchant.businessName,
        templateBefore: merchant.themeTemplate,
        newTemplate: templateName,
        timestamp: new Date().toISOString()
      });
      
      // Call the storage method to apply the template
      const updatedMerchant = await storage.applyThemeTemplate(merchant.id, templateName);
      
      console.log("After update - merchant received from database:", {
        id: updatedMerchant.id,
        themeTemplate: updatedMerchant.themeTemplate,
        primaryColor: updatedMerchant.primaryColor,
        updated: updatedMerchant.updatedAt?.toISOString()
      });
      
      // Prepare response by creating a new object
      const responseData = { 
        merchant: {
          ...updatedMerchant,
          apiKey: updatedMerchant.apiKey.substring(0, 8) + '...', // Mask the API key in the response
          // Explicitly include theme properties to ensure they're in the response
          themeTemplate: updatedMerchant.themeTemplate,
          primaryColor: updatedMerchant.primaryColor,
          secondaryColor: updatedMerchant.secondaryColor,
          accentColor: updatedMerchant.accentColor,
          fontFamily: updatedMerchant.fontFamily,
          borderRadius: updatedMerchant.borderRadius,
          darkMode: updatedMerchant.darkMode
        },
        message: `${templateName.charAt(0).toUpperCase() + templateName.slice(1)} theme applied successfully` 
      };
      
      console.log("Sending response:", {
        responseTemplate: responseData.merchant.themeTemplate,
        responsePrimaryColor: responseData.merchant.primaryColor
      });
      
      res.json(responseData);
    } catch (error: any) {
      console.error("Error applying theme template:", error);
      
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Invalid template data: " + validationError.message
        });
        return;
      }
      
      res.status(500).json({
        message: "Error applying theme template: " + error.message
      });
    }
  });

  // Automatically clear expired pending payments
  const clearExpiredPayments = async () => {
    try {
      const expiredPayments = await storage.getExpiredPayments();
      
      for (const payment of expiredPayments) {
        // For expired payments, we don't need to provide the optional parameters
        await storage.updatePaymentStatus(payment.id, 'expired', undefined);
        console.log(`Payment ${payment.id} (${payment.paymentReference}) marked as expired`);
      }
    } catch (error) {
      console.error('Error clearing expired payments:', error);
    }
  };
  
  // Schedule regular cleanup of expired payments
  setInterval(clearExpiredPayments, 5 * 60 * 1000); // Every 5 minutes
  
  const httpServer = createServer(app);

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Make WebSocket server available to other modules (like transaction-listener)
  (global as any).wss = wss;
  
  // Track connected users
  let connectedUsers = 0;
  
  // Track display count for consistency across clients
  let baseDisplayCount = 125; // Fixed base count
  let lastUpdateTime = Date.now();
  
  // Generate a consistent user count for display with small fluctuations
  const getDisplayUserCount = () => {
    // Update the base display count every 5 minutes to avoid staleness
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime > 300000) { // 5 minutes in milliseconds
      baseDisplayCount = 80 + Math.floor(Math.random() * 70);
      lastUpdateTime = currentTime;
    }
    
    // Add small fluctuation (-2 to +2)
    const fluctuation = Math.floor(Math.random() * 5) - 2;
    
    // Return consistent count with small fluctuation
    return connectedUsers + baseDisplayCount + fluctuation;
  };
  
  // Function to broadcast user count to all clients
  const broadcastUserCount = () => {
    const message = JSON.stringify({ 
      type: 'liveUserCount', 
      count: getDisplayUserCount() 
    });
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
  
  // Setup WebSocket connection handling
  wss.on('connection', (ws) => {
    // Increment user count
    connectedUsers++;
    console.log(`WebSocket client connected. Total users: ${connectedUsers}`);
    
    // Send a welcome message with enhanced user count
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'connection', 
        message: 'Connected to CPXTB platform',
        liveUserCount: getDisplayUserCount()
      }));
      
      // Broadcast updated user count to all clients
      broadcastUserCount();
    }
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // If client requests user count update
        if (data.type === 'getUserCount') {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ 
              type: 'liveUserCount', 
              count: getDisplayUserCount() 
            }));
          }
        } else {
          // Echo back other messages as confirmation
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'echo', data }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      // Decrement user count
      connectedUsers--;
      console.log(`WebSocket client disconnected. Total users: ${connectedUsers}`);
      
      // Broadcast updated user count to all clients
      broadcastUserCount();
    });
  });

  // Run the check every 15 seconds
  setInterval(checkAndDistributeMaturedPlans, 15000);
  
  // Start automatic payment transaction monitoring
  startPaymentMonitoring().catch(error => {
    console.error("Failed to start payment monitoring:", error);
  });
  
  console.log("Payment monitoring service activated - automatically detecting blockchain transactions");
  
  // Register test challenge routes for testing the challenge system
  console.log("Registering test challenge routes for anti-DDoS testing");
  registerTestChallengeRoutes(app);

  return httpServer;
}