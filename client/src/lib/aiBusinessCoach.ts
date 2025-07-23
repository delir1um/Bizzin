// AI Business Coach - Memory & Learning System
import type { JournalEntry } from '@/types/journal'
import type { Goal } from '@/types/goals'

export interface BusinessContext {
  industry: string
  businessStage: 'idea' | 'startup' | 'growth' | 'scaling' | 'mature'
  businessType: 'b2b' | 'b2c' | 'marketplace' | 'saas' | 'ecommerce' | 'service' | 'other'
  teamSize: 'solo' | 'small' | 'medium' | 'large'
  keyAreas: string[] // e.g., ['marketing', 'product', 'sales', 'operations']
  currentChallenges: string[]
  recentWins: string[]
  writingStyle: 'analytical' | 'emotional' | 'strategic' | 'practical'
  reflectionDepth: 'surface' | 'moderate' | 'deep'
  preferredPromptTypes: string[]
  lastUpdated: string
}

export interface BusinessPattern {
  type: 'emotional' | 'strategic' | 'operational' | 'seasonal'
  pattern: string
  frequency: number
  confidence: number
  examples: string[]
  lastSeen: string
}

export interface CoachingInsight {
  type: 'trend' | 'opportunity' | 'warning' | 'celebration' | 'guidance'
  message: string
  confidence: number
  relevantEntries: string[]
  actionable: boolean
  urgency: 'low' | 'medium' | 'high'
  createdAt: string
}

export interface BusinessMemory {
  userId: string
  context: BusinessContext
  patterns: BusinessPattern[]
  insights: CoachingInsight[]
  entryCount: number
  lastAnalysis: string
}

export class AIBusinessCoach {
  private memory: BusinessMemory | null = null

