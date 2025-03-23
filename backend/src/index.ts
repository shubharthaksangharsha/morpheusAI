import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { SupervisorAgent } from './agents/supervisorAgent';
import { TerminalAgent } from './agents/terminalAgent';
import { MemorySessionManager } from './utils/sessionManager';
import { Message } from './interfaces/agent.interface';
import { WebAgent } from './agents/webAgent';
import * as fs from 'fs';
import { PlannerAgent } from './agents/plannerAgent';
import { EditorAgent } from './agents/editorAgent';
import { ToolAgent } from './agents/toolAgent';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Initialize session manager
const sessionManager = new MemorySessionManager();

// Initialize agents
const supervisorAgent = new SupervisorAgent();
const terminalAgent = new TerminalAgent();
const webAgent = new WebAgent();
const plannerAgent = new PlannerAgent();
const editorAgent = new EditorAgent();
const toolAgent = new ToolAgent();

// Register all agents with supervisor
supervisorAgent.registerAgent(terminalAgent);
supervisorAgent.registerAgent(webAgent);
supervisorAgent.registerAgent(plannerAgent);
supervisorAgent.registerAgent(editorAgent);
supervisorAgent.registerAgent(toolAgent);

// Initialize all agents
async function initializeAgents() {
  try {
    // Explicitly initialize WebAgent first and separately
    console.log('Initializing Web Agent...');
    await webAgent.initialize();
    
    console.log('Initializing Supervisor Agent...');
    const initialized = await supervisorAgent.initialize();
    if (initialized) {
      console.log('All agents initialized successfully');
    } else {
      console.error('Failed to initialize agents');
    }
  } catch (error) {
    console.error('Error initializing agents:', error);
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Morpheus AI Backend is running' });
});

// Session routes
app.post('/api/sessions', (req, res) => {
  const { userId } = req.body;
  const session = sessionManager.createSession(userId);
  res.status(201).json(session);
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.status(200).json(session);
});

app.get('/api/sessions', (req, res) => {
  const sessions = sessionManager.listSessions();
  res.status(200).json(sessions);
});

