// Simple test for DDOS challenge middleware
const testUrl = '/api/mining-plans'; // Protected endpoint
let requestCount = 0;
let challengeToken = null;
let challengeEquation = null;

// Make repeated requests until we trigger a challenge
async function bombEndpoint() {
  const resultDiv = document.createElement('div');
  resultDiv.style.backgroundColor = '#f0f0f0';
  resultDiv.style.padding = '10px';
  resultDiv.style.margin = '10px 0';
  resultDiv.style.borderRadius = '5px';
  resultDiv.style.fontFamily = 'monospace';
  resultDiv.style.whiteSpace = 'pre-wrap';
  
  document.body.appendChild(resultDiv);
  
  resultDiv.textContent = '🚀 Starting DDoS challenge test...\n';
  resultDiv.textContent += '📡 Target endpoint: ' + testUrl + '\n';
  resultDiv.textContent += '⏱️ Making requests until challenge appears\n\n';
  
  // Flood endpoint with requests
  const makeRequest = async () => {
    requestCount++;
    resultDiv.textContent += `Request #${requestCount}... `;
    
    try {
      const response = await fetch(testUrl);
      resultDiv.textContent += `Status: ${response.status}\n`;
      
      if (response.status === 429) {
        // We triggered rate limiting!
        resultDiv.textContent += '🔒 Challenge triggered!\n';
        
        const data = await response.json();
        if (data.challenge) {
          challengeToken = data.challenge.token;
          challengeEquation = data.challenge.equation;
          
          resultDiv.textContent += `
Challenge details:
- Token: ${challengeToken}
- Equation: ${challengeEquation}
- Level: ${data.challenge.level}
`;
          
          // Create input field for solution
          const solutionForm = document.createElement('div');
          solutionForm.innerHTML = `
<div style="margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #fff;">
  <h3 style="margin-top: 0;">Solve the Challenge</h3>
  <p>Equation: <strong>${challengeEquation}</strong></p>
  <input type="number" id="solution-input" placeholder="Enter your answer" style="padding: 8px; width: 200px; margin-right: 10px;">
  <button id="submit-solution" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
</div>
`;
          document.body.appendChild(solutionForm);
          
          // Handle solution submission
          document.getElementById('submit-solution').addEventListener('click', async () => {
            const solution = document.getElementById('solution-input').value;
            
            if (!solution) {
              alert('Please enter a solution');
              return;
            }
            
            const solveResultDiv = document.createElement('div');
            solveResultDiv.style.backgroundColor = '#e8f5e9';
            solveResultDiv.style.padding = '10px';
            solveResultDiv.style.margin = '10px 0';
            solveResultDiv.style.borderRadius = '5px';
            solveResultDiv.style.fontFamily = 'monospace';
            document.body.appendChild(solveResultDiv);
            
            solveResultDiv.textContent = `Submitting solution: ${solution}\n`;
            
            try {
              const verifyResponse = await fetch('/api/verify-challenge', {
                headers: {
                  'x-math-challenge-token': challengeToken,
                  'x-math-challenge-response': solution
                }
              });
              
              solveResultDiv.textContent += `Response status: ${verifyResponse.status}\n`;
              
              if (verifyResponse.ok) {
                const responseData = await verifyResponse.json();
                solveResultDiv.textContent += '✅ Challenge solved successfully!\n';
                solveResultDiv.textContent += `Response: ${JSON.stringify(responseData, null, 2)}\n`;
                
                // Test access after solving
                solveResultDiv.textContent += '\nTesting access after solving...\n';
                const accessTest = await fetch(testUrl);
                solveResultDiv.textContent += `Access test status: ${accessTest.status}\n`;
                
                if (accessTest.ok) {
                  solveResultDiv.textContent += '✅ Access granted! Challenge system is working correctly.\n';
                } else {
                  solveResultDiv.textContent += '❌ Access still denied after solving challenge.\n';
                }
              } else {
                solveResultDiv.textContent += '❌ Failed to solve challenge.\n';
                try {
                  const errorData = await verifyResponse.json();
                  solveResultDiv.textContent += `Error: ${JSON.stringify(errorData, null, 2)}\n`;
                } catch (e) {
                  solveResultDiv.textContent += 'Could not parse error response\n';
                }
              }
            } catch (error) {
              solveResultDiv.textContent += `Error: ${error.message}\n`;
            }
          });
          
          return; // Stop making requests
        }
      }
      
      // Wait a bit and make another request
      setTimeout(makeRequest, 50);
    } catch (error) {
      resultDiv.textContent += `Error: ${error.message}\n`;
      // Try again anyway
      setTimeout(makeRequest, 50);
    }
  };
  
  // Start flooding
  makeRequest();
}

// Create a button to start the test
const button = document.createElement('button');
button.textContent = '🛡️ Test Challenge System';
button.style.padding = '10px 20px';
button.style.backgroundColor = '#2196F3';
button.style.color = 'white';
button.style.border = 'none';
button.style.borderRadius = '4px';
button.style.margin = '20px';
button.style.cursor = 'pointer';
button.style.fontSize = '16px';

button.addEventListener('click', bombEndpoint);

// Create a header
const header = document.createElement('h2');
header.textContent = 'DDOS Protection Challenge Test';
header.style.margin = '20px';

// Create a description
const description = document.createElement('p');
description.textContent = 'This tool will send multiple requests to test the challenge middleware. It will stop when a challenge is received.';
description.style.margin = '20px';

// Add elements to the document
document.body.appendChild(header);
document.body.appendChild(description);
document.body.appendChild(button);