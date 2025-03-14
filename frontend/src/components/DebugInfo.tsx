import React, { useEffect } from 'react';
import { Box, Paper, Typography, Divider, useTheme } from '@mui/material';

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

interface DebugInfoProps {
  allSlots: SlotData[];
  displaySlots: SlotData[];
  network: string;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ allSlots, displaySlots, network }) => {
  const theme = useTheme();

  // Sort all slots by slot number (descending)
  const sortedAllSlots = [...allSlots].sort((a, b) => b.slot - a.slot);
  
  // Get min and max slot numbers if available
  const minSlot = sortedAllSlots.length > 0 ? Math.min(...sortedAllSlots.map(s => s.slot)) : 'N/A';
  const maxSlot = sortedAllSlots.length > 0 ? Math.max(...sortedAllSlots.map(s => s.slot)) : 'N/A';
  
  // Get the highest slot being displayed
  const highestDisplayedSlot = displaySlots.length > 0 ? Math.max(...displaySlots.map(s => s.slot)) : 'N/A';

  // Log debug information
  useEffect(() => {
    console.log(`[DEBUG] Network: ${network}, Total slots: ${allSlots.length}, Displayed: ${displaySlots.length}`);
    if (allSlots.length > 0) {
      console.log(`[DEBUG] Slot range: ${minSlot} to ${maxSlot}`);
    }
    if (displaySlots.length > 0) {
      console.log(`[DEBUG] Displayed slots: ${displaySlots.map(s => s.slot).join(', ')}`);
      console.log(`[DEBUG] Highest displayed slot: ${highestDisplayedSlot}`);
    }
  }, [network, allSlots, displaySlots, minSlot, maxSlot, highestDisplayedSlot]);

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Debug Information
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Network: {network}
        </Typography>
        <Typography variant="body2">
          Total slots available: {allSlots.length}
        </Typography>
        <Typography variant="body2">
          Slots being displayed: {displaySlots.length}
        </Typography>
        {allSlots.length > 0 && (
          <>
            <Typography variant="body2">
              Slot range: {minSlot} to {maxSlot}
            </Typography>
            <Typography variant="body2">
              Slot difference: {Number(maxSlot) - Number(minSlot)}
            </Typography>
            {displaySlots.length > 0 && (
              <Typography variant="body2" fontWeight="bold" color="primary">
                Highest displayed slot: {highestDisplayedSlot}
              </Typography>
            )}
          </>
        )}
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          All Available Slots:
        </Typography>
        {sortedAllSlots.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No slots available for this network.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: '150px', overflowY: 'auto' }}>
            {sortedAllSlots.map((slot) => {
              const isDisplayed = displaySlots.some(s => s.slot === slot.slot);
              const isHighest = slot.slot === highestDisplayedSlot;
              
              return (
                <Box
                  key={slot.slot}
                  sx={{
                    p: 0.5,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    borderRadius: 1,
                    backgroundColor: isHighest
                      ? theme.palette.primary.main
                      : isDisplayed
                        ? theme.palette.success.light
                        : 'transparent',
                    color: isHighest ? 'white' : 'inherit',
                  }}
                >
                  <Typography variant="body2" sx={{ color: isHighest ? 'white' : 'inherit' }}>
                    {slot.slot}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
      
      <Box>
        <Typography variant="subtitle1" fontWeight="bold">
          Displayed Slots:
        </Typography>
        {displaySlots.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No slots are currently being displayed.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {displaySlots.map((slot) => {
              const isHighest = slot.slot === highestDisplayedSlot;
              
              return (
                <Box
                  key={slot.slot}
                  sx={{
                    p: 0.5,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    borderRadius: 1,
                    backgroundColor: isHighest
                      ? theme.palette.primary.main
                      : theme.palette.success.light,
                    color: isHighest ? 'white' : 'inherit',
                  }}
                >
                  <Typography variant="body2" sx={{ color: isHighest ? 'white' : 'inherit' }}>
                    {slot.slot}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default DebugInfo; 