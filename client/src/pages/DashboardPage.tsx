import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/AuthProvider'
import { useUserProfile } from '@/hooks/useUserProfile'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SafeCard } from '@/components/SafeCard'
import { SkeletonCard } from '@/components/ui/skeleton-card'
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
import { BizBuilderStatsCard } from '@/components/dashboard/BizBuilderStatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from "framer-motion"
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
  const profile = useUserProfile()
  const [celebrationTrigger, setCelebrationTrigger] = useState(false)
  const [celebrationToastVisible, setCelebrationToastVisible] = useState(false)
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null)
  
  const navigate = (path: string) => setLocation(path)

  // Dashboard query parameters
  const dashboardParams = useMemo(() => ({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    to: new Date().toISOString(),
    userId: user?.id || ''
  }), [user?.id])

  // Fetch user goals data with abort controller
  const {
    data: goals = [],
    isLoading: goalsLoading,
    isError: goalsError,
    error: goalsErrorDetails
  } = useQuery({
    queryKey: ['dash:goals', dashboardParams],
    queryFn: async ({ signal }) => {
      if (!user) return []
      
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      
      try {
        const result = await GoalsService.getUserGoals(user.id)
        return result
      } finally {
        clearTimeout(timeout)
      }
    },
    enabled: !!user,
    staleTime: 30_000
  })

  // Fetch journal entries for insights with abort controller
  const {
    data: journalEntries = [],
    isLoading: journalLoading,
    isError: journalError,
    error: journalErrorDetails
  } = useQuery({
    queryKey: ['dash:journal-entries', dashboardParams],
    queryFn: async ({ signal }) => {
      if (!user) return []
      
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      
      try {
        const result = await JournalService.getUserEntries(user.id)
        return result
      } finally {
        clearTimeout(timeout)
      }
    },
    enabled: !!user,
    staleTime: 30_000
  })

  // Fetch storage stats with proper error handling and validation
  const { 
    data: storageStats,
    isLoading: storageLoading,
    isError: storageError,
    error: storageErrorDetails
  } = useQuery({
    queryKey: ['dash:storage-stats', dashboardParams],
    queryFn: async ({ signal }) => {
      if (!user) return null
      
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      
      try {
        const { data: documents } = await (await import('@/lib/supabase')).supabase
          .from('documents')
          .select('file_size')
          .eq('user_id', user.id)
          .abortSignal(controller.signal)
        
        const totalSize = documents?.reduce((sum: number, doc: any) => sum + doc.file_size, 0) || 0
        const totalDocuments = documents?.length || 0
        const storageLimit = 50 * 1024 * 1024 // 50MB in bytes
        
        const result = {
          storage_used: totalSize,
          storage_limit: storageLimit,
          total_documents: totalDocuments,
          storage_percentage: Math.round((totalSize / storageLimit) * 100)
        }
        
        // Return validated result
        return result
      } finally {
        clearTimeout(timeout)
      }
    },
    enabled: !!user,
    staleTime: 30_000
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
    <ErrorBoundary
      fallback={(
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-8 text-center text-red-600 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
            <p>Something went wrong loading your dashboard.</p>
            <p className="text-sm mt-2">Please refresh the page to try again.</p>
          </div>
        </div>
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
        {/* Welcome Header - Exact Same Animation as Journal & Goals */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-4xl font-bold text-slate-900 dark:text-white mb-2"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              Welcome back, <motion.span 
                className="text-orange-600 italic"
                animate={{ 
                  color: ["#ea7a57", "#f97316", "#ea7a57"],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                {profile.full_name || 
                 profile.first_name || 
                 user?.email?.split('@')[0] || 
                 "Entrepreneur"}
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-slate-600 dark:text-slate-300 text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Your business command center
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Daily Business Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200 dark:border-orange-800 shadow-sm hover:shadow-lg transition-all duration-300">
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
        </motion.div>

        {/* Platform Features Section */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        >
          {/* Feature Statistics Cards */}
          <motion.div 
            className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2 gap-4 items-stretch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          >
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <SafeCard>
                {journalLoading ? (
                  <SkeletonCard height={520} />
                ) : journalError ? (
                  <div className="p-4 text-red-600 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="font-medium">Journal data failed to load</p>
                    <p className="text-sm mt-1">Please refresh to try again</p>
                  </div>
                ) : (
                  <JournalStatsCard 
                    journalEntries={journalEntries} 
                    onNavigate={navigate} 
                  />
                )}
              </SafeCard>
            </motion.div>
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <SafeCard>
                {goalsLoading ? (
                  <SkeletonCard height={520} />
                ) : goalsError ? (
                  <div className="p-4 text-red-600 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="font-medium">Goals data failed to load</p>
                    <p className="text-sm mt-1">Please refresh to try again</p>
                  </div>
                ) : (
                  <GoalsStatsCard 
                    goals={goals} 
                    onNavigate={navigate} 
                  />
                )}
              </SafeCard>
            </motion.div>
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <SafeCard>
                <TrainingStatsCard 
                  onNavigate={navigate} 
                />
              </SafeCard>
            </motion.div>
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <SafeCard>
                <BizBuilderStatsCard 
                  onNavigate={navigate} 
                />
              </SafeCard>
            </motion.div>
            <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}>
              <SafeCard>
                {storageLoading ? (
                  <SkeletonCard height={520} />
                ) : storageError ? (
                  <div className="p-4 text-red-600 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="font-medium">Storage data failed to load</p>
                    <p className="text-sm mt-1">Please refresh to try again</p>
                  </div>
                ) : (
                  <DocSafeStatsCard 
                    storageStats={storageStats || null} 
                    onNavigate={navigate} 
                  />
                )}
              </SafeCard>
            </motion.div>
          </motion.div>

        </motion.div>

        {/* Business Intelligence Section */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
        >
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          >
            <motion.h2 
              className="text-2xl font-bold text-slate-900 dark:text-white mb-2"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              Business Intelligence Dashboard
            </motion.h2>
            <motion.p 
              className="text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              AI-powered insights from your journal entries
            </motion.p>
          </motion.div>

          {/* All Business Health Metrics in Single Row */}
          <motion.div 
            className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.1, ease: "backOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <SafeCard>
                {journalLoading ? (
                  <SkeletonCard height={480} />
                ) : journalError || !journalEntries || journalEntries.length === 0 ? (
                  <div className="p-4 text-gray-600 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 h-[480px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-medium">Burnout analysis needs journal data</p>
                      <p className="text-sm mt-1">Start journaling to see insights</p>
                    </div>
                  </div>
                ) : (
                  <BurnoutRiskCard journalEntries={journalEntries} />
                )}
              </SafeCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2, ease: "backOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <SafeCard>
                {journalLoading ? (
                  <SkeletonCard height={480} />
                ) : journalError || !journalEntries || journalEntries.length === 0 ? (
                  <div className="p-4 text-gray-600 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 h-[480px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-medium">Business health analysis needs journal data</p>
                      <p className="text-sm mt-1">Start journaling to see insights</p>
                    </div>
                  </div>
                ) : (
                  <BusinessHealthRadar journalEntries={journalEntries} />
                )}
              </SafeCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.3, ease: "backOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <SafeCard>
                {journalLoading ? (
                  <SkeletonCard height={480} />
                ) : journalError || !journalEntries || journalEntries.length === 0 ? (
                  <div className="p-4 text-gray-600 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 h-[480px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-medium">Growth momentum analysis needs journal data</p>
                      <p className="text-sm mt-1">Start journaling to see insights</p>
                    </div>
                  </div>
                ) : (
                  <GrowthMomentumCard journalEntries={journalEntries} />
                )}
              </SafeCard>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.4, ease: "backOut" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <SafeCard>
                {journalLoading ? (
                  <SkeletonCard height={480} />
                ) : journalError || !journalEntries || journalEntries.length === 0 ? (
                  <div className="p-4 text-gray-600 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 h-[480px] flex items-center justify-center">
                    <div className="text-center">
                      <p className="font-medium">Recovery resilience analysis needs journal data</p>
                      <p className="text-sm mt-1">Start journaling to see insights</p>
                    </div>
                  </div>
                ) : (
                  <RecoveryResilienceCard journalEntries={journalEntries} />
                )}
              </SafeCard>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
    </ErrorBoundary>
  )
}