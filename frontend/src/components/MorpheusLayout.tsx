import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Grid, 
  styled, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Button,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import TerminalIcon from '@mui/icons-material/Terminal';
import WebIcon from '@mui/icons-material/Web';
import CodeIcon from '@mui/icons-material/Code';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import BuildIcon from '@mui/icons-material/Build';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import UserWindow from '../windows/UserWindow';
import TerminalWindow from '../windows/TerminalWindow';
import WebWindow from '../windows/WebWindow';
import EditorWindow from '../windows/EditorWindow';
import PlanWindow from '../windows/PlanWindow';
import ToolWindow from '../windows/ToolWindow';
import PreviewWindow from '../windows/PreviewWindow';

// Styled components
const LayoutContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
}));

const AppHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  height: '48px',
}));

const AppTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.25rem',
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const MainContent = styled(Box)({
  display: 'flex',
  flexGrow: 1,
  overflow: 'hidden',
});

const LeftPane = styled(Box)(({ theme }) => ({
  width: '35%',
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('lg')]: {
    width: '40%',
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
  },
}));

const RightPane = styled(Box)(({ theme }) => ({
  width: '65%',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('lg')]: {
    width: '60%',
  },
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const UserWindowContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
}));

const SettingsSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const SettingItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(1),
}));

const GridContainer = styled(Grid)(({ theme }) => ({
  height: '100%',
}));

const WindowWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(1),
}));

const TabsContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const WindowContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'hidden',
  height: 'calc(100% - 48px)', // Account for tab height
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 48,
  textTransform: 'none',
  fontWeight: 500,
}));

// Add new styled components for the user control button
const UserControlButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(2),
  top: theme.spacing(2),
  zIndex: 1000,
  textTransform: 'none',
}));

interface MorpheusLayoutProps {
  toggleDarkMode?: () => void;
  isDarkMode?: boolean;
}

const MorpheusLayout: React.FC<MorpheusLayoutProps> = ({ toggleDarkMode, isDarkMode = false }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [userControlled, setUserControlled] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleSendMessage = (msg: any) => {
    setMessages([...messages, msg]);
    // In a real app, this would trigger actions in other windows
  };
  
  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
  };
  
  const handleAutoSaveToggle = () => {
    setAutoSave(!autoSave);
  };

  const toggleUserControl = useCallback(() => {
    const newState = !userControlled;
    setUserControlled(newState);
    
    // Show notification when control changes
    if (newState) {
      setSnackbarMessage("You now have control of all tools");
    } else {
      setSnackbarMessage("Agent has regained control of tools");
    }
    setSnackbarOpen(true);
  }, [userControlled]);
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <LayoutContainer>
      <AppHeader>
        <AppTitle variant="h6">
          Morpheus AI
        </AppTitle>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small">
            <HelpIcon fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      </AppHeader>
      
      <MainContent>
        <LeftPane>
          <UserWindowContainer>
            <UserWindow 
              onMessageToTerminal={(message) => console.log('Terminal:', message)}
              onMessageToEditor={(message) => console.log('Editor:', message)}
              onMessageToWebBrowser={(message) => console.log('Web:', message)}
              onMessageToPreview={(message) => console.log('Preview:', message)}
              onMessageToPlan={(message) => console.log('Plan:', message)}
              onMessageToTool={(message) => console.log('Tool:', message)}
            />
          </UserWindowContainer>
          
          <SettingsSection>
            <Typography variant="subtitle2" gutterBottom>
              Settings
            </Typography>
            <Divider sx={{ my: 1 }} />
            
            <SettingItem>
              <FormControlLabel
                control={
                  <Switch 
                    size="small" 
                    checked={isDarkMode} 
                    onChange={toggleDarkMode}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isDarkMode ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                    <Typography variant="body2">Dark Mode</Typography>
                  </Box>
                }
              />
            </SettingItem>
            
            <SettingItem>
              <FormControlLabel
                control={
                  <Switch 
                    size="small" 
                    checked={notifications} 
                    onChange={handleNotificationsToggle}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {notifications ? <NotificationsIcon fontSize="small" /> : <NotificationsOffIcon fontSize="small" />}
                    <Typography variant="body2">Notifications</Typography>
                  </Box>
                }
              />
            </SettingItem>
            
            <SettingItem>
              <FormControlLabel
                control={
                  <Switch 
                    size="small" 
                    checked={autoSave} 
                    onChange={handleAutoSaveToggle}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2">Auto-save</Typography>
                  </Box>
                }
              />
            </SettingItem>
            
            {/* Add user control toggle */}
            <SettingItem>
              <FormControlLabel
                control={
                  <Switch 
                    size="small" 
                    checked={userControlled} 
                    onChange={toggleUserControl}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {userControlled ? <PersonIcon fontSize="small" /> : <AdminPanelSettingsIcon fontSize="small" />}
                    <Typography variant="body2">User Control</Typography>
                  </Box>
                }
              />
            </SettingItem>
          </SettingsSection>
        </LeftPane>
        
        <RightPane>
          <TabsContainer>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="agent tools tabs"
            >
              <StyledTab icon={<TerminalIcon />} label="Terminal" />
              <StyledTab icon={<WebIcon />} label="Web" />
              <StyledTab icon={<CodeIcon />} label="Editor" />
              <StyledTab icon={<PlaylistAddCheckIcon />} label="Planner" />
              <StyledTab icon={<BuildIcon />} label="Tools" />
              <StyledTab icon={<VisibilityIcon />} label="Preview" />
            </Tabs>
          </TabsContainer>
          
          <WindowContainer>
            {activeTab === 0 && <TerminalWindow agentOnly={!userControlled} />}
            {activeTab === 1 && <WebWindow agentOnly={!userControlled} />}
            {activeTab === 2 && <EditorWindow agentOnly={!userControlled} />}
            {activeTab === 3 && <PlanWindow agentOnly={!userControlled} />}
            {activeTab === 4 && <ToolWindow agentOnly={!userControlled} />}
            {activeTab === 5 && <PreviewWindow agentOnly={!userControlled} />}
          </WindowContainer>
        </RightPane>
      </MainContent>
      
      {/* Add snackbar notification */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={userControlled ? "warning" : "info"} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </LayoutContainer>
  );
};

export default MorpheusLayout; 