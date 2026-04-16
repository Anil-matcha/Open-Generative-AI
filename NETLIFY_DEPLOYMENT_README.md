# Netlify Functions Deployment Guide

## 🚨 CLI Issue: Interactive Selection Required

The Netlify CLI is configured for monorepos and requires interactive project selection, which cannot be automated in this environment.

## ✅ Alternative Deployment Methods

### Method 1: Manual CLI Commands (Recommended)
Run these commands in your local terminal where you're logged into Netlify CLI:

```bash
# 1. Deploy functions
netlify deploy --functions netlify/functions --prod --site videoagencyai

# 2. Set environment variable
netlify env:set VITE_DIRECTOR_BACKEND_URL=https://videoagencyai.netlify.app/.netlify/functions/director-backend --site videoagencyai

# 3. Redeploy frontend
netlify deploy --prod --site videoagencyai
```

### Method 2: Netlify Dashboard Deployment
1. **Go to Netlify Dashboard**: https://app.netlify.com/sites/videoagencyai
2. **Navigate to Functions Tab**
3. **Upload Function Files**:
   - Upload `netlify/functions/director-backend.ts`
   - The function will be available at: `/.netlify/functions/director-backend`
4. **Set Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add: `VITE_DIRECTOR_BACKEND_URL = https://videoagencyai.netlify.app/.netlify/functions/director-backend`
5. **Trigger New Deploy** to pick up environment changes

### Method 3: Git-based Deployment
Since your repo is connected (`github.com/deangilmoreremix/Open-Higgsfield-AI`):

1. **Commit the function files**:
   ```bash
   git add netlify/functions/
   git commit -m "Add director backend functions"
   git push origin main
   ```

2. **Netlify will auto-deploy** and the functions will be live

## 🎯 Post-Deployment Verification

After deployment, test these endpoints:

```bash
# Test function is live
curl https://videoagencyai.netlify.app/.netlify/functions/director-backend

# Test with agent request
curl -X POST https://videoagencyai.netlify.app/.netlify/functions/director-backend \
  -H "Content-Type: application/json" \
  -d '{"agents":["summarizer"],"content":[{"text":"test"}]}'
```

## ✅ What Gets Activated

- **32 AI Agents** with real VideoDB APIs
- **10 Content Factory Features**:
  - Faceless Video Creator
  - AI Ad Films
  - TikTok Lyric Videos
  - AI Voiceovers
  - Trailer Narration
  - Kids Storyteller
  - Year in Frames
- **No More Mock Data** - All calls go to VideoDB
- **Frontend Integration** - All apps use real APIs

## 📞 Need Help?

If you encounter issues:
1. Check Netlify function logs in the dashboard
2. Verify environment variables are set
3. Test function URLs directly

**Use Method 1 (Manual CLI) for the fastest deployment!** 🎬</content>
<parameter name="filePath">NETLIFY_DEPLOYMENT_README.md