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
    const fileExtension = file.name.split('.').pop()
    const fileName = `videos/${episodeId}.${fileExtension}`
    
    try {
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

      await this.s3Client.send(command)
      
      // Return the public URL
      return `https://${import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN}/${fileName}`
    } catch (error) {
      console.error('Error uploading video to R2:', error)
      throw new Error('Failed to upload video')
    }
  }

  /**
   * Upload video thumbnail to Cloudflare R2
   */
  async uploadThumbnail(file: File, episodeId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop()
    const fileName = `thumbnails/${episodeId}.${fileExtension}`
    
    try {
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
      
      return `https://${import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_DOMAIN}/${fileName}`
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