  // Initialize or load existing business memory
  async initializeMemory(userId: string): Promise<void> {
    try {
      const stored = localStorage.getItem(`business_memory_${userId}`)
      if (stored) {
        this.memory = JSON.parse(stored)
      } else {
        this.memory = {
          userId,
          context: {
            industry: '',
            businessStage: 'startup',
            businessType: 'other',
            teamSize: 'solo',
            keyAreas: [],
            currentChallenges: [],
            recentWins: [],
            writingStyle: 'practical',
            reflectionDepth: 'moderate',
            preferredPromptTypes: [],
            lastUpdated: new Date().toISOString()
          },
          patterns: [],
          insights: [],
          entryCount: 0,
          lastAnalysis: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error initializing business memory:', error)
    }
  }

  // Analyze a new journal entry and update business memory
  async analyzeEntry(entry: JournalEntry): Promise<void> {
    if (!this.memory) return

    const content = `${entry.title} ${entry.content}`.toLowerCase()
    
    // Update entry count
    this.memory.entryCount++

    // Extract business context
    await this.extractBusinessContext(content, entry)
    
    // Identify patterns
    await this.identifyPatterns(content, entry)
    
    // Generate insights
    await this.generateInsights(entry)
    
    // Update timestamps
    this.memory.lastAnalysis = new Date().toISOString()
    this.memory.context.lastUpdated = new Date().toISOString()
    
    // Persist memory
    await this.saveMemory()
  }

  // Extract and update business context from entry content
  private async extractBusinessContext(content: string, entry: JournalEntry): Promise<void> {
    if (!this.memory) return

    const context = this.memory.context

    // Industry detection
    const industryKeywords = {
      'tech': ['software', 'app', 'platform', 'api', 'code', 'development', 'saas'],
      'ecommerce': ['store', 'products', 'inventory', 'shipping', 'orders', 'customers'],
      'consulting': ['client', 'consultation', 'advice', 'strategy', 'expertise'],
      'marketing': ['campaign', 'ads', 'content', 'social media', 'branding'],
      'finance': ['investment', 'funding', 'revenue', 'profit', 'financial'],
      'healthcare': ['patients', 'treatment', 'medical', 'health', 'wellness'],
      'education': ['students', 'learning', 'course', 'training', 'teaching'],
      'real estate': ['property', 'rent', 'lease', 'real estate', 'housing']
    }

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      const matches = keywords.filter(keyword => content.includes(keyword)).length
      if (matches > 2 && !context.industry) {
        context.industry = industry
      }
    }

    // Business stage detection
    const stageKeywords = {
      'idea': ['idea', 'concept', 'planning', 'brainstorm', 'research'],
      'startup': ['launch', 'mvp', 'first customer', 'prototype', 'validation'],
      'growth': ['scaling', 'hiring', 'expanding', 'revenue growth', 'market expansion'],
      'scaling': ['team management', 'processes', 'systems', 'automation', 'delegation'],
      'mature': ['optimization', 'efficiency', 'margins', 'competition', 'market leader']
    }

    for (const [stage, keywords] of Object.entries(stageKeywords)) {
      const matches = keywords.filter(keyword => content.includes(keyword)).length
      if (matches > 1) {
        context.businessStage = stage as BusinessContext['businessStage']
      }
    }

    // Team size detection
    if (content.includes('hired') || content.includes('team meeting') || content.includes('employees')) {
      if (content.includes('first hire') || content.includes('small team')) {
        context.teamSize = 'small'
      } else if (content.includes('management') || content.includes('departments')) {
        context.teamSize = 'medium'
      }
    }

    // Key areas identification
    const areaKeywords = {
      'marketing': ['marketing', 'advertising', 'promotion', 'brand', 'social media'],
      'sales': ['sales', 'customers', 'deals', 'prospects', 'conversion'],
      'product': ['product', 'features', 'development', 'user experience', 'design'],
      'operations': ['operations', 'processes', 'workflow', 'efficiency', 'logistics'],
      'finance': ['budget', 'costs', 'revenue', 'profit', 'funding', 'investment'],
      'hr': ['hiring', 'team', 'culture', 'employees', 'management', 'leadership']
    }

    for (const [area, keywords] of Object.entries(areaKeywords)) {
      const matches = keywords.filter(keyword => content.includes(keyword)).length
      if (matches > 1 && !context.keyAreas.includes(area)) {
        context.keyAreas.push(area)
      }
    }

    // Current challenges extraction
    const challengeIndicators = [
      'problem', 'issue', 'challenge', 'difficult', 'struggle', 'stuck', 
      'worried', 'concerned', 'frustrated', 'obstacle', 'barrier'
    ]
    
    const sentences = entry.content.split(/[.!?]+/)
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      if (challengeIndicators.some(indicator => lowerSentence.includes(indicator))) {
        const challenge = sentence.trim().slice(0, 100)
        if (challenge && !context.currentChallenges.some(c => c.includes(challenge.slice(0, 30)))) {
          context.currentChallenges.push(challenge)
          // Keep only recent challenges (max 5)
          if (context.currentChallenges.length > 5) {
            context.currentChallenges.shift()
          }
        }
      }
    }

    // Recent wins extraction
    const winIndicators = [
      'success', 'achieved', 'completed', 'won', 'breakthrough', 'milestone',
      'accomplished', 'excited', 'proud', 'great news', 'celebration'
    ]
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase()
      if (winIndicators.some(indicator => lowerSentence.includes(indicator))) {
        const win = sentence.trim().slice(0, 100)
        if (win && !context.recentWins.some(w => w.includes(win.slice(0, 30)))) {
          context.recentWins.push(win)
          // Keep only recent wins (max 5)
          if (context.recentWins.length > 5) {
            context.recentWins.shift()
          }
        }
      }
    }

    // Writing style analysis
    const analyticalWords = ['analyze', 'data', 'metrics', 'strategy', 'framework', 'systematic']
    const emotionalWords = ['feel', 'excited', 'frustrated', 'passionate', 'love', 'hate']
    const strategicWords = ['plan', 'vision', 'goal', 'objective', 'roadmap', 'future']
    const practicalWords = ['action', 'implement', 'execute', 'task', 'todo', 'next steps']

    const analyticalScore = analyticalWords.filter(word => content.includes(word)).length
    const emotionalScore = emotionalWords.filter(word => content.includes(word)).length
    const strategicScore = strategicWords.filter(word => content.includes(word)).length
    const practicalScore = practicalWords.filter(word => content.includes(word)).length

    const maxScore = Math.max(analyticalScore, emotionalScore, strategicScore, practicalScore)
    if (analyticalScore === maxScore) context.writingStyle = 'analytical'
    else if (emotionalScore === maxScore) context.writingStyle = 'emotional'
    else if (strategicScore === maxScore) context.writingStyle = 'strategic'
    else context.writingStyle = 'practical'

