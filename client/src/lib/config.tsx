```typescript
// USDT Contract Configuration
export const USDT_CONFIG = {
  // Contract Address for USDT on Ethereum Mainnet
  contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  
  // Treasury Address receiving the USDT
  treasuryAddress: "0xce3CB5b5A05eDC80594F84740Fd077c80292Bd27",
  
  // USDT Contract ABI (Application Binary Interface)
  abi: [
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"}
      ],
      "name": "transfer",
      "outputs": [{"name": "success", "type": "bool"}],
      "type": "function"
    }
  ],

  // Plan Configurations
  plans: {
    daily: {
      amount: "1000000", // 1 USDT (6 decimals)
      displayAmount: "1",
      rewardUSD: 1.5,
      duration: "24 hours"
    },
    weekly: {
      amount: "100000000", // 100 USDT (6 decimals)
      displayAmount: "100",
      rewardUSD: 15,
      duration: "7 days"
    }
  },

  // Network Configuration
  network: {
    required: "Ethereum Mainnet",
    chainId: 1,
    decimals: 6 // USDT uses 6 decimal places
  }
};

// Transaction Configuration
export const TRANSACTION_CONFIG = {
  // Contract Interaction Settings
  contractCall: {
    functionName: 'transfer',
    requiresApproval: false,
    gasLimit: undefined // Let wallet estimate
  },
  
  // Transaction Validation
  validation: {
    requiredConfirmations: 1,
    timeout: 60000 // 60 seconds
  }
};
```
