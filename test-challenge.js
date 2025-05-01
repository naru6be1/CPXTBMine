const fetch = require('node-fetch');

// URL of a protected endpoint
const targetUrl = 'http://localhost:5000/api/payments';

// Number of rapid requests to send (should trigger the challenge)
const requestCount = 40;

// Keep track of challenges
const challenges = new Map();

async function sendRapidRequests() {
  console.log(`Sending ${requestCount} rapid requests to ${targetUrl}`);
  
  // Send requests in rapid succession
  for (let i = 0; i < requestCount; i++) {
    try {
      console.log(`Request ${i + 1}/${requestCount}`);
      const response = await fetch(targetUrl);
      
      // Check response status
      if (response.status === 429) {
        console.log('Rate limit triggered! Challenge received.');
        
        // Try to parse the challenge
        const data = await response.json();
        if (data.challenge) {
          console.log('Challenge details:', data.challenge);
          challenges.set(data.challenge.token, data.challenge);
        }
      } else {
        console.log(`Response status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error making request:', error.message);
    }
    
    // Small delay to avoid overwhelming your local machine
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // If we got any challenges, try to solve the first one
  if (challenges.size > 0) {
    const [token, challenge] = Array.from(challenges.entries())[0];
    
    console.log('\nAttempting to solve challenge:', challenge.equation);
    // Use eval to calculate the solution
    // Note: eval is used for testing only, never use it for parsing user input in production
    const equation = challenge.equation.replace('= ?', '');
    const solution = eval(equation);
    console.log(`Solution calculated: ${solution}`);
    
    // Send the solution
    try {
      const verifyResponse = await fetch('http://localhost:5000/api/verify-challenge', {
        headers: {
          'x-math-challenge-token': token,
          'x-math-challenge-response': solution.toString()
        }
      });
      
      if (verifyResponse.ok) {
        console.log('Challenge solved successfully!');
        const data = await verifyResponse.json();
        console.log('Response:', data);
      } else {
        console.log('Failed to solve challenge:', verifyResponse.status);
      }
    } catch (error) {
      console.error('Error solving challenge:', error.message);
    }
  }
}

sendRapidRequests().catch(console.error);