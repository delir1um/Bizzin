// Business-focused reflection prompts for entrepreneurs
export interface ReflectionPrompt {
  id: string
  category: 'daily' | 'weekly' | 'monthly' | 'challenge' | 'success' | 'strategy'
  question: string
  followUp?: string
  tags: string[]
}

export const reflectionPrompts: ReflectionPrompt[] = [
  // Daily Reflection Prompts
  {
    id: 'daily-01',
    category: 'daily',
    question: 'What was your biggest win today, no matter how small?',
    followUp: 'How can you build on this success tomorrow?',
    tags: ['progress', 'wins', 'momentum']
  },
  {
    id: 'daily-02',
    category: 'daily',
    question: 'What obstacle did you overcome today?',
    followUp: 'What did this teach you about your resilience?',
    tags: ['challenges', 'growth', 'problem-solving']
  },
  {
    id: 'daily-03',
    category: 'daily',
    question: 'What decision are you most proud of today?',
    followUp: 'What factors led you to make this choice?',
    tags: ['decision-making', 'leadership', 'confidence']
  },
  {
    id: 'daily-04',
    category: 'daily',
    question: 'How did you move your business forward today?',
    followUp: 'Which actions had the most impact?',
    tags: ['progress', 'impact', 'execution']
  },
  {
    id: 'daily-05',
    category: 'daily',
    question: 'What did you learn about your customers or market today?',
    followUp: 'How will this insight change your approach?',
    tags: ['learning', 'customers', 'market-research']
  },

  // Weekly Reflection Prompts
  {
    id: 'weekly-01',
    category: 'weekly',
    question: 'Looking at this week, what pattern do you notice in your energy levels?',
    followUp: 'When are you most productive and creative?',
    tags: ['energy', 'productivity', 'self-awareness']
  },
  {
    id: 'weekly-02',
    category: 'weekly',
    question: 'What relationship (customer, partner, team member) grew stronger this week?',
    followUp: 'What actions contributed to this growth?',
    tags: ['relationships', 'networking', 'team']
  },
  {
    id: 'weekly-03',
    category: 'weekly',
    question: 'Which of your business goals made the most progress this week?',
    followUp: 'What specific actions drove this progress?',
    tags: ['goals', 'progress', 'strategy']
  },

  // Challenge-focused prompts
  {
    id: 'challenge-01',
    category: 'challenge',
    question: 'What\'s the biggest challenge you\'re avoiding right now?',
    followUp: 'What\'s one small step you could take toward addressing it?',
    tags: ['challenges', 'avoidance', 'courage']
  },
  {
    id: 'challenge-02',
    category: 'challenge',
    question: 'When you think about your biggest business fear, what comes up?',
    followUp: 'How might this fear be protecting you, and how might it be limiting you?',
    tags: ['fears', 'mindset', 'growth']
  },
  {
    id: 'challenge-03',
    category: 'challenge',
    question: 'What skill do you wish you had right now?',
    followUp: 'What\'s one way you could start developing it this week?',
    tags: ['skills', 'development', 'learning']
  },

  // Success-focused prompts
  {
    id: 'success-01',
    category: 'success',
    question: 'What\'s working really well in your business right now?',
    followUp: 'How can you do more of what\'s working?',
    tags: ['success', 'strengths', 'optimization']
  },
  {
    id: 'success-02',
    category: 'success',
    question: 'When did you feel most confident as a business owner recently?',
    followUp: 'What circumstances created that confidence?',
    tags: ['confidence', 'leadership', 'mindset']
  },
  {
    id: 'success-03',
    category: 'success',
    question: 'What compliment or positive feedback did you receive recently?',
    followUp: 'What does this tell you about your unique value?',
    tags: ['feedback', 'value-proposition', 'strengths']
  },

  // Strategic prompts
  {
    id: 'strategy-01',
    category: 'strategy',
    question: 'If you could only focus on three things next month, what would they be?',
    followUp: 'What would you need to stop doing to make room for these priorities?',
    tags: ['priorities', 'focus', 'strategy']
  },
  {
    id: 'strategy-02',
    category: 'strategy',
    question: 'What opportunity are you most excited about right now?',
    followUp: 'What\'s your next step to pursue it?',
    tags: ['opportunities', 'excitement', 'action']
  },
  {
    id: 'strategy-03',
    category: 'strategy',
    question: 'How has your vision for your business evolved recently?',
    followUp: 'What experiences or insights sparked this evolution?',
    tags: ['vision', 'evolution', 'growth']
  }
]

// Helper functions
export const getRandomPrompt = (category?: ReflectionPrompt['category']): ReflectionPrompt => {
  const filteredPrompts = category 
    ? reflectionPrompts.filter(p => p.category === category)
    : reflectionPrompts
  
  const randomIndex = Math.floor(Math.random() * filteredPrompts.length)
  return filteredPrompts[randomIndex]
}

export const getDailyPrompt = (): ReflectionPrompt => {
  // Get a consistent daily prompt based on the day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  const dailyPrompts = reflectionPrompts.filter(p => p.category === 'daily')
  return dailyPrompts[dayOfYear % dailyPrompts.length]
}

export const getPromptsByCategory = (category: ReflectionPrompt['category']): ReflectionPrompt[] => {
  return reflectionPrompts.filter(p => p.category === category)
}

export const getPromptsWithTag = (tag: string): ReflectionPrompt[] => {
  return reflectionPrompts.filter(p => p.tags.includes(tag))
}