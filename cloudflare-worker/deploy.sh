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
if [ ! -f "wrangler.toml" ]; then
    echo "❌ wrangler.toml not found"
    exit 1
fi

SUPABASE_URL=$(grep -E '^SUPABASE_URL' wrangler.toml | sed 's/.*=\s*"\(.*\)".*/\1/' || echo "")
if [ -z "$SUPABASE_URL" ] || [[ "$SUPABASE_URL" == *"your-supabase-url"* ]]; then
    echo "❌ Please update SUPABASE_URL in wrangler.toml with your actual Supabase URL"
    echo "   Current value: $SUPABASE_URL"
    exit 1
fi
echo "✅ SUPABASE_URL configured: $SUPABASE_URL"

# Prompt for missing secrets
echo "🔑 Checking required secrets..."

secrets_to_check=("SUPABASE_SERVICE_KEY" "SMTP_USER" "SMTP_PASSWORD" "SMTP2GO_API_KEY" "WORKER_ADMIN_TOKEN")

for secret in "${secrets_to_check[@]}"; do
    if ! wrangler secret list 2>/dev/null | grep -q "$secret"; then
        if [ "$secret" = "WORKER_ADMIN_TOKEN" ]; then
            echo "⚠️  Secret $secret not found (required for API security)"
            echo "This token will be used to authenticate API requests."
        else
            echo "⚠️  Secret $secret not found"
        fi
        
        read -p "Enter $secret: " -s secret_value
        echo
        if [ -n "$secret_value" ]; then
            echo "$secret_value" | wrangler secret put "$secret" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "✅ $secret set successfully"
            else
                echo "❌ Failed to set $secret"
                exit 1
            fi
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
if ! wrangler kv:namespace list 2>/dev/null | grep -q "EMAIL_CACHE"; then
    echo "Creating EMAIL_CACHE namespace..."
    echo "Running: wrangler kv:namespace create EMAIL_CACHE"
    KV_OUTPUT=$(wrangler kv:namespace create "EMAIL_CACHE" 2>&1)
    
    if echo "$KV_OUTPUT" | grep -q "id.*=.*\".*\""; then
        KV_ID=$(echo "$KV_OUTPUT" | grep -o '"[a-f0-9]\{32\}"' | tr -d '"')
        echo "✅ KV namespace created with ID: $KV_ID"
        echo "⚠️  Please update the KV namespace ID in wrangler.toml:"
        echo "   Replace 'email-cache-namespace' with '$KV_ID'"
        read -p "Press Enter after updating wrangler.toml..."
    else
        echo "⚠️  Could not parse KV namespace ID. Please check wrangler.toml manually."
        echo "   Output: $KV_OUTPUT"
        read -p "Press Enter to continue..."
    fi
else
    echo "✅ KV namespace EMAIL_CACHE already exists"
fi

# Test the configuration with dry-run
echo "🧪 Testing worker configuration..."
if wrangler deploy --dry-run --compatibility-date 2024-08-01; then
    echo "✅ Configuration validation passed"
else
    echo "❌ Worker configuration validation failed"
    exit 1
fi

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