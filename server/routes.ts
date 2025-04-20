import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMiningPlanSchema, miningPlans, users } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { eq, gte, and, sql, lte } from "drizzle-orm";
import { db } from "./db";
import { TREASURY_ADDRESS } from "./constants";
import { WebSocketServer, WebSocket } from "ws";
import { createPublicClient, http, parseAbi } from "viem";
import { base } from "wagmi/chains";
import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";

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

  // Update the free CPXTB claim endpoint with proper user creation
  app.post("/api/users/:address/claim-free-cpxtb", async (req, res) => {
    try {
      const { address } = req.params;
      const { withdrawalAddress } = req.body;
      const normalizedAddress = address.toLowerCase();

      // Get real IP from x-forwarded-for header
      const clientIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip;

      console.log('Processing free CPXTB claim:', {
        userAddress: normalizedAddress,
        withdrawalAddress,
        clientIp,
        timestamp: new Date().toISOString()
      });

      if (!withdrawalAddress) {
        res.status(400).json({
          message: "Withdrawal address is required"
        });
        return;
      }

      // Ensure we have a valid IP address to track
      if (!clientIp) {
        console.error('Could not determine client IP address');
        res.status(500).json({
          message: "Server error: Could not validate your request"
        });
        return;
      }

      // Use a transaction to ensure atomic updates
      await db.transaction(async (tx) => {
        // Check if any user has claimed from this IP in the last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find any user who has claimed from this IP address in the last 24 hours
        const [recentClaim] = await tx
          .select()
          .from(users)
          .where(
            and(
              eq(users.lastClaimIp, clientIp),
              gte(users.ipClaimTime, oneDayAgo)
            )
          )
          .for('update');  // Lock the rows for update to prevent race conditions

        if (recentClaim) {
          const nextAvailableTime = new Date(recentClaim.ipClaimTime!);
          nextAvailableTime.setHours(nextAvailableTime.getHours() + 24);
          const now = new Date();
          const diffMs = nextAvailableTime.getTime() - now.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

          console.error('Claim failed: IP cooldown active', {
            ip: clientIp,
            lastClaim: recentClaim.ipClaimTime,
            nextAvailable: nextAvailableTime,
            hoursRemaining: hours,
            minutesRemaining: minutes,
            attemptedByUser: normalizedAddress,
            claimedByUser: recentClaim.username
          });

          throw new Error(`This IP address has already claimed within 24 hours. Please wait ${hours}h ${minutes}m before claiming again.`);
        }

        // Try to get existing user or create new one
        let user = await tx
          .select()
          .from(users)
          .where(eq(users.username, normalizedAddress))
          .for('update')
          .then(rows => rows[0]);

        if (!user) {
          console.log('Creating new user for address:', normalizedAddress);
          // Create new user
          [user] = await tx
            .insert(users)
            .values({
              username: normalizedAddress,
              password: 'not-used', // OAuth-based auth
              referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              lastCPXTBClaimTime: new Date(),
              ipClaimTime: new Date(),
              lastClaimIp: clientIp
            })
            .returning();

          console.log('New user created:', user);
        } else {
          // Update existing user's claim time and IP
          await tx
            .update(users)
            .set({
              lastCPXTBClaimTime: new Date(),
              ipClaimTime: new Date(),
              lastClaimIp: clientIp
            })
            .where(eq(users.username, normalizedAddress));
        }

        // Create a special mining plan for the free CPXTB within the transaction
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes

        const plan = await tx
          .insert(miningPlans)
          .values({
            walletAddress: normalizedAddress,
            withdrawalAddress: withdrawalAddress.toLowerCase(),
            planType: "bronze", // Use bronze as the base plan type
            amount: "0", // Free plan
            dailyRewardCPXTB: "10", // 10 CPXTB
            activatedAt: now,
            expiresAt: expiresAt,
            transactionHash: 'FREE_CPXTB_CLAIM',
            referralCode: null,
            isActive: true,
            hasWithdrawn: false,
            referralRewardPaid: false,
            createdAt: now
          })
          .returning()
          .then(rows => rows[0]);

        console.log('Created free CPXTB claim plan:', {
          planId: plan.id,
          walletAddress: normalizedAddress,
          expiresAt: expiresAt.toISOString(),
          now: now.toISOString(),
          clientIp
        });

        // Return updated user and plan info
        res.json({
          user: await tx
            .select()
            .from(users)
            .where(eq(users.username, normalizedAddress))
            .then(rows => rows[0]),
          plan
        });
      });

    } catch (error) {
      console.error("Error claiming free CPXTB:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Error claiming free CPXTB"
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


  const httpServer = createServer(app);

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
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

  return httpServer;
}