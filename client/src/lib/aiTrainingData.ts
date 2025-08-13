// Comprehensive training data for AI sentiment analysis accuracy
// This provides hundreds of real business journal scenarios for better categorization
import { ENHANCED_BUSINESS_TRAINING_DATA } from './advancedTrainingGenerator';

export interface TrainingExample {
  text: string;
  expected_category: 'Growth' | 'Challenge' | 'Achievement' | 'Planning' | 'Learning' | 'Research';
  expected_mood: string;
  expected_energy: 'high' | 'medium' | 'low';
  confidence_range: [number, number];
  business_context: string;
}

export const BUSINESS_JOURNAL_TRAINING_DATA: TrainingExample[] = [
  // Challenge scenarios
  {
    text: "Today has been challenging, but rewarding",
    expected_category: "Challenge",
    expected_mood: "Determined",
    expected_energy: "medium",
    confidence_range: [75, 85],
    business_context: "Overcoming daily business obstacles with positive outlook"
  },
  {
    text: "Struggling with cash flow this month, need to find solutions",
    expected_categorya: "Challenge", 
    expected_mood: "Stressed",
    expected_energy: "low",
    confidence_range: [85, 95],
    business_context: "Financial pressure requiring immediate action"
  },
  {
    text: "Customer complained about our service today, feeling frustrated",
    expected_category: "Challenge",
    expected_mood: "Frustrated",
    expected_energy: "low", 
    confidence_range: [80, 90],
    business_context: "Service quality issues affecting customer satisfaction"
  },
  {
    text: "Team member quit unexpectedly, now I'm overwhelmed with work",
    expected_category: "Challenge",
    expected_mood: "Overwhelmed",
    expected_energy: "low",
    confidence_range: [85, 95],
    business_context: "Staffing crisis creating operational strain"
  },
  {
    text: "Competitor launched similar product, worried about market share",
    expected_category: "Challenge",
    expected_mood: "Worried",
    expected_energy: "medium",
    confidence_range: [80, 90],
    business_context: "Competitive pressure threatening business position"
  },

  // Growth scenarios
  {
    text: "Excited about the new market opportunity we discovered",
    expected_category: "Growth",
    expected_mood: "Excited",
    expected_energy: "high",
    confidence_range: [85, 95],
    business_context: "Market expansion potential generating enthusiasm"
  },
  {
    text: "Revenue increased 30% this quarter, time to scale operations",
    expected_category: "Growth",
    expected_mood: "Confident",
    expected_energy: "high",
    confidence_range: [90, 95],
    business_context: "Strong financial performance enabling expansion"
  },
  {
    text: "Three new clients signed this week, momentum is building",
    expected_category: "Growth",
    expected_mood: "Optimistic",
    expected_energy: "high",
    confidence_range: [85, 95],
    business_context: "Client acquisition success creating positive trajectory"
  },
  {
    text: "Looking to expand into the European market next year",
    expected_category: "Growth",
    expected_mood: "Ambitious",
    expected_energy: "high",
    confidence_range: [80, 90],
    business_context: "International expansion planning for business growth"
  },
  {
    text: "What an incredible week! We just signed three major enterprise clients, bringing our monthly recurring revenue to $50K - a 150% increase from last quarter. I'm beyond excited but also feeling the pressure to scale our operations quickly. We need to hire at least two more developers and a customer success manager within the next month. I've been working on our hiring strategy and setting up interviews. The team is energized by the growth, and everyone is stepping up to handle the increased workload. I can finally see our vision becoming reality. We're moving from survival mode to growth mode, and it feels amazing.",
    expected_category: "Growth",
    expected_mood: "Excited",
    expected_energy: "high",
    confidence_range: [90, 95],
    business_context: "Rapid business expansion requiring strategic scaling and team growth"
  },

  // Achievement scenarios
  {
    text: "Finally closed the biggest deal of the year!",
    expected_category: "Achievement",
    expected_mood: "Accomplished",
    expected_energy: "high",
    confidence_range: [90, 95],
    business_context: "Major sales success representing significant milestone"
  },
  {
    text: "Launched our new product successfully, customers love it",
    expected_category: "Achievement",
    expected_mood: "Proud",
    expected_energy: "high",
    confidence_range: [85, 95],
    business_context: "Product launch success with positive market reception"
  },
  {
    text: "Hit our quarterly revenue target ahead of schedule",
    expected_category: "Achievement",
    expected_mood: "Satisfied",
    expected_energy: "high",
    confidence_range: [85, 95],
    business_context: "Financial goal achievement exceeding expectations"
  },
  {
    text: "Team worked amazing together on this project, so proud",
    expected_category: "Achievement",
    expected_mood: "Grateful",
    expected_energy: "high",
    confidence_range: [80, 90],
    business_context: "Team collaboration success creating positive outcomes"
  },

  // Planning scenarios
  {
    text: "Need to create a marketing strategy for Q4",
    expected_category: "Planning",
    expected_mood: "Focused",
    expected_energy: "medium",
    confidence_range: [80, 90],
    business_context: "Strategic marketing planning for upcoming quarter"
  },
  {
    text: "Planning to hire two new developers next month",
    expected_category: "Planning",
    expected_mood: "Organized",
    expected_energy: "medium",
    confidence_range: [75, 85],
    business_context: "Team expansion planning to support growth"
  },
  {
    text: "Working on the 2025 business plan and budget forecast",
    expected_category: "Planning",
    expected_mood: "Analytical",
    expected_energy: "medium",
    confidence_range: [80, 90],
    business_context: "Annual strategic planning and financial forecasting"
  },
  {
    text: "Need to organize our inventory system before holiday season",
    expected_category: "Planning",
    expected_mood: "Practical",
    expected_energy: "medium",
    confidence_range: [75, 85],
    business_context: "Operational planning for seasonal demand"
  },

  // Learning scenarios  
  {
    text: "Learned a lot from that failed project, valuable insights",
    expected_category: "Learning",
    expected_mood: "Reflective",
    expected_energy: "medium",
    confidence_range: [80, 90],
    business_context: "Extracting lessons from business setbacks"
  },
  {
    text: "Customer feedback helped me understand our weak points",
    expected_category: "Learning",
    expected_mood: "Thoughtful",
    expected_energy: "medium",
    confidence_range: [75, 85],
    business_context: "Learning from customer input to improve business"
  },
  {
    text: "Reflecting on what went wrong with the last product launch",
    expected_category: "Learning",
    expected_mood: "Contemplative",
    expected_energy: "low",
    confidence_range: [80, 90],
    business_context: "Post-mortem analysis for future improvement"
  },
  {
    text: "Feeling uncertain about which direction to take the company",
    expected_category: "Learning",
    expected_mood: "Uncertain",
    expected_energy: "low",
    confidence_range: [70, 80],
    business_context: "Strategic uncertainty requiring deeper consideration"
  },

  // Research scenarios
  {
    text: "Need to research our top competitors before launching",
    expected_category: "Research",
    expected_mood: "Curious",
    expected_energy: "medium",
    confidence_range: [80, 90],
    business_context: "Competitive intelligence gathering for strategic advantage"
  },
  {
    text: "Investigating new technology solutions for our workflow",
    expected_category: "Research",
    expected_mood: "Investigative",
    expected_energy: "medium",
    confidence_range: [75, 85],
    business_context: "Technology research for operational improvement"
  },
  {
    text: "Who are my main competitors in the local market?",
    expected_category: "Research",
    expected_mood: "Analytical",
    expected_energy: "medium",
    confidence_range: [85, 95],
    business_context: "Market analysis for competitive positioning"
  },
  {
    text: "Studying customer behavior patterns in our analytics",
    expected_category: "Research",
    expected_mood: "Focused",
    expected_energy: "medium",
    confidence_range: [80, 90],
    business_context: "Customer data analysis for business insights"
  },

  // Extended Challenge scenarios (longer entries)
  {
    text: "Today was incredibly challenging. We discovered a major bug in our production system that affected 30% of our users. The team worked until 2 AM to fix it, and I had to personally call our biggest clients to apologize. It's frustrating because we just implemented new QA processes last month, but somehow this slipped through. I'm questioning our development workflow and wondering if we need to completely overhaul our testing procedures. The good news is that our team really came together during the crisis, and our customers were understanding. But I can't help feeling like I failed as a leader.",
    expected_category: "Challenge",
    expected_mood: "Frustrated",
    expected_energy: "low",
    confidence_range: [85, 95],
    business_context: "Technical crisis management requiring leadership and process evaluation"
  },
  {
    text: "Cash flow has been tight for the past three months. I've been putting off paying myself so we can cover payroll and essential expenses. Had a difficult conversation with our landlord about extending our lease payment deadline. I know these are normal startup challenges, but it's emotionally draining. I find myself lying awake at night running numbers in my head, trying to figure out how to stretch every dollar. We have two potential clients who might sign next month, but I can't count on maybes. Need to make some hard decisions about cutting costs or finding emergency funding.",
    expected_category: "Challenge",
    expected_mood: "Stressed",
    expected_energy: "low",
    confidence_range: [90, 95],
    business_context: "Financial pressure requiring strategic decision-making and personal sacrifice"
  },

  // Extended Growth scenarios (longer entries)
  {
    text: "What an incredible week! We just signed three major enterprise clients, bringing our monthly recurring revenue to $50K - a 150% increase from last quarter. I'm beyond excited but also feeling the pressure to scale our operations quickly. We need to hire at least two more developers and a customer success manager within the next month. I've been working on our hiring strategy and setting up interviews. The team is energized by the growth, and everyone is stepping up to handle the increased workload. I can finally see our vision becoming reality. We're moving from survival mode to growth mode, and it feels amazing.",
    expected_category: "Growth",
    expected_mood: "Excited",
    expected_energy: "high",
    confidence_range: [90, 95],
    business_context: "Rapid business expansion requiring strategic scaling and team growth"
  },
  {
    text: "The European market expansion is going better than expected. Our localization efforts are paying off, and we're seeing strong adoption in Germany and France. I spent the morning reviewing metrics with our international team, and the numbers are impressive - 40% month-over-month growth in international users. We're now generating 25% of our revenue from European markets. I'm starting to think about opening a European office next year. The cultural nuances we've learned have been fascinating, and I'm excited about the potential for further expansion into other regions.",
    expected_category: "Growth",
    expected_mood: "Confident",
    expected_energy: "high",
    confidence_range: [85, 95],
    business_context: "International market expansion success generating new opportunities"
  },

  // Extended Achievement scenarios (longer entries)
  {
    text: "We did it! After 18 months of development, negotiations, and countless iterations, we finally closed the partnership deal with Microsoft. This is the breakthrough we've been working toward since founding the company. The partnership will integrate our AI technology into their enterprise suite, potentially reaching millions of users. I'm proud of the entire team - our engineers who built world-class technology, our sales team who navigated complex enterprise negotiations, and our legal team who structured the deal perfectly. This validates everything we've believed about our product's potential. I called my co-founder at midnight to share the news, and we both just sat on the phone in silence for a moment, absorbing what this means for our future.",
    expected_category: "Achievement",
    expected_mood: "Accomplished",
    expected_energy: "high",
    confidence_range: [95, 95],
    business_context: "Major strategic partnership achievement representing company milestone"
  },

  // Extended Planning scenarios (longer entries)
  {
    text: "Spent the entire day working on our 2025 strategic plan. I've been analyzing market trends, competitor movements, and our internal capabilities to chart our course for next year. The key priorities are: expanding our AI capabilities, entering two new market verticals, and building a world-class customer success organization. I've outlined quarterly milestones, budget allocations, and hiring plans. The most challenging part is balancing aggressive growth targets with sustainable operations. I want to grow fast but not at the expense of product quality or team burnout. I've scheduled presentations with the board next week to get their input before finalizing our direction.",
    expected_category: "Planning",
    expected_mood: "Analytical",
    expected_energy: "medium",
    confidence_range: [85, 95],
    business_context: "Comprehensive strategic planning balancing growth ambitions with operational sustainability"
  },

  // Extended Learning scenarios (longer entries)
  {
    text: "The product launch didn't go as planned, and I've been reflecting on what went wrong and what we can learn. Our user onboarding was too complex, our messaging wasn't clear, and we underestimated the technical support needed. I've been reading through customer feedback, and while it's painful, it's incredibly valuable. Users want simplicity, not more features. I realize I've been building what I think they need instead of what they actually need. This is a humbling experience, but it's also clarifying our path forward. I'm scheduling user interviews next week to better understand their real pain points. Sometimes failures teach you more than successes.",
    expected_category: "Learning",
    expected_mood: "Reflective",
    expected_energy: "medium",
    confidence_range: [85, 90],
    business_context: "Product launch post-mortem analysis revealing important customer insights"
  },

  // Complex mixed scenarios
  {
    text: "Today was both challenging and rewarding in equal measure. We had a major client escalation in the morning - they were threatening to cancel their contract due to performance issues. I immediately got on a call with their team, acknowledged the problems, and worked with our engineering team to implement a fix within 4 hours. By the end of the day, not only had we resolved their issues, but they actually increased their contract value by 50%. It's situations like these that test your character as a leader. The pressure was intense, but the team rally and the positive outcome reminded me why I love building this business.",
    expected_category: "Challenge",
    expected_mood: "Determined",
    expected_energy: "medium",
    confidence_range: [80, 90],
    business_context: "Customer crisis management resulting in strengthened relationship and business growth"
  },

  // Industry-specific scenarios
  {
    text: "E-commerce metrics review: conversion rate dropped 15% this month, but average order value increased 25%. Analyzing the data, it seems our new premium product line is attracting higher-value customers but deterring price-sensitive buyers. Need to optimize our product mix and pricing strategy. Considering A/B testing different price points and creating a budget-friendly product tier.",
    expected_category: "Research",
    expected_mood: "Analytical",
    expected_energy: "medium",
    confidence_range: [85, 95],
    business_context: "E-commerce performance analysis requiring strategic product and pricing decisions"
  },

  // Emotional complexity scenarios
  {
    text: "Fired our first employee today. John wasn't meeting performance standards despite multiple conversations and improvement plans. It was one of the hardest things I've had to do as a founder. He's a good person, just not the right fit for our fast-paced environment. I feel guilty but also relieved. The team will be stronger, but I hate that someone's livelihood was affected by my decision. This is the lonely part of leadership that no one talks about.",
    expected_category: "Challenge",
    expected_mood: "Conflicted",
    expected_energy: "low",
    confidence_range: [85, 95],
    business_context: "Difficult personnel decisions requiring leadership courage and emotional processing"
  }
];

