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
import { promisify } from "util";

// Password hashing and comparison functions
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}
import { WebSocketServer, WebSocket } from "ws";
import { createPublicClient, http, parseAbi, parseAbiItem, formatUnits } from "viem";
import { base } from "wagmi/chains";
import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { startPaymentMonitoring } from "./transaction-listener";
import { registerTestChallengeRoutes } from "./test-challenge-route";
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import session from 'express-session';

// Add type declarations for session data
declare module 'express-session' {
  interface SessionData {
    redirectUrl?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Google OAuth authentication if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Setting up Google OAuth authentication");
    
    // Configure session middleware
    app.use(session({
      secret: process.env.SESSION_SECRET || 'cpxtb-session-secret',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false } // Set to true if using HTTPS
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    // Configure Google OAuth Strategy
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.REPLIT_DEV_DOMAIN || "http://localhost:3000"}/api/auth/google/callback`,
      scope: ['profile', 'email']
    }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        console.log("Google authentication callback received:", profile.id);
        
        // Generate a deterministic wallet address from Google ID
        const seed = `google-${profile.id}`;
        const hash = crypto.createHash('sha256').update(seed).digest('hex');
        const walletAddress = `0x${hash.substring(0, 40)}`;
        
        // First, try to find the user by external ID
        const existingUser = await db.select().from(users).where(sql`external_id = ${profile.id} AND provider = 'google'`).limit(1);
        
        if (existingUser && existingUser.length > 0) {
          console.log("Found existing user with Google ID:", profile.id);
          
          // Return the existing user
          const user = {
            ...existingUser[0],
            name: profile.displayName,
            email: profile.emails && profile.emails[0] ? profile.emails[0].value : existingUser[0].email,
            walletAddress: walletAddress,
            balance: "10.0",
            provider: 'google'
          };
          return done(null, user);
        }
        
        // User doesn't exist, create a new one with a randomly generated internal ID
        // but store the actual Google ID in the external_id field
        const randomId = Math.floor(Math.random() * 1000000) + 1;
        
        console.log("Creating new user with Google ID:", profile.id);
        
        const newUser = {
          id: randomId,
          username: `google_${randomId}`,
          password: 'oauth-user', // We should never need this for OAuth users
          referralCode: `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : 'no-email@example.com',
          externalId: profile.id,
          provider: 'google',
          name: profile.displayName,
          walletAddress: walletAddress,
          balance: "10.0"
        };
        
