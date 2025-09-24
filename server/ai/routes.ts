import { Router, Request, Response } from 'express';
import { z } from 'zod';
// REMOVED: Expensive Claude API - replaced by unified Qwen3/Kimi system
// import { chat } from './anthropic.js';
import { AI_CONFIG } from './config.js';
import { insightsConfig } from '../config/insights.js';
import { InsightResponse } from '../../shared/schemas/insights.js';
import { hasBannedPhrases, hasSpecificOverlap, getValidationContext } from '../lib/specificity.js';
import { analyzeBusinessJournalEntry } from './kimiAnalysis.js';
import { convertToLegacyFormat } from '../../shared/schemas/kimiAnalysis.js';

const router = Router();

// Validation schema for chat requests
const chatRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  stream: z.boolean().default(true),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  max_tokens: z.number().min(1).max(4096).optional(),
  cacheSystem: z.boolean().default(true),
  enableTools: z.boolean().default(false),
  system: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).default([])
});

// Validation schema for insights generation requests
const insightRequestSchema = z.object({
  entry_id: z.string().min(1, 'Entry ID is required'),
  entry_text: z.string().min(30, 'Entry text must be at least 30 characters'),
  entry_mood: z.string().optional(),
  entry_energy: z.string().optional(),
  recent_entries: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  user_id: z.string().min(1, 'User ID is required')
});

// Validation schema for unified Kimi analysis requests
const kimiAnalysisSchema = z.object({
  entry_text: z.string().min(10, 'Entry text must be at least 10 characters'),
  recent_entries: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  user_id: z.string().optional()
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    ok: true,
    model: AI_CONFIG.MODEL,
    timestamp: new Date().toISOString()
  });
});

// Main chat endpoint
router.post('/chat', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = chatRequestSchema.parse(req.body);
    
    const {
      prompt,
      stream,
      model,
      temperature,
      max_tokens,
      cacheSystem,
      enableTools,
      system,
      history
    } = validatedData;

    // Build messages array from history + current prompt
    const messages = [
      ...history,
      { role: 'user' as const, content: prompt }
    ];

    // Default system message if none provided
    const systemMessage = system || 'You are a helpful AI assistant. Provide clear, concise, and accurate responses.';

    const chatOptions = {
      system: systemMessage,
      messages,
      model,
      temperature,
      max_tokens,
      stream,
      cacheSystem,
      tools: enableTools ? [] : [] // Tools functionality disabled for now
    };

    if (stream) {
      // Set up Server-Sent Events headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const chatStream = await chat(chatOptions);
      
      if ('on' in chatStream) {
        // Handle streaming response with EventEmitter
        const emitter = chatStream as any;
        emitter.on('data', (token: string) => {
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        });

        emitter.on('done', (result: { text: string }) => {
          res.write(`data: ${JSON.stringify({ done: true, fullText: result.text })}\n\n`);
          res.end();
          
          // Log usage after completion
          console.log(`✅ Chat completed - Model: ${model || AI_CONFIG.MODEL}, Prompt length: ${prompt.length} chars`);
        });

        emitter.on('error', (error: Error) => {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
          console.error('❌ Chat stream error:', error.message);
        });

        // Handle client disconnect
        req.on('close', () => {
          console.log('Client disconnected from chat stream');
        });
      }
    } else {
      // Non-streaming response
      const result = await chat(chatOptions);
      
      if (typeof result === 'object' && 'text' in result) {
        const response = {
          text: result.text,
          usage: result.usage
        };

        // Log usage
        if (result.usage) {
          console.log(`✅ Chat completed - Model: ${model || AI_CONFIG.MODEL}, Input: ${result.usage.input_tokens} tokens, Output: ${result.usage.output_tokens} tokens`);
        }

        res.json(response);
      } else {
        throw new Error('Unexpected response format from chat function');
      }
    }
  } catch (error) {
    console.error('❌ Chat endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: errorMessage
    });
  }
});

// Insights generation endpoint
router.post('/insights/generate', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = insightRequestSchema.parse(req.body);
    
    const {
      entry_id,
      entry_text,
      entry_mood,
      entry_energy,
      recent_entries,
      goals,
      user_id
    } = validatedData;

    // Build prompt with grounded context
    const prompt = buildInsightPrompt(entry_text, entry_mood, entry_energy, recent_entries, goals);
    
    // Generate insight with JSON-only output
    let insightJson = await generateInsightJson(prompt);
    
    // Validate against schema and specificity
    let validationResult = validateInsight(entry_text, insightJson, entry_id);
    
    if (!validationResult.isValid) {
      console.log('First attempt failed validation, reprompting:', validationResult.reason);
      
      // Reprompt with specificity requirements
      const reprompt = prompt + "\n\nREWRITE with concrete specifics from ENTRY. Replace any generic wording. Quote specific details, numbers, or names from the journal entry.";
      insightJson = await generateInsightJson(reprompt);
      
      // Re-validate
      validationResult = validateInsight(entry_text, insightJson, entry_id);
      
      if (!validationResult.isValid) {
        console.error('Second attempt also failed validation:', validationResult.reason);
        return res.status(422).json({
          error: "Not enough context to generate a safe insight.",
          details: validationResult.reason
        });
      }
    }

    // Log successful generation
    console.log(`✅ Insight generated for entry ${entry_id}, user ${user_id}`);
    
    res.json(validationResult.insight);
    
  } catch (error) {
    console.error('❌ Insights generation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: errorMessage
    });
  }
});

