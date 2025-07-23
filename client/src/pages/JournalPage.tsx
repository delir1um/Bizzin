import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PlusCircle, Search, Calendar, BookOpen, Edit, Trash2, Clock, Filter, X } from "lucide-react"
import { JournalService } from "@/lib/services/journal"
import { supabase } from "@/lib/supabase"
import type { JournalEntry } from "@/types/journal"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { CreateEntryModal } from "@/components/journal/CreateEntryModal"
import { EditEntryModal } from "@/components/journal/EditEntryModal"
import { ViewEntryModal } from "@/components/journal/ViewEntryModal"
import { DateFilterModal } from "@/components/journal/DateFilterModal"

export function JournalPage() {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null)
  const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null)
  const [entryToView, setEntryToView] = useState<JournalEntry | null>(null)
  const [dateFilter, setDateFilter] = useState<{
    startDate: string
    endDate: string
    label: string
  } | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const entriesPerPage = 10
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

  // Fetch journal entries
  const { data: entries = [], isLoading, error } = useQuery({
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

  // Date filtered entries
  const { data: dateFilteredEntries = [] } = useQuery({
    queryKey: ['journal-date-filter', user?.id, dateFilter?.startDate, dateFilter?.endDate],
    queryFn: () => user && dateFilter 
      ? JournalService.getEntriesByDateRange(user.id, dateFilter.startDate, dateFilter.endDate)
      : [],
    enabled: !!user && !!dateFilter,
  })

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => JournalService.deleteEntry(entryId),
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

  // Determine which entries to display
  const allEntries = searchTerm ? searchResults : (dateFilter ? dateFilteredEntries : entries)
  
  // Pagination
  const totalPages = Math.ceil(allEntries.length / entriesPerPage)
  const paginatedEntries = allEntries.slice(currentPage * entriesPerPage, (currentPage + 1) * entriesPerPage)
  const displayEntries = paginatedEntries

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm, dateFilter])

  const handleDeleteEntry = () => {
    if (entryToDelete) {
      deleteEntryMutation.mutate(entryToDelete.id)
      setEntryToDelete(null)
    }
  }

  const handleApplyDateFilter = (startDate: string, endDate: string, label: string) => {
    setDateFilter({ startDate, endDate, label })
    setSearchTerm("") // Clear search when applying date filter
  }

  const handleClearDateFilter = () => {
    setDateFilter(null)
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

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
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
          <div className="mt-4 sm:mt-0">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search journal entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          onClick={() => setShowDateFilter(true)}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Filter by Date
          {dateFilter && (
            <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {dateFilter.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearDateFilter()
                }}
                className="h-auto p-0 ml-1 text-orange-600 hover:text-orange-800"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
        </Button>
      </div>

      {/* Journal Entries */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white dark:bg-slate-800 animate-pulse">
              <CardHeader>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">Error loading journal entries: {error.message}</p>
        </div>
      ) : displayEntries.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {searchTerm ? "No entries found" : "No journal entries yet"}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {searchTerm 
              ? `No entries match "${searchTerm}". Try a different search term.`
              : "Start documenting your business journey by creating your first entry."
            }
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Your First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {displayEntries.map((entry: JournalEntry) => (
            <Card key={entry.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-slate-900 dark:text-white">
                      {entry.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      {format(new Date(entry.created_at), 'MMM dd, yyyy')}
                      {entry.reading_time && (
                        <>
                          •
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.reading_time} min read
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {entry.category && (
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-600 font-medium">{entry.category}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditEntry(entry)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                            onClick={() => setEntryToDelete(entry)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{entry.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteEntry}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteEntryMutation.isPending}
                            >
                              {deleteEntryMutation.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p 
                  className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  onClick={() => handleViewEntry(entry)}
                >
                  {entry.content.length > 200 
                    ? `${entry.content.substring(0, 200)}...` 
                    : entry.content
                  }
                  {entry.content.length > 200 && (
                    <span className="text-orange-600 font-medium ml-2">Read more</span>
                  )}
                </p>
                
                {/* Mood Badge */}
                {entry.mood && (
                  <div className="mb-4">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {entry.mood}
                    </Badge>
                  </div>
                )}
                
                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {allEntries.length > entriesPerPage && (
        <div className="mt-12 flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing {currentPage * entriesPerPage + 1} to {Math.min((currentPage + 1) * entriesPerPage, allEntries.length)} of {allEntries.length} entries
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i)}
                  className={currentPage === i ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Entry Modal */}
      <CreateEntryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Entry Modal */}
      <EditEntryModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        entry={entryToEdit}
      />

      {/* View Entry Modal */}
      <ViewEntryModal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        entry={entryToView}
        onEdit={(entry) => {
          setShowViewModal(false)
          handleEditEntry(entry)
        }}
      />

      {/* Date Filter Modal */}
      <DateFilterModal
        isOpen={showDateFilter}
        onClose={() => setShowDateFilter(false)}
        onApplyFilter={handleApplyDateFilter}
        onClearFilter={handleClearDateFilter}
      />
    </div>
  )
}