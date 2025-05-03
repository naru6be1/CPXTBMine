import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Web3Auth } from '@web3auth/modal';
import { CHAIN_NAMESPACES, IProvider } from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { ethers } from 'ethers';
import { CPXTB_TOKEN_ADDRESS, BASE_CHAIN_ID } from '@shared/constants';

// You'll need to get a Client ID from Web3Auth dashboard
// https://dashboard.web3auth.io/
const WEB3AUTH_CLIENT_ID = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || 'YOUR_WEB3AUTH_CLIENT_ID';

interface Web3AuthContextType {
  provider: IProvider | null;
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  web3Auth: Web3Auth | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getBalance: () => Promise<string>;
  sendCPXTB: (to: string, amount: string) => Promise<any>;
}

const Web3AuthContext = createContext<Web3AuthContextType | null>(null);

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthProvider');
  }
  return context;
};

interface Web3AuthProviderProps {
  children: ReactNode;
}

export const Web3AuthProvider: React.FC<Web3AuthProviderProps> = ({ children }) => {
  const [web3Auth, setWeb3Auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Web3Auth
        const web3auth = new Web3Auth({
          clientId: WEB3AUTH_CLIENT_ID,
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: `0x${BASE_CHAIN_ID.toString(16)}`, // Base chain ID in hex
            rpcTarget: 'https://mainnet.base.org', // Base RPC endpoint
          },
          uiConfig: {
            theme: 'light',
            loginMethodsOrder: ['google', 'apple', 'facebook'],
            appLogo: '/logo.svg',
          },
        });

        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: 'none',
          },
          adapterSettings: {
            network: 'mainnet',
            uxMode: 'popup',
          },
        });

        web3auth.configureAdapter(openloginAdapter);

        await web3auth.initModal();
        setWeb3Auth(web3auth);

        // Check if user is already logged in
        if (web3auth.connected) {
          const provider = web3auth.provider;
          setProvider(provider);
          setUser(web3auth.getUserInfo());
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to initialize Web3Auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3Auth) {
      throw new Error('Web3Auth not initialized');
    }
    try {
      setIsLoading(true);
      const provider = await web3Auth.connect();
      setProvider(provider);
      
      if (web3Auth.connected) {
        const userInfo = await web3Auth.getUserInfo();
        setUser(userInfo);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error during login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!web3Auth) {
      throw new Error('Web3Auth not initialized');
    }
    try {
      setIsLoading(true);
      await web3Auth.logout();
      setProvider(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getBalance = async (): Promise<string> => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();
      
      // Create ERC20 contract instance
      const tokenContract = new ethers.Contract(
        CPXTB_TOKEN_ADDRESS,
        ['function balanceOf(address) view returns (uint256)'],
        ethersProvider
      );
      
      // Get CPXTB balance
      const balance = await tokenContract.balanceOf(address);
      const formattedBalance = ethers.utils.formatUnits(balance, 18);
      return formattedBalance;
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  };

  const sendCPXTB = async (to: string, amount: string) => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      const signer = ethersProvider.getSigner();
      
      // Create ERC20 contract instance
      const tokenContract = new ethers.Contract(
        CPXTB_TOKEN_ADDRESS,
        ['function transfer(address, uint256) returns (bool)'],
        signer
      );
      
      // Convert amount to wei (assuming 18 decimals)
      const amountInWei = ethers.utils.parseUnits(amount, 18);
      
      // Send transaction
      const tx = await tokenContract.transfer(to, amountInWei);
      return await tx.wait();
    } catch (error) {
      console.error('Error sending CPXTB:', error);
      throw error;
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        provider,
        user,
        isLoading,
        isAuthenticated,
        web3Auth,
        login,
        logout,
        getBalance,
        sendCPXTB
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
};