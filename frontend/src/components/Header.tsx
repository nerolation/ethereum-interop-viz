import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Chip,
  useTheme,
  styled,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useNetwork } from '../contexts/NetworkContext';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const NetworkButton = styled(Button)<{ selected?: boolean; networkcolor: string }>(
  ({ theme, selected, networkcolor }) => ({
    margin: theme.spacing(0, 0.5),
    color: selected ? '#fff' : theme.palette.text.primary,
    backgroundColor: selected ? networkcolor : 'transparent',
    '&:hover': {
      backgroundColor: selected
        ? networkcolor
        : theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
    },
  })
);

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

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const { networks, currentNetwork, setCurrentNetwork } = useNetwork();

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar>
        <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
          Ethereum Interop
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {networks.map((network) => (
            <NetworkButton
              key={network}
              selected={currentNetwork === network}
              networkcolor={getNetworkColor(network)}
              onClick={() => setCurrentNetwork(network)}
            >
              {network.charAt(0).toUpperCase() + network.slice(1)}
            </NetworkButton>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Chip
            label="Connected"
            color="success"
            size="small"
            sx={{ mr: 2 }}
          />
          <IconButton onClick={toggleDarkMode} color="inherit">
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 