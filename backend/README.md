# Morpheus AI - Backend

This directory contains the backend services for the Morpheus AI application. The backend is currently in development.

## Planned Architecture

The Morpheus AI backend will be built as a set of microservices, with the following components:

### Core API Server
- RESTful API built with Express.js and TypeScript
- WebSocket support for real-time communication
- Authentication and user session management
- Integration with AI models

### AI Agent Service
- Core agent orchestration system
- Handles planning and task delegation
- Maintains conversation context and history
- Connects specialized agents with the appropriate tools

### Tool Services
- Terminal execution service (with appropriate security)
- Web browser service (for searching and rendering web content)
- Code editor service (for code generation and analysis)
- File system service (for managing user files)
- Planning service (for organizing tasks and projects)

## Planned API Endpoints

### User API
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/session` - Get current session info
- `POST /api/auth/logout` - End current session

### Chat API
- `POST /api/chat/message` - Send a message to the AI
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/history` - Clear chat history

### Terminal API
- `POST /api/terminal/execute` - Execute a terminal command
- `GET /api/terminal/history` - Get command history

### Web Browser API
- `POST /api/web/search` - Perform a web search
- `GET /api/web/content` - Get web content from a URL

### Editor API
- `POST /api/editor/generate` - Generate code
- `POST /api/editor/analyze` - Analyze code

### Plan API
- `POST /api/plan/create` - Create a new plan
- `GET /api/plan/list` - List all plans
- `PUT /api/plan/update` - Update a plan
- `DELETE /api/plan/delete` - Delete a plan

## WebSocket Events

The backend will support real-time communication through WebSockets with the following events:

- `chat:message` - New message in chat
- `terminal:output` - Terminal command output
- `terminal:error` - Terminal command error
- `web:progress` - Web search/loading progress
- `editor:suggestion` - Real-time code suggestions
- `plan:update` - Real-time plan updates

## Technologies

The backend will be built with:

- Node.js and Express.js
- TypeScript
- MongoDB for data storage
- Redis for caching and real-time features
- Integration with AI models (Gemini API or others)
- Docker for containerization

## Development Status

This backend is still in planning and early development. Key features will be implemented in the following order:

1. Core API server setup
2. Basic authentication
3. Chat functionality with AI integration
4. Terminal execution service
5. Web browser service
6. Code editor service
7. Planning service
8. Complete agent orchestration

## Getting Started (Coming Soon)

Installation and development setup instructions will be added once initial implementation is complete. 