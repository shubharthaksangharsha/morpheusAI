import React, { useState } from 'react';
import { 
  Box, 
  styled, 
  Typography, 
  IconButton, 
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

// Sample data for demo purposes
const samplePreviewItems = [
  {
    id: 'code-1',
    type: 'code' as const,
    title: 'Fibonacci Function',
    content: 
`function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}

// Calculate the first 10 Fibonacci numbers
const fibSequence = [];
for (let i = 0; i < 10; i++) {
  fibSequence.push(fibonacci(i));
}
console.log(fibSequence);`,
    language: 'javascript',
    createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
  },
  {
    id: 'text-1',
    type: 'text' as const,
    title: 'Project Description',
    content: 'Morpheus is an AI-powered agentic system that combines natural language processing, automated task execution, and visual interfaces to provide an intelligent assistant experience. The system features multiple specialized windows for different tasks, including code editing, terminal interaction, web browsing, planning, and tool integration.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
  },
  {
    id: 'image-1',
    type: 'image' as const,
    title: 'Generated Architecture Diagram',
    content: 'https://via.placeholder.com/800x600/eee?text=AI+Generated+Architecture+Diagram',
    createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
  },
];

// Styled components
const PreviewContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const PreviewHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const PreviewTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const PreviewActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const PreviewContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const TabsContainer = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
}));

const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

const PreviewItemCard = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

const PreviewItemHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 1.5),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const PreviewItemTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const PreviewItemContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  maxHeight: '400px',
  overflow: 'auto',
}));

const CodeBlock = styled(Box)(({ theme }) => ({
  fontFamily: '"Fira Code", monospace',
  fontSize: '0.875rem',
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  overflowX: 'auto',
  whiteSpace: 'pre',
}));

const ImagePreview = styled('img')({
  maxWidth: '100%',
  height: 'auto',
  display: 'block',
});

const TextPreview = styled('div')(({ theme }) => ({
  whiteSpace: 'pre-wrap',
  fontSize: '0.875rem',
  lineHeight: 1.5,
  color: theme.palette.text.primary,
}));

interface PreviewItemProps {
  item: {
    id: string;
    type: 'code' | 'text' | 'image';
    title: string;
    content: string;
    language?: string;
    createdAt: Date;
  };
}

const PreviewItem: React.FC<PreviewItemProps> = ({ item }) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };
  
  const handleCopyContent = () => {
    navigator.clipboard.writeText(item.content);
    handleCloseMenu();
  };
  
  const renderContent = () => {
    switch (item.type) {
      case 'code':
        return <CodeBlock>{item.content}</CodeBlock>;
      case 'image':
        return <ImagePreview src={item.content} alt={item.title} />;
      case 'text':
      default:
        return <TextPreview>{item.content}</TextPreview>;
    }
  };
  
  const getTypeIcon = () => {
    switch (item.type) {
      case 'code':
        return <CodeIcon fontSize="small" sx={{ color: 'primary.main' }} />;
      case 'image':
        return <ImageIcon fontSize="small" sx={{ color: 'secondary.main' }} />;
      case 'text':
      default:
        return <DescriptionIcon fontSize="small" sx={{ color: 'info.main' }} />;
    }
  };
  
  return (
    <PreviewItemCard>
      <PreviewItemHeader>
        <PreviewItemTitle>
          {getTypeIcon()}
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {item.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.createdAt.toLocaleTimeString()}
          </Typography>
        </PreviewItemTitle>
        <Box>
          <Tooltip title="More options">
            <IconButton size="small" onClick={handleOpenMenu}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={handleCopyContent}>
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Copy to clipboard" />
            </MenuItem>
            <MenuItem onClick={handleCloseMenu}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Download" />
            </MenuItem>
            <MenuItem onClick={handleCloseMenu}>
              <ListItemIcon>
                <ShareIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Share" />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleCloseMenu}>
              <ListItemIcon>
                <InfoOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="View details" />
            </MenuItem>
          </Menu>
        </Box>
      </PreviewItemHeader>
      <PreviewItemContent>
        {renderContent()}
      </PreviewItemContent>
    </PreviewItemCard>
  );
};

interface PreviewWindowProps {
  agentOnly?: boolean;
}

