import { Message } from './agent.interface';
import { RoutedMessage } from '../agents/supervisorAgent';

export interface Session {
  id: string;
  userId?: string;
  createdAt: Date;
  lastActive: Date;
  messages: Message[];
  routedMessages: RoutedMessage[];
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  userControlMode: boolean;
  activeTab?: string;
  activeAgent?: string;
  customInstructions?: string;
}

export interface SessionManager {
  createSession(userId?: string): Session;
  getSession(sessionId: string): Session | null;
  updateSession(sessionId: string, updates: Partial<Session>): boolean;
  deleteSession(sessionId: string): boolean;
  listSessions(userId?: string): Session[];
  addMessage(sessionId: string, message: Message): boolean;
  getMessages(sessionId: string, limit?: number): Message[];
} 