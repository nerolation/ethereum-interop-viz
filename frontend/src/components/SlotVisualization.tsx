import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Slider, CircularProgress, Alert, useTheme, Switch, FormControlLabel } from '@mui/material';
import axios from 'axios';
import { useNetwork } from '../contexts/NetworkContext';
import { useClient } from '../contexts/ClientContext';
import ClientFilter from './ClientFilter';
import SlotRow from './SlotRow';
import CountdownTimer from './CountdownTimer';
import DebugInfo from './DebugInfo';

interface SlotData {
  slot: number;
  data: {
    [client: string]: {
      slot: number;
      network: string;
      client: string;
      timestamp: string;
      status: string;
      hash?: string;
      parent_hash?: string;
      timestamp_seconds: number;
      seconds_in_slot: number;
    };
  };
}

// Get the API base URL based on environment
const getApiBaseUrl = () => {
  // In development, use the full URL
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }
  // In production, use relative URLs
  return '/api';
};

const SlotVisualization: React.FC = () => {
  const theme = useTheme();
  const { currentNetwork } = useNetwork();
  const { visibleClients } = useClient();
  
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleSlotCount, setVisibleSlotCount] = useState<number>(5);
  const [countdown, setCountdown] = useState<number>(12);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(true);
  const [minSlotCount, setMinSlotCount] = useState<number>(1);

  // Fetch slots data - simplified to avoid dependency loops
  const fetchSlots = useCallback(async () => {
    try {
      console.log(`[FETCH] Fetching slots for network: ${currentNetwork}`);
      setRefreshing(true);
      
      // Request 20 slots to ensure we have enough data
      const apiUrl = `${getApiBaseUrl()}/slots/${currentNetwork}?count=20`;
      console.log(`[FETCH] Making API request to ${apiUrl}`);
      const response = await axios.get(apiUrl);
      console.log(`[FETCH] Received ${response.data.length} slots from API`);
      
      if (response.data.length === 0) {
        console.warn('[FETCH] No slots received from API');
        setSlots([]);
        setVisibleSlotCount(0);
      } else {
        // Sort slots by slot number (descending) to ensure highest slots first
        const sortedSlots = [...response.data].sort((a, b) => b.slot - a.slot);
        console.log(`[FETCH] Sorted slots, highest: ${sortedSlots[0]?.slot}, lowest: ${sortedSlots[sortedSlots.length-1]?.slot}`);
        
        // Log all slot numbers for debugging
        console.log(`[FETCH] All slot numbers: ${sortedSlots.map(s => s.slot).join(', ')}`);
        
        // Check if any slots have data for the current clients
        const hasClientData = sortedSlots.some(slot => {
          return Object.keys(slot.data || {}).length > 0;
        });
        
        console.log(`[FETCH] Has client data: ${hasClientData}`);
        
        setSlots(sortedSlots);
        
        // Always show 5 slots or all available if less than 5
        const initialCount = Math.min(5, sortedSlots.length);
        console.log(`[FETCH] Setting visible slot count to ${initialCount}`);
        setVisibleSlotCount(initialCount);
      }
      
      setError(null);
    } catch (err) {
      console.error('[FETCH] Error fetching slots:', err);
      setError('Failed to fetch slot data');
      setSlots([]);
      setVisibleSlotCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(12); // Reset countdown after refresh
    }
  }, [currentNetwork]); // Only depend on currentNetwork

  // Initial data fetch
  useEffect(() => {
    console.log(`[NETWORK] Network changed to: ${currentNetwork}, fetching new data`);
    fetchSlots();
  }, [currentNetwork, fetchSlots]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.log('[TIMER] Countdown reached 0, fetching new data');
          fetchSlots(); // Fetch new data when countdown reaches 0
          return 12; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchSlots]);

  // Handle slider change
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    console.log(`[SLIDER] Visible slot count changed to: ${newValue}`);
    setVisibleSlotCount(newValue as number);
  };

  // Toggle debug info
  const handleToggleDebug = () => {
    setShowDebug(!showDebug);
  };

  if (loading && !refreshing) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // No need to sort again, slots are already sorted in fetchSlots
  
  // Get the visible number of slots based on visibleSlotCount
  const visibleSlots = slots.slice(0, Math.min(visibleSlotCount, slots.length));
  
  console.log(`[RENDER] Displaying ${visibleSlots.length} slots out of ${slots.length} available`);
  if (visibleSlots.length > 0) {
    console.log(`[RENDER] Highest visible slot: ${visibleSlots[0].slot}, lowest: ${visibleSlots[visibleSlots.length-1].slot}`);
  }
  
  // Display slots in ascending order (lowest to highest) so the highest slot is on the right
  const displaySlots = [...visibleSlots].sort((a, b) => a.slot - b.slot);
  
  if (displaySlots.length > 0) {
    console.log(`[RENDER] Display order (ascending): ${displaySlots.map(s => s.slot).join(', ')}`);
  }

  // Calculate the maximum value for the slider based on available slots
  const maxSliderValue = Math.min(20, slots.length);

  return (
    <Box>
      <ClientFilter />
      
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Visible Slots</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showDebug}
                  onChange={handleToggleDebug}
                  color="primary"
                />
              }
              label="Show Debug Info"
              sx={{ mr: 2 }}
            />
            <CountdownTimer countdown={countdown} refreshing={refreshing} />
          </Box>
        </Box>
        
        {slots.length > 0 ? (
          <Slider
            value={visibleSlotCount}
            onChange={handleSliderChange}
            aria-labelledby="visible-slots-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={1}
            max={maxSliderValue}
            disabled={slots.length <= 1}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            No slots available to display for this network.
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {refreshing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography>Refreshing data...</Typography>
        </Box>
      )}

      {showDebug && (
        <DebugInfo
          allSlots={slots}
          displaySlots={displaySlots}
          network={currentNetwork}
        />
      )}

      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {currentNetwork.charAt(0).toUpperCase() + currentNetwork.slice(1)} Slots
        </Typography>

        {visibleClients.length === 0 ? (
          <Alert severity="info">No clients selected. Please select at least one client to view slots.</Alert>
        ) : displaySlots.length === 0 ? (
          <Alert severity="info">No slot data available for the selected network.</Alert>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            {visibleClients.map((client) => (
              <SlotRow
                key={client}
                client={client}
                slots={displaySlots}
                network={currentNetwork}
              />
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SlotVisualization; 