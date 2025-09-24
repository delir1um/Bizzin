import { findBestWorkingProvider, AI_CONFIG } from './kimi.js';
import { 
  KimiBusinessAnalysisSchema, 
  validateKimiAnalysis, 
  KIMI_BUSINESS_ANALYSIS_PROMPT,
  type KimiBusinessAnalysis 
} from '../../shared/schemas/kimiAnalysis.js';

interface AnalysisRequest {
  entry_text: string;
  recent_entries?: string[];
  goals?: string[];
  user_id?: string;
}

// Cache for reducing API calls and costs
const analysisCache = new Map<string, { data: KimiBusinessAnalysis; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Clear cache to fix duplicate analysis bug
console.log('🔄 Clearing analysis cache to fix duplicate analysis issue...');
analysisCache.clear();

/**
 * Unified business analysis using best available AI provider
 * Primary: Qwen3 (free), Backup: Kimi K2 (cheap)
 * Replaces both HuggingFace sentiment analysis and Claude insights generation
 */
export async function analyzeBusinessJournalEntry(request: AnalysisRequest): Promise<KimiBusinessAnalysis> {
  const startTime = Date.now();
  
  // Input validation
  if (!request.entry_text || request.entry_text.length < 10) {
    throw new Error('Entry text too short for meaningful analysis');
  }
  
  // Generate cache key
  const cacheKey = generateCacheKey(request);
  const cached = analysisCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('✅ Returning cached Kimi analysis');
    return cached.data;
  }
  
  try {
    console.log('🚀 Starting unified AI business analysis (Qwen3 free -> Kimi K2 backup)...');
    
    // Find the best working AI provider
    const aiProvider = await findBestWorkingProvider();
    if (!aiProvider) {
      throw new Error('No AI providers are available');
    }
    
    console.log(`✅ Using ${aiProvider.provider.name} (${aiProvider.provider.cost})`);
    
    // Prepare context
    const recentContext = request.recent_entries?.slice(0, 2)?.join('. ') || 'No recent context';
    const goalsContext = request.goals?.slice(0, 3)?.join(', ') || 'No specific goals mentioned';
    
    // Build prompt with context and current date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Africa/Johannesburg' // User's timezone from replit.md
    });
    
    const prompt = KIMI_BUSINESS_ANALYSIS_PROMPT
      .replace('{current_date}', currentDate)
      .replace('{entry_text}', request.entry_text)
      .replace('{recent_entries}', recentContext)
      .replace('{goals}', goalsContext)
      .replace('{entry_length}', request.entry_text.length.toString());
    
    // Call AI API with best provider
    const response = await aiProvider.client.chat.completions.create({
      model: aiProvider.model,
      messages: [
        {
          role: "system",
          content: "You are a business analysis expert. Respond with valid JSON only, no additional text."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.max_tokens,
    });
    
    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error(`Empty response from ${aiProvider.provider.name} API`);
    }
    
    // Parse and validate response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid JSON response from ${aiProvider.provider.name}: ${errorMessage}`);
    }
    
    // Add processing metadata
    parsedResponse.analysis_metadata.processing_time_ms = Date.now() - startTime;
    parsedResponse.analysis_metadata.cost_estimate = estimateCost(prompt, responseText, aiProvider.provider.cost);
    parsedResponse.analysis_metadata.provider_used = aiProvider.provider.name;
    
    // Validate against schema
    const validatedAnalysis = validateKimiAnalysis(parsedResponse);
    
    // Apply post-processing quality checks
    const finalAnalysis = await applyQualityChecks(validatedAnalysis, request.entry_text);
    
    // Cache successful result
    analysisCache.set(cacheKey, {
      data: finalAnalysis,
      timestamp: Date.now()
    });
    
    console.log(`✅ ${aiProvider.provider.name} unified analysis completed successfully`);
    return finalAnalysis;
    
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    
    // Fallback to basic analysis if API fails
    console.log('🔄 Falling back to basic analysis...');
    return generateFallbackAnalysis(request.entry_text, startTime);
  }
}

/**
 * Quality checks and post-processing
 */
