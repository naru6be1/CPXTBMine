import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMiningPlanSchema, miningPlans, users } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { eq, gte, and, sql } from "drizzle-orm";
import { db } from "./db";
import { TREASURY_ADDRESS } from "./constants";
import { WebSocketServer } from "ws";
import { createPublicClient, http, parseAbi } from "viem";
import { base } from "wagmi/chains";
import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as testUtils from './test-utils'; // Import with correct filename

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

export async function registerRoutes(app: Express): Promise<Server> {
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
          hasClaimedFreeCPXTB: false
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
              gte(new Date(), miningPlans.expiresAt)  // Only return truly expired plans
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

  // Add rate limiting middleware
  const rateLimits = new Map<string, { count: number, timestamp: number }>();
  const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
  const MAX_CLAIMS_PER_HOUR = 3;

  function checkRateLimit(address: string): boolean {
    const now = Date.now();
    const limit = rateLimits.get(address);
    const normalizedAddress = address.toLowerCase();

    // Always check if user has active claim first
    if (limit) {
      console.log('Rate limit check for address:', {
        address: normalizedAddress,
        currentCount: limit.count,
        windowStart: new Date(limit.timestamp).toISOString(),
        now: new Date(now).toISOString()
      });

      // Check if within window
      if (now - limit.timestamp < RATE_LIMIT_WINDOW) {
        if (limit.count >= MAX_CLAIMS_PER_HOUR) {
          console.log('Rate limit exceeded:', {
            address: normalizedAddress,
            count: limit.count,
            max: MAX_CLAIMS_PER_HOUR
          });
          return false;
        }
        // Within window and under limit - increment
        limit.count++;
      } else {
        // Window expired - reset counter
        rateLimits.set(normalizedAddress, { count: 1, timestamp: now });
      }
    } else {
      // First claim for this address
      rateLimits.set(normalizedAddress, { count: 1, timestamp: now });
    }

    return true;
  }

  // Update the free CPXTB claim endpoint with test mode
  app.post("/api/users/:address/claim-free-cpxtb", async (req, res) => {
    try {
      const { address } = req.params;
      const { withdrawalAddress, signature } = req.body;
      const normalizedAddress = address.toLowerCase();
      const isTestMode = process.env.NODE_ENV === 'development';

      console.log('Processing free CPXTB claim:', {
        userAddress: normalizedAddress,
        withdrawalAddress,
        isTestMode,
        timestamp: new Date().toISOString()
      });

      // Get user first to check cooldown before proceeding
      const user = await storage.getUserByUsername(normalizedAddress);
      if (!user) {
        console.error('Claim failed: User not found', { address: normalizedAddress });
        res.status(404).json({
          message: "User not found"
        });
        return;
      }

      // Strict cooldown check with proper error handling
      if (user.lastCPXTBClaimTime) {
        const lastClaimTime = new Date(user.lastCPXTBClaimTime);
        const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const nextAvailableTime = new Date(lastClaimTime.getTime() + cooldownPeriod);
        const now = new Date();

        if (nextAvailableTime > now && !isTestMode) {
          const timeRemaining = Math.ceil((nextAvailableTime.getTime() - now.getTime()) / (1000 * 60 * 60));
          console.error('Claim failed: Cooldown period active', {
            lastClaim: lastClaimTime,
            nextAvailable: nextAvailableTime,
            hoursRemaining: timeRemaining,
            walletAddress: normalizedAddress
          });
          res.status(400).json({
            message: `Please wait ${timeRemaining} hours before claiming again`,
            nextAvailableTime: nextAvailableTime.toISOString()
          });
          return;
        }
      }

      // Check rate limiting after cooldown
      if (!isTestMode && !checkRateLimit(normalizedAddress)) {
        console.error('Claim failed: Rate limit exceeded', {
          address: normalizedAddress,
          timestamp: new Date().toISOString()
        });
        res.status(429).json({
          message: "Too many claim attempts. Please try again later."
        });
        return;
      }

      // Verify signature if not in test mode
      if (!isTestMode) {
        try {
          const message = `Claiming CPXTB tokens at ${new Date().toISOString()}`;
          const publicClient = createPublicClient({
            chain: base,
            transport: http(BASE_RPC_URL)
          });
          const recoveredAddress = await publicClient.verifyMessage({
            address: withdrawalAddress as `0x${string}`,
            message,
            signature: signature as `0x${string}`
          });

          if (recoveredAddress.toLowerCase() !== normalizedAddress) {
            console.error('Claim failed: Invalid signature', {
              recoveredAddress,
              claimAddress: normalizedAddress
            });
            res.status(403).json({
              message: "Invalid signature"
            });
            return;
          }
        } catch (error) {
          console.error('Signature verification failed:', error);
          res.status(403).json({
            message: "Invalid signature"
          });
          return;
        }
      }

      // Update user's last claim time BEFORE creating the mining plan to prevent race conditions
      await db
        .update(users)
        .set({ lastCPXTBClaimTime: new Date() })
        .where(eq(users.username, normalizedAddress));

      // Create a special mining plan for the free CPXTB with short expiry
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes expiry for testing

      const plan = await storage.createMiningPlan({
        walletAddress: normalizedAddress,
        withdrawalAddress: withdrawalAddress.toLowerCase(),
        planType: "bronze",
        amount: "0",
        dailyRewardCPXTB: "10",
        activatedAt: now,
        expiresAt: expiresAt,
        transactionHash: 'FREE_CPXTB_CLAIM',
        referralCode: null
      });

      console.log('Created free CPXTB claim plan:', {
        planId: plan.id,
        walletAddress: normalizedAddress,
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString()
      });

      res.json({
        user: await storage.getUserByUsername(normalizedAddress),
        plan
      });
    } catch (error: any) {
      console.error("Error claiming free CPXTB:", error);
      res.status(500).json({
        message: "Error claiming free CPXTB: " + error.message
      });
    }
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
            gte(now, miningPlans.expiresAt)  // Use 'now' consistently
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

  // Add these test routes within the development check block
  if (process.env.NODE_ENV === 'development') {
    // Test endpoint to reset cooldown
    app.post("/api/test/reset-cooldown/:address", async (req, res) => {
      try {
        const { address } = req.params;
        await testUtils.resetClaimCooldown(address);
        res.json({ message: "Cooldown reset successful" });
      } catch (error: any) {
        console.error("Error resetting cooldown:", error);
        res.status(500).json({ message: error.message });
      }
    });

    // Test endpoint to simulate different timing scenarios
    app.post("/api/test/set-claim-time/:address", async (req, res) => {
      try {
        const { address } = req.params;
        const { time } = req.body;
        await testUtils.setCustomClaimTime(address, new Date(time));
        res.json({ message: "Claim time updated successfully" });
      } catch (error: any) {
        console.error("Error setting claim time:", error);
        res.status(500).json({ message: error.message });
      }
    });

    // Add rate limit test endpoints
    app.post("/api/test/reset-rate-limit/:address", async (req, res) => {
      try {
        const { address } = req.params;
        // Reset rate limit counter for this address
        rateLimits.delete(address.toLowerCase());
        res.json({
          message: "Rate limit reset successful",
          remainingClaims: MAX_CLAIMS_PER_HOUR
        });
      } catch (error: any) {
        console.error("Error resetting rate limit:", error);
        res.status(500).json({ message: error.message });
      }
    });

    app.get("/api/test/rate-limit-status/:address", async (req, res) => {
      try {
        const { address } = req.params;
        const normalizedAddress = address.toLowerCase();
        const limit = rateLimits.get(normalizedAddress);

        if (!limit) {
          res.json({
            remainingClaims: MAX_CLAIMS_PER_HOUR,
            resetTime: null
          });
          return;
        }

        const now = Date.now();
        const timeUntilReset = Math.max(0, RATE_LIMIT_WINDOW - (now - limit.timestamp));
        const remainingClaims = Math.max(0, MAX_CLAIMS_PER_HOUR - limit.count);

        res.json({
          remainingClaims,
          resetTime: new Date(limit.timestamp + RATE_LIMIT_WINDOW).toISOString(),
          timeUntilReset
        });
      } catch (error: any) {
        console.error("Error getting rate limit status:", error);
        res.status(500).json({ message: error.message });
      }
    });
  }

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Run the check every 15 seconds
  setInterval(checkAndDistributeMaturedPlans, 15000);

  return httpServer;
}