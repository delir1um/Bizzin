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
  
  // Emotion-based insights
  switch (primaryEmotion) {
    case 'confident':
      insights.push("Your confidence is showing - this mindset often leads to breakthrough moments");
      break;
    case 'excited':
      insights.push("High energy and enthusiasm can be contagious - great time to rally your team");
      break;
    case 'focused':
      insights.push("This systematic approach suggests you're building sustainable business habits");
      break;
    case 'stressed':
      insights.push("Stress often precedes growth phases - consider what support systems you need");
      break;
    case 'uncertain':
      insights.push("Uncertainty is where innovation happens - trust the process");
      break;
    case 'accomplished':
      insights.push("Celebrating wins builds momentum - document what worked for future reference");
      break;
    case 'frustrated':
      insights.push("Obstacles reveal opportunities - what is this challenge teaching you?");
      break;
  }
  
  // Category-based insights
  switch (category) {
    case 'growth':
      insights.push("Growth patterns detected - track what's driving this expansion");
      break;
    case 'challenge':
      insights.push("Every successful entrepreneur faces setbacks - how you respond defines success");
      break;
    case 'achievement':
      insights.push("Success builds on itself - consider how to replicate this outcome");
      break;
    case 'planning':
      insights.push("Strategic thinking is evident - great foundation for execution");
      break;
  }
  
  // Multi-emotion insights
  if (emotions.includes('excited') && emotions.includes('focused')) {
    insights.push("The combination of excitement and focus is powerful - ideal state for big moves");
  }
  
  if (emotions.includes('frustrated') && emotions.includes('determined')) {
    insights.push("Frustration paired with determination often leads to breakthroughs");
  }
  
  return insights.slice(0, 2); // Limit to 2 insights to keep it concise
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
    // Lowercase versions
    'optimistic': '😊',
    'frustrated': '😤',
    'focused': '🎯',
    'reflective': '🤔',
    'confident': '💪',
    'excited': '⚡',
    'determined': '🔥',
    'accomplished': '🏆',
    'thoughtful': '🤔',
    'curious': '🤔',
    'sad': '😢',
    'tired': '😴',
    'conflicted': '😔',
    'stressed': '😰',
    'uncertain': '🤔',
    'neutral': '😐',
    // Capitalized versions (from AI)
    'Optimistic': '😊',
    'Frustrated': '😤',
    'Focused': '🎯',
    'Reflective': '🤔',
    'Confident': '💪',
    'Excited': '⚡',
    'Determined': '🔥',
    'Accomplished': '🏆',
    'Thoughtful': '🤔',
    'Curious': '🤔',
    'Sad': '😢',
    'Tired': '😴',
    'Conflicted': '😔',
    'Stressed': '😰',
    'Uncertain': '🤔'
  };
  
  return emojiMap[mood] || emojiMap[mood.toLowerCase()] || emojiMap.neutral;
}

