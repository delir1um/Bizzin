import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, Brain, Target, Calendar, Zap, BarChart3 } from "lucide-react"
import type { JournalEntry } from "@/types/journal"
import type { Goal } from "@/types/goals"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from "date-fns"
import { SentimentBadge } from "./SentimentInsights"

interface WeeklySummaryModalProps {
  isOpen: boolean
  onClose: () => void
  entries: JournalEntry[]
  goals: Goal[]
  weekDate?: Date
}

export function WeeklySummaryModal({ isOpen, onClose, entries, goals, weekDate = new Date() }: WeeklySummaryModalProps) {
  if (!isOpen) return null

  // Get week boundaries
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 }) // Monday start
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 })
  
  // Filter entries for this week
  const weekEntries = entries.filter(entry => 
    isWithinInterval(new Date(entry.created_at), { start: weekStart, end: weekEnd })
  )

  // Calculate analytics
  const analytics = {
    totalEntries: weekEntries.length,
    wordsWritten: weekEntries.reduce((total, entry) => total + entry.content.split(' ').length, 0),
    uniqueDays: new Set(weekEntries.map(entry => format(new Date(entry.created_at), 'yyyy-MM-dd'))).size,
    
    // Mood analysis
    moodCounts: weekEntries.reduce((acc, entry) => {
      const mood = entry.sentiment_data?.primary_mood || entry.mood
      if (mood) {
        acc[mood] = (acc[mood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
    
    // Category analysis
    categoryCounts: weekEntries.reduce((acc, entry) => {
      const category = entry.sentiment_data?.business_category || entry.category
      if (category) {
        acc[category] = (acc[category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
    
    // Energy levels
    energyLevels: weekEntries.reduce((acc, entry) => {
      const energy = entry.sentiment_data?.energy
      if (energy) {
        acc[energy] = (acc[energy] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
    
    // Goal tracking
    goalsWorkedOn: weekEntries.filter(entry => entry.related_goal_id).length,
    uniqueGoals: new Set(weekEntries.filter(entry => entry.related_goal_id).map(entry => entry.related_goal_id)).size,
    
    // Key insights
    topInsights: weekEntries
      .filter(entry => entry.sentiment_data?.insights?.length)
      .flatMap(entry => entry.sentiment_data!.insights)
      .slice(0, 3)
  }

  // Get dominant mood
  const dominantMood = Object.entries(analytics.moodCounts).sort(([,a], [,b]) => b - a)[0]
  
  // Get top category
  const topCategory = Object.entries(analytics.categoryCounts).sort(([,a], [,b]) => b - a)[0]
  
  // Get daily breakdown
  const dailyBreakdown = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(day => {
    const dayEntries = weekEntries.filter(entry => 
      format(new Date(entry.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    )
    return {
      date: day,
      entryCount: dayEntries.length,
      mood: dayEntries[0]?.sentiment_data?.primary_mood || dayEntries[0]?.mood,
      hasEntries: dayEntries.length > 0
    }
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Week Summary
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {weekEntries.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No entries this week
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Start journaling to see your weekly insights and patterns.
              </p>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Entries</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analytics.totalEntries}</p>
                      </div>
                      <div className="w-10 h-10 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-blue-700 dark:text-blue-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/30 border-green-200 dark:border-green-800">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Words Written</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{analytics.wordsWritten.toLocaleString()}</p>
                      </div>
                      <div className="w-10 h-10 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-green-700 dark:text-green-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Days</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{analytics.uniqueDays}/7</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/30 border-orange-200 dark:border-orange-800">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Goals Focused</p>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{analytics.uniqueGoals}</p>
                      </div>
                      <div className="w-10 h-10 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-orange-700 dark:text-orange-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    Daily Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {dailyBreakdown.map((day, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg text-center ${
                          day.hasEntries 
                            ? 'bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800' 
                            : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {format(day.date, 'EEE')}
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                          {format(day.date, 'd')}
                        </div>
                        <div className="text-xs">
                          {day.hasEntries ? (
                            <span className="text-orange-600 dark:text-orange-400">
                              {day.entryCount} {day.entryCount === 1 ? 'entry' : 'entries'}
                            </span>
                          ) : (
                            <span className="text-slate-400">No entries</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Insights & Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mood Analysis */}
                {dominantMood && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Brain className="w-5 h-5 text-orange-600" />
                        Mood Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Dominant Mood This Week</p>
                          <Badge variant="secondary" className="text-lg px-3 py-1 capitalize">
                            {dominantMood[0]} ({dominantMood[1]} times)
                          </Badge>
                        </div>
                        
                        {Object.entries(analytics.energyLevels).length > 0 && (
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Energy Levels</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(analytics.energyLevels).map(([energy, count]) => (
                                <Badge key={energy} variant="outline" className="text-xs">
                                  {energy}: {count}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Focus Areas */}
                {topCategory && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Top Business Category</p>
                          <Badge variant="secondary" className="text-lg px-3 py-1 capitalize">
                            {topCategory[0]} ({topCategory[1]} entries)
                          </Badge>
                        </div>
                        
                        {analytics.uniqueGoals > 0 && (
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Goal Progress</p>
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              Worked on {analytics.uniqueGoals} {analytics.uniqueGoals === 1 ? 'goal' : 'goals'} across {analytics.goalsWorkedOn} {analytics.goalsWorkedOn === 1 ? 'entry' : 'entries'}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Key Insights */}
              {analytics.topInsights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Brain className="w-5 h-5 text-orange-600" />
                      Key Business Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {insight}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}