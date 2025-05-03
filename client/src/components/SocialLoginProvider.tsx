import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CHAIN_NAMESPACES, SafeEventEmitterProvider, WALLET_ADAPTERS } from '@web3auth/base';
import { Web3Auth } from '@web3auth/modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { ethers } from 'ethers';
import { BASE_CHAIN_ID, CPXTB_TOKEN_ADDRESS } from '@shared/constants';
import { useToast } from '@/hooks/use-toast';

// Import our buffer polyfill to ensure Buffer is available
import '@/lib/buffer-polyfill';

// ABI for ERC20 token interface (minimal for transfer function)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint amount)'
];

interface Web3AuthContextProps {
  // Auth state
  web3auth: Web3Auth | null;
  provider: SafeEventEmitterProvider | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  user: any; // User info from Web3Auth

  // Auth methods
  login: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Blockchain operations
  getBalance: () => Promise<string>;
  sendCPXTB: (to: string, amount: string) => Promise<{
    transactionHash: string;
    success: boolean;
  }>;
  getChainId: () => Promise<number>;
}

const Web3AuthContext = createContext<Web3AuthContextProps | null>(null);

export const Web3AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Initialize Web3Auth
  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        setIsLoading(true);
        
        // Check if client ID is available
        if (!import.meta.env.VITE_WEB3AUTH_CLIENT_ID) {
          throw new Error("Missing Web3Auth Client ID");
        }
        
        // Create Web3Auth instance
        const web3auth = new Web3Auth({
          clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
          web3AuthNetwork: "sapphire_mainnet", // mainnet, cyan, aqua, celeste
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: "0x" + BASE_CHAIN_ID.toString(16), // 8453 in hex
            rpcTarget: "https://mainnet.base.org",
            displayName: "Base",
            blockExplorer: "https://basescan.org",
            ticker: "ETH",
            tickerName: "Ethereum",
          },
          uiConfig: {
            theme: "dark",
            loginMethodsOrder: ["google", "apple", "twitter", "discord"],
            defaultLanguage: "en",
            appLogo: "/assets/token-logo.png", // Your app logo
            modalZIndex: "2147483647",
          },
        });

        // Configure OpenLogin adapter
        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "none",
          },
          adapterSettings: {
            whiteLabel: {
              name: "CPXTB Platform",
              logoLight: "/assets/token-logo.png",
              logoDark: "/assets/token-logo.png",
              defaultLanguage: "en",
              dark: true,
            },
          },
        });
        
        // Add adapter to Web3Auth
        web3auth.configureAdapter(openloginAdapter);
        
        // Initialize Web3Auth
        await web3auth.initModal({
          modalConfig: {
            [WALLET_ADAPTERS.OPENLOGIN]: {
              label: "Social Login",
              showOnDesktop: true,
              showOnMobile: true,
            },
          }
        });
        
        // Set state
        setWeb3auth(web3auth);
        
        // Check if user already logged in
        if (web3auth.connected) {
          setProvider(web3auth.provider);
          setUser(await web3auth.getUserInfo());
        }
        
        setError(null);
      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setIsLoading(false);
      }
    };

    initWeb3Auth();
  }, []);

  // Login function
  const login = async (): Promise<void> => {
    if (!web3auth) {
      throw new Error("Web3Auth not initialized");
    }
    
    try {
      setIsLoading(true);
      const web3authProvider = await web3auth.connect();
      setProvider(web3authProvider);
      if (web3auth.connected) {
        const userInfo = await web3auth.getUserInfo();
        setUser(userInfo);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    if (!web3auth) {
      throw new Error("Web3Auth not initialized");
    }
    
    try {
      setIsLoading(true);
      await web3auth.logout();
      setProvider(null);
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get chain ID
  const getChainId = async (): Promise<number> => {
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    
    try {
      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      const network = await ethersProvider.getNetwork();
      return network.chainId;
    } catch (error) {
      console.error("Error getting chain ID:", error);
      throw error;
    }
  };

  // Get user's CPXTB balance
  const getBalance = async (): Promise<string> => {
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    
    try {
      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      const signer = ethersProvider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Create contract instance for the CPXTB token
      const tokenContract = new ethers.Contract(
        CPXTB_TOKEN_ADDRESS,
        ERC20_ABI,
        ethersProvider
      );
      
      // Get token decimals
      const decimals = await tokenContract.decimals();
      
      // Get balance
      const balance = await tokenContract.balanceOf(userAddress);
      
      // Format the balance
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error("Error getting balance:", error);
      return "0";
    }
  };

  // Send CPXTB tokens
  const sendCPXTB = async (to: string, amount: string): Promise<{ transactionHash: string; success: boolean }> => {
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    
    try {
      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      const signer = ethersProvider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Create contract instance for the CPXTB token
      const tokenContract = new ethers.Contract(
        CPXTB_TOKEN_ADDRESS,
        ERC20_ABI,
        signer
      );
      
      // Get token decimals
      const decimals = await tokenContract.decimals();
      
      // Parse amount to the correct format
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // Send transaction
      const tx = await tokenContract.transfer(to, parsedAmount);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        transactionHash: receipt.transactionHash,
        success: true
      };
    } catch (error) {
      console.error("Error sending CPXTB:", error);
      throw error;
    }
  };

  const value = {
    web3auth,
    provider,
    isLoading,
    isAuthenticated: !!provider,
    error,
    user,
    login,
    logout,
    getBalance,
    sendCPXTB,
    getChainId
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
};

export const useWeb3Auth = (): Web3AuthContextProps => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error("useWeb3Auth must be used within a Web3AuthProvider");
  }
  return context;
};