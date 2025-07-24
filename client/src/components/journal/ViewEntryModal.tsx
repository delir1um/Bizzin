import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Clock, BookOpen, Edit, Zap } from "lucide-react"
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

  // Helper function to get mood emoji
  const getMoodEmoji = (mood: string | null | undefined): string => {
    if (!mood) return '📝'
    
    const moodEmojis: Record<string, string> = {
      // Lowercase versions
      'optimistic': '😊',
      'frustrated': '😤', 
      'focused': '🎯',
      'reflective': '🤔',
      'confident': '💪',
      'excited': '⚡',
      'determined': '🔥',
      'accomplished': '🏆',
      'thoughtful': '🤔',
      'curious': '🤔',
      'sad': '😢',
      'tired': '😴',
      'conflicted': '😔',
      // Capitalized versions (from AI)
      'Optimistic': '😊',
      'Frustrated': '😤', 
      'Focused': '🎯',
      'Reflective': '🤔',
      'Confident': '💪',
      'Excited': '⚡',
      'Determined': '🔥',
      'Accomplished': '🏆',
      'Thoughtful': '🤔',
      'Curious': '🤔',
      'Sad': '😢',
      'Tired': '😴',
      'Conflicted': '😔'
    }
    
    return moodEmojis[mood] || moodEmojis[mood.toLowerCase()] || '📝'
  }

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
      'inspired': 'Inspired',
      'conflicted': 'Conflicted'
    }
    
    const mapped = mapping[aiMood.toLowerCase()]
    if (mapped) return mapped
    
    return aiMood.charAt(0).toUpperCase() + aiMood.slice(1).toLowerCase()
  }

  // Helper function to map AI business categories to journal categories
  const mapBusinessCategoryToJournal = (businessCategory: string): string => {
    const mapping: Record<string, string> = {
      'growth': 'Strategy',
      'challenge': 'Challenge',
      'achievement': 'Milestone',
      'planning': 'Planning',
      'reflection': 'Learning'
    }
    return mapping[businessCategory] || 'Strategy'
  }

  if (!isOpen || !entry) return null

  // Get display values
  const displayMood = entry.sentiment_data?.primary_mood ? mapAIMoodToJournal(entry.sentiment_data.primary_mood) : entry.mood
  const displayCategory = entry.sentiment_data?.business_category ? mapBusinessCategoryToJournal(entry.sentiment_data.business_category) : entry.category
  const displayEnergy = entry.sentiment_data?.energy || 'medium'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            {/* Title with mood emoji */}
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white pr-4 mb-3 flex items-center gap-2">
              <span className="text-2xl">{getMoodEmoji(displayMood)}</span>
              {entry.title}
            </CardTitle>
            
            {/* Date */}
            <div className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              {format(new Date(entry.created_at), 'MMMM dd, yyyy • h:mm a')}
            </div>
            
            {/* Category and Energy badges */}
            <div className="flex items-center gap-2 mb-2">
              {displayCategory && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 font-medium">
                  {displayCategory}
                </Badge>
              )}
              {displayEnergy && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {displayEnergy.charAt(0).toUpperCase() + displayEnergy.slice(1)} Energy
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