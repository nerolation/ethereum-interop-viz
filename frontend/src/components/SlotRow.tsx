import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, styled, useTheme } from '@mui/material';
import SlotDetails from './SlotDetails';

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

interface SlotRowProps {
  client: string;
  slots: SlotData[];
  network: string;
}

const ClientLabel = styled(Box)(({ theme }) => ({
  width: '120px',
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  borderRight: `1px solid ${theme.palette.divider}`,
}));

const SlotContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
  },
}));

const SlotBox = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'status' && prop !== 'network' && prop !== 'proposerBoost',
})<{
  status: string;
  network: string;
  proposerBoost: boolean;
}>(({ theme, status, network, proposerBoost }) => {
  // Base colors for different statuses
  let backgroundColor;
  switch (status) {
    case 'produced':
      backgroundColor = proposerBoost ? '#1b5e20' : '#4caf50';
      break;
    case 'missed':
      backgroundColor = '#f44336';
      break;
    case 'reorged':
      backgroundColor = '#ff9800';
      break;
    default:
      backgroundColor = '#607d8b';
  }

  // Apply network-specific tint
  switch (network) {
    case 'sepolia':
      backgroundColor = status === 'produced' 
        ? proposerBoost ? '#4a148c' : '#9c27b0' 
        : status === 'missed' ? '#d32f2f' : '#ff5722';
      break;
    case 'holesky':
      // Fix for Holesky network - use different colors that work better
      backgroundColor = status === 'produced' 
        ? proposerBoost ? '#01579b' : '#03a9f4' 
        : status === 'missed' ? '#d32f2f' : '#ff5722';
      break;
    // mainnet uses default colors
  }

  return {
    margin: theme.spacing(0, 0.5),
    padding: theme.spacing(1),
    minWidth: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    color: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: theme.shadows[4],
    },
  };
});

const SlotRow: React.FC<SlotRowProps> = ({ client, slots, network }) => {
  const theme = useTheme();
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);

  useEffect(() => {
    console.log(`[ROW] Client ${client} received ${slots.length} slots for network ${network}`);
    if (slots.length > 0) {
      console.log(`[ROW] Slot numbers for ${client}: ${slots.map(s => s.slot).join(', ')}`);
    }
  }, [client, slots, network]);

  const handleSlotClick = (slot: SlotData) => {
    console.log(`[ROW] Slot ${slot.slot} clicked for client ${client}`);
    setSelectedSlot(slot);
  };

  const handleCloseDetails = () => {
    console.log('[ROW] Closing slot details');
    setSelectedSlot(null);
  };

  // Count how many slots have data for this client
  const slotsWithClientData = slots.filter(slot => slot.data && slot.data[client]).length;
  console.log(`[ROW] Client ${client} has data for ${slotsWithClientData} out of ${slots.length} slots`);

  // If no slots have data for this client, don't render the row
  if (slotsWithClientData === 0) {
    console.log(`[ROW] No slots have data for client ${client}, not rendering row`);
    return null;
  }

  return (
    <SlotContainer>
      <ClientLabel>
        <Typography variant="subtitle1" fontWeight="bold">
          {client.charAt(0).toUpperCase() + client.slice(1)}
        </Typography>
      </ClientLabel>
      
      <Box sx={{ display: 'flex', flexGrow: 1, overflowX: 'auto', p: 1 }}>
        {slots.map((slot) => {
          // Skip if slot data is undefined or this client doesn't have data for this slot
          if (!slot.data || !slot.data[client]) {
            console.log(`[ROW] No data for slot ${slot.slot} in client ${client}`);
            return null;
          }
          
          const slotData = slot.data[client];
          
          // Check if this slot has proposer boost (seen in less than 4 seconds)
          const proposerBoost = slotData.seconds_in_slot < 4;
          
          // Log more details about the slot data for debugging
          console.log(`[ROW] Rendering slot ${slot.slot} for client ${client}: status=${slotData.status}, proposerBoost=${proposerBoost}, hash=${slotData.hash || 'null'}`);
          
          return (
            <SlotBox
              key={slot.slot}
              status={slotData.status}
              network={network}
              proposerBoost={proposerBoost}
              onClick={() => handleSlotClick(slot)}
            >
              <Typography variant="body2">{slot.slot}</Typography>
            </SlotBox>
          );
        })}
      </Box>

      {selectedSlot && (
        <SlotDetails
          slot={selectedSlot}
          client={client}
          network={network}
          onClose={handleCloseDetails}
        />
      )}
    </SlotContainer>
  );
};

export default SlotRow; 