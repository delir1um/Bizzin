// Robust AI-powered sentiment analysis using Hugging Face (free) with smart fallbacks
export interface BusinessMood {
  primary: string;
  confidence: number;
  energy: 'high' | 'medium' | 'low';
  emotions: string[];
}

export interface BusinessSentiment {
  primary_mood: string;
  confidence: number;
  energy: 'low' | 'medium' | 'high';
  emotions: string[];
  insights: string[];
  business_category: 'growth' | 'challenge' | 'achievement' | 'planning' | 'reflection';
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
    keywords: ['excited', 'thrilled', 'energized', 'motivated', 'enthusiastic', 'passionate', 'pumped', 'inspired', 'eager', 'full of', 'new', 'ready', 'cant wait', 'looking forward', 'anticipating', 'next big', 'big project'],
    weight: 0.9,
    energy: 'high' as const
  },
  focused: {
    keywords: ['focused', 'clear', 'organized', 'systematic', 'structured', 'planned', 'strategic', 'methodical', 'disciplined'],
    weight: 0.8,
    energy: 'medium' as const
  },
  optimistic: {
    keywords: ['optimistic', 'hopeful', 'positive', 'bright', 'promising', 'potential', 'opportunity', 'growth', 'bullish', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'opportunities'],
    weight: 0.9,
    energy: 'high' as const
  },
  stressed: {
    keywords: ['stressed', 'overwhelmed', 'pressure', 'deadline', 'rushed', 'tight', 'demanding', 'intense', 'burnout', 'anxious', 'worried', 'tense', 'strain', 'burden'],
    weight: 0.8,
    energy: 'low' as const
  },
  uncertain: {
    keywords: ['uncertain', 'unsure', 'confused', 'unclear', 'doubt', 'questioning', 'hesitant', 'wondering', 'ambiguous'],
    weight: 0.6,
    energy: 'low' as const
  },
  frustrated: {
    keywords: ['frustrated', 'stuck', 'blocked', 'difficult', 'challenging', 'obstacle', 'setback', 'problem', 'annoyed'],
    weight: 0.8,
    energy: 'low' as const
  },
  sad: {
    keywords: ['sad', 'depressed', 'down', 'blue', 'unhappy', 'melancholy', 'gloomy', 'dejected', 'despondent'],
    weight: 0.9,
    energy: 'low' as const
  },
  tired: {
    keywords: ['tired', 'exhausted', 'drained', 'unmotivated', 'reluctant', 'sluggish', 'weary', 'dont feel like', 'no energy', 'dont have the energy'],
    weight: 0.8,
    energy: 'low' as const
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
  growth: ['scaling', 'expansion', 'growing', 'increase', 'revenue', 'customers', 'market', 'opportunity', 'profit', 'sales', 'opportunities', 'new', 'potential', 'promising', 'next big', 'big project', 'cant wait', 'looking forward', 'anticipating', 'future'],
  challenge: ['problem', 'issue', 'difficulty', 'obstacle', 'setback', 'failure', 'mistake', 'error', 'crisis', 'struggle', 'tired', 'exhausted', 'dont feel like', 'unmotivated', 'burnout', 'stressed', 'sad', 'depressed', 'down'],
  achievement: ['success', 'win', 'accomplished', 'milestone', 'breakthrough', 'completed', 'achieved', 'goal', 'victory', 'triumph', 'good day', 'great', 'excellent'],
  planning: ['strategy', 'plan', 'roadmap', 'timeline', 'schedule', 'prepare', 'organize', 'structure', 'blueprint', 'framework', 'next', 'project', 'upcoming', 'future'],
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
  const finalConfidence = rawConfidence > 0 ? Math.max(confidence, 0.6) : 0.7; // Higher baseline for better UX
  
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
  const insights = generateAdvancedBusinessInsights(primaryEmotion, category, text, finalConfidence);
  
  return {
    primary_mood: primaryEmotion,
    confidence: Math.round(finalConfidence * 100),
    energy,
    emotions: topEmotions,
    insights,
    business_category: category
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
  const insights = generateAdvancedBusinessInsights(primaryEmotion, category, text, confidence);
  
  return {
    primary_mood: primaryEmotion,
    confidence: Math.round(Math.min(confidence, 1.0) * 100),
    energy,
    emotions: emotions.slice(0, 3),
    insights,
    business_category: category
  };
}

// Advanced business insights with emotional intelligence
function generateAdvancedBusinessInsights(emotion: string, category: string, text: string, confidenceRatio: number): string[] {
  const insights: string[] = [];
  
  // Advanced context detection
  const hasTeam = /team|colleagues|staff|employees|hire|hiring|manage|leadership/i.test(text);
  const hasRevenue = /revenue|sales|income|profit|customers|clients|money|pricing/i.test(text);
  const hasStrategy = /strategy|plan|growth|expansion|market|competition|roadmap/i.test(text);
  const hasMetrics = /data|analytics|metrics|numbers|performance|results|kpi/i.test(text);
  const hasOpportunity = /opportunity|opportunities|potential|promising|new|innovation/i.test(text);
  const hasChallenges = /problem|issue|difficulty|obstacle|setback|challenge|struggle/i.test(text);
  const hasProject = /project|projects|next big|upcoming|cant wait|looking forward/i.test(text);
  
  // High-confidence insights (above 0.7)
  const isHighConfidence = confidenceRatio > 0.7;
  
  // Emotion-based business intelligence
  switch (emotion) {
    case 'confident':
      if (hasStrategy && isHighConfidence) {
        insights.push("Your strategic confidence signals readiness for bold moves - successful entrepreneurs trust this instinct when making pivotal decisions");
      } else if (hasTeam) {
        insights.push("Confident leadership creates psychological safety - your team performs better when they sense your conviction");
      } else {
        insights.push("This confidence indicates strong business intuition - channel this clarity into your next key decision");
      }
      break;
      
    case 'excited':
      if (hasProject && isHighConfidence) {
        insights.push("Project excitement signals strong product-market fit intuition - your anticipation often identifies high-impact opportunities");
      } else if (hasOpportunity && isHighConfidence) {
        insights.push("Excitement about opportunities is entrepreneurial radar - your enthusiasm often identifies market gaps before competitors");
      } else if (hasRevenue) {
        insights.push("Revenue excitement drives sustainable growth - this energy fuels the persistence needed for scaling");
      } else {
        insights.push("High-energy states accelerate decision-making - capture your ideas while this momentum lasts");
      }
      break;
      
    case 'optimistic':
      if (hasOpportunity) {
        insights.push("Optimistic opportunity recognition is a founder's superpower - you see possibilities where others see problems");
      } else if (hasStrategy) {
        insights.push("Strategic optimism drives innovation - your positive outlook enables calculated risk-taking");
      } else {
        insights.push("Optimism creates momentum in business - this mindset attracts resources, talent, and partnerships");
      }
      break;
      
    case 'frustrated':
      if (hasChallenges && hasStrategy) {
        insights.push("Strategic frustration often precedes breakthrough innovations - what's blocking you might be your next competitive advantage");
      } else if (hasTeam) {
        insights.push("Team frustration signals process opportunities - consider what systems could eliminate recurring friction");
      } else {
        insights.push("Frustration is market feedback - this tension often reveals unmet needs worth solving");
      }
      break;
      
    case 'stressed':
      if (hasRevenue && hasMetrics) {
        insights.push("Revenue stress with data awareness shows sophisticated thinking - use metrics to prioritize what truly drives growth");
      } else if (hasTeam) {
        insights.push("Stress with team responsibilities suggests scaling challenges - consider delegation and process automation");
      } else {
        insights.push("Stress often signals growth phases - break complex challenges into manageable experiments");
      }
      break;
      
    case 'focused':
      if (hasMetrics && isHighConfidence) {
        insights.push("Data-driven focus is your competitive edge - this analytical clarity typically leads to sustainable competitive advantages");
      } else if (hasStrategy) {
        insights.push("Strategic focus cuts through noise - you're prioritizing high-impact activities over busy work");
      } else {
        insights.push("Deep focus creates disproportionate returns - this concentration builds your expertise moat");
      }
      break;
      
    case 'accomplished':
      if (hasRevenue) {
        insights.push("Revenue accomplishments build investor confidence - document these wins for future fundraising or partnerships");
      } else if (hasTeam) {
        insights.push("Team accomplishments create culture momentum - celebrate these wins to reinforce high-performance patterns");
      } else {
        insights.push("Achievement energy should be reinvested immediately - success creates the best conditions for taking bigger risks");
      }
      break;
      
    case 'uncertain':
      if (hasStrategy && hasMetrics) {
        insights.push("Strategic uncertainty with data awareness shows maturity - use experiments to validate assumptions systematically");
      } else if (hasRevenue) {
        insights.push("Revenue uncertainty drives customer-centricity - get closer to your customers' real problems and priorities");
      } else {
        insights.push("Uncertainty identifies knowledge gaps - convert these questions into testable hypotheses");
      }
      break;
      
    case 'determined':
      if (hasChallenges && isHighConfidence) {
        insights.push("Determined problem-solving is entrepreneurial DNA - this persistence through obstacles creates lasting competitive advantages");
      } else {
        insights.push("Determination separates entrepreneurs from dreamers - this mindset powers through the inevitable setbacks");
      }
      break;
      
    case 'reflective':
      if (hasMetrics) {
        insights.push("Reflective data analysis drives smart pivots - what patterns in your business are telling you to adjust course?");
      } else if (hasStrategy) {
        insights.push("Strategic reflection builds sustainable advantages - step back thinking often reveals bigger opportunities");
      } else {
        insights.push("Self-aware founders make better decisions - these insights compound into superior business judgment");
      }
      break;
      
    default:
      insights.push("Every emotional state contains business intelligence - document these patterns to improve your decision-making");
  }
  
  // Add category-specific insights for high confidence
  if (isHighConfidence && category) {
    switch (category) {
      case 'growth':
        insights.push("Growth mindset with high confidence suggests readiness for scaling - consider what systems need strengthening first");
        break;
      case 'challenge':
        insights.push("Challenge awareness at high confidence shows mature leadership - you're seeing problems before they become crises");
        break;
      case 'achievement':
        insights.push("Achievement recognition builds momentum - use this success to tackle bigger challenges while confidence is high");
        break;
    }
  }
  
  return insights.slice(0, 2); // Limit to 2 insights for better UX
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