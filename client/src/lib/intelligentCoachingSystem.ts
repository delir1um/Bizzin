import { aiBusinessCoach, type BusinessMemory, type CoachingInsight } from './aiBusinessCoach'
import type { JournalEntry } from '@/types/journal'
import type { Goal } from '@/types/goals'

export interface CoachingPlan {
  id: string
  title: string
  description: string
  timeframe: '1week' | '2weeks' | '1month' | '3months'
  priority: 'high' | 'medium' | 'low'
  actionItems: CoachingAction[]
  category: 'strategic' | 'operational' | 'emotional' | 'growth'
  confidence: number
  basedOn: string[] // What insights/patterns this is based on
}

export interface CoachingAction {
  id: string
  title: string
  description: string
  type: 'reflection' | 'task' | 'habit' | 'metric'
  completed: boolean
  dueDate?: string
  relatedGoalId?: string
}

export interface BusinessIntelligenceReport {
  id: string
  generatedAt: string
  timeframe: 'weekly' | 'monthly' | 'quarterly'
  keyInsights: string[]
  trendAnalysis: TrendAnalysis[]
  recommendations: string[]
  riskFactors: string[]
  opportunities: string[]
  businessHealth: {
    score: number
    factors: { name: string; score: number; description: string }[]
  }
}

export interface TrendAnalysis {
  type: 'emotional' | 'strategic' | 'operational' | 'growth'
  trend: 'improving' | 'declining' | 'stable' | 'volatile'
  description: string
  dataPoints: { date: string; value: number }[]
  significance: 'high' | 'medium' | 'low'
}

export interface PersonalizedCoachingSession {
  id: string
  date: string
  type: 'weekly-review' | 'challenge-solving' | 'goal-planning' | 'crisis-support'
  focus: string
  questions: string[]
  insights: string[]
  actionPlan: CoachingAction[]
  followUpDate: string
}

class IntelligentCoachingSystem {
  private memory: BusinessMemory | null = null
  private userId: string | null = null

  async initialize(userId: string): Promise<void> {
    this.userId = userId
    await aiBusinessCoach.initializeMemory(userId)
    this.memory = aiBusinessCoach.getMemory()
  }

