import { BaseAgent } from './baseAgent';
import { Agent, AgentResponse, Message } from '../interfaces/agent.interface';
import { v4 as uuidv4 } from 'uuid';

export interface RoutedMessage {
  id: string;
  originalMessage: string;
  routedAgent: string;
  response?: AgentResponse;
  timestamp: Date;
}

export class SupervisorAgent extends BaseAgent {
  private agents: Map<string, Agent>;
  private messageHistory: Message[];
  private routingHistory: RoutedMessage[];
  
  constructor() {
    const systemPrompt = `You are the Supervisor Agent for Morpheus AI.
Your primary responsibility is to manage all operations, delegate tasks to specialized agents, and maintain system integrity.
- You should route user queries to the appropriate specialized agent(s).
- You must prevent direct agent-to-agent communication.
- You can manually intervene when necessary.
- You should maintain a clear session history for context.
- You must ensure that each agent operates only within its designated capabilities.`;
    
    super('Supervisor Agent', 'Controls all operations, delegates tasks, and maintains system integrity', systemPrompt);
    this.agents = new Map<string, Agent>();
    this.messageHistory = [];
    this.routingHistory = [];
  }
  
  registerAgent(agent: Agent): void {
    this.agents.set(agent.name, agent);
    console.log(`Registered agent: ${agent.name}`);
  }
  
  getRegisteredAgents(): string[] {
    return Array.from(this.agents.keys());
  }
  
  async initialize(): Promise<boolean> {
    await super.initialize();
    
    // Initialize all registered agents
    const initPromises = Array.from(this.agents.values()).map(agent => agent.initialize());
    const results = await Promise.all(initPromises);
    
    // Check if all agents initialized successfully
    const allInitialized = results.every(result => result === true);
    if (!allInitialized) {
      console.error('Not all agents initialized successfully');
    }
    
    return allInitialized;
  }
  
