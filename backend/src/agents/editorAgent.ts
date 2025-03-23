import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent } from './baseAgent';
import { AgentResponse, Message } from '../interfaces/agent.interface';

interface FileOperation {
  type: 'read' | 'write' | 'edit' | 'delete' | 'create' | 'list';
  filePath: string;
  content?: string;
  lineStart?: number;
  lineEnd?: number;
}

export class EditorAgent extends BaseAgent {
  private workingDirectory: string;
  private allowedExtensions: string[];
  
  constructor(workingDir: string = '/tmp/morpheus-editor') {
    const systemPrompt = `You are an Editor Agent for Morpheus AI.
Your role is to help users create, edit, and manage code and text files:
- You can read, write, and modify files within your workspace
- You should provide clear information about file operations
- You should handle errors gracefully with helpful feedback
- You should be able to suggest code improvements
- You should work within the constraints of the designated workspace
- You should understand various programming languages and file formats`;
    
    super('Editor Agent', 'Handles code editing and file manipulation', systemPrompt);
    this.workingDirectory = workingDir;
    this.allowedExtensions = [
      '.txt', '.md', '.json', '.js', '.ts', '.html', '.css', '.py', 
      '.java', '.c', '.cpp', '.h', '.sh', '.yaml', '.yml', '.xml',
      '.jsx', '.tsx', '.scss', '.less', '.go', '.php', '.rb'
    ];
  }
  
  async initialize(): Promise<boolean> {
    await super.initialize();
    
    try {
      // Create workspace directory if it doesn't exist
      if (!fs.existsSync(this.workingDirectory)) {
        fs.mkdirSync(this.workingDirectory, { recursive: true });
      }
      console.log(`Editor Agent workspace created at ${this.workingDirectory}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize Editor Agent:', error);
      return false;
    }
  }

  async processMessage(message: string, history: Message[]): Promise<AgentResponse> {
    // Check for file operation commands
    if (message.trim().startsWith('!file')) {
      try {
        const operation = this.parseFileOperation(message.substring(5).trim());
        return this.performFileOperation(operation);
      } catch (error: any) {
        return this.createResponse(
          `Error parsing file operation: ${error.message}`,
          false,
          error.message
        );
      }
    }
    
    // Use Gemini for code-related queries
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
      
      // Format messages for Gemini
      let prompt = message;
      
      // If message references a file, try to include its content for context
      const fileMatch = message.match(/file\s+([^\s]+)/i);
      if (fileMatch) {
        const filePath = fileMatch[1];
        try {
          const absolutePath = this.getAbsolutePath(filePath);
          if (fs.existsSync(absolutePath)) {
            const content = fs.readFileSync(absolutePath, 'utf8');
            prompt += `\n\nHere is the content of ${filePath}:\n\`\`\`\n${content}\n\`\`\``;
          }
        } catch (e) {
          // Silently continue if we can't access the file
        }
      }
      
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
  
  private parseFileOperation(command: string): FileOperation {
    // Simple command parser for file operations
    const parts = command.split(' ');
    const operationType = parts[0].toLowerCase();
    
    if (!parts[1]) {
      throw new Error('File path is required');
    }
    
    const filePath = parts[1];
    
    switch (operationType) {
      case 'read':
        return { type: 'read', filePath };
        
      case 'write':
        if (parts.length < 3) {
          throw new Error('Content is required for write operation');
        }
        return { 
          type: 'write', 
          filePath, 
          content: parts.slice(2).join(' ') 
        };
        
      case 'edit':
        if (parts.length < 5) {
          throw new Error('Line numbers and content are required for edit operation');
        }
        const lineStart = parseInt(parts[2], 10);
        const lineEnd = parseInt(parts[3], 10);
        return { 
          type: 'edit', 
          filePath, 
          lineStart, 
          lineEnd, 
          content: parts.slice(4).join(' ') 
        };
        
      case 'delete':
        return { type: 'delete', filePath };
        
      case 'create':
        return { 
          type: 'create', 
          filePath, 
          content: parts.length > 2 ? parts.slice(2).join(' ') : '' 
        };
        
      case 'list':
        return { type: 'list', filePath };
        
      default:
        throw new Error(`Unknown file operation: ${operationType}`);
    }
  }
  
