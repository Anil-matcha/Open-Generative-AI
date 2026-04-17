#!/bin/bash
# Netlify Deployment Script
# This script works around the Netlify CLI monorepo crash by running from a subdirectory

set -e

echo "🚀 Starting Netlify deployment..."

# Change to netlify directory to bypass monorepo detection
cd netlify

echo "📁 Running from netlify/ subdirectory to avoid monorepo selection crash"

# Deploy with production flag (skip build to avoid compilation errors)
echo "⬆️  Deploying to Netlify..."
netlify deploy --no-build --dir=../dist --functions=./functions/dist --prod

echo "✅ Deployment completed successfully!"