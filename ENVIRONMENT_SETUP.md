# Environment Setup Guide

## Required API Keys & Configuration

This application requires several API keys to function correctly. Without these, AI features will not work and you'll see error notifications in the bottom-right corner.

---

## 1. Frontend Environment Variables (.env)

Create or update the `.env` file in the project root:

```bash
# REQUIRED: Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# OPTIONAL: Additional Configuration (if needed)
VITE_MUAPI_URL=https://api.muapi.ai
VITE_ENABLE_ANALYTICS=true
```

### How to get Supabase credentials:
1. Go to your [Supabase dashboard](https://supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the **URL** and **anon public** key
5. Paste into `.env` file (replace `your-project.supabase.co` and `your-supabase-anon-key`)

---

## 2. Supabase Edge Function Environment Variables

### Access Edge Function Settings:
1. Go to your Supabase dashboard
2. Select your project
3. Navigate to **Edge Functions**
4. Click on a function name
5. Click **Settings** (gear icon)
6. Scroll to **Environment Variables**

### Required Variables:

#### For `muapi-proxy` function:
```
MUAPI_API_KEY=your_muapi_api_key_here
MUAPI_ALLOWED_ORIGINS=https://your-domain.com,https://another-domain.com
# For local development, use * or include localhost
ENV=development  # optional (production/non-production)
```

#### For `ai-video-prompt-generator` function:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### How to get MUAPI API Key:
1. Visit [MuAPI](https://api.muapi.ai)
2. Create an account
3. Navigate to **API Keys** in your dashboard
4. Copy your API key
5. Add to Supabase edge function environment variables

### How to get OpenAI API Key:
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy and add to Supabase edge function environment variables

---

## 3. Deploy Edge Functions

After setting environment variables, you must deploy the edge functions:

### Option A: Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login to your account
supabase login

# Link your project
supabase link --project-ref your-project-id

# Deploy all functions
supabase functions deploy muapi-proxy
supabase functions deploy ai-video-prompt-generator
# ... deploy others as needed
```

### Option B: Using Dashboard
1. In Supabase dashboard, go to **Edge Functions**
2. Click on each function
3. Click **Deploy** button
4. Confirm deployment

---

## 4. Verify Configuration

### Run the verification script:
```bash
node verify-api-config.js
```

### Check browser console:
Open browser DevTools (F12) → Console tab. Look for:
- `[Environment] Configuration validated successfully` (good)
- Warnings about missing env vars (need to fix)

### Test image generation:
1. Open the app
2. Go to **Image** studio
3. Enter a prompt
4. Click **Generate**
5. Should see "Generating content..." and then success toast

If you see:
- ❌ "Generation requires Supabase setup" → Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- ❌ "API service is not configured" → Set MUAPI_API_KEY in edge function env
- ❌ "Network error" → Check internet connection and CORS
- ❌ "Generation failed: OpenAI API key not configured" → Set OPENAI_API_KEY in edge function env

---

## 5. Common Issues & Troubleshooting

### Issue: "AI features require Supabase setup"
**Cause**: Missing frontend Supabase credentials
**Fix**: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in `.env`, then restart dev server

### Issue: "AI service is not configured"
**Cause**: MUAPI_API_KEY missing in edge function environment
**Fix**: Set MUAPI_API_KEY in Supabase muapi-proxy edge function settings, then redeploy

### Issue: "OpenAI API key not configured"
**Cause**: OPENAI_API_KEY missing in edge function environment
**Fix**: Set OPENAI_API_KEY in Supabase ai-video-prompt-generator edge function settings, then redeploy

### Issue: CORS errors in browser console
**Cause**: Hardcoded origin in edge function (older version)
**Fix**: Ensure you have latest code (CORS is now dynamic). Set MUAPI_ALLOWED_ORIGINS in edge function env or redeploy with updated code.

### Issue: Rate limit exceeded
**Cause**: Too many requests (100/min limit)
**Fix**: Wait or implement API key rotation

---

## 6. Environment Validation Script

We've included `verify-api-config.js` to check your configuration. Run it anytime:

```bash
node verify-api-config.js
```

It will:
- Check .env file for required variables
- Verify Supabase connection
- Test edge function availability
- List any missing configuration

---

## 7. Security Notes

- **Never commit .env** to version control (already in .gitignore)
- **Rotate API keys** periodically (every 90 days)
- **Use separate keys** for development and production
- **Restrict OpenAI key** to specific domains if possible
- **Monitor API usage** for unexpected activity

---

## Need Help?

If configuration issues persist:
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review browser console for detailed errors
3. Verify all environment variables are correctly set
4. Ensure edge functions are deployed and not in "draft" state
5. Confirm API keys are valid and have sufficient credits
