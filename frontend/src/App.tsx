import React, { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import MorpheusLayout from './components/MorpheusLayout';
import HomePage from './components/HomePage';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  
  const theme = useMemo(() => 
    createTheme({
      palette: {
        mode: darkMode ? 'dark' : 'light',
        primary: {
          main: '#2196F3',
        },
        secondary: {
          main: '#FF4081',
        },
        background: {
          default: darkMode ? '#121212' : '#f5f5f5',
          paper: darkMode ? '#1E1E1E' : '#ffffff',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
            },
          },
        },
      },
    }),
  [darkMode]);
  
  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<MorpheusLayout toggleDarkMode={handleToggleDarkMode} isDarkMode={darkMode} />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App; 