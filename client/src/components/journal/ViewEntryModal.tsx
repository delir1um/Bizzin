import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Clock, BookOpen, Edit, Target, Brain, Zap, Sparkles } from "lucide-react"
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

          {/* Compact Bottom Section - Related Goal and AI Insights Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Related Goal - Compact Version */}
            {entry.related_goal_id && (() => {
              const relatedGoal = findGoalById(entry.related_goal_id)
              return relatedGoal ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 text-sm">
                      Related Goal
                    </h4>
                  </div>
                  <p className="text-orange-700 dark:text-orange-300 font-medium text-sm mb-2">
                    {relatedGoal.title}
                  </p>
                  {relatedGoal.description && (
                    <p className="text-orange-600 dark:text-orange-400 text-xs mb-3 line-clamp-2">
                      {relatedGoal.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge 
                      variant="secondary" 
                      className="bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100 text-xs px-2 py-0.5"
                    >
                      {relatedGoal.priority} Priority
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300 text-xs px-2 py-0.5"
                    >
                      {relatedGoal.status}
                    </Badge>
                    {relatedGoal.deadline && (
                      <Badge 
                        variant="outline" 
                        className="border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300 text-xs px-2 py-0.5"
                      >
                        Due {format(new Date(relatedGoal.deadline), 'MMM dd')}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : null
            })()}

            {/* AI Business Insights - Compact Version */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-orange-700">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-semibold text-sm">AI Business Insights</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-green-100 text-green-700 border-green-200"
                  >
                    <Brain className="w-3 h-3 mr-1" />
                    AI Analyzed • {Math.round(entry.sentiment_data?.confidence || 0)}%
                  </Badge>
                </div>
              </div>
              
              {entry.sentiment_data?.energy && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs">High Energy</span>
                </div>
              )}
              
              {entry.sentiment_data?.insights && entry.sentiment_data.insights.length > 0 && (
                <div className="text-xs text-gray-700">
                  <p className="line-clamp-2">
                    {entry.sentiment_data.insights[0]}
                  </p>
                </div>
              )}
            </div>
          </div>

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