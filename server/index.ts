import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import enhancedChallengeMiddleware from "./middleware/enhanced-challenge-middleware";
import { runDatabaseMigrations } from "./migrations";

// Add more detailed startup logging
log("Starting server initialization with enhanced logging...");

// Add diagnostic logging for DATABASE_URL
log(`Database URL status: ${process.env.DATABASE_URL ? 'present' : 'missing'}`);
if (!process.env.DATABASE_URL) {
  log("WARNING: DATABASE_URL environment variable is not set!");
  log("Available environment variables:", Object.keys(process.env).join(', '));
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure production-ready anti-DDoS protection with enhanced challenge middleware
// Features both rate limiting and automatic challenges for critical endpoints
// ONLY applied to API endpoints to ensure frontend pages are always accessible
const securityChallenge = enhancedChallengeMiddleware(
  30,  // Standard rate limit: 30 requests 
  60000, // Standard time window: 60 seconds
  [    // Protected paths - API endpoints only
    '/api'
  ],
  [    // Excluded paths (even within protected paths)
    '/api/health',
    '/api/ping',
    '/api/public',
    '/api/prices',
    '/api/users',  // Public user information
    '/api/mining-plans/public'  // Public mining plan information
  ]
);

// Add enhanced DDoS protection middleware
log("Initializing enhanced anti-DDoS protection with mathematical challenges");
app.use(securityChallenge);

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server initialization...");

    // Set BASE_URL for password reset links if not set
    if (!process.env.BASE_URL) {
      // Use the production domain for the application
      process.env.BASE_URL = 'https://cpxtbmining.com';
      log(`Setting BASE_URL to production domain: ${process.env.BASE_URL} for password reset emails`);
    }

    // Check for required environment variables
    if (!process.env.DATABASE_URL) {
      const errorMessage = 'Critical: DATABASE_URL environment variable is missing. Please ensure it is set in your deployment environment.';
      log(errorMessage);
      log("Available environment variables:", Object.keys(process.env).join(', '));
      throw new Error(errorMessage);
    }
    
    // Run database migrations
    log("Running database migrations...");
    await runDatabaseMigrations();
    log("Database migrations completed");

    // Initialize routes
    log("Registering routes...");
    const server = await registerRoutes(app);
    log("Routes registered successfully");

    // Setup enhanced error handling
    log("Setting up error handling...");
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error details:", {
        message: err.message,
        stack: err.stack,
        code: err.code,
        status: err.status || err.statusCode || 500
      });

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Send error response without exposing internal details
      res.status(status).json({
        message,
        error: app.get("env") === "development" ? err.stack : undefined
      });
    });

    // Setup Vite or static serving
    if (app.get("env") === "development") {
      log("Setting up Vite development server...");
      await setupVite(app, server);
      log("Vite development server setup complete");
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
      log("Static file serving setup complete");
    }

    const port = process.env.PORT || 5000;
    log(`Attempting to start server on port ${port}...`);

    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server successfully started and listening on port ${port}`);
      log(`Application is now available at http://0.0.0.0:${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`Database connection status: ${process.env.DATABASE_URL ? 'configured' : 'missing'}`);
      log("Environment variables available:", Object.keys(process.env).join(', '));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();