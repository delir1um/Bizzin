// Business-focused sentiment analysis for journal entries
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

// Business emotion keywords and their weights
const businessEmotions = {
  confident: {
    keywords: ['confident', 'sure', 'certain', 'ready', 'prepared', 'strong', 'capable', 'determined', 'convinced'],
    weight: 0.8,
    energy: 'high' as const
  },
  excited: {
    keywords: ['excited', 'thrilled', 'energized', 'motivated', 'enthusiastic', 'passionate', 'pumped', 'inspired'],
    weight: 0.9,
    energy: 'high' as const
  },
  focused: {
    keywords: ['focused', 'clear', 'organized', 'systematic', 'structured', 'planned', 'strategic', 'methodical'],
    weight: 0.7,
    energy: 'medium' as const
  },
  optimistic: {
    keywords: ['optimistic', 'hopeful', 'positive', 'bright', 'promising', 'potential', 'opportunity', 'growth'],
    weight: 0.8,
    energy: 'high' as const
  },
  stressed: {
    keywords: ['stressed', 'overwhelmed', 'pressure', 'deadline', 'rushed', 'tight', 'demanding', 'intense'],
    weight: 0.7,
    energy: 'low' as const
  },
  uncertain: {
    keywords: ['uncertain', 'unsure', 'confused', 'unclear', 'doubt', 'questioning', 'hesitant', 'wondering'],
    weight: 0.6,
    energy: 'low' as const
  },
  frustrated: {
    keywords: ['frustrated', 'stuck', 'blocked', 'difficult', 'challenging', 'obstacle', 'setback', 'problem'],
    weight: 0.6,
    energy: 'medium' as const
  },
  accomplished: {
    keywords: ['accomplished', 'achieved', 'completed', 'finished', 'success', 'breakthrough', 'milestone', 'progress'],
    weight: 0.9,
    energy: 'high' as const
  },
  reflective: {
    keywords: ['thinking', 'considering', 'reflecting', 'analyzing', 'reviewing', 'learning', 'understanding', 'realizing'],
    weight: 0.5,
    energy: 'medium' as const
  },
  determined: {
    keywords: ['determined', 'committed', 'dedicated', 'persistent', 'resilient', 'persevere', 'push', 'drive'],
    weight: 0.8,
    energy: 'high' as const
  }
};

// Business context patterns
const businessContexts = {
  growth: ['scaling', 'expansion', 'growing', 'increase', 'revenue', 'customers', 'market', 'opportunity'],
  challenge: ['problem', 'issue', 'difficulty', 'obstacle', 'setback', 'failure', 'mistake', 'error'],
  achievement: ['success', 'win', 'accomplished', 'milestone', 'breakthrough', 'completed', 'achieved', 'goal'],
  planning: ['strategy', 'plan', 'roadmap', 'timeline', 'schedule', 'prepare', 'organize', 'structure'],
  reflection: ['learned', 'realize', 'understand', 'insight', 'feedback', 'review', 'analyze', 'think']
};

export function analyzeBusinessSentiment(content: string, title?: string): BusinessSentiment {
  const text = `${title || ''} ${content}`.toLowerCase();
  const words = text.split(/\s+/);
  
  // Analyze emotions
  const emotionScores: Record<string, number> = {};
  let totalEnergyScore = 0;
  let energyCount = 0;
  
  Object.entries(businessEmotions).forEach(([emotion, config]) => {
    let score = 0;
    config.keywords.forEach(keyword => {
      const matches = text.split(keyword).length - 1;
      score += matches * config.weight;
    });
    
    if (score > 0) {
      emotionScores[emotion] = score;
      // Calculate energy level
      const energyValue = config.energy === 'high' ? 3 : config.energy === 'medium' ? 2 : 1;
      totalEnergyScore += energyValue * score;
      energyCount += score;
    }
  });
  
  // Determine primary emotion
  const sortedEmotions = Object.entries(emotionScores)
    .sort(([,a], [,b]) => b - a);
  
  const primaryEmotion = sortedEmotions[0]?.[0] || 'neutral';
  const rawConfidence = sortedEmotions[0]?.[1] || 0;
  
  // Normalize confidence to 0-1 range (cap at reasonable levels)
  const maxExpectedScore = 5; // Reasonable cap for typical entries
  const confidence = Math.min(rawConfidence / maxExpectedScore, 1.0);
  
  // Ensure minimum confidence for detected emotions
  const finalConfidence = rawConfidence > 0 ? Math.max(confidence, 0.3) : 0;
  
  // Calculate overall energy
  const avgEnergy = energyCount > 0 ? totalEnergyScore / energyCount : 2;
  const energy = avgEnergy >= 2.5 ? 'high' : avgEnergy >= 1.5 ? 'medium' : 'low';
  
  // Get top emotions (limit to 3)
  const topEmotions = sortedEmotions.slice(0, 3).map(([emotion]) => emotion);
  
  // Determine business category
  let category: BusinessSentiment['category'] = 'reflection';
  let maxContextScore = 0;
  
  Object.entries(businessContexts).forEach(([contextType, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      score += (text.split(keyword).length - 1);
    });
    
    if (score > maxContextScore) {
      maxContextScore = score;
      category = contextType as BusinessSentiment['category'];
    }
  });
  
  // Generate insights based on emotions and context
  const insights = generateBusinessInsights(primaryEmotion, category, topEmotions, content);
  
  console.log('DEBUG analyzeBusinessSentiment result:', {
    primaryEmotion,
    category,
    insightsGenerated: insights.length,
    insights: insights
  });
  
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

