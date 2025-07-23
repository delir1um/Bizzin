// AI-powered intelligent prompt generation for business journaling
import type { JournalEntry } from '@/types/journal'
import type { Goal } from '@/types/goals'

export interface SmartPrompt {
  id: string
  question: string
  followUp?: string
  category: 'contextual' | 'goal-focused' | 'mood-based' | 'strategic' | 'reflection'
  reasoning: string // Why this prompt was chosen
  depth: 'quick' | 'medium' | 'deep'
  tags: string[]
}

export interface PromptContext {
  recentEntries: JournalEntry[]
  activeGoals: Goal[]
  currentMood?: string
  businessPhase?: 'startup' | 'growth' | 'scaling' | 'pivot'
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
  availableTime?: 'quick' | 'medium' | 'extended'
}

// Analyze recent entries to understand current business context
function analyzeBusinessContext(entries: JournalEntry[]): {
  dominantMood: string
  recentChallenges: string[]
  recentWins: string[]
  businessPhase: string
  stressLevel: 'low' | 'medium' | 'high'
} {
  if (!entries.length) {
    return {
      dominantMood: 'neutral',
      recentChallenges: [],
      recentWins: [],
      businessPhase: 'startup',
      stressLevel: 'medium'
    }
  }

  // Get last 5 entries for context
  const recentEntries = entries.slice(0, 5)
  
  // Analyze dominant mood
  const moods = recentEntries
    .map(entry => entry.sentiment_data?.primary_mood)
    .filter((mood): mood is string => Boolean(mood))
  
  const moodCounts = moods.reduce((acc: Record<string, number>, mood) => {
    acc[mood] = (acc[mood] || 0) + 1
    return acc
  }, {})
  
  const dominantMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'reflective'

  // Extract challenges and wins from content
  const combinedContent = recentEntries
    .map(entry => `${entry.title} ${entry.content}`)
    .join(' ')
    .toLowerCase()

  const challengeKeywords = ['problem', 'issue', 'difficult', 'struggle', 'stuck', 'failed', 'mistake', 'obstacle', 'setback']
  const winKeywords = ['success', 'achieved', 'completed', 'breakthrough', 'win', 'accomplished', 'milestone', 'progress', 'growth']
  const businessPhaseKeywords = {
    startup: ['idea', 'launch', 'mvp', 'prototype', 'validation', 'first customer'],
    growth: ['scaling', 'hiring', 'revenue', 'customers', 'market', 'expansion'],
    scaling: ['team', 'processes', 'systems', 'automation', 'delegation', 'operations'],
    pivot: ['pivot', 'change', 'direction', 'strategy', 'model', 'approach']
  }

  const recentChallenges = challengeKeywords.filter(keyword => 
    combinedContent.includes(keyword)
  ).slice(0, 3)

  const recentWins = winKeywords.filter(keyword => 
    combinedContent.includes(keyword)
  ).slice(0, 3)

  // Determine business phase
  let businessPhase = 'startup'
  let maxPhaseScore = 0
  
  Object.entries(businessPhaseKeywords).forEach(([phase, keywords]) => {
    const score = keywords.reduce((sum, keyword) => 
      sum + (combinedContent.match(new RegExp(keyword, 'g'))?.length || 0), 0
    )
    if (score > maxPhaseScore) {
      maxPhaseScore = score
      businessPhase = phase
    }
  })

  // Determine stress level
  const stressKeywords = ['stress', 'overwhelm', 'pressure', 'deadline', 'urgent', 'crisis']
  const stressScore = stressKeywords.reduce((sum, keyword) => 
    sum + (combinedContent.match(new RegExp(keyword, 'g'))?.length || 0), 0
  )
  
  const stressLevel = stressScore > 3 ? 'high' : stressScore > 1 ? 'medium' : 'low'

  return {
    dominantMood,
    recentChallenges,
    recentWins,
    businessPhase,
    stressLevel
  }
}