  generateCoachingPlan(entries: JournalEntry[], goals: Goal[]): CoachingPlan[] {
    if (!this.memory) return []

    const plans: CoachingPlan[] = []
    const context = this.memory.context
    const patterns = this.memory.patterns

    // Strategic Planning based on business stage
    if (context.businessStage === 'idea' || context.businessStage === 'startup') {
      plans.push({
        id: 'strategic-foundation',
        title: 'Build Strategic Foundation',
        description: 'Establish core business framework and validate your business model',
        timeframe: '1month',
        priority: 'high',
        category: 'strategic',
        confidence: 0.85,
        basedOn: ['business_stage_analysis', 'planning_patterns'],
        actionItems: [
          {
            id: 'validate-market',
            title: 'Validate Market Demand',
            description: 'Conduct customer interviews and market research',
            type: 'task',
            completed: false,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'define-value-prop',
            title: 'Refine Value Proposition',
            description: 'Clearly articulate what makes your solution unique',
            type: 'reflection',
            completed: false,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      })
    }

    // Emotional Resilience based on stress patterns
    const stressPatterns = patterns.filter(p => 
      p.type === 'emotional' && 
      ['stressed', 'overwhelmed', 'anxious'].includes(p.pattern.toLowerCase())
    )

    if (stressPatterns.length > 0) {
      plans.push({
        id: 'emotional-resilience',
        title: 'Build Emotional Resilience',
        description: 'Develop coping strategies and maintain mental well-being',
        timeframe: '2weeks',
        priority: 'high',
        category: 'emotional',
        confidence: 0.75,
        basedOn: ['stress_patterns', 'emotional_analysis'],
        actionItems: [
          {
            id: 'daily-reflection',
            title: 'Daily Stress Check-in',
            description: 'Spend 5 minutes each morning identifying stress triggers',
            type: 'habit',
            completed: false
          },
          {
            id: 'stress-metrics',
            title: 'Track Stress Levels',
            description: 'Rate daily stress levels and identify patterns',
            type: 'metric',
            completed: false
          }
        ]
      })
    }

    // Growth Optimization for growth stage businesses
    if (context.businessStage === 'growth') {
      plans.push({
        id: 'growth-optimization',
        title: 'Optimize Growth Systems',
        description: 'Scale operations and improve business processes',
        timeframe: '3months',
        priority: 'medium',
        category: 'growth',
        confidence: 0.70,
        basedOn: ['growth_stage_analysis', 'operational_patterns'],
        actionItems: [
          {
            id: 'automate-processes',
            title: 'Identify Automation Opportunities',
            description: 'Review repetitive tasks and implement automation',
            type: 'task',
            completed: false,
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'team-structure',
            title: 'Review Team Structure',
            description: 'Assess if current team structure supports growth goals',
            type: 'reflection',
            completed: false
          }
        ]
      })
    }

    return plans
  }

  generateBusinessIntelligenceReport(
    entries: JournalEntry[], 
    goals: Goal[], 
    timeframe: 'weekly' | 'monthly' | 'quarterly'
  ): BusinessIntelligenceReport {
    if (!this.memory) {
      throw new Error('Coaching system not initialized')
    }

    const keyInsights = this.extractKeyInsights(entries, timeframe)
    const trendAnalysis = this.analyzeTrends(entries, timeframe)
    const businessHealth = this.calculateBusinessHealth(entries, goals)

    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      timeframe,
      keyInsights,
      trendAnalysis,
      recommendations: this.generateRecommendations(keyInsights, trendAnalysis),
      riskFactors: this.identifyRiskFactors(trendAnalysis),
      opportunities: this.identifyOpportunities(entries, goals),
      businessHealth
    }
  }

  private extractKeyInsights(entries: JournalEntry[], timeframe: string): string[] {
    const insights: string[] = []
    const context = this.memory?.context
    const patterns = this.memory?.patterns || []

    // Productivity insights
    const productivePatterns = patterns.filter(p => 
      p.type === 'strategic' && p.frequency > 2
    )
    if (productivePatterns.length > 0) {
      insights.push(`Your most productive focus areas are: ${productivePatterns.map(p => p.pattern).join(', ')}`)
    }

    // Challenge insights
    if (context?.currentChallenges && context.currentChallenges.length > 0) {
      insights.push(`Key challenges this ${timeframe}: ${context.currentChallenges.slice(0, 2).join(', ')}`)
    }

    // Growth insights
    if (context?.recentWins && context.recentWins.length > 0) {
      insights.push(`Recent wins building momentum: ${context.recentWins.slice(0, 2).join(', ')}`)
    }

    // Emotional insights
    const emotionalPatterns = patterns.filter(p => p.type === 'emotional')
    if (emotionalPatterns.length > 0) {
      const dominantMood = emotionalPatterns.sort((a, b) => b.frequency - a.frequency)[0]
      insights.push(`Emotional pattern: You've been feeling ${dominantMood.pattern} frequently, which ${this.interpretMoodImpact(dominantMood.pattern)}`)
    }

    return insights.slice(0, 5) // Top 5 insights
  }

  private analyzeTrends(entries: JournalEntry[], timeframe: string): TrendAnalysis[] {
    const trends: TrendAnalysis[] = []
    
    // Emotional trend analysis
    const emotionalData = this.extractEmotionalTrendData(entries)
    if (emotionalData.length > 1) {
      trends.push({
        type: 'emotional',
        trend: this.calculateTrend(emotionalData),
        description: 'Your emotional well-being and stress levels over time',
        dataPoints: emotionalData,
        significance: 'high'
      })
    }

    // Strategic focus trend
    const strategicData = this.extractStrategicTrendData(entries)
    if (strategicData.length > 1) {
      trends.push({
        type: 'strategic',
        trend: this.calculateTrend(strategicData),
        description: 'Consistency in strategic thinking and planning',
        dataPoints: strategicData,
        significance: 'medium'
      })
    }

    return trends
  }

  private extractEmotionalTrendData(entries: JournalEntry[]): { date: string; value: number }[] {
    return entries
      .filter(entry => entry.sentiment_data?.confidence && entry.sentiment_data.confidence > 40 && entry.entry_date)
      .map(entry => ({
        date: entry.entry_date!,
        value: this.convertMoodToScore(entry.sentiment_data?.primary_mood || 'neutral')
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  private extractStrategicTrendData(entries: JournalEntry[]): { date: string; value: number }[] {
    return entries
      .filter(entry => entry.entry_date)
      .map(entry => ({
        date: entry.entry_date!,
        value: this.calculateStrategicScore(entry.content)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  private convertMoodToScore(mood: string): number {
    const moodScores: Record<string, number> = {
      'excited': 5,
      'confident': 4.5,
      'optimistic': 4,
      'focused': 4,
      'content': 3.5,
      'neutral': 3,
      'concerned': 2.5,
      'frustrated': 2,
      'stressed': 1.5,
      'overwhelmed': 1
    }
    return moodScores[mood.toLowerCase()] || 3
  }

  private calculateStrategicScore(content: string): number {
    const strategicKeywords = [
      'strategy', 'plan', 'goal', 'vision', 'mission', 'objective',
      'analyze', 'evaluate', 'assess', 'review', 'consider',
      'opportunity', 'market', 'competitive', 'advantage'
    ]
    
    const contentLower = content.toLowerCase()
    const keywordCount = strategicKeywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length

    return Math.min(5, keywordCount * 0.5 + 1) // Scale 1-5
  }

  private calculateTrend(dataPoints: { date: string; value: number }[]): 'improving' | 'declining' | 'stable' | 'volatile' {
    if (dataPoints.length < 2) return 'stable'

    const values = dataPoints.map(dp => dp.value)
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    const difference = secondAvg - firstAvg
    const volatility = this.calculateVolatility(values)

    if (volatility > 1.5) return 'volatile'
    if (difference > 0.5) return 'improving'
    if (difference < -0.5) return 'declining'
    return 'stable'
  }

  private calculateVolatility(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  private generateRecommendations(insights: string[], trends: TrendAnalysis[]): string[] {
    const recommendations: string[] = []

    // Trend-based recommendations
    trends.forEach(trend => {
      if (trend.type === 'emotional' && trend.trend === 'declining') {
        recommendations.push('Consider implementing stress management techniques and regular breaks')
      }
      if (trend.type === 'strategic' && trend.trend === 'improving') {
        recommendations.push('Your strategic thinking is strengthening - consider tackling more complex challenges')
      }
      if (trend.trend === 'volatile') {
        recommendations.push(`Your ${trend.type} patterns are inconsistent - focus on building sustainable routines`)
      }
    })

    // Business stage recommendations
    const context = this.memory?.context
    if (context?.businessStage === 'idea' || context?.businessStage === 'startup') {
      recommendations.push('Focus on validation and customer discovery before building features')
    } else if (context?.businessStage === 'growth') {
      recommendations.push('Implement systems and processes to support scaling')
    }

    return recommendations.slice(0, 4) // Top 4 recommendations
  }

  private identifyRiskFactors(trends: TrendAnalysis[]): string[] {
    const risks: string[] = []

    trends.forEach(trend => {
      if (trend.trend === 'declining' && trend.significance === 'high') {
        risks.push(`Declining ${trend.type} performance requires immediate attention`)
      }
      if (trend.trend === 'volatile') {
        risks.push(`Inconsistent ${trend.type} patterns may indicate underlying issues`)
      }
    })

    // Memory-based risk assessment
    const patterns = this.memory?.patterns || []
    const stressPatterns = patterns.filter(p => 
      p.type === 'emotional' && 
      ['stressed', 'overwhelmed', 'burned'].some(stress => p.pattern.toLowerCase().includes(stress))
    )

    if (stressPatterns.length > 0) {
      risks.push('High stress levels may impact decision-making and productivity')
    }

    return risks.slice(0, 3)
  }

  private identifyOpportunities(entries: JournalEntry[], goals: Goal[]): string[] {
    const opportunities: string[] = []
    const context = this.memory?.context

    // Goal-based opportunities
    const activeGoals = goals.filter(g => g.status !== 'completed')
    if (activeGoals.length > 0) {
      opportunities.push('Leverage current goal momentum to tackle additional strategic initiatives')
    }

    // Pattern-based opportunities
    const patterns = this.memory?.patterns || []
    const successPatterns = patterns.filter(p => 
      p.type === 'strategic' && p.frequency > 3
    )

    if (successPatterns.length > 0) {
      opportunities.push(`Your strength in ${successPatterns[0].pattern} could be leveraged for new initiatives`)
    }

    // Recent wins opportunities
    if (context?.recentWins && context.recentWins.length > 0) {
      opportunities.push('Build on recent successes to create additional value streams')
    }

    return opportunities.slice(0, 3)
  }

  private calculateBusinessHealth(entries: JournalEntry[], goals: Goal[]): {
    score: number
    factors: { name: string; score: number; description: string }[]
  } {
    const factors = []

    // Goal Progress Factor
    const activeGoals = goals.filter(g => g.status !== 'completed')
    const completedGoals = goals.filter(g => g.status === 'completed')
    const goalScore = completedGoals.length > 0 ? 
      Math.min(100, (completedGoals.length / (completedGoals.length + activeGoals.length)) * 100) : 50

    factors.push({
      name: 'Goal Achievement',
      score: goalScore,
      description: `${completedGoals.length} completed, ${activeGoals.length} active goals`
    })

    // Emotional Well-being Factor
    const recentEntries = entries.slice(0, 10) // Last 10 entries
    const avgMoodScore = recentEntries
      .filter(e => e.sentiment_data?.primary_mood)
      .reduce((acc, e) => acc + this.convertMoodToScore(e.sentiment_data!.primary_mood), 0) / recentEntries.length

    const emotionalScore = (avgMoodScore / 5) * 100

    factors.push({
      name: 'Emotional Well-being',
      score: emotionalScore,
      description: `Average mood rating: ${avgMoodScore.toFixed(1)}/5`
    })

    // Consistency Factor
    const consistencyScore = entries.length > 7 ? 
      Math.min(100, (entries.length / 30) * 100) : // Journal consistency over 30 days
      (entries.length / 7) * 100

    factors.push({
      name: 'Journal Consistency',
      score: consistencyScore,
      description: `${entries.length} entries in recent period`
    })

    // Strategic Focus Factor
    const strategicEntries = entries.filter(e => 
      this.calculateStrategicScore(e.content) > 3
    )
    const strategicScore = entries.length > 0 ? 
      (strategicEntries.length / entries.length) * 100 : 50

    factors.push({
      name: 'Strategic Focus',
      score: strategicScore,
      description: `${Math.round((strategicEntries.length / entries.length) * 100)}% of entries show strategic thinking`
    })

    const overallScore = factors.reduce((acc, f) => acc + f.score, 0) / factors.length

    return {
      score: Math.round(overallScore),
      factors
    }
  }

  private interpretMoodImpact(mood: string): string {
    const impacts: Record<string, string> = {
      'excited': 'typically drives innovation and bold decision-making',
      'confident': 'supports strong leadership and risk-taking',
      'optimistic': 'encourages growth-oriented thinking',
      'focused': 'enhances productivity and goal achievement',
      'stressed': 'may limit creative thinking and decision quality',
      'overwhelmed': 'can lead to decision paralysis and burnout',
      'frustrated': 'might indicate misaligned expectations or resources'
    }
    return impacts[mood.toLowerCase()] || 'affects your business approach'
  }

  generatePersonalizedCoachingSession(type: PersonalizedCoachingSession['type']): PersonalizedCoachingSession {
    const context = this.memory?.context
    const patterns = this.memory?.patterns || []

    const session: PersonalizedCoachingSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString(),
      type,
      focus: '',
      questions: [],
      insights: [],
      actionPlan: [],
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }

    switch (type) {
      case 'weekly-review':
        session.focus = 'Weekly progress and planning'
        session.questions = [
          'What were your biggest wins this week?',
          'What challenges did you encounter and how did you handle them?',
          'What patterns do you notice in your decision-making?',
          'What will you focus on next week to move closer to your goals?'
        ]
        break

      case 'challenge-solving':
        const challenges = context?.currentChallenges || []
        session.focus = challenges.length > 0 ? challenges[0] : 'Current business challenge'
        session.questions = [
          'What is the root cause of this challenge?',
          'What resources or support do you need to address it?',
          'What would success look like in solving this?',
          'What is the smallest step you can take today?'
        ]
        break

      case 'goal-planning':
        session.focus = 'Strategic goal setting and planning'
        session.questions = [
          'What does success look like for your business in the next 90 days?',
          'What are the key milestones you need to hit?',
          'What obstacles might prevent you from achieving these goals?',
          'How will you measure progress along the way?'
        ]
        break

      case 'crisis-support':
        session.focus = 'Crisis management and emotional support'
        session.questions = [
          'What is the most pressing issue you need to address right now?',
          'What support systems do you have available?',
          'What would help you feel more grounded and focused?',
          'What is one small action you can take to regain control?'
        ]
        break
    }

    return session
  }
}

export const intelligentCoachingSystem = new IntelligentCoachingSystem()