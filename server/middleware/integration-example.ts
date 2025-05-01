import express, { Express } from 'express';
import mathChallengeMiddleware from './challenge-middleware';

/**
 * This is an example of how to integrate the math challenge middleware
 * into an Express application.
 * 
 * DO NOT APPLY THIS DIRECTLY - this is just a reference implementation.
 */
export function integrateAntiDDoSProtection(app: Express) {
  // Configuration for different tiers of protection
  const standardProtection = mathChallengeMiddleware(
    30,  // Threshold: Allow 30 requests before issuing challenges
    60000, // Time window: 1 minute
    ['/api'], // Protected paths: All API routes
    ['/api/health', '/api/public'] // Excluded paths: Health checks and public APIs
  );
  
  const strictProtection = mathChallengeMiddleware(
    10,  // Lower threshold for sensitive endpoints
    60000,
    ['/api/user', '/api/payments', '/api/withdraw'], // Protect sensitive endpoints
    [] // No exclusions for these critical endpoints
  );
  
  // Apply standard protection globally to all API routes
  app.use(standardProtection);
  
  // Apply stricter protection to sensitive endpoints
  app.use(['/api/user', '/api/payments', '/api/withdraw'], strictProtection);
  
  // Add dedicated route for challenge verification
  app.post('/api/verify-challenge', (req, res) => {
    // This route is special because it's used only for verification
    // The middleware will handle the challenge verification
    res.status(200).json({ success: true });
  });
  
  // Example of headers in documentation:
  console.log(`
    === Anti-DDoS Challenge Headers Documentation ===
    
    When the server responds with a 429 status code and a challenge in the response body,
    clients should include these headers in their next request:
    
    X-Math-Challenge-Token: [token from challenge response]
    X-Math-Challenge-Response: [solution to the math problem]
    
    The client must solve the mathematical equation and provide the correct answer
    to proceed with their original request.
    
    Challenge difficulty increases with suspicious activity and decreases with
    normal usage patterns.
  `);
  
  return app;
}

/**
 * This example shows how a frontend client might handle challenges
 * using the withChallengeHandler higher-order component
 * 
 * Example Usage:
 * 
 * // In your main App component:
 * import { withChallengeHandler } from '@/components/challenge-solver';
 * 
 * function App(props) {
 *   // Your app code
 * }
 * 
 * export default withChallengeHandler(App);
 * 
 * This will automatically intercept 429 responses and show the challenge UI
 * when needed.
 */