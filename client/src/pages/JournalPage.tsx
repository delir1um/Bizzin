import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search, Calendar, Zap, X } from "lucide-react"
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
    setSelectedDate(null)
  }

  const handleFiltersChange = (newFilters: JournalFilters) => {
    setFilters(newFilters)
  }

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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search journal entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 focus:ring-orange-500 focus:border-orange-500"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
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
            {/* Calendar Section */}
            <CalendarView
              entries={displayEntries}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onCreateEntry={() => setShowCreateModal(true)}
            />

            {/* Selected Date Entries Section */}
            <div className="space-y-6">
              <DailyEntriesView
                entries={displayEntries}
                selectedDate={selectedDate}
                onViewEntry={handleViewEntry}
                onEditEntry={handleEditEntry}
                onDeleteEntry={handleDeleteEntry}
                isDeleting={deleteEntryMutation.isPending}
              />
            </div>
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