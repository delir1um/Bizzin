// Insights system configuration and feature flags
import { z } from 'zod';

const InsightsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  minConfidence: z.number().min(0).max(1).default(0.6),
  cacheTtl: z.number().positive().default(3600), // 1 hour
  fallbackToHuggingFace: z.boolean().default(true),
  maxRetries: z.number().positive().default(2),
  timeoutMs: z.number().positive().default(30000), // 30 seconds
});

export type InsightsConfig = z.infer<typeof InsightsConfigSchema>;

/**
 * Load and validate insights configuration from environment
 */
export function loadInsightsConfig(): InsightsConfig {
  const config = {
    enabled: process.env.INSIGHTS_ENABLED !== 'false',
    minConfidence: parseFloat(process.env.INSIGHTS_MIN_CONFIDENCE || '0.6'),
    cacheTtl: parseInt(process.env.INSIGHTS_CACHE_TTL || '3600'),
    fallbackToHuggingFace: process.env.INSIGHTS_FALLBACK_TO_HF !== 'false',
    maxRetries: parseInt(process.env.INSIGHTS_MAX_RETRIES || '2'),
    timeoutMs: parseInt(process.env.INSIGHTS_TIMEOUT_MS || '30000'),
  };

  const result = InsightsConfigSchema.safeParse(config);
  
  if (!result.success) {
    console.error('❌ Invalid insights configuration:', result.error.flatten());
    // Return safe defaults
    return InsightsConfigSchema.parse({});
  }

  console.log('✅ Insights configuration loaded:', {
    enabled: result.data.enabled,
    minConfidence: result.data.minConfidence,
    cacheTtl: `${result.data.cacheTtl}s`,
    fallbackEnabled: result.data.fallbackToHuggingFace
  });

  return result.data;
}

export const insightsConfig = loadInsightsConfig();