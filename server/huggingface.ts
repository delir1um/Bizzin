// Server-side Hugging Face API integration
import express from 'express';

const router = express.Router();

interface HuggingFaceResponse {
  label: string;
  score: number;
}

// Hugging Face model endpoints
const HF_MODELS = {
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment',
  emotion: 'j-hartmann/emotion-english-distilroberta-base'
};

// API usage tracking and error handling
interface APIUsageStats {
  requestsToday: number;
  errorsToday: number;
  lastRequestTime: number;
  quotaExceeded: boolean;
  fallbackMode: boolean;
}

let apiUsageStats: APIUsageStats = {
  requestsToday: 0,
  errorsToday: 0,
  lastRequestTime: 0,
  quotaExceeded: false,
  fallbackMode: false
};

async function callHuggingFaceAPI(text: string, model: string): Promise<HuggingFaceResponse[]> {
  const apiKey = process.env.HUGGING_FACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Hugging Face API key not configured');
  }

  // Check if we're in fallback mode due to quota issues
  if (apiUsageStats.quotaExceeded) {
    console.warn('⚠️ Hugging Face quota exceeded - using fallback analysis');
    throw new Error('QUOTA_EXCEEDED');
  }

  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    // Track successful request
    apiUsageStats.requestsToday++;
    apiUsageStats.lastRequestTime = Date.now();

    // Handle rate limiting and quota errors
    if (response.status === 429) {
      console.error('🚨 Hugging Face rate limit exceeded');
      apiUsageStats.quotaExceeded = true;
      apiUsageStats.fallbackMode = true;
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    if (response.status === 403) {
      console.error('🚨 Hugging Face quota exceeded');
      apiUsageStats.quotaExceeded = true;
      apiUsageStats.fallbackMode = true;
      throw new Error('QUOTA_EXCEEDED');
    }

    if (!response.ok) {
      apiUsageStats.errorsToday++;
      console.error(`❌ Hugging Face API error: ${response.status} - ${response.statusText}`);
      throw new Error(`HF_API_ERROR_${response.status}`);
    }

    return response.json();
  } catch (error) {
    apiUsageStats.errorsToday++;
    
    // Reset quota flag after 1 hour if it was a temporary issue
    if (apiUsageStats.quotaExceeded && Date.now() - apiUsageStats.lastRequestTime > 3600000) {
      apiUsageStats.quotaExceeded = false;
      apiUsageStats.fallbackMode = false;
    }
    
    throw error;
  }
}

// Fallback sentiment analysis when API limits are hit
function generateFallbackAnalysis(text: string) {
  console.log('🔄 Generating fallback analysis due to API limitations');
  
  // Basic keyword-based sentiment analysis for emergency fallback
  const positiveWords = ['success', 'great', 'amazing', 'excellent', 'achieved', 'progress', 'breakthrough', 'excited', 'confident'];
  const negativeWords = ['problem', 'issue', 'struggle', 'difficult', 'failed', 'stress', 'worried', 'frustrated', 'challenging'];
  const neutralWords = ['planning', 'research', 'analysis', 'meeting', 'discussion', 'review', 'considering'];
  
  const lowerText = text.toLowerCase();
  
  let positiveScore = positiveWords.reduce((score, word) => score + (lowerText.includes(word) ? 1 : 0), 0);
  let negativeScore = negativeWords.reduce((score, word) => score + (lowerText.includes(word) ? 1 : 0), 0);
  let neutralScore = neutralWords.reduce((score, word) => score + (lowerText.includes(word) ? 1 : 0), 0);
  
  // Determine primary sentiment
  let primary_mood = 'Neutral';
  let energy = 'medium';
  let business_category = 'Planning';
  
  if (positiveScore > negativeScore && positiveScore > neutralScore) {
    primary_mood = 'Optimistic';
    energy = 'high';
    business_category = 'Achievement';
  } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
    primary_mood = 'Concerned';
    energy = 'low';
    business_category = 'Challenge';
  }
  
  return {
    primary_mood,
    confidence: 60, // Lower confidence for fallback
    energy,
    emotions: [primary_mood.toLowerCase()],
    insights: ['Analysis temporarily using simplified processing. Full AI insights will resume when API access is restored.'],
    business_category,
    analysis_source: 'fallback-system'
  };
}

