import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  Calendar, 
  Zap, 
  Target, 
  BookOpen, 
  Sparkles,
  Clock,
  ChevronRight,
  Plus
} from "lucide-react"
import { format, isToday, differenceInDays, startOfWeek, endOfWeek } from "date-fns"
import type { JournalEntry } from "@/types/journal"

interface JournalDashboardProps {
  entries: JournalEntry[]
  onCreateEntry: () => void
  onViewEntry: (entry: JournalEntry) => void
  onJumpToDate: (date: Date) => void
}

export function JournalDashboard({ 
  entries, 
  onCreateEntry, 
  onViewEntry, 
  onJumpToDate 
}: JournalDashboardProps) {
  
  const analytics = useMemo(() => {
    if (!entries.length) return null

    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)
    
    // Recent entries (last 7 days)
    const recentEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return differenceInDays(today, entryDate) <= 7
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Today's entries
    const todayEntries = entries.filter(entry => 
      isToday(new Date(entry.created_at))
    )

    // Week's entries
    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.created_at)
      return entryDate >= weekStart && entryDate <= weekEnd
    })

    // Mood patterns
    const moodCounts = entries.reduce((acc, entry) => {
      if (entry.sentiment_data?.primary_mood) {
        acc[entry.sentiment_data.primary_mood] = (acc[entry.sentiment_data.primary_mood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const dominantMood = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0]

    // Energy levels
    const energyLevels = entries
      .filter(entry => entry.sentiment_data?.energy)
      .map(entry => entry.sentiment_data!.energy!)

    const avgEnergy = energyLevels.length > 0 
      ? energyLevels.reduce((sum, level) => sum + 
          (level === 'High' ? 3 : level === 'Medium' ? 2 : 1), 0) / energyLevels.length
      : 0

    // Writing streak
    const uniqueDates = new Set(entries.map(entry => 
      format(new Date(entry.created_at), 'yyyy-MM-dd')
    ))
    const sortedDates = Array.from(uniqueDates).sort().reverse()

    let streak = 0
    const todayStr = format(today, 'yyyy-MM-dd')
    
    if (sortedDates.includes(todayStr)) {
      streak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i-1])
        const currDate = new Date(sortedDates[i])
        if (differenceInDays(prevDate, currDate) === 1) {
          streak++
        } else {
          break
        }
      }
    }

    // Categories distribution
    const categories = entries.reduce((acc, entry) => {
      if (entry.category) {
        acc[entry.category] = (acc[entry.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const topCategory = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)[0]

    return {
      recentEntries: recentEntries.slice(0, 3),
      todayEntries,
      weekEntries,
      dominantMood,
      avgEnergy,
      streak,
      topCategory,
      totalEntries: entries.length
    }
  }, [entries])

  if (!analytics) {
    return (
      <div className="space-y-6">
        {/* Welcome State */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-2">
                Welcome to Your Business Journal
              </h2>
              <p className="text-orange-700 dark:text-orange-300 mb-6 max-w-md mx-auto">
                Start documenting your entrepreneurial journey with AI-powered insights and reflection prompts.
              </p>
              <Button 
                onClick={onCreateEntry}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Write Your First Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: Record<string, string> = {
      'Excited': '🚀',
      'Motivated': '💪',
      'Focused': '🎯',
      'Confident': '⭐',
      'Optimistic': '🌟',
      'Grateful': '🙏',
      'Reflective': '🤔',
      'Challenged': '⚡',
      'Stressed': '😤',
      'Overwhelmed': '🌀',
      'Frustrated': '😠'
    }
    return moodEmojis[mood] || '💭'
  }

  const getEnergyLevel = (avg: number) => {
    if (avg >= 2.5) return { label: 'High Energy', color: 'text-green-600', icon: '⚡' }
    if (avg >= 1.5) return { label: 'Medium Energy', color: 'text-yellow-600', icon: '🔋' }
    return { label: 'Low Energy', color: 'text-orange-600', icon: '🪫' }
  }

  const energyInfo = getEnergyLevel(analytics.avgEnergy)

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Progress */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Today</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analytics.todayEntries.length}
                </p>
                <p className="text-xs text-slate-500">
                  {analytics.todayEntries.length === 0 ? "No entries yet" : "entries written"}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Writing Streak */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Streak</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {analytics.streak}
                </p>
                <p className="text-xs text-slate-500">
                  {analytics.streak === 1 ? "day" : "days"}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dominant Mood */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Mood</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>{getMoodEmoji(analytics.dominantMood?.[0] || '')}</span>
                  {analytics.dominantMood?.[0] || 'Mixed'}
                </p>
                <p className="text-xs text-slate-500">Most common</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Energy Level */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Energy</p>
                <p className={`text-lg font-bold ${energyInfo.color} flex items-center gap-1`}>
                  <span>{energyInfo.icon}</span>
                  {energyInfo.label.split(' ')[0]}
                </p>
                <p className="text-xs text-slate-500">Average level</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={onCreateEntry}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Write Entry
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => onJumpToDate(new Date())}
          className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950"
        >
          <Calendar className="w-4 h-4 mr-2" />
          View Calendar
        </Button>

        {analytics.weekEntries.length > 0 && (
          <Button 
            variant="outline"
            onClick={() => {/* Could open week summary */}}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Week Summary
          </Button>
        )}
      </div>

      {/* Recent Entries */}
      {analytics.recentEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Entries</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onJumpToDate(new Date())}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950"
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.recentEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onViewEntry(entry)}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-orange-900 dark:group-hover:text-orange-100 transition-colors" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {entry.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {format(new Date(entry.created_at), isToday(new Date(entry.created_at)) ? 'h:mm a' : 'MMM d')}
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {entry.content}
                </p>
                
                <div className="flex items-center gap-2">
                  {entry.sentiment_data?.primary_mood && (
                    <Badge variant="secondary" className="text-xs">
                      {getMoodEmoji(entry.sentiment_data.primary_mood)} {entry.sentiment_data.primary_mood}
                    </Badge>
                  )}
                  {entry.category && (
                    <Badge variant="outline" className="text-xs">
                      📁 {entry.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Insights Summary */}
      {analytics.topCategory && (
        <Card className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
              Journal Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Most Written About</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  📁 {analytics.topCategory[0]} ({analytics.topCategory[1]} entries)
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Entries</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {analytics.totalEntries} entries written
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}