import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search, Calendar, Zap, X } from "lucide-react"
import { SmartSearch } from "@/components/journal/SmartSearch"
import { JournalService } from "@/lib/services/journal"
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
import { JournalDashboard } from "@/components/journal/JournalDashboard"

export function JournalPage() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showQuickModal, setShowQuickModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null)
  const [entryToView, setEntryToView] = useState<JournalEntry | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [viewMode, setViewMode] = useState<'dashboard' | 'calendar' | 'list'>('dashboard')
  const [filters, setFilters] = useState<JournalFilters>({
    categories: [],
    moods: [],
    tags: []
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

          </div>
        </div>

        {/* Smart Search */}
        <div className="mb-6">
          <SmartSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            entries={allEntries || []}
            onQuickFilter={(filter) => {
              if (filter.type === 'recent') {
                // Filter recent entries in the last 7 days
                setSearchTerm("")
                setFilters(prev => ({ ...prev, categories: [], moods: [], tags: [] }))
                // Could add date range filtering here
              } else if (filter.type === 'energy') {
                setFilters(prev => ({ ...prev, moods: [], categories: [], tags: [] }))
                // Could add energy level filtering
              } else if (filter.type === 'mood' && filter.value) {
                setFilters(prev => ({ ...prev, moods: [filter.value!], categories: [], tags: [] }))
              } else if (filter.type === 'category' && filter.value) {
                setFilters(prev => ({ ...prev, categories: [filter.value!], moods: [], tags: [] }))
              }
            }}
          />
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            activeFilters={filters}
            onFiltersChange={handleFiltersChange}
            allEntries={allEntries || []}
          />
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading your journal...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Error loading journal entries: {error.message}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* View Mode Navigation */}
            {!searchTerm && !hasActiveFilters && (
              <div className="flex items-center gap-2 mb-6">
                <Button 
                  variant={viewMode === 'dashboard' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('dashboard')
                    setSelectedDate(null)
                  }}
                  className={viewMode === 'dashboard' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950'}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  onClick={() => {
                    setViewMode('calendar')
                    setSelectedDate(new Date())
                  }}
                  className={viewMode === 'calendar' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950'}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </Button>
              </div>
            )}

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
              /* Dashboard View */
              <JournalDashboard
                entries={allEntries || []}
                onCreateEntry={() => setShowCreateModal(true)}
                onViewEntry={handleViewEntry}
                onJumpToDate={(date) => {
                  setSelectedDate(date)
                  setViewMode('calendar')
                }}
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
    </>
  )
}