import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Container } from '@mui/material';
import Header from './components/Header';
import SlotVisualization from './components/SlotVisualization';
import { NetworkProvider } from './contexts/NetworkContext';
import { ClientProvider } from './contexts/ClientContext';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3f51b5',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        <CssBaseline />
        <NetworkProvider>
          <ClientProvider>
            <Box
              sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
                color: 'text.primary',
              }}
            >
              <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                <SlotVisualization />
              </Container>
            </Box>
          </ClientProvider>
        </NetworkProvider>
      </StyledThemeProvider>
    </ThemeProvider>
  );
}

export default App;