function generateBusinessInsights(primaryEmotion: string, category: string, emotions: string[], contentText?: string): string[] {
  const insights: string[] = [];
  
  // Generate contextual insights based on business category and detected patterns in the content
  const lowerContent = (contentText || '').toLowerCase();
  
  console.log('DEBUG generateBusinessInsights:', {
    primaryEmotion,
    category,
    contentLength: contentText?.length || 0,
    lowerContentPreview: lowerContent.substring(0, 150),
    hasFunding: lowerContent.includes('funding'),
    hasInvestment: lowerContent.includes('investment'),
    hasInvestor: lowerContent.includes('investor')
  });
  

  
  // Category-specific contextual insights based on actual business scenarios
  const categoryLower = category.toLowerCase();
  
  // Direct keyword-based content detection (regardless of category)
  if (lowerContent.includes('funding') || lowerContent.includes('investment') || lowerContent.includes('investor')) {
    if (lowerContent.includes('series a') || lowerContent.includes('seed') || lowerContent.includes('raise')) {
      insights.push("Fundraising is a full-time job that pauses building. Set clear timelines, prepare thoroughly, and get back to customers fast.");
    } else {
      insights.push("Funding is fuel, not validation. Stay focused on unit economics and customer satisfaction - investors bet on execution, not ideas.");
    }
  }
  
  // If no direct content match, try category-based analysis
  else if (lowerContent.includes('revenue') || lowerContent.includes('sales') || lowerContent.includes('million') || lowerContent.includes('growth')) {
    insights.push("Revenue growth without process growth creates chaos. Scale your systems and team capabilities alongside your customer base.");
  }
  
  // Handle different category naming from AI systems
  else if (categoryLower === 'achievement' || lowerContent.includes('achievement') || lowerContent.includes('success') || lowerContent.includes('milestone')) {
    if (lowerContent.includes('client') || lowerContent.includes('customer') || lowerContent.includes('deal')) {
      insights.push("Major client wins validate your value proposition. Use this momentum to refine your sales process and document what worked for future deals.");
    } else if (lowerContent.includes('launch') || lowerContent.includes('product') || lowerContent.includes('feature')) {
      insights.push("Product launches teach you more about your market than months of research. Capture every piece of feedback while it's fresh.");
    } else if (lowerContent.includes('funding') || lowerContent.includes('investment') || lowerContent.includes('raised')) {
      insights.push("Funding is fuel, not validation. Stay focused on unit economics and customer satisfaction - investors bet on execution, not ideas.");
    } else if (lowerContent.includes('research') || lowerContent.includes('publication') || lowerContent.includes('breakthrough')) {
      insights.push("Technical breakthroughs differentiate you in crowded markets. Document your innovation process - it's as valuable as the breakthrough itself.");
    } else {
      insights.push("Every win teaches you something about your business model. Document what worked so you can replicate success systematically.");
    }
  }
  
  else if (category.toLowerCase() === 'challenge') {
    if (lowerContent.includes('supply') || lowerContent.includes('supplier') || lowerContent.includes('chain')) {
      insights.push("Supply chain issues reveal dependency risks. Use this crisis to diversify suppliers and build resilience into your operations.");
    } else if (lowerContent.includes('churn') || lowerContent.includes('customer') || lowerContent.includes('left')) {
      insights.push("Churn spikes are early warning signals. Interview departing customers immediately - their honest feedback is worth its weight in gold.");
    } else if (lowerContent.includes('server') || lowerContent.includes('outage') || lowerContent.includes('technical') || lowerContent.includes('system')) {
      insights.push("Technical failures test your crisis management and customer communication. Recovery speed matters less than transparency and learning.");
    } else if (lowerContent.includes('team') || lowerContent.includes('employee') || lowerContent.includes('quit') || lowerContent.includes('left')) {
      insights.push("Key person dependency is a business risk. Use departures to strengthen processes, documentation, and cross-training.");
    } else {
      insights.push("Challenges reveal gaps in your business foundation. Address root causes, not just symptoms, for lasting solutions.");
    }
  }
  
  else if (category.toLowerCase() === 'planning') {
    if (lowerContent.includes('strategy') || lowerContent.includes('strategic') || lowerContent.includes('planning')) {
      insights.push("Strategic planning sessions should challenge assumptions, not just confirm them. Document what you're NOT doing and why.");
    } else if (lowerContent.includes('hiring') || lowerContent.includes('team') || lowerContent.includes('expand')) {
      insights.push("Hiring is investing in your future capacity. Move fast on great candidates but never compromise on cultural fit and values alignment.");
    } else if (lowerContent.includes('budget') || lowerContent.includes('financial') || lowerContent.includes('cost')) {
      insights.push("Budget planning forces prioritization. Every rand allocated is a strategic choice - make sure your spending reflects your actual priorities.");
    } else {
      insights.push("Strategic thinking separates entrepreneurs from operators. Plan with conviction but stay flexible on execution.");
    }
  }
  
  else if (categoryLower === 'growth' || lowerContent.includes('growth') || lowerContent.includes('revenue') || lowerContent.includes('scaling')) {
    if (lowerContent.includes('revenue') || lowerContent.includes('sales') || lowerContent.includes('income') || lowerContent.includes('million')) {
      insights.push("Revenue growth without process growth creates chaos. Scale your systems and team capabilities alongside your customer base.");
    } else if (lowerContent.includes('market') || lowerContent.includes('expansion') || lowerContent.includes('new')) {
      insights.push("New markets test your product-market fit assumptions. Start small, learn fast, and adapt your approach based on local insights.");
    } else if (lowerContent.includes('viral') || lowerContent.includes('trending') || lowerContent.includes('buzz')) {
      insights.push("Viral moments are opportunities to capture sustainable growth. Have systems ready to convert attention into lasting customer relationships.");
    } else {
      insights.push("Sustainable growth requires strong fundamentals. Build processes that can handle 10x your current scale before you need them.");
    }
  }
  
  else if (category.toLowerCase() === 'learning') {
    if (lowerContent.includes('feedback') || lowerContent.includes('customer') || lowerContent.includes('user')) {
      insights.push("Customer feedback patterns reveal product evolution opportunities. Look for the requests behind the requests - what job are they really hiring you for?");
    } else if (lowerContent.includes('research') || lowerContent.includes('industry') || lowerContent.includes('market')) {
      insights.push("Industry research keeps you ahead of disruption. Focus on understanding changing customer behavior, not just competitor moves.");
    } else {
      insights.push("Learning from customers and market feedback accelerates product-market fit. Every insight is competitive intelligence.");
    }
  }
  
  // If no specific insights were added yet, add a fallback insight
  if (insights.length === 0) {
    insights.push("Your business experience is valuable data. Document these moments to build stronger strategic thinking and decision-making abilities.");
  }
  
  // Add a mood-specific motivational insight as the second message
  switch (primaryEmotion.toLowerCase()) {
    case 'confident':
    case 'excited':
    case 'accomplished':
    case 'proud':
      insights.push("Your positive energy is magnetic - it attracts opportunities, partners, and customers. This momentum is your competitive advantage.");
      break;
    case 'frustrated':
    case 'stressed':
    case 'worried':
      insights.push("This friction means you're pushing boundaries. Every obstacle builds the resilience that separates successful entrepreneurs from the rest.");
      break;
    case 'thoughtful':
    case 'strategic':
    case 'curious':
      insights.push("Your reflective approach is building wisdom. Great entrepreneurs combine bold action with deep thinking - you're mastering both.");
      break;
    case 'uncertain':
      insights.push("Uncertainty is where innovation lives. You're navigating uncharted territory - that's exactly where breakthrough opportunities hide.");
      break;
    default:
      insights.push("Your entrepreneurial journey is unique. Each experience, whether challenging or rewarding, is building your business intuition.");
      break;
  }
  
  return insights.slice(0, 2); // Limit to 2 insights to keep it concise and impactful
}

