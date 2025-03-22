import React, { useState, useRef, useEffect } from 'react';
import { Box, styled, Typography, IconButton, Paper, Tooltip, Select, MenuItem, FormControl, InputLabel, TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, InputAdornment, Tabs, Tab } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import CheckIcon from '@mui/icons-material/Check';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FormatPainterIcon from '@mui/icons-material/FormatPaint';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import NewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { useTheme } from '@mui/material/styles';

// Styled components
const EditorContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const EditorHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const EditorTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const EditorActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const EditorBody = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const EditorToolbar = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.5, 1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const CodeArea = styled('textarea')(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  border: 'none',
  resize: 'none',
  outline: 'none',
  fontFamily: '"Fira Code", monospace',
  fontSize: '0.9rem',
  lineHeight: 1.5,
  caretColor: theme.palette.primary.main,
  '&::selection': {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
  },
}));

const StatusBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  backgroundColor: theme.palette.background.default,
  borderTop: `1px solid ${theme.palette.divider}`,
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
  padding: 4,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
}));

const LineNumbersContainer = styled(Box)(({ theme }) => ({
  width: '40px',
  padding: theme.spacing(1.5, 0.5),
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.secondary,
  fontSize: '0.9rem',
  fontFamily: '"Fira Code", monospace',
  textAlign: 'right',
  userSelect: 'none',
  borderRight: `1px solid ${theme.palette.divider}`,
  overflowY: 'hidden',
}));

const EditorContent = styled(Box)({
  display: 'flex',
  flexGrow: 1,
  overflow: 'hidden',
});

const FilesPane = styled(Box)(({ theme }) => ({
  width: '220px',
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  overflowY: 'auto',
}));

const FilesPaneHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const SearchBox = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(1),
  '.MuiInputBase-root': {
    fontSize: '0.875rem',
  },
  '.MuiInputBase-input': {
    padding: theme.spacing(0.75, 1),
  },
}));

const FileTree = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(0.5),
  overflowY: 'auto',
}));

const FileItem = styled(Box, {
  shouldForwardProp: prop => prop !== 'isFolder' && prop !== 'active'
})<{ active?: boolean; isFolder?: boolean }>(({ theme, active, isFolder }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.75, 0.5),
  marginBottom: theme.spacing(0.25),
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  backgroundColor: active ? theme.palette.action.selected : 'transparent',
  '&:hover': {
    backgroundColor: active ? theme.palette.action.selected : theme.palette.action.hover,
  },
  paddingLeft: isFolder ? theme.spacing(0.5) : theme.spacing(2),
  fontSize: '0.875rem',
}));

const FolderName = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  fontWeight: 500,
  fontSize: '0.875rem',
}));

const FileName = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const MainEditor = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const TabsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const EditorTab = styled(Tab)(({ theme }) => ({
  minHeight: 36,
  textTransform: 'none',
  fontSize: '0.875rem',
  padding: theme.spacing(0.5, 1.5),
}));

const EditorArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  fontFamily: '"Fira Code", monospace',
  fontSize: '0.875rem',
  overflow: 'auto',
  padding: theme.spacing(0.5),
  backgroundColor: theme.palette.background.default,
}));

const CodeBlock = styled(Box, {
  shouldForwardProp: prop => prop !== 'readOnly'
})<{ readOnly?: boolean }>(({ theme, readOnly }) => ({
  fontFamily: '"Fira Code", monospace',
  fontSize: '0.875rem',
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  overflowX: 'auto',
  whiteSpace: 'pre',
  outline: 'none',
  border: readOnly ? 'none' : `1px solid ${theme.palette.divider}`,
  cursor: readOnly ? 'default' : 'text',
}));

const CodeEditor = styled(TextField)(({ theme }) => ({
  '.MuiInputBase-root': {
    fontFamily: '"Fira Code", monospace',
    fontSize: '0.875rem',
    padding: 0,
  },
  '.MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '.MuiInputBase-input': {
    padding: theme.spacing(1.5),
    lineHeight: 1.5,
  },
}));

// Mock file system data
interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
}

