#!/bin/bash

# Bizzin Email Worker Deployment Script
# Run this script to deploy the CloudFlare Worker after configuration

echo "🚀 Deploying Bizzin Email Worker to CloudFlare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in to CloudFlare
echo "🔐 Checking CloudFlare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Please login to CloudFlare first:"
    echo "   wrangler login"
    exit 1
fi

# Check required environment variables
echo "🔍 Validating configuration..."
MISSING_VARS=()

# Check wrangler.toml exists
if [ ! -f "wrangler.toml" ]; then
    echo "❌ wrangler.toml not found"
    exit 1
fi

# Extract SUPABASE_URL from wrangler.toml and validate
SUPABASE_URL=$(grep "SUPABASE_URL" wrangler.toml | cut -d'"' -f2)
if [[ "$SUPABASE_URL" == *"your-supabase-url"* ]]; then
    echo "❌ Please update SUPABASE_URL in wrangler.toml with your actual Supabase URL"
    exit 1
fi

# Prompt for missing secrets
echo "🔑 Checking required secrets..."

secrets_to_check=("SUPABASE_SERVICE_KEY" "SMTP_USER" "SMTP_PASSWORD" "SMTP2GO_API_KEY")

for secret in "${secrets_to_check[@]}"; do
    if ! wrangler secret list | grep -q "$secret"; then
        echo "⚠️  Secret $secret not found"
        read -p "Enter $secret: " -s secret_value
        echo
        if [ -n "$secret_value" ]; then
            echo "$secret_value" | wrangler secret put "$secret"
            echo "✅ $secret set"
        else
            echo "❌ $secret is required"
            exit 1
        fi
    else
        echo "✅ $secret is configured"
    fi
done

# Create KV namespace if it doesn't exist
echo "🗄️  Setting up KV namespace..."
if ! wrangler kv:namespace list | grep -q "EMAIL_CACHE"; then
    echo "Creating EMAIL_CACHE namespace..."
    wrangler kv:namespace create "EMAIL_CACHE"
    echo "⚠️  Please update the KV namespace ID in wrangler.toml with the ID shown above"
    read -p "Press Enter after updating wrangler.toml..."
fi

# Test the configuration
echo "🧪 Testing worker configuration..."
if ! wrangler dev --local --port 8787 --test > /dev/null 2>&1 & then
    echo "❌ Worker configuration test failed"
    exit 1
fi

# Kill the test worker
sleep 2
pkill -f "wrangler dev" > /dev/null 2>&1

echo "✅ Configuration test passed"

# Deploy to CloudFlare
echo "📤 Deploying to CloudFlare Workers..."
if wrangler deploy; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "Your email worker is now running on CloudFlare's edge network!"
    echo ""
    echo "📊 Next steps:"
    echo "1. Test the worker: curl https://your-worker.your-subdomain.workers.dev/health"
    echo "2. Send test email: https://your-worker.your-subdomain.workers.dev/test-email?userId=USER_ID"
    echo "3. Monitor logs: wrangler tail"
    echo "4. View stats: https://your-worker.your-subdomain.workers.dev/stats"
    echo ""
    echo "🕐 The cron job will run every hour automatically"
    echo "🔧 To disable your current server-based schedulers, update your server configuration"
else
    echo "❌ Deployment failed"
    exit 1
fi