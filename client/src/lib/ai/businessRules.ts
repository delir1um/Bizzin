// Lightweight rule-based processing for high-precision pattern matching
// Implements business-specific rules from the improvement spec

import type { Category, Energy, MoodPolarity } from './types';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  test: (text: string) => boolean;
  category: Category;
  energy?: Energy;
  moodPolarity?: MoodPolarity;
  confidence: number;
  priority: number; // Higher priority rules override lower ones
}

// High-precision business rules for immediate categorization
export const BUSINESS_RULES: BusinessRule[] = [
  // Financial Challenge Rules
  {
    id: 'CASH_FLOW_CRISIS',
    name: 'Cash Flow Problems',
    description: 'Identifies cash flow and payroll issues',
    test: (t: string) => /\b(cash\s*flow|payroll|can\'t\s+pay|payment\s+delayed|financial\s+crisis|money\s+tight|budget\s+shortfall)\b/i.test(t),
    category: 'Challenge',
    energy: 'low',
    moodPolarity: 'Negative',
    confidence: 0.9,
    priority: 10
  },
  
  {
    id: 'CUSTOMER_LOSS',
    name: 'Customer/Revenue Loss',
    description: 'Identifies customer churn and revenue decline',
    test: (t: string) => /\b(lost\s+customer|customer\s+cancelled|churn|revenue\s+down|sales\s+declined|client\s+left)\b/i.test(t),
    category: 'Challenge',
    energy: 'low',
    moodPolarity: 'Negative',
    confidence: 0.85,
    priority: 9
  },

  // Technical/Operational Challenge Rules
  {
    id: 'SYSTEM_ISSUES',
    name: 'Technical Problems',
    description: 'Identifies system outages, bugs, and technical crises',
    test: (t: string) => /\b(outage|downtime|system\s+down|bug|incident|server\s+crash|data\s+loss|security\s+breach)\b/i.test(t),
    category: 'Challenge',
    energy: 'medium',
    moodPolarity: 'Negative',
    confidence: 0.88,
    priority: 8
  },

  // Achievement Rules
  {
    id: 'PRODUCT_LAUNCH',
    name: 'Product Launch Success',
    description: 'Identifies successful product launches and releases',
    test: (t: string) => /\b(launched|release(d)?|shipped|went\s+live|product\s+launch|feature\s+launch|rollout)\b/i.test(t),
    category: 'Achievement',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence: 0.85,
    priority: 9
  },

  {
    id: 'MILESTONE_REACHED',
    name: 'Business Milestone',
    description: 'Identifies major business milestones and achievements',
    test: (t: string) => /\b(milestone|breakthrough|record\s+(high|sales|revenue)|hit\s+target|exceeded\s+goal|major\s+win)\b/i.test(t),
    category: 'Achievement',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence: 0.9,
    priority: 10
  },

  // Growth Rules
  {
    id: 'TEAM_EXPANSION',
    name: 'Team Growth',
    description: 'Identifies hiring and team expansion',
    test: (t: string) => /\b(hired|new\s+hire|recruit(ing|ed)|team\s+member|onboard(ing|ed)|staff\s+growth|offer\s+accepted)\b/i.test(t),
    category: 'Growth',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence: 0.8,
    priority: 7
  },

  {
    id: 'REVENUE_GROWTH',
    name: 'Revenue Growth',
    description: 'Identifies significant revenue and business growth',
    test: (t: string) => /\b(revenue\s+up|sales\s+increased|growth\s+rate|scaling|expansion|new\s+market|market\s+share)\b/i.test(t),
    category: 'Growth',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence: 0.85,
    priority: 8
  },

  // Planning Rules
  {
    id: 'STRATEGIC_PLANNING',
    name: 'Strategic Planning',
    description: 'Identifies strategic planning and business analysis',
    test: (t: string) => /\b(strategy|strategic\s+plan|roadmap|business\s+plan|quarterly\s+review|annual\s+plan|planning\s+session)\b/i.test(t),
    category: 'Planning',
    energy: 'medium',
    moodPolarity: 'Neutral',
    confidence: 0.8,
    priority: 6
  },

  {
    id: 'FUNDRAISING',
    name: 'Fundraising Activities',
    description: 'Identifies fundraising and investment activities',
    test: (t: string) => /\b(fundraising|investor|investment|pitch\s+deck|series\s+[abc]|valuation|venture\s+capital|vc)\b/i.test(t),
    category: 'Planning',
    energy: 'medium',
    moodPolarity: 'Neutral',
    confidence: 0.85,
    priority: 7
  },

  // Learning/Research Rules
  {
    id: 'MARKET_RESEARCH',
    name: 'Market Research',
    description: 'Identifies market research and competitive analysis',
    test: (t: string) => /\b(market\s+research|competitor\s+analysis|industry\s+trends|user\s+research|customer\s+feedback|survey\s+results)\b/i.test(t),
    category: 'Research',
    energy: 'medium',
    moodPolarity: 'Neutral',
    confidence: 0.75,
    priority: 5
  },

  {
    id: 'LEARNING_DEVELOPMENT',
    name: 'Learning & Development',
    description: 'Identifies learning experiences and skill development',
    test: (t: string) => /\b(learned|training|course|workshop|conference|skill\s+development|mentoring|coaching)\b/i.test(t),
    category: 'Learning',
    energy: 'medium',
    moodPolarity: 'Positive',
    confidence: 0.7,
    priority: 4
  },

  // Specific Business Event Rules
  {
    id: 'PARTNERSHIP_DEAL',
    name: 'Partnership Success',
    description: 'Identifies successful partnerships and collaborations',
    test: (t: string) => /\b(partnership|collaboration|signed\s+deal|joint\s+venture|strategic\s+alliance|integration\s+partner)\b/i.test(t),
    category: 'Achievement',
    energy: 'high',
    moodPolarity: 'Positive',
    confidence: 0.8,
    priority: 7
  },

  {
    id: 'COMPLIANCE_ISSUES',
    name: 'Compliance & Legal Issues',
    description: 'Identifies compliance, legal, and regulatory challenges',
    test: (t: string) => /\b(compliance|legal\s+issue|regulatory|audit|violation|lawsuit|intellectual\s+property|patent\s+dispute)\b/i.test(t),
    category: 'Challenge',
    energy: 'low',
    moodPolarity: 'Negative',
    confidence: 0.85,
    priority: 8
  }
];

export class BusinessRuleEngine {
  
  static applyRules(text: string): {
    matchedRules: BusinessRule[];
    bestRule: BusinessRule | null;
    ruleConfidence: number;
  } {
    const matchedRules = BUSINESS_RULES.filter(rule => rule.test(text));
    
    if (matchedRules.length === 0) {
      return {
        matchedRules: [],
        bestRule: null,
        ruleConfidence: 0
      };
    }
    
    // Sort by priority (higher first), then by confidence
    matchedRules.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.confidence - a.confidence;
    });
    
    const bestRule = matchedRules[0];
    const ruleConfidence = bestRule.confidence;
    
    return {
      matchedRules,
      bestRule,
      ruleConfidence
    };
  }

  static getRuleById(id: string): BusinessRule | null {
    return BUSINESS_RULES.find(rule => rule.id === id) || null;
  }

  static getRulesByCategory(category: Category): BusinessRule[] {
    return BUSINESS_RULES.filter(rule => rule.category === category);
  }

  static analyzeRuleCoverage(texts: string[]): {
    totalTexts: number;
    rulesTriggered: number;
    coverage: number;
    mostTriggeredRules: Array<{rule: BusinessRule, count: number}>;
  } {
    const ruleHits = new Map<string, number>();
    let totalTriggered = 0;
    
    for (const text of texts) {
      const result = this.applyRules(text);
      if (result.bestRule) {
        totalTriggered++;
        const count = ruleHits.get(result.bestRule.id) || 0;
        ruleHits.set(result.bestRule.id, count + 1);
      }
    }
    
    const mostTriggeredRules = Array.from(ruleHits.entries())
      .map(([ruleId, count]) => ({
        rule: this.getRuleById(ruleId)!,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalTexts: texts.length,
      rulesTriggered: totalTriggered,
      coverage: totalTriggered / texts.length,
      mostTriggeredRules
    };
  }

  static createCustomRule(rule: Omit<BusinessRule, 'id'>): BusinessRule {
    const id = `CUSTOM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      ...rule
    };
  }

  static validateRule(rule: BusinessRule, testCases: Array<{text: string, shouldMatch: boolean}>): {
    accuracy: number;
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  } {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    
    for (const testCase of testCases) {
      const matches = rule.test(testCase.text);
      
      if (matches && testCase.shouldMatch) {
        truePositives++;
      } else if (matches && !testCase.shouldMatch) {
        falsePositives++;
      } else if (!matches && !testCase.shouldMatch) {
        trueNegatives++;
      } else if (!matches && testCase.shouldMatch) {
        falseNegatives++;
      }
    }
    
    const total = testCases.length;
    const accuracy = (truePositives + trueNegatives) / total;
    
    return {
      accuracy,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives
    };
  }
}