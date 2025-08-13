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
  const insights = generateBusinessInsights(primaryEmotion, category, topEmotions);
  
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

function generateBusinessInsights(primaryEmotion: string, category: string, emotions: string[]): string[] {
  const insights: string[] = [];
  
  // Inspirational reflection messages based on emotions - helping entrepreneurs on their journey
  switch (primaryEmotion.toLowerCase()) {
    case 'confident':
    case 'Confident':
      insights.push("Your confidence radiates strength. Trust your instincts - they've brought you this far for a reason.");
      break;
    case 'excited':
    case 'Excited':
      insights.push("This excitement is your inner entrepreneur speaking. Channel this energy into bold action.");
      break;
    case 'focused':
    case 'Focused':
      insights.push("Your clarity of purpose is a superpower. Stay in this zone - great things happen here.");
      break;
    case 'stressed':
    case 'Stressed':
      insights.push("Every great entrepreneur walks this path. Remember: diamonds are formed under pressure.");
      break;
    case 'uncertain':
    case 'Uncertain':
      insights.push("Uncertainty is the birthplace of innovation. You're exactly where breakthrough leaders begin their journey.");
      break;
    case 'accomplished':
    case 'Accomplished':
      insights.push("Savor this moment - you've earned it. Success like this creates ripples far beyond what you can see.");
      break;
    case 'frustrated':
    case 'Frustrated':
      insights.push("This friction means you're pushing boundaries. Every obstacle you face is building the resilience that will define your success.");
      break;
    case 'worried':
    case 'Worried':
      insights.push("Your concern shows how much you care about your mission. Channel this into protective action for what matters most.");
      break;
    case 'proud':
    case 'Proud':
      insights.push("This pride is well-deserved. You're building something meaningful - let this moment fuel your next chapter.");
      break;
    case 'thoughtful':
    case 'Thoughtful':
      insights.push("Your reflection shows wisdom. Great leaders pause to think deeply before they leap boldly.");
      break;
    case 'curious':
    case 'Curious':
      insights.push("Your curiosity is the compass that will lead you to discoveries others miss. Keep asking the hard questions.");
      break;
  }
  
  // Inspirational category-based insights - focused on the entrepreneur's journey
  switch (category.toLowerCase()) {
    case 'growth':
      insights.push("You're in expansion mode - this is where legends are made. Scale your vision as boldly as you scale your business.");
      break;
    case 'challenge':
      insights.push("This challenge is your chrysalis. Every entrepreneur's greatest breakthroughs come disguised as their biggest problems.");
      break;
    case 'achievement':
      insights.push("You've just proven what's possible when vision meets determination. This success is a launchpad, not a destination.");
      break;
    case 'planning':
      insights.push("Strategic thinking is your competitive advantage. You're not just building a business - you're architecting the future.");
      break;
    case 'research':
      insights.push("Your quest for understanding sets you apart. Data becomes wisdom in the hands of someone who knows how to listen.");
      break;
    case 'learning':
      insights.push("Every lesson you absorb becomes part of your entrepreneurial DNA. You're not just learning - you're evolving.");
      break;
  }
  
  // Inspirational multi-emotion insights
  if (emotions.includes('excited') && emotions.includes('focused')) {
    insights.push("When passion meets precision, magic happens. You're in the perfect headspace for breakthrough moments.");
  }
  
  if (emotions.includes('frustrated') && emotions.includes('determined')) {
    insights.push("This tension between frustration and determination is where champions are forged. Push through - your breakthrough is closer than you think.");
  }
  
  if (emotions.includes('worried') && emotions.includes('confident')) {
    insights.push("The balance of concern and confidence shows mature leadership. You care deeply while staying strong - that's rare and powerful.");
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
