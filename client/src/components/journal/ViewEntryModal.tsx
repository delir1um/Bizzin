import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { X, Clock, BookOpen, Edit, Zap, Trash2 } from "lucide-react"
import type { JournalEntry } from "@/types/journal"

import { format } from "date-fns"
import { SentimentInsights } from "@/components/journal/SentimentInsights"
import { useAuth } from "@/hooks/AuthProvider"
import { getEntryDisplayData } from "@/lib/journalDisplayUtils"

interface ViewEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: JournalEntry | null
  onEdit?: (entry: JournalEntry) => void
  onDelete?: (entry: JournalEntry) => void
}

export function ViewEntryModal({ isOpen, onClose, entry, onEdit, onDelete }: ViewEntryModalProps) {

  if (!isOpen || !entry) return null

  // Get display values using centralized utility
  const displayData = getEntryDisplayData(entry)

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={(e) => {
        // Close modal when clicking outside the card
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 mx-2 sm:mx-0">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 pb-4 sm:pb-6 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <div className="flex-1">
            {/* Title with mood emoji */}
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white pr-0 sm:pr-4 mb-2 sm:mb-3 flex items-center gap-2 leading-tight">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xl sm:text-2xl cursor-default">{displayData.moodEmoji}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-sm capitalize">
                      {displayData.mood || 'Neutral'} mood
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {entry.title}
            </CardTitle>
            
            {/* Date */}
            <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {format(new Date(entry.created_at), 'MMMM dd, yyyy • h:mm a')}
            </div>
            
            {/* Category and Energy badges */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
              {displayData.category && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 font-medium">
                  {displayData.category}
                </Badge>
              )}
              {displayData.energy && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {displayData.energy.charAt(0).toUpperCase() + displayData.energy.slice(1)} Energy
                </Badge>
              )}
              {entry.reading_time && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {entry.reading_time} min read
                </Badge>
              )}
            </div>
            

          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-2 w-full sm:w-auto justify-end sm:justify-start">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(entry)}
                className="text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white min-h-[44px] text-sm px-3 sm:px-4"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:text-red-300 min-h-[44px] text-sm px-3 sm:px-4"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this journal entry? This action cannot be undone and will permanently remove the entry and all its insights.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(entry)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete Entry
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Journal Content - Prominent and Journal-like */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 sm:p-6 border-l-4 border-orange-500">
            <div className="text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
              {entry.content}
            </div>
          </div>

          {/* AI Business Insights */}
          <SentimentInsights entry={entry} />

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs sm:text-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Footer Info - Only show if updated */}
          {entry.updated_at !== entry.created_at && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Last updated {format(new Date(entry.updated_at), 'MMM dd, yyyy')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}