import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, BookOpen, Calendar, Brain, ChevronDown, ChevronRight, Flame, TrendingUp, Heart, Sparkles, Zap } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format, isToday, isThisWeek, isThisMonth, isThisYear, startOfDay, subDays, subWeeks, subMonths } from "date-fns"
import type { JournalEntry } from "@/types/journal"
import { SimpleCreateEntryModal } from "@/components/journal/SimpleCreateEntryModal"
import { ViewEntryModal } from "@/components/journal/ViewEntryModal"
import { EditEntryModal } from "@/components/journal/EditEntryModal"
import { AIMigrationDialog } from "@/components/journal/AIMigrationDialog"
import { AIMigrationService } from "@/lib/services/aiMigration"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { getDisplayMoodEmoji, getEntryDisplayData } from "@/lib/journalDisplayUtils"
import { AIAnalysisIndicator } from "@/components/journal/AIAnalysisIndicator"

export function JournalPage() {
  const [user, setUser] = useState<any>(null)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    thisWeek: true,  // Start expanded so users can see content
    thisMonth: true,
    thisYear: false
  })
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getCurrentUser()
  }, [])

  // Fetch journal entries using direct Supabase query
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching entries:', error)
        return []
      }
      
      return data || []
    },
    enabled: !!user
  })

  // Check for migration needs when entries are loaded
  useEffect(() => {
    if (entries.length > 0 && AIMigrationService.needsMigration()) {
      // Auto-show migration dialog if entries need updating
      setShowMigrationDialog(true)
    }
  }, [entries])

  // Filter entries based on search
  const filteredEntries = entries.filter((entry: JournalEntry) =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Organize entries by time periods
  const organizeEntriesByTime = (entries: JournalEntry[]) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    const results = {
      today: entries.filter(entry => {
        // Prioritize entry_date, fall back to created_at
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return isToday(entryDate)
      }),
      thisWeek: entries.filter(entry => {
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return !isToday(entryDate) && isThisWeek(entryDate)
      }),
      thisMonth: entries.filter(entry => {
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return !isThisWeek(entryDate) && isThisMonth(entryDate)
      }),
      thisYear: entries.filter(entry => {
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return !isThisMonth(entryDate) && isThisYear(entryDate)
      }),
      previousYears: {} as Record<number, JournalEntry[]>
    }
    
    // Group entries from previous years
    const previousYearEntries = entries.filter(entry => {
      const entryDate = new Date(entry.entry_date || entry.created_at || '')
      return entryDate.getFullYear() < currentYear
    })
    
    // Group by year
    previousYearEntries.forEach(entry => {
      const entryDate = new Date(entry.entry_date || entry.created_at || '')
      const year = entryDate.getFullYear()
      if (!results.previousYears[year]) {
        results.previousYears[year] = []
      }
      results.previousYears[year].push(entry)
    })
    
    return results
  }

  const organizedEntries = organizeEntriesByTime(filteredEntries)

  const toggleSection = (section: 'thisWeek' | 'thisMonth' | 'thisYear' | string) => {
    setExpandedSections(prev => {
      // If clicking on currently expanded section, collapse it
      if (prev[section]) {
        return { ...prev, [section]: false }
      }
      
      // Otherwise, collapse all and expand only the clicked section
      const newSections: Record<string, boolean> = {}
      Object.keys(prev).forEach(key => {
        newSections[key] = false
      })
      newSections[section] = true
      return newSections
    })
  }



  const getMoodColor = (mood: string | null | undefined) => {
    if (!mood) return 'text-gray-600 bg-gray-50'
    
    const moodColors: Record<string, string> = {
      'excited': 'text-yellow-700 bg-yellow-50',
      'confident': 'text-blue-700 bg-blue-50',
      'optimistic': 'text-green-700 bg-green-50',
      'focused': 'text-purple-700 bg-purple-50',
      'content': 'text-emerald-700 bg-emerald-50',
      'neutral': 'text-gray-600 bg-gray-50',
      'concerned': 'text-orange-700 bg-orange-50',
      'frustrated': 'text-red-700 bg-red-50',
      'stressed': 'text-red-800 bg-red-50',
      'overwhelmed': 'text-red-900 bg-red-50',
      'determined': 'text-red-700 bg-red-50',
      'accomplished': 'text-green-700 bg-green-50',
      'uncertain': 'text-gray-700 bg-gray-50',
      'inspired': 'text-purple-700 bg-purple-50',
      'reflective': 'text-indigo-700 bg-indigo-50',
      'sad': 'text-blue-700 bg-blue-50',
      'tired': 'text-slate-700 bg-slate-50',
      'Thoughtful': 'text-amber-700 bg-amber-50',
      'Curious': 'text-teal-700 bg-teal-50',
      'Focused': 'text-purple-700 bg-purple-50',
      'Sad': 'text-blue-700 bg-blue-50',
      'Tired': 'text-slate-700 bg-slate-50'
    }
    
    return moodColors[mood.toLowerCase()] || 'text-gray-600 bg-gray-50'
  }

  const getCategoryColor = (category: string | null | undefined) => {
    if (!category) return 'text-slate-600 bg-slate-50'
    
    const categoryColors: Record<string, string> = {
      'planning': 'text-blue-700 bg-blue-50',
      'strategy': 'text-purple-700 bg-purple-50',
      'operations': 'text-green-700 bg-green-50',
      'finance': 'text-emerald-700 bg-emerald-50',
      'marketing': 'text-pink-700 bg-pink-50',
      'reflection': 'text-indigo-700 bg-indigo-50',
      'challenges': 'text-red-700 bg-red-50',
      'wins': 'text-yellow-700 bg-yellow-50',
      'growth': 'text-emerald-700 bg-emerald-50',
      'challenge': 'text-red-700 bg-red-50',
      'achievement': 'text-yellow-700 bg-yellow-50'
    }
    
    return categoryColors[category.toLowerCase()] || 'text-slate-600 bg-slate-50'
  }

  const getEnergyEmoji = (energy: string | null | undefined): string => {
    if (!energy) return ''
    
    const energyEmojis: Record<string, string> = {
      'high': '⚡',
      'medium': '🔋',
      'low': '🪫'
    }
    
    return energyEmojis[energy.toLowerCase()] || ''
  }

  // Energy label function to match view modal design
  const getEnergyLabel = (energy: string) => {
    switch (energy) {
      case 'high': return 'High Energy'
      case 'medium': return 'Medium Energy'
      case 'low': return 'Low Energy'
      default: return 'Medium Energy'
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const getThisWeekCount = () => {
    return entries.filter((e: JournalEntry) => {
      const today = new Date()
      const entryDate = new Date(e.created_at || e.entry_date || '')
      const diffTime = today.getTime() - entryDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    }).length
  }

  const getAIAnalyzedCount = () => {
    return entries.filter((e: JournalEntry) => 
      e.sentiment_data?.confidence && e.sentiment_data.confidence > 50
    ).length
  }

  const handleViewEntry = (entry: JournalEntry) => {
    // Always show view modal first for all entries
    setSelectedEntry(entry)
    setShowViewModal(true)
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setShowEditModal(true)
  }

  const handleDeleteEntry = async (entry: JournalEntry) => {
    if (!user?.id) return
    
    try {
      console.log('Deleting journal entry:', entry.id, 'for user:', user.id)
      
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id)
        .eq('user_id', user.id)
      
      if (error) throw error
      
      // Close modals and refresh data
      handleCloseModals()
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been successfully removed.",
      })
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast({
        title: "Error",
        description: "Failed to delete the entry. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCloseModals = () => {
    setShowViewModal(false)
    setShowEditModal(false)
    setSelectedEntry(null)
  }

  // Calculate enhanced statistics
  const calculateStats = () => {
    // Calculate writing streak
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.entry_date || b.created_at || '').getTime() - 
      new Date(a.entry_date || a.created_at || '').getTime()
    )
    
    let streak = 0
    const today = new Date()
    let checkDate = new Date(today)
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const hasEntry = sortedEntries.some(entry => {
        const entryDate = new Date(entry.entry_date || entry.created_at || '')
        return entryDate.toDateString() === checkDate.toDateString()
      })
      
      if (hasEntry) {
        streak++
      } else if (streak > 0) {
        break // Streak broken
      }
      
      checkDate.setDate(checkDate.getDate() - 1)
    }
    
    // Calculate dominant mood
    const moodCounts = entries.reduce((acc, entry) => {
      const mood = entry.mood || entry.sentiment_data?.primary_mood
      if (mood) {
        acc[mood] = (acc[mood] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const dominantMood = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed'
    
    // Calculate business growth entries (Achievement, Growth categories)
    const growthEntries = entries.filter(entry => {
      const category = entry.category || entry.sentiment_data?.business_category
      return category === 'Achievement' || category === 'Growth' || category === 'Success'
    }).length
    
    // Calculate average confidence
    const confidenceEntries = entries.filter(entry => 
      entry.sentiment_data?.confidence && entry.sentiment_data.confidence > 0
    )
    const avgConfidence = confidenceEntries.length > 0 
      ? Math.round(confidenceEntries.reduce((sum, entry) => 
          sum + (entry.sentiment_data?.confidence || 0), 0) / confidenceEntries.length)
      : 0

    return { streak, dominantMood, growthEntries, avgConfidence }
  }

  const stats = calculateStats()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4"
            >
              <Brain className="w-8 h-8 text-orange-600" />
            </motion.div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Loading your journal</h3>
            <p className="text-slate-600">Preparing your business insights...</p>
          </div>
        </div>
      </div>
    )
  }

  // Statistics are now directly rendered in JSX

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Journal</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Track your thoughts, insights, and business learnings. AI automatically detects mood and category.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            {AIMigrationService.needsMigration() && entries.length > 0 && (
              <Button 
                onClick={() => setShowMigrationDialog(true)}
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/20"
              >
                <Brain className="w-4 h-4 mr-2" />
                Update AI Analysis
              </Button>
            )}
            <Button 
              onClick={() => setShowWriteModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Write Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.streak}</div>
                )}
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.growthEntries}</div>
                )}
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Growth Wins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-12 mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 capitalize">{stats.dominantMood}</div>
                )}
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Dominant Mood</p>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Search */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search your entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

        {/* Chronological Entries */}
        <div className="space-y-6">
          {filteredEntries.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchQuery ? 'No entries found' : 'Start your business journal'}
              </h3>
              <p className="text-slate-600 mb-4">
                {searchQuery 
                  ? 'Try a different search term or clear your search.'
                  : 'Write your first entry to begin tracking your business journey.'
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setShowWriteModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Write First Entry
                </Button>
              )}
            </Card>
          ) : (
            <>
              {/* Today's Section - Always show */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-slate-900">Today</h2>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-medium">
                    {organizedEntries.today.length} entries
                  </Badge>
                </div>
                
                {/* Today's entries or placeholder prompt */}
                {organizedEntries.today.length > 0 ? (
                  <AnimatePresence>
                    {organizedEntries.today.map((entry: JournalEntry, index: number) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className="hover:shadow-lg transition-all duration-300 cursor-pointer group border border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50/30"
                          onClick={() => handleViewEntry(entry)}
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-2xl" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </CardTitle>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-slate-500">{formatDate(entry.created_at || entry.entry_date || '')}</span>
                              {(entry.category || entry.sentiment_data?.business_category) && (
                                <Badge 
                                  variant="outline" 
                                  className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-2 py-1"
                                >
                                  {getEntryDisplayData(entry).category}
                                </Badge>
                              )}
                              {entry.sentiment_data?.energy && (
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-medium flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {getEnergyLabel(entry.sentiment_data.energy)}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 pb-4">
                            <div className="mb-3">
                              <p className="text-slate-700 leading-relaxed line-clamp-2">
                                {entry.content}
                              </p>
                              {entry.content.length > 200 && (
                                <button 
                                  className="text-orange-600 hover:text-orange-700 text-sm font-medium mt-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedEntry(entry)
                                    setShowViewModal(true)
                                  }}
                                >
                                  Read more...
                                </button>
                              )}
                            </div>
                            {entry.sentiment_data?.insights?.[0] && (
                              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 rounded-lg border p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-orange-700">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="font-semibold text-xs">AI Business Insights</span>
                                  </div>
                                  <AIAnalysisIndicator 
                                    confidence={entry.sentiment_data.confidence}
                                    source="ai"
                                    className="text-xs"
                                  />
                                </div>
                                <div className="text-xs text-gray-600 bg-white/60 rounded-lg p-2 border border-orange-200/50">
                                  <div className="flex items-start gap-2">
                                    <div className="w-1 h-1 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                                    <span className="leading-relaxed line-clamp-1">{entry.sentiment_data.insights[0]}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-8 text-center border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-all duration-300">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-orange-600" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Ready to capture today's business insights?
                          </h3>
                          <p className="text-slate-600 max-w-md mx-auto">
                            Start your day with reflection. What challenges will you tackle? What opportunities do you see? Document your entrepreneurial journey.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowWriteModal(true)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 text-base font-medium"
                        >
                          <PlusCircle className="w-5 h-5 mr-2" />
                          Write Today's Entry
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* This Week - Medium Cards */}
              {organizedEntries.thisWeek.length > 0 && (
                <div className="space-y-3 mt-8">
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-orange-50 rounded-xl border border-slate-200 hover:border-orange-200 transition-all duration-200"
                    onClick={() => toggleSection('thisWeek')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this week</h2>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs font-medium">
                        {organizedEntries.thisWeek.length} entries
                      </Badge>
                    </div>
                    {expandedSections.thisWeek ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                  
                  {expandedSections.thisWeek && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 ml-4"
                      >
                        {organizedEntries.thisWeek.map((entry: JournalEntry) => (
                          <Card 
                            key={entry.id}
                            className="hover:shadow-md transition-all duration-200 cursor-pointer group border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50/30"
                            onClick={() => handleViewEntry(entry)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <h3 className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                                <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                                {(entry.category || entry.sentiment_data?.business_category) && (
                                  <Badge className={`${getCategoryColor(entry.category || entry.sentiment_data?.business_category)} text-xs px-1.5 py-0.5`}>
                                    {entry.category || entry.sentiment_data?.business_category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-slate-600 text-sm line-clamp-1">
                                {entry.content.length > 0 ? entry.content : 'No content available'}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}

              {/* This Month - Condensed Cards */}
              {organizedEntries.thisMonth.length > 0 && (
                <div className="space-y-3 mt-8">
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-green-50 rounded-xl border border-slate-200 hover:border-green-200 transition-all duration-200"
                    onClick={() => toggleSection('thisMonth')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this month</h2>
                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-medium">
                        {organizedEntries.thisMonth.length} entries
                      </Badge>
                    </div>
                    {expandedSections.thisMonth ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                  
                  {expandedSections.thisMonth && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-4"
                      >
                        {organizedEntries.thisMonth.map((entry: JournalEntry) => (
                          <Card 
                            key={entry.id}
                            className="hover:shadow-sm transition-all duration-200 cursor-pointer group border border-slate-200 hover:border-green-300 bg-white hover:bg-green-50/30"
                            onClick={() => handleViewEntry(entry)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <h3 className="font-medium text-sm text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                                {(entry.category || entry.sentiment_data?.business_category) && (
                                  <div className={`w-2 h-2 rounded-full ${getCategoryColor(entry.category || entry.sentiment_data?.business_category).includes('bg-') ? getCategoryColor(entry.category || entry.sentiment_data?.business_category).split(' ')[1] : 'bg-slate-300'}`} 
                                       title={entry.category || entry.sentiment_data?.business_category}></div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}

              {/* This Year - Dense List */}
              {organizedEntries.thisYear.length > 0 && (
                <div className="space-y-3 mt-8">
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-purple-50 rounded-xl border border-slate-200 hover:border-purple-200 transition-all duration-200"
                    onClick={() => toggleSection('thisYear')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full"></div>
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this year</h2>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-medium">
                        {organizedEntries.thisYear.length} entries
                      </Badge>
                    </div>
                    {expandedSections.thisYear ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </Button>
                  
                  {expandedSections.thisYear && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 ml-4"
                      >
                        {organizedEntries.thisYear.map((entry: JournalEntry) => (
                          <div 
                            key={entry.id}
                            className="flex items-center gap-3 p-3 hover:bg-purple-50/50 rounded-lg cursor-pointer group transition-all duration-200 border border-transparent hover:border-purple-200"
                            onClick={() => handleViewEntry(entry)}
                          >
                            <span className="text-sm" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                              {getDisplayMoodEmoji(entry)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                {entry.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                              {(entry.category || entry.sentiment_data?.business_category) && (
                                <div className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(entry.category || entry.sentiment_data?.business_category).includes('bg-') ? getCategoryColor(entry.category || entry.sentiment_data?.business_category).split(' ')[1] : 'bg-slate-300'}`} 
                                     title={entry.category || entry.sentiment_data?.business_category}></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}

              {/* Previous Years - Ultra Dense List */}
              {Object.keys(organizedEntries.previousYears).length > 0 && 
                Object.keys(organizedEntries.previousYears)
                  .sort((a, b) => parseInt(b) - parseInt(a)) // Sort years in descending order
                  .map(year => (
                    <div key={year} className="space-y-3 mt-8">
                      <Button
                        variant="ghost"
                        className="flex items-center justify-between w-full p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200"
                        onClick={() => toggleSection(year as any)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full"></div>
                          <h2 className="text-lg font-semibold text-slate-900">{year}</h2>
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-medium">
                            {organizedEntries.previousYears[parseInt(year)].length} entries
                          </Badge>
                        </div>
                        {(expandedSections as any)[year] ? (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        )}
                      </Button>
                      
                      {(expandedSections as any)[year] && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-1 ml-4"
                          >
                            {organizedEntries.previousYears[parseInt(year)].map((entry: JournalEntry) => (
                              <div 
                                key={entry.id}
                                className="flex items-center gap-2 p-2.5 hover:bg-slate-50/80 rounded-lg cursor-pointer group transition-all duration-200 border border-transparent hover:border-slate-200"
                                onClick={() => handleViewEntry(entry)}
                              >
                                <span className="text-xs" title={entry.mood || (entry.sentiment_data && entry.sentiment_data.primary_mood) || 'No mood detected'}>
                                  {getDisplayMoodEmoji(entry)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-xs text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                    {entry.title}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <span className="text-xs">{format(new Date(entry.entry_date || entry.created_at || ''), 'MMM d')}</span>
                                  {(entry.category || (entry.sentiment_data && entry.sentiment_data.business_category)) && (
                                    <div className={`w-1 h-1 rounded-full ${getCategoryColor(entry.category || (entry.sentiment_data && entry.sentiment_data.business_category)).includes('bg-') ? getCategoryColor(entry.category || (entry.sentiment_data && entry.sentiment_data.business_category)).split(' ')[1] : 'bg-slate-300'}`} 
                                         title={entry.category || (entry.sentiment_data && entry.sentiment_data.business_category)}></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>
                  ))
              }
            </>
          )}
        </div>

      {/* Modals */}
      <SimpleCreateEntryModal
        isOpen={showWriteModal}
        onClose={() => setShowWriteModal(false)}
        onEntryCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
        }}
      />

      <ViewEntryModal
        isOpen={showViewModal}
        onClose={handleCloseModals}
        entry={selectedEntry}
        onEdit={() => {
          setShowViewModal(false)
          setShowEditModal(true)
        }}
        onDelete={handleDeleteEntry}
      />

      <EditEntryModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        entry={selectedEntry}
      />

      <AIMigrationDialog
        isOpen={showMigrationDialog}
        onClose={() => setShowMigrationDialog(false)}
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
          toast({
            title: "AI Analysis Updated",
            description: "Your journal entries have been enhanced with improved AI analysis.",
          })
        }}
      />
    </div>
  )
}