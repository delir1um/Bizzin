import { z } from 'zod';

// Unified schema for Kimi K2 business journal analysis
// Combines sentiment analysis + business insights in single response
export const KimiBusinessAnalysisSchema = z.object({
  // Sentiment Analysis (replaces HuggingFace)
  sentiment: z.object({
    primary_mood: z.string().describe("Primary emotional state: excited, focused, frustrated, confident, etc."),
    energy_level: z.enum(['high', 'medium', 'low']).describe("Energy level detected"),
    confidence: z.number().min(0).max(100).describe("Analysis confidence percentage"),
    business_category: z.enum(['achievement', 'challenge', 'growth', 'planning', 'learning', 'reflection']).describe("Business context category"),
    emotions: z.array(z.string()).max(3).describe("Top 3 detected emotions"),
  }),
  
  // Business Insights (replaces Claude)
  insights: z.object({
    summary: z.string().max(200).describe("Brief situation summary focused on business implications"),
    actions: z.array(z.string()).min(2).max(4).describe("Specific actionable steps with deadlines where applicable"),
    risks: z.array(z.string()).min(1).max(3).describe("Potential business risks or challenges to watch"),
    opportunities: z.array(z.string()).max(2).describe("Business opportunities identified").optional(),
    confidence: z.number().min(0).max(1).describe("Insight quality confidence score"),
    tags: z.array(z.string()).max(5).describe("Relevant business tags/keywords"),
  }),
  
  // Metadata
  analysis_metadata: z.object({
    model_version: z.string().default("unified-ai-v1.0"),
    provider_used: z.string().describe("AI provider that was used").optional(),
    entry_chars: z.number().describe("Character count of analyzed entry"),
    processing_time_ms: z.number().describe("Analysis processing time"),
    cost_estimate: z.number().describe("Estimated API cost in USD").optional(),
  }),
}).strict();

export type KimiBusinessAnalysis = z.infer<typeof KimiBusinessAnalysisSchema>;

// Validation function with detailed error reporting
export function validateKimiAnalysis(data: unknown): KimiBusinessAnalysis {
  try {
    return KimiBusinessAnalysisSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`Kimi analysis validation failed: ${issues.join(', ')}`);
    }
    throw error;
  }
}

// Prompt template for Kimi K2 business analysis
export const KIMI_BUSINESS_ANALYSIS_PROMPT = `You are a senior business advisor specializing in entrepreneurial insights. Analyze this business journal entry and provide comprehensive analysis in the exact JSON format specified.

CRITICAL REQUIREMENTS:
1. Generate SPECIFIC actionable steps with dates/deadlines when possible
2. Identify REAL business risks based on the actual situation
3. Avoid generic motivational advice
4. Focus on concrete business implications
5. Ensure all arrays have the required minimum items

Journal Entry: "{entry_text}"

Recent Context: {recent_entries}
Current Goals: {goals}

Respond with valid JSON only, following this exact structure:
{
  "sentiment": {
    "primary_mood": "string (excited/focused/frustrated/confident/determined/etc)",
    "energy_level": "high|medium|low", 
    "confidence": number 0-100,
    "business_category": "achievement|challenge|growth|planning|learning|reflection",
    "emotions": ["emotion1", "emotion2", "emotion3"]
  },
  "insights": {
    "summary": "Brief business situation summary (max 200 chars)",
    "actions": [
      "Specific action with deadline if applicable",
      "Another concrete next step", 
      "Third actionable item"
    ],
    "risks": [
      "Real business risk based on situation",
      "Another potential challenge"
    ],
    "opportunities": ["Business opportunity if identified"],
    "confidence": 0.85,
    "tags": ["relevant", "business", "tags"]
  },
  "analysis_metadata": {
    "model_version": "kimi-k2-v1.0",
    "entry_chars": {entry_length},
    "processing_time_ms": 0
  }
}`;

// Legacy compatibility types for existing UI components
export interface LegacyBusinessSentiment {
  primary_mood: string;
  confidence: number;
  energy: 'high' | 'medium' | 'low';
  emotions: string[];
  insights: string[];
  business_category: string;
  analysis_source: string;
}

// Convert Kimi analysis to legacy format for UI compatibility
export function convertToLegacyFormat(analysis: KimiBusinessAnalysis): LegacyBusinessSentiment {
  return {
    primary_mood: analysis.sentiment.primary_mood,
    confidence: analysis.sentiment.confidence,
    energy: analysis.sentiment.energy_level,
    emotions: analysis.sentiment.emotions,
    insights: analysis.insights.actions, // Use actions as insights for UI
    business_category: analysis.sentiment.business_category,
    analysis_source: 'kimi-unified',
  };
}