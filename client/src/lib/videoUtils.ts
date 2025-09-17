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
 * Check if a URL is a direct R2 URL that might have CORS issues
 */
export function isDirectR2Url(url: string): boolean {
  return url.includes('.r2.cloudflarestorage.com/') || url.includes('.r2.dev/');
}