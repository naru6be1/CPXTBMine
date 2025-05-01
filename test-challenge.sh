#!/bin/bash

# Base URL of the application
BASE_URL="http://localhost:5000"

# Endpoint to test (should be a protected endpoint)
TEST_ENDPOINT="/api/payments"

# Number of requests to send to trigger the challenge
REQUEST_COUNT=40

echo "Sending $REQUEST_COUNT requests to $BASE_URL$TEST_ENDPOINT"

# Send multiple requests to trigger the challenge
for i in $(seq 1 $REQUEST_COUNT); do
  echo "Request $i/$REQUEST_COUNT"
  response=$(curl -s -w "%{http_code}" -o response.json "$BASE_URL$TEST_ENDPOINT")
  
  if [ "$response" -eq 429 ]; then
    echo "Rate limit triggered! Challenge received."
    # Extract challenge details
    token=$(cat response.json | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    equation=$(cat response.json | grep -o '"equation":"[^"]*"' | cut -d'"' -f4)
    level=$(cat response.json | grep -o '"level":[0-9]*' | cut -d':' -f2)
    
    if [ ! -z "$token" ]; then
      echo "Challenge token: $token"
      echo "Equation: $equation"
      echo "Level: $level"
      
      # Ask user to solve the equation
      echo "Please solve the equation: $equation"
      read -p "Enter solution: " solution
      
      # Submit the solution
      verify_response=$(curl -s -w "%{http_code}" -o verify_response.json \
        -H "x-math-challenge-token: $token" \
        -H "x-math-challenge-response: $solution" \
        "$BASE_URL/api/verify-challenge")
      
      if [ "$verify_response" -eq 200 ]; then
        echo "Challenge solved successfully!"
        cat verify_response.json
        break
      else
        echo "Failed to solve the challenge. Response code: $verify_response"
        cat verify_response.json
      fi
    fi
    break
  fi
  
  # Small delay to avoid overwhelming the server
  sleep 0.1
done

echo "Test completed"