import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { BookOpen, Edit, Trash2, Clock } from "lucide-react"
import { format, isSameDay, isToday, isYesterday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns"
import type { JournalEntry } from "@/types/journal"

interface DailyEntriesViewProps {
  entries: JournalEntry[]
  selectedDate: Date | null
  onViewEntry: (entry: JournalEntry) => void
  onEditEntry: (entry: JournalEntry) => void
  onDeleteEntry: (entry: JournalEntry) => void
  isDeleting: boolean
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
  isDeleting 
}: DailyEntriesViewProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null)

  // Group entries by date
  const groupEntriesByDate = (): GroupedEntries[] => {
    if (selectedDate) {
      // If a specific date is selected, only show entries from that date
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

        return (
          <div key={dateKey} className="space-y-4">
              {group.entries.map((entry) => (
                <Card 
                  key={entry.id} 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-slate-900 dark:text-white">
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
                            onClick={() => onEditEntry(entry)}
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
                      className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      onClick={() => onViewEntry(entry)}
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
        )
      })}
    </div>
  )
}