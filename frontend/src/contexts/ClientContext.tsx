import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface ClientContextType {
  clients: string[];
  visibleClients: string[];
  toggleClient: (client: string) => void;
  showAllClients: () => void;
  hideAllClients: () => void;
  loading: boolean;
  error: string | null;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

interface ClientProviderProps {
  children: ReactNode;
}

// Get the API base URL based on environment
const getApiBaseUrl = () => {
  // In development, use the full URL
  if (process.env.NODE_ENV === 'development') {
    // Use port 5001 as a fallback if 5000 is in use
    const port = process.env.REACT_APP_API_PORT || '5000';
    return `http://localhost:${port}/api`;
  }
  // In production, use relative URLs
  return '/api';
};

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [clients, setClients] = useState<string[]>([]);
  const [visibleClients, setVisibleClients] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('[CLIENT] Fetching available clients...');
        setLoading(true);
        
        const response = await axios.get(`${getApiBaseUrl()}/clients`);
        console.log('[CLIENT] Available clients from API:', response.data);
        
        if (response.data.length === 0) {
          console.warn('[CLIENT] No clients available from API, using defaults');
          const defaultClients = ['lighthouse', 'prysm', 'teku', 'nimbus', 'lodestar'];
          setClients(defaultClients);
          setVisibleClients(defaultClients);
        } else {
          setClients(response.data);
          setVisibleClients(response.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('[CLIENT] Error fetching clients:', err);
        setError('Failed to fetch available clients');
        
        // Use default clients as fallback
        const defaultClients = ['lighthouse', 'prysm', 'teku', 'nimbus', 'lodestar'];
        setClients(defaultClients);
        setVisibleClients(defaultClients);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const toggleClient = (client: string) => {
    setVisibleClients((prev) => {
      if (prev.includes(client)) {
        console.log(`[CLIENT] Hiding client: ${client}`);
        return prev.filter((c) => c !== client);
      } else {
        console.log(`[CLIENT] Showing client: ${client}`);
        return [...prev, client];
      }
    });
  };

  const showAllClients = () => {
    console.log('[CLIENT] Showing all clients');
    setVisibleClients([...clients]);
  };

  const hideAllClients = () => {
    console.log('[CLIENT] Hiding all clients');
    setVisibleClients([]);
  };

  return (
    <ClientContext.Provider
      value={{
        clients,
        visibleClients,
        toggleClient,
        showAllClients,
        hideAllClients,
        loading,
        error,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = (): ClientContextType => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}; 