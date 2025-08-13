// Lightweight rule layer for high-precision pattern matching (from specification)
import { BusinessRule, Category, Energy, MoodPolarity } from './types'

export const BusinessRules: BusinessRule[] = [
  // Supply chain and procurement challenges
  {
    id: 'SUPPLY_CHAIN_ISSUES',
    test: (t: string) => /\b(supplier|shipment|delivery|raw material|delayed?|supply chain|procurement)\b/i.test(t) && /\b(delayed?|risk|problem|issue|behind)\b/i.test(t),
    category: 'Challenge',
    energy: 'medium',
    moodPolarity: 'Negative',
    confidence_boost: 18
  },
  
  // Customer acquisition and revenue wins
  {
    id: 'CUSTOMER_ACQUISITION',
    test: (t: string) => /\b(closed?|new accounts?|customers?|recurring revenue|mrr|growth)\b/i.test(t) && /\b(high|increased?|new|five|records?|all-time)\b/i.test(t),
    category: 'Growth',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence_boost: 20
  },
  
  // Publications and research achievements
  {
    id: 'RESEARCH_PUBLICATION',
    test: (t: string) => /\b(published?|research paper|industry|finally|hard work|paid off)\b/i.test(t),
    category: 'Achievement',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence_boost: 18
  },
  
  // Cash flow and financial challenges
  {
    id: 'CASH_FLOW_CHALLENGE',
    test: (t: string) => /\bcash\s*flow\b/.test(t) || /\bpayroll\b/.test(t),
    category: 'Challenge',
    energy: 'low',
    moodPolarity: 'Negative',
    confidence_boost: 15
  },
  
  // Technical incidents and problems
  {
    id: 'TECHNICAL_INCIDENTS',
    test: (t: string) => /\b(churn|downtime|outage|bug|incident)\b/.test(t),
    category: 'Challenge',
    energy: 'low',
    moodPolarity: 'Negative',
    confidence_boost: 12
  },
  
  // Product launches and releases
  {
    id: 'PRODUCT_LAUNCH',
    test: (t: string) => /\b(launched?|release(d)?)\b/.test(t),
    category: 'Achievement',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence_boost: 18
  },
  
  // Hiring and team growth
  {
    id: 'TEAM_GROWTH',
    test: (t: string) => /\b(hired?|recruit(ing)?|offer accepted)\b/.test(t),
    category: 'Growth',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence_boost: 15
  },
  
  // Strategic planning
  {
    id: 'STRATEGIC_PLANNING',
    test: (t: string) => /\b(strategic|strategy|planning|roadmap)\b/.test(t),
    category: 'Planning',
    energy: 'medium',
    moodPolarity: 'Neutral',
    confidence_boost: 10
  },
  
  // Customer success and satisfaction
  {
    id: 'CUSTOMER_SUCCESS',
    test: (t: string) => /\b(customer|client)\s+(success|satisfaction|happy|pleased)\b/.test(t),
    category: 'Achievement',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence_boost: 12
  },
  
  // Revenue and financial wins
  {
    id: 'REVENUE_WIN',
    test: (t: string) => /\b(revenue|profit|earnings|sales)\s+(increase|growth|up|improved)\b/.test(t),
    category: 'Achievement',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence_boost: 16
  },
  
  // Market research and analysis
  {
    id: 'MARKET_RESEARCH',
    test: (t: string) => /\b(market|competitor|analysis|research)\b/.test(t),
    category: 'Research',
    energy: 'medium',
    moodPolarity: 'Neutral',
    confidence_boost: 8
  },
  
  // Learning and skill development
  {
    id: 'LEARNING_DEVELOPMENT',
    test: (t: string) => /\b(learned|discovered|insight|understanding|skill)\b/.test(t),
    category: 'Learning',
    energy: 'medium',
    moodPolarity: 'Positive',
    confidence_boost: 10
  },
  
  // Goal achievement and milestones
  {
    id: 'MILESTONE_ACHIEVEMENT',
    test: (t: string) => /\b(milestone|goal|target|objective)\s+(achieved|reached|completed|met)\b/.test(t),
    category: 'Achievement',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence_boost: 20
  }
];

export function applyBusinessRules(text: string): {
  matchedRules: BusinessRule[];
  suggestedCategory?: Category;
  suggestedEnergy?: Energy;
  suggestedMoodPolarity?: MoodPolarity;
  confidenceBoost: number;
} {
  const lowerText = text.toLowerCase();
  console.log('Testing business rules against:', lowerText.substring(0, 50));
  
  const matchedRules = BusinessRules.filter(rule => {
    const matches = rule.test(lowerText);
    if (matches) {
      console.log('Matched rule:', rule.id, 'for text pattern');
    }
    return matches;
  });
  
  if (matchedRules.length === 0) {
    return { matchedRules: [], confidenceBoost: 0 };
  }
  
  // Aggregate suggestions from matched rules
  const categories = matchedRules.map(r => r.category);
  const energies = matchedRules.map(r => r.energy).filter(Boolean);
  const polarities = matchedRules.map(r => r.moodPolarity).filter(Boolean);
  
  // Use the most confident rule's suggestions
  const topRule = matchedRules.reduce((best, current) => 
    (current.confidence_boost || 0) > (best.confidence_boost || 0) ? current : best
  );
  
  const totalConfidenceBoost = Math.min(
    matchedRules.reduce((sum, rule) => sum + (rule.confidence_boost || 0), 0),
    25 // Cap boost at 25 points
  );
  
  return {
    matchedRules,
    suggestedCategory: topRule.category,
    suggestedEnergy: topRule.energy,
    suggestedMoodPolarity: topRule.moodPolarity,
    confidenceBoost: totalConfidenceBoost
  };
}

export function getRuleMatchNames(rules: BusinessRule[]): string[] {
  return rules.map(rule => rule.id);
}