        // In a real implementation, we would save this user to the database
        // For now, we just return the user object directly
        return done(null, newUser);
      } catch (error) {
        console.error("Error in Google authentication callback:", error);
        return done(error as Error);
      }
    }));
    
    // Serialize and deserialize user information for sessions
    passport.serializeUser((user: any, done) => {
      // Store the complete user object in the session
      console.log("Serializing user:", user);
      done(null, user);
    });
    
    passport.deserializeUser((user: any, done) => {
      // Since we're storing the complete user object, just return it
      console.log("Deserializing user:", user);
      done(null, user);
    });
    
    // Initial route to start Google authentication
    app.get("/api/social-auth/google", (req, res) => {
      const { enableRealLogin, redirectUrl } = req.query;
      
      // Store redirect URL in session for later use
      if (typeof redirectUrl === 'string') {
        req.session.redirectUrl = redirectUrl;
      } else {
        req.session.redirectUrl = '/';
      }
      
      if (enableRealLogin === 'true' || !req.query.hasOwnProperty('enableRealLogin')) {
        console.log("Redirecting to Google authentication");
        // Redirect to Google authentication
        passport.authenticate('google', { 
          scope: ['profile', 'email'],
          prompt: 'select_account'
        })(req, res);
      } else {
        console.log("Using fallback mock authentication");
        // Use mock data for fallback
        const seed = `google-${Date.now()}`;
        const hash = crypto.createHash('sha256').update(seed).digest('hex');
        const walletAddress = `0x${hash.substring(0, 40)}`;
        
        res.setHeader('Content-Type', 'application/json');
        res.json({
          name: "Google User (Mock)",
          email: "mock.user@example.com",
          walletAddress: walletAddress,
          balance: "10.0"
        });
      }
    });
    
    // Callback route that Google will redirect back to after authentication
    app.get("/api/auth/google/callback", 
      passport.authenticate('google', { failureRedirect: '/login-error' }),
      (req, res) => {
        const redirectUrl = req.session.redirectUrl || '/';
        if (req.user) {
          console.log("Authentication successful, redirecting to:", redirectUrl);
          res.redirect(`${redirectUrl}?loggedIn=true&provider=google`);
        } else {
          console.log("Authentication failed");
          res.redirect('/login-error');
        }
      }
    );
    
    // User data endpoint to get currently logged in user
    app.get("/api/auth/user", (req, res) => {
      if (req.isAuthenticated() && req.user) {
        res.json(req.user);
      } else {
        res.status(401).json({ error: "Not authenticated" });
      }
    });
  } else {
    console.warn("Google OAuth credentials not found, using mock authentication");
    
    // Use mock data if Google credentials are not configured
    app.get("/api/social-auth/google", (req, res) => {
      console.log("Using mock authentication (no Google credentials)");
      const seed = `google-${Date.now()}`;
      const hash = crypto.createHash('sha256').update(seed).digest('hex');
      const walletAddress = `0x${hash.substring(0, 40)}`;
      
      res.setHeader('Content-Type', 'application/json');
      res.json({
        name: "Google User (Mock)",
        email: "mock.user@example.com",
        walletAddress: walletAddress,
        balance: "10.0"
      });
    });
  }
  
  app.get("/api/social-auth/facebook", (req, res) => {
    // Mock Facebook authentication response
    const seed = `facebook-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const walletAddress = `0x${hash.substring(0, 40)}`;
    
    // Explicitly set content type to ensure proper parsing
    res.setHeader('Content-Type', 'application/json');
    
    res.json({
      name: "Facebook User",
      email: "facebook.user@example.com",
      walletAddress: walletAddress,
      balance: "10.0"
    });
  });
  
  app.get("/api/social-auth/twitter", (req, res) => {
    // Mock Twitter authentication response
    const seed = `twitter-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const walletAddress = `0x${hash.substring(0, 40)}`;
    
    // Explicitly set content type to ensure proper parsing
    res.setHeader('Content-Type', 'application/json');
    
    res.json({
      name: "Twitter User",
      email: "twitter.user@example.com",
      walletAddress: walletAddress,
      balance: "10.0"
    });
  });
  
  app.get("/api/social-auth/apple", (req, res) => {
    // Mock Apple authentication response
    const seed = `apple-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const walletAddress = `0x${hash.substring(0, 40)}`;
    
    // Explicitly set content type to ensure proper parsing
    res.setHeader('Content-Type', 'application/json');
    
    res.json({
      name: "Apple User",
      email: "apple.user@example.com",
      walletAddress: walletAddress,
      balance: "10.0"
    });
  });
  
  app.post("/api/social-auth/logout", (req, res) => {
    // Handle proper logout for sessions
    if (req.isAuthenticated()) {
      req.logout((err) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.status(500).json({ success: false, error: "Logout failed" });
        }
        res.status(200).json({ success: true });
      });
    } else {
      // If not authenticated with session, just acknowledge the logout
      res.status(200).json({ success: true });
    }
  });
  
  // Regular username/password authentication
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: "Username and password are required" 
        });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid username or password" 
        });
      }
      
      // Check if the password is hashed (contains a dot separator)
      if (user.password.includes('.')) {
        // This is a hashed password with salt, need to use comparePasswords
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ 
            message: "Invalid username or password" 
          });
        }
      } else {
        // Direct comparison for older accounts or accounts with plaintext passwords
        if (user.password !== password) {
          return res.status(401).json({ 
            message: "Invalid username or password" 
          });
        }
      }
      
      // Set user in session
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ 
            message: "Authentication failed" 
          });
        }
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Authentication failed: " + error.message 
      });
    }
  });
  
  // User registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password, email, referralCode } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: "Username and password are required" 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "Username already exists" 
        });
      }
      
      // Hash the password for security
      const hashedPassword = await hashPassword(password);
      
      // Create new user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        referralCode: referralCode || `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        referredBy: undefined,
        provider: 'local',
        accumulatedCPXTB: 0  // Add required field with initial value
      });
      
      // Log in the new user
      req.login(newUser, (err) => {
        if (err) {
          console.error("Registration login error:", err);
          return res.status(500).json({ 
            message: "User created but login failed" 
          });
        }
        
        // Return user data without password
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        message: "Registration failed: " + error.message 
      });
    }
  });
  
  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });
  
  // Logout endpoint for regular authentication
  app.post("/api/logout", (req, res) => {
    if (req.isAuthenticated()) {
      req.logout((err) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.status(500).json({ success: false, error: "Logout failed" });
        }
        res.status(200).json({ success: true });
      });
    } else {
      // If not authenticated, just acknowledge the logout
      res.status(200).json({ success: true });
    }
  });

  // Create HTTP server and setup WebSocket server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track active connections
  const activeConnections = new Set();
  
  // Function to broadcast user count to all clients
  const broadcastUserCount = () => {
    const userCount = activeConnections.size;
    console.log(`Broadcasting user count: ${userCount}`);
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ 
          type: 'userCount', 
          count: userCount 
        }));
      }
    });
  };
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Add to active connections
    activeConnections.add(ws);
    
    // Broadcast updated user count
    broadcastUserCount();
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Process different message types
        if (data.type === 'subscribe') {
          // Handle subscription requests
          ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
        } else if (data.type === 'getUserCount') {
          // Send user count directly to the requesting client
          ws.send(JSON.stringify({ 
            type: 'userCount', 
            count: activeConnections.size 
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      
      // Remove from active connections
      activeConnections.delete(ws);
      
      // Broadcast updated user count
      broadcastUserCount();
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connected',
      userCount: activeConnections.size
    }));
  });
  
  // Register test challenge routes for rate limiting
  registerTestChallengeRoutes(app);
  
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

  // Get claimable plans
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

  // Merchant endpoints
  app.post("/api/merchants", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = (req.user as any).id;
      
      const merchantData = insertMerchantSchema.parse({
        ...req.body,
        userId,
        apiKey: crypto.randomBytes(16).toString('hex')
      });
      
      const merchant = await storage.createMerchant(merchantData);
      
      res.status(201).json({ merchant });
    } catch (error: any) {
      console.error("Error creating merchant:", error);
      
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Invalid merchant data: " + validationError.message
        });
        return;
      }
      
      res.status(400).json({
        message: "Error creating merchant: " + error.message
      });
    }
  });
  
  // Regular merchants endpoint for the authenticated user
  app.get("/api/merchants", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("User authenticated, user data:", req.user);
      const userId = (req.user as any).id;
      console.log("Fetching merchants for user ID:", userId);
      
      if (!userId) {
        console.error("User ID is undefined or invalid:", userId);
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const merchants = await storage.getMerchantsByUserId(userId);
      console.log("Retrieved merchants:", merchants);
      
      res.json({ merchants });
    } catch (error: any) {
      console.error("Error fetching merchants:", error);
      res.status(500).json({
        message: "Error fetching merchants: " + error.message
      });
    }
  });
  
  // Additional endpoint to get merchants for a specific user
  // This matches the client-side API call pattern
  app.get("/api/users/:userId/merchants", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`Fetching merchants for user ID: ${userId} through /api/users/:userId/merchants endpoint`);
      
      const merchants = await storage.getMerchantsByUserId(parseInt(userId));
      console.log("Retrieved merchants:", merchants);
      
      res.json({ merchants });
    } catch (error: any) {
      console.error("Error fetching merchants by user ID:", error);
      res.status(500).json({
        message: "Error fetching merchants: " + error.message
      });
    }
  });
  
  app.get("/api/merchants/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const merchant = await storage.getMerchant(parseInt(id));
      
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      
      // Check if the user is authorized to access this merchant
      if (req.isAuthenticated() && (req.user as any).id !== merchant.userId) {
        return res.status(403).json({ message: "Not authorized to access this merchant" });
      }
      
      res.json({ merchant });
    } catch (error: any) {
      console.error("Error fetching merchant:", error);
      res.status(500).json({
        message: "Error fetching merchant: " + error.message
      });
    }
  });
  
  // Payment endpoints
  app.post("/api/payments", async (req, res) => {
    try {
      // Allow creating payments via API key
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        return res.status(401).json({ message: "API key required" });
      }
      
      const merchant = await storage.getMerchantByApiKey(apiKey);
      
      if (!merchant) {
        return res.status(401).json({ message: "Invalid API key" });
      }
      
      // Generate a unique payment reference
      const paymentReference = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        merchantId: merchant.id,
        status: 'pending',
        paymentReference,
        createdAt: new Date()
      });
      
      const payment = await storage.createPayment(paymentData);
      
      res.status(201).json({ 
        payment,
        paymentUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:3000'}/payment/${paymentReference}`
      });
    } catch (error: any) {
      console.error("Error creating payment:", error);
      
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          message: "Invalid payment data: " + validationError.message
        });
        return;
      }
      
      res.status(400).json({
        message: "Error creating payment: " + error.message
      });
    }
  });
  
  app.get("/api/payments/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      const payment = await storage.getPaymentByReference(reference);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Get merchant details to include in response
      const merchant = await storage.getMerchant(payment.merchantId);
      
      res.json({ payment, merchant });
    } catch (error: any) {
      console.error("Error fetching payment:", error);
      res.status(500).json({
        message: "Error fetching payment: " + error.message
      });
    }
  });
  
  // Start payment monitoring
  await startPaymentMonitoring();
  
  return httpServer;
}