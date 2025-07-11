#!/bin/bash

echo "🚂 Railway Deployment Script"
echo "=============================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Create a new Railway project
echo "📦 Creating Railway project..."
railway init

echo "✅ Railway project initialized!"
echo ""
echo "Next steps:"
echo "1. Set up your databases and services in Railway dashboard"
echo "2. Configure environment variables"
echo "3. Deploy each service"
echo ""
echo "Run 'railway deploy' in each service directory to deploy"
