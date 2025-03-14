import React from 'react';
import {
  Box,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import { useClient } from '../contexts/ClientContext';

const ClientFilter: React.FC = () => {
  const theme = useTheme();
  const { clients, visibleClients, toggleClient, showAllClients, hideAllClients } = useClient();

  const getClientColor = (client: string): string => {
    switch (client.toLowerCase()) {
      case 'lighthouse':
        return '#3f51b5';
      case 'prysm':
        return '#f44336';
      case 'teku':
        return '#ff9800';
      case 'nimbus':
        return '#4caf50';
      case 'lodestar':
        return '#9c27b0';
      default:
        return '#607d8b';
    }
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Client Filters</Typography>
        <Box>
          <Button
            size="small"
            variant="outlined"
            onClick={showAllClients}
            sx={{ mr: 1 }}
          >
            Show All
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={hideAllClients}
          >
            Hide All
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <FormGroup row>
        {clients.map((client) => (
          <FormControlLabel
            key={client}
            control={
              <Checkbox
                checked={visibleClients.includes(client)}
                onChange={() => toggleClient(client)}
                sx={{
                  color: getClientColor(client),
                  '&.Mui-checked': {
                    color: getClientColor(client),
                  },
                }}
              />
            }
            label={client.charAt(0).toUpperCase() + client.slice(1)}
            sx={{ mr: 2 }}
          />
        ))}
      </FormGroup>
    </Paper>
  );
};

export default ClientFilter; 