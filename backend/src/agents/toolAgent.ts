import axios from 'axios';
import { BaseAgent } from './baseAgent';
import { AgentResponse, Message } from '../interfaces/agent.interface';

interface Tool {
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requiresAuth: boolean;
  authType?: 'apiKey' | 'bearer' | 'basic';
  parameters: ToolParameter[];
}

interface ToolParameter {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export class ToolAgent extends BaseAgent {
  private tools: Map<string, Tool>;
  private apiKeys: Map<string, string>;
  
  constructor() {
    const systemPrompt = `You are a Tool Agent for Morpheus AI.
Your role is to manage and execute external API calls and tools:
- You can access and call various external APIs
- You should ensure proper authentication is used
- You should validate input parameters before making calls
- You should format API responses in a readable way
- You should handle API errors gracefully
- You should never expose sensitive API keys or credentials`;
    
    super('Tool Agent', 'Manages external API calls and integrations', systemPrompt);
    this.tools = new Map<string, Tool>();
    this.apiKeys = new Map<string, string>();
    
    // Register built-in tools
    this.registerDefaultTools();
  }
  
  async initialize(): Promise<boolean> {
    await super.initialize();
    console.log('Tool Agent initialized with', this.tools.size, 'tools');
    return true;
  }
  
  async processMessage(message: string, history: Message[]): Promise<AgentResponse> {
    // Check for tool execution commands
    if (message.trim().startsWith('!tool')) {
      try {
        const parts = message.substring(5).trim().split(' ');
        const toolName = parts[0];
        const params = parts.slice(1).join(' ');
        
        return this.executeTool(toolName, params);
      } catch (error: any) {
        return this.createResponse(
          `Error executing tool: ${error.message}`,
          false,
          error.message
        );
      }
    }
    
    // Check for tool registration or management commands
    if (message.trim().startsWith('!register')) {
      try {
        const toolDefinition = message.substring(9).trim();
        return this.registerTool(toolDefinition);
      } catch (error: any) {
        return this.createResponse(
          `Error registering tool: ${error.message}`,
          false,
          error.message
        );
      }
    }
    
    if (message.trim().startsWith('!list tools')) {
      return this.listTools();
    }
    
    if (message.trim().startsWith('!apikey')) {
      try {
        const parts = message.substring(7).trim().split(' ');
        const toolName = parts[0];
        const apiKey = parts[1];
        
        return this.setApiKey(toolName, apiKey);
      } catch (error: any) {
        return this.createResponse(
          `Error setting API key: ${error.message}`,
          false,
          error.message
        );
      }
    }
    
    // Use Gemini for tool-related queries
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName
      });
      
      // Create a chat session with system prompt
      const chat = model.startChat({
        history: [
          {
            role: 'system',
            parts: [{ text: this.systemPrompt }]
          }
        ]
      });
      
      // Provide information about available tools
      let toolsInfo = "Available tools:\n";
      this.tools.forEach((tool, name) => {
        toolsInfo += `- ${name}: ${tool.description}\n`;
      });
      
      const prompt = `${message}\n\n${toolsInfo}`;
      
      // Send the request to Gemini
      const result = await chat.sendMessage(prompt);
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
  
  private registerDefaultTools(): void {
    // Weather API
    this.tools.set('weather', {
      name: 'weather',
      description: 'Get current weather data for a location',
      endpoint: 'https://api.openweathermap.org/data/2.5/weather',
      method: 'GET',
      requiresAuth: true,
      authType: 'apiKey',
      parameters: [
        {
          name: 'location',
          description: 'City name or coordinates',
          required: true,
          type: 'string'
        },
        {
          name: 'units',
          description: 'Units of measurement (metric, imperial, standard)',
          required: false,
          type: 'string'
        }
      ]
    });
    
    // News API
    this.tools.set('news', {
      name: 'news',
      description: 'Get latest news headlines',
      endpoint: 'https://newsapi.org/v2/top-headlines',
      method: 'GET',
      requiresAuth: true,
      authType: 'apiKey',
      parameters: [
        {
          name: 'country',
          description: 'Country code (e.g., us, gb, au)',
          required: false,
          type: 'string'
        },
        {
          name: 'category',
          description: 'News category (business, entertainment, health, science, sports, technology)',
          required: false,
          type: 'string'
        },
        {
          name: 'query',
          description: 'Keywords or phrases to search for',
          required: false,
          type: 'string'
        }
      ]
    });
    
    // Dictionary API
    this.tools.set('dictionary', {
      name: 'dictionary',
      description: 'Look up word definitions',
      endpoint: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
      method: 'GET',
      requiresAuth: false,
      parameters: [
        {
          name: 'word',
          description: 'Word to look up',
          required: true,
          type: 'string'
        }
      ]
    });
  }
  
