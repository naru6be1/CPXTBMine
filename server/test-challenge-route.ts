import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// For testing purposes only - this is a simplified version of the challenge system
// that can be directly tested

// Challenge storage
interface Challenge {
  equation: string;
  solution: number;
  expiresAt: number;
  level: number;
}

const challenges = new Map<string, Challenge>();

// Generate a math challenge
function generateMathChallenge(level: number = 1): { equation: string; solution: number } {
  // Define operations based on difficulty level
  const operations = level <= 1 ? ['+'] : 
                    level === 2 ? ['+', '-'] :
                    level === 3 ? ['+', '-', '*'] :
                    ['+', '-', '*', '/'];
  
  // Generate random numbers and operation
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const op = operations[Math.floor(Math.random() * operations.length)];
  
  let solution: number;
  let equation: string;
  
  switch (op) {
    case '+':
      solution = a + b;
      equation = `${a} + ${b}`;
      break;
    case '-':
      solution = a - b;
      equation = `${a} - ${b}`;
      break;
    case '*':
      solution = a * b;
      equation = `${a} * ${b}`;
      break;
    case '/':
      // Make division clean by ensuring a is divisible by b
      solution = a;
      equation = `${a * b} / ${b}`;
      break;
    default:
      solution = a + b;
      equation = `${a} + ${b}`;
  }
  
  return { equation: `${equation} = ?`, solution };
}

// Create a helper to register these routes
export function registerTestChallengeRoutes(app: any) {
  console.log('Registering test challenge routes');
  
  // Route to get a challenge
  app.get('/api/test-challenge', (req: Request, res: Response) => {
    const level = parseInt(req.query.level as string) || 1;
    const { equation, solution } = generateMathChallenge(level);
    
    // Create a token for this challenge
    const token = crypto.randomBytes(16).toString('hex');
    
    // Store the challenge
    challenges.set(token, {
      equation,
      solution,
      expiresAt: Date.now() + 600000, // 10 minutes expiry
      level
    });
    
    console.log(`Generated test challenge: ${equation} = ${solution}, token: ${token}`);
    
    // Return the challenge to the client
    res.json({
      token,
      equation,
      level
    });
  });
  
  // Route to verify a solution
  app.post('/api/test-challenge/verify', (req: Request, res: Response) => {
    const { token, solution } = req.body;
    
    console.log(`Verifying solution: token=${token}, solution=${solution}`);
    
    if (!token || solution === undefined) {
      return res.status(400).json({
        error: 'Missing token or solution'
      });
    }
    
    // Check if challenge exists
    const challenge = challenges.get(token);
    if (!challenge) {
      return res.status(404).json({
        error: 'Challenge not found'
      });
    }
    
    // Check if challenge expired
    if (Date.now() > challenge.expiresAt) {
      challenges.delete(token);
      return res.status(410).json({
        error: 'Challenge expired',
        newChallenge: createNewChallenge(challenge.level)
      });
    }
    
    // Check solution
    const userSolution = parseInt(solution);
    if (userSolution === challenge.solution) {
      // Solution is correct
      challenges.delete(token);
      return res.status(200).json({
        success: true,
        message: 'Challenge solved successfully!'
      });
    } else {
      // Solution is incorrect
      const newLevel = Math.min(5, challenge.level + 1);
      return res.status(400).json({
        error: 'Incorrect solution',
        correctSolution: challenge.solution, // Include correct solution for testing
        newChallenge: createNewChallenge(newLevel)
      });
    }
  });
  
  // Simple function to create a new challenge
  function createNewChallenge(level: number) {
    const { equation, solution } = generateMathChallenge(level);
    const token = crypto.randomBytes(16).toString('hex');
    
    challenges.set(token, {
      equation,
      solution,
      expiresAt: Date.now() + 600000,
      level
    });
    
    console.log(`Generated new challenge after failure: ${equation} = ${solution}, token: ${token}`);
    
    return {
      token,
      equation,
      level
    };
  }
}