    // Reflection depth analysis
    const wordCount = entry.content.split(/\s+/).length
    const deepReflectionWords = ['because', 'realize', 'understand', 'learned', 'insight', 'reflection']
    const deepWords = deepReflectionWords.filter(word => content.includes(word)).length

    if (wordCount > 200 && deepWords > 2) {
      context.reflectionDepth = 'deep'
    } else if (wordCount > 50 && deepWords > 0) {
      context.reflectionDepth = 'moderate'
    } else {
      context.reflectionDepth = 'surface'
    }
  }

  // Identify patterns across entries
  private async identifyPatterns(content: string, entry: JournalEntry): Promise<void> {
    if (!this.memory) return

    // Emotional patterns
    const mood = entry.sentiment_data?.primary_mood
    if (mood) {
      const existingPattern = this.memory.patterns.find(p => p.type === 'emotional' && p.pattern === mood)
      if (existingPattern) {
        existingPattern.frequency++
        existingPattern.lastSeen = new Date().toISOString()
        existingPattern.confidence = Math.min(100, existingPattern.confidence + 5)
      } else {
        this.memory.patterns.push({
          type: 'emotional',
          pattern: mood,
          frequency: 1,
          confidence: 60,
          examples: [entry.title],
          lastSeen: new Date().toISOString()
        })
      }
    }

    // Strategic patterns (weekly/monthly cycles)
    const dayOfWeek = new Date(entry.created_at).getDay()
    const timePatterns = ['monday_planning', 'friday_review', 'weekend_reflection']
    
    if (dayOfWeek === 1 && content.includes('plan')) {
      this.updatePattern('strategic', 'monday_planning', entry.title)
    } else if (dayOfWeek === 5 && content.includes('review')) {
      this.updatePattern('strategic', 'friday_review', entry.title)
    }

    // Operational patterns
    if (content.includes('meeting') || content.includes('call')) {
      this.updatePattern('operational', 'frequent_meetings', entry.title)
    }
    if (content.includes('decision') || content.includes('choice')) {
      this.updatePattern('operational', 'decision_making', entry.title)
    }
  }

  // Helper method to update patterns
  private updatePattern(type: BusinessPattern['type'], pattern: string, example: string): void {
    if (!this.memory) return

    const existingPattern = this.memory.patterns.find(p => p.type === type && p.pattern === pattern)
    if (existingPattern) {
      existingPattern.frequency++
      existingPattern.lastSeen = new Date().toISOString()
      existingPattern.confidence = Math.min(100, existingPattern.confidence + 3)
      if (!existingPattern.examples.includes(example)) {
        existingPattern.examples.push(example)
        if (existingPattern.examples.length > 5) {
          existingPattern.examples.shift()
        }
      }
    } else {
      this.memory.patterns.push({
        type,
        pattern,
        frequency: 1,
        confidence: 50,
        examples: [example],
        lastSeen: new Date().toISOString()
      })
    }
  }

  // Generate coaching insights based on patterns and context
  private async generateInsights(entry: JournalEntry): Promise<void> {
    if (!this.memory) return

    const insights: CoachingInsight[] = []

    // Pattern-based insights
    const frequentEmotions = this.memory.patterns
      .filter(p => p.type === 'emotional' && p.frequency > 3)
      .sort((a, b) => b.frequency - a.frequency)

    if (frequentEmotions.length > 0) {
      const dominantEmotion = frequentEmotions[0]
      if (dominantEmotion.pattern === 'frustrated' || dominantEmotion.pattern === 'stressed') {
        insights.push({
          type: 'warning',
          message: `I've noticed you've been feeling ${dominantEmotion.pattern} frequently. Let's explore what's driving this and find solutions.`,
          confidence: dominantEmotion.confidence,
          relevantEntries: dominantEmotion.examples,
          actionable: true,
          urgency: 'medium',
          createdAt: new Date().toISOString()
        })
      } else if (dominantEmotion.pattern === 'excited' || dominantEmotion.pattern === 'confident') {
        insights.push({
          type: 'celebration',
          message: `Your confidence is building! You've expressed feeling ${dominantEmotion.pattern} ${dominantEmotion.frequency} times recently. What's driving this positive momentum?`,
          confidence: dominantEmotion.confidence,
          relevantEntries: dominantEmotion.examples,
          actionable: true,
          urgency: 'low',
          createdAt: new Date().toISOString()
        })
      }
    }

    // Business stage insights
    if (this.memory.context.businessStage === 'growth' && this.memory.context.teamSize === 'solo') {
      insights.push({
        type: 'opportunity',
        message: 'You\'re in growth mode but still working solo. Consider if it\'s time to bring on help to accelerate your progress.',
        confidence: 75,
        relevantEntries: [entry.id],
        actionable: true,
        urgency: 'medium',
        createdAt: new Date().toISOString()
      })
    }

    // Challenge persistence insights
    const persistentChallenges = this.memory.context.currentChallenges
    if (persistentChallenges.length > 3) {
      insights.push({
        type: 'guidance',
        message: 'You\'ve mentioned several ongoing challenges. Let\'s prioritize the most critical one and create an action plan.',
        confidence: 80,
        relevantEntries: [entry.id],
        actionable: true,
        urgency: 'high',
        createdAt: new Date().toISOString()
      })
    }

    // Add new insights to memory
    this.memory.insights.push(...insights)
    
    // Keep only recent insights (max 10)
    if (this.memory.insights.length > 10) {
      this.memory.insights = this.memory.insights
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
    }
  }

  // Get the current business memory
  getMemory(): BusinessMemory | null {
    return this.memory
  }

  // Get coaching insights for the user
  getInsights(): CoachingInsight[] {
    return this.memory?.insights || []
  }

  // Get business context
  getContext(): BusinessContext | null {
    return this.memory?.context || null
  }

  // Generate contextual prompts based on learned patterns
  generateCoachingPrompt(): string {
    if (!this.memory) return "What's on your mind about your business today?"

    const context = this.memory.context
    const recentInsights = this.memory.insights.slice(0, 3)

    // Prioritize based on urgent insights
    const urgentInsights = recentInsights.filter(i => i.urgency === 'high')
    if (urgentInsights.length > 0) {
      const insight = urgentInsights[0]
      return `${insight.message.split('.')[0]}. What specific step could you take this week to address this?`
    }

    // Based on business stage
    if (context.businessStage === 'startup' && context.currentChallenges.length > 0) {
      return `As a ${context.businessStage} founder, what's the biggest obstacle preventing you from reaching your next milestone?`
    }

    if (context.businessStage === 'growth') {
      return `What opportunity are you most excited about that could accelerate your business growth?`
    }

    // Based on writing style
    if (context.writingStyle === 'strategic') {
      return `Looking at your business from a strategic perspective, what decision are you wrestling with that could have the biggest impact?`
    }

    if (context.writingStyle === 'emotional') {
      return `What aspect of your entrepreneurial journey is energizing you most right now?`
    }

    // Based on recent wins
    if (context.recentWins.length > 0) {
      return `You've had some recent wins! What did you learn about yourself as a leader that you want to build on?`
    }

    // Based on challenges
    if (context.currentChallenges.length > 0) {
      return `What challenge are you facing that, once solved, would unlock the most growth for your business?`
    }

    // Default coaching prompts
    const defaultPrompts = [
      "What insight about your business came to you today that you want to explore further?",
      "What decision are you avoiding that you know would move your business forward?",
      "What pattern in your business are you noticing that deserves more attention?",
      "What would have to be true for next month to be your best month yet?"
    ]

    return defaultPrompts[Math.floor(Math.random() * defaultPrompts.length)]
  }

  // Save memory to localStorage
  private async saveMemory(): Promise<void> {
    if (!this.memory) return

    try {
      localStorage.setItem(`business_memory_${this.memory.userId}`, JSON.stringify(this.memory))
    } catch (error) {
      console.error('Error saving business memory:', error)
    }
  }

  // Clear memory (for testing or reset)
  async clearMemory(userId: string): Promise<void> {
    try {
      localStorage.removeItem(`business_memory_${userId}`)
      this.memory = null
    } catch (error) {
      console.error('Error clearing business memory:', error)
    }
  }

  // Get memory statistics for debugging
  getMemoryStats(): { entryCount: number; patternsFound: number; insightsGenerated: number; businessStage: string } {
    if (!this.memory) return { entryCount: 0, patternsFound: 0, insightsGenerated: 0, businessStage: 'unknown' }

    return {
      entryCount: this.memory.entryCount,
      patternsFound: this.memory.patterns.length,
      insightsGenerated: this.memory.insights.length,
      businessStage: this.memory.context.businessStage
    }
  }
}

// Global AI coach instance
export const aiBusinessCoach = new AIBusinessCoach()