// Script to check CPXTB token balance for a specific wallet address
import { ethers } from 'ethers';

// Define constants directly here since importing from server directory might cause issues
const CPXTB_TOKEN_ADDRESS = "0x96a0Cc3c0fc5d07818E763E1B25bc78ab4170D1b";
const BASE_CHAIN_ID = 8453;

// ERC20 Token ABI (only the balanceOf function needed)
const tokenABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// The wallet address to check
const walletToCheck = '0x6122b8784718D954659369DDE67C79d9f0e4aC67';

async function checkBalance() {
  try {
    console.log(`Checking balance for wallet: ${walletToCheck}`);
    
    // Connect to the BASE network
    const provider = new ethers.JsonRpcProvider(`https://mainnet.base.org`);
    
    // Connect to the token contract
    const tokenContract = new ethers.Contract(CPXTB_TOKEN_ADDRESS, tokenABI, provider);
    
    // Get token symbol and decimals
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();
    
    // Get the balance
    const balanceWei = await tokenContract.balanceOf(walletToCheck);
    
    // Convert to readable format
    const balance = ethers.formatUnits(balanceWei, decimals);
    
    console.log(`Wallet: ${walletToCheck}`);
    console.log(`Token: ${symbol} (${CPXTB_TOKEN_ADDRESS})`);
    console.log(`Balance: ${balance} ${symbol}`);
    
    return balance;
  } catch (error) {
    console.error('Error checking balance:', error);
    return null;
  }
}

checkBalance();