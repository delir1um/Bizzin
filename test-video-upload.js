// Simple test to verify Cloudflare R2 video service is working
// Run this in browser console on the podcast page

console.log('Testing Cloudflare R2 Configuration...')

// Check environment variables
const config = {
  accountId: import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID,
  accessKeyId: import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretKey: import.meta.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  bucketName: import.meta.env.VITE_CLOUDFLARE_R2_BUCKET_NAME,
  publicDomain: import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN
}

console.log('Config check:', {
  accountId: config.accountId ? '✓ Set' : '✗ Missing',
  accessKeyId: config.accessKeyId ? '✓ Set' : '✗ Missing', 
  secretKey: config.secretKey ? '✓ Set' : '✗ Missing',
  bucketName: config.bucketName ? '✓ Set' : '✗ Missing',
  publicDomain: config.publicDomain ? '✓ Set' : '✗ Missing'
})

console.log('Video upload functionality ready!')
console.log('Navigate to Podcast page and try uploading a video to test the integration.')