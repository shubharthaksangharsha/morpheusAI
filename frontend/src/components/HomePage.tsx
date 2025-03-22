import React from 'react';
import { Box, Typography, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const HomeContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  textAlign: 'center',
}));

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  background: 'linear-gradient(45deg, #90caf9 30%, #f48fb1 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  maxWidth: '800px',
}));

const StartButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1, 4),
  borderRadius: theme.spacing(3),
  fontWeight: 'bold',
}));

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/');
  };

  return (
    <HomeContainer>
      <Title variant="h2">
        Morpheus AI
      </Title>
      <Subtitle variant="h5">
        An AI-Powered Agentic System
      </Subtitle>
      <Typography variant="body1" paragraph>
        Morpheus is an advanced AI agent system that combines various specialized agents 
        coordinated by a supervisor. This system can help you with tasks ranging from web searches 
        to code generation and more.
      </Typography>
      <StartButton 
        variant="contained" 
        color="primary" 
        size="large"
        onClick={handleStart}
      >
        Start Morpheus
      </StartButton>
    </HomeContainer>
  );
};

export default HomePage; 