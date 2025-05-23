import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import crypto from 'crypto';

/**
 * Configure Google OAuth authentication for the application
 */
export function setupGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials not found - authentication disabled");
    return;
  }
  
  console.log("Setting up Google OAuth with proper credentials");
  
  // Dynamic callback URL determination based on environment
  let callbackURLs = [];
  
  // In production (cpxtbmining.com)
  if (process.env.NODE_ENV === 'production') {
    // Add both the root domain and /au path callback URLs
    callbackURLs = [
      "https://cpxtbmining.com/api/auth/google/callback",
      "https://cpxtbmining.com/au/api/auth/google/callback"
    ];
  } else {
    // In development, use Replit domain or localhost
    const replitDomain = process.env.REPLIT_DEV_DOMAIN;
    if (replitDomain) {
      callbackURLs = [`https://${replitDomain}/api/auth/google/callback`];
    } else {
      callbackURLs = ["http://localhost:5000/api/auth/google/callback"];
    }
  }
  
  console.log("Google Auth Callback URLs:", callbackURLs);
  
  // Set up Google Strategy with dynamic callback URL
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURLs[0], // Default to first URL
    scope: ['profile', 'email'],
    proxy: true
  }, async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
    try {
      if (!profile.emails || profile.emails.length === 0) {
        console.error("No email provided in Google profile");
        return done(new Error("No email provided by Google"), undefined);
      }
      
      const email = profile.emails[0].value;
      const name = profile.displayName || 'Unknown User';
      
      // Generate deterministic wallet address from email
      const emailHash = crypto.createHash('sha256').update(email).digest('hex');
      const walletAddress = "0x" + emailHash.substring(0, 40);
      
      // Check if user exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user
        console.log("Creating new user from Google OAuth:", email);
        
        const newUser = {
          email,
          name,
          password: null, // No password for OAuth users
          walletAddress,
          externalId: profile.id,
          provider: 'google'
        };
        
        user = await storage.createUser(newUser);
      } else {
        // Update existing user with Google data if needed
        if (!user.externalId || !user.provider) {
          await storage.updateUser(user.id, {
            externalId: profile.id,
            provider: 'google',
            walletAddress: walletAddress
          });
          
          // Refresh user data
          user = await storage.getUserByEmail(email);
        }
      }
      
      // Return user with wallet address
      const enrichedUser = {
        ...user,
        name: name,
        walletAddress: walletAddress
      };
      
      return done(null, enrichedUser);
    } catch (error) {
      console.error("Error in Google authentication:", error);
      return done(error as Error, undefined);
    }
  }));

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("User not found"), null);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

/**
 * Register Google OAuth routes
 */
export function registerGoogleAuthRoutes(app: any) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return;
  }

  // Dynamic callback URL determination based on environment
  let callbackURLs = [];
  
  // In production (cpxtbmining.com)
  if (process.env.NODE_ENV === 'production') {
    // Add both the root domain and /au path callback URLs
    callbackURLs = [
      "https://cpxtbmining.com/api/auth/google/callback",
      "https://cpxtbmining.com/au/api/auth/google/callback"
    ];
  } else {
    // In development, use Replit domain or localhost
    const replitDomain = process.env.REPLIT_DEV_DOMAIN;
    if (replitDomain) {
      callbackURLs = [`https://${replitDomain}/api/auth/google/callback`];
    } else {
      callbackURLs = ["http://localhost:5000/api/auth/google/callback"];
    }
  }
  
  // Main auth route - handles both regular and /au path
  app.get(["/api/auth/google", "/au/api/auth/google"], (req: Request, res: Response) => {
    console.log("Google auth initiated from path:", req.path);
    
    // Store redirect URL if provided
    if (req.query.redirectUrl) {
      req.session.redirectUrl = req.query.redirectUrl as string;
      console.log("Storing redirect URL:", req.session.redirectUrl);
    }
    
    // Store payment context if provided
    if (req.query.context === 'payment' || req.query.paymentRef) {
      req.session.paymentContext = true;
      
      if (req.query.paymentRef) {
        req.session.paymentReference = req.query.paymentRef as string;
        console.log("Storing payment reference:", req.session.paymentReference);
      }
    }
    
    // Determine which callback URL to use based on request path
    const isAuPath = req.path.startsWith('/au/');
    const callbackIndex = isAuPath && callbackURLs.length > 1 ? 1 : 0;
    
    console.log("Using callback URL index:", callbackIndex, "for path:", req.path);
    
    // Save session before redirecting to Google
    req.session.save(() => {
      passport.authenticate('google', { 
        scope: ['profile', 'email'],
        callbackURL: callbackURLs[callbackIndex] // Use the appropriate callback URL
      })(req, res);
    });
  });
  
  // Callback routes - handle both paths
  app.get(["/api/auth/google/callback", "/au/api/auth/google/callback"], 
    (req: Request, res: Response, next: NextFunction) => {
      console.log("Google callback received on path:", req.path);
      
      // Determine which callback URL to use based on request path
      const isAuPath = req.path.startsWith('/au/');
      const callbackIndex = isAuPath && callbackURLs.length > 1 ? 1 : 0;
      
      // Call passport authenticate with the correct callback URL
      passport.authenticate('google', {
        failureRedirect: '/auth?error=google_auth_failed',
        callbackURL: callbackURLs[callbackIndex],
        keepSessionInfo: true
      })(req, res, next);
    },
    (req: Request, res: Response) => {
      // User is authenticated at this point
      if (!req.user) {
        console.error("Authentication appeared successful but no user object found");
        return res.redirect('/auth?error=no_user_data');
      }
      
      // Store user in session
      req.session.user = req.user;
      req.session.isAuthenticated = true;
      
      // Save session before redirecting
      req.session.save((err) => {
        if (err) {
          console.error("Failed to save session:", err);
        }
        
        // Determine redirect path
        const isAuPath = req.path.startsWith('/au/');
        const prefix = isAuPath ? '/au' : '';
        
        // Get redirect URL from session or use default
        let redirectUrl = req.session.redirectUrl || `${prefix}/merchant`;
        
        // For payment context, redirect to payment page if needed
        if (req.session.paymentContext && req.session.paymentReference) {
          redirectUrl = `${prefix}/pay/${req.session.paymentReference}`;
        }
        
        console.log("Redirecting authenticated user to:", redirectUrl);
        res.redirect(redirectUrl);
      });
    }
  );
  
  // User data endpoint
  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      // Return user data
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  // Logout endpoint
  app.get("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.redirect('/auth');
    });
  });
}