  async processMessage(message: string, history: Message[] = []): Promise<AgentResponse> {
    // Add the user message to history
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    this.messageHistory.push(userMessage);
    
    // Combine provided history with internal history
    const combinedHistory = [...history, ...this.messageHistory].slice(-10); // Keep last 10 messages
    
    try {
      // First, determine which agent should handle this message
      const routingDecision = await this.determineRouting(message, combinedHistory);
      
      // If no appropriate agent found, handle it directly
      if (!routingDecision.agentName || !this.agents.has(routingDecision.agentName)) {
        return this.handleDirectly(message, combinedHistory);
      }
      
      // Get the selected agent
      const targetAgent = this.agents.get(routingDecision.agentName)!;
      
      // Create a routed message entry
      const routedMessage: RoutedMessage = {
        id: uuidv4(),
        originalMessage: message,
        routedAgent: targetAgent.name,
        timestamp: new Date()
      };
      
      // Process the message with the selected agent
      const agentResponse = await targetAgent.processMessage(
        routingDecision.modifiedMessage || message,
        combinedHistory
      );
      
      // Store the response in routing history
      routedMessage.response = agentResponse;
      this.routingHistory.push(routedMessage);
      
      // Add agent response to message history
      this.messageHistory.push({
        role: 'agent',
        content: agentResponse.content,
        timestamp: new Date()
      });
      
      return {
        ...agentResponse,
        content: `[${targetAgent.name}]: ${agentResponse.content}`
      };
    } catch (error: any) {
      return this.createResponse(
        `I encountered an error processing your request: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private async determineRouting(message: string, history: Message[]): Promise<{
    agentName?: string;
    modifiedMessage?: string;
    confidence: number;
  }> {
    // Use Gemini to determine which agent should handle the message
    try {
      // Create the model
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName
      });
      
      // Start a chat with system instruction
      const chat = model.startChat({
        history: [
          {
            role: 'system',
            parts: [{ 
              text: `You are a routing expert for an AI assistant with multiple specialized agents.
Available agents: ${this.getRegisteredAgents().join(', ')}.

Each agent has specific capabilities:
- Terminal Agent: Executes terminal commands in a sandboxed environment
- Web Agent: Browses websites, extracts content, and searches for information
- Planner Agent: Creates detailed project plans with steps, dependencies, and timelines

Analyze the user's message and determine which agent is best suited to handle it.
Return a JSON object with:
- "agentName": The name of the most appropriate agent, exactly as listed above
- "modifiedMessage": The original message, potentially rephrased for the specific agent
- "confidence": A number between 0 and 1 indicating your confidence in this routing` 
            }]
          }
        ]
      });
      
      // Create the routing prompt
      const routingPrompt = `
User message: "${message}"

Recent conversation history:
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Based on the message and context, which agent should handle this request? 
Respond with a JSON object only.`;
      
      const result = await chat.sendMessage(routingPrompt);
      const responseText = result.response.text();
      
      // Parse the JSON response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          return {
            agentName: parsedResponse.agentName,
            modifiedMessage: parsedResponse.modifiedMessage,
            confidence: parsedResponse.confidence || 0
          };
        }
      } catch (parseError) {
        console.error('Failed to parse routing response:', parseError);
      }
      
      // Enhanced fallback routing with better pattern matching
      if (message.toLowerCase().includes('list files') || 
          message.toLowerCase().includes('directory') || 
          message.toLowerCase().includes('folder') || 
          message.toLowerCase().includes('ls') || 
          message.toLowerCase().includes('dir') ||
          message.toLowerCase().includes('find file') ||
          message.toLowerCase().includes('file system')) {
        return { 
          agentName: 'Terminal Agent', 
          confidence: 0.9,
          modifiedMessage: message.startsWith('!exec') ? message : `!exec ls -la`
        };
      }
      
      // Terminal command detection
      if (message.toLowerCase().includes('terminal') || 
          message.toLowerCase().includes('command') || 
          message.toLowerCase().includes('bash') ||
          message.toLowerCase().includes('shell') ||
          message.startsWith('!exec')) {
        return { agentName: 'Terminal Agent', confidence: 0.8 };
      }
      
      // Web browsing detection
      if (message.toLowerCase().includes('search') || 
          message.toLowerCase().includes('browse') || 
          message.toLowerCase().includes('website') ||
          message.toLowerCase().includes('look up') ||
          message.match(/https?:\/\/[^\s]+/)) {
        return { agentName: 'Web Agent', confidence: 0.8 };
      }
      
      // For Editor Agent
      if (
        message.includes('edit file') || 
        message.includes('create file') || 
        message.includes('modify file') ||
        message.includes('write file') ||
        message.includes('read file') ||
        message.includes('delete file') ||
        message.includes('show file content') ||
        message.includes('list files') ||
        message.includes('file system') ||
        message.includes('code analysis') ||
        message.includes('editor')
      ) {
        return { agentName: 'Editor Agent', confidence: 0.8 };
      }
      
      // For Tool Agent
      if (
        message.includes('api call') || 
        message.includes('external api') || 
        message.includes('tool') ||
        message.includes('weather') ||
        message.includes('news') ||
        message.includes('dictionary') ||
        message.includes('lookup') ||
        message.includes('external service') ||
        message.includes('3rd party') ||
        message.includes('third party')
      ) {
        return { agentName: 'Tool Agent', confidence: 0.8 };
      }
      
      // No clear routing
      return { confidence: 0 };
    } catch (error) {
      console.error('Error determining routing:', error);
      return { confidence: 0 };
    }
  }
  
  private async handleDirectly(message: string, history: Message[]): Promise<AgentResponse> {
    // Handle messages that don't need to be routed to a specific agent
    try {
      // Get a chat session with the system prompt already applied
      const chat = this.getModelWithSystemPrompt();
      
      // Send the current message
      const result = await chat.sendMessage(message);
      const response = result.response.text();
      return this.createResponse(response);
    } catch (error: any) {
      return this.createResponse(
        `I encountered an error processing your request: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  getMessageHistory(): Message[] {
    return [...this.messageHistory]; // Return a copy
  }
  
  getRoutingHistory(): RoutedMessage[] {
    return [...this.routingHistory]; // Return a copy
  }
} 