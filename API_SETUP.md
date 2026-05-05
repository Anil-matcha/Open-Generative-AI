# Open-Higgsfield-AI API Setup Guide

This guide explains how to configure API connectivity for the Open-Higgsfield-AI applications.

## Required Environment Variables

### Main Application (.env)

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://bzxohkrxcwodllketcpz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# MuAPI Configuration (Optional - for AI features)
VITE_MUAPI_URL=https://api.muapi.ai
MUAPI_API_KEY=your_muapi_api_key_here

# OpenAI Configuration (Optional - for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Supabase Edge Functions

The following environment variables must be set in your Supabase project's Edge Functions settings:

```bash
# Required for MuAPI proxy function
MUAPI_API_KEY=your_actual_muapi_api_key_here
MUAPI_ALLOWED_ORIGINS=*
ENV=production
```

## API Services

### MuAPI (AI Video/Image Generation)
- **Purpose**: AI-powered video and image generation
- **URL**: https://api.muapi.ai
- **Setup**:
  1. Sign up at https://muapi.ai
  2. Get your API key
  3. Set `MUAPI_API_KEY` in both local .env and Supabase edge functions
- **Status**: If not configured, app falls back to basic features

### Supabase (Database & Storage)
- **Purpose**: Data storage, user authentication, edge functions
- **URL**: https://bzxohkrxcwodllketcpz.supabase.co
- **Setup**: Already configured with provided credentials
- **Status**: Required for app functionality

### Director Backend (AI Video Agents)
- **Purpose**: Advanced AI video editing agents
- **URL**: http://localhost:8000 (development)
- **Setup**:
  1. Configure VideoDB API key in `apps/director/backend/.env`
  2. Configure LLM API key (OpenAI/Anthropic/Google) in same file
  3. Start backend: `cd apps/director/backend && python -m director.entrypoint.api.server`
- **Status**: Optional - Director app works without it but with limited features

## Testing API Connectivity

Open browser console and run:

```javascript
await window.checkAPIConnectivity()
```

This will test connectivity to all APIs and display results.

## Troubleshooting

### "API key not configured" Error
- Check that `MUAPI_API_KEY` is set in your `.env` file
- Ensure the key is not expired
- Verify key format (should not contain test/demo keywords)

### "Service temporarily unavailable" Error
- Check Supabase edge function logs
- Verify `MUAPI_API_KEY` is set in Supabase edge function environment
- Check API rate limits

### Director App Connection Issues
- Ensure Director backend is running on port 8000
- Check VideoDB API key configuration
- Verify LLM API key is configured

### Network Issues
- Check CORS headers in browser dev tools
- Verify proxy configuration in `vite.config.js`
- Test direct API endpoints with curl

## Health Checks

The application includes automatic health checks for:
- AI service availability
- API key validation
- Network connectivity
- Service performance metrics

Check browser console for health check messages during app startup.

## Security Notes

- Never commit API keys to version control
- Use separate keys for development and production
- Rotate keys regularly
- Monitor API usage and costs
