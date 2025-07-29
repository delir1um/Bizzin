import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 Configuration
const R2_CONFIG = {
  region: 'auto', // Cloudflare R2 uses 'auto' as region
  endpoint: `https://${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Important for R2 compatibility
}

const BUCKET_NAME = import.meta.env.VITE_CLOUDFLARE_R2_BUCKET_NAME || 'bizzin-podcasts'

class CloudflareR2Service {
  private s3Client: S3Client

  constructor() {
    this.s3Client = new S3Client(R2_CONFIG)
  }

  /**
   * Upload video file to Cloudflare R2
   */
  async uploadVideo(file: File, episodeId: string): Promise<string> {
    // Debug configuration
    console.log('R2 Config Debug:', {
      accountId: import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID ? 'Set' : 'Missing',
      accessKeyId: import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID ? 'Set' : 'Missing',
      secretKey: import.meta.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
      bucketName: BUCKET_NAME,
      publicDomain: import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN || 'Missing',
      endpoint: R2_CONFIG.endpoint
    })

    // Validate required environment variables
    if (!import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('Missing VITE_CLOUDFLARE_ACCOUNT_ID environment variable')
    }
    if (!import.meta.env.VITE_CLOUDFLARE_R2_ACCESS_KEY_ID) {
      throw new Error('Missing VITE_CLOUDFLARE_R2_ACCESS_KEY_ID environment variable')
    }
    if (!import.meta.env.VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
      throw new Error('Missing VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY environment variable')
    }
    if (!import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN) {
      throw new Error('Missing VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN environment variable')
    }

    const fileExtension = file.name.split('.').pop()
    const fileName = `videos/${episodeId}.${fileExtension}`
    
    try {
      console.log('Attempting to upload:', { fileName, fileSize: file.size, fileType: file.type })
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'episode-id': episodeId,
          'original-name': file.name,
          'upload-date': new Date().toISOString(),
        }
      })

      console.log('Sending command to R2...')
      const result = await this.s3Client.send(command)
      console.log('Upload successful!', result)
      
      // Return the public URL
      const publicUrl = `https://${import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN}/${fileName}`
      console.log('Generated public URL:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Detailed R2 upload error:', error)
      console.error('Error name:', (error as any)?.name)
      console.error('Error message:', (error as any)?.message)
      console.error('Error stack:', (error as any)?.stack)
      
      if ((error as any)?.$metadata) {
        console.error('AWS SDK metadata:', (error as any).$metadata)
      }
      
      throw new Error(`R2 Upload failed: ${(error as any)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Upload video thumbnail to Cloudflare R2
   */
  async uploadThumbnail(file: File, episodeId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop()
    const fileName = `thumbnails/${episodeId}.${fileExtension}`
    
    try {
      console.log('Uploading thumbnail:', { fileName, fileSize: file.size, fileType: file.type })
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'episode-id': episodeId,
          'type': 'thumbnail',
          'upload-date': new Date().toISOString(),
        }
      })

      await this.s3Client.send(command)
      
      const publicUrl = `https://${import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN}/${fileName}`
      console.log('Thumbnail upload successful:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Error uploading thumbnail to R2:', error)
      throw new Error('Failed to upload thumbnail')
    }
  }

  /**
   * Generate signed URL for private video access (if needed)
   */
  async getSignedVideoUrl(videoKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: videoKey,
      })

      return await getSignedUrl(this.s3Client, command, { expiresIn })
    } catch (error) {
      console.error('Error generating signed URL:', error)
      throw new Error('Failed to generate signed URL')
    }
  }

  /**
   * Delete video from R2
   */
  async deleteVideo(videoKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: videoKey,
      })

      await this.s3Client.send(command)
    } catch (error) {
      console.error('Error deleting video from R2:', error)
      throw new Error('Failed to delete video')
    }
  }

  /**
   * Extract video key from full URL
   */
  extractVideoKey(videoUrl: string): string {
    const url = new URL(videoUrl)
    return url.pathname.substring(1) // Remove leading slash
  }
}

export const r2Service = new CloudflareR2Service()