  private async executeTool(toolName: string, paramString: string): Promise<AgentResponse> {
    // Check if tool exists
    const tool = this.tools.get(toolName);
    if (!tool) {
      return this.createResponse(
        `Tool not found: ${toolName}. Use "!list tools" to see available tools.`,
        false,
        'Tool not found'
      );
    }
    
    try {
      // Parse parameters (simple implementation)
      const params: Record<string, string> = {};
      
      // Simple parameter parsing - can be enhanced for more complex cases
      if (paramString) {
        // Check if it looks like JSON
        if (paramString.trim().startsWith('{')) {
          try {
            Object.assign(params, JSON.parse(paramString));
          } catch (e) {
            // Not valid JSON, try key-value parsing
            const paramPairs = paramString.split(',');
            for (const pair of paramPairs) {
              const [key, value] = pair.split(':').map(p => p.trim());
              if (key && value) {
                params[key] = value;
              }
            }
          }
        } else {
          // Assume the first parameter is for the first required parameter
          const requiredParam = tool.parameters.find(p => p.required);
          if (requiredParam) {
            params[requiredParam.name] = paramString.trim();
          }
        }
      }
      
      // Validate required parameters
      for (const param of tool.parameters) {
        if (param.required && !params[param.name]) {
          return this.createResponse(
            `Missing required parameter: ${param.name} (${param.description})`,
            false,
            'Missing required parameter'
          );
        }
      }
      
      // Prepare API call
      let url = tool.endpoint;
      const config: any = {
        method: tool.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Handle authentication
      if (tool.requiresAuth) {
        const apiKey = this.apiKeys.get(toolName);
        if (!apiKey) {
          return this.createResponse(
            `API key not set for tool: ${toolName}. Use "!apikey ${toolName} YOUR_API_KEY" to set it.`,
            false,
            'API key not set'
          );
        }
        
        switch (tool.authType) {
          case 'apiKey':
            // Typically added as a query parameter
            params.apiKey = apiKey;
            break;
            
          case 'bearer':
            config.headers.Authorization = `Bearer ${apiKey}`;
            break;
            
          case 'basic':
            config.headers.Authorization = `Basic ${apiKey}`;
            break;
        }
      }
      
      // Handle GET requests with query parameters
      if (tool.method === 'GET') {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          queryParams.append(key, value);
        }
        url = `${url}?${queryParams.toString()}`;
      } else {
        // For POST, PUT, etc. add params to the body
        config.data = params;
      }
      
      // Make the API call
      const response = await axios({
        url,
        ...config
      });
      
      // Format the response
      let formattedResponse = `### Response from ${toolName}\n\n`;
      
      if (typeof response.data === 'object') {
        formattedResponse += '```json\n' + JSON.stringify(response.data, null, 2) + '\n```';
      } else {
        formattedResponse += response.data;
      }
      
      return this.createResponse(
        formattedResponse,
        true,
        undefined,
        { 
          tool: toolName,
          params,
          response: response.data
        }
      );
    } catch (error: any) {
      let errorMessage = `Error executing tool ${toolName}: ${error.message}`;
      
      // Include more details for Axios errors
      if (error.response) {
        errorMessage += `\nStatus: ${error.response.status}\nData: ${JSON.stringify(error.response.data)}`;
      }
      
      return this.createResponse(
        errorMessage,
        false,
        error.message
      );
    }
  }
  
  private async registerTool(toolDefinition: string): Promise<AgentResponse> {
    try {
      // Try to parse JSON tool definition
      let toolData: Tool;
      
      try {
        toolData = JSON.parse(toolDefinition);
      } catch (error) {
        // If not valid JSON, try to use AI to parse the natural language definition
        const model = this.genAI.getGenerativeModel({ 
          model: this.modelName
        });
        
        const prompt = `Parse the following tool description into a structured JSON format with these fields:
- name: a simple identifier for the tool (lowercase, no spaces)
- description: a brief description of what the tool does
- endpoint: the API endpoint URL
- method: HTTP method (GET, POST, PUT, DELETE)
- requiresAuth: boolean indicating if authentication is required
- authType: "apiKey", "bearer", or "basic" (if authentication is required)
- parameters: array of objects with name, description, required (boolean), and type fields

Tool description: ${toolDefinition}

Response should be valid JSON only.`;
        
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Extract JSON from the response
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                         response.match(/(\{[\s\S]*\})/);
                         
        if (!jsonMatch) {
          throw new Error('Could not parse tool definition');
        }
        
        toolData = JSON.parse(jsonMatch[1]);
      }
      
      // Validate the tool data
      if (!toolData.name || !toolData.description || !toolData.endpoint || !toolData.method) {
        throw new Error('Tool definition is missing required fields');
      }
      
      // Register the tool
      this.tools.set(toolData.name, toolData);
      
      return this.createResponse(
        `Tool "${toolData.name}" registered successfully.`,
        true,
        undefined,
        { tool: toolData }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error registering tool: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private listTools(): AgentResponse {
    if (this.tools.size === 0) {
      return this.createResponse('No tools registered.');
    }
    
    let response = '### Available Tools\n\n';
    
    this.tools.forEach((tool, name) => {
      response += `#### ${name}\n`;
      response += `${tool.description}\n\n`;
      response += `Endpoint: \`${tool.endpoint}\`\n`;
      response += `Method: ${tool.method}\n`;
      response += `Authentication: ${tool.requiresAuth ? `Required (${tool.authType})` : 'Not required'}\n\n`;
      
      response += 'Parameters:\n';
      tool.parameters.forEach(param => {
        response += `- ${param.name}${param.required ? ' (required)' : ''}: ${param.description}\n`;
      });
      
      response += '\n';
    });
    
    response += 'To use a tool, type `!tool [tool_name] [parameters]`';
    
    return this.createResponse(
      response,
      true,
      undefined,
      { tools: Array.from(this.tools.entries()) }
    );
  }
  
  private setApiKey(toolName: string, apiKey: string): AgentResponse {
    // Check if tool exists
    if (!this.tools.has(toolName)) {
      return this.createResponse(
        `Tool not found: ${toolName}. Use "!list tools" to see available tools.`,
        false,
        'Tool not found'
      );
    }
    
    // Store the API key
    this.apiKeys.set(toolName, apiKey);
    
    return this.createResponse(
      `API key for tool "${toolName}" set successfully.`,
      true
    );
  }
} 