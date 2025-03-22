import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Typography, styled, Avatar, Paper, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import MicIcon from '@mui/icons-material/Mic';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';

// Styled components
const WindowContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const MessageBubble = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderRadius: 16,
  maxWidth: '85%',
  wordBreak: 'break-word',
  boxShadow: 'none',
}));

const UserMessage = styled(MessageBubble)(({ theme }) => ({
  alignSelf: 'flex-end',
  backgroundColor: theme.palette.primary.dark,
  color: theme.palette.primary.contrastText,
}));

const SystemMessage = styled(MessageBubble)(({ theme }) => ({
  alignSelf: 'flex-start',
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
}));

const MessageRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1),
  animation: 'fadeIn 0.3s ease-out forwards',
}));

const MessageAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const MessageInput = styled(TextField)(({ theme }) => ({
  flexGrow: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: 24,
    paddingRight: theme.spacing(1),
    transition: 'all 0.2s ease',
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      backgroundColor: `${theme.palette.background.default}`,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-focused': {
      boxShadow: '0 2px 15px rgba(0, 0, 0, 0.15)',
    },
  },
}));

const SendButton = styled(Button)(({ theme }) => ({
  borderRadius: 24,
  minWidth: 'auto',
  padding: theme.spacing(1),
  '&:disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

// Types
interface Message {
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

interface UserWindowProps {
  messages?: any[];
  onSendMessage?: (msg: any) => void;
  onMessageToTerminal?: (message: string) => void;
  onMessageToEditor?: (message: string) => void;
  onMessageToWebBrowser?: (message: string) => void;
  onMessageToPreview?: (message: string) => void;
  onMessageToPlan?: (message: string) => void;
  onMessageToTool?: (message: string) => void;
}

const UserWindow: React.FC<UserWindowProps> = ({
  messages: externalMessages,
  onSendMessage,
  onMessageToTerminal,
  onMessageToEditor,
  onMessageToWebBrowser,
  onMessageToPreview,
  onMessageToPlan,
  onMessageToTool,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      text: 'Hi there! I am Morpheus. How can I assist you today?',
      sender: 'system',
      timestamp: new Date(),
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const sendMessage = () => {
    if (input.trim() === '') return;

    const newMessage: Message = {
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInput('');

    // Call the external onSendMessage if provided
    if (onSendMessage) {
      onSendMessage(newMessage);
    }

    // Process the message and send to relevant components
    processMessage(newMessage.text);

    // Simulate system response after a short delay
    setTimeout(() => {
      const systemResponse: Message = {
        text: `I've processed your request "${input.trim()}" and taken the appropriate actions.`,
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Here you would integrate with Web Speech API or similar
    if (!isRecording) {
      // Start recording
      console.log('Started voice recording');
    } else {
      // Stop recording and process
      console.log('Stopped voice recording');
    }
  };

  const processMessage = (text: string) => {
    // Simple routing based on command patterns
    if (text.toLowerCase().includes('terminal')) {
      onMessageToTerminal?.(text);
    }
    if (text.toLowerCase().includes('editor')) {
      onMessageToEditor?.(text);
    }
    if (text.toLowerCase().includes('web')) {
      onMessageToWebBrowser?.(text);
    }
    if (text.toLowerCase().includes('preview')) {
      onMessageToPreview?.(text);
    }
    if (text.toLowerCase().includes('plan')) {
      onMessageToPlan?.(text);
    }
    if (text.toLowerCase().includes('tool')) {
      onMessageToTool?.(text);
    }
  };

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <WindowContainer>
      <MessagesContainer>
        {messages.map((message, index) => (
          <MessageRow key={index}>
            {message.sender === 'system' && (
              <MessageAvatar>
                <SmartToyIcon color="primary" fontSize="small" />
              </MessageAvatar>
            )}
            {message.sender === 'user' ? (
              <UserMessage>
                <Typography variant="body1">{message.text}</Typography>
              </UserMessage>
            ) : (
              <SystemMessage>
                <Typography variant="body1">{message.text}</Typography>
              </SystemMessage>
            )}
            {message.sender === 'user' && (
              <MessageAvatar>
                <PersonIcon color="primary" fontSize="small" />
              </MessageAvatar>
            )}
          </MessageRow>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <ActionButton 
          size="small"
          color={isRecording ? "secondary" : "primary"}
          onClick={toggleRecording}
        >
          {isRecording ? <SettingsVoiceIcon /> : <MicIcon />}
        </ActionButton>
        <MessageInput
          multiline
          maxRows={4}
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <SendButton 
                color="primary"
                disabled={input.trim() === ''}
                onClick={sendMessage}
                size="small"
              >
                <SendIcon />
              </SendButton>
            ),
          }}
        />
      </InputContainer>
    </WindowContainer>
  );
};

export default UserWindow; 