  private async performFileOperation(operation: FileOperation): Promise<AgentResponse> {
    try {
      const absolutePath = this.getAbsolutePath(operation.filePath);
      
      // Security check to prevent path traversal attacks
      if (!this.isPathAllowed(absolutePath)) {
        return this.createResponse(
          `Cannot access path outside of workspace: ${operation.filePath}`,
          false,
          'Path security violation'
        );
      }
      
      // Check file extension for potentially dangerous files
      if (!this.isFileTypeAllowed(absolutePath) && operation.type !== 'list') {
        return this.createResponse(
          `File type not allowed: ${path.extname(absolutePath)}`,
          false,
          'File type not allowed'
        );
      }
      
      switch (operation.type) {
        case 'read':
          return this.readFile(absolutePath);
          
        case 'write':
          return this.writeFile(absolutePath, operation.content || '');
          
        case 'edit':
          return this.editFile(
            absolutePath, 
            operation.lineStart || 1, 
            operation.lineEnd || 1, 
            operation.content || ''
          );
          
        case 'delete':
          return this.deleteFile(absolutePath);
          
        case 'create':
          return this.createFile(absolutePath, operation.content || '');
          
        case 'list':
          return this.listFiles(absolutePath);
          
        default:
          return this.createResponse(
            `Unsupported operation: ${operation.type}`,
            false,
            'Unsupported operation'
          );
      }
    } catch (error: any) {
      return this.createResponse(
        `Error performing file operation: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private getAbsolutePath(relativePath: string): string {
    // Handle paths relative to working directory
    if (relativePath.startsWith('/')) {
      return path.join(this.workingDirectory, relativePath.substring(1));
    }
    return path.join(this.workingDirectory, relativePath);
  }
  
  private isPathAllowed(absolutePath: string): boolean {
    // Ensure the path is within the working directory
    return absolutePath.startsWith(this.workingDirectory);
  }
  
  private isFileTypeAllowed(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return this.allowedExtensions.includes(extension);
  }
  
  private async readFile(filePath: string): Promise<AgentResponse> {
    try {
      if (!fs.existsSync(filePath)) {
        return this.createResponse(
          `File not found: ${path.relative(this.workingDirectory, filePath)}`,
          false,
          'File not found'
        );
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const extension = path.extname(filePath).substring(1);
      
      return this.createResponse(
        `File content of ${path.relative(this.workingDirectory, filePath)}:\n\n\`\`\`${extension}\n${content}\n\`\`\``,
        true,
        undefined,
        { content, filePath }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error reading file: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private async writeFile(filePath: string, content: string): Promise<AgentResponse> {
    try {
      const directory = path.dirname(filePath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      
      return this.createResponse(
        `File written successfully: ${path.relative(this.workingDirectory, filePath)}`,
        true,
        undefined,
        { filePath }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error writing file: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private async editFile(filePath: string, lineStart: number, lineEnd: number, newContent: string): Promise<AgentResponse> {
    try {
      if (!fs.existsSync(filePath)) {
        return this.createResponse(
          `File not found: ${path.relative(this.workingDirectory, filePath)}`,
          false,
          'File not found'
        );
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // Validate line numbers
      if (lineStart < 1 || lineStart > lines.length + 1 || lineEnd < lineStart || lineEnd > lines.length + 1) {
        return this.createResponse(
          `Invalid line numbers. File has ${lines.length} lines. Requested edit from ${lineStart} to ${lineEnd}.`,
          false,
          'Invalid line numbers'
        );
      }
      
      // Adjust to 0-based index
      const startIndex = lineStart - 1;
      const endIndex = lineEnd - 1;
      
      // Replace the specified lines
      const newLines = [
        ...lines.slice(0, startIndex),
        ...newContent.split('\n'),
        ...lines.slice(endIndex + 1)
      ];
      
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
      
      return this.createResponse(
        `File edited successfully: ${path.relative(this.workingDirectory, filePath)}. Replaced lines ${lineStart} to ${lineEnd}.`,
        true,
        undefined,
        { 
          filePath,
          lineStart,
          lineEnd,
          newContent
        }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error editing file: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private async deleteFile(filePath: string): Promise<AgentResponse> {
    try {
      if (!fs.existsSync(filePath)) {
        return this.createResponse(
          `File not found: ${path.relative(this.workingDirectory, filePath)}`,
          false,
          'File not found'
        );
      }
      
      fs.unlinkSync(filePath);
      
      return this.createResponse(
        `File deleted successfully: ${path.relative(this.workingDirectory, filePath)}`,
        true,
        undefined,
        { filePath }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error deleting file: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private async createFile(filePath: string, content: string): Promise<AgentResponse> {
    try {
      if (fs.existsSync(filePath)) {
        return this.createResponse(
          `File already exists: ${path.relative(this.workingDirectory, filePath)}`,
          false,
          'File already exists'
        );
      }
      
      const directory = path.dirname(filePath);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      
      return this.createResponse(
        `File created successfully: ${path.relative(this.workingDirectory, filePath)}`,
        true,
        undefined,
        { filePath, content }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error creating file: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private async listFiles(dirPath: string): Promise<AgentResponse> {
    try {
      if (!fs.existsSync(dirPath)) {
        return this.createResponse(
          `Directory not found: ${path.relative(this.workingDirectory, dirPath)}`,
          false,
          'Directory not found'
        );
      }
      
      if (!fs.statSync(dirPath).isDirectory()) {
        return this.createResponse(
          `Not a directory: ${path.relative(this.workingDirectory, dirPath)}`,
          false,
          'Not a directory'
        );
      }
      
      const items = fs.readdirSync(dirPath);
      const files = [];
      const directories = [];
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          directories.push({
            name: item,
            path: path.relative(this.workingDirectory, itemPath),
            size: this.formatSize(this.getDirectorySize(itemPath)),
            modifiedTime: stats.mtime
          });
        } else {
          files.push({
            name: item,
            path: path.relative(this.workingDirectory, itemPath),
            size: this.formatSize(stats.size),
            extension: path.extname(item),
            modifiedTime: stats.mtime
          });
        }
      }
      
      // Format the response
      let response = `Contents of directory: ${path.relative(this.workingDirectory, dirPath) || '.'}\n\n`;
      
      if (directories.length > 0) {
        response += "Directories:\n";
        directories.forEach(dir => {
          response += `- 📁 ${dir.name}/ (${dir.size})\n`;
        });
        response += "\n";
      }
      
      if (files.length > 0) {
        response += "Files:\n";
        files.forEach(file => {
          response += `- 📄 ${file.name} (${file.size})\n`;
        });
      }
      
      if (directories.length === 0 && files.length === 0) {
        response += "Directory is empty.";
      }
      
      return this.createResponse(
        response,
        true,
        undefined,
        { 
          directoryPath: path.relative(this.workingDirectory, dirPath),
          files,
          directories
        }
      );
    } catch (error: any) {
      return this.createResponse(
        `Error listing files: ${error.message}`,
        false,
        error.message
      );
    }
  }
  
  private getDirectorySize(dirPath: string): number {
    let size = 0;
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        size += this.getDirectorySize(itemPath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  }
  
  private formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  }
} 