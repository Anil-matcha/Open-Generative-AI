#!/bin/bash

# Director Backend Deployment Script for Netlify
# Run this script to deploy the director backend functions

echo "🚀 Deploying Director Backend to Netlify..."
echo "Site: videoagencyai"
echo "URL: https://videoagencyai.netlify.app"
echo ""

# Step 1: Deploy functions
echo "📦 Step 1: Deploying functions..."
netlify deploy --functions netlify/functions --prod --site videoagencyai

if [ $? -eq 0 ]; then
    echo "✅ Functions deployed successfully!"
    echo ""

    # Step 2: Set environment variable
    echo "🔧 Step 2: Setting backend URL environment variable..."
    netlify env:set VITE_DIRECTOR_BACKEND_URL=https://videoagencyai.netlify.app/.netlify/functions/director-backend --site videoagencyai

    if [ $? -eq 0 ]; then
        echo "✅ Environment variable set!"
        echo ""

        # Step 3: Redeploy frontend
        echo "🌐 Step 3: Redeploying frontend with new environment..."
        netlify deploy --prod --site videoagencyai

        if [ $? -eq 0 ]; then
            echo "✅ Frontend redeployed successfully!"
            echo ""
            echo "🎉 DEPLOYMENT COMPLETE!"
            echo ""
            echo "📋 Your director backend is now live at:"
            echo "   https://videoagencyai.netlify.app/.netlify/functions/director-backend"
            echo ""
            echo "🎬 Available features:"
            echo "   • Faceless Video Creator"
            echo "   • AI Ad Films"
            echo "   • TikTok Lyric Videos"
            echo "   • AI Voiceovers"
            echo "   • Trailer Narration"
            echo "   • Kids Storyteller"
            echo "   • Year in Frames"
            echo "   • All 32 AI agents"
            echo ""
            echo "🔗 Frontend now calls real VideoDB APIs instead of mock data!"
        else
            echo "❌ Frontend redeploy failed"
            exit 1
        fi
    else
        echo "❌ Environment variable setting failed"
        exit 1
    fi
else
    echo "❌ Function deployment failed"
    echo ""
    echo "💡 Try running the commands manually:"
    echo "   netlify deploy --functions netlify/functions --prod --site videoagencyai"
    exit 1
fi