async function applyQualityChecks(analysis: KimiBusinessAnalysis, originalText: string): Promise<KimiBusinessAnalysis> {
  // Check for generic/banned phrases in actions
  const bannedPhrases = [
    'believe in yourself',
    'stay motivated', 
    'entrepreneurial spirit',
    'trust the process',
    'think big',
    'difficult moments reveal'
  ];
  
  let hasGenericContent = false;
  for (const action of analysis.insights.actions) {
    if (bannedPhrases.some(phrase => action.toLowerCase().includes(phrase))) {
      hasGenericContent = true;
      break;
    }
  }
  
  // Reduce confidence if generic content detected
  if (hasGenericContent) {
    analysis.insights.confidence = Math.max(0.3, analysis.insights.confidence - 0.3);
    console.warn('⚠️ Generic content detected, reducing confidence score');
  }
  
  // Ensure actions are specific enough (minimum 20 characters each)
  analysis.insights.actions = analysis.insights.actions.filter(action => action.length >= 20);
  
  // Add more actions if we filtered too many out
  while (analysis.insights.actions.length < 2) {
    analysis.insights.actions.push(`Review and analyze the business situation described: "${originalText.substring(0, 50)}..."`);
  }
  
  return analysis;
}

/**
 * Generate cache key for request using actual content hashing
 */
function generateCacheKey(request: AnalysisRequest): string {
  // Create a simple hash from the actual content
  const textContent = request.entry_text.toLowerCase().replace(/\s+/g, ' ').trim();
  const contextContent = (request.recent_entries || []).join('|').toLowerCase();
  const goalsContent = (request.goals || []).join('|').toLowerCase();
  
  // Simple hash function to avoid collisions
  function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  const textHash = simpleHash(textContent);
  const contextHash = simpleHash(contextContent);
  const goalsHash = simpleHash(goalsContent);
  
  return `kimi_${textHash}_${contextHash}_${goalsHash}`;
}

/**
 * Estimate API cost based on token usage and provider
 */
function estimateCost(prompt: string, response: string, providerCost: string): number {
  // Qwen3 free tier costs nothing
  if (providerCost === "FREE") {
    return 0;
  }
  
  // Rough token estimation: 1 token ≈ 4 characters
  const inputTokens = prompt.length / 4;
  const outputTokens = response.length / 4;
  
  // Default to Kimi K2 pricing if cost string not parseable
  let inputPrice = 0.60;
  let outputPrice = 2.50;
  
  // Try to parse cost from provider string
  if (providerCost.includes("0.15-2.50")) {
    inputPrice = 0.15;
    outputPrice = 2.50;
  } else if (providerCost.includes("0.735-2.94")) {
    inputPrice = 0.735;
    outputPrice = 2.94;
  }
  
  const inputCost = (inputTokens / 1000000) * inputPrice;
  const outputCost = (outputTokens / 1000000) * outputPrice;
  
  return inputCost + outputCost;
}

/**
 * Fallback analysis when API fails
 */
function generateFallbackAnalysis(entryText: string, startTime: number): KimiBusinessAnalysis {
  console.log('🔄 Generating fallback analysis...');
  
  // Basic mood detection
  const text = entryText.toLowerCase();
  let mood = 'focused';
  let energy: 'high' | 'medium' | 'low' = 'medium';
  let category: 'achievement' | 'challenge' | 'growth' | 'planning' | 'learning' | 'reflection' = 'reflection';
  
  if (text.includes('excited') || text.includes('amazing') || text.includes('success')) {
    mood = 'excited';
    energy = 'high';
    category = 'achievement';
  } else if (text.includes('frustrated') || text.includes('problem') || text.includes('difficult')) {
    mood = 'frustrated';
    energy = 'low';
    category = 'challenge';
  } else if (text.includes('growth') || text.includes('scaling') || text.includes('revenue')) {
    mood = 'confident';
    energy = 'high';
    category = 'growth';
  }
  
  return {
    sentiment: {
      primary_mood: mood,
      energy_level: energy,
      confidence: 70,
      business_category: category,
      emotions: ['determined', 'focused', 'thoughtful'],
    },
    insights: {
      summary: `Business journal analysis of ${entryText.length} character entry`,
      actions: [
        'Review the current business situation and identify key priorities',
        'Document specific outcomes and next steps from this experience',
      ],
      risks: [
        'Important business details may need further analysis and planning',
      ],
      confidence: 0.6,
      tags: ['business-journal', 'analysis', 'planning'],
    },
    analysis_metadata: {
      model_version: 'fallback-v1.0',
      entry_chars: entryText.length,
      processing_time_ms: Date.now() - startTime,
      cost_estimate: 0,
    },
  };
}

// Export for testing
export { analysisCache };

// Clear cache function for testing
export function clearAnalysisCache(): void {
  analysisCache.clear();
  console.log('Kimi analysis cache cleared');
}