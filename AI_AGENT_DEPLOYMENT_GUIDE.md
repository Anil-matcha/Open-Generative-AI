# Comprehensive Production Deployment Guide for AI Agent Integration

## Overview

This guide covers the production deployment of the **Open-Higgsfield-AI** platform, a comprehensive AI-powered video and image generation studio with multiple integrated AI agents. The platform consists of:

- **Frontend Apps**: Director (video editing), Vimax (advanced video), Remix-Go (creative remixing)
- **AI Agents**: Video Agent, CineGen, LTX-Desktop, CutAI, Wan AI Effects
- **Backend**: Supabase (database, edge functions, authentication)
- **Infrastructure**: Netlify (frontend hosting), Supabase (backend services)

## Prerequisites

### System Requirements
- Node.js 20+
- pnpm (recommended) or npm
- Supabase CLI (`npm install -g supabase`)
- Netlify CLI (`npm install -g netlify-cli`)
- Docker (for local development)

### Accounts & Services
- **Supabase**: Database and backend services
- **Netlify**: Frontend hosting and serverless functions
- **AI API Providers**:
  - MuAPI.ai (primary AI service)
  - Anthropic Claude (advanced AI chat)
  - OpenAI (fallback AI services)
  - Replicate (additional AI models)

## Architecture Overview

### Multi-App Structure
```
apps/
├── director/     # Main video editing interface
├── vimax/        # Advanced video processing
└── remix-go/     # Creative content remixing

modules/
├── chatvideo-yucut/  # Advanced video AI agent
├── CineGen/          # AI model management
├── CutAI-backend/    # Script generation AI
├── LTX-Desktop/      # Local video generation
└── rendiv/           # Animation rendering
```

### AI Agent Capabilities
- **Video Agent**: 40+ AI tools, MCP protocol, animation IDE
- **CineGen**: 50+ AI models, node-based workflows
- **LTX-Desktop**: Local video generation with API fallback
- **CutAI**: Script generation, mood analysis, storyboard creation
- **Wan AI Effects**: 6 unique cinematic transformations

## Step 1: Environment Setup

### 1.1 Clone and Setup Repository
```bash
git clone <repository-url>
cd open-higgsfield-ai
pnpm install
```

### 1.2 Environment Configuration
Create production environment files:

```bash
cp .env.example .env.production
```

**Required Environment Variables:**
```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Service APIs (Required for AI agents)
VITE_MUAPI_API_KEY=your-muapi-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key
VITE_OPENAI_API_KEY=your-openai-key
VITE_REPLICATE_API_TOKEN=your-replicate-token

# Application Configuration
VITE_APP_ENV=production
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_SENTRY_DSN=your-sentry-dsn

# AI Agent Configuration
VITE_ENABLE_VIDEO_AGENT=true
VITE_ENABLE_CINEGEN=true
VITE_ENABLE_LTX_DESKTOP=true
VITE_ENABLE_CUTAI=true
VITE_ENABLE_WAN_AI_EFFECTS=true

# Performance & Caching
VITE_CACHE_STRATEGY=aggressive
VITE_MAX_CONCURRENT_AI_REQUESTS=3
VITE_AI_REQUEST_TIMEOUT=300000
```

### 1.3 Supabase Project Setup
```bash
# Initialize Supabase project
supabase init
supabase login

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Set production secrets
supabase secrets set MUAPI_API_KEY=$VITE_MUAPI_API_KEY
supabase secrets set ANTHROPIC_API_KEY=$VITE_ANTHROPIC_API_KEY
supabase secrets set OPENAI_API_KEY=$VITE_OPENAI_API_KEY
supabase secrets set REPLICATE_API_TOKEN=$VITE_REPLICATE_API_TOKEN
```

## Step 2: Database Deployment

### 2.1 Database Schema Migration
```bash
# Apply all migrations
supabase db reset

# Or apply specific migrations
supabase migration up
```

### 2.2 Seed Production Data
```bash
# Run database seeds if available
supabase db reset --linked
```