const PreviewWindow: React.FC<PreviewWindowProps> = ({ agentOnly = true }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel(zoomLevel + 10);
    }
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      setZoomLevel(zoomLevel - 10);
    }
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  return (
    <PreviewContainer>
      <PreviewHeader>
        <PreviewTitle>
          <VisibilityIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Preview</Typography>
        </PreviewTitle>
        <PreviewActions>
          {agentOnly && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Agent-controlled
            </Typography>
          )}
          <Tooltip title="Zoom in">
            <IconButton size="small" onClick={handleZoomIn}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom out">
            <IconButton size="small" onClick={handleZoomOut}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton size="small">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </PreviewActions>
      </PreviewHeader>
      
      <PreviewContent>
        <TabsContainer>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 36 }}
          >
            <Tab label="Recent" sx={{ minHeight: 36, textTransform: 'none' }} />
            <Tab label="Code" sx={{ minHeight: 36, textTransform: 'none' }} />
            <Tab label="Images" sx={{ minHeight: 36, textTransform: 'none' }} />
            <Tab label="Text" sx={{ minHeight: 36, textTransform: 'none' }} />
            <Tab label="Saved" sx={{ minHeight: 36, textTransform: 'none' }} />
          </Tabs>
        </TabsContainer>
        
        <ContentArea style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}>
          {activeTab === 0 && (
            <>
              {samplePreviewItems.length > 0 ? (
                samplePreviewItems.map(item => (
                  <PreviewItem key={item.id} item={item} />
                ))
              ) : (
                <EmptyState>
                  <FolderOpenIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    No preview items yet
                  </Typography>
                  <Box component="span" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem', display: 'block' }}>
                    Generate content from the Tools window or use the "Preview" options in other windows
                  </Box>
                  <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />} 
                    sx={{ mt: 2 }}
                  >
                    Refresh
                  </Button>
                </EmptyState>
              )}
            </>
          )}
          
          {activeTab === 1 && (
            <>
              {samplePreviewItems.filter(item => item.type === 'code').length > 0 ? (
                samplePreviewItems
                  .filter(item => item.type === 'code')
                  .map(item => (
                    <PreviewItem key={item.id} item={item} />
                  ))
              ) : (
                <EmptyState>
                  <CodeIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    No code previews yet
                  </Typography>
                  <Box component="span" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem', display: 'block' }}>
                    Generate code from the Tools window or use the code generation features
                  </Box>
                </EmptyState>
              )}
            </>
          )}
          
          {activeTab === 2 && (
            <>
              {samplePreviewItems.filter(item => item.type === 'image').length > 0 ? (
                samplePreviewItems
                  .filter(item => item.type === 'image')
                  .map(item => (
                    <PreviewItem key={item.id} item={item} />
                  ))
              ) : (
                <EmptyState>
                  <ImageIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    No image previews yet
                  </Typography>
                  <Box component="span" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem', display: 'block' }}>
                    Generate images from the Tools window or use image generation features
                  </Box>
                </EmptyState>
              )}
            </>
          )}
          
          {activeTab === 3 && (
            <>
              {samplePreviewItems.filter(item => item.type === 'text').length > 0 ? (
                samplePreviewItems
                  .filter(item => item.type === 'text')
                  .map(item => (
                    <PreviewItem key={item.id} item={item} />
                  ))
              ) : (
                <EmptyState>
                  <DescriptionIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                  <Typography variant="body1" gutterBottom>
                    No text previews yet
                  </Typography>
                  <Box component="span" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem', display: 'block' }}>
                    Generate text content from the Tools window or use text generation features
                  </Box>
                </EmptyState>
              )}
            </>
          )}
          
          {activeTab === 4 && (
            <EmptyState>
              <FolderOpenIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
              <Typography variant="body1" gutterBottom>
                No saved items yet
              </Typography>
              <Box component="span" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem', display: 'block' }}>
                Save items by using the "Save" option in the menu of any preview item
              </Box>
              <Button 
                variant="outlined" 
                startIcon={<RefreshIcon />} 
                sx={{ mt: 2 }}
              >
                Refresh
              </Button>
            </EmptyState>
          )}
        </ContentArea>
      </PreviewContent>
    </PreviewContainer>
  );
};

export default PreviewWindow; 