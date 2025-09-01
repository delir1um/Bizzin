/**
 * Utility functions for handling video URLs and R2 proxy conversion
 */

/**
 * Convert R2 direct URLs to proxy URLs to avoid CORS issues
 */
export function convertToProxyUrl(videoUrl: string): string {
  if (!videoUrl) return videoUrl;
  
  console.log('Converting video URL:', videoUrl);
  
  // Check if it's a direct R2 URL that needs conversion
  if (videoUrl.includes('.r2.cloudflarestorage.com/') || videoUrl.includes('.r2.dev/')) {
    // Extract the key (path after the domain)
    try {
      const url = new URL(videoUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      const proxyUrl = `/api/video-proxy/${key}`;
      console.log('Converted to proxy URL:', proxyUrl);
      return proxyUrl;
    } catch (error) {
      console.warn('Failed to parse video URL for proxy conversion:', videoUrl);
      return videoUrl;
    }
  }
  
  // If it's already a proxy URL or local URL, return as-is
  console.log('URL is already a proxy or local URL, returning as-is:', videoUrl);
  return videoUrl;
}

/**
 * Check if a URL is a direct R2 URL that might have CORS issues
 */
export function isDirectR2Url(url: string): boolean {
  return url.includes('.r2.cloudflarestorage.com/') || url.includes('.r2.dev/');
}