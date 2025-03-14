import React from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';

interface CountdownTimerProps {
  countdown: number;
  refreshing: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ countdown, refreshing }) => {
  const theme = useTheme();
  
  // Calculate progress percentage for the circular progress
  const progress = (countdown / 12) * 100;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {refreshing ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body2">Refreshing...</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1 }}>
            <CircularProgress
              variant="determinate"
              value={progress}
              size={24}
              thickness={5}
              sx={{
                color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32',
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                component="div"
                color="text.secondary"
                sx={{ fontSize: '0.6rem' }}
              >
                {countdown}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2">
            Next update in {countdown}s
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CountdownTimer; 