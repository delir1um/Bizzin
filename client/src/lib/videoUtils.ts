/**
 * Utility functions for handling video URLs and R2 proxy conversion
 */

/**
 * Convert R2 direct URLs to proxy URLs to avoid CORS issues
 */
export function convertToProxyUrl(videoUrl: string): string {
  if (!videoUrl) return videoUrl;
  
  // If it's already a proxy URL, return as-is
  if (videoUrl.startsWith('/api/video-proxy/')) return videoUrl;
  
  // Check if it's a direct R2 URL that needs conversion (all R2 endpoints)
  if (videoUrl.includes('.r2.cloudflarestorage.com/') || videoUrl.includes('.r2.dev/')) {
    // Extract the key (path after the domain)
    try {
      const url = new URL(videoUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      return `/api/video-proxy/${key}`;
    } catch (error) {
      console.warn('Failed to parse video URL for proxy conversion:', videoUrl);
      return videoUrl;
    }
  }
  
  // Return local URLs or other formats as-is
  return videoUrl;
}

/**
 * Convert R2 URLs to proxy URLs with intelligent fallback routing
 * Tries organized folder structure first, falls back to videos/ for existing files
 */
export function convertToProxyUrlWithFallback(videoUrl: string, preferredMediaType?: 'audio' | 'video'): string {
  if (!videoUrl) return videoUrl;
  
  // If it's already a proxy URL, return as-is
  if (videoUrl.startsWith('/api/video-proxy/')) return videoUrl;
  
  // Check if it's a direct R2 URL that needs conversion
  if (videoUrl.includes('.r2.cloudflarestorage.com/') || videoUrl.includes('.r2.dev/')) {
    const filename = videoUrl.split('/').pop();
    
    if (filename) {
      // Determine if this is an audio file based on extension
      const isAudioFile = filename.toLowerCase().includes('.mp3') || 
                         filename.toLowerCase().includes('.wav') || 
                         filename.toLowerCase().includes('.m4a') ||
                         filename.toLowerCase().includes('.aac') ||
                         filename.toLowerCase().includes('.ogg') ||
                         filename.toLowerCase().includes('.flac');
      
      // Use preferred media type or auto-detect from filename
      const mediaType = preferredMediaType || (isAudioFile ? 'audio' : 'video');
      const organizedFolder = mediaType === 'audio' ? 'audio' : 'videos';
      
      // Return the organized path - fallback logic will be handled by createFallbackAudioSource
      return `/api/video-proxy/${organizedFolder}/${filename}`;
    }
  }
  
  // Return local URLs or other formats as-is
  return videoUrl;
}

/**
 * Create audio source with intelligent fallback routing
 * Returns a source that can handle both organized and legacy folder structures
 */
export async function createFallbackAudioSource(originalUrl: string): Promise<string> {
  if (!originalUrl) return originalUrl;
  
  // Convert to proxy URL first
  const proxyUrl = convertToProxyUrlWithFallback(originalUrl, 'audio');
  
  // If it's not a proxy URL, return as-is
  if (!proxyUrl.startsWith('/api/video-proxy/')) return proxyUrl;
  
  try {
    // Test if the organized path exists
    const testResponse = await fetch(proxyUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      console.log('✅ Audio file found in organized path:', proxyUrl);
      return proxyUrl;
    }
    
    // If organized path fails, try legacy videos/ folder
    const filename = proxyUrl.split('/').pop();
    const fallbackUrl = `/api/video-proxy/videos/${filename}`;
    
    console.log('🔄 Audio file not in organized path, trying fallback:', fallbackUrl);
    
    const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' });
    
    if (fallbackResponse.ok) {
      console.log('✅ Audio file found in legacy path:', fallbackUrl);
      return fallbackUrl;
    }
    
    console.warn('⚠️ Audio file not found in either path, using organized path:', proxyUrl);
    return proxyUrl; // Return organized path as final fallback
    
  } catch (error) {
    console.warn('Error testing audio paths, using organized path:', error);
    return proxyUrl;
  }
}

/**
 * Check if a URL is a direct R2 URL that might have CORS issues
 */
export function isDirectR2Url(url: string): boolean {
  return url.includes('.r2.cloudflarestorage.com/') || url.includes('.r2.dev/');
}