// Get mood color for UI display
export function getMoodColor(mood: string): string {
  const colorMap: Record<string, string> = {
    // Lowercase versions
    'confident': '#10B981',
    'excited': '#F59E0B',
    'focused': '#6366F1',
    'optimistic': '#06B6D4',
    'stressed': '#EF4444',
    'uncertain': '#6B7280',
    'frustrated': '#DC2626',
    'accomplished': '#059669',
    'reflective': '#7C3AED',
    'determined': '#EA580C',
    'neutral': '#9CA3AF',
    'conflicted': '#6B7280',
    'thoughtful': '#7C3AED',
    'curious': '#06B6D4',
    'sad': '#3B82F6',
    'tired': '#6B7280',
    // Capitalized versions (from AI)
    'Confident': '#10B981',
    'Excited': '#F59E0B',
    'Focused': '#6366F1',
    'Optimistic': '#06B6D4',
    'Stressed': '#EF4444',
    'Uncertain': '#6B7280',
    'Frustrated': '#DC2626',
    'Accomplished': '#059669',
    'Reflective': '#7C3AED',
    'Determined': '#EA580C',
    'Conflicted': '#6B7280',
    'Thoughtful': '#7C3AED',
    'Curious': '#06B6D4',
    'Sad': '#3B82F6',
    'Tired': '#6B7280'
  };
  
  return colorMap[mood] || colorMap[mood.toLowerCase()] || colorMap.neutral;
}

