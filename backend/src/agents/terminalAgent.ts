import { exec } from 'child_process';
import { promisify } from 'util';
import { BaseAgent } from './baseAgent';
import { AgentResponse, Message } from '../interfaces/agent.interface';

const execPromise = promisify(exec);

// List of commands that are not allowed for security reasons
const BLOCKED_COMMANDS = [
  'rm -rf',
  'sudo',
  'chmod',
  'chown',
  'mkfs',
  'dd',
  '>', // redirects
  '>>', // appends
  'curl | bash',
  'wget | bash',
  'eval',
  '`', // backticks for command substitution
  'mv /',
  'cp /',
];

export class TerminalAgent extends BaseAgent {
  private workingDirectory: string;
  
  constructor(workingDir: string = '/tmp/morpheus-sandbox') {
    const systemPrompt = `You are a Terminal Agent for Morpheus AI. 
Your role is to execute terminal commands safely within a sandboxed environment.
- You must analyze commands for security risks before executing them.
- You should never execute commands that could damage the system or access sensitive information.
- For file operations, work only within your assigned sandbox directory.
- Provide clear explanations of command outputs, especially for errors.
- When possible, suggest improvements or alternatives to commands that fail.`;
    
    super('Terminal Agent', 'Executes terminal commands in a sandboxed environment', systemPrompt);
    this.workingDirectory = workingDir;
  }
  
  async initialize(): Promise<boolean> {
    await super.initialize();
    
    try {
      // Create sandbox directory if it doesn't exist
      await execPromise(`mkdir -p ${this.workingDirectory}`);
      console.log(`Terminal Agent sandbox created at ${this.workingDirectory}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize Terminal Agent:', error);
      return false;
    }
  }

  async processMessage(message: string, history: Message[]): Promise<AgentResponse> {
    // Check if message contains a command to execute
    if (message.trim().startsWith('!exec')) {
      const command = message.trim().substring(5).trim();
      return this.executeCommand(command);
    }
    
    // Otherwise, use Gemini to generate a response
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

      // Add conversation history
      const historyMessages = this.formatMessagesForGemini(history);
      
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
  
  async executeCommand(command: string): Promise<AgentResponse> {
    // Check if the command is in the blocked list
    if (this.isCommandBlocked(command)) {
      return this.createResponse(
        `I cannot execute this command as it contains potentially unsafe operations. Please try a different command.`,
        false,
        'Command blocked for security reasons'
      );
    }
    
    try {
      // Execute command in the sandbox directory
      const { stdout, stderr } = await execPromise(command, { 
        cwd: this.workingDirectory,
        timeout: 10000 // Timeout after 10 seconds
      });
      
      if (stderr) {
        return this.createResponse(
          `Command executed with warnings:\n${stderr}\n\nOutput:\n${stdout || 'No output'}`,
          true,
          stderr,
          { stdout, stderr }
        );
      }
      
      return this.createResponse(
        stdout || 'Command executed successfully with no output.',
        true,
        undefined,
        { stdout }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error executing command: ${error.message}`,
        false,
        error.message,
        { error: error.message }
      );
    }
  }
  
  private isCommandBlocked(command: string): boolean {
    const lowerCmd = command.toLowerCase();
    return BLOCKED_COMMANDS.some(blocked => lowerCmd.includes(blocked));
  }
} 