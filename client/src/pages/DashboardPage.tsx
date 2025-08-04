import React, { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/AuthProvider'
import { GoalsService } from '@/lib/services/goals'
import { Goal } from '@/types/goals'
import { JournalService } from '@/lib/services/journal'
import { BusinessQuoteService } from '@/data/businessQuotes'
import { BusinessHealthRadar } from '@/components/dashboard/BusinessHealthRadar'
import { BurnoutRiskCard } from '@/components/dashboard/BurnoutRiskCard'
import { GrowthMomentumCard } from '@/components/dashboard/GrowthMomentumCard'
import { RecoveryResilienceCard } from '@/components/dashboard/RecoveryResilienceCard'
import { JournalStatsCard } from '@/components/dashboard/JournalStatsCard'
import { GoalsStatsCard } from '@/components/dashboard/GoalsStatsCard'
import { TrainingStatsCard } from '@/components/dashboard/TrainingStatsCard'
import { DocSafeStatsCard } from '@/components/dashboard/DocSafeStatsCard'
import { ReferralStatsCard } from '@/components/dashboard/ReferralStatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedGrid, AnimatedItem } from '@/components/ui/animated-card'
import { ConfettiCelebration, CelebrationToast } from '@/components/ConfettiCelebration'
import {
  Target, TrendingUp, Clock, AlertTriangle, File, Flame, 
  Brain, Plus, ArrowRight, PlayCircle, BarChart3, Notebook, Quote
} from 'lucide-react'
import { isToday, format, subDays, differenceInDays } from 'date-fns'

export function DashboardPage() {
  const [, setLocation] = useLocation()
  const { user } = useAuth()
  const [celebrationTrigger, setCelebrationTrigger] = useState(false)
  const [celebrationToastVisible, setCelebrationToastVisible] = useState(false)
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null)
  
  const navigate = (path: string) => setLocation(path)

  // Fetch user goals data
  const {
    data: goals = [],
    isLoading: goalsLoading,
  } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => user ? GoalsService.getUserGoals(user.id) : Promise.resolve([]),
    enabled: !!user
  })

  // Fetch journal entries for insights
  const {
    data: journalEntries = [],
    isLoading: journalLoading,
  } = useQuery({
    queryKey: ['journal-entries', user?.id],
    queryFn: () => user ? JournalService.getUserEntries(user.id) : Promise.resolve([]),
    enabled: !!user
  })

  // Fetch storage stats for accurate DocSafe metrics
  const { data: storageStats } = useQuery({
    queryKey: ['storage-stats', user?.id],
    queryFn: async () => {
      if (!user) return null
      try {
        const { data: documents } = await (await import('@/lib/supabase')).supabase
          .from('documents')
          .select('file_size')
          .eq('user_id', user.id)
        
        const totalSize = documents?.reduce((sum: number, doc: any) => sum + doc.file_size, 0) || 0
        const totalDocuments = documents?.length || 0
        const storageLimit = 50 * 1024 * 1024 // 50MB in bytes
        
        console.log('Calculated stats:', {
          total_documents: totalDocuments,
          storage_used: totalSize,
          storage_limit: storageLimit
        })
        
        return {
          storage_used: totalSize,
          storage_limit: storageLimit,
          total_documents: totalDocuments,
          storage_percentage: Math.round((totalSize / storageLimit) * 100)
        }
      } catch (error) {
        console.error('Error fetching storage stats:', error)
        return null
      }
    },
    enabled: !!user
  })

  // Calculate comprehensive business intelligence stats from all features
  const stats = GoalsService.calculateStats(goals)

  // Goals Intelligence
  const overdueGoals = goals.filter(goal => 
    goal.deadline && new Date() > new Date(goal.deadline) && goal.status !== 'completed'
  )
  
  const upcomingDeadlines = goals.filter(goal => 
    goal.deadline && 
    new Date() <= new Date(goal.deadline) && 
    differenceInDays(new Date(goal.deadline), new Date()) <= 7 &&
    goal.status !== 'completed'
  ).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())

  // Journal Intelligence
  const journalInsights = {
    totalEntries: journalEntries.length,
    todayEntries: journalEntries.filter(entry => isToday(new Date(entry.created_at))).length,
    thisWeekEntries: journalEntries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      const weekAgo = subDays(new Date(), 7);
      return entryDate >= weekAgo;
    }).length,
    writingStreak: (() => {
      if (journalEntries.length === 0) return 0;
      
      const uniqueDates = Array.from(new Set(journalEntries.map(entry => 
        format(new Date(entry.created_at), 'yyyy-MM-dd')
      ))).sort().reverse()
      
      let streak = 0
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      
      if (uniqueDates.includes(todayStr)) {
        streak = 1
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i-1])
          const currDate = new Date(uniqueDates[i])
          if (Math.abs(differenceInDays(prevDate, currDate)) === 1) {
            streak++
          } else {
            break
          }
        }
      }
      return streak
    })(),
    dominantMood: (() => {
      const recentEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const weekAgo = subDays(new Date(), 7);
        return entryDate >= weekAgo;
      });
      
      const moodCounts = recentEntries.reduce((acc, entry) => {
        if (entry.sentiment_data?.primary_mood) {
          acc[entry.sentiment_data.primary_mood] = (acc[entry.sentiment_data.primary_mood] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)
      
      return Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]
    })(),
    avgConfidence: (() => {
      const recentEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        const weekAgo = subDays(new Date(), 7);
        return entryDate >= weekAgo && entry.sentiment_data?.confidence;
      });
      
      if (recentEntries.length === 0) return 0;
      
      const totalConfidence = recentEntries.reduce((sum, entry) => 
        sum + (entry.sentiment_data?.confidence || 0), 0);
      return Math.round(totalConfidence / recentEntries.length);
    })(),
    goalLinkedEntries: journalEntries.filter(entry => entry.related_goal_id).length
  }

  // Business Health Score (AI-derived from goals + journal)
  const businessHealthScore = (() => {
    let score = 50; // Base score
    
    // Goals contribution (40% of score)
    if (stats.total > 0) {
      score += (stats.completed / stats.total) * 20; // Up to +20 for completion rate
      score += Math.min(stats.inProgress, 5) * 2; // Up to +10 for active goals
      score -= Math.min(overdueGoals.length, 3) * 5; // -5 per overdue (max -15)
    }
    
    // Journal contribution (30% of score)
    if (journalInsights.writingStreak > 0) {
      score += Math.min(journalInsights.writingStreak, 7) * 2; // Up to +14 for streak
    }
    if (journalInsights.avgConfidence > 0) {
      score += ((journalInsights.avgConfidence - 50) / 50) * 10; // Confidence impact
    }
    
    // Integration bonus (10% of score) 
    if (journalInsights.goalLinkedEntries > 0) {
      score += Math.min(journalInsights.goalLinkedEntries, 5) * 2; // Up to +10 for integration
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  })()

  // Get daily business quote
  const dailyQuote = BusinessQuoteService.getDailyQuote()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, <span className="text-orange-600 italic">
              {user?.user_metadata?.full_name || 
               user?.user_metadata?.first_name || 
               user?.email?.split('@')[0] || 
               "Entrepreneur"}
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">Your business command center</p>
        </div>

        {/* Daily Business Quote */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200 dark:border-orange-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-500 rounded-lg shadow-sm flex-shrink-0">
                <Quote className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <blockquote className="text-slate-700 dark:text-slate-300 text-lg italic leading-relaxed mb-3">
                  "{dailyQuote.text}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <cite className="text-sm text-orange-600 dark:text-orange-400 font-medium not-italic">
                    — {dailyQuote.author}
                    {dailyQuote.title && (
                      <span className="text-slate-500 dark:text-slate-400 font-normal">
                        , {dailyQuote.title}
                      </span>
                    )}
                  </cite>
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700 capitalize">
                    {dailyQuote.category}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Features Section */}
        <div className="space-y-6">
          {/* Feature Statistics Cards */}
          <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2 gap-4 items-stretch">
            <JournalStatsCard 
              journalEntries={journalEntries} 
              onNavigate={navigate} 
            />
            <GoalsStatsCard 
              goals={goals} 
              onNavigate={navigate} 
            />
            <TrainingStatsCard 
              onNavigate={navigate} 
            />
            <DocSafeStatsCard 
              storageStats={storageStats || null} 
              onNavigate={navigate} 
            />
            <ReferralStatsCard 
              onNavigate={navigate} 
            />
          </div>
        </div>

        {/* Business Intelligence Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Business Intelligence Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              AI-powered insights from your journal entries
            </p>
          </div>

          {/* All Business Health Metrics in Single Row */}
          <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-4">
            <BurnoutRiskCard journalEntries={journalEntries} />
            <BusinessHealthRadar journalEntries={journalEntries} />
            <GrowthMomentumCard journalEntries={journalEntries} />
            <RecoveryResilienceCard journalEntries={journalEntries} />
          </div>
        </div>
      </div>
    </div>
  )
}