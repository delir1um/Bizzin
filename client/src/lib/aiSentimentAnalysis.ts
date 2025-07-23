// Robust AI-powered sentiment analysis using Hugging Face (free) with smart fallbacks
export interface BusinessMood {
  primary: string;
  confidence: number;
  energy: 'high' | 'medium' | 'low';
  emotions: string[];
}

export interface BusinessSentiment {
  mood: BusinessMood;
  insights: string[];
  category: 'growth' | 'challenge' | 'achievement' | 'planning' | 'reflection';
}

// Hugging Face model endpoints (free inference API)
const HF_MODELS = {
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
  emotion: 'j-hartmann/emotion-english-distilroberta-base',
  business: 'nlptown/bert-base-multilingual-uncased-sentiment'
};

// Cache for reducing API calls
const sentimentCache = new Map<string, any>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Enhanced business keywords for local analysis
const businessEmotions = {
  confident: {
    keywords: ['confident', 'sure', 'certain', 'ready', 'prepared', 'strong', 'capable', 'determined', 'convinced', 'assured'],
    weight: 0.9,
    energy: 'high' as const
  },
  excited: {
    keywords: ['excited', 'thrilled', 'energized', 'motivated', 'enthusiastic', 'passionate', 'pumped', 'inspired', 'eager'],
    weight: 0.9,
    energy: 'high' as const
  },
  focused: {
    keywords: ['focused', 'clear', 'organized', 'systematic', 'structured', 'planned', 'strategic', 'methodical', 'disciplined'],
    weight: 0.8,
    energy: 'medium' as const
  },
  optimistic: {
    keywords: ['optimistic', 'hopeful', 'positive', 'bright', 'promising', 'potential', 'opportunity', 'growth', 'bullish'],
    weight: 0.8,
    energy: 'high' as const
  },
  stressed: {
    keywords: ['stressed', 'overwhelmed', 'pressure', 'deadline', 'rushed', 'tight', 'demanding', 'intense', 'burnout'],
    weight: 0.7,
    energy: 'low' as const
  },
  uncertain: {
    keywords: ['uncertain', 'unsure', 'confused', 'unclear', 'doubt', 'questioning', 'hesitant', 'wondering', 'ambiguous'],
    weight: 0.6,
    energy: 'low' as const
  },
  frustrated: {
    keywords: ['frustrated', 'stuck', 'blocked', 'difficult', 'challenging', 'obstacle', 'setback', 'problem', 'annoyed'],
    weight: 0.6,
    energy: 'medium' as const
  },
  accomplished: {
    keywords: ['accomplished', 'achieved', 'completed', 'finished', 'success', 'breakthrough', 'milestone', 'progress', 'victory'],
    weight: 0.9,
    energy: 'high' as const
  },
  reflective: {
    keywords: ['thinking', 'considering', 'reflecting', 'analyzing', 'reviewing', 'learning', 'understanding', 'realizing', 'contemplating'],
    weight: 0.5,
    energy: 'medium' as const
  },
  determined: {
    keywords: ['determined', 'committed', 'dedicated', 'persistent', 'resilient', 'persevere', 'push', 'drive', 'tenacious'],
    weight: 0.8,
    energy: 'high' as const
  }
};

const businessContexts = {
  growth: ['scaling', 'expansion', 'growing', 'increase', 'revenue', 'customers', 'market', 'opportunity', 'profit', 'sales'],
  challenge: ['problem', 'issue', 'difficulty', 'obstacle', 'setback', 'failure', 'mistake', 'error', 'crisis', 'struggle'],
  achievement: ['success', 'win', 'accomplished', 'milestone', 'breakthrough', 'completed', 'achieved', 'goal', 'victory', 'triumph'],
  planning: ['strategy', 'plan', 'roadmap', 'timeline', 'schedule', 'prepare', 'organize', 'structure', 'blueprint', 'framework'],
  reflection: ['learned', 'realize', 'understand', 'insight', 'feedback', 'review', 'analyze', 'think', 'contemplate', 'evaluate']
};

// Hugging Face API call with error handling
async function callHuggingFace(text: string, model: string): Promise<any> {
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Hugging Face API error:', error);
    return null;
  }
}

