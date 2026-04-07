# V-Editor Timeline Backend

Backend services for the V-Editor timeline features, providing AI-powered video editing capabilities.

## Features

### 🤖 AI Agent Service
- Natural language command processing
- Workflow management (Planning → Executing → Verifying → Complete)
- Intelligent video editing suggestions
- Command history and context awareness

### 🎥 Scene Detection Service
- Automatic scene boundary detection
- Adjustable sensitivity thresholds
- Video upload and URL processing
- Real-time progress tracking

### 🔍 Semantic Search Service
- CLIP-based image and text similarity search
- Media library indexing
- Relevance scoring and ranking
- Caching for performance

### 🎤 Speech Transcription Service
- Whisper-powered audio transcription
- Multi-language support
- Subtitle generation
- Text cleaning and refinement

### 🔗 MCP Protocol Support
- WebSocket server for AI IDE integration
- Real-time timeline manipulation
- Command execution and state synchronization
- Connection health monitoring

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=development
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=500MB
MCP_WS_PORT=3001
```

## Usage

### Starting the Server

```bash
npm start
# or for development
npm run dev
```

The server will start on port 3001 by default.

### API Endpoints

#### AI Agent Service
```
POST /api/ai-agent/process
POST /api/ai-agent/workflow
GET  /api/ai-agent/commands
```

#### Scene Detection Service
```
POST /api/scene-detection/detect
GET  /api/scene-detection/status/:jobId
POST /api/scene-detection/analyze-url
GET  /api/scene-detection/presets
```

#### Semantic Search Service
```
POST /api/semantic-search/search
POST /api/semantic-search/index
POST /api/semantic-search/add
GET  /api/semantic-search/stats
GET  /api/semantic-search/presets
```

#### Speech Transcription Service
```
POST /api/speech-transcription/transcribe
POST /api/speech-transcription/clean
POST /api/speech-transcription/generate-subtitles
GET  /api/speech-transcription/languages
GET  /api/speech-transcription/status/:jobId
```

#### MCP WebSocket
```
WebSocket: ws://localhost:3001/mcp
```

## Example Usage

### AI Agent Command Processing
```javascript
const response = await fetch('/api/ai-agent/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ command: 'add a title "My Video"' })
});
const result = await response.json();
```

### Scene Detection
```javascript
const formData = new FormData();
formData.append('video', videoFile);
formData.append('threshold', '0.5');

const response = await fetch('/api/scene-detection/detect', {
  method: 'POST',
  body: formData
});
const result = await response.json();
```

### Semantic Search
```javascript
const response = await fetch('/api/semantic-search/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'sunset beach',
    mediaItems: [...],
    options: { minScore: 0.3 }
  })
});
```

### Speech Transcription
```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('language', 'en');

const response = await fetch('/api/speech-transcription/transcribe', {
  method: 'POST',
  body: formData
});
```

### MCP WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/mcp');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'execute_command',
    data: { action: 'add_clip', name: 'New Clip' }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle timeline updates
};
```

## Architecture

```
backend/
├── server.js              # Main Express server & MCP WebSocket
├── package.json           # Dependencies & scripts
├── services/
│   ├── aiAgentService.js      # AI command processing
│   ├── sceneDetectionService.js # Video scene analysis
│   ├── semanticSearchService.js # CLIP-based search
│   └── speechTranscriptionService.js # Whisper transcription
├── routes/                 # Route handlers (if separated)
├── models/                 # Data models (if needed)
├── utils/                  # Utility functions
└── uploads/               # File upload storage
    ├── audio/            # Audio files
    ├── images/           # Image files
    └── videos/           # Video files
```

## Development

### Running Tests
```bash
npm test
```

### Adding New Services
1. Create service file in `services/` directory
2. Export Express router
3. Import and mount in `server.js`
4. Add to package.json if new dependencies needed

### Error Handling
All services include comprehensive error handling:
- Input validation
- File upload safety
- Processing timeouts
- Resource cleanup
- User-friendly error messages

### Security Considerations
- File upload restrictions (type, size)
- Input sanitization
- CORS configuration
- WebSocket origin validation
- Rate limiting (recommended to add)

## Production Deployment

### Environment Setup
```bash
NODE_ENV=production
PORT=3001
UPLOAD_PATH=/var/uploads
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Health Checks
- GET `/health` - Service health status
- Automatic cleanup of old upload files
- Memory usage monitoring
- WebSocket connection tracking

## Contributing

1. Follow existing code patterns
2. Add comprehensive error handling
3. Include input validation
4. Test with various file types and sizes
5. Update documentation

## License

This backend provides the server-side functionality for V-Editor's timeline features, enabling AI-powered video editing capabilities.</content>
<parameter name="filePath">backend/README.md