// Get mood emoji for display
export function getMoodEmoji(mood: string): string {
  const emojiMap: Record<string, string> = {
    // Lowercase versions - all using emotional facial expressions
    'optimistic': '😊',
    'frustrated': '😤',
    'focused': '😌',        // Changed from 🎯 to calm/focused face
    'reflective': '🤔',
    'confident': '😎',      // Changed from 💪 to confident/cool face
    'excited': '😃',        // Changed from ⚡ to excited face
    'determined': '😤',     // Changed from 🔥 to determined face
    'accomplished': '😊',   // Changed from 🏆 to proud/happy face
    'thoughtful': '🤔',
    'curious': '🤨',        // Changed to raised eyebrow curious face
    'sad': '😢',
    'tired': '😴',
    'conflicted': '😔',
    'stressed': '😰',
    'uncertain': '😕',      // Changed from 🤔 to uncertain face
    'neutral': '😐',
    'worried': '😟',        // Added worried expression
    'proud': '😌',          // Added proud expression
    'pleased': '😊',        // Added pleased expression
    'relieved': '😌',       // Added relieved expression
    'energised': '😃',      // Added energised expression
    'encouraged': '😊',     // Added encouraged expression
    'hopeful': '🙂',        // Added hopeful expression
    'positive': '😊',       // Added positive expression
    'analytical': '🤔',     // Added analytical expression
    'methodical': '😌',     // Added methodical expression
    'organised': '😊',      // Added organised expression
    'practical': '🙂',      // Added practical expression
    'prepared': '😌',       // Added prepared expression
    'strategic': '🤔',      // Added strategic expression
    'resolved': '😌',       // Added resolved expression
    'insightful': '🤔',     // Added insightful expression
    'humbled': '😔',        // Added humbled expression
    'balanced': '😌',       // Added balanced expression
    'observant': '🤨',      // Added observant expression
    'inquisitive': '🤔',    // Added inquisitive expression
    'investigative': '🤔',  // Added investigative expression
    'exploratory': '🤔',    // Added exploratory expression
    'pragmatic': '😌',      // Added pragmatic expression
    'open-minded': '🙂',    // Added open-minded expression
    // Capitalized versions (from AI) - all using emotional facial expressions
    'Optimistic': '😊',
    'Frustrated': '😤',
    'Focused': '😌',
    'Reflective': '🤔',
    'Confident': '😎',
    'Excited': '😃',
    'Determined': '😤',
    'Accomplished': '😊',
    'Thoughtful': '🤔',
    'Curious': '🤨',
    'Sad': '😢',
    'Tired': '😴',
    'Conflicted': '😔',
    'Stressed': '😰',
    'Uncertain': '😕',
    'Worried': '😟',
    'Proud': '😌',
    'Pleased': '😊',
    'Relieved': '😌',
    'Energised': '😃',
    'Encouraged': '😊',
    'Hopeful': '🙂',
    'Positive': '😊',
    'Analytical': '🤔',
    'Methodical': '😌',
    'Organised': '😊',
    'Practical': '🙂',
    'Prepared': '😌',
    'Strategic': '🤔',
    'Resolved': '😌',
    'Insightful': '🤔',
    'Humbled': '😔',
    'Balanced': '😌',
    'Observant': '🤨',
    'Inquisitive': '🤔',
    'Investigative': '🤔',
    'Exploratory': '🤔',
    'Pragmatic': '😌',
    'Open-minded': '🙂'
  };
  
  return emojiMap[mood] || emojiMap[mood.toLowerCase()] || emojiMap.neutral;
}

import { ENTREPRENEUR_TRAINING_DATA } from './ai/entrepreneurTrainingData';

// Use the comprehensive first-person training data from entrepreneur perspective (84 examples)
export const BUSINESS_JOURNAL_TRAINING_DATA = ENTREPRENEUR_TRAINING_DATA;
