// AI Version Display Utility

export const AI_VERSION_DISPLAY_MAP = {
  'hugging-face-server': 'Enhanced AI v3.0',
  'hugging-face-ai': 'Enhanced AI v3.0',
  'enhanced_local': 'Smart Analysis v2.0',
  'fallback-system': 'Basic Analysis v1.0',
  'local-analysis': 'Local Analysis v1.5'
} as const;

export type AIAnalysisSource = keyof typeof AI_VERSION_DISPLAY_MAP;

/**
 * Get user-friendly display text for AI analysis version
 */
export function getVersionDisplayFromSource(source?: string): string {
  if (!source) return 'Smart Analysis v2.0';
  
  const mappedSource = source as AIAnalysisSource;
  return AI_VERSION_DISPLAY_MAP[mappedSource] || 'Smart Analysis v2.0';
}

/**
 * Get the current AI system version
 */
export function getCurrentAIVersion(): string {
  return 'Enhanced AI v3.0';
}

/**
 * Check if a source indicates high-quality AI analysis
 */
export function isEnhancedAI(source?: string): boolean {
  return source === 'hugging-face-server' || source === 'hugging-face-ai';
}