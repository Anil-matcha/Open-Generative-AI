import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import { ApiRateLimiter, AuthRateLimiter } from '../src/lib/services/DistributedRateLimiter.js';
import { securityLogStorage } from './services/securityLogStorage.js';
import { createClient } from 'redis';

const app = express();
const server = http.createServer(app);

// Initialize Redis client for distributed rate limiting
let redisClient = null;
if (process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PORT)) {
  redisClient = createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_SSL === 'true' ? {} : undefined
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Client error:', err);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  redisClient.connect().catch(console.error);
}

const apiRateLimiter = new ApiRateLimiter({
  distributedStorage: redisClient
});
const authRateLimiter = new AuthRateLimiter({
  distributedStorage: redisClient
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'https://app.higgsfield.ai',
      'https://studio.higgsfield.ai'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting middleware
app.use('/api', async (req, res, next) => {
  try {
    const clientKey = await apiRateLimiter.getClientKey(req);
    const result = await apiRateLimiter.isAllowed(clientKey);

    // Log rate limit events
    if (!result.allowed) {
      await securityLogStorage.storeLogs([{
        timestamp: new Date().toISOString(),
        level: 'warning',
        event: 'rate_limit_exceeded',
        service: 'backend-api',
        details: {
          clientKey,
          path: req.path,
          method: req.method,
          retryAfter: result.retryAfter
        },
        severity: 'medium'
      }]);
    }

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(result.retryAfter),
        message: 'Too many requests. Please try again later.'
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', apiRateLimiter.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    if (result.retryAfter > 0) {
      res.setHeader('X-RateLimit-Reset', Date.now() + result.retryAfter * 1000);
    }

    next();
  } catch (error) {
    console.error('[RateLimiter] Middleware error:', error);
    next(); // Fail open - don't block requests if rate limiter fails
  }
});

app.use('/api/ai-agent', aiAgentService);
app.use('/api/scene-detection', sceneDetectionService);
app.use('/api/semantic-search', semanticSearchService);
app.use('/api/speech-transcription', speechTranscriptionService);

// Security logs endpoint (admin only)
app.post('/api/security/logs', async (req, res) => {
  try {
    const { logs, source } = req.body;

    // Validate request structure
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Missing or invalid logs array'
      });
    }

    // Rate limit this endpoint strictly
    const adminKey = req.ip || 'unknown';
    const adminResult = await authRateLimiter.isAllowed(`admin-${adminKey}`);
    if (!adminResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: adminResult.retryAfter
      });
    }

    // Sanitize and store logs
    const sanitizedLogs = logs.map(log => ({
      timestamp: log.timestamp || new Date().toISOString(),
      level: log.level || 'info',
      event: log.event || 'unknown',
      service: log.service || 'higgsfield',
      details: this.sanitizeDetails(log.details || {}),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      source: source || 'client'
    }));

    const result = await securityLogStorage.storeLogs(sanitizedLogs);

    res.json({
      success: true,
      stored: result.count,
      message: 'Security logs stored successfully'
    });
  } catch (error) {
    console.error('[SecurityLogs] Endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to store security logs'
    });
  }
});

// Get security logs (admin only, read-only)
app.get('/api/security/logs', async (req, res) => {
  // TODO: Add proper admin authentication
  const { level, event, limit = 100 } = req.query;

  try {
    const logs = await securityLogStorage.getLogs({
      level,
      event,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('[SecurityLogs] GET error:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisClient?.isReady ? 'connected' : 'disconnected',
    logStorage: securityLogStorage.initialized ? 'ok' : 'error'
  });
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