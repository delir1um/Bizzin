import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
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
   * Upload video file to Cloudflare R2 via backend proxy
   */
  async uploadVideo(file: File, episodeId: string): Promise<string> {
    try {
      console.log('Uploading video via backend proxy:', { fileName: file.name, fileSize: file.size, fileType: file.type })
      
      // Convert file to base64 for backend transfer
      console.log('Converting file to base64...')
      const base64Data = await this.fileToBase64(file)
      console.log('File converted successfully')
      
      // Upload via backend API with timeout
      console.log('Sending to backend...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout
      
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeId,
          fileName: file.name,
          fileData: base64Data,
          contentType: file.type,
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || `Upload failed with status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Upload successful via backend!', result)
      
      return result.url
      
    } catch (error) {
      console.error('Backend upload error:', error)
      
      if ((error as any)?.name === 'AbortError') {
        throw new Error('Upload timed out after 2 minutes. Please try with a smaller file.')
      }
      
      throw new Error(`Upload failed: ${(error as any)?.message || 'Unknown error'}`)
    }
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:mime/type;base64, prefix
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Upload video thumbnail to Cloudflare R2 using presigned URL
   */
  async uploadThumbnail(file: File, episodeId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop()
    const fileName = `thumbnails/${episodeId}.${fileExtension}`
    
    try {
      console.log('Uploading thumbnail using presigned URL:', { fileName, fileSize: file.size, fileType: file.type })
      
      // Generate presigned URL for upload
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        ContentType: file.type,
        Metadata: {
          'episode-id': episodeId,
          'type': 'thumbnail',
          'upload-date': new Date().toISOString(),
        }
      })

      const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 })
      
      // Upload directly to R2 using presigned URL
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(`Thumbnail upload failed with status: ${uploadResponse.status}`)
      }
      
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
   * Delete file from R2
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      })

      await this.s3Client.send(command)
    } catch (error) {
      console.error('Error deleting file from R2:', error)
      throw new Error('Failed to delete file')
    }
  }

  /**
   * Delete video from R2 (legacy method)
   */
  async deleteVideo(videoKey: string): Promise<void> {
    return this.deleteFile(videoKey)
  }

  /**
   * Rename file in R2 (copy and delete)
   */
  async renameFile(oldKey: string, newKey: string): Promise<void> {
    try {
      // First, copy the file to the new location
      const copyCommand = new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${oldKey}`,
        Key: newKey,
      })

      await this.s3Client.send(copyCommand)

      // Then delete the old file
      await this.deleteFile(oldKey)
    } catch (error) {
      console.error('Error renaming file in R2:', error)
      throw new Error('Failed to rename file')
    }
  }

  /**
   * Extract video key from full URL
   */
  extractVideoKey(videoUrl: string): string {
    const url = new URL(videoUrl)
    return url.pathname.substring(1) // Remove leading slash
  }

  /**
   * List files in R2 bucket (frontend version - calls backend API)
   */
  async listFiles(): Promise<{ files: Array<{ key: string; size: number; lastModified: Date; contentType?: string }> }> {
    try {
      const response = await fetch('/api/r2/list-files', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error listing R2 files:', error)
      throw new Error('Failed to list files from storage')
    }
  }
}

export const r2Service = new CloudflareR2Service()