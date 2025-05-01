#!/bin/bash

# Change this to your own domain
DOMAIN="https://$(node -e "console.log(process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co')")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Challenge Test Script${NC}"
echo "Using domain: $DOMAIN"

# Function to validate numeric input
validate_number() {
  re='^[0-9]+$'
  if ! [[ $1 =~ $re ]] ; then
    echo -e "${RED}Error: Not a number${NC}" >&2
    return 1
  fi
  return 0
}

# Choose test mode
echo ""
echo -e "${YELLOW}Choose Test Mode:${NC}"
echo "1) Test Force Challenge (Recommended)"
echo "2) Test Rapid Requests Mode"
read -p "Enter choice [1-2]: " choice

if [[ $choice == "1" ]]; then
  echo -e "\n${BLUE}=== Force Challenge Test ===${NC}"
  echo "This test will directly request a challenge from the server."
  
  # Ask for challenge level
  echo -e "\n${YELLOW}Choose Challenge Difficulty:${NC}"
  echo "1) Level 1 (Easy - Addition only)"
  echo "2) Level 2 (Medium - Addition & Subtraction)"
  echo "3) Level 3 (Hard - Addition, Subtraction & Multiplication)"
  echo "4) Level 4 (Very Hard - All operations)"
  echo "5) Level 5 (Extreme - All operations with larger numbers)"
  read -p "Enter level [1-5]: " level
  
  if ! validate_number "$level" || [ "$level" -lt 1 ] || [ "$level" -gt 5 ]; then
    echo -e "${RED}Invalid level. Using level 1.${NC}"
    level=1
  fi
  
  echo -e "\n${BLUE}Requesting challenge at level $level...${NC}"
  
  # Request challenge
  response=$(curl -s "$DOMAIN/api/force-challenge?level=$level")
  
  if [[ $response == *"challenge"* ]]; then
    echo -e "${GREEN}Successfully received challenge!${NC}"
    
    # Extract challenge details
    token=$(echo $response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    equation=$(echo $response | grep -o '"equation":"[^"]*' | cut -d'"' -f4)
    
    echo -e "\n${YELLOW}Challenge Details:${NC}"
    echo "Token: $token"
    echo "Equation: $equation"
    
    # Ask for solution
    read -p "Enter your solution to the equation: " solution
    
    if ! validate_number "$solution"; then
      echo -e "${RED}Solution must be a number. Aborting.${NC}"
      exit 1
    fi
    
    echo -e "\n${BLUE}Submitting solution...${NC}"
    
    # Submit solution
    verify_response=$(curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "{\"token\":\"$token\",\"solution\":$solution}" \
      "$DOMAIN/api/test-challenge/verify")
    
    if [[ $verify_response == *"success\":true"* ]]; then
      echo -e "${GREEN}Challenge solved successfully!${NC}"
    else
      echo -e "${RED}Failed to solve challenge.${NC}"
      echo "Response: $verify_response"
    fi
  else
    echo -e "${RED}Failed to get challenge.${NC}"
    echo "Response: $response"
  fi
  
elif [[ $choice == "2" ]]; then
  echo -e "\n${BLUE}=== Rapid Requests Test ===${NC}"
  echo "This test will send multiple requests to trigger rate limiting."
  
  # Ask for number of requests
  read -p "Enter number of requests to send [10-50]: " num_requests
  
  if ! validate_number "$num_requests" || [ "$num_requests" -lt 1 ]; then
    echo -e "${RED}Invalid number. Using 20 requests.${NC}"
    num_requests=20
  fi
  
  echo -e "\n${BLUE}Sending $num_requests requests...${NC}"
  
  # Send requests
  challenge_received=false
  
  for (( i=1; i<=$num_requests; i++ )); do
    echo -e "${YELLOW}Request $i/$num_requests${NC}"
    
    response=$(curl -s -w "%{http_code}" "$DOMAIN/api/mining-plans" -o /tmp/challenge_response.txt)
    
    if [[ $response == "429" ]]; then
      challenge_received=true
      echo -e "${GREEN}Challenge triggered after $i requests!${NC}"
      
      # Parse challenge
      cat /tmp/challenge_response.txt
      challenge_data=$(cat /tmp/challenge_response.txt)
      
      # Extract challenge details
      token=$(echo $challenge_data | grep -o '"token":"[^"]*' | cut -d'"' -f4)
      equation=$(echo $challenge_data | grep -o '"equation":"[^"]*' | cut -d'"' -f4)
      
      if [[ -n "$token" && -n "$equation" ]]; then
        echo -e "\n${YELLOW}Challenge Details:${NC}"
        echo "Token: $token"
        echo "Equation: $equation"
        
        # Ask for solution
        read -p "Enter your solution to the equation: " solution
        
        if ! validate_number "$solution"; then
          echo -e "${RED}Solution must be a number. Aborting.${NC}"
          exit 1
        fi
        
        echo -e "\n${BLUE}Submitting solution...${NC}"
        
        # Submit solution using headers
        verify_response=$(curl -s -H "x-math-challenge-token: $token" -H "x-math-challenge-response: $solution" "$DOMAIN/api/mining-plans")
        
        echo "Response after solving: $verify_response"
        
        if [[ $verify_response != *"error"* ]]; then
          echo -e "${GREEN}Challenge solved successfully!${NC}"
        else
          echo -e "${RED}Failed to solve challenge.${NC}"
        fi
      else
        echo -e "${RED}Failed to parse challenge data.${NC}"
      fi
      
      break
    else
      echo -e "Response code: ${BLUE}$response${NC}"
    fi
    
    # Small delay between requests
    sleep 0.1
  done
  
  if [[ "$challenge_received" == false ]]; then
    echo -e "${RED}No challenge was triggered after $num_requests requests.${NC}"
    echo "This might indicate an issue with the rate limiting configuration."
  fi
else
  echo -e "${RED}Invalid choice. Exiting.${NC}"
  exit 1
fi

# Clean up
rm -f /tmp/challenge_response.txt

echo -e "\n${BLUE}Test complete.${NC}"