// Helper function to build insight generation prompt
function buildInsightPrompt(entryText: string, mood?: string, energy?: string, recentEntries: string[] = [], goals: string[] = []): string {
  const systemPrompt = `You are "Bizzin Coach", a concise business mentor specializing in South African entrepreneurship.

STRICT RULES:
- Only use facts from the provided inputs: ENTRY, RECENT_ENTRIES, GOALS. If insufficient, say so.
- No generic platitudes ("stay positive", "keep going", "work hard", "embrace challenges", etc.).
- Every summary must quote or reference at least one concrete noun/metric from ENTRY.
- Actions must be specific, verifiable, and time-bound (who/what/by when).
- Use South African English spelling and business context.
- Return JSON that matches the provided schema exactly.

JSON Schema:
{
  "summary": "string (30-280 chars, specific to entry)",
  "actions": ["string array (2-5 concrete next steps with owners/deadlines)"],
  "risks": ["string array (0-3 potential risks, optional)"],
  "sentiment": "Excited|Positive|Neutral|Concerned|Stressed",
  "confidence": "number (0-1)",
  "tags": ["string array (1-5 relevant business tags)"]
}`;

  let userPrompt = `ENTRY: "${entryText}"`;
  
  if (mood || energy) {
    userPrompt += `\nCURRENT STATE: mood=${mood || 'unknown'}, energy=${energy || 'unknown'}`;
  }
  
  if (recentEntries.length > 0) {
    userPrompt += `\nRECENT_ENTRIES: ${recentEntries.slice(0, 3).map((entry, i) => `${i+1}. ${entry.substring(0, 150)}...`).join('\n')}`;
  }
  
  if (goals.length > 0) {
    userPrompt += `\nGOALS: ${goals.slice(0, 3).map((goal, i) => `${i+1}. ${goal}`).join('\n')}`;
  }
  
  userPrompt += `\n\nProvide actionable business insight in JSON format. Reference specific details from the ENTRY.`;

  return systemPrompt + '\n\n' + userPrompt;
}

// Helper function to generate insight JSON using Claude
async function generateInsightJson(prompt: string): Promise<any> {
  const chatOptions = {
    system: "You are a business insights generator. Always respond with valid JSON only.",
    messages: [{ role: 'user' as const, content: prompt }],
    model: AI_CONFIG.MODEL,
    temperature: 0.2,
    max_tokens: 500,
    stream: false
  };

  const result = await chat(chatOptions);
  
  if (typeof result === 'object' && 'text' in result) {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : result.text;
      return JSON.parse(jsonText);
    } catch (parseError) {
      throw new Error(`Failed to parse JSON response: ${result.text}`);
    }
  } else {
    throw new Error('Unexpected response format from chat function');
  }
}

// Helper function to validate insight response
function validateInsight(entryText: string, insightJson: any, entryId: string): { isValid: boolean; insight?: any; reason?: string } {
  try {
    // First, validate against Zod schema
    const insight = InsightResponse.parse({
      entry_id: entryId,
      model_version: "v1.0",
      grounded_on: {
        entry_chars: entryText.length,
        recent_entries_used: 0, // Would be passed from request
        goals_used: 0 // Would be passed from request
      },
      insight: insightJson
    });

    // Check for banned phrases
    if (hasBannedPhrases(insightJson.summary)) {
      return { isValid: false, reason: "Contains banned generic phrases" };
    }

    // Check for specific overlap with entry
    if (!hasSpecificOverlap(entryText, insightJson.summary)) {
      return { isValid: false, reason: "Insufficient specific overlap with entry text" };
    }

    // Validate action specificity (basic check)
    const hasSpecificActions = insightJson.actions.some((action: string) => 
      /\b(?:by|within|contact|schedule|review|implement|create|send|call|meet)\b/i.test(action)
    );
    
    if (!hasSpecificActions) {
      return { isValid: false, reason: "Actions too vague, need specific verbs and timelines" };
    }

    return { isValid: true, insight };

  } catch (error) {
    return { isValid: false, reason: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Unified Kimi K2 analysis endpoint (replaces HuggingFace + Claude)
router.post('/kimi/analyze', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = kimiAnalysisSchema.parse(req.body);
    
    const {
      entry_text,
      recent_entries,
      goals,
      user_id
    } = validatedData;

    console.log(`🚀 Starting unified Kimi K2 analysis for ${entry_text.length} char entry...`);
    
    // Call unified Kimi analysis
    const kimiAnalysis = await analyzeBusinessJournalEntry({
      entry_text,
      recent_entries,
      goals,
      user_id
    });
    
    // Convert to legacy format for existing UI compatibility
    const legacyFormat = convertToLegacyFormat(kimiAnalysis);
    
    // Also return the raw analysis for future use
    const response = {
      // Legacy format for immediate UI compatibility
      sentiment: legacyFormat,
      
      // New unified format for enhanced features
      unified_analysis: kimiAnalysis,
      
      // Metadata
      analysis_version: 'kimi-unified-v1.0',
      cost_savings: '10x cheaper than Claude',
      processing_time_ms: kimiAnalysis.analysis_metadata.processing_time_ms
    };

    console.log(`✅ Kimi K2 unified analysis completed in ${kimiAnalysis.analysis_metadata.processing_time_ms}ms`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Kimi analysis endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      error: errorMessage
    });
  }
});

export default router;