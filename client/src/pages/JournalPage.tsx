import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Search, Calendar, Zap, X, AlertTriangle } from "lucide-react"
import { SmartSearch } from "@/components/journal/SmartSearch"
import { JournalService } from "@/lib/services/journal"
import { GoalsService } from "@/lib/services/goals"
import { supabase } from "@/lib/supabase"
import type { JournalEntry } from "@/types/journal"
import { useToast } from "@/hooks/use-toast"
import { CreateEntryModal } from "@/components/journal/CreateEntryModal"
import { EditEntryModal } from "@/components/journal/EditEntryModal"
import { ViewEntryModal } from "@/components/journal/ViewEntryModal"
import { QuickEntryModal } from "@/components/journal/QuickEntryModal"
import { CalendarView } from "@/components/journal/CalendarView"
import { DailyEntriesView } from "@/components/journal/DailyEntriesView"
import { FilterBar, type JournalFilters } from "@/components/journal/FilterBar"
import { BusinessIntelligenceDashboard } from "@/components/journal/BusinessIntelligenceDashboard"
import { WeeklySummaryModal } from "@/components/journal/WeeklySummaryModal"

export function JournalPage() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQuickModal, setShowQuickModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showWeeklySummary, setShowWeeklySummary] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null)
  const [entryToView, setEntryToView] = useState<JournalEntry | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [viewMode, setViewMode] = useState<'dashboard' | 'calendar' | 'list'>('dashboard')
  const [filters, setFilters] = useState<JournalFilters>({
    categories: [],
    moods: [],
    tags: [],
    goals: []
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

  // Fetch all journal entries
  const { data: allEntries = [], isLoading, error } = useQuery({
    queryKey: ['journal-entries', user?.id],
    queryFn: () => user ? JournalService.getUserEntries(user.id) : [],
    enabled: !!user,
  })

  // Fetch user goals for filtering
  const { data: userGoals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => user ? GoalsService.getUserGoals(user.id) : Promise.resolve([]),
    enabled: !!user
  })

  // Search entries
  const { data: searchResults = [] } = useQuery({
    queryKey: ['journal-search', user?.id, searchTerm],
    queryFn: () => user && searchTerm ? JournalService.searchEntries(user.id, searchTerm) : [],
    enabled: !!user && !!searchTerm,
  })

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: (entry: JournalEntry) => JournalService.deleteEntry(entry.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['usage-status'] })
      toast({
        title: "Entry deleted",
        description: "Journal entry has been successfully deleted.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete entry",
        variant: "destructive",
      })
    },
  })

  // Apply filters to entries
  const applyFilters = (entries: JournalEntry[]) => {
    return entries.filter(entry => {
      // Category filter
      if (filters.categories.length > 0 && (!entry.category || !filters.categories.includes(entry.category))) {
        return false
      }
      
      // Mood filter
      if (filters.moods.length > 0 && (!entry.mood || !filters.moods.includes(entry.mood))) {
        return false
      }
      
      // Tag filter (if entry has tags that match any selected tags)
      if (filters.tags.length > 0) {
        const entryTags = entry.tags || []
        const hasMatchingTag = filters.tags.some(filterTag => 
          entryTags.some(entryTag => entryTag.toLowerCase().includes(filterTag.toLowerCase()))
        )
        if (!hasMatchingTag) {
          return false
        }
      }
      
      // Goal filter (if entry is linked to selected goals)
      if (filters.goals.length > 0) {
        if (!entry.related_goal_id || !filters.goals.includes(entry.related_goal_id)) {
          return false
        }
      }
      
      return true
    })
  }

  // Determine which entries to display
  const baseEntries = searchTerm ? searchResults : allEntries
  const displayEntries = applyFilters(baseEntries)

  const handleDeleteEntry = (entry: JournalEntry) => {
    deleteEntryMutation.mutate(entry)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Clear search when selecting a date to show date-specific entries
    if (date && searchTerm) {
      setSearchTerm("")
    }
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setEntryToEdit(entry)
    setShowEditModal(true)
  }

  const handleViewEntry = (entry: JournalEntry) => {
    setEntryToView(entry)
    setShowViewModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEntryToEdit(null)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setEntryToView(null)
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    // Don't clear selected date when clearing search - keep calendar context
  }

  const handleFiltersChange = (newFilters: JournalFilters) => {
    setFilters(newFilters)
  }

  const handleWeekSummary = () => {
    setShowWeeklySummary(true)
  }

  const hasActiveFilters = filters.categories.length > 0 || 
                          filters.moods.length > 0 || 
                          filters.tags.length > 0

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Please sign in to access your journal</h1>
        </div>
      </div>
    )
  }
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Journal</h1>
              <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
                Track your progress, insights, and business learnings
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-2">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Entry
              </Button>
              <Button 
                onClick={() => setShowQuickModal(true)}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/20"
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Note
              </Button>
            </div>

          </div>
        </div>

        {/* View Mode Toggle & Quick Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'dashboard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('dashboard')}
              className={viewMode === 'dashboard' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200 text-orange-700 hover:bg-orange-50'}
            >
              Dashboard
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200 text-orange-700 hover:bg-orange-50'}
            >
              Calendar
            </Button>
          </div>
          
          {/* Simple Search */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search your entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            {(searchTerm || Object.values(filters).some(arr => arr.length > 0)) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setFilters({ categories: [], moods: [], tags: [], goals: [] })
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters (when needed) */}
        {(searchTerm || Object.values(filters).some(arr => arr.length > 0)) && (
          <div className="mb-6">
            <FilterBar
              activeFilters={filters}
              onFiltersChange={handleFiltersChange}
              allEntries={allEntries || []}
              userGoals={userGoals || []}
            />
          </div>
        )}

        {/* Main Content */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Loading your journal</h3>
            <p className="text-slate-600 dark:text-slate-400">Preparing your business insights...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Unable to load journal</h3>
            <p className="text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        ) : (
          <div className="space-y-8">


            {/* Content based on view mode and context */}
            {searchTerm || hasActiveFilters ? (
              /* Search/Filter Results View */
              <div className="space-y-6">
                <DailyEntriesView
                  entries={displayEntries}
                  selectedDate={null}
                  onViewEntry={handleViewEntry}
                  onEditEntry={handleEditEntry}
                  onDeleteEntry={handleDeleteEntry}
                  isDeleting={deleteEntryMutation.isPending}
                  isSearching={true}
                />
              </div>
            ) : viewMode === 'dashboard' ? (
              /* Business Intelligence Dashboard View */
              <BusinessIntelligenceDashboard
                entries={allEntries || []}
                onCreateEntry={() => setShowCreateModal(true)}
                onViewEntry={handleViewEntry}
                onJumpToDate={(date) => {
                  setSelectedDate(date)
                  setViewMode('calendar')
                }}
                onWeekSummary={handleWeekSummary}
              />
            ) : (
              /* Calendar View */
              <div className="space-y-8">
                <CalendarView
                  entries={displayEntries}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onCreateEntry={() => setShowCreateModal(true)}
                />

                <div className="space-y-6">
                  <DailyEntriesView
                    entries={displayEntries}
                    selectedDate={selectedDate}
                    onViewEntry={handleViewEntry}
                    onEditEntry={handleEditEntry}
                    onDeleteEntry={handleDeleteEntry}
                    isDeleting={deleteEntryMutation.isPending}
                    isSearching={false}
                  />
                </div>
              </div>
            )}
          </div>
        )}

      </div>



      {/* Modals */}
      <CreateEntryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedDate={selectedDate || undefined}
      />

      <QuickEntryModal
        isOpen={showQuickModal}
        onClose={() => setShowQuickModal(false)}
        selectedDate={selectedDate || undefined}
      />

      <EditEntryModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        entry={entryToEdit}
      />

      <ViewEntryModal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        entry={entryToView}
        onEdit={(entry) => {
          setShowViewModal(false)
          handleEditEntry(entry)
        }}
      />

      <WeeklySummaryModal
        isOpen={showWeeklySummary}
        onClose={() => setShowWeeklySummary(false)}
        entries={allEntries || []}
        goals={userGoals || []}
      />
    </>
  )
}