import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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

interface SlotDetailsProps {
  slot: SlotData;
  client: string;
  network: string;
  onClose: () => void;
}

const getNetworkColor = (network: string): string => {
  switch (network) {
    case 'mainnet':
      return '#4caf50';
    case 'sepolia':
      return '#9c27b0';
    case 'holesky':
      return '#f44336';
    default:
      return '#3f51b5';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'produced':
      return '#4caf50';
    case 'missed':
      return '#f44336';
    case 'reorged':
      return '#ff9800';
    default:
      return '#607d8b';
  }
};

const SlotDetails: React.FC<SlotDetailsProps> = ({ slot, client, network, onClose }) => {
  const theme = useTheme();
  const slotData = slot.data[client];

  if (!slotData) {
    return null;
  }

  const proposerBoost = slotData.seconds_in_slot < 4;

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Slot {slot.slot} Details
        </Typography>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Chip
              label={network.toUpperCase()}
              sx={{
                backgroundColor: getNetworkColor(network),
                color: '#fff',
                mr: 1,
              }}
              size="small"
            />
            <Chip
              label={slotData.status.toUpperCase()}
              sx={{
                backgroundColor: getStatusColor(slotData.status),
                color: '#fff',
                mr: 1,
              }}
              size="small"
            />
            {proposerBoost && (
              <Chip
                label="PROPOSER BOOST"
                sx={{
                  backgroundColor: '#1b5e20',
                  color: '#fff',
                }}
                size="small"
              />
            )}
          </Box>

          <Typography variant="subtitle1" fontWeight="bold">
            {client.charAt(0).toUpperCase() + client.slice(1)}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Slot Number
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {slotData.slot}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Timestamp
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {slotData.timestamp}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Seconds in Slot
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {slotData.seconds_in_slot}s
              {proposerBoost && (
                <Typography component="span" color="success.main" sx={{ ml: 1 }}>
                  (Proposer Boost)
                </Typography>
              )}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Typography
              variant="body1"
              fontWeight="medium"
              sx={{ color: getStatusColor(slotData.status) }}
            >
              {slotData.status.toUpperCase()}
            </Typography>
          </Box>

          {slotData.hash && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body2" color="text.secondary">
                Block Hash
              </Typography>
              <Typography
                variant="body1"
                fontWeight="medium"
                sx={{
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {slotData.hash}
              </Typography>
            </Box>
          )}

          {slotData.parent_hash && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="body2" color="text.secondary">
                Parent Hash
              </Typography>
              <Typography
                variant="body1"
                fontWeight="medium"
                sx={{
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {slotData.parent_hash}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlotDetails; 