### 2.3 Enable Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);
```

## Step 3: AI Agent Deployment

### 3.1 Supabase Edge Functions
Deploy AI processing functions:

```bash
# Deploy all edge functions
supabase functions deploy muapi-proxy
supabase functions deploy process-upload
supabase functions deploy create-share
supabase functions deploy muapi-webhook
supabase functions deploy ai-video-agent
supabase functions deploy cinegen-processor
supabase functions deploy cutai-script-gen
supabase functions deploy wan-ai-effects
```

### 3.2 AI Model Configuration
Configure AI models in Supabase:

```sql
-- Insert AI model configurations
INSERT INTO ai_models (name, provider, model_id, capabilities, is_active) VALUES
('Video Agent', 'anthropic', 'claude-3-opus', ARRAY['video_editing', 'animation', 'mcp'], true),
('CineGen', 'replicate', 'cinegen:latest', ARRAY['image_gen', 'video_gen', 'workflow'], true),
('LTX-Desktop', 'local', 'ltx-desktop', ARRAY['video_gen', 'local_processing'], true),
('CutAI', 'openai', 'gpt-4-turbo', ARRAY['script_gen', 'storyboard', 'mood_analysis'], true),
('Wan AI Effects', 'muapi', 'wan-ai-effects', ARRAY['cakeify', 'vhs', 'samurai', 'film_noir', 'animal', 'rotation'], true);
```

### 3.3 AI Agent Initialization
Initialize AI agents with proper configurations:

```bash
# Initialize Video Agent
supabase functions invoke ai-video-agent --data '{"action": "initialize"}'

# Initialize CineGen models
supabase functions invoke cinegen-processor --data '{"action": "load_models"}'

# Test AI agent connectivity
supabase functions invoke ai-video-agent --data '{"action": "health_check"}'
```

## Step 4: Frontend Deployment

### 4.1 Build Configuration
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build all apps
pnpm run build:all

# Verify builds
ls -la dist/
ls -la apps/*/dist/
```

### 4.2 Netlify Deployment
```bash
# Login to Netlify
netlify login

# Link to Netlify site
netlify link

# Set production environment variables
netlify env:set VITE_SUPABASE_URL $VITE_SUPABASE_URL
netlify env:set VITE_SUPABASE_ANON_KEY $VITE_SUPABASE_ANON_KEY
netlify env:set VITE_MUAPI_API_KEY $VITE_MUAPI_API_KEY
# ... set all required env vars

# Deploy to production
netlify deploy --prod --build

# Or use Netlify Build Hooks for CI/CD
curl -X POST -d {} https://api.netlify.com/build_hooks/YOUR_BUILD_HOOK_ID
```

### 4.3 CDN Configuration
Configure CDN for optimal AI content delivery:

```toml
# netlify.toml
[[edge_functions]]
  function = "ai-redirect"
  path = "/api/ai/*"

[[redirects]]
  from = "/api/*"
  to = "https://your-project.supabase.co/functions/:splat"
  status = 200

# Cache AI-generated content aggressively
[[headers]]
  for = "/api/ai/*"
  [headers.values]
    Cache-Control = "public, max-age=3600, s-maxage=86400"

# Optimize for video content
[[headers]]
  for = "/*.mp4"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Access-Control-Allow-Origin = "*"
```

## Step 5: AI-Specific Configurations

### 5.1 Video Agent Setup
```javascript
// Configure Video Agent capabilities
const VIDEO_AGENT_CONFIG = {
  tools: [
    'scene_detection',
    'animation_ide',
    'mcp_bridge',
    'multi_stage_workflow',
    'error_recovery'
  ],
  models: {
    primary: 'claude-3-opus',
    fallback: 'gpt-4-turbo'
  },
  limits: {
    maxConcurrentRequests: 5,
    maxVideoDuration: 300, // 5 minutes
    maxFileSize: 100 * 1024 * 1024 // 100MB
  }
};
```

### 5.2 CineGen Model Management
```bash
# Deploy CineGen models
supabase functions deploy cinegen-models

# Initialize model registry
supabase functions invoke cinegen-models --data '{
  "action": "register_models",
  "models": [
    {"name": "Stable Diffusion XL", "type": "image", "endpoint": "sdxl"},
    {"name": "Stable Video Diffusion", "type": "video", "endpoint": "svd"},
    {"name": "Flux", "type": "image", "endpoint": "flux"}
  ]
}'
```

