import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, CheckCircle, Info } from 'lucide-react'
import { JournalEntry } from '@/types/journal'
import { subDays, isAfter } from 'date-fns'

interface BurnoutRiskCardProps {
  journalEntries: JournalEntry[]
}

export function BurnoutRiskCard({ journalEntries }: BurnoutRiskCardProps) {
  const calculateBurnoutRisk = (): { risk: number, level: 'low' | 'medium' | 'high', factors: string[] } => {
    if (journalEntries.length === 0) {
      return { risk: 0, level: 'low', factors: ['No journal data available'] }
    }

    // Get recent entries (last 14 days for burnout assessment)
    const twoWeeksAgo = subDays(new Date(), 14)
    const recentEntries = journalEntries.filter(entry => 
      isAfter(new Date(entry.created_at), twoWeeksAgo)
    )

    // Enhanced data sufficiency check
    if (recentEntries.length === 0) {
      return { risk: 0, level: 'low', factors: ['No recent journal entries'] }
    }
    if (recentEntries.length < 3) {
      return { risk: 0, level: 'low', factors: ['Need more entries for accurate assessment'] }
    }

    let riskScore = 0
    const factors: string[] = []

    // Enhanced stress mood categorization with severity weighting
    const highStressMoods = ['overwhelmed', 'burned out', 'exhausted', 'desperate']
    const mediumStressMoods = ['stressed', 'frustrated', 'anxious', 'pressured', 'worried']
    const lowStressMoods = ['tired', 'sad', 'conflicted', 'uncertain', 'disappointed']

    // 1. Enhanced Stress/Negative Mood Analysis (40% weight)
    let stressScore = 0
    const highStressEntries = recentEntries.filter(entry => 
      highStressMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
    )
    const mediumStressEntries = recentEntries.filter(entry => 
      mediumStressMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
    )
    const lowStressEntries = recentEntries.filter(entry => 
      lowStressMoods.includes(entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || '')
    )

    // Weighted stress calculation
    const highStressRatio = highStressEntries.length / recentEntries.length
    const mediumStressRatio = mediumStressEntries.length / recentEntries.length
    const lowStressRatio = lowStressEntries.length / recentEntries.length

    stressScore = (highStressRatio * 40) + (mediumStressRatio * 25) + (lowStressRatio * 15)
    riskScore += stressScore

    if (highStressRatio > 0.3) factors.push('Severe stress indicators')
    else if (mediumStressRatio > 0.5 || highStressRatio > 0.1) factors.push('High stress patterns')
    else if (mediumStressRatio > 0.25) factors.push('Moderate stress levels')

    // Check for consecutive stressful days pattern
    const sortedEntries = recentEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    let consecutiveStressDays = 0
    let maxConsecutive = 0
    for (const entry of sortedEntries.slice(0, 7)) { // Check last 7 days
      const isStressed = [...highStressMoods, ...mediumStressMoods].includes(
        entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
      )
      if (isStressed) {
        consecutiveStressDays++
        maxConsecutive = Math.max(maxConsecutive, consecutiveStressDays)
      } else {
        consecutiveStressDays = 0
      }
    }
    if (maxConsecutive >= 3) {
      riskScore += 15
      factors.push('Sustained stress over multiple days')
    }

    // 2. Enhanced Energy Analysis (30% weight)
    const lowEnergyEntries = recentEntries.filter(entry => 
      entry.sentiment_data?.energy === 'low' || 
      ['tired', 'exhausted', 'drained', 'depleted', 'burned out'].includes(entry.sentiment_data?.primary_mood?.toLowerCase() || '')
    )
    const energyRatio = lowEnergyEntries.length / recentEntries.length
    
    // Time-weighted energy analysis (recent entries weighted more heavily)
    let energyScore = 0
    const last3Days = subDays(new Date(), 3)
    const recentLowEnergy = lowEnergyEntries.filter(entry => isAfter(new Date(entry.created_at), last3Days))
    const recentEnergyRatio = recentLowEnergy.length / Math.max(1, recentEntries.filter(e => isAfter(new Date(e.created_at), last3Days)).length)
    
    energyScore = (energyRatio * 20) + (recentEnergyRatio * 10) // 30% total weight
    riskScore += energyScore

    if (recentEnergyRatio > 0.7) factors.push('Critical energy depletion')
    else if (energyRatio > 0.5) factors.push('Consistently low energy')
    else if (energyRatio > 0.25) factors.push('Some energy concerns')

    // 3. Enhanced Work-Life Balance Analysis (30% weight)
    const workStressKeywords = [
      'working late', 'deadline pressure', 'too much work', 'no breaks', 'overwhelm',
      'constant meetings', 'unrealistic expectations', 'work weekends', 'no time',
      'pulling all-nighters', 'back-to-back meetings', 'impossible timeline'
    ]
    
    const challengeEntries = recentEntries.filter(entry => {
      const isChallenge = entry.sentiment_data?.business_category === 'challenge' || entry.category?.toLowerCase() === 'challenge'
      const hasWorkStress = workStressKeywords.some(keyword => 
        entry.content.toLowerCase().includes(keyword)
      )
      return isChallenge || hasWorkStress
    })
    
    const balanceRatio = challengeEntries.length / recentEntries.length
    const balanceScore = balanceRatio * 30
    riskScore += balanceScore

    if (balanceRatio > 0.6) factors.push('Severe work-life imbalance')
    else if (balanceRatio > 0.4) factors.push('Work-life balance concerns')
    else if (balanceRatio > 0.2) factors.push('Some balance challenges')

    // Recovery indicators check
    const recoveryKeywords = ['took a break', 'went for walk', 'relaxed', 'vacation', 'rest day', 'self-care']
    const recoveryEntries = recentEntries.filter(entry =>
      recoveryKeywords.some(keyword => entry.content.toLowerCase().includes(keyword)) ||
      ['relaxed', 'refreshed', 'recharged', 'peaceful', 'calm'].includes(
        entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
      )
    )
    
    if (recoveryEntries.length > 0) {
      riskScore -= Math.min(10, recoveryEntries.length * 2) // Reduce risk for recovery activities
    }

    // Ensure score stays within bounds
    riskScore = Math.max(0, Math.min(100, riskScore))

    // Determine risk level with refined thresholds
    let level: 'low' | 'medium' | 'high'
    if (riskScore >= 65) level = 'high'
    else if (riskScore >= 35) level = 'medium'
    else level = 'low'

    // Enhanced positive factors for low risk
    if (level === 'low') {
      const positiveEntries = recentEntries.filter(entry =>
        ['excited', 'confident', 'motivated', 'accomplished', 'inspired', 'energized', 'optimistic'].includes(
          entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
        )
      )
      if (positiveEntries.length > recentEntries.length * 0.6) {
        factors.push('Strong positive mindset')
      } else if (positiveEntries.length > recentEntries.length * 0.3) {
        factors.push('Some balance challenges')
      }
      
      if (recoveryEntries.length > 0) {
        factors.push('Active stress management')
      }
    }

    // Ensure we always have at least one factor
    if (factors.length === 0) {
      if (level === 'low') factors.push('Healthy stress levels')
      else if (level === 'medium') factors.push('Moderate stress detected')
      else factors.push('High stress indicators')
    }

    return { risk: Math.round(riskScore), level, factors }
  }

  const { risk, level, factors } = calculateBurnoutRisk()

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      default: return 'text-green-600'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'medium': return <Shield className="h-5 w-5 text-yellow-500" />
      default: return <CheckCircle className="h-5 w-5 text-green-500" />
    }
  }

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      <CardHeader className="pb-3 min-h-[50px] flex items-center">
        <CardTitle className="flex items-center gap-2 text-lg w-full">
          {getRiskIcon(level)}
          Burnout Risk
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-12">
        {/* Status Badge */}
        <div className="flex justify-center mb-3">
          <Badge 
            variant={level === 'high' ? 'destructive' : level === 'medium' ? 'secondary' : 'default'}
            className={`${level === 'low' ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
          >
            {level.toUpperCase()}
          </Badge>
        </div>
        
        {/* Current Risk Level Display */}
        <div className="text-center h-[60px] flex flex-col justify-center">
          <div className={`text-3xl font-bold mb-1 ${
            risk <= 40 ? 'text-green-600' :
            risk <= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {risk}%
          </div>
          <div className="text-sm text-slate-600">Risk Level</div>
        </div>

        {/* Progress Bar with Zones */}
        <div className="space-y-2 mb-4">
          <div className="relative w-full bg-slate-200 rounded-full h-3">
            {/* Zone backgrounds */}
            <div className="absolute left-0 w-2/5 h-full bg-green-100 rounded-l-full"></div>
            <div className="absolute left-2/5 w-1/3 h-full bg-yellow-100"></div>
            <div className="absolute right-0 w-3/10 h-full bg-red-100 rounded-r-full"></div>
            {/* Progress indicator */}
            <div 
              className={`absolute top-0 h-full rounded-full transition-all duration-500 ${getProgressColor(level)}`}
              style={{ width: `${Math.min(risk, 100)}%` }}
            />
          </div>
          {/* Zone labels */}
          <div className="flex justify-between text-xs text-slate-500">
            <span>Safe</span>
            <span>Caution</span>
            <span>High Risk</span>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Key Factors:</h4>
          <div className="space-y-1">
            {factors.length > 0 ? (
              factors.map((factor, index) => (
                <div key={index} className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {factor}
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 italic">No significant risk factors detected</div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {level !== 'low' && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-700 mb-1">Recommendations:</h4>
            <div className="text-sm text-slate-600">
              {level === 'high' 
                ? "Consider taking breaks, delegating tasks, or seeking support to prevent burnout."
                : "Monitor stress levels and implement self-care practices to maintain balance."
              }
            </div>
          </div>
        )}

        {/* Info Icon */}
        <div className="absolute bottom-3 left-3">
          <div className="group relative">
            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
            <div className="absolute left-0 bottom-6 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div><strong>Calculation:</strong> Based on last 14 days of journal entries</div>
                <div><strong>Stress Analysis (40%):</strong> Frequency of stressed, overwhelmed, frustrated moods</div>
                <div><strong>Energy Analysis (30%):</strong> Occurrence of low energy and tired states</div>
                <div><strong>Work-Life Balance (30%):</strong> Challenge entries and work-related overwhelm indicators</div>
                <div><strong>Zones:</strong> 0-40% Safe, 40-70% Caution, 70%+ High Risk</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}