// Enhanced pattern matching with training data validation
export class AITrainingValidator {
  // Combine base and enhanced training data for comprehensive validation
  private static getAllTrainingData(): TrainingExample[] {
    return [...BUSINESS_JOURNAL_TRAINING_DATA, ...ENHANCED_BUSINESS_TRAINING_DATA];
  }

  static validateCategoryAccuracy(text: string, predictedCategory: string): number {
    const allTrainingData = this.getAllTrainingData();
    const matchingExamples = allTrainingData.filter(example => 
      this.calculateSimilarity(text.toLowerCase(), example.text.toLowerCase()) > 0.25
    );

    if (matchingExamples.length === 0) return 0.5; // Neutral confidence

    const correctPredictions = matchingExamples.filter(example => 
      example.expected_category.toLowerCase() === predictedCategory.toLowerCase()
    );

    return correctPredictions.length / matchingExamples.length;
  }

  static calculateSimilarity(text1: string, text2: string): number {
    // Enhanced similarity calculation for longer texts
    const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    // Create word frequency maps
    const freq1 = new Map<string, number>();
    const freq2 = new Map<string, number>();
    
    words1.forEach(word => freq1.set(word, (freq1.get(word) || 0) + 1));
    words2.forEach(word => freq2.set(word, (freq2.get(word) || 0) + 1));
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    const allWords = new Set([...freq1.keys(), ...freq2.keys()]);
    
    for (const word of allWords) {
      const f1 = freq1.get(word) || 0;
      const f2 = freq2.get(word) || 0;
      
      dotProduct += f1 * f2;
      norm1 += f1 * f1;
      norm2 += f2 * f2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    const cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    
    // Also check for key phrase matches to boost similarity for business concepts
    const keyPhrases1 = this.extractKeyPhrases(text1);
    const keyPhrases2 = this.extractKeyPhrases(text2);
    
    const phraseMatches = keyPhrases1.filter(phrase => 
      keyPhrases2.some(phrase2 => phrase2.includes(phrase) || phrase.includes(phrase2))
    ).length;
    
    const phraseBoost = Math.min(phraseMatches * 0.1, 0.3);
    
    return Math.min(cosineSimilarity + phraseBoost, 1.0);
  }
  
  static extractKeyPhrases(text: string): string[] {
    const businessKeywords = [
      'cash flow', 'revenue', 'profit', 'customer', 'client', 'product', 'market',
      'team', 'employee', 'hire', 'fire', 'launch', 'growth', 'challenge', 
      'success', 'failure', 'partnership', 'competition', 'strategy', 'planning',
      'metrics', 'kpi', 'target', 'goal', 'milestone', 'quarterly', 'annual',
      'investment', 'funding', 'venture', 'startup', 'scale', 'expansion'
    ];
    
    const lowerText = text.toLowerCase();
    return businessKeywords.filter(keyword => lowerText.includes(keyword));
  }

  static getBestTrainingMatch(text: string): TrainingExample | null {
    let bestMatch: TrainingExample | null = null;
    let bestSimilarity = 0;
    const allTrainingData = this.getAllTrainingData();

    for (const example of allTrainingData) {
      const similarity = this.calculateSimilarity(text.toLowerCase(), example.text.toLowerCase());
      if (similarity > bestSimilarity && similarity > 0.25) {
        bestSimilarity = similarity;
        bestMatch = example;
      }
    }

    return bestMatch;
  }

  static getExpectedResult(text: string): Partial<TrainingExample> | null {
    const match = this.getBestTrainingMatch(text);
    return match ? {
      expected_category: match.expected_category,
      expected_mood: match.expected_mood,
      expected_energy: match.expected_energy,
      confidence_range: match.confidence_range
    } : null;
  }
}

// User feedback learning system
export interface UserFeedback {
  entry_id: string;
  original_category: string;
  corrected_category: string;
  original_mood: string;
  corrected_mood: string;
  text_content: string;
  user_id: string;
  timestamp: Date;
  feedback_type: 'category_correction' | 'mood_correction' | 'both';
}

export class UserLearningSystem {
  private static userCorrections: UserFeedback[] = [];

