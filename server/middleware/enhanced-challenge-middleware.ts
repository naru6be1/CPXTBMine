import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// In-memory store for tracking request patterns and challenge states
// In production, you might want to use Redis or another distributed cache
interface ClientTracker {
  ip: string;
  count: number;
  lastRequest: number;
  challengeLevel: number;
  pendingChallenges: Map<string, {
    solution: number;
    expiresAt: number;
  }>;
}

const clients = new Map<string, ClientTracker>();

// Constants for challenge difficulty levels
const DIFFICULTY_LEVELS = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  VERY_HARD: 4,
  EXTREME: 5
};

// List of known crawler user agents to exclude from challenges
const CRAWLER_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'slurp',
  'baiduspider',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'slack',
  'vkshare',
  'w3c_validator'
];

// Public content paths that should be excluded from challenges
const PUBLIC_CONTENT_PATHS = [
  '/about',
  '/faq',
  '/blog',
  '/terms',
  '/privacy',
  '/contact',
  '/assets',
  '/images',
  '/css',
  '/js',
  '/fonts',
  '/sitemap.xml',
  '/robots.txt',
  '/',
  '/home',
  '/index.html',
  '/auth',
  '/dashboard',
  '/profile',
  '/pricing',
  '/mining-plans',
  '/referrals',
  '/merchant',
  '/payment',
  '/withdraw'
];

// Highly sensitive paths that always require a challenge
const CRITICAL_PATHS = [
  '/api/payments',
  '/api/withdraw',
  '/api/admin',
  '/api/mining-plans/distribute-all'
];

// Clean up expired challenges and old client records periodically
setInterval(() => {
  const now = Date.now();
  clients.forEach((client, ip) => {
    // Remove clients inactive for more than 1 hour
    if (now - client.lastRequest > 3600000) {
      clients.delete(ip);
      return;
    }

    // Clean expired challenges
    client.pendingChallenges.forEach((challenge, id) => {
      if (now > challenge.expiresAt) {
        client.pendingChallenges.delete(id);
      }
    });
  });
}, 60000); // Run cleanup every minute

/**
 * Generates a mathematical challenge with equation and solution
 * Difficulty increases with level (1-5)
 */
function generateMathChallenge(level: number): { equation: string; solution: number } {
  // Define operations based on difficulty level
  const operations = level <= 1 ? ['+'] : 
                    level === 2 ? ['+', '-'] :
                    level === 3 ? ['+', '-', '*'] :
                    ['+', '-', '*', '/'];
  
  // Define number range based on level
  const maxNum = level <= 2 ? 10 : level <= 4 ? 20 : 50;
  
  // Generate random numbers
  const getNum = () => Math.floor(Math.random() * maxNum) + 1;
  
  let solution: number;
  let equation: string;
  
  // Attempt to create a valid equation
  let attempts = 0;
  do {
    const a = getNum();
    const b = getNum();
    const op = operations[Math.floor(Math.random() * operations.length)];
    
    // Create equation based on operation
    switch (op) {
      case '+':
        solution = a + b;
        equation = `${a} + ${b}`;
        break;
      case '-':
        // Ensure positive result for subtraction
        if (a >= b) {
          solution = a - b;
          equation = `${a} - ${b}`;
        } else {
          solution = b - a;
          equation = `${b} - ${a}`;
        }
        break;
      case '*':
        solution = a * b;
        equation = `${a} * ${b}`;
        break;
      case '/':
        // Make division clean by ensuring a is divisible by b
        const product = a * b;
        solution = a;
        equation = `${product} / ${b}`;
        break;
      default:
        solution = a + b;
        equation = `${a} + ${b}`;
    }
    
    attempts++;
  } while (isNaN(solution) && attempts < 5);
  
  // Fallback to simple addition if something went wrong
  if (isNaN(solution)) {
    const a = getNum();
    const b = getNum();
    solution = a + b;
    equation = `${a} + ${b}`;
  }
  
  return { equation: `${equation} = ?`, solution };
}

/**
 * Checks if the user agent is from a known search engine crawler
 */
function isCrawler(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(agent => lowerUA.includes(agent));
}

/**
 * Create a new challenge for a client
 */
function issueNewChallenge(client: ClientTracker): { token: string; equation: string; level: number; } {
  // Determine difficulty level
  const level = Math.max(1, client.challengeLevel);
  
  // Generate challenge
  const { equation, solution } = generateMathChallenge(level);
  
  // Create a unique token for this challenge
  const token = crypto.randomBytes(16).toString('hex');
  
  // Store challenge details
  client.pendingChallenges.set(token, {
    solution,
    expiresAt: Date.now() + 300000 // Challenge expires in 5 minutes
  });
  
  console.log(`Generated challenge: ${equation} = ${solution}, token: ${token}, level: ${level}`);
  
  return {
    token,
    equation,
    level
  };
}

/**
 * PRODUCTION VERSION: Enhanced DDoS protection middleware with:
 * - Automatic challenges for critical endpoints
 * - Rate limiting for standard endpoints
 * - Enhanced client identification
 * - Search engine crawler exceptions
 * - Public content bypass
 */
