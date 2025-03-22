import React, { useState } from 'react';
import { 
  Box, 
  styled, 
  Typography, 
  IconButton, 
  Tooltip, 
  Grid, 
  Paper, 
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import TranslateIcon from '@mui/icons-material/Translate';
import ImageIcon from '@mui/icons-material/Image';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import DescriptionIcon from '@mui/icons-material/Description';
import DataObjectIcon from '@mui/icons-material/DataObject';
import BarChartIcon from '@mui/icons-material/BarChart';
import StorageIcon from '@mui/icons-material/Storage';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BiotechIcon from '@mui/icons-material/Biotech';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';

// Styled components
const ToolsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const ToolsHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ToolsTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ToolsActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const ToolsContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(1.5),
}));

const ToolCard = styled(Paper, {
  shouldForwardProp: prop => prop !== 'active'
})<{ active?: boolean }>(({ theme, active }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  backgroundColor: active ? theme.palette.action.selected : theme.palette.background.default,
  border: active ? `1px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  height: '100%',
  '&:hover': {
    backgroundColor: active ? theme.palette.action.selected : theme.palette.action.hover,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
}));

const ToolIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '50%',
  backgroundColor: theme.palette.background.paper,
  marginBottom: theme.spacing(0.5),
}));

const ToolName = styled(Typography)({
  fontWeight: 500,
  textAlign: 'center',
  fontSize: '0.875rem',
});

const ToolDescription = styled(Typography)({
  textAlign: 'center',
  fontSize: '0.75rem',
  color: 'text.secondary',
  flexGrow: 1,
});

const ActiveToolContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
}));

const ActiveToolHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const ActiveToolContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const StatusChip = styled(Chip, {
  shouldForwardProp: prop => prop !== 'status'
})<{ status: 'idle' | 'running' | 'error' | 'success' }>(({ theme, status }) => {
  const colors = {
    idle: theme.palette.text.secondary,
    running: theme.palette.info.main,
    error: theme.palette.error.main,
    success: theme.palette.success.main,
  };
  
  return {
    backgroundColor: 'transparent',
    border: `1px solid ${colors[status]}`,
    color: colors[status],
  };
});

// Define tool types
interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'ai' | 'data' | 'media' | 'dev';
}

interface ToolWindowProps {
  agentOnly?: boolean;
}

const ToolWindow: React.FC<ToolWindowProps> = ({ agentOnly = true }) => {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<'idle' | 'running' | 'error' | 'success'>('idle');
  const [toolOutput, setToolOutput] = useState<string | null>(null);
  
  const tools: Tool[] = [
    {
      id: 'text-gen',
      name: 'Text Generation',
      description: 'Generate text content using AI models',
      icon: <DescriptionIcon color="primary" />,
      category: 'ai',
    },
    {
      id: 'code-gen',
      name: 'Code Generation',
      description: 'Generate code snippets for various languages',
      icon: <DataObjectIcon color="primary" />,
      category: 'dev',
    },
    {
      id: 'image-gen',
      name: 'Image Generation',
      description: 'Create images from text descriptions',
      icon: <ImageIcon color="primary" />,
      category: 'media',
    },
    {
      id: 'translator',
      name: 'Translator',
      description: 'Translate text between languages',
      icon: <TranslateIcon color="primary" />,
      category: 'ai',
    },
    {
      id: 'speech-to-text',
      name: 'Speech to Text',
      description: 'Convert spoken language to written text',
      icon: <AudiotrackIcon color="primary" />,
      category: 'media',
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis',
      description: 'Analyze and visualize data sets',
      icon: <BarChartIcon color="primary" />,
      category: 'data',
    },
    {
      id: 'db-query',
      name: 'Database Query',
      description: 'Generate and execute database queries',
      icon: <StorageIcon color="primary" />,
      category: 'data',
    },
    {
      id: 'text-enhancement',
      name: 'Text Enhancement',
      description: 'Enhance, summarize, or transform text',
      icon: <AutoFixHighIcon color="primary" />,
      category: 'ai',
    },
  ];
  
  const activeTool = tools.find(tool => tool.id === activeToolId) || null;
  
  const handleToolSelect = (toolId: string) => {
    if (toolStatus === 'running') {
      return; // Don't allow changing tools while one is running
    }
    
    setActiveToolId(toolId);
    setToolStatus('idle');
    setToolOutput(null);
  };
  
  const handleRunTool = () => {
    if (!activeTool || toolStatus === 'running') return;
    
    setToolStatus('running');
    setToolOutput(null);
    
    // Simulate running the tool with a delay
    setTimeout(() => {
      const outputs = {
        'text-gen': 'Generated text: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquam ultricies, nunc nunc aliquet nunc, vitae aliquam nisl nunc eget nunc.',
        'code-gen': `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}`,
        'image-gen': 'Image generated successfully. Preview available in the Preview window.',
        'translator': 'Translated text: Bonjour le monde! Comment ça va aujourd\'hui?',
        'speech-to-text': 'Transcribed text: Hello world, this is a speech to text demonstration.',
        'data-analysis': 'Data analysis complete. 3 trends identified. 2 anomalies detected.',
        'db-query': 'SQL Query generated: SELECT * FROM users WHERE signup_date > \'2023-01-01\' ORDER BY last_login DESC',
        'text-enhancement': 'Enhanced text: The artificial intelligence capabilities demonstrated in this application showcase cutting-edge technology.',
      };
      
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        setToolStatus('success');
        setToolOutput(outputs[activeTool.id as keyof typeof outputs] || 'Operation completed successfully.');
      } else {
        setToolStatus('error');
        setToolOutput('Error: Failed to process request. Please try again.');
      }
    }, 2000);
  };
  
  const handleStopTool = () => {
    if (toolStatus !== 'running') return;
    
    setToolStatus('idle');
    setToolOutput('Operation canceled by user.');
  };
  
  const handleResetTool = () => {
    if (toolStatus === 'running') return;
    
    setToolStatus('idle');
    setToolOutput(null);
  };
  
  return (
    <ToolsContainer>
      <ToolsHeader>
        <ToolsTitle>
          <BuildIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>AI Tools</Typography>
        </ToolsTitle>
        <ToolsActions>
          {agentOnly && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Agent-controlled
            </Typography>
          )}
          <Tooltip title="Run tool">
            <span> {/* Wrapper to handle disabled state with tooltip */}
              <IconButton 
                size="small" 
                color="primary"
                onClick={handleRunTool}
                disabled={!activeTool || toolStatus === 'running' || agentOnly}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Stop processing">
            <span>
              <IconButton 
                size="small" 
                color="error"
                onClick={handleStopTool}
                disabled={toolStatus !== 'running' || agentOnly}
              >
                <StopIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reset tool">
            <span>
              <IconButton 
                size="small"
                onClick={handleResetTool}
                disabled={!activeTool || toolStatus === 'running' || (!toolOutput && toolStatus === 'idle') || agentOnly}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </ToolsActions>
      </ToolsHeader>
      
      <ToolsContent>
        <Grid container spacing={1.5}>
          {tools.map((tool) => (
            <Grid item xs={6} sm={4} key={tool.id}>
              <ToolCard 
                active={activeToolId === tool.id ? true : undefined}
                onClick={() => handleToolSelect(tool.id)}
              >
                <ToolIconWrapper>
                  {tool.icon}
                </ToolIconWrapper>
                <ToolName variant="body2">{tool.name}</ToolName>
                <ToolDescription variant="caption">{tool.description}</ToolDescription>
                <Chip 
                  label={tool.category} 
                  size="small" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 20,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)'
                  }} 
                />
              </ToolCard>
            </Grid>
          ))}
        </Grid>
        
        {activeTool && (
          <ActiveToolContainer>
            <ActiveToolHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {activeTool.icon}
                </Box>
                <Typography variant="body2" fontWeight={500}>
                  {activeTool.name}
                </Typography>
              </Box>
              <StatusChip 
                size="small" 
                label={toolStatus === 'running' ? 'Processing...' : toolStatus}
                status={toolStatus}
                icon={toolStatus === 'running' ? <CircularProgress size={12} /> : undefined}
              />
            </ActiveToolHeader>
            <ActiveToolContent>
              {toolStatus === 'error' && (
                <Alert severity="error" variant="outlined">
                  {toolOutput}
                </Alert>
              )}
              
              {toolStatus === 'success' && (
                <Alert severity="success" variant="outlined">
                  Operation completed successfully
                </Alert>
              )}
              
              {toolOutput && toolStatus !== 'error' && (
                <Box 
                  sx={{ 
                    p: 1.5, 
                    backgroundColor: 'background.paper', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    fontFamily: toolOutput.includes('function') ? '"Fira Code", monospace' : 'inherit',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {toolOutput}
                </Box>
              )}
              
              {toolStatus === 'idle' && !toolOutput && (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <BiotechIcon sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Select a tool and press the play button to start processing
                  </Typography>
                </Box>
              )}
            </ActiveToolContent>
          </ActiveToolContainer>
        )}
      </ToolsContent>
    </ToolsContainer>
  );
};

export default ToolWindow; 