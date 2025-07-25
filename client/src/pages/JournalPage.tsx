import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, BookOpen, Calendar, Brain, ChevronDown, ChevronRight, Flame, TrendingUp, Heart, Sparkles, Zap, X } from "lucide-react"
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
import { usePlans } from "@/hooks/usePlans"
import { UpgradeModal } from "@/components/plans/UpgradeModal"

export function JournalPage() {
  const [user, setUser] = useState<any>(null)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    thisWeek: false,  // Start collapsed by default
    thisMonth: false,
    thisYear: false
  })
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // Get plan information
  const { usageStatus, canCreateJournalEntry, getRemainingQuota, isPremium, isFree } = usePlans()

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
  const filteredEntries = entries.filter((entry: JournalEntry) => {
    const query = searchQuery.toLowerCase()
    const titleMatch = entry.title.toLowerCase().includes(query)
    const contentMatch = entry.content.toLowerCase().includes(query)
    
    // Check category from multiple sources
    const category = entry.category || entry.sentiment_data?.business_category || ''
    const categoryMatch = category.toLowerCase().includes(query)
    
    // Check mood for additional searchability
    const mood = entry.mood || entry.sentiment_data?.primary_mood || ''
    const moodMatch = mood.toLowerCase().includes(query)
    
    return titleMatch || contentMatch || categoryMatch || moodMatch
  })

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

  // Use proper plan system data

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



  // All mood, category, and energy display logic is now handled by centralized getEntryDisplayData function

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

  // Check if user can create new entries
  const canCreateEntry = () => {
    return canCreateJournalEntry
  }

  // Handle create entry with limits check
  const handleCreateEntry = () => {
    if (canCreateEntry()) {
      setShowWriteModal(true)
    } else {
      setShowUpgradeModal(true)
    }
  }

  // Check if user is approaching limits (80% usage)
  const isApproachingLimit = () => {
    if (!usageStatus || isPremium) return false
    const used = usageStatus.current_usage.journal_entries_created
    const limit = usageStatus.plan_limits.monthly_journal_entries
    return (used / limit) >= 0.8
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

  const handleCollapseAll = () => {
    setExpandedSections({
      thisWeek: false,
      thisMonth: false,
      thisYear: false
    })
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
    <div 
      className="min-h-screen"
      onClick={(e) => {
        // Collapse all sections when clicking outside entries
        const target = e.target as HTMLElement
        const isEntryCard = target.closest('[data-entry-card]')
        const isSectionHeader = target.closest('[data-section-header]')
        const isButton = target.closest('button')
        const isInput = target.closest('input')
        const isModal = target.closest('[role="dialog"]')
        
        if (!isEntryCard && !isSectionHeader && !isButton && !isInput && !isModal) {
          handleCollapseAll()
        }
      }}
    >
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
              onClick={handleCreateEntry}
              className={`${canCreateEntry() 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-slate-400 hover:bg-slate-500 text-white'} 
                ${isApproachingLimit() ? 'ring-2 ring-yellow-400' : ''}`}
              disabled={!canCreateEntry() && !isPremium}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              {canCreateEntry() ? 'Write Entry' : 'Upgrade to Write More'}
            </Button>
          </div>
        </div>
      </div>

      {/* Usage Warning Banner */}
      {isApproachingLimit() && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Sparkles className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800">
                You're approaching your monthly limit
              </h3>
              <p className="text-sm text-yellow-700">
                {usageStatus && 
                  `${usageStatus.current_usage.journal_entries_created} of ${usageStatus.plan_limits.monthly_journal_entries} entries used this month. `
                }
                Upgrade to Premium for unlimited entries.
              </p>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      )}

      {/* Usage Stats for Free Users */}
      {isFree && usageStatus && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-full">
                <BookOpen className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Monthly Journal Entries</h3>
                <p className="text-sm text-slate-600">
                  {usageStatus.current_usage.journal_entries_created} of {usageStatus.plan_limits.monthly_journal_entries} entries used
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700">
                {usageStatus.plan_limits.monthly_journal_entries - usageStatus.current_usage.journal_entries_created} remaining
              </div>
              <div className="w-32 bg-slate-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (usageStatus.current_usage.journal_entries_created / usageStatus.plan_limits.monthly_journal_entries) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
            className="pl-10 pr-10 focus:ring-orange-500 focus:border-orange-500"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 rounded-full"
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </Button>
          )}
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
                          data-entry-card
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
                          onClick={handleCreateEntry}
                          className={`${canCreateEntry() 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                            : 'bg-slate-400 hover:bg-slate-500 text-white'} 
                            px-6 py-3 text-base font-medium`}
                          disabled={!canCreateEntry() && !isPremium}
                        >
                          <PlusCircle className="w-5 h-5 mr-2" />
                          {canCreateEntry() ? "Write Today's Entry" : 'Upgrade for More Entries'}
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
                    data-section-header
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
                            data-entry-card
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
                                {getEntryDisplayData(entry).category && (
                                  <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs px-1.5 py-0.5">
                                    {getEntryDisplayData(entry).category}
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
                    data-section-header
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
                            data-entry-card
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
                                {getEntryDisplayData(entry).category && (
                                  <div className="w-2 h-2 rounded-full bg-orange-200" 
                                       title={getEntryDisplayData(entry).category}></div>
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
                    data-section-header
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
                            data-entry-card
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
                              {getEntryDisplayData(entry).category && (
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-200" 
                                     title={getEntryDisplayData(entry).category}></div>
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
                                  {getEntryDisplayData(entry).category && (
                                    <div className="w-1 h-1 rounded-full bg-orange-200" 
                                         title={getEntryDisplayData(entry).category}></div>
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  )
}