import { v4 as uuidv4 } from 'uuid';
import { Message } from '../interfaces/agent.interface';
import { Session, SessionManager, SessionMetadata } from '../interfaces/session.interface';
import { RoutedMessage } from '../agents/supervisorAgent';

export class MemorySessionManager implements SessionManager {
  private sessions: Map<string, Session>;
  
  constructor() {
    this.sessions = new Map<string, Session>();
  }
  
  createSession(userId?: string): Session {
    const sessionId = uuidv4();
    const now = new Date();
    
    const defaultMetadata: SessionMetadata = {
      userControlMode: false
    };
    
    const newSession: Session = {
      id: sessionId,
      userId,
      createdAt: now,
      lastActive: now,
      messages: [],
      routedMessages: [],
      metadata: defaultMetadata
    };
    
    this.sessions.set(sessionId, newSession);
    return newSession;
  }
  
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }
  
  updateSession(sessionId: string, updates: Partial<Session>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Update the session with the new values
    const updatedSession = {
      ...session,
      ...updates,
      lastActive: new Date()
    };
    
    this.sessions.set(sessionId, updatedSession);
    return true;
  }
  
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
  
  listSessions(userId?: string): Session[] {
    const allSessions = Array.from(this.sessions.values());
    if (userId) {
      return allSessions.filter(session => session.userId === userId);
    }
    return allSessions;
  }
  
  addMessage(sessionId: string, message: Message): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.messages.push(message);
    session.lastActive = new Date();
    return true;
  }
  
  getMessages(sessionId: string, limit?: number): Message[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    if (limit && limit > 0) {
      return session.messages.slice(-limit);
    }
    
    return [...session.messages];
  }
  
  addRoutedMessage(sessionId: string, routedMessage: RoutedMessage): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    session.routedMessages.push(routedMessage);
    return true;
  }
  
  getRoutedMessages(sessionId: string, limit?: number): RoutedMessage[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    if (limit && limit > 0) {
      return session.routedMessages.slice(-limit);
    }
    
    return [...session.routedMessages];
  }
} 