  static recordUserFeedback(feedback: UserFeedback): void {
    this.userCorrections.push(feedback);
    
    // Store in localStorage for persistence
    localStorage.setItem('ai_user_corrections', JSON.stringify(this.userCorrections));
    
    console.log('User feedback recorded:', feedback);
  }

  static loadUserFeedback(): void {
    const stored = localStorage.getItem('ai_user_corrections');
    if (stored) {
      this.userCorrections = JSON.parse(stored);
    }
  }

  static getUserPatterns(userId: string): UserFeedback[] {
    return this.userCorrections.filter(feedback => feedback.user_id === userId);
  }

  static adjustPredictionBasedOnHistory(
    text: string, 
    predicted: any, 
    userId: string
  ): any {
    const userPatterns = this.getUserPatterns(userId);
    
    // Find similar corrections user has made
    const relevantCorrections = userPatterns.filter(correction => 
      AITrainingValidator.calculateSimilarity(text.toLowerCase(), correction.text_content.toLowerCase()) > 0.4
    );

    if (relevantCorrections.length > 0) {
      // Apply user's preferred corrections
      const mostRecentCorrection = relevantCorrections[relevantCorrections.length - 1];
      
      return {
        ...predicted,
        primary_mood: mostRecentCorrection.corrected_mood || predicted.primary_mood,
        business_category: mostRecentCorrection.corrected_category.toLowerCase() || predicted.business_category,
        confidence: Math.min(predicted.confidence + 10, 95), // Boost confidence
        user_learned: true
      };
    }

    return predicted;
  }
}

// Initialize user learning system
UserLearningSystem.loadUserFeedback();