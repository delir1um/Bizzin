#!/bin/bash

# Setup script for CloudFlare Worker secrets
# Run this script to configure all required environment variables

echo "🔑 Setting up CloudFlare Worker secrets for Bizzin Email System"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "❌ Please login to CloudFlare first:"
    echo "   wrangler login"
    exit 1
fi

echo "This script will help you set up the required secrets for the email worker."
echo "You can find these values from your existing server configuration."
echo ""

# SUPABASE_SERVICE_KEY
echo "🔹 SUPABASE_SERVICE_KEY"
echo "   This is your Supabase service role key (starts with 'eyJ...')"
echo "   You can find it in your Supabase dashboard under Settings > API"
read -p "   Enter SUPABASE_SERVICE_KEY: " -s SUPABASE_SERVICE_KEY
echo
if [ -n "$SUPABASE_SERVICE_KEY" ]; then
    echo "$SUPABASE_SERVICE_KEY" | wrangler secret put "SUPABASE_SERVICE_KEY"
    echo "   ✅ SUPABASE_SERVICE_KEY set"
else
    echo "   ❌ SUPABASE_SERVICE_KEY is required"
    exit 1
fi

echo ""

# SMTP_USER
echo "🔹 SMTP_USER"
echo "   Your SMTP username (currently 'bizzin' in your server config)"
read -p "   Enter SMTP_USER [bizzin]: " SMTP_USER
SMTP_USER=${SMTP_USER:-bizzin}
echo "$SMTP_USER" | wrangler secret put "SMTP_USER"
echo "   ✅ SMTP_USER set to: $SMTP_USER"

echo ""

# SMTP_PASSWORD
echo "🔹 SMTP_PASSWORD"
echo "   Your SMTP password for SMTP2GO"
echo "   You can find this in your SMTP2GO dashboard"
read -p "   Enter SMTP_PASSWORD: " -s SMTP_PASSWORD
echo
if [ -n "$SMTP_PASSWORD" ]; then
    echo "$SMTP_PASSWORD" | wrangler secret put "SMTP_PASSWORD"
    echo "   ✅ SMTP_PASSWORD set"
else
    echo "   ❌ SMTP_PASSWORD is required"
    exit 1
fi

echo ""

# SMTP2GO_API_KEY
echo "🔹 SMTP2GO_API_KEY"
echo "   Your SMTP2GO API key for direct API access"
echo "   This can be found in your SMTP2GO dashboard under API Keys"
echo "   If you don't have one, you can create it at: https://app.smtp2go.com/settings/apikeys/"
read -p "   Enter SMTP2GO_API_KEY: " -s SMTP2GO_API_KEY
echo
if [ -n "$SMTP2GO_API_KEY" ]; then
    echo "$SMTP2GO_API_KEY" | wrangler secret put "SMTP2GO_API_KEY"
    echo "   ✅ SMTP2GO_API_KEY set"
else
    echo "   ❌ SMTP2GO_API_KEY is required"
    exit 1
fi

echo ""
echo "🎉 All secrets configured successfully!"
echo ""
echo "📝 Don't forget to update wrangler.toml with your actual Supabase URL:"
echo "   SUPABASE_URL = \"https://your-project.supabase.co\""
echo ""
echo "🚀 You can now run: ./deploy.sh"