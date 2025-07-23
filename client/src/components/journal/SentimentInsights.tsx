import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, TrendingUp, Zap, Heart } from "lucide-react"
import { getMoodColor, getMoodEmoji } from "@/lib/sentimentAnalysis"
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
        <div className="flex items-center gap-2 text-orange-700">
          <Brain className="w-5 h-5" />
          <span className="font-semibold text-sm">AI Business Insights</span>
        </div>
        
        {/* Primary Mood */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodEmoji}</span>
            <div>
              <div className="font-medium text-gray-900 capitalize">
                {sentiment.primary_mood}
              </div>
              <div className="text-xs text-gray-600">
                Primary Business Mood
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {getEnergyIcon(sentiment.energy)}
            <span>{getEnergyLabel(sentiment.energy)}</span>
          </div>
        </div>
        
        {/* Confidence & Business Category */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ backgroundColor: `${moodColor}15`, color: moodColor }}
            >
              {Math.round(sentiment.confidence * 100)}% confidence
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {sentiment.business_category}
            </Badge>
          </div>
        </div>
        
        {/* Emotions */}
        {sentiment.emotions.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Detected Emotions</div>
            <div className="flex flex-wrap gap-1">
              {sentiment.emotions.slice(0, 4).map((emotion, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs capitalize"
                  style={{ backgroundColor: `${moodColor}10`, color: moodColor }}
                >
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* AI Insights */}
        {sentiment.insights.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Business Insights</div>
            <div className="space-y-2">
              {sentiment.insights.map((insight, index) => (
                <div 
                  key={index}
                  className="text-sm text-gray-700 bg-white/60 rounded-lg p-3 border border-orange-200/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">{insight}</span>
                  </div>
                </div>
              ))}
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
  
  if (!sentiment) {
    return null
  }

  const moodColor = getMoodColor(sentiment.primary_mood)
  const moodEmoji = getMoodEmoji(sentiment.primary_mood)
  
  return (
    <div className="flex items-center gap-1">
      <span className={size === "xs" ? "text-sm" : "text-base"}>{moodEmoji}</span>
      <Badge 
        variant="secondary" 
        className={`${size === "xs" ? "text-xs" : "text-sm"} capitalize`}
        style={{ backgroundColor: `${moodColor}15`, color: moodColor }}
      >
        {sentiment.primary_mood}
      </Badge>
      {sentiment.confidence > 0.7 && (
        <Badge variant="outline" className="text-xs">
          {sentiment.business_category}
        </Badge>
      )}
    </div>
  )
}