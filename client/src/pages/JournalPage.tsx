import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, BookOpen, Calendar, Brain } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import type { JournalEntry } from "@/types/journal"
import { SimpleCreateEntryModal } from "@/components/journal/SimpleCreateEntryModal"
import { ViewEntryModal } from "@/components/journal/ViewEntryModal"
import { EditEntryModal } from "@/components/journal/EditEntryModal"
import { motion, AnimatePresence } from "framer-motion"

export function JournalPage() {
  const [user, setUser] = useState<any>(null)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
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

  // Filter entries based on search
  const filteredEntries = entries.filter((entry: JournalEntry) =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper function to get mood emoji
  const getMoodEmoji = (mood: string | null | undefined): string => {
    if (!mood) return '📝'
    
    const moodEmojis: Record<string, string> = {
      'optimistic': '😊',
      'frustrated': '😤', 
      'focused': '🎯',
      'reflective': '🤔',
      'confident': '💪',
      'excited': '⚡',
      'determined': '🔥',
      'accomplished': '🏆',
      'uncertain': '😕',
      'stressed': '😰',
      'neutral': '😐',
      'inspired': '✨',
      'content': '😌',
      'concerned': '😟',
      'overwhelmed': '😵‍💫',
      'sad': '😢',
      'tired': '😴'
    }
    
    return moodEmojis[mood.toLowerCase()] || '📝'
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
      'tired': 'text-slate-700 bg-slate-50'
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
            <Button 
              onClick={() => setShowWriteModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Write Entry
            </Button>
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

        {/* Entries */}
        <div className="space-y-4">
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
            <AnimatePresence>
              {filteredEntries.map((entry: JournalEntry, index: number) => (
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
                      {/* Header with Emoji + Title + AI Confidence */}
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

                      {/* Metadata Row */}
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>{formatDate(entry.created_at || entry.entry_date || '')}</span>
                        {entry.reading_time && (
                          <span>• {entry.reading_time} min read</span>
                        )}
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
                      {/* Content Preview */}
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

                      {/* AI Insight Bar */}
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
    </div>
  )
}