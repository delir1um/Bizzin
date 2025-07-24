import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, TrendingUp, Zap, Heart, Sparkles } from "lucide-react"
import { getMoodColor, getMoodEmoji } from "@/lib/sentimentAnalysis"
import { AIAnalysisIndicator } from "@/components/journal/AIAnalysisIndicator"
import type { JournalEntry } from "@/types/journal"

interface SentimentInsightsProps {
  entry: JournalEntry
  className?: string
}

export function SentimentInsights({ entry, className = "" }: SentimentInsightsProps) {
  const sentiment = entry.sentiment_data
  
  if (!sentiment) {
    return null
  }

  const moodColor = getMoodColor(sentiment.primary_mood)
  const moodEmoji = getMoodEmoji(sentiment.primary_mood)
  
  // Energy level display
  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case 'high': return <Zap className="w-4 h-4 text-yellow-500" />
      case 'medium': return <TrendingUp className="w-4 h-4 text-orange-500" />
      case 'low': return <Heart className="w-4 h-4 text-blue-500" />
      default: return <TrendingUp className="w-4 h-4 text-gray-500" />
    }
  }
  
  const getEnergyLabel = (energy: string) => {
    switch (energy) {
      case 'high': return 'High Energy'
      case 'medium': return 'Steady Energy'
      case 'low': return 'Reflective Energy'
      default: return 'Neutral Energy'
    }
  }

  return (
    <Card className={`bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-700">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm">AI Business Insights</span>
          </div>
          <AIAnalysisIndicator 
            confidence={sentiment.confidence}
            source="ai"
            className="text-xs"
          />
        </div>
        
        {/* Energy & Context */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getEnergyIcon(sentiment.energy)}
            <span>{getEnergyLabel(sentiment.energy)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ backgroundColor: `${moodColor}15`, color: moodColor }}
            >
              {Math.round(sentiment.confidence)}% confidence
            </Badge>
          </div>
        </div>
        
        {/* Business Context */}
        {sentiment.insights && sentiment.insights.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Key Business Insight</div>
            <div className="text-sm text-gray-600 bg-white/60 rounded-lg p-3 border border-orange-200/50">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{sentiment.insights[0]}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for entry cards
export function SentimentBadge({ entry, size = "sm" }: { entry: JournalEntry, size?: "sm" | "xs" }) {
  const sentiment = entry.sentiment_data
  
  // Helper function to map AI moods to journal moods (same as EditEntryModal)
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
      'conflicted': 'Conflicted'  // Added missing mapping for 'conflicted' mood
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
      'reflection': 'Learning',
      'learning': 'Learning'  // Added missing mapping for 'learning' category
    }
    return mapping[businessCategory] || 'Strategy'
  }
  
  // Determine display mood and category (prioritize AI values, map them properly)
  const displayMood = sentiment?.primary_mood ? mapAIMoodToJournal(sentiment.primary_mood) : entry.mood
  const displayCategory = sentiment?.business_category ? mapBusinessCategoryToJournal(sentiment.business_category) : entry.category
  
  if (!displayMood && !displayCategory) {
    return null
  }

  const moodColor = getMoodColor(displayMood || '')
  const moodEmoji = getMoodEmoji(displayMood || '')
  
  return (
    <div className="flex items-center gap-1">
      {displayMood && (
        <>
          <span className={size === "xs" ? "text-sm" : "text-base"}>{moodEmoji}</span>
          <Badge 
            variant="secondary" 
            className={`${size === "xs" ? "text-xs" : "text-sm"} capitalize`}
            style={{ backgroundColor: `${moodColor}15`, color: moodColor }}
          >
            {displayMood}
          </Badge>
        </>
      )}
      {displayCategory && sentiment?.confidence && sentiment.confidence > 0.7 && (
        <Badge variant="outline" className="text-xs">
          {displayCategory}
        </Badge>
      )}
    </div>
  )
}