// Enhanced local sentiment analysis as fallback
function analyzeLocalSentiment(content: string, title?: string): BusinessSentiment {
  const text = `${title || ''} ${content}`.toLowerCase();
  
  // Analyze emotions
  const emotionScores: Record<string, number> = {};
  let totalEnergyScore = 0;
  let energyCount = 0;
  
  Object.entries(businessEmotions).forEach(([emotion, config]) => {
    let score = 0;
    config.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (text.match(regex) || []).length;
      score += matches * config.weight;
    });
    
    if (score > 0) {
      emotionScores[emotion] = score;
      const energyValue = config.energy === 'high' ? 3 : config.energy === 'medium' ? 2 : 1;
      totalEnergyScore += energyValue * score;
      energyCount += score;
    }
  });
  
  // Determine primary emotion
  const sortedEmotions = Object.entries(emotionScores).sort(([,a], [,b]) => b - a);
  const primaryEmotion = sortedEmotions[0]?.[0] || 'reflective';
  const rawConfidence = sortedEmotions[0]?.[1] || 0;
  
  // Normalize confidence (enhanced algorithm)
  const maxExpectedScore = 3;
  const confidence = Math.min(rawConfidence / maxExpectedScore, 1.0);
  const finalConfidence = rawConfidence > 0 ? Math.max(confidence, 0.4) : 0.5; // Higher baseline
  
  // Calculate energy
  const avgEnergy = energyCount > 0 ? totalEnergyScore / energyCount : 2;
  const energy = avgEnergy >= 2.5 ? 'high' : avgEnergy >= 1.5 ? 'medium' : 'low';
  
  // Get top emotions
  const topEmotions = sortedEmotions.slice(0, 3).map(([emotion]) => emotion);
  
  // Determine business category
  let category: BusinessSentiment['category'] = 'reflection';
  let maxContextScore = 0;
  
  Object.entries(businessContexts).forEach(([contextType, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      score += (text.match(regex) || []).length;
    });
    
    if (score > maxContextScore) {
      maxContextScore = score;
      category = contextType as BusinessSentiment['category'];
    }
  });
  
  // Generate insights
  const insights = generateBusinessInsights(primaryEmotion, category, topEmotions, text);
  
  return {
    mood: {
      primary: primaryEmotion,
      confidence: finalConfidence,
      energy,
      emotions: topEmotions
    },
    insights,
    category
  };
}

// AI-powered sentiment analysis with smart fallbacks
export async function analyzeBusinessSentimentAI(content: string, title?: string): Promise<BusinessSentiment> {
  const text = `${title || ''} ${content}`;
  const cacheKey = `${text.substring(0, 100)}`;
  
  // Check cache first
  const cached = sentimentCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    // Try Hugging Face API first (free tier)
    const [sentimentResult, emotionResult] = await Promise.all([
      callHuggingFace(text, HF_MODELS.sentiment),
      callHuggingFace(text.substring(0, 500), HF_MODELS.emotion) // Limit for emotion API
    ]);
    
    if (sentimentResult && emotionResult) {
      const aiResult = processHuggingFaceResults(sentimentResult, emotionResult, content, title);
      
      // Cache successful result
      sentimentCache.set(cacheKey, {
        data: aiResult,
        timestamp: Date.now()
      });
      
      return aiResult;
    }
  } catch (error) {
    console.warn('AI sentiment analysis failed, using local analysis:', error);
  }
  
  // Fallback to enhanced local analysis
  const localResult = analyzeLocalSentiment(content, title);
  
  // Cache local result too
  sentimentCache.set(cacheKey, {
    data: localResult,
    timestamp: Date.now()
  });
  
  return localResult;
}

