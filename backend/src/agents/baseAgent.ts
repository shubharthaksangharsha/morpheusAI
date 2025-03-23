import { GoogleGenerativeAI } from '@google/generative-ai';
import { Agent, AgentResponse, Message } from '../interfaces/agent.interface';

export abstract class BaseAgent implements Agent {
  name: string;
  description: string;
  systemPrompt: string;
  protected genAI: GoogleGenerativeAI;
  protected modelName: string = 'gemini-1.5-flash';
  
  constructor(name: string, description: string, systemPrompt: string) {
    this.name = name;
    this.description = description;
    this.systemPrompt = systemPrompt;
    
    // Initialize the Gemini AI SDK
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async initialize(): Promise<boolean> {
    // Base initialization, can be overridden by specific agents
    console.log(`Initializing ${this.name} agent...`);
    return true;
  }

  // Helper method to format messages for Gemini
  protected formatMessagesForGemini(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role === 'agent' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));
  }

  // Helper method to get a Gemini model with system instructions
  protected getModelWithSystemPrompt() {
    const model = this.genAI.getGenerativeModel({ 
      model: this.modelName
    });
    
    // System instructions are sent as the first message
    const chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: this.systemPrompt }]
        }
      ]
    });
    
    return chatSession;
  }

  // Core method that each agent must implement
  abstract processMessage(message: string, history: Message[]): Promise<AgentResponse>;

  // Helper method to create a structured response
  protected createResponse(content: string, success: boolean = true, error?: string, data?: any): AgentResponse {
    return {
      content,
      success,
      error,
      data
    };
  }
} 