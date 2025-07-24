import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Clock, BookOpen, Edit } from "lucide-react"
import type { JournalEntry } from "@/types/journal"

import { format } from "date-fns"
import { SentimentInsights } from "@/components/journal/SentimentInsights"
import { useAuth } from "@/hooks/AuthProvider"

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white pr-4 mb-3">
              {entry.title}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span>{format(new Date(entry.created_at), 'MMMM dd, yyyy • h:mm a')}</span>
              {entry.reading_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {entry.reading_time} min read
                </span>
              )}
              {/* Show mood and category from AI analysis or manual entry */}
              {(() => {
                // Helper function to map AI moods to journal moods
                const mapAIMoodToJournal = (aiMood: string): string => {
                  const mapping: Record<string, string> = {
                    'optimistic': 'Optimistic',
                    'excited': 'Excited',
                    'focused': 'Focused',
                    'frustrated': 'Frustrated',
                    'reflective': 'Reflective',
                    'confident': 'Confident',
                    'determined': 'Determined',
                    'accomplished': 'Motivated',
                    'uncertain': 'Thoughtful',
                    'stressed': 'Frustrated',
                    'neutral': 'Neutral',
                    'inspired': 'Inspired'
                  }
                  
                  const mapped = mapping[aiMood.toLowerCase()]
                  if (mapped) return mapped
                  
                  return aiMood.charAt(0).toUpperCase() + aiMood.slice(1).toLowerCase()
                }

                // Helper function to map AI business categories to journal categories
                const mapBusinessCategoryToJournal = (businessCategory: string): string => {
                  const mapping: Record<string, string> = {
                    'growth': 'Strategy',
                    'challenge': 'Research',
                    'achievement': 'Milestone',
                    'planning': 'Planning',
                    'reflection': 'Learning'
                  }
                  return mapping[businessCategory] || 'Strategy'
                }
                
                // Determine display mood and category (prioritize AI values, map them properly)
                const displayMood = entry.sentiment_data?.primary_mood ? mapAIMoodToJournal(entry.sentiment_data.primary_mood) : entry.mood
                const displayCategory = entry.sentiment_data?.business_category ? mapBusinessCategoryToJournal(entry.sentiment_data.business_category) : entry.category
                
                return (
                  <div className="flex items-center gap-2">
                    {displayMood && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                        {displayMood}
                      </Badge>
                    )}
                    {displayCategory && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 font-medium">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {displayCategory}
                      </Badge>
                    )}
                  </div>
                )
              })()}
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

        <CardContent className="p-8 space-y-8">
          {/* Journal Content - Prominent and Journal-like */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 border-l-4 border-orange-500">
            <div className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">
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