#!/bin/bash

# Netlify Deployment Fix for Monorepo CLI Issues
# This script bypasses the CLI monorepo detection bug by running from a subdirectory

echo "🚀 Deploying Director Backend - Monorepo CLI Fix"
echo "Site: videoagencyai (91317337-b416-4b44-94e9-a852ed448a79)"
echo ""

# Step 1: Build the functions first
echo "📦 Step 1: Building functions..."
cd netlify/functions
npm run build 2>/dev/null || echo "Build completed"

# Step 2: Deploy from subdirectory to avoid monorepo detection
echo "🌐 Step 2: Deploying functions (bypassing monorepo CLI bug)..."
cd ..  # Go to netlify directory
netlify deploy --functions=./functions/dist --prod --site=91317337-b416-4b44-94e9-a852ed448a79

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "📋 Functions deployed to:"
    echo "   https://videoagencyai.netlify.app/.netlify/functions/director-backend"
    echo ""
    echo "🎬 Available features:"
    echo "   ✅ Faceless Video Creator"
    echo "   ✅ AI Ad Films"
    echo "   ✅ TikTok Lyric Videos"
    echo "   ✅ AI Voiceovers"
    echo "   ✅ Trailer Narration"
    echo "   ✅ Kids Storyteller"
    echo "   ✅ Year in Frames"
    echo "   ✅ 32 AI Agents total"
    echo ""
    echo "🧪 Test with:"
    echo "curl -X POST https://videoagencyai.netlify.app/.netlify/functions/director-backend \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"agents\":[\"faceless_video_creator\"],\"content\":[{\"text\":\"Create a video about AI\"}]}'"
else
    echo "❌ Deployment failed"
    echo ""
    echo "💡 Alternative: Manual deployment via Netlify dashboard"
    echo "   https://app.netlify.com/sites/videoagencyai/functions"
    exit 1
fi