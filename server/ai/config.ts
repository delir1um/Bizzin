import { z } from 'zod';

// AI Configuration Schema with defaults from setup
const aiConfigSchema = z.object({
  MODEL: z.string().default('claude-sonnet-4-20250514'),
  MAX_TOKENS: z.number().min(1).max(4096).default(800),
  TEMPERATURE: z.number().min(0).max(1).default(0.2),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required')
});

// Load and validate configuration
export const AI_CONFIG = aiConfigSchema.parse({
  MODEL: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
  MAX_TOKENS: process.env.AI_MAX_TOKENS ? parseInt(process.env.AI_MAX_TOKENS) : 800,
  TEMPERATURE: process.env.AI_TEMPERATURE ? parseFloat(process.env.AI_TEMPERATURE) : 0.2,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
});

// Helper function to get Anthropic API key safely
export function getAnthropicKey(): string {
  if (!AI_CONFIG.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not found in environment variables. Please add it to Replit Secrets.');
  }
  return AI_CONFIG.ANTHROPIC_API_KEY;
}

// Validate configuration on startup
export function validateAiConfig(): void {
  try {
    aiConfigSchema.parse({
      MODEL: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
      MAX_TOKENS: process.env.AI_MAX_TOKENS ? parseInt(process.env.AI_MAX_TOKENS) : 800,
      TEMPERATURE: process.env.AI_TEMPERATURE ? parseFloat(process.env.AI_TEMPERATURE) : 0.2,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
    });
    console.log('✅ AI configuration validated successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Configuration validation failed';
    console.error('❌ AI configuration validation failed:', errorMessage);
    throw error;
  }
}