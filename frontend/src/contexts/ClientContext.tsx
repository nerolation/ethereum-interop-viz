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

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [clients, setClients] = useState<string[]>([]);
  const [visibleClients, setVisibleClients] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('Fetching available clients...');
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/clients');
        console.log('Available clients:', response.data);
        setClients(response.data);
        setVisibleClients(response.data); // Initially show all clients
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to fetch available clients');
        // Set default clients if API fails
        console.log('Setting default clients due to API failure');
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
    console.log(`Toggling visibility of client: ${client}`);
    setVisibleClients(prev => {
      const newVisibleClients = prev.includes(client)
        ? prev.filter(c => c !== client)
        : [...prev, client];
      console.log('New visible clients:', newVisibleClients);
      return newVisibleClients;
    });
  };

  const showAllClients = () => {
    console.log('Showing all clients');
    setVisibleClients([...clients]);
  };

  const hideAllClients = () => {
    console.log('Hiding all clients');
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