// Generate contextual prompts based on analysis
function generateContextualPrompts(context: PromptContext): SmartPrompt[] {
  const analysis = analyzeBusinessContext(context.recentEntries)
  const prompts: SmartPrompt[] = []

  // Mood-based prompts
  if (analysis.dominantMood === 'frustrated' || analysis.stressLevel === 'high') {
    prompts.push({
      id: 'stress-management',
      question: 'What specific challenge is consuming most of your mental energy right now, and what would resolving it unlock for your business?',
      followUp: 'What one small step could you take today to make progress on this?',
      category: 'mood-based',
      reasoning: 'Detected high stress/frustration - helping process and find actionable solutions',
      depth: 'deep',
      tags: ['stress-management', 'problem-solving', 'action-planning']
    })
  }

  if (analysis.dominantMood === 'accomplished' || analysis.recentWins.length > 0) {
    prompts.push({
      id: 'success-amplification',
      question: 'What recent win are you most proud of, and what does it reveal about your strengths as a business owner?',
      followUp: 'How can you apply these same strengths to your current challenges?',
      category: 'mood-based',
      reasoning: 'Recent wins detected - amplifying positive momentum and extracting learnings',
      depth: 'medium',
      tags: ['success-analysis', 'strength-identification', 'momentum']
    })
  }

  // Goal-focused prompts
  if (context.activeGoals.length > 0) {
    const mostRecentGoal = context.activeGoals[0]
    prompts.push({
      id: 'goal-progress-check',
      question: `What progress have you made on "${mostRecentGoal.title}" this week, and what obstacles are you discovering?`,
      followUp: 'What would need to be true for you to make faster progress?',
      category: 'goal-focused',
      reasoning: `Connecting to active goal: ${mostRecentGoal.title}`,
      depth: 'medium',
      tags: ['goal-progress', 'obstacle-identification', 'acceleration']
    })
  }

  // Business phase-specific prompts
  switch (analysis.businessPhase) {
    case 'startup':
      prompts.push({
        id: 'validation-focus',
        question: 'What did you learn about your customers or market this week that surprised you?',
        followUp: 'How will this insight change your next steps?',
        category: 'strategic',
        reasoning: 'Startup phase detected - focusing on customer learning and validation',
        depth: 'medium',
        tags: ['customer-learning', 'market-validation', 'insights']
      })
      break
    
    case 'growth':
      prompts.push({
        id: 'scaling-readiness',
        question: 'What systems or processes are starting to break as you grow, and which one needs attention first?',
        followUp: 'What would the ideal solution look like?',
        category: 'strategic',
        reasoning: 'Growth phase detected - focusing on systems and scalability',
        depth: 'deep',
        tags: ['systems-thinking', 'scalability', 'operations']
      })
      break
    
    case 'scaling':
      prompts.push({
        id: 'delegation-mastery',
        question: 'What important task are you still doing yourself that someone else could handle?',
        followUp: 'What fears or concerns are holding you back from delegating this?',
        category: 'strategic',
        reasoning: 'Scaling phase detected - focusing on delegation and leadership',
        depth: 'deep',
        tags: ['delegation', 'leadership', 'time-management']
      })
      break
  }

  // Time-of-day optimized prompts
  const currentHour = new Date().getHours()
  if (currentHour < 12) { // Morning
    prompts.push({
      id: 'morning-intention',
      question: 'What one outcome would make today feel like a success for your business?',
      followUp: 'What might try to derail this focus, and how will you handle it?',
      category: 'contextual',
      reasoning: 'Morning detected - setting clear daily intentions',
      depth: 'quick',
      tags: ['daily-planning', 'intention-setting', 'focus']
    })
  } else if (currentHour > 17) { // Evening
    prompts.push({
      id: 'evening-reflection',
      question: 'What moment today revealed something important about your business or leadership style?',
      followUp: 'How will you build on this insight tomorrow?',
      category: 'reflection',
      reasoning: 'Evening detected - processing daily learnings',
      depth: 'medium',
      tags: ['daily-reflection', 'leadership-growth', 'learning']
    })
  }

  // Challenge-specific prompts
  if (analysis.recentChallenges.length > 0) {
    prompts.push({
      id: 'challenge-reframe',
      question: 'What current business challenge might actually be an opportunity in disguise?',
      followUp: 'Who else has faced this challenge successfully, and what can you learn from them?',
      category: 'strategic',
      reasoning: 'Recent challenges detected - reframing perspective and seeking solutions',
      depth: 'deep',
      tags: ['reframing', 'opportunity-spotting', 'learning-from-others']
    })
  }

  // Default strategic prompt if no specific context
  if (prompts.length === 0) {
    prompts.push({
      id: 'strategic-clarity',
      question: 'If you could only focus on three things next month to move your business forward, what would they be?',
      followUp: 'What would you need to stop doing to make room for these priorities?',
      category: 'strategic',
      reasoning: 'No specific context - focusing on strategic clarity and prioritization',
      depth: 'medium',
      tags: ['strategic-planning', 'prioritization', 'focus']
    })
  }

  return prompts
}

// Main function to get smart prompts
export function generateSmartPrompts(context: PromptContext): SmartPrompt[] {
  const contextualPrompts = generateContextualPrompts(context)
  
  // Sort by relevance and depth preference
  return contextualPrompts
    .sort((a, b) => {
      // Prioritize goal-focused and mood-based prompts
      const priorityOrder = { 'goal-focused': 0, 'mood-based': 1, 'strategic': 2, 'contextual': 3, 'reflection': 4 }
      return (priorityOrder[a.category] || 5) - (priorityOrder[b.category] || 5)
    })
    .slice(0, 3) // Return top 3 most relevant prompts
}

// Get single best prompt for quick access
export function getBestPrompt(context: PromptContext): SmartPrompt {
  const prompts = generateSmartPrompts(context)
  return prompts[0] || {
    id: 'default',
    question: 'What insight about your business came to you today that you want to remember?',
    category: 'reflection',
    reasoning: 'Default reflection prompt',
    depth: 'medium',
    tags: ['insight', 'business-learning', 'memory']
  }
}

// Quick morning/evening optimized prompts
export function getTimeOptimizedPrompt(): SmartPrompt {
  const hour = new Date().getHours()
  
  if (hour < 12) {
    return {
      id: 'morning-energy',
      question: 'What opportunity are you most excited to pursue today?',
      followUp: 'What might hold you back, and how will you overcome it?',
      category: 'contextual',
      reasoning: 'Morning energy optimization',
      depth: 'quick',
      tags: ['morning-planning', 'opportunity', 'obstacle-prevention']
    }
  } else if (hour > 17) {
    return {
      id: 'evening-wisdom',
      question: 'What did you learn about yourself as a leader today?',
      followUp: 'How will you apply this insight going forward?',
      category: 'reflection',
      reasoning: 'Evening reflection and learning',
      depth: 'medium',
      tags: ['leadership-growth', 'self-awareness', 'application']
    }
  } else {
    return {
      id: 'midday-momentum',
      question: 'What momentum are you building right now that excites you most?',
      followUp: 'What would accelerate this momentum even further?',
      category: 'strategic',
      reasoning: 'Midday momentum check',
      depth: 'medium',
      tags: ['momentum', 'acceleration', 'strategic-thinking']
    }
  }
}