// Training data for enhanced AI system (specification compliant)
export const BUSINESS_JOURNAL_TRAINING_DATA = [
  {
    id: "SUPPLY_CHAIN_001",
    version: 1,
    text: "Supplier delayed the raw material shipment by two weeks, and now our production schedule is at risk",
    expected_category: "Challenge" as const,
    expected_mood: "Frustrated",
    expected_energy: "medium" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Supply chain disruption impacting production timelines",
    source: "handwritten" as const
  },
  {
    id: "REVENUE_GROWTH_001",
    version: 1,
    text: "We closed five new accounts this week, and our monthly recurring revenue is now at an all-time high",
    expected_category: "Growth" as const,
    expected_mood: "Excited",
    expected_energy: "high" as const,
    confidence_range: [90, 95] as [number, number],
    business_context: "Rapid customer acquisition driving financial growth",
    source: "handwritten" as const
  },
  {
    id: "RESEARCH_ACHIEVEMENT_001",
    version: 1,
    text: "Finally published our first industry research paper — the team's hard work has paid off",
    expected_category: "Achievement" as const,
    expected_mood: "Proud",
    expected_energy: "high" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Successful completion of a major intellectual deliverable",
    source: "handwritten" as const
  },
  {
    id: "GROWTH_001",
    version: 1,
    text: "We hired three new developers this week and they're already contributing to the codebase",
    expected_category: "Growth" as const,
    expected_mood: "optimistic",
    expected_energy: "high" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Team expansion and hiring success",
    source: "handwritten" as const
  },
  {
    id: "CHALLENGE_001", 
    version: 1,
    text: "Cash flow is tight this month and we need to delay some payments",
    expected_category: "Challenge" as const,
    expected_mood: "worried",
    expected_energy: "low" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Financial constraints and cash flow management",
    source: "handwritten" as const
  },
  {
    id: "ACHIEVEMENT_001",
    version: 1, 
    text: "Successfully launched our new product feature and customer feedback has been overwhelmingly positive",
    expected_category: "Achievement" as const,
    expected_mood: "excited",
    expected_energy: "high" as const,
    confidence_range: [90, 95] as [number, number],
    business_context: "Product launch success and customer satisfaction",
    source: "handwritten" as const
  },
  
  // Comprehensive real-world business scenarios
  {
    id: "FINANCIAL_CRISIS_001",
    version: 1,
    text: "Bank called today - we're dangerously close to our credit limit and customers are paying invoices slower than usual",
    expected_category: "Challenge" as const,
    expected_mood: "Worried",
    expected_energy: "low" as const,
    confidence_range: [90, 95] as [number, number],
    business_context: "Severe financial strain and working capital issues",
    source: "handwritten" as const
  },
  {
    id: "TECH_OUTAGE_001",
    version: 1,
    text: "Our entire platform went down for 4 hours during peak business time - lost thousands in potential revenue",
    expected_category: "Challenge" as const,
    expected_mood: "Frustrated",
    expected_energy: "medium" as const,
    confidence_range: [88, 94] as [number, number],
    business_context: "Technical infrastructure failure with business impact",
    source: "handwritten" as const
  },
  {
    id: "CUSTOMER_CHURN_001",
    version: 1,
    text: "Three major clients canceled their contracts this week citing budget cuts - this hits our quarterly numbers hard",
    expected_category: "Challenge" as const,
    expected_mood: "Devastated",
    expected_energy: "low" as const,
    confidence_range: [85, 92] as [number, number],
    business_context: "Significant customer loss affecting revenue projections",
    source: "handwritten" as const
  },
  {
    id: "TALENT_LOSS_001",
    version: 1,
    text: "Our head of engineering just resigned and took two senior developers with him to a competitor",
    expected_category: "Challenge" as const,
    expected_mood: "Shocked",
    expected_energy: "low" as const,
    confidence_range: [87, 93] as [number, number],
    business_context: "Critical talent departure affecting team stability",
    source: "handwritten" as const
  },
  {
    id: "REGULATORY_ISSUE_001",
    version: 1,
    text: "Compliance audit revealed several issues that need immediate attention or we risk losing our operating license",
    expected_category: "Challenge" as const,
    expected_mood: "Anxious",
    expected_energy: "medium" as const,
    confidence_range: [85, 91] as [number, number],
    business_context: "Regulatory compliance threats to business operations",
    source: "handwritten" as const
  },
  {
    id: "FUNDING_SUCCESS_001",
    version: 1,
    text: "Just closed our Series B round - $15M from top-tier VCs who really believe in our vision",
    expected_category: "Growth" as const,
    expected_mood: "Elated",
    expected_energy: "high" as const,
    confidence_range: [92, 97] as [number, number],
    business_context: "Major funding milestone enabling significant expansion",
    source: "handwritten" as const
  },
  {
    id: "MARKET_EXPANSION_001",
    version: 1,
    text: "Signed our first enterprise client in Europe - this opens up an entirely new market for us",
    expected_category: "Growth" as const,
    expected_mood: "Thrilled",
    expected_energy: "high" as const,
    confidence_range: [89, 95] as [number, number],
    business_context: "International expansion and enterprise market entry",
    source: "handwritten" as const
  },
  {
    id: "VIRAL_GROWTH_001",
    version: 1,
    text: "Our latest feature went viral on social media - user signups increased by 400% in just three days",
    expected_category: "Growth" as const,
    expected_mood: "Amazed",
    expected_energy: "high" as const,
    confidence_range: [90, 96] as [number, number],
    business_context: "Unexpected viral marketing success driving rapid user acquisition",
    source: "handwritten" as const
  },
  {
    id: "PARTNERSHIP_WIN_001",
    version: 1,
    text: "Microsoft wants to integrate our solution into their platform - this could be game-changing for distribution",
    expected_category: "Growth" as const,
    expected_mood: "Excited",
    expected_energy: "high" as const,
    confidence_range: [88, 94] as [number, number],
    business_context: "Strategic partnership with major tech company",
    source: "handwritten" as const
  },
  {
    id: "IPO_MILESTONE_001",
    version: 1,
    text: "Board approved moving forward with IPO preparations - we've come so far from the garage startup days",
    expected_category: "Achievement" as const,
    expected_mood: "Proud",
    expected_energy: "high" as const,
    confidence_range: [90, 95] as [number, number],
    business_context: "Major corporate milestone and exit strategy advancement",
    source: "handwritten" as const
  },
  {
    id: "INDUSTRY_AWARD_001",
    version: 1,
    text: "Won Innovation of the Year at the industry conference - finally getting recognition for our groundbreaking work",
    expected_category: "Achievement" as const,
    expected_mood: "Accomplished",
    expected_energy: "high" as const,
    confidence_range: [87, 93] as [number, number],
    business_context: "Industry recognition and competitive differentiation",
    source: "handwritten" as const
  },
  {
    id: "PATENT_APPROVAL_001",
    version: 1,
    text: "Our core technology patent was approved after two years - this gives us real competitive protection",
    expected_category: "Achievement" as const,
    expected_mood: "Relieved",
    expected_energy: "medium" as const,
    confidence_range: [85, 91] as [number, number],
    business_context: "Intellectual property protection and competitive moats",
    source: "handwritten" as const
  },
  {
    id: "CERTIFICATION_SUCCESS_001",
    version: 1,
    text: "Passed SOC 2 compliance audit on first attempt - months of preparation finally paid off",
    expected_category: "Achievement" as const,
    expected_mood: "Accomplished",
    expected_energy: "medium" as const,
    confidence_range: [83, 89] as [number, number],
    business_context: "Operational excellence and enterprise readiness",
    source: "handwritten" as const
  },
  {
    id: "STRATEGIC_PLANNING_001",
    version: 1,
    text: "Spent the weekend creating our 3-year strategic plan and mapping out key initiatives for each quarter",
    expected_category: "Planning" as const,
    expected_mood: "Focused",
    expected_energy: "medium" as const,
    confidence_range: [80, 87] as [number, number],
    business_context: "Long-term strategic vision and operational roadmap",
    source: "handwritten" as const
  },
  {
    id: "BUDGET_PLANNING_001",
    version: 1,
    text: "Working through next year's budget allocations and deciding where to invest for maximum growth impact",
    expected_category: "Planning" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [78, 85] as [number, number],
    business_context: "Financial planning and resource optimization",
    source: "handwritten" as const
  },
  {
    id: "HIRING_STRATEGY_001",
    version: 1,
    text: "Designing our talent acquisition strategy for scaling from 20 to 100 employees over the next 18 months",
    expected_category: "Planning" as const,
    expected_mood: "Strategic",
    expected_energy: "medium" as const,
    confidence_range: [79, 86] as [number, number],
    business_context: "Workforce planning and organizational scaling",
    source: "handwritten" as const
  },
  {
    id: "PRODUCT_ROADMAP_001",
    version: 1,
    text: "Finalizing our product roadmap based on customer feedback and competitive analysis from the past quarter",
    expected_category: "Planning" as const,
    expected_mood: "Methodical",
    expected_energy: "medium" as const,
    confidence_range: [81, 88] as [number, number],
    business_context: "Product strategy and development prioritization",
    source: "handwritten" as const
  },
  {
    id: "COMPETITIVE_ANALYSIS_001",
    version: 1,
    text: "Deep diving into what our competitors are doing and identifying gaps we can exploit in the market",
    expected_category: "Research" as const,
    expected_mood: "Curious",
    expected_energy: "medium" as const,
    confidence_range: [80, 87] as [number, number],
    business_context: "Market intelligence and competitive positioning",
    source: "handwritten" as const
  },
  {
    id: "CUSTOMER_RESEARCH_001",
    version: 1,
    text: "Conducted 15 customer interviews this week to understand why some users aren't converting to paid plans",
    expected_category: "Research" as const,
    expected_mood: "Investigative",
    expected_energy: "medium" as const,
    confidence_range: [82, 89] as [number, number],
    business_context: "Customer behavior analysis and conversion optimization",
    source: "handwritten" as const
  },
  {
    id: "MARKET_SIZING_001",
    version: 1,
    text: "Analyzing TAM and SAM data to validate our expansion strategy into adjacent market segments",
    expected_category: "Research" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [78, 85] as [number, number],
    business_context: "Market opportunity assessment and growth strategy validation",
    source: "handwritten" as const
  },
  {
    id: "USER_TESTING_001",
    version: 1,
    text: "Running A/B tests on our new onboarding flow to improve user activation rates",
    expected_category: "Research" as const,
    expected_mood: "Experimental",
    expected_energy: "medium" as const,
    confidence_range: [79, 86] as [number, number],
    business_context: "Product optimization and user experience improvement",
    source: "handwritten" as const
  },
  {
    id: "LEARNING_CONFERENCE_001",
    version: 1,
    text: "Attending TechCrunch Disrupt this week to learn about emerging trends and network with other founders",
    expected_category: "Learning" as const,
    expected_mood: "Curious",
    expected_energy: "medium" as const,
    confidence_range: [75, 83] as [number, number],
    business_context: "Industry learning and professional networking",
    source: "handwritten" as const
  },
  {
    id: "SKILL_DEVELOPMENT_001",
    version: 1,
    text: "Taking an executive coaching course to improve my leadership skills as we scale the team",
    expected_category: "Learning" as const,
    expected_mood: "Thoughtful",
    expected_energy: "medium" as const,
    confidence_range: [74, 82] as [number, number],
    business_context: "Leadership development and personal growth",
    source: "handwritten" as const
  },
  {
    id: "MENTOR_SESSION_001",
    version: 1,
    text: "Had a breakthrough conversation with my mentor about scaling challenges and building sustainable systems",
    expected_category: "Learning" as const,
    expected_mood: "Enlightened",
    expected_energy: "medium" as const,
    confidence_range: [76, 84] as [number, number],
    business_context: "Mentorship and strategic guidance",
    source: "handwritten" as const
  },
  {
    id: "BOOK_INSIGHTS_001",
    version: 1,
    text: "Reading 'Blitzscaling' and getting valuable insights about when and how to prioritize growth over efficiency",
    expected_category: "Learning" as const,
    expected_mood: "Inspired",
    expected_energy: "medium" as const,
    confidence_range: [73, 81] as [number, number],
    business_context: "Business education and strategic learning",
    source: "handwritten" as const
  },
  {
    id: "PLANNING_001",
    version: 1,
    text: "Working on our strategic roadmap for next quarter and evaluating different growth opportunities",
    expected_category: "Planning" as const,
    expected_mood: "thoughtful",
    expected_energy: "medium" as const,
    confidence_range: [75, 85] as [number, number],
    business_context: "Strategic planning and opportunity assessment",
    source: "handwritten" as const
  },
  {
    id: "LEARNING_001",
    version: 1,
    text: "Discovered some valuable insights from customer interviews that will shape our product development",
    expected_category: "Learning" as const,
    expected_mood: "curious",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Customer research and product insights",
    source: "handwritten" as const
  }
];