const sampleFileSystem: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        children: [
          {
            id: 'MorpheusLayout.tsx',
            name: 'MorpheusLayout.tsx',
            type: 'file',
            language: 'typescript',
            content: `import React, { useState } from 'react';
import { Box, Grid, styled } from '@mui/material';
import UserWindow from '../windows/UserWindow';
import TerminalWindow from '../windows/TerminalWindow';
import WebWindow from '../windows/WebWindow';
import EditorWindow from '../windows/EditorWindow';
import PlanWindow from '../windows/PlanWindow';
import ToolWindow from '../windows/ToolWindow';
import PreviewWindow from '../windows/PreviewWindow';

const LayoutContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
}));

const WindowsGrid = styled(Grid)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'hidden',
}));

const WindowWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  padding: theme.spacing(1),
}));

const MorpheusLayout = () => {
  const [messages, setMessages] = useState<any[]>([]);
  
  const handleSendMessage = (msg: any) => {
    setMessages([...messages, msg]);
  };
  
  return (
    <LayoutContainer>
      <WindowsGrid container spacing={0}>
        <Grid item xs={12} md={6} lg={4}>
          <WindowWrapper>
            <UserWindow messages={messages} onSendMessage={handleSendMessage} />
          </WindowWrapper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <WindowWrapper>
            <TerminalWindow />
          </WindowWrapper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <WindowWrapper>
            <WebWindow />
          </WindowWrapper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <WindowWrapper>
            <EditorWindow />
          </WindowWrapper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <WindowWrapper>
            <PlanWindow />
          </WindowWrapper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <WindowWrapper>
            <ToolWindow />
          </WindowWrapper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <WindowWrapper>
            <PreviewWindow />
          </WindowWrapper>
        </Grid>
      </WindowsGrid>
    </LayoutContainer>
  );
};

export default MorpheusLayout;`,
          },
          {
            id: 'HomePage.tsx',
            name: 'HomePage.tsx',
            type: 'file',
            language: 'typescript',
            content: `import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const HomeContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 700,
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  fontWeight: 300,
}));

const StartButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1, 4),
  fontWeight: 500,
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  color: theme.palette.common.white,
  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
  },
}));

const HomePage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/');
  };

  return (
    <HomeContainer maxWidth="md">
      <Title variant="h2">
        Morpheus AI
      </Title>
      <Subtitle variant="h5">
        An AI-Powered Agentic System
      </Subtitle>
      <Box mb={4}>
        <Typography variant="body1" paragraph>
          Morpheus is an intelligent assistant that combines language processing,
          task automation, and interactive interfaces to provide a seamless AI experience.
        </Typography>
        <Typography variant="body1" paragraph>
          With Morpheus, you can code, browse the web, run terminal commands, and plan projects,
          all within an integrated environment powered by cutting-edge AI technology.
        </Typography>
      </Box>
      <StartButton 
        variant="contained" 
        size="large"
        onClick={handleStart}
      >
        Get Started
      </StartButton>
    </HomeContainer>
  );
};

export default HomePage;`,
          }
        ]
      },
      {
        id: 'windows',
        name: 'windows',
        type: 'folder',
        children: [
          {
            id: 'UserWindow.tsx',
            name: 'UserWindow.tsx',
            type: 'file',
            language: 'typescript',
            content: `// UserWindow component code...`,
          },
          {
            id: 'TerminalWindow.tsx',
            name: 'TerminalWindow.tsx',
            type: 'file',
            language: 'typescript',
            content: `// TerminalWindow component code...`,
          }
        ]
      },
      {
        id: 'App.tsx',
        name: 'App.tsx',
        type: 'file',
        language: 'typescript',
        content: `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import MorpheusLayout from './components/MorpheusLayout';
import HomePage from './components/HomePage';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MorpheusLayout />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;`,
      },
      {
        id: 'index.tsx',
        name: 'index.tsx',
        type: 'file',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      }
    ]
  },
  {
    id: 'public',
    name: 'public',
    type: 'folder',
    children: [
      {
        id: 'index.html',
        name: 'index.html',
        type: 'file',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Morpheus - AI-Powered Agentic System" />
    <title>Morpheus</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,
      }
    ]
  },
  {
    id: 'package.json',
    name: 'package.json',
    type: 'file',
    language: 'json',
    content: `{
  "name": "morpheus",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.11.16",
    "@mui/material": "^5.13.0",
    "@types/node": "^16.18.27",
    "@types/react": "^18.2.6",
    "@types/react-dom": "^18.2.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.1",
    "react-scripts": "5.0.1",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,
  }
];

const languages = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'python', label: 'Python' },
];

interface TabData {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface EditorWindowProps {
  agentOnly?: boolean;
}

const EditorWindow: React.FC<EditorWindowProps> = ({ agentOnly = true }) => {
  const theme = useTheme();
  
  const [openTabs, setOpenTabs] = useState<TabData[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['src', 'src/components', 'src/windows']);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('file');
  const [newFileLanguage, setNewFileLanguage] = useState('typescript');
  
  const [editedContent, setEditedContent] = useState<{[key: string]: string}>({});
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleToggleFolder = (folderId: string) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };
  
  const handleFileClick = (file: FileNode) => {
    if (file.type === 'folder') {
      handleToggleFolder(file.id);
      return;
    }
    
    setActiveFile(file.id);
    
    // Check if the file is already open in a tab
    const existingTabIndex = openTabs.findIndex(tab => tab.id === file.id);
    
    if (existingTabIndex === -1) {
      // Open a new tab
      const newTab: TabData = {
        id: file.id,
        name: file.name,
        content: file.content || '',
        language: file.language || 'text',
      };
      
      setOpenTabs([...openTabs, newTab]);
      setActiveTab(file.id);
    } else {
      // Switch to existing tab
      setActiveTab(file.id);
    }
  };
  
  const handleTabClose = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);
    
    if (activeTab === tabId) {
      // If we closed the active tab, activate the last tab in the array or null if empty
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  const handleNewFileOpen = () => {
    setNewFileDialogOpen(true);
  };
  
  const handleNewFileClose = () => {
    setNewFileDialogOpen(false);
    setNewFileName('');
    setNewFileType('file');
    setNewFileLanguage('typescript');
  };
  
  const handleNewFileCreate = () => {
    // In a real app, this would actually create the file
    console.log('Creating new', newFileType, 'named', newFileName, 'with language', newFileLanguage);
    handleNewFileClose();
  };
  
  const findFile = (nodes: FileNode[], fileId: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === fileId) {
        return node;
      }
      
      if (node.type === 'folder' && node.children) {
        const found = findFile(node.children, fileId);
        if (found) return found;
      }
    }
    
    return null;
  };
  
  const filterFiles = (query: string, nodes: FileNode[]): FileNode[] => {
    if (!query) return nodes;
    
    return nodes.filter(node => {
      const matchesName = node.name.toLowerCase().includes(query.toLowerCase());
      
      if (node.type === 'folder' && node.children) {
        const filteredChildren = filterFiles(query, node.children);
        node.children = filteredChildren;
        return matchesName || filteredChildren.length > 0;
      }
      
      return matchesName;
    });
  };
  
  const renderFileTree = (nodes: FileNode[], level = 0) => {
    const filteredNodes = searchQuery ? filterFiles(searchQuery, [...nodes]) : nodes;
    
    return filteredNodes.map(node => {
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.includes(node.id);
        
        return (
          <Box key={node.id}>
            <FileItem 
              isFolder={true}
              onClick={() => handleFileClick(node)}
            >
              <FolderName>
                {isExpanded ? 
                  <Box sx={{ transform: 'rotate(90deg)', display: 'inline-flex' }}>{'›'}</Box> : 
                  <Box sx={{ display: 'inline-flex' }}>{'›'}</Box>
                }
                <FolderIcon fontSize="small" color="action" />
                {node.name}
              </FolderName>
            </FileItem>
            
            {isExpanded && node.children && (
              <Box sx={{ pl: 2 }}>
                {renderFileTree(node.children, level + 1)}
              </Box>
            )}
          </Box>
        );
      } else {
        return (
          <FileItem 
            key={node.id}
            active={node.id === activeFile ? true : undefined}
            onClick={() => handleFileClick(node)}
          >
            <FileName>
              <CodeIcon fontSize="small" color="action" />
              {node.name}
            </FileName>
          </FileItem>
        );
      }
    });
  };
  
  const activeTabData = openTabs.find(tab => tab.id === activeTab) || null;
  
  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeTab) {
      const newEditedContent = { ...editedContent };
      newEditedContent[activeTab] = event.target.value;
      setEditedContent(newEditedContent);
    }
  };
  
  const getCurrentContent = (tabId: string, originalContent: string) => {
    return editedContent[tabId] !== undefined ? editedContent[tabId] : originalContent;
  };
  
  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>
          <CodeIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Code Editor</Typography>
        </EditorTitle>
        <EditorActions>
          {agentOnly && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Agent-controlled
            </Typography>
          )}
          <Tooltip title="Run code">
            <IconButton size="small" color="primary">
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Format code">
            <IconButton size="small">
              <FormatPainterIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save file">
            <IconButton size="small">
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton size="small">
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </EditorActions>
      </EditorHeader>
      
      <EditorContent>
        <FilesPane>
          <FilesPaneHeader>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Explorer</Typography>
            <Tooltip title="New file or folder">
              <IconButton 
                size="small" 
                onClick={handleNewFileOpen}
                disabled={agentOnly}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </FilesPaneHeader>
          
          <SearchBox
            placeholder="Search files"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={agentOnly}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <FileTree>
            {renderFileTree(sampleFileSystem)}
          </FileTree>
        </FilesPane>
        
        <MainEditor>
          <TabsContainer>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ flexGrow: 1, minHeight: 36 }}
            >
              {openTabs.map(tab => (
                <EditorTab
                  key={tab.id}
                  value={tab.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{tab.name}</span>
                      <CloseIcon 
                        fontSize="small" 
                        sx={{ fontSize: 16, opacity: 0.7 }}
                        onClick={(e) => handleTabClose(tab.id, e)}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>
            
            <Box sx={{ px: 1 }}>
              {activeTabData && (
                <Chip 
                  label={activeTabData.language} 
                  size="small" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 20,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)'
                  }} 
                />
              )}
            </Box>
          </TabsContainer>
          
          <EditorArea>
            {activeTabData ? (
              agentOnly ? (
                <CodeBlock readOnly>{activeTabData.content}</CodeBlock>
              ) : (
                <CodeEditor
                  fullWidth
                  multiline
                  variant="outlined"
                  value={getCurrentContent(activeTabData.id, activeTabData.content)}
                  onChange={handleContentChange}
                  InputProps={{
                    style: { 
                      fontFamily: '"Fira Code", monospace',
                      fontSize: '0.875rem',
                      backgroundColor: theme.palette.background.default,
                    }
                  }}
                />
              )
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  color: 'text.secondary' 
                }}
              >
                <CodeIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                <Typography variant="body1" gutterBottom>
                  No file open
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select a file from the explorer to start editing
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />} 
                  size="small"
                  onClick={handleNewFileOpen}
                  disabled={agentOnly}
                >
                  Create New File
                </Button>
              </Box>
            )}
          </EditorArea>
          
          <StatusBar>
            <Box>
              {activeTabData && (
                <>
                  <Typography component="span" variant="caption">
                    Lines: {(activeTab && editedContent[activeTab] 
                      ? editedContent[activeTab].split('\n').length 
                      : activeTabData.content.split('\n').length)}
                  </Typography>
                  <Typography component="span" variant="caption" sx={{ ml: 2 }}>
                    Characters: {(activeTab && editedContent[activeTab] 
                      ? editedContent[activeTab].length 
                      : activeTabData.content.length)}
                  </Typography>
                </>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {agentOnly ? "Read Only" : "Editing"} | UTF-8
            </Typography>
          </StatusBar>
        </MainEditor>
      </EditorContent>
      
      <Dialog open={newFileDialogOpen} onClose={handleNewFileClose}>
        <DialogTitle>Create New {newFileType === 'file' ? 'File' : 'Folder'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="new-item-type-label">Type</InputLabel>
              <Select
                labelId="new-item-type-label"
                value={newFileType}
                label="Type"
                onChange={(e) => setNewFileType(e.target.value)}
              >
                <MenuItem value="file">File</MenuItem>
                <MenuItem value="folder">Folder</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              type="text"
              fullWidth
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {newFileType === 'file' ? <CodeIcon fontSize="small" /> : <NewFolderIcon fontSize="small" />}
                  </InputAdornment>
                ),
              }}
            />
            
            {newFileType === 'file' && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel id="language-select-label">Language</InputLabel>
                <Select
                  labelId="language-select-label"
                  value={newFileLanguage}
                  label="Language"
                  onChange={(e) => setNewFileLanguage(e.target.value)}
                >
                  {languages.map(lang => (
                    <MenuItem key={lang.value} value={lang.value}>{lang.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewFileClose}>Cancel</Button>
          <Button onClick={handleNewFileCreate} color="primary" disabled={!newFileName}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </EditorContainer>
  );
};

export default EditorWindow; 