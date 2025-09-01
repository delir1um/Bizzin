/**
 * Utility functions for extracting metadata from media files
 */

/**
 * Extract duration from video/audio file
 * @param file - The media file
 * @returns Promise<number> - Duration in seconds
 */
export function extractMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    // Create appropriate media element based on file type
    const isVideo = file.type.startsWith('video/')
    const mediaElement = isVideo ? document.createElement('video') : document.createElement('audio')
    
    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file)
    
    // Set up event handlers
    const onLoadedMetadata = () => {
      const duration = mediaElement.duration
      
      // Clean up
      cleanup()
      
      if (isFinite(duration) && duration > 0) {
        resolve(Math.round(duration)) // Return duration in seconds
      } else {
        reject(new Error('Could not determine media duration'))
      }
    }
    
    const onError = () => {
      cleanup()
      reject(new Error('Failed to load media file for duration extraction'))
    }
    
    const cleanup = () => {
      mediaElement.removeEventListener('loadedmetadata', onLoadedMetadata)
      mediaElement.removeEventListener('error', onError)
      URL.revokeObjectURL(objectUrl)
    }
    
    // Add event listeners
    mediaElement.addEventListener('loadedmetadata', onLoadedMetadata)
    mediaElement.addEventListener('error', onError)
    
    // Set source and load metadata
    mediaElement.src = objectUrl
    mediaElement.load()
    
    // Set timeout for cases where metadata loading hangs
    setTimeout(() => {
      cleanup()
      reject(new Error('Timeout while extracting media duration'))
    }, 10000) // 10 second timeout
  })
}

/**
 * Format duration in seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns String - Formatted duration (e.g., "5m 30s")
 */
export function formatDurationDisplay(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes > 0) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  } else {
    return `${seconds}s`
  }
}

/**
 * Validate if file is a supported media type for duration extraction
 * @param file - The file to validate
 * @returns boolean - True if file type is supported
 */
export function isMediaFile(file: File): boolean {
  const supportedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mp3',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/mp4'
  ]
  
  return supportedTypes.includes(file.type.toLowerCase())
}