import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, BookOpen, Calendar, Brain, ChevronDown, ChevronRight } from "lucide-react"
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

export function JournalPage() {
  const [user, setUser] = useState<any>(null)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState({
    thisWeek: false,
    thisMonth: false,
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
    const weekAgo = subWeeks(now, 1)
    const monthAgo = subMonths(now, 1)

    return {
      today: entries.filter(entry => isToday(new Date(entry.created_at || entry.entry_date || ''))),
      thisWeek: entries.filter(entry => {
        const entryDate = new Date(entry.created_at || entry.entry_date || '')
        return !isToday(entryDate) && isThisWeek(entryDate) && entryDate >= weekAgo
      }),
      thisMonth: entries.filter(entry => {
        const entryDate = new Date(entry.created_at || entry.entry_date || '')
        return !isThisWeek(entryDate) && isThisMonth(entryDate) && entryDate >= monthAgo
      }),
      thisYear: entries.filter(entry => {
        const entryDate = new Date(entry.created_at || entry.entry_date || '')
        return !isThisMonth(entryDate) && isThisYear(entryDate)
      })
    }
  }

  const organizedEntries = organizeEntriesByTime(filteredEntries)

  const toggleSection = (section: 'thisWeek' | 'thisMonth' | 'thisYear') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Helper function to get mood emoji
  const getMoodEmoji = (mood: string | null | undefined): string => {
    if (!mood) return '📝'
    
    const moodEmojis: Record<string, string> = {
      // Lowercase versions
      'optimistic': '😊',
      'frustrated': '😤', 
      'focused': '🎯',
      'reflective': '🤔',
      'confident': '💪',
      'excited': '⚡',
      'determined': '🔥',
      'accomplished': '🏆',
      'thoughtful': '🤔',
      'curious': '🤔',
      'sad': '😢',
      'tired': '😴',
      // Capitalized versions (from AI)
      'Optimistic': '😊',
      'Frustrated': '😤', 
      'Focused': '🎯',
      'Reflective': '🤔',
      'Confident': '💪',
      'Excited': '⚡',
      'Determined': '🔥',
      'Accomplished': '🏆',
      'Thoughtful': '🤔',
      'Curious': '🤔',
      'Sad': '😢',
      'Tired': '😴'
    }
    
    return moodEmojis[mood] || moodEmojis[mood.toLowerCase()] || '📝'
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
    // For short content, go directly to edit
    if (entry.content.length <= 300) {
      handleEditEntry(entry)
    } else {
      // For long content, show view modal first
      setSelectedEntry(entry)
      setShowViewModal(true)
    }
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setShowEditModal(true)
  }

  const handleCloseModals = () => {
    setShowViewModal(false)
    setShowEditModal(false)
    setSelectedEntry(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Business Journal</h1>
              <p className="text-slate-600">
                Track your thoughts, insights, and business learnings. AI automatically detects mood and category.
              </p>
            </div>
            <div className="flex gap-3">
              {AIMigrationService.needsMigration() && entries.length > 0 && (
                <Button 
                  onClick={() => setShowMigrationDialog(true)}
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
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

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search your entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{entries.length}</p>
                  <p className="text-sm text-slate-600">Total Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{getThisWeekCount()}</p>
                  <p className="text-sm text-slate-600">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Brain className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{getAIAnalyzedCount()}</p>
                  <p className="text-sm text-slate-600">AI Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              {/* Today's Entries - Full Cards */}
              {organizedEntries.today.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Today</h2>
                  <AnimatePresence>
                    {organizedEntries.today.map((entry: JournalEntry, index: number) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card 
                          className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-orange-200 hover:border-orange-400"
                          onClick={() => handleViewEntry(entry)}
                        >
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-2xl" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getMoodEmoji(entry.mood || entry.sentiment_data?.primary_mood)}
                                </span>
                                <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </CardTitle>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                              {(entry.category || entry.sentiment_data?.business_category) && (
                                <Badge className={`${getCategoryColor(entry.category || entry.sentiment_data?.business_category)} text-xs px-2 py-0.5`}>
                                  {entry.category || entry.sentiment_data.business_category}
                                </Badge>
                              )}
                              {entry.sentiment_data?.energy && (
                                <span className="flex items-center gap-1 text-xs">
                                  {getEnergyEmoji(entry.sentiment_data.energy)}
                                  <span className="capitalize">{entry.sentiment_data.energy} Energy</span>
                                </span>
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
                              <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                                <div className="flex items-start gap-2">
                                  <span className="text-lg">💡</span>
                                  <div className="flex-1">
                                    <p className="text-sm text-orange-800 font-medium line-clamp-1">
                                      {entry.sentiment_data.insights[0]}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* This Week - Medium Cards */}
              {organizedEntries.thisWeek.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-3 hover:bg-slate-100 rounded-lg"
                    onClick={() => toggleSection('thisWeek')}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this week</h2>
                      <Badge variant="secondary" className="text-xs">
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
                            className="hover:shadow-md transition-all duration-200 cursor-pointer group border-l-2 border-orange-100 hover:border-orange-300"
                            onClick={() => handleViewEntry(entry)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getMoodEmoji(entry.mood || entry.sentiment_data?.primary_mood)}
                                </span>
                                <h3 className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                                <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                                {(entry.category || entry.sentiment_data?.business_category) && (
                                  <Badge className={`${getCategoryColor(entry.category || entry.sentiment_data?.business_category)} text-xs px-1.5 py-0.5`}>
                                    {entry.category || entry.sentiment_data.business_category}
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
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-3 hover:bg-slate-100 rounded-lg"
                    onClick={() => toggleSection('thisMonth')}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this month</h2>
                      <Badge variant="secondary" className="text-xs">
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
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4"
                      >
                        {organizedEntries.thisMonth.map((entry: JournalEntry) => (
                          <Card 
                            key={entry.id}
                            className="hover:shadow-sm transition-all duration-200 cursor-pointer group border-l border-orange-100 hover:border-orange-200"
                            onClick={() => handleViewEntry(entry)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                                  {getMoodEmoji(entry.mood || entry.sentiment_data?.primary_mood)}
                                </span>
                                <h3 className="font-medium text-sm text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                  {entry.title}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                                {(entry.category || entry.sentiment_data?.business_category) && (
                                  <div className={`w-2 h-2 rounded-full ${getCategoryColor(entry.category || entry.sentiment_data?.business_category).includes('bg-') ? getCategoryColor(entry.category || entry.sentiment_data?.business_category).split(' ')[1] : 'bg-slate-300'}`} 
                                       title={entry.category || entry.sentiment_data.business_category}></div>
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
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="flex items-center justify-between w-full p-3 hover:bg-slate-100 rounded-lg"
                    onClick={() => toggleSection('thisYear')}
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">Earlier this year</h2>
                      <Badge variant="secondary" className="text-xs">
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
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer group transition-colors"
                            onClick={() => handleViewEntry(entry)}
                          >
                            <span className="text-sm" title={entry.mood || entry.sentiment_data?.primary_mood || 'No mood detected'}>
                              {getMoodEmoji(entry.mood || entry.sentiment_data?.primary_mood)}
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
                                     title={entry.category || entry.sentiment_data.business_category}></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              )}
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