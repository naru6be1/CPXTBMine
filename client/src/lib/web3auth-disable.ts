/**
 * This file prevents the Web3Auth dialog from automatically appearing
 * It provides mock implementations of Web3Auth components
 * This is a temporary workaround while we refine the Web3Auth integration
 */

// Define mock classes
export class MockWeb3AuthClass {
  connected = false;
  provider = null;
  
  constructor() {
    console.log('Mock Web3Auth instantiated');
  }
  
  initModal() {
    console.log('Mock initModal called');
    return Promise.resolve();
  }
  
  getUserInfo() {
    return Promise.resolve({});
  }
  
  connect() {
    return Promise.resolve(this.provider);
  }
}

export class MockOpenloginAdapter {
  constructor() {
    console.log('Mock OpenloginAdapter instantiated');
  }
}

// Export mock chain namespaces
export const MOCK_CHAIN_NAMESPACES = {
  EIP155: 'eip155',
  SOLANA: 'solana'
};

export const MOCK_WEB3AUTH_NETWORK = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet'
};

// Use URL parameter to enable/disable: ?enableWeb3Auth=true (opt-in approach)
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const enableWeb3Auth = urlParams.get('enableWeb3Auth') === 'true';
  
  // Default to disabled unless explicitly enabled
  if (!enableWeb3Auth) {
    // Make Web3Auth components inaccessible to prevent UI from showing
    // Add a global flag to indicate Web3Auth is disabled
    (window as any).__WEB3AUTH_DISABLED__ = true;
    
    // Modify window.open to prevent unwanted popups
    const originalOpen = window.open;
    window.open = function(url?: string | URL, target?: string, features?: string): Window | null {
      // Check if this is a Web3Auth popup
      if (url && url.toString().includes('web3auth')) {
        console.log('Prevented Web3Auth popup:', url);
        return null;
      }
      
      // Otherwise use the original window.open
      return originalOpen.call(window, url, target, features);
    };
    
    console.log('Web3Auth disabled by default - using BasicSocialLogin fallback solution');
  } else {
    console.log('Web3Auth explicitly enabled with URL parameter - using whitelisted domain: https://1ceb706b-817d-4c3a-92ce-0335b2e3890c-00-26akl9dnpcsqg.picard.replit.dev');
    (window as any).__WEB3AUTH_DISABLED__ = false;
  }
}

// Export a simple mock Web3Auth object
export const MockWeb3Auth = {
  initModal: () => Promise.resolve(),
  connect: () => Promise.resolve(null),
  getUserInfo: () => Promise.resolve({}),
  connected: false
};

// Export default object to satisfy imports
export default {
  MockWeb3Auth,
  MOCK_CHAIN_NAMESPACES,
  MockWeb3AuthClass
};