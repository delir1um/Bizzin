import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react'
import { JournalEntry } from '@/types/journal'
import { subDays, isAfter } from 'date-fns'

interface BurnoutRiskCardProps {
  journalEntries: JournalEntry[]
}

export function BurnoutRiskCard({ journalEntries }: BurnoutRiskCardProps) {
  const calculateBurnoutRisk = (): { risk: number, level: 'low' | 'medium' | 'high', factors: string[] } => {
    if (journalEntries.length === 0) {
      return { risk: 0, level: 'low', factors: [] }
    }

    // Get recent entries (last 14 days for burnout assessment)
    const twoWeeksAgo = subDays(new Date(), 14)
    const recentEntries = journalEntries.filter(entry => 
      isAfter(new Date(entry.created_at), twoWeeksAgo)
    )

    if (recentEntries.length === 0) {
      return { risk: 0, level: 'low', factors: ['Insufficient recent data'] }
    }

    let riskScore = 0
    const factors: string[] = []

    // 1. Stress/Negative Mood Analysis (40% weight)
    const stressedEntries = recentEntries.filter(entry => 
      ['stressed', 'overwhelmed', 'frustrated', 'anxious', 'tired', 'sad', 'conflicted'].includes(
        entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
      )
    )
    const stressRatio = stressedEntries.length / recentEntries.length
    const stressScore = stressRatio * 40
    riskScore += stressScore

    if (stressRatio > 0.6) factors.push('High stress patterns')
    else if (stressRatio > 0.3) factors.push('Moderate stress levels')

    // 2. Low Energy Analysis (30% weight)
    const lowEnergyEntries = recentEntries.filter(entry => 
      entry.sentiment_data?.energy === 'low' || 
      ['tired', 'exhausted', 'drained'].includes(entry.sentiment_data?.primary_mood?.toLowerCase() || '')
    )
    const energyRatio = lowEnergyEntries.length / recentEntries.length
    const energyScore = energyRatio * 30
    riskScore += energyScore

    if (energyRatio > 0.5) factors.push('Consistently low energy')
    else if (energyRatio > 0.25) factors.push('Some energy concerns')

    // 3. Work-Life Balance Indicators (30% weight)
    const challengeEntries = recentEntries.filter(entry =>
      (entry.sentiment_data?.business_category === 'challenge' || entry.category?.toLowerCase() === 'challenge') ||
      entry.content.toLowerCase().includes('overwhelm') ||
      entry.content.toLowerCase().includes('work late') ||
      entry.content.toLowerCase().includes('no time')
    )
    const balanceRatio = challengeEntries.length / recentEntries.length
    const balanceScore = balanceRatio * 30
    riskScore += balanceScore

    if (balanceRatio > 0.4) factors.push('Work-life balance concerns')
    else if (balanceRatio > 0.2) factors.push('Some balance challenges')

    // Determine risk level
    let level: 'low' | 'medium' | 'high'
    if (riskScore >= 70) level = 'high'
    else if (riskScore >= 40) level = 'medium'
    else level = 'low'

    // Add positive factors for low risk
    if (level === 'low') {
      const positiveEntries = recentEntries.filter(entry =>
        ['excited', 'confident', 'motivated', 'accomplished', 'inspired'].includes(
          entry.sentiment_data?.primary_mood?.toLowerCase() || entry.mood?.toLowerCase() || ''
        )
      )
      if (positiveEntries.length > recentEntries.length * 0.5) {
        factors.push('Strong positive mindset')
      }
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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            {getRiskIcon(level)}
            Burnout Risk
          </span>
          <Badge 
            variant={level === 'high' ? 'destructive' : level === 'medium' ? 'secondary' : 'default'}
            className={`${level === 'low' ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
          >
            {level.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Risk Level</span>
            <span className={`font-semibold ${getRiskColor(level)}`}>{risk}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(level)}`}
              style={{ width: `${Math.min(risk, 100)}%` }}
            />
          </div>
          {/* Zone indicators */}
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0% Safe</span>
            <span>40% Caution</span>
            <span>70% High Risk</span>
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
      </CardContent>
    </Card>
  )
}