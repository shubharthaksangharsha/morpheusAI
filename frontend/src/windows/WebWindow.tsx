import React, { useState, useRef } from 'react';
import { Box, TextField, Typography, styled, IconButton, InputAdornment, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import WebIcon from '@mui/icons-material/Web';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Styled components
const WindowContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const WindowHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const WindowTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const WindowActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const AddressBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StartBrowsing = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: theme.spacing(3),
  maxWidth: 400,
}));

const WebBrowserFrame = styled('iframe')({
  width: '100%',
  height: '100%',
  border: 'none',
});

interface WebWindowProps {
  initialUrl?: string;
  agentOnly?: boolean; // Add prop to control access
}

const WebWindow: React.FC<WebWindowProps> = ({ 
  initialUrl = '',
  agentOnly = true 
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!agentOnly) {
      setUrl(e.target.value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (agentOnly) return;
    
    if (e.key === 'Enter') {
      navigateToUrl();
    }
  };

  const navigateToUrl = () => {
    if (!url) return;
    
    // Add http:// prefix if missing
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      formattedUrl = 'https://' + url;
    }
    
    setCurrentUrl(formattedUrl);
    setIsLoading(true);
  };

  const navigateToHome = () => {
    setUrl('');
    setCurrentUrl('');
  };

  const refreshPage = () => {
    if (currentUrl) {
      setIsLoading(true);
      // Force iframe refresh
      setCurrentUrl('');
      setTimeout(() => {
        setCurrentUrl(currentUrl);
      }, 100);
    }
  };

  // Method for agent to control the browser
  const navigate = (targetUrl: string) => {
    if (!targetUrl) return;
    
    // Add http:// prefix if missing
    let formattedUrl = targetUrl;
    if (!/^https?:\/\//i.test(targetUrl)) {
      formattedUrl = 'https://' + targetUrl;
    }
    
    setUrl(targetUrl);
    setCurrentUrl(formattedUrl);
    setIsLoading(true);
  };

  return (
    <WindowContainer>
      <WindowHeader>
        <WindowTitle>
          <WebIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Web Browser</Typography>
        </WindowTitle>
        <WindowActions>
          {agentOnly && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Agent-controlled
            </Typography>
          )}
          <Tooltip title="Home">
            <IconButton size="small" onClick={navigateToHome}>
              <HomeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={refreshPage} disabled={!currentUrl}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="About this browser">
            <IconButton size="small">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </WindowActions>
      </WindowHeader>
      
      <AddressBar>
        <StyledTextField
          fullWidth
          size="small"
          placeholder="Enter URL or search term..."
          value={url}
          onChange={handleUrlChange}
          onKeyDown={handleKeyPress}
          disabled={agentOnly}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: !agentOnly && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={navigateToUrl}
                  disabled={!url}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          inputRef={inputRef}
        />
      </AddressBar>
      
      <ContentArea>
        {currentUrl ? (
          <WebBrowserFrame 
            src={currentUrl} 
            title="Web Browser"
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <StartBrowsing>
            <WebIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Start Browsing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {agentOnly 
                ? "This browser is controlled by the AI assistant. The assistant will load web pages as needed."
                : "Enter a URL in the address bar above or search for something to get started."}
            </Typography>
          </StartBrowsing>
        )}
      </ContentArea>
    </WindowContainer>
  );
};

// Add method to allow agent to control the browser
(WebWindow as any).navigate = (webWindowRef: any, url: string) => {
  if (webWindowRef.current && typeof webWindowRef.current.navigate === 'function') {
    webWindowRef.current.navigate(url);
  }
};

export default WebWindow; 