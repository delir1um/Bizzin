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

// Comprehensive training data covering all real-world business scenarios (73 examples from blueprint)
export const BUSINESS_JOURNAL_TRAINING_DATA = [
  // GROWTH scenarios (12 examples)
  {
    id: "GROWTH_001",
    version: 1,
    text: "We onboarded three enterprise clients this week; MRR crossed R300k and momentum feels real.",
    expected_category: "Growth" as const,
    expected_mood: "Excited",
    expected_energy: "high" as const,
    confidence_range: [90, 95] as [number, number],
    business_context: "Enterprise sales traction increasing recurring revenue",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_002",
    version: 1,
    text: "Foot traffic at the pop-up in Cape Town CBD doubled after the influencer collab.",
    expected_category: "Growth" as const,
    expected_mood: "Optimistic",
    expected_energy: "high" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Retail activation success driving demand",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_003",
    version: 1,
    text: "First international shipment to Namibia arrived without issues; exploring SADC expansion.",
    expected_category: "Growth" as const,
    expected_mood: "Confident",
    expected_energy: "high" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Regional market entry via cross-border logistics",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_004",
    version: 1,
    text: "Upsell campaign lifted ARPU by 14% — strong response from legacy customers.",
    expected_category: "Growth" as const,
    expected_mood: "Pleased",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Monetisation uplift via targeted upsells",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_005",
    version: 1,
    text: "Our API partnership with a fintech aggregator opened a new channel for leads.",
    expected_category: "Growth" as const,
    expected_mood: "Energised",
    expected_energy: "high" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Channel partnership expanding top of funnel",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_006",
    version: 1,
    text: "Organic search impressions are up 60% after the new content cluster on DocSafe.",
    expected_category: "Growth" as const,
    expected_mood: "Encouraged",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "SEO content strategy compounding traffic",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_007",
    version: 1,
    text: "We piloted a reseller programme with two accounting firms; early signs are promising.",
    expected_category: "Growth" as const,
    expected_mood: "Hopeful",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "B2B reseller motion to scale distribution",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_008",
    version: 1,
    text: "Paid social finally hit a sustainable CAC:LTV ratio after creative refresh.",
    expected_category: "Growth" as const,
    expected_mood: "Relieved",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Performance marketing efficiency restored",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_009",
    version: 1,
    text: "Webinar registrations exceeded 500; strong interest from SMEs in KZN and Gauteng.",
    expected_category: "Growth" as const,
    expected_mood: "Excited",
    expected_energy: "high" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Demand generation via educational webinars",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_010",
    version: 1,
    text: "Churn fell from 5.1% to 3.4% after onboarding tweaks.",
    expected_category: "Growth" as const,
    expected_mood: "Optimistic",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Retention improvement via onboarding changes",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_011",
    version: 1,
    text: "Launched a student pricing tier; signups picked up on Friday paydays.",
    expected_category: "Growth" as const,
    expected_mood: "Curious",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Pricing experimentation opening new segment",
    source: "blueprint" as const
  },
  {
    id: "GROWTH_012",
    version: 1,
    text: "Marketplace listing drove steady weekly trials; conversion holding at 19%.",
    expected_category: "Growth" as const,
    expected_mood: "Positive",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Third-party marketplace distribution working",
    source: "blueprint" as const
  },

  // CHALLENGE scenarios (12 examples)
  {
    id: "CHALLENGE_001",
    version: 1,
    text: "Load shedding during peak hours hurt our live training session; several attendees dropped.",
    expected_category: "Challenge" as const,
    expected_mood: "Frustrated",
    expected_energy: "medium" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Operational disruption due to power outages",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_002",
    version: 1,
    text: "Cash flow is tight; delaying my own draw to make payroll this month.",
    expected_category: "Challenge" as const,
    expected_mood: "Stressed",
    expected_energy: "low" as const,
    confidence_range: [90, 95] as [number, number],
    business_context: "Liquidity crunch affecting founder remuneration",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_003",
    version: 1,
    text: "Key engineer resigned unexpectedly; recruiting replacement is urgent.",
    expected_category: "Challenge" as const,
    expected_mood: "Overwhelmed",
    expected_energy: "low" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Staffing gap creating delivery risk",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_004",
    version: 1,
    text: "A client raised a POPIA concern about DocSafe sharing links — need to update our policy copy.",
    expected_category: "Challenge" as const,
    expected_mood: "Concerned",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Regulatory/compliance question from customer",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_005",
    version: 1,
    text: "Supplier pushed our hardware delivery out by two weeks; risk to KZN rollout.",
    expected_category: "Challenge" as const,
    expected_mood: "Anxious",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Supply chain delay impacts deployment",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_006",
    version: 1,
    text: "Incident: API outage for 47 minutes — root cause traced to misconfigured cache invalidation.",
    expected_category: "Challenge" as const,
    expected_mood: "Determined",
    expected_energy: "medium" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Production reliability issue under investigation",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_007",
    version: 1,
    text: "Two chargebacks came through; unclear if fraud or misunderstanding.",
    expected_category: "Challenge" as const,
    expected_mood: "Worried",
    expected_energy: "low" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Payments risk and reconciliation burden",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_008",
    version: 1,
    text: "Competitor undercut our pricing with a limited-time offer; sales pipeline hesitating.",
    expected_category: "Challenge" as const,
    expected_mood: "Uneasy",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Competitive pressure affecting conversions",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_009",
    version: 1,
    text: "Not happy with our NPS trend — responses dipped after we changed support hours.",
    expected_category: "Challenge" as const,
    expected_mood: "Disappointed",
    expected_energy: "low" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Customer satisfaction drop linked to service change",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_010",
    version: 1,
    text: "Board meeting was tense; targets missed in Q2 and questions were pointed.",
    expected_category: "Challenge" as const,
    expected_mood: "Pressured",
    expected_energy: "low" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Governance pressure after underperformance",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_011",
    version: 1,
    text: "We discovered duplicate records in the CRM; reporting is unreliable until fixed.",
    expected_category: "Challenge" as const,
    expected_mood: "Irritated",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Data quality issue compromising analytics",
    source: "blueprint" as const
  },
  {
    id: "CHALLENGE_012",
    version: 1,
    text: "Customs held our demo units at OR Tambo; training schedule at risk.",
    expected_category: "Challenge" as const,
    expected_mood: "Frustrated",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Logistics/cross-border clearance delays",
    source: "blueprint" as const
  },

  // ACHIEVEMENT scenarios (12 examples)  
  {
    id: "ACHIEVEMENT_001",
    version: 1,
    text: "Hit break-even this month — quietly proud of the team for pushing through.",
    expected_category: "Achievement" as const,
    expected_mood: "Proud",
    expected_energy: "medium" as const,
    confidence_range: [90, 95] as [number, number],
    business_context: "Financial milestone achieving sustainability",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_002",
    version: 1,
    text: "Launched the new onboarding flow; activation rate jumped 18% in week one.",
    expected_category: "Achievement" as const,
    expected_mood: "Accomplished",
    expected_energy: "high" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Product milestone with measurable impact",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_003",
    version: 1,
    text: "Secured our first university client after a thorough security review.",
    expected_category: "Achievement" as const,
    expected_mood: "Validated",
    expected_energy: "high" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Enterprise trust milestone following infosec checks",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_004",
    version: 1,
    text: "Our Women's Day campaign exceeded engagement targets by 2x.",
    expected_category: "Achievement" as const,
    expected_mood: "Delighted",
    expected_energy: "high" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Marketing campaign outperformed expectations",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_005",
    version: 1,
    text: "Closed a multi-year agreement with a national distributor.",
    expected_category: "Achievement" as const,
    expected_mood: "Triumphant",
    expected_energy: "high" as const,
    confidence_range: [90, 95] as [number, number],
    business_context: "Strategic partnership securing long-term revenue",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_006",
    version: 1,
    text: "Recognised as a top startup in the Western Cape tech awards.",
    expected_category: "Achievement" as const,
    expected_mood: "Grateful",
    expected_energy: "high" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "External recognition boosting credibility",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_007",
    version: 1,
    text: "Shipped accessibility improvements and received heartfelt user feedback.",
    expected_category: "Achievement" as const,
    expected_mood: "Moved",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Inclusive design win increasing usability",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_008",
    version: 1,
    text: "Customer success playbook reduced escalations by 40%.",
    expected_category: "Achievement" as const,
    expected_mood: "Satisfied",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Operational excellence through process",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_009",
    version: 1,
    text: "Our first Cape Town office day with the whole team — morale is high.",
    expected_category: "Achievement" as const,
    expected_mood: "Happy",
    expected_energy: "high" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Culture milestone strengthening cohesion",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_010",
    version: 1,
    text: "Completed our first successful security audit with zero critical findings.",
    expected_category: "Achievement" as const,
    expected_mood: "Relieved",
    expected_energy: "high" as const,
    confidence_range: [85, 95] as [number, number],
    business_context: "Compliance milestone demonstrating maturity",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_011",
    version: 1,
    text: "The budget calculator passed QA and is live in BizBuilder Tools.",
    expected_category: "Achievement" as const,
    expected_mood: "Pleased",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Feature delivery expanding product value",
    source: "blueprint" as const
  },
  {
    id: "ACHIEVEMENT_012",
    version: 1,
    text: "Support response time now under 2 minutes on average.",
    expected_category: "Achievement" as const,
    expected_mood: "Proud",
    expected_energy: "high" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Service excellence improving user experience",
    source: "blueprint" as const
  },

  // PLANNING scenarios (12 examples)
  {
    id: "PLANNING_001",
    version: 1,
    text: "Drafting Q4 marketing plan focusing on webinars, SEO clusters, and partner co-marketing.",
    expected_category: "Planning" as const,
    expected_mood: "Organised",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Campaign planning for next quarter",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_002",
    version: 1,
    text: "Mapping a hiring plan: one full-stack dev, one data analyst, and a CS manager.",
    expected_category: "Planning" as const,
    expected_mood: "Focused",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Workforce planning aligned to growth",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_003",
    version: 1,
    text: "Creating a POPIA compliance roadmap with policy updates and staff training.",
    expected_category: "Planning" as const,
    expected_mood: "Methodical",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Regulatory alignment and internal governance",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_004",
    version: 1,
    text: "Scheduling a phased DocSafe migration to S3-compatible storage on R2.",
    expected_category: "Planning" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Infrastructure planning to reduce costs",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_005",
    version: 1,
    text: "Preparing investor update materials with revised KPIs and runway outlook.",
    expected_category: "Planning" as const,
    expected_mood: "Measured",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Stakeholder communications and fundraising hygiene",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_006",
    version: 1,
    text: "Setting quarterly OKRs to improve activation and reduce churn by 1.5pp.",
    expected_category: "Planning" as const,
    expected_mood: "Determined",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Outcome-driven planning with targets",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_007",
    version: 1,
    text: "Designing a coaching programme for SMEs using our Training library.",
    expected_category: "Planning" as const,
    expected_mood: "Constructive",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Programme design for customer enablement",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_008",
    version: 1,
    text: "Scoping a pilot for Afrikaans UI localisation across key views.",
    expected_category: "Planning" as const,
    expected_mood: "Optimistic",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Internationalisation planning for local market fit",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_009",
    version: 1,
    text: "Building a price test matrix for tiered plans including an annual discount.",
    expected_category: "Planning" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Pricing experiments for monetisation",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_010",
    version: 1,
    text: "Outlining a crisis comms plan for outages and security incidents.",
    expected_category: "Planning" as const,
    expected_mood: "Prepared",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Risk management and communication strategy",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_011",
    version: 1,
    text: "Creating a content calendar for LinkedIn thought leadership posts.",
    expected_category: "Planning" as const,
    expected_mood: "Organised",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Editorial planning to drive awareness",
    source: "blueprint" as const
  },
  {
    id: "PLANNING_012",
    version: 1,
    text: "Drafting requirements for an in-app referral programme with rewards.",
    expected_category: "Planning" as const,
    expected_mood: "Practical",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Growth loop planning to encourage virality",
    source: "blueprint" as const
  },

  // LEARNING scenarios (12 examples)
  {
    id: "LEARNING_001",
    version: 1,
    text: "Customer interviews revealed our trial is too short for SMEs to see value.",
    expected_category: "Learning" as const,
    expected_mood: "Reflective",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Voice of customer insights driving change",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_002",
    version: 1,
    text: "We learned that WhatsApp support is preferred over email for urgent issues.",
    expected_category: "Learning" as const,
    expected_mood: "Insightful",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Support channel preference discovery",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_003",
    version: 1,
    text: "Post-mortem: incident alerts were noisy; we need better thresholds and runbooks.",
    expected_category: "Learning" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Operational learning from outage",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_004",
    version: 1,
    text: "Realised our Afrikaans translations need a professional review to avoid ambiguity.",
    expected_category: "Learning" as const,
    expected_mood: "Thoughtful",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Localization quality improvements",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_005",
    version: 1,
    text: "Beta users struggled with DocSafe permissions — the UI labels are not clear.",
    expected_category: "Learning" as const,
    expected_mood: "Concerned",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Usability feedback informing redesign",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_006",
    version: 1,
    text: "A/B test showed shorter headlines lift CTR; long copy hurt conversions.",
    expected_category: "Learning" as const,
    expected_mood: "Curious",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Experimentation insights for marketing",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_007",
    version: 1,
    text: "We underestimated the accounting export need — bookkeepers need CSV + Xero.",
    expected_category: "Learning" as const,
    expected_mood: "Humbled",
    expected_energy: "low" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Feature gap identified via user roles",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_008",
    version: 1,
    text: "Churn analysis suggests onboarding emails arrive too late on Fridays.",
    expected_category: "Learning" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Lifecycle timing insight from cohort data",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_009",
    version: 1,
    text: "Found that SMEs prefer rands in pricing examples — dollars feel foreign.",
    expected_category: "Learning" as const,
    expected_mood: "Practical",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Localisation learning for SA audience",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_010",
    version: 1,
    text: "Our training videos load slowly on mobile data — compress and add captions.",
    expected_category: "Learning" as const,
    expected_mood: "Resolved",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Media optimisation learning",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_011",
    version: 1,
    text: "We tried removing the free tier; trial-to-paid rose but signups dipped — trade-off to weigh.",
    expected_category: "Learning" as const,
    expected_mood: "Balanced",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Pricing and funnel dynamics insight",
    source: "blueprint" as const
  },
  {
    id: "LEARNING_012",
    version: 1,
    text: "Sales calls taught us to avoid jargon; plain language boosts trust.",
    expected_category: "Learning" as const,
    expected_mood: "Encouraged",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Messaging clarity lesson",
    source: "blueprint" as const
  },

  // RESEARCH scenarios (12 examples)
  {
    id: "RESEARCH_001",
    version: 1,
    text: "Comparing cloud storage costs between R2 and S3 regions for POPIA-friendly setup.",
    expected_category: "Research" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Infrastructure cost and compliance study",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_002",
    version: 1,
    text: "Surveying SMEs about preferred invoicing tools to scope integrations.",
    expected_category: "Research" as const,
    expected_mood: "Curious",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Ecosystem mapping for product roadmap",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_003",
    version: 1,
    text: "Desk research on SARS tax bracket changes to update the estimator.",
    expected_category: "Research" as const,
    expected_mood: "Methodical",
    expected_energy: "medium" as const,
    confidence_range: [85, 90] as [number, number],
    business_context: "Regulatory data gathering for calculator",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_004",
    version: 1,
    text: "Studying competitor onboarding to benchmark time-to-value flows.",
    expected_category: "Research" as const,
    expected_mood: "Focused",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Competitive analysis of activation patterns",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_005",
    version: 1,
    text: "Analysing payment provider reliability and dispute rates for SA merchants.",
    expected_category: "Research" as const,
    expected_mood: "Investigative",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Vendor selection research",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_006",
    version: 1,
    text: "Running a pricing conjoint survey for tier packaging and features.",
    expected_category: "Research" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Quantitative research to inform pricing",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_007",
    version: 1,
    text: "Exploring voice-to-text APIs for journalling with mood detection.",
    expected_category: "Research" as const,
    expected_mood: "Exploratory",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Feasibility study for new capability",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_008",
    version: 1,
    text: "Collecting qualitative feedback on the Goals page from 15 users.",
    expected_category: "Research" as const,
    expected_mood: "Inquisitive",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Usability research via interviews",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_009",
    version: 1,
    text: "Heatmap analysis shows low interaction with the DocSafe sidebar icons.",
    expected_category: "Research" as const,
    expected_mood: "Curious",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Behavioural analytics diagnosing UX issues",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_010",
    version: 1,
    text: "Evaluating BI connectors to export metrics into Google Looker Studio.",
    expected_category: "Research" as const,
    expected_mood: "Analytical",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Reporting/BI integration research",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_011",
    version: 1,
    text: "Assessing market demand for coach/mentor workspaces in SA.",
    expected_category: "Research" as const,
    expected_mood: "Open-minded",
    expected_energy: "medium" as const,
    confidence_range: [80, 88] as [number, number],
    business_context: "Opportunity sizing for collaboration features",
    source: "blueprint" as const
  },
  {
    id: "RESEARCH_012",
    version: 1,
    text: "Investigating offline-first options for low-bandwidth regions.",
    expected_category: "Research" as const,
    expected_mood: "Pragmatic",
    expected_energy: "medium" as const,
    confidence_range: [80, 90] as [number, number],
    business_context: "Technical research for accessibility and reach",
    source: "blueprint" as const
  }
];