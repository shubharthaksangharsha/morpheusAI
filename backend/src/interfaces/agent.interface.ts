export interface Message {
  role: 'user' | 'system' | 'agent';
  content: string;
  timestamp: Date;
}

export interface AgentResponse {
  content: string;
  success: boolean;
  error?: string;
  data?: any;
}

export interface Agent {
  name: string;
  description: string;
  systemPrompt: string;
  
  // Core agent methods
  processMessage(message: string, history: Message[]): Promise<AgentResponse>;
  initialize(): Promise<boolean>;
  
  // Optional methods that specific agents might implement
  executeCommand?(command: string): Promise<AgentResponse>;
  browseWeb?(url: string): Promise<AgentResponse>;
  editCode?(filePath: string, content: string): Promise<AgentResponse>;
  planTask?(task: string): Promise<AgentResponse>;
} 