### 5.3 LTX-Desktop Local Processing
```javascript
// Configure local processing fallback
const LTX_CONFIG = {
  localMode: {
    enabled: true,
    hardwareCheck: true,
    fallbackToApi: true
  },
  apiMode: {
    endpoint: 'https://api.replicate.com/v1/predictions',
    model: 'lightricks/ltx-video:1234'
  },
  quality: {
    resolution: '720p',
    duration: '10s',
    format: 'mp4'
  }
};
```

### 5.4 Wan AI Effects Integration
```javascript
// Wan AI effects configuration
const WAN_AI_CONFIG = {
  effects: {
    cakeify: { name: 'Cakeify', style: 'animated' },
    vhs: { name: 'VHS Footage', style: 'retro' },
    samurai: { name: 'Samurai It', style: 'character' },
    'film-noir': { name: 'Film Noir', style: 'cinematic' },
    animal: { name: 'Animal Transformation', style: 'morph' },
    rotation: { name: 'Rotation Effect', style: 'dynamic' }
  },
  processing: {
    pollingInterval: 2000,
    maxAttempts: 60,
    timeout: 120000
  }
};
```

## Step 6: Security Configuration

### 6.1 API Key Management
```bash
# Rotate API keys regularly
supabase secrets set MUAPI_API_KEY=new-muapi-key
supabase secrets set ANTHROPIC_API_KEY=new-anthropic-key

# Use key rotation strategy
# 1. Add new key to environment
# 2. Update application to use new key
# 3. Remove old key after grace period
```

### 6.2 Rate Limiting for AI Services
```javascript
// Configure rate limiting per user
const RATE_LIMITS = {
  free: {
    requestsPerHour: 10,
    maxVideoDuration: 30,
    concurrentRequests: 1
  },
  pro: {
    requestsPerHour: 100,
    maxVideoDuration: 300,
    concurrentRequests: 3
  },
  enterprise: {
    requestsPerHour: 1000,
    maxVideoDuration: 600,
    concurrentRequests: 10
  }
};
```

### 6.3 Content Security Policy
```nginx
# CSP for AI-powered application
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://*.supabase.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co https://api.muapi.ai https://api.anthropic.com https://api.openai.com;
  media-src 'self' https: blob:;
  object-src 'none';
  frame-src 'self' https://*.supabase.co;
" always;
```

## Step 7: Monitoring & Observability

### 7.1 AI Service Monitoring
```javascript
// Monitor AI service health
const AI_MONITORING = {
  services: ['muapi', 'anthropic', 'openai', 'replicate'],
  metrics: {
    responseTime: true,
    successRate: true,
    errorRate: true,
    throughput: true
  },
  alerts: {
    responseTimeThreshold: 30000, // 30 seconds
    errorRateThreshold: 0.05, // 5%
    downtimeThreshold: 300000 // 5 minutes
  }
};
```

### 7.2 Performance Monitoring
Set up monitoring for AI workloads:

```bash
# Install monitoring tools
npm install @sentry/react @sentry/tracing
npm install @datadog/browser-rum

# Configure performance monitoring
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: 'production'
});
```

### 7.3 AI Usage Analytics
```sql
-- Create analytics tables
CREATE TABLE ai_usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  agent_type TEXT NOT NULL,
  operation TEXT NOT NULL,
  tokens_used INTEGER,
  processing_time INTEGER,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable analytics collection
ALTER TABLE ai_usage_metrics ENABLE ROW LEVEL SECURITY;
```

## Step 8: Scaling & Performance

### 8.1 Horizontal Scaling
```bash
# Scale Supabase resources
supabase scale db --size xl
supabase scale functions --size xl

# Configure auto-scaling for AI workloads
# Based on queue length and processing time
```

### 8.2 Caching Strategy
```javascript
// Multi-layer caching for AI content
const CACHE_CONFIG = {
  browser: {
    maxAge: 3600000, // 1 hour
    strategies: ['cache-first', 'network-first']
  },
  cdn: {
    maxAge: 86400000, // 24 hours
    compression: ['gzip', 'brotli']
  },
  edge: {
    maxAge: 300000, // 5 minutes for dynamic content
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1']
  }
};
```

