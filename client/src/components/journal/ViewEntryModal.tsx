import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Clock, BookOpen, Edit } from "lucide-react"
import type { JournalEntry } from "@/types/journal"
import { format } from "date-fns"
import { SentimentInsights } from "@/components/journal/SentimentInsights"

interface ViewEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: JournalEntry | null
  onEdit?: (entry: JournalEntry) => void
}

export function ViewEntryModal({ isOpen, onClose, entry, onEdit }: ViewEntryModalProps) {
  if (!isOpen || !entry) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <CardTitle className="text-2xl text-slate-900 dark:text-white pr-4">
              {entry.title}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-slate-600 dark:text-slate-400">
              <span>{format(new Date(entry.created_at), 'MMMM dd, yyyy • h:mm a')}</span>
              {entry.reading_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {entry.reading_time} min read
                </span>
              )}
              {entry.category && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-600 font-medium">{entry.category}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(entry)}
                className="text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mood Badge */}
          {entry.mood && (
            <div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {entry.mood}
              </Badge>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </div>
          </div>

          {/* AI Business Insights */}
          <SentimentInsights entry={entry} />

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Created on {format(new Date(entry.created_at), 'EEEE, MMMM dd, yyyy')}
              {entry.updated_at !== entry.created_at && (
                <span> • Last updated {format(new Date(entry.updated_at), 'MMM dd, yyyy')}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}