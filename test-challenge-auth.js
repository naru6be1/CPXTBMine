const fetch = require('node-fetch');

// Configuration
const config = {
  baseUrl: 'http://localhost:5000',
  targetEndpoint: '/api/mining-plans', // A protected endpoint
  requestCount: 40,                    // Number of requests to trigger challenge
  authToken: null,                    // Optional auth token if needed
  requestDelay: 20                     // ms between requests
};

// Storage for challenges
let challengeToken = null;
let challengeEquation = null;

async function login() {
  try {
    // Add your login logic here if needed
    // For testing without login, you can comment this out
    /*
    const loginResponse = await fetch(`${config.baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'your-username',
        password: 'your-password'
      })
    });
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      config.authToken = data.token; // Or however your auth system works
      console.log('Logged in successfully');
    } else {
      console.error('Login failed');
    }
    */
  } catch (error) {
    console.error('Error during login:', error.message);
  }
}

async function sendRequest(requestNumber) {
  const headers = {};
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }
  
  try {
    console.log(`Request ${requestNumber}/${config.requestCount}`);
    const response = await fetch(`${config.baseUrl}${config.targetEndpoint}`, { headers });
    console.log(`Status: ${response.status}`);
    
    if (response.status === 429) {
      const data = await response.json();
      if (data.challenge) {
        console.log('\nChallenge received:');
        console.log(`Token: ${data.challenge.token}`);
        console.log(`Equation: ${data.challenge.equation}`);
        console.log(`Level: ${data.challenge.level}`);
        
        challengeToken = data.challenge.token;
        challengeEquation = data.challenge.equation;
        
        return true; // Challenge triggered
      }
    }
    
    return false; // No challenge
  } catch (error) {
    console.error(`Error on request ${requestNumber}:`, error.message);
    return false;
  }
}

async function solveChallenge() {
  if (!challengeToken || !challengeEquation) {
    console.log('No challenge to solve');
    return false;
  }
  
  try {
    // Parse and solve the equation
    const equationStr = challengeEquation.replace(' = ?', '');
    // WARNING: Using eval is generally not safe, only use for testing
    const solution = eval(equationStr);
    
    console.log(`\nSolving equation: ${equationStr}`);
    console.log(`Calculated solution: ${solution}`);
    
    // Submit the solution
    const headers = {
      'x-math-challenge-token': challengeToken,
      'x-math-challenge-response': solution.toString()
    };
    
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }
    
    const response = await fetch(`${config.baseUrl}/api/verify-challenge`, { headers });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\nChallenge solved successfully!');
      console.log('Response:', data);
      return true;
    } else {
      const data = await response.json();
      console.log('\nFailed to solve challenge.');
      console.log(`Status: ${response.status}`);
      console.log('Error:', data);
      return false;
    }
  } catch (error) {
    console.error('Error solving challenge:', error);
    return false;
  }
}

async function testAgainAfterSolving() {
  console.log('\nTesting access after solving challenge...');
  
  const headers = {};
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }
  
  try {
    const response = await fetch(`${config.baseUrl}${config.targetEndpoint}`, { headers });
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log('Access granted! Challenge solution worked.');
      return true;
    } else {
      console.log('Access still denied after solving challenge.');
      return false;
    }
  } catch (error) {
    console.error('Error testing access after solving:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('=== DDOS Protection Challenge Test ===');
  console.log(`Target: ${config.baseUrl}${config.targetEndpoint}`);
  console.log(`Requests: ${config.requestCount}`);
  console.log('-'.repeat(40));
  
  // Login if needed
  await login();
  
  // Send requests until we trigger a challenge
  let challengeTriggered = false;
  for (let i = 0; i < config.requestCount; i++) {
    challengeTriggered = await sendRequest(i + 1);
    if (challengeTriggered) {
      console.log('\nChallenge triggered successfully!');
      break;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, config.requestDelay));
  }
  
  if (!challengeTriggered) {
    console.log('\nFailed to trigger a challenge after all requests.');
    return;
  }
  
  // Try to solve the challenge
  const challengeSolved = await solveChallenge();
  
  if (challengeSolved) {
    // Test access after solving
    await testAgainAfterSolving();
  }
  
  console.log('\n=== Test Completed ===');
}

runTest().catch(console.error);