// Message handling
app.post('/api/sessions/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }
  
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Create and add user message
  const userMessage: Message = {
    role: 'user',
    content,
    timestamp: new Date()
  };
  
  sessionManager.addMessage(sessionId, userMessage);
  
  try {
    // Process the message with the supervisor agent
    const response = await supervisorAgent.processMessage(
      content, 
      sessionManager.getMessages(sessionId)
    );
    
    // Create and add agent response message
    const agentMessage: Message = {
      role: 'agent',
      content: response.content,
      timestamp: new Date()
    };
    
    sessionManager.addMessage(sessionId, agentMessage);
    
    // Send response to client
    res.status(200).json({
      message: agentMessage,
      response
    });
    
    // Notify connected clients
    io.to(sessionId).emit('new_message', agentMessage);
  } catch (error: any) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Terminal specific route
app.post('/api/terminal/execute', async (req, res) => {
  const { command, sessionId } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  try {
    const response = await terminalAgent.executeCommand(command);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `!exec ${command}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error executing terminal command:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add routes for web agent
app.post('/api/web/browse', async (req, res) => {
  const { url, sessionId } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const response = await webAgent.browseUrl(url);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Browse ${url}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error browsing URL:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/web/screenshot', async (req, res) => {
  const { sessionId } = req.body;
  
  try {
    const response = await webAgent.takeScreenshot();
    
    // If session provided and screenshot successful, add to history
    if (sessionId && response.success) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: 'Take a screenshot',
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    // If screenshot was successful and has a path, send it to the client
    if (response.success && response.data?.screenshotPath) {
      // Send screenshot as Base64 encoded string
      const imgBuffer = fs.readFileSync(response.data.screenshotPath);
      const base64Image = imgBuffer.toString('base64');
      
      response.data.screenshot = `data:image/png;base64,${base64Image}`;
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error taking screenshot:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/web/extract', async (req, res) => {
  const { sessionId } = req.body;
  
  try {
    const response = await webAgent.extractContent();
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: 'Extract content from current page',
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error extracting content:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/web/search', async (req, res) => {
  const { query, sessionId } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    const response = await webAgent.searchWeb(query);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Search for: ${query}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error searching web:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add routes for planner agent
app.post('/api/planner/create', async (req, res) => {
  const { goal, sessionId } = req.body;
  
  if (!goal) {
    return res.status(400).json({ error: 'Goal is required' });
  }
  
  try {
    const response = await plannerAgent.processMessage(`!plan create ${goal}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Create a plan for: ${goal}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/planner/update', async (req, res) => {
  const { planId, updates, sessionId } = req.body;
  
  if (!planId || !updates) {
    return res.status(400).json({ error: 'Plan ID and updates are required' });
  }
  
  try {
    const response = await plannerAgent.processMessage(`!plan update ${planId} ${updates}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Update plan ${planId}: ${updates}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/planner/list', async (req, res) => {
  const { sessionId } = req.query;
  
  try {
    const response = await plannerAgent.processMessage('!plan list', []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId as string);
      if (session) {
        const message: Message = {
          role: 'user',
          content: 'List all plans',
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId as string, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId as string, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error listing plans:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/planner/plan/:planId', async (req, res) => {
  const { planId } = req.params;
  const { sessionId } = req.query;
  
  try {
    const response = await plannerAgent.processMessage(`!plan details ${planId}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId as string);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Get details for plan ${planId}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId as string, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId as string, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error getting plan details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add routes for editor agent
app.post('/api/editor/list', async (req, res) => {
  const { dirPath, sessionId } = req.body;
  
  if (!dirPath) {
    return res.status(400).json({ error: 'Directory path is required' });
  }
  
  try {
    const response = await editorAgent.processMessage(`!file list ${dirPath}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `List files in directory: ${dirPath}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/editor/delete', async (req, res) => {
  const { filePath, sessionId } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }
  
  try {
    const response = await editorAgent.processMessage(`!file delete ${filePath}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Delete file: ${filePath}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/editor/create', async (req, res) => {
  const { filePath, content, sessionId } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: 'File path is required' });
  }
  
  try {
    const response = await editorAgent.processMessage(`!file create ${filePath} ${content || ''}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Create file: ${filePath}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error creating file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generic endpoint for file operations via natural language
app.post('/api/editor/process', async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    const response = await editorAgent.processMessage(message, 
      sessionId ? sessionManager.getMessages(sessionId) : []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const userMessage: Message = {
          role: 'user',
          content: message,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, userMessage);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error processing editor request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add routes for tool agent
app.post('/api/tool/execute', async (req, res) => {
  const { toolName, params, sessionId } = req.body;
  
  if (!toolName) {
    return res.status(400).json({ error: 'Tool name is required' });
  }
  
  try {
    let paramsString = '';
    if (typeof params === 'object') {
      paramsString = JSON.stringify(params);
    } else if (params) {
      paramsString = params;
    }
    
    const response = await toolAgent.processMessage(`!tool ${toolName} ${paramsString}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Execute tool: ${toolName}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error executing tool:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tool/register', async (req, res) => {
  const { definition, sessionId } = req.body;
  
  if (!definition) {
    return res.status(400).json({ error: 'Tool definition is required' });
  }
  
  try {
    let definitionString = '';
    if (typeof definition === 'object') {
      definitionString = JSON.stringify(definition);
    } else {
      definitionString = definition;
    }
    
    const response = await toolAgent.processMessage(`!register ${definitionString}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Register new tool`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error registering tool:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tool/apikey', async (req, res) => {
  const { toolName, apiKey, sessionId } = req.body;
  
  if (!toolName || !apiKey) {
    return res.status(400).json({ error: 'Tool name and API key are required' });
  }
  
  try {
    const response = await toolAgent.processMessage(`!apikey ${toolName} ${apiKey}`, []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const message: Message = {
          role: 'user',
          content: `Set API key for ${toolName}`,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error setting API key:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tool/list', async (req, res) => {
  const { sessionId } = req.query;
  
  try {
    const response = await toolAgent.processMessage('!list tools', []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId as string);
      if (session) {
        const message: Message = {
          role: 'user',
          content: 'List available tools',
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId as string, message);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId as string, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error listing tools:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generic endpoint for tool-related queries
app.post('/api/tool/process', async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    const response = await toolAgent.processMessage(message, 
      sessionId ? sessionManager.getMessages(sessionId) : []);
    
    // If session provided, add to history
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        const userMessage: Message = {
          role: 'user',
          content: message,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, userMessage);
        
        const responseMessage: Message = {
          role: 'agent',
          content: response.content,
          timestamp: new Date()
        };
        sessionManager.addMessage(sessionId, responseMessage);
      }
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error processing tool request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add graceful shutdown to close browser instances
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await webAgent.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await webAgent.shutdown();
  process.exit(0);
});

// Socket.IO connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join a session room
  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
    console.log(`Client ${socket.id} joined session ${sessionId}`);
  });
  
  // Leave a session room
  socket.on('leave_session', (sessionId) => {
    socket.leave(sessionId);
    console.log(`Client ${socket.id} left session ${sessionId}`);
  });
  
  // Handle user control mode toggling
  socket.on('toggle_user_control', ({ sessionId, enabled }) => {
    const session = sessionManager.getSession(sessionId);
    if (session) {
      session.metadata.userControlMode = enabled;
      io.to(sessionId).emit('user_control_changed', enabled);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Morpheus AI Backend server running on port ${PORT}`);
  await initializeAgents();
}); 