import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { BookOpen, Edit, Trash2, Clock } from "lucide-react"
import { format, isSameDay, isToday, isYesterday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns"
import type { JournalEntry } from "@/types/journal"
import { SentimentBadge } from "@/components/journal/SentimentInsights"

interface DailyEntriesViewProps {
  entries: JournalEntry[]
  selectedDate: Date | null
  onViewEntry: (entry: JournalEntry) => void
  onEditEntry: (entry: JournalEntry) => void
  onDeleteEntry: (entry: JournalEntry) => void
  isDeleting: boolean
  isSearching?: boolean // New prop to indicate if we're showing search results
}

interface GroupedEntries {
  date: Date
  entries: JournalEntry[]
  label: string
  isExpanded: boolean
}

export function DailyEntriesView({ 
  entries, 
  selectedDate, 
  onViewEntry, 
  onEditEntry, 
  onDeleteEntry,
  isDeleting,
  isSearching = false
}: DailyEntriesViewProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null)

  // Group entries by date
  const groupEntriesByDate = (): GroupedEntries[] => {
    if (selectedDate && !isSearching) {
      // If a specific date is selected and not searching, only show entries from that date
      const dateEntries = entries.filter(entry => 
        isSameDay(new Date(entry.created_at), selectedDate)
      ).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      if (dateEntries.length === 0) return []
      
      return [{
        date: selectedDate,
        entries: dateEntries,
        label: format(selectedDate, 'EEEE, MMMM d, yyyy'),
        isExpanded: true
      }]
    }

    // Group all entries by date
    const groups = new Map<string, JournalEntry[]>()
    
    entries.forEach(entry => {
      const entryDate = new Date(entry.created_at)
      const dateKey = format(entryDate, 'yyyy-MM-dd')
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, [])
      }
      groups.get(dateKey)!.push(entry)
    })

    // Convert to sorted array
    const sortedGroups: GroupedEntries[] = Array.from(groups.entries())
      .map(([dateKey, groupEntries]) => {
        const date = new Date(dateKey)
        let label = format(date, 'EEEE, MMMM d, yyyy')
        
        // Add relative date labels
        if (isToday(date)) {
          label = `Today • ${format(date, 'MMMM d')}`
        } else if (isYesterday(date)) {
          label = `Yesterday • ${format(date, 'MMMM d')}`
        } else if (isWithinInterval(date, { start: startOfWeek(new Date()), end: endOfWeek(new Date()) })) {
          label = `${format(date, 'EEEE')} • ${format(date, 'MMMM d')}`
        }

        return {
          date,
          entries: groupEntries.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
          label,
          isExpanded: isToday(date) || isYesterday(date) // Auto-expand today and yesterday
        }
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())

    return sortedGroups
  }

  const toggleDateExpansion = (dateKey: string) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey)
    } else {
      newExpanded.add(dateKey)
    }
    setExpandedDates(newExpanded)
  }

  const handleDeleteEntry = () => {
    if (entryToDelete) {
      onDeleteEntry(entryToDelete)
      setEntryToDelete(null)
    }
  }

  const groupedEntries = groupEntriesByDate()

  if (groupedEntries.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700">
        <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          {selectedDate ? "No entries for this date" : "No journal entries yet"}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {selectedDate 
            ? `No entries found for ${format(selectedDate, 'MMMM d, yyyy')}. Start writing about your day!`
            : "Start documenting your business journey by creating your first entry."
          }
        </p>
        {selectedDate && (
          <p className="text-sm text-orange-600 dark:text-orange-400">
            Click "Add Entry" above or use the floating button to create your first entry for this date.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groupedEntries.map((group) => {
        const dateKey = format(group.date, 'yyyy-MM-dd')
        const isExpanded = group.isExpanded || expandedDates.has(dateKey)

        const getCardColors = (entry: JournalEntry) => {
          const categoryColors: { [key: string]: string } = {
            'Research': 'bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/20 dark:to-sky-900/30 border-blue-200 dark:border-blue-800',
            'Planning': 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30 border-purple-200 dark:border-purple-800',
            'Strategy': 'bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/30 border-indigo-200 dark:border-indigo-800',
            'Feedback': 'bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/30 border-orange-200 dark:border-orange-800',
            'Milestone': 'bg-gradient-to-br from-yellow-50 to-gold-100 dark:from-yellow-900/20 dark:to-yellow-900/30 border-yellow-200 dark:border-yellow-800',
            'Learning': 'bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/30 border-teal-200 dark:border-teal-800',
            'Team': 'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/30 border-pink-200 dark:border-pink-800',
            'Product': 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 border-green-200 dark:border-green-800',
            'Marketing': 'bg-gradient-to-br from-emerald-50 to-lime-100 dark:from-emerald-900/20 dark:to-lime-900/30 border-emerald-200 dark:border-emerald-800',
            'Finance': 'bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/30 border-amber-200 dark:border-amber-800',
            'Personal': 'bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/30 border-rose-200 dark:border-rose-800',
          }
          
          const moodColors: { [key: string]: string } = {
            'Excited': 'bg-gradient-to-br from-orange-50 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/30 border-orange-200 dark:border-orange-800',
            'Motivated': 'bg-gradient-to-br from-green-50 to-lime-100 dark:from-green-900/20 dark:to-lime-900/30 border-green-200 dark:border-green-800',
            'Focused': 'bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-900/20 dark:to-sky-900/30 border-blue-200 dark:border-blue-800',
            'Challenged': 'bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-900/20 dark:to-orange-900/30 border-red-200 dark:border-red-800',
            'Reflective': 'bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/30 border-purple-200 dark:border-purple-800',
            'Optimistic': 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-800',
            'Grateful': 'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-900/20 dark:to-rose-900/30 border-pink-200 dark:border-pink-800',
            'Stressed': 'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/30 border-gray-200 dark:border-gray-800',
            'Confident': 'bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/30 border-violet-200 dark:border-violet-800',
            'Overwhelmed': 'bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 border-amber-200 dark:border-amber-800',
          }
          
          if (entry.category && categoryColors[entry.category]) {
            return categoryColors[entry.category]
          }
          
          if (entry.mood && moodColors[entry.mood]) {
            return moodColors[entry.mood]
          }
          
          return 'bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700'
        }

        return (
          <div key={dateKey} className="space-y-4">
              {group.entries.map((entry) => (
                <Card 
                  key={entry.id} 
                  className={`${getCardColors(entry)} hover:shadow-lg transition-all duration-200 hover:scale-[1.01] cursor-pointer`}
                  onClick={() => onViewEntry(entry)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-slate-900 dark:text-white font-semibold">
                          {entry.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          {format(new Date(entry.created_at), 'h:mm a')}
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

                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditEntry(entry)
                            }}
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEntryToDelete(entry)
                                }}
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
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? "Deleting..." : "Delete"}
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
                      className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4"
                    >
                      {entry.content.length > 200 
                        ? `${entry.content.substring(0, 200)}...` 
                        : entry.content
                      }
                      {entry.content.length > 200 && (
                        <span className="text-orange-600 font-medium ml-2">Read more</span>
                      )}
                    </p>
                    
                    {/* AI Sentiment Badge */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <SentimentBadge entry={entry} size="sm" />
                      {entry.category && (
                        <Badge variant="secondary" className="bg-white/70 text-slate-800 dark:bg-slate-800/70 dark:text-slate-200 border border-slate-300/50 dark:border-slate-600/50">
                          📁 {entry.category}
                        </Badge>
                      )}
                    </div>
                    
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
        )
      })}
    </div>
  )
}