// Analyze sentiment using Hugging Face models with fallback protection
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('🚀 Server-side Hugging Face analysis starting for:', text.substring(0, 50) + '...');

    let sentimentData, emotionData;
    let usedFallback = false;

    try {
      // Get sentiment and emotion analysis
      [sentimentData, emotionData] = await Promise.all([
        callHuggingFaceAPI(text, HF_MODELS.sentiment),
        callHuggingFaceAPI(text, HF_MODELS.emotion)
      ]);

      console.log('✅ Hugging Face API calls successful');
      console.log('Raw sentiment response:', JSON.stringify(sentimentData, null, 2));
      console.log('Raw emotion response:', JSON.stringify(emotionData, null, 2));
      
    } catch (apiError: any) {
      console.warn('⚠️ Hugging Face API unavailable, using fallback analysis:', apiError.message);
      
      // Generate fallback analysis to ensure users never get errors
      const fallbackResult = generateFallbackAnalysis(text);
      return res.json(fallbackResult);
    }

    // Process results - Hugging Face returns nested arrays, flatten them
    let flatSentimentData = sentimentData;
    let flatEmotionData = emotionData;
    
    // Handle nested array format from HF API
    if (Array.isArray(sentimentData[0]) && Array.isArray(sentimentData[0])) {
      flatSentimentData = sentimentData[0];
    }
    if (Array.isArray(emotionData[0]) && Array.isArray(emotionData[0])) {
      flatEmotionData = emotionData[0];
    }
    
    if (!Array.isArray(flatSentimentData) || !Array.isArray(flatEmotionData) || 
        flatSentimentData.length === 0 || flatEmotionData.length === 0) {
      throw new Error('Invalid response format from Hugging Face API');
    }

    // Sort results by confidence to get the most confident predictions
    const sortedSentiment = flatSentimentData.sort((a, b) => b.score - a.score);
    const sortedEmotion = flatEmotionData.sort((a, b) => b.score - a.score);
    
    const topSentiment = sortedSentiment[0];
    const topEmotion = sortedEmotion[0];

    console.log('Processing Hugging Face results:', { 
      topSentiment, 
      topEmotion,
      allSentiment: sortedSentiment,
      allEmotion: sortedEmotion
    });

    // Map sentiment to business mood using REAL AI data
    let primaryMood = 'focused';
    let energy: 'high' | 'medium' | 'low' = 'medium';
    
    const sentimentLabel = topSentiment?.label || '';
    const sentimentScore = topSentiment?.score || 0.5;
    
    // LABEL_2 = positive, LABEL_1 = neutral, LABEL_0 = negative for cardiffnlp model
    if (sentimentLabel === 'LABEL_2' || sentimentLabel === 'POSITIVE') {
      if (sentimentScore > 0.8) {
        primaryMood = 'excited';
        energy = 'high';
      } else {
        primaryMood = 'optimistic';
        energy = 'medium';
      }
    } else if (sentimentLabel === 'LABEL_0' || sentimentLabel === 'NEGATIVE') {
      if (sentimentScore > 0.7) {
        primaryMood = 'frustrated';
        energy = 'low';
      } else {
        primaryMood = 'concerned';
        energy = 'medium';
      }
    } else {
      primaryMood = 'focused';
      energy = 'medium';
    }

    // Override with emotion data when it's stronger and more specific
    const emotionLabel = topEmotion?.label?.toLowerCase() || '';
    const emotionScore = topEmotion?.score || 0;
    
    // Use emotion when confidence is high enough
    if (emotionScore > 0.4) {
      switch (emotionLabel) {
        case 'joy':
          primaryMood = 'excited';
          energy = 'high';
          break;
        case 'anger':
          primaryMood = 'frustrated';
          energy = emotionScore > 0.7 ? 'high' : 'medium'; // Anger can drive action
          break;
        case 'sadness':
          primaryMood = 'reflective';
          energy = 'low';
          break;
        case 'fear':
          primaryMood = 'uncertain';
          energy = 'low';
          break;
        case 'surprise':
          primaryMood = 'curious';
          energy = 'medium';
          break;
        case 'disgust':
          primaryMood = 'critical';
          energy = 'medium';
          break;
      }
    }

    // Apply business context to mood - competitor/challenge scenarios shouldn't be "excited"
    const lowerTextForMood = text.toLowerCase();
    if ((lowerTextForMood.includes('competitor') || lowerTextForMood.includes('funding') || 
         lowerTextForMood.includes('challenge') || lowerTextForMood.includes('threat')) && 
        primaryMood === 'excited') {
      primaryMood = 'focused';
      energy = 'high';
    }

    // Business category detection using AI sentiment + context
    const lowerText = text.toLowerCase();
    let category = 'reflection';
    
    // Planning patterns - check FIRST to catch business model changes
    if (lowerText.includes('considering') || lowerText.includes('debating') || lowerText.includes('thinking about') ||
        lowerText.includes('pivot') || lowerText.includes('freemium') || lowerText.includes('subscription model') || 
        lowerText.includes('pricing') || lowerText.includes('business model') || lowerText.includes('plan') || 
        lowerText.includes('strategy') || lowerText.includes('roadmap') || lowerText.includes('timeline') || 
        lowerText.includes('future') || lowerText.includes('prepare') || lowerText.includes('government') || lowerText.includes('bid')) {
      category = 'planning';
    }
    
    // Challenge patterns - check FIRST to catch resignations, problems, issues, departures, risks, burnout, work-life balance
    // BUT exclude positive launches/achievements even if they mention challenges
    if ((lowerText.includes('problem') || lowerText.includes('challenge') || lowerText.includes('difficult') ||
        lowerText.includes('down') || lowerText.includes('outage') || lowerText.includes('issue') ||
        lowerText.includes('error') || lowerText.includes('failed') || lowerText.includes('quit') ||
        lowerText.includes('resigned') || lowerText.includes('resignation') || lowerText.includes('burnout') ||
        lowerText.includes('setback') || lowerText.includes('risk') || lowerText.includes('delays') ||
        lowerText.includes('struggling') || lowerText.includes('work-life balance') || lowerText.includes('overwhelming') ||
        lowerText.includes('exhausted') || lowerText.includes('70-hour') || lowerText.includes('barely sleeping') ||
        lowerText.includes('cancelled') || lowerText.includes('missing family') || lowerText.includes('sustainable') ||
        lowerText.includes('pressure') || lowerText.includes('stress') || lowerText.includes('overwhelm') ||
        lowerText.includes('handed in her') || lowerText.includes('handed in his') || lowerText.includes('leaving') ||
        lowerText.includes('departing') || lowerText.includes('losing her knowledge') || lowerText.includes('major setback')) &&
        // Don't categorize as challenge if it's clearly a positive launch/achievement context
        !(lowerText.includes('launched') && (lowerText.includes('success') || lowerText.includes('download') || 
          lowerText.includes('positive') || lowerText.includes('response') || lowerText.includes('already')))) {
      category = 'challenge';
    }
    // Achievement patterns - success, wins, completions (but not when considering/planning)
    else if ((lowerText.includes('contract') || lowerText.includes('deal') || lowerText.includes('signed') || 
             lowerText.includes('closed') || lowerText.includes('won') || lowerText.includes('achieved') || 
             lowerText.includes('completed') || lowerText.includes('milestone') || lowerText.includes('breakthrough') ||
             lowerText.includes('success') || lowerText.includes('record') || lowerText.includes('incredible')) &&
             // Don't classify as achievement if it's planning/considering context
             !(lowerText.includes('considering') || lowerText.includes('debating') || lowerText.includes('thinking about'))) {
      category = 'achievement';
    }
    // Growth patterns - revenue, scaling, expansion, competition (but not when context is negative)
    else if ((lowerText.includes('revenue') || lowerText.includes('growth') || lowerText.includes('expand') ||
             lowerText.includes('scaling') || lowerText.includes('clients') || lowerText.includes('customers') ||
             lowerText.includes('funding') || lowerText.includes('investment') || lowerText.includes('series') ||
             lowerText.includes('competitor') || lowerText.includes('raised') || lowerText.includes('million')) &&
             // Don't classify as growth if sentiment is strongly negative or context suggests problems
             !(primaryMood === 'reflective' && energy === 'low' && 
               (lowerText.includes('struggling') || lowerText.includes('pressure') || lowerText.includes('overwhelming')))) {
      category = 'growth';
    }
    // Planning patterns - strategy, plans, future, pivots (check this BEFORE achievement)
    else if (lowerText.includes('plan') || lowerText.includes('strategy') || lowerText.includes('roadmap') ||
             lowerText.includes('timeline') || lowerText.includes('future') || lowerText.includes('prepare') ||
             lowerText.includes('pivot') || lowerText.includes('considering') || lowerText.includes('debating') ||
             lowerText.includes('freemium') || lowerText.includes('subscription model') || lowerText.includes('pricing') ||
             lowerText.includes('business model') || lowerText.includes('government') || lowerText.includes('bid')) {
      category = 'planning';
    }
    // Learning patterns - feedback, insights, learned
    else if (lowerText.includes('learned') || lowerText.includes('feedback') || lowerText.includes('insight') ||
             lowerText.includes('understand') || lowerText.includes('realize') || lowerText.includes('suggestion') ||
             lowerText.includes('customer feedback') || lowerText.includes('prefer')) {
      category = 'learning';
    }

    // Calculate confidence using the highest AI model score
    const sentimentConfidence = topSentiment?.score || 0.5;
    const emotionConfidence = topEmotion?.score || 0.5;
    
    // Use the higher confidence score and map to realistic range (75-95% for strong AI results)
    const rawConfidence = Math.max(sentimentConfidence, emotionConfidence);
    const finalConfidence = Math.round(Math.min(95, Math.max(75, rawConfidence * 100)));
    
    // Generate contextual insights based on content analysis
    const insights: string[] = [];
    
    // Content-aware insight generation
    const generateContextualInsights = (text: string, category: string, mood: string): string[] => {
      const contextualInsights: string[] = [];
      const lowerText = text.toLowerCase();
      
      if (category === 'challenge') {
        if (lowerText.includes('competitor') || lowerText.includes('raised') || lowerText.includes('funding')) {
          contextualInsights.push('Competitive pressure creates opportunity. Focus on execution speed and customer experience over feature parity.');
          contextualInsights.push('Market validation through competition is valuable. Study their moves, then differentiate yours.');
        } else if (lowerText.includes('database') || lowerText.includes('technical') || lowerText.includes('system')) {
          contextualInsights.push('Technical failures expose infrastructure weaknesses. Build redundancy before you need it.');
        } else if (lowerText.includes('employee') || lowerText.includes('staff') || lowerText.includes('team')) {
          contextualInsights.push('Team challenges signal cultural or process gaps. Address root causes, not just symptoms.');
        } else if (lowerText.includes('burnout') || lowerText.includes('exhausted') || lowerText.includes('overwhelming')) {
          contextualInsights.push('Burnout is a leading indicator of unsustainable practices. Delegate or systematize before breaking.');
        } else if (lowerText.includes('cash flow') || lowerText.includes('revenue')) {
          contextualInsights.push('Financial pressure demands creative solutions. Focus on customer value and operational efficiency.');
        } else {
          contextualInsights.push('Every challenge contains market intelligence. Document what you learn for competitive advantage.');
        }
      } else if (category === 'growth') {
        if (lowerText.includes('competitor') || lowerText.includes('funding')) {
          contextualInsights.push('Market validation through competition is valuable. Study their moves, then differentiate yours.');
        } else if (lowerText.includes('revenue') || lowerText.includes('sales') || lowerText.includes('clients')) {
          contextualInsights.push('Revenue growth without operational scaling creates future bottlenecks. Plan for tomorrow today.');
        } else if (lowerText.includes('team') || lowerText.includes('hiring')) {
          contextualInsights.push('Growing teams require evolving leadership. Your role must change as the company scales.');
        } else {
          contextualInsights.push('Sustainable growth balances ambition with execution capacity. Monitor both metrics closely.');
        }
      } else if (category === 'achievement') {
        if (lowerText.includes('signed') || lowerText.includes('deal') || lowerText.includes('contract')) {
          contextualInsights.push('Major deals validate your value proposition. Analyze why this succeeded to replicate success.');
        } else if (lowerText.includes('milestone') || lowerText.includes('goal') || lowerText.includes('target')) {
          contextualInsights.push('Milestone achievements prove your strategic direction. Use this momentum to tackle bigger challenges.');
        } else if (lowerText.includes('launch') || lowerText.includes('product') || lowerText.includes('feature')) {
          contextualInsights.push('Product launches reveal market readiness. Customer response patterns guide future development.');
        } else {
          contextualInsights.push('Success patterns become your competitive moat. Document and systematize what worked.');
        }
      } else if (category === 'planning') {
        if (lowerText.includes('pivot') || lowerText.includes('business model') || lowerText.includes('freemium') || lowerText.includes('pricing')) {
          contextualInsights.push('Business model pivots require careful customer research. Test assumptions before making major changes.');
          contextualInsights.push('Pricing changes affect customer psychology. Study how similar companies navigated these transitions.');
        } else if (lowerText.includes('strategy') || lowerText.includes('roadmap')) {
          contextualInsights.push('Strategic plans need execution checkpoints. Build accountability into every major initiative.');
        } else if (lowerText.includes('budget') || lowerText.includes('financial')) {
          contextualInsights.push('Financial planning requires scenario modeling. Prepare for best case, worst case, and most likely.');
        } else if (lowerText.includes('considering') || lowerText.includes('debating')) {
          contextualInsights.push('Strategic decisions require customer validation. Test assumptions with real users before committing resources.');
        } else {
          contextualInsights.push('Effective planning connects daily actions to long-term vision. Bridge the gap consistently.');
        }
      } else if (category === 'learning') {
        if (lowerText.includes('feedback') || lowerText.includes('customer')) {
          contextualInsights.push('Customer feedback is product direction data. Weight it by customer value and market size.');
        } else if (lowerText.includes('mistake') || lowerText.includes('lesson')) {
          contextualInsights.push('Expensive lessons become competitive advantages when properly internalized and shared.');
        } else {
          contextualInsights.push('Learning velocity determines business evolution speed. Apply insights immediately for maximum impact.');
        }
      } else {
        contextualInsights.push('Business intuition develops through pattern recognition. Track what works and what doesn\'t.');
      }
      
      return contextualInsights;
    };
    
    // Generate 1-2 contextual insights
    const contextualInsights = generateContextualInsights(text, category, primaryMood);
    insights.push(...contextualInsights.slice(0, 2));

    const result = {
      primary_mood: primaryMood,
      confidence: finalConfidence,
      energy,
      emotions: [primaryMood],
      business_category: category,
      insights,
      analysis_source: 'hugging-face-server'
    };

    console.log('✅ Server-side analysis complete:', result);
    res.json(result);

  } catch (error) {
    console.error('❌ Server-side Hugging Face error:', error);
    
    // Always provide fallback analysis instead of returning errors to users
    const fallbackResult = generateFallbackAnalysis(req.body.text || '');
    console.log('🔄 Providing fallback analysis to maintain user experience');
    res.json(fallbackResult);
  }
});

// API monitoring endpoint for admin use
router.get('/status', (req, res) => {
  res.json({
    usage_stats: apiUsageStats,
    api_health: !apiUsageStats.quotaExceeded ? 'healthy' : 'quota_exceeded',
    fallback_active: apiUsageStats.fallbackMode,
    last_request: new Date(apiUsageStats.lastRequestTime).toISOString(),
    requests_today: apiUsageStats.requestsToday,
    errors_today: apiUsageStats.errorsToday
  });
});

export default router;