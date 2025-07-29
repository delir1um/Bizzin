#!/usr/bin/env node

// Simple R2 credential tester
// This will help verify your R2 API credentials are correct

import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

async function testR2Credentials() {
  console.log('=== R2 Credential Test ===\n');
  
  const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  
  console.log('Checking environment variables:');
  console.log(`Account ID: ${accountId ? accountId.substring(0, 8) + '...' : 'MISSING'}`);
  console.log(`Access Key: ${accessKeyId ? accessKeyId.substring(0, 8) + '... (length: ' + accessKeyId.length + ')' : 'MISSING'}`);
  console.log(`Secret Key: ${secretAccessKey ? secretAccessKey.substring(0, 8) + '... (length: ' + secretAccessKey.length + ')' : 'MISSING'}`);
  console.log('');
  
  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  if (accessKeyId.length !== 32) {
    console.error('❌ Access Key ID should be 32 characters long, got:', accessKeyId.length);
    return;
  }
  
  if (secretAccessKey.length !== 64) {
    console.error('❌ Secret Access Key should be 64 characters long, got:', secretAccessKey.length);
    return;
  }
  
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  
  try {
    console.log('Testing R2 connection...');
    const result = await client.send(new ListBucketsCommand({}));
    console.log('✅ Success! Found buckets:', result.Buckets?.map(b => b.Name) || []);
    
    if (result.Buckets?.find(b => b.Name === 'bizzin-podcasts')) {
      console.log('✅ Found target bucket: bizzin-podcasts');
    } else {
      console.log('⚠️  Target bucket "bizzin-podcasts" not found. Available buckets:', result.Buckets?.map(b => b.Name));
    }
    
  } catch (error) {
    console.error('❌ R2 connection failed:', error.name);
    console.error('Message:', error.message);
    
    if (error.name === 'SignatureDoesNotMatch') {
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Go to Cloudflare Dashboard > R2 Object Storage');
      console.log('2. Click "Manage R2 API Tokens"');
      console.log('3. Create new token with "Admin Read & Write" permissions');
      console.log('4. Copy the Access Key ID (32 chars) and Secret Access Key (64 chars)');
      console.log('5. Update your Replit secrets with the new values');
    }
  }
}

testR2Credentials().catch(console.error);