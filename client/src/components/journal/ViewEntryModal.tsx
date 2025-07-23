import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Clock, BookOpen, Edit, Target } from "lucide-react"
import type { JournalEntry } from "@/types/journal"
import type { Goal } from "@/types/goals"
import { format } from "date-fns"
import { SentimentInsights } from "@/components/journal/SentimentInsights"
import { useQuery } from "@tanstack/react-query"
import { GoalsService } from "@/lib/services/goals"
import { useAuth } from "@/hooks/AuthProvider"

interface ViewEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: JournalEntry | null
  onEdit?: (entry: JournalEntry) => void
}

export function ViewEntryModal({ isOpen, onClose, entry, onEdit }: ViewEntryModalProps) {
  const { user } = useAuth()
  
  // Fetch user goals to display goal information
  const { data: userGoals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => user ? GoalsService.getUserGoals(user.id) : Promise.resolve([]),
    enabled: !!user && isOpen
  })

  // Helper function to find goal by ID
  const findGoalById = (goalId: string): Goal | undefined => {
    return userGoals.find(goal => goal.id === goalId)
  }

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
                const displayCategory = entry.sentiment_data?.category ? mapBusinessCategoryToJournal(entry.sentiment_data.category) : entry.category
                
                return (
                  <div className="flex items-center gap-3">
                    {displayMood && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {displayMood}
                      </Badge>
                    )}
                    {displayCategory && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-orange-600" />
                        <span className="text-orange-600 font-medium">{displayCategory}</span>
                      </div>
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

        <CardContent className="space-y-6">
          {/* Related Goal Section */}
          {entry.related_goal_id && (() => {
            const relatedGoal = findGoalById(entry.related_goal_id)
            return relatedGoal ? (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                      Related Goal
                    </h4>
                    <p className="text-orange-700 dark:text-orange-300 font-medium mb-2">
                      {relatedGoal.title}
                    </p>
                    {relatedGoal.description && (
                      <p className="text-orange-600 dark:text-orange-400 text-sm">
                        {relatedGoal.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge 
                        variant="secondary" 
                        className="bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100"
                      >
                        {relatedGoal.priority} Priority
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300"
                      >
                        {relatedGoal.status}
                      </Badge>
                      {relatedGoal.deadline && (
                        <Badge 
                          variant="outline" 
                          className="border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300"
                        >
                          Due {format(new Date(relatedGoal.deadline), 'MMM dd')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          })()}

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