### 8.3 AI Processing Optimization
```javascript
// Optimize AI processing pipeline
const AI_OPTIMIZATION = {
  batching: {
    enabled: true,
    maxBatchSize: 5,
    timeout: 5000
  },
  queuing: {
    priorityLevels: ['high', 'normal', 'low'],
    maxQueueSize: 100,
    timeout: 3600000 // 1 hour
  },
  resourceAllocation: {
    cpu: 'high',
    memory: '2gb',
    gpu: 'optional'
  }
};
```

## Step 9: Backup & Recovery

### 9.1 Database Backups
```bash
# Configure automated backups
supabase db backup create --name daily-backup

# Schedule backups
# Daily: Full backup
# Hourly: Incremental for critical data
# Real-time: AI usage metrics
```

### 9.2 AI Model Backups
```bash
# Backup AI model configurations
supabase db dump --table ai_models > ai_models_backup.sql

# Backup user-generated AI content
# Store in cloud storage with versioning
```

### 9.3 Disaster Recovery
```bash
# Recovery procedures
# 1. Restore from latest backup
# 2. Re-initialize AI agents
# 3. Validate AI service connectivity
# 4. Test core functionality
# 5. Notify users of any data loss
```

## Step 10: Testing & Validation

### 10.1 Pre-Deployment Testing
```bash
# Run comprehensive test suite
pnpm run test:e2e
pnpm run test:ai-integration
pnpm run test:performance

# Test AI agent functionality
npm run test:ai-agents
npm run test:video-processing
npm run test:model-loading
```

### 10.2 Production Validation
```bash
# Health checks
curl https://your-domain.com/api/health
curl https://your-project.supabase.co/functions/health

# AI service validation
curl https://your-domain.com/api/ai/agents/status

# Performance validation
# - Load testing with AI workloads
# - Memory usage monitoring
# - Response time validation
```

## Step 11: Go-Live Checklist

### Infrastructure
- [ ] Supabase project created and configured
- [ ] Netlify site deployed
- [ ] Domain DNS configured
- [ ] SSL certificates active
- [ ] CDN configured

### AI Services
- [ ] All AI API keys configured
- [ ] Edge functions deployed
- [ ] AI models initialized
- [ ] Rate limiting configured
- [ ] Error handling tested

### Security
- [ ] Environment variables secured
- [ ] RLS policies active
- [ ] CSP headers configured
- [ ] API key rotation scheduled
- [ ] Security monitoring active

### Monitoring
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] AI usage analytics enabled
- [ ] Alerting rules set up
- [ ] Log aggregation working

### Documentation
- [ ] User documentation updated
- [ ] API documentation published
- [ ] Troubleshooting guides ready
- [ ] Support contact information available

## Troubleshooting

### Common Issues

**AI Service Timeouts**
```
Solution: Increase timeout values and implement retry logic
Check: AI service status and API key validity
```

**High Memory Usage**
```
Solution: Implement streaming for large AI operations
Check: Monitor memory usage patterns and optimize batch sizes
```

**Rate Limiting Issues**
```
Solution: Implement intelligent queuing and backoff strategies
Check: Monitor API usage and adjust rate limits per user tier
```

**Video Processing Failures**
```
Solution: Add fallback processing and error recovery
Check: Validate input formats and implement preprocessing
```

## Support & Maintenance

### Regular Maintenance Tasks
- **Daily**: Monitor AI service health and error rates
- **Weekly**: Review performance metrics and optimize slow queries
- **Monthly**: Rotate API keys and update AI models
- **Quarterly**: Security audit and dependency updates

### Emergency Contacts
- Infrastructure: [contact]
- AI Services: [contact]
- Security: [contact]
- Customer Support: [contact]

---

This deployment guide ensures a robust, scalable, and secure production environment for the AI agent integration platform. Follow all steps in order and thoroughly test before going live.</content>
<parameter name="filePath">COMPREHENSIVE_AI_AGENT_DEPLOYMENT_GUIDE.md