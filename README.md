# Morpheus AI

A versatile AI assistant platform with a modern interface and multiple integrated tools, all controlled by an intelligent agent.

![Image](outputs/morpheus-preview-window.png)

## Project Overview

Morpheus AI is a full-stack application that combines a sleek React frontend with a powerful backend to create an intuitive AI assistant experience. The platform features multiple specialized tools that the AI agent can control to assist users with various tasks.

**Current Status:**
- ✅ Frontend implementation complete
- ⏳ Backend in development

## Repository Structure

This repository is organized into two main directories:

- `frontend/`: Contains the React application with the user interface
- `backend/`: Contains the backend services (in development)

## Frontend

The frontend is built with React, TypeScript, and Material-UI, providing a clean and responsive interface. It features:

- User chat interface for communicating with the AI
- Multiple agent-controlled tools in a tabbed interface:
  - Terminal
  - Web Browser
  - Code Editor
  - Task Planner
  - Tool Selection
  - Content Preview
- **User Control Mode**: Toggle to take manual control of any tool when needed
- Responsive design with dark mode support

For detailed information about the frontend, see the [Frontend README](frontend/README.md).

## Backend (In Progress)

The backend is currently under development and will include:

- AI agent integration
- API services for all tool functionalities
- Authentication and user data management
- WebSocket communication for real-time updates

For planned backend features, see the [Backend README](backend/README.md).

## Getting Started

### Running the Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and go to `http://localhost:3000`

### Development Requirements

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

## Key Features

### Agent-Controlled Tools
Morpheus AI provides various specialized tools that are primarily controlled by the AI agent, allowing for a seamless experience where the AI can perform complex tasks on your behalf.

### User Control Toggle
While the tools are normally agent-controlled, you can easily take manual control at any time:
- Toggle the "User Control" switch in the settings panel
- Interact directly with any tool
- Return control to the AI when desired

This gives you the flexibility to let the AI handle most tasks while being able to intervene whenever you need more direct control.

## Contributing

Contributions are welcome! The backend is actively being developed, and improvements to the frontend are also appreciated.

## License

[MIT License](LICENSE)

## Acknowledgements

- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [TypeScript](https://www.typescriptlang.org/) 
