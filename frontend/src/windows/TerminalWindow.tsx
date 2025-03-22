import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Typography, styled, IconButton, Paper, Tooltip, Button } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import TerminalIcon from '@mui/icons-material/Terminal';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';

// Styled components
const TerminalContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#1e1e2e',
  color: '#cdd6f4',
  fontFamily: '"Fira Code", monospace',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const TerminalHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0.75, 1),
  backgroundColor: '#181825',
  borderBottom: '1px solid #313244',
}));

const TerminalTitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const TerminalActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
}));

const TerminalBody = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(1.5),
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#45475a',
    borderRadius: '4px',
  },
}));

const TerminalInput = styled(TextField)(({ theme }) => ({
  marginTop: theme.spacing(1),
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'transparent',
    color: '#cdd6f4',
    caretColor: '#89b4fa',
    fontFamily: '"Fira Code", monospace',
    '&.Mui-focused fieldset': {
      borderColor: '#89b4fa',
      borderWidth: '1px',
    },
    '& fieldset': {
      borderColor: '#313244',
    },
    '&:hover fieldset': {
      borderColor: '#45475a',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: '"Fira Code", monospace',
    fontSize: '0.9rem',
  },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: '#6c7086',
  padding: 4,
  '&:hover': {
    backgroundColor: '#313244',
    color: '#cdd6f4',
  },
}));

const CommandLine = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(0.75),
  animation: 'fadeIn 0.2s ease-out forwards',
}));

const CommandPrompt = styled(Typography)(({ theme }) => ({
  color: '#89b4fa',
  marginRight: theme.spacing(1),
  fontWeight: 'bold',
  userSelect: 'none',
}));

const CommandText = styled(Typography)(({ theme }) => ({
  color: '#cdd6f4',
  wordBreak: 'break-word',
}));

const OutputText = styled(Typography)(({ theme }) => ({
  color: '#bac2de',
  fontSize: '0.9rem',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontFamily: '"Fira Code", monospace',
}));

const ErrorText = styled(Typography)(({ theme }) => ({
  color: '#f38ba8',
  fontSize: '0.9rem',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontFamily: '"Fira Code", monospace',
}));

const SuccessText = styled(Typography)(({ theme }) => ({
  color: '#a6e3a1',
  fontSize: '0.9rem',
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  fontFamily: '"Fira Code", monospace',
}));

// Types
interface TerminalCommand {
  command: string;
  output: string;
  type: 'standard' | 'error' | 'success';
  timestamp: Date;
}

interface TerminalWindowProps {
  agentOnly?: boolean;
  onTakeControl?: () => void;
}

const TerminalWindow: React.FC<TerminalWindowProps> = ({ 
  agentOnly = true,
  onTakeControl
}) => {
  const [commands, setCommands] = useState<TerminalCommand[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copySuccess, setCopySuccess] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [commands]);

  const processCommand = (cmd: string) => {
    const lowerCmd = cmd.toLowerCase().trim();
    
    // Add to history
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    
    let output = '';
    let type: 'standard' | 'error' | 'success' = 'standard';
    
    // Simple command processing
    if (lowerCmd === 'clear' || lowerCmd === 'cls') {
      setCommands([]);
      return;
    } else if (lowerCmd === 'help') {
      output = 'Available commands:\n- help: Show this help\n- clear: Clear terminal\n- ls: List files\n- cd: Change directory\n- echo: Echo text\n- date: Show current date/time';
      type = 'standard';
    } else if (lowerCmd.startsWith('echo ')) {
      output = cmd.substring(5);
      type = 'standard';
    } else if (lowerCmd === 'date') {
      output = new Date().toString();
      type = 'standard';
    } else if (lowerCmd === 'ls') {
      output = 'Documents/\nProjects/\nscript.js\nREADME.md\nconfig.json';
      type = 'standard';
    } else if (lowerCmd.startsWith('cd ')) {
      output = `Changed directory to ${cmd.substring(3)}`;
      type = 'success';
    } else {
      output = `Command not found: ${cmd}`;
      type = 'error';
    }
    
    const newCommand: TerminalCommand = {
      command: cmd,
      output,
      type,
      timestamp: new Date(),
    };
    
    setCommands(prev => [...prev, newCommand]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!agentOnly) {
      setCurrentInput(e.target.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (agentOnly) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentInput.trim()) {
        processCommand(currentInput.trim());
        setCurrentInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearTerminal = () => {
    setCommands([]);
  };

  const copyTerminalContent = () => {
    const content = commands.map(cmd => 
      `$ ${cmd.command}\n${cmd.output}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(content).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const downloadTerminalContent = () => {
    const content = commands.map(cmd => 
      `$ ${cmd.command}\n${cmd.output}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-log-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Public method to allow the agent to control the terminal
  const executeCommand = (command: string) => {
    if (command.trim()) {
      processCommand(command);
      setCurrentInput('');
    }
  };

  return (
    <TerminalContainer>
      <TerminalHeader>
        <TerminalTitle>
          <TerminalIcon fontSize="small" color="primary" />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Terminal</Typography>
        </TerminalTitle>
        <TerminalActions>
          {agentOnly && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Agent-controlled
            </Typography>
          )}
          <Tooltip title="Copy terminal content">
            <IconButton size="small" onClick={copyTerminalContent}>
              {copySuccess ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear terminal">
            <IconButton size="small" onClick={clearTerminal} disabled={agentOnly}>
              <ClearAllIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download terminal content">
            <IconButton size="small" onClick={downloadTerminalContent}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TerminalActions>
      </TerminalHeader>
      
      <TerminalBody ref={terminalRef} onClick={agentOnly ? undefined : handleContainerClick}>
        {commands.map((cmd, index) => (
          <Box key={index} mb={1}>
            <CommandLine>
              <CommandPrompt variant="body2">$</CommandPrompt>
              <CommandText variant="body2">{cmd.command}</CommandText>
            </CommandLine>
            {cmd.output && (
              cmd.type === 'error' ? (
                <ErrorText variant="body2">{cmd.output}</ErrorText>
              ) : cmd.type === 'success' ? (
                <SuccessText variant="body2">{cmd.output}</SuccessText>
              ) : (
                <OutputText variant="body2">{cmd.output}</OutputText>
              )
            )}
          </Box>
        ))}
        
        {!agentOnly && (
          <CommandLine>
            <CommandPrompt variant="body2">$</CommandPrompt>
            <TerminalInput
              inputRef={inputRef}
              variant="outlined"
              size="small"
              fullWidth
              value={currentInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type command..."
              autoFocus
              sx={{ 
                margin: 0,
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none"
                }
              }}
            />
          </CommandLine>
        )}
      </TerminalBody>
    </TerminalContainer>
  );
};

// Add method to allow agent to control the terminal
(TerminalWindow as any).executeCommand = (terminalRef: any, command: string) => {
  if (terminalRef.current && typeof terminalRef.current.executeCommand === 'function') {
    terminalRef.current.executeCommand(command);
  }
};

export default TerminalWindow; 