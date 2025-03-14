import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

type Network = 'mainnet' | 'sepolia' | 'holesky';

interface NetworkContextType {
  networks: Network[];
  currentNetwork: Network;
  setCurrentNetwork: (network: Network) => void;
  loading: boolean;
  error: string | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networks, setNetworks] = useState<Network[]>(['mainnet', 'sepolia', 'holesky']);
  const [currentNetwork, setCurrentNetwork] = useState<Network>('mainnet');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available networks on mount only
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        console.log('[NETWORK] Fetching available networks...');
        setLoading(true);
        
        const response = await axios.get('http://localhost:5000/api/networks');
        console.log('[NETWORK] Available networks from API:', response.data);
        
        if (response.data.length === 0) {
          console.warn('[NETWORK] No networks available from API, using defaults');
          // Keep the default networks
        } else {
          setNetworks(response.data);
          console.log('[NETWORK] Updated networks list:', response.data);
          
          // Only switch the current network if the current one is not available
          if (!response.data.includes(currentNetwork)) {
            console.log(`[NETWORK] Current network ${currentNetwork} not available, switching to ${response.data[0]}`);
            setCurrentNetwork(response.data[0]);
          } else {
            console.log(`[NETWORK] Current network ${currentNetwork} is available, keeping it selected`);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('[NETWORK] Error fetching networks:', err);
        setError('Failed to fetch available networks');
        // Keep using default networks
      } finally {
        setLoading(false);
      }
    };

    fetchNetworks();
  }, []); // Only run on mount

  const handleNetworkChange = (network: Network) => {
    if (network === currentNetwork) {
      console.log(`[NETWORK] Already on network ${network}, no change needed`);
      return;
    }
    
    console.log(`[NETWORK] Switching network from ${currentNetwork} to ${network}`);
    
    // Add more detailed logging
    console.log(`[NETWORK] Available networks: ${networks.join(', ')}`);
    console.log(`[NETWORK] Network is valid: ${networks.includes(network)}`);
    
    // Set the current network
    setCurrentNetwork(network);
    
    // Log after state update (will be seen in next render)
    console.log(`[NETWORK] Network switched to ${network}, will trigger data fetch`);
  };

  return (
    <NetworkContext.Provider
      value={{
        networks,
        currentNetwork,
        setCurrentNetwork: handleNetworkChange,
        loading,
        error,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}; 