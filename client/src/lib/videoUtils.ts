/**
 * Utility functions for handling video URLs and R2 proxy conversion
 */

/**
 * Convert R2 direct URLs to proxy URLs to avoid CORS issues
 */
export function convertToProxyUrl(videoUrl: string): string {
  if (!videoUrl) return videoUrl;
  
  // CONVERT ALL R2 URLs TO PUBLIC R2 (both private and public)
  if (videoUrl.includes('.r2.cloudflarestorage.com/') || videoUrl.includes('.r2.dev/')) {
    // Extract the key (path) from any R2 URL
    try {
      const url = new URL(videoUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      const publicUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/${key}`;
      console.log('🔄 Converting R2 URL to public:', videoUrl, '->', publicUrl);
      return publicUrl;
    } catch (error) {
      console.warn('Failed to parse R2 URL:', videoUrl);
      return videoUrl;
    }
  }
  
  // Convert proxy URLs back to direct R2 URLs if needed
  if (videoUrl.startsWith('/api/video-proxy/')) {
    const key = videoUrl.replace('/api/video-proxy/', '');
    const directUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/${key}`;
    console.log('🔄 Converting proxy URL to direct R2:', directUrl);
    return directUrl;
  }
  
  // For local URLs or file names, construct direct R2 URL
  return videoUrl;
}

/**
 * Convert R2 URLs to proxy URLs with intelligent fallback routing
 * Tries organized folder structure first, falls back to videos/ for existing files
 */
export function convertToProxyUrlWithFallback(videoUrl: string, preferredMediaType?: 'audio' | 'video'): string {
  if (!videoUrl) return videoUrl;
  
  // CONVERT ALL R2 URLs TO PUBLIC R2 (both private and public)
  if (videoUrl.includes('.r2.cloudflarestorage.com/') || videoUrl.includes('.r2.dev/')) {
    // Extract the key (path) from any R2 URL
    try {
      const url = new URL(videoUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      const publicUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/${key}`;
      console.log('🔄 Converting R2 URL to public with fallback:', videoUrl, '->', publicUrl);
      return publicUrl;
    } catch (error) {
      console.warn('Failed to parse R2 URL:', videoUrl);
      return videoUrl;
    }
  }
  
  // Convert proxy URLs to direct R2 URLs
  if (videoUrl.startsWith('/api/video-proxy/')) {
    const key = videoUrl.replace('/api/video-proxy/', '');
    const directUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/${key}`;
    console.log('🔄 Converting proxy URL to direct R2 with fallback:', directUrl);
    return directUrl;
  }
  
  // For local file names, construct direct R2 URL with proper folder structure
  const filename = videoUrl.split('/').pop();
  if (filename) {
    const isAudioFile = filename.toLowerCase().includes('.mp3') || 
                       filename.toLowerCase().includes('.wav') || 
                       filename.toLowerCase().includes('.m4a') ||
                       filename.toLowerCase().includes('.aac') ||
                       filename.toLowerCase().includes('.ogg') ||
                       filename.toLowerCase().includes('.flac');
    
    const mediaType = preferredMediaType || (isAudioFile ? 'audio' : 'video');
    const organizedFolder = mediaType === 'audio' ? 'audio' : 'videos';
    
    const directUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/${organizedFolder}/${filename}`;
    console.log('🔗 Constructing direct R2 URL:', directUrl);
    return directUrl;
  }
  
  return videoUrl;
}

/**
 * Create audio source with intelligent fallback routing
 * Returns a source that can handle both organized and legacy folder structures
 */
export async function createFallbackAudioSource(originalUrl: string): Promise<string> {
  if (!originalUrl) return originalUrl;
  
  // Get direct R2 URL first
  const directUrl = convertToProxyUrlWithFallback(originalUrl, 'audio');
  
  // If it's already a complete R2 URL, return as-is
  if (directUrl.includes('.r2.dev/')) return directUrl;
  
  // Extract filename and test direct R2 paths
  const filename = originalUrl.split('/').pop();
  if (!filename) return originalUrl;
  
  try {
    // Test organized audio/ path first
    const organizedUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/audio/${filename}`;
    const testResponse = await fetch(organizedUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      console.log('✅ Audio file found in organized path:', organizedUrl);
      return organizedUrl;
    }
    
    // If organized path fails, try legacy videos/ folder
    const fallbackUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/videos/${filename}`;
    
    console.log('🔄 Audio file not in organized path, trying fallback:', fallbackUrl);
    
    const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' });
    
    if (fallbackResponse.ok) {
      console.log('✅ Audio file found in legacy path:', fallbackUrl);
      return fallbackUrl;
    }
    
    console.warn('⚠️ Audio file not found in either path, using organized path:', organizedUrl);
    return organizedUrl; // Return organized path as final fallback
    
  } catch (error) {
    console.warn('Error testing audio paths, using organized path:', error);
    const organizedUrl = `https://pub-b3498cd071e1420b9d379a5510ba4bb8.r2.dev/audio/${filename}`;
    return organizedUrl;
  }
}

/**
 * Check if a URL is a direct R2 URL that might have CORS issues
 */
export function isDirectR2Url(url: string): boolean {
  return url.includes('.r2.cloudflarestorage.com/') || url.includes('.r2.dev/');
}