export function enhancedChallengeMiddleware(
  requestThreshold = 30,     // Number of requests before activating challenges
  timeWindow = 60000,        // Time window in ms (1 minute)
  protectedPaths = ['/api'], // Paths to protect with challenges
  excludedPaths = ['/api/health', '/api/public'] // Paths to exclude from challenges
) {
  // Combine standard excluded paths with public content paths
  const allExcludedPaths = [...excludedPaths, ...PUBLIC_CONTENT_PATHS];
  
  return (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.headers['user-agent'] || '';
    
    // Always allow crawlers to access content without challenges
    if (isCrawler(userAgent)) {
      return next();
    }
    
    // Skip challenges for excluded paths and public content
    if (allExcludedPaths.some(path => req.path.startsWith(path) || req.path === path)) {
      return next();
    }
    
    // Only apply to API paths, allow all frontend routes without challenges
    if (!req.path.startsWith('/api')) {
      return next();
    }
    
    // Only apply to protected paths within API routes
    if (!protectedPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Don't challenge static file requests
    if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
      return next();
    }
    
    // Enhanced client identification using multiple factors
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const forwardedFor = (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim();
    const clientIp = forwardedFor || ipAddress;
    
    // Add a signature based on user agent and other headers for more reliable tracking
    const headerSignature = crypto
      .createHash('md5')
      .update(`${userAgent}|${req.headers['accept'] || ''}|${req.headers['accept-language'] || ''}`)
      .digest('hex')
      .substring(0, 8);
    
    // Combined client identifier
    const clientId = `${clientIp}-${headerSignature}`;
    const now = Date.now();
    
    // Debug info
    console.log(`Request from ${clientId} to ${req.path} at ${new Date(now).toISOString()}`);
    
    // Verify challenge token and response if present
    const challengeToken = req.headers['x-math-challenge-token'] as string;
    const challengeResponse = req.headers['x-math-challenge-response'] as string;
    
    // Get or create client tracker
    if (!clients.has(clientId)) {
      clients.set(clientId, {
        ip: clientId,
        count: 0,
        lastRequest: now,
        challengeLevel: 0,
        pendingChallenges: new Map()
      });
    }
    
    const client = clients.get(clientId)!;
    client.lastRequest = now;
    
    // If client is responding to a challenge
    if (challengeToken && challengeResponse && client.pendingChallenges.has(challengeToken)) {
      const challenge = client.pendingChallenges.get(challengeToken)!;
      
      // Check if challenge is expired
      if (now > challenge.expiresAt) {
        client.pendingChallenges.delete(challengeToken);
        return res.status(403).json({
          error: 'Challenge expired',
          challenge: issueNewChallenge(client)
        });
      }
      
      // Verify the solution
      const userSolution = parseInt(challengeResponse, 10);
      if (userSolution === challenge.solution) {
        // Correct solution, remove the challenge and continue
        client.pendingChallenges.delete(challengeToken);
        
        // Reduce challenge level on successful completion
        if (client.challengeLevel > 0) {
          client.challengeLevel = Math.max(0, client.challengeLevel - 1);
        }
        
        // Reset request count after successful challenge
        client.count = 0;
        
        return next();
      } else {
        // Wrong solution, issue a new challenge with higher difficulty
        client.challengeLevel = Math.min(DIFFICULTY_LEVELS.EXTREME, client.challengeLevel + 1);
        return res.status(403).json({
          error: 'Incorrect solution',
          challenge: issueNewChallenge(client)
        });
      }
    }
    
    // CRITICAL PATH CHECK - Always force a challenge for these paths
    if (CRITICAL_PATHS.some(path => req.path.startsWith(path) || req.path === path)) {
      console.log(`Critical path accessed: ${req.path} - forcing challenge verification`);
      
      // For critical paths, start with at least medium difficulty
      client.challengeLevel = Math.max(DIFFICULTY_LEVELS.MEDIUM, client.challengeLevel);
      
      return res.status(429).json({
        error: 'Security verification required for this operation',
        challenge: issueNewChallenge(client)
      });
    }
    
    // RATE LIMITING LOGIC
    
    // Increment request count
    client.count++;
    
    // Only reset counter if significant time has passed
    if ((now - client.lastRequest) > timeWindow) {
      client.count = 1;
    }
    
    console.log(`Client ${clientId} request count: ${client.count}/${requestThreshold}`);
    
    // Check if we need to issue a challenge
    if (client.count > requestThreshold) {
      console.log(`Rate limit exceeded! Client ${clientId} made ${client.count} requests within ${timeWindow}ms`);
      
      // Only reduce count slightly to maintain history of suspicious activity
      client.count = Math.max(Math.floor(requestThreshold * 0.75), client.count - 5);
      
      // Increase challenge level based on frequency
      client.challengeLevel = Math.min(DIFFICULTY_LEVELS.EXTREME, client.challengeLevel + 1);
      
      return res.status(429).json({
        error: 'Too many requests',
        challenge: issueNewChallenge(client)
      });
    }
    
    // No challenge needed, proceed normally
    next();
  };
}

export default enhancedChallengeMiddleware;