// Process Hugging Face API results
function processHuggingFaceResults(sentimentData: any, emotionData: any, content: string, title?: string): BusinessSentiment {
  const text = `${title || ''} ${content}`.toLowerCase();
  
  // Map HF sentiment to business emotions
  const sentimentMapping: Record<string, string> = {
    'NEGATIVE': 'frustrated',
    'POSITIVE': 'optimistic',
    'NEUTRAL': 'reflective'
  };
  
  // Map HF emotions to business emotions
  const emotionMapping: Record<string, string> = {
    'joy': 'excited',
    'optimism': 'optimistic',
    'anger': 'frustrated',
    'sadness': 'reflective',
    'fear': 'uncertain',
    'surprise': 'excited',
    'love': 'confident',
    'disgust': 'frustrated'
  };
  
  // Extract primary sentiment
  let primaryEmotion = 'reflective';
  let confidence = 0.5;
  
  if (Array.isArray(sentimentData) && sentimentData.length > 0) {
    const topSentiment = sentimentData[0];
    primaryEmotion = sentimentMapping[topSentiment.label] || 'reflective';
    confidence = Math.max(topSentiment.score || 0.5, 0.3);
  }
  
  // Extract emotions
  let emotions = ['reflective'];
  if (Array.isArray(emotionData) && emotionData.length > 0) {
    emotions = emotionData
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .slice(0, 3)
      .map((emotion: any) => emotionMapping[emotion.label] || emotion.label)
      .filter(Boolean);
    
    // Use top emotion as primary if confidence is high
    if (emotions.length > 0 && emotionData[0].score > 0.6) {
      primaryEmotion = emotions[0];
    }
  }
  
  // Determine energy level
  const highEnergyEmotions = ['excited', 'confident', 'optimistic', 'determined'];
  const lowEnergyEmotions = ['frustrated', 'uncertain', 'reflective'];
  
  let energy: 'high' | 'medium' | 'low' = 'medium';
  if (highEnergyEmotions.includes(primaryEmotion)) energy = 'high';
  else if (lowEnergyEmotions.includes(primaryEmotion)) energy = 'low';
  
  // Determine business category (using local analysis)
  let category: BusinessSentiment['category'] = 'reflection';
  let maxContextScore = 0;
  
  Object.entries(businessContexts).forEach(([contextType, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      score += (text.match(regex) || []).length;
    });
    
    if (score > maxContextScore) {
      maxContextScore = score;
      category = contextType as BusinessSentiment['category'];
    }
  });
  
  // Generate AI-enhanced insights
  const insights = generateBusinessInsights(primaryEmotion, category, emotions, text);
  
  return {
    mood: {
      primary: primaryEmotion,
      confidence: Math.min(confidence, 1.0),
      energy,
      emotions: emotions.slice(0, 3)
    },
    insights,
    category
  };
}

// Enhanced insight generation
function generateBusinessInsights(primaryEmotion: string, category: string, emotions: string[], text?: string): string[] {
  const insights: string[] = [];
  const hasMetrics = text && /\d+%|\$\d+|revenue|profit|growth|customer/i.test(text);
  const hasTeam = text && /team|employee|hire|staff|people/i.test(text);
  const hasStrategy = text && /strategy|plan|goal|vision|mission/i.test(text);
  
  // Emotion-based insights
  switch (primaryEmotion) {
    case 'confident':
      insights.push(hasStrategy ? 
        "Your strategic confidence indicates strong leadership - this mindset drives breakthrough decisions" :
        "Your confidence is showing - this mindset often leads to breakthrough moments");
      break;
    case 'excited':
      insights.push(hasTeam ? 
        "High energy and enthusiasm can be contagious - perfect time to rally your team around new initiatives" :
        "High energy and enthusiasm can be contagious - great time to take bold action");
      break;
    case 'focused':
      insights.push(hasMetrics ? 
        "This data-driven focus suggests you're building sustainable business systems" :
        "This systematic approach suggests you're building sustainable business habits");
      break;
    case 'frustrated':
      insights.push("Obstacles often reveal opportunities - consider what this challenge is teaching you about your market");
      break;
    case 'uncertain':
      insights.push("Uncertainty is where innovation happens - trust the process and seek data to guide decisions");
      break;
    case 'accomplished':
      insights.push("Celebrating wins builds momentum - document what worked for future reference and team learning");
      break;
    case 'optimistic':
      insights.push("Optimism coupled with action creates results - channel this energy into your next key initiative");
      break;
    case 'determined':
      insights.push("This determination is your competitive advantage - persistence separates successful entrepreneurs");
      break;
  }
  
  // Category-based insights
  switch (category) {
    case 'growth':
      insights.push("Growth phases require both vision and systems - balance scaling with operational excellence");
      break;
    case 'challenge':
      insights.push("Every challenge contains valuable market intelligence - document lessons for future decision-making");
      break;
    case 'achievement':
      insights.push("Success patterns are your roadmap - analyze what worked to replicate these results");
      break;
    case 'planning':
      insights.push("Strategic planning today prevents costly pivots tomorrow - invest time in thorough preparation");
      break;
    case 'reflection':
      insights.push("Self-awareness is a founder's superpower - these insights compound into better business decisions");
      break;
  }
  
  return insights.slice(0, 2); // Return top 2 insights
}

// Main export - formatted for UI compatibility
export async function analyzeBusinessSentiment(content: string, title?: string): Promise<any> {
  const result = await analyzeBusinessSentimentAI(content, title);
  
  // Format exactly as expected by UI components
  return {
    primary_mood: result.mood.primary,
    confidence: result.mood.confidence, // Keep as decimal for UI components
    energy: result.mood.energy,
    category: result.category,
    business_category: result.category, // For compatibility
    insights: result.insights, // Array format expected by SentimentInsights
    business_insights: result.insights.length > 0 ? result.insights[0] : "Analyzing business patterns and growth opportunities",
    business_context: `${result.mood.primary} energy with ${result.category} focus`,
    emotions: result.mood.emotions
  };
}