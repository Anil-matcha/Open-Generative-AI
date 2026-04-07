import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

// Import services
import aiAgentService from './services/aiAgentService.js';
import sceneDetectionService from './services/sceneDetectionService.js';
import semanticSearchService from './services/semanticSearchService.js';
import speechTranscriptionService from './services/speechTranscriptionService.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/ai-agent', aiAgentService);
app.use('/api/scene-detection', sceneDetectionService);
app.use('/api/semantic-search', semanticSearchService);
app.use('/api/speech-transcription', speechTranscriptionService);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MCP WebSocket Server
const wss = new WebSocketServer({ server, path: '/mcp' });

wss.on('connection', (ws, req) => {
  console.log('MCP client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'execute_command':
          const result = await handleMCPCommand(data.data);
          ws.send(JSON.stringify({
            type: 'command_result',
            id: data.id,
            success: true,
            result
          }));
          break;

        case 'get_timeline_state':
          ws.send(JSON.stringify({
            type: 'timeline_state',
            data: {
              duration: 60,
              playhead: 15,
              tracks: []
            }
          }));
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown command type'
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('MCP client disconnected');
  });

  ws.on('error', (error) => {
    console.error('MCP WebSocket error:', error);
  });
});

async function handleMCPCommand(data) {
  switch (data.action) {
    case 'add_clip':
      return { clipId: 'mcp_' + Date.now(), success: true };

    case 'remove_clip':
      return { success: true };

    case 'move_clip':
      return { success: true };

    case 'set_playhead':
      return { position: data.time };

    default:
      throw new Error('Unknown MCP command: ' + data.action);
  }
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`🔗 MCP WebSocket available at ws://localhost:${PORT}/mcp`);
  console.log(`📊 Health check at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;