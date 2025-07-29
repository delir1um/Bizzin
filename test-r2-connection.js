// Test R2 connection with correct configuration
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const R2_CONFIG = {
  region: 'auto',
  endpoint: `https://${process.env.VITE_CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Important for R2
}

const client = new S3Client(R2_CONFIG)

async function testR2Connection() {
  try {
    console.log('Testing R2 connection...')
    console.log('Config:', {
      endpoint: R2_CONFIG.endpoint,
      bucket: process.env.VITE_CLOUDFLARE_R2_BUCKET_NAME,
      hasAccessKey: !!process.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY
    })
    
    const command = new ListObjectsV2Command({
      Bucket: process.env.VITE_CLOUDFLARE_R2_BUCKET_NAME,
      MaxKeys: 1
    })
    
    const result = await client.send(command)
    console.log('✅ R2 connection successful!', result)
    
  } catch (error) {
    console.error('❌ R2 connection failed:', error)
  }
}

testR2Connection()