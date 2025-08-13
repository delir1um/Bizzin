import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, TrendingUp, Zap, Heart, Sparkles } from "lucide-react"
import { getMoodColor } from "@/lib/sentimentAnalysis"
import { AIAnalysisIndicator } from "@/components/journal/AIAnalysisIndicator"
import type { JournalEntry } from "@/types/journal"
import { getEntryDisplayData } from "@/lib/journalDisplayUtils"

interface SentimentInsightsProps {
  entry: JournalEntry
  className?: string
}

export function SentimentInsights({ entry, className = "" }: SentimentInsightsProps) {
  const sentiment = entry.sentiment_data
  
  if (!sentiment) {
    return null
  }

  // Get display values using centralized utility
  const displayData = getEntryDisplayData(entry)
  const moodColor = getMoodColor(displayData.mood)
  
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

  // Generate meaningful business insights based on the content
  const generateBusinessInsights = () => {
    const insights = []
    const businessCategory = sentiment.business_category || displayData.category
    const mood = displayData.mood
    const energy = displayData.energy || sentiment.energy
    const confidence = sentiment.confidence || 0

    // Category-specific insights
    if (businessCategory === 'growth' || businessCategory === 'Growth') {
      insights.push("This entry reflects positive business momentum and expansion mindset.")
    } else if (businessCategory === 'planning' || businessCategory === 'Planning') {
      insights.push("Strategic thinking and forward planning are evident in this reflection.")
    } else if (businessCategory === 'achievement' || businessCategory === 'Achievement') {
      insights.push("Milestone achievement detected - great progress on business objectives.")
    } else if (businessCategory === 'challenge' || businessCategory === 'Challenge') {
      insights.push("Challenging situation identified - resilience and problem-solving focused.")
    } else if (businessCategory === 'learning' || businessCategory === 'Learning') {
      insights.push("Knowledge acquisition and business learning captured in this entry.")
    } else if (businessCategory === 'research' || businessCategory === 'Research') {
      insights.push("Data-driven analysis and market research insights documented.")
    }

    // Mood and energy combination insights
    if (mood === 'Focused' && energy === 'high') {
      insights.push("High-energy focus suggests productive execution phase.")
    } else if (mood === 'Optimistic' && energy === 'high') {
      insights.push("Strong positive outlook combined with high energy indicates peak performance.")
    } else if (mood === 'Determined' && energy === 'medium') {
      insights.push("Steady determination shows consistent progress toward goals.")
    } else if (mood === 'Reflective' && energy === 'medium') {
      insights.push("Thoughtful analysis period - good time for strategic decisions.")
    }

    // Confidence-based insights
    if (confidence >= 85) {
      insights.push("AI analysis shows high confidence in mood and category detection.")
    } else if (confidence >= 70) {
      insights.push("AI analysis indicates good confidence in emotional and business context.")
    }

    // Enhanced AI features indicators (safely access with optional chaining)
    const rulesMatched = (sentiment as any).rules_matched
    if (rulesMatched && rulesMatched.length > 0) {
      insights.push(`Business pattern recognition applied (${rulesMatched.length} rules matched).`)
    }
    
    const userLearned = (sentiment as any).user_learned
    if (userLearned) {
      insights.push("AI system has learned from your previous feedback on similar entries.")
    }

    return insights.length > 0 ? insights : ["Business context analyzed with enhanced AI system."]
  }

  const businessInsights = generateBusinessInsights()

  return (
    <Card className={`bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 ${className}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-orange-700">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">AI Business Insights</span>
        </div>
        
        {/* Enhanced Business Insights */}
        <div className="space-y-2">
          {businessInsights.map((insight, index) => (
            <div key={index} className="text-sm text-gray-600 bg-white/60 rounded-lg p-3 border border-orange-200/50">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{insight}</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Analysis Details */}
        <div className="flex items-center gap-2 pt-2 border-t border-orange-200/50">
          <Brain className="w-4 h-4 text-orange-600" />
          <span className="text-xs text-orange-600 font-medium">
            Enhanced AI v2.0 • {sentiment.confidence || 0}% confidence
          </span>
          {(sentiment as any).user_learned && (
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Learned
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact version for entry cards
export function SentimentBadge({ entry, size = "sm" }: { entry: JournalEntry, size?: "sm" | "xs" }) {
  const sentiment = entry.sentiment_data
  
  // Get display values using centralized utility
  const displayData = getEntryDisplayData(entry)
  
  if (!displayData.mood && !displayData.category) {
    return null
  }

  const moodColor = getMoodColor(displayData.mood)
  
  return (
    <div className="flex items-center gap-1">
      {displayData.mood && (
        <>
          <span className={size === "xs" ? "text-sm" : "text-base"}>{displayData.moodEmoji}</span>
          <Badge 
            variant="secondary" 
            className={`${size === "xs" ? "text-xs" : "text-sm"} capitalize`}
            style={{ backgroundColor: `${moodColor}15`, color: moodColor }}
          >
            {displayData.mood}
          </Badge>
        </>
      )}
      {displayData.category && sentiment?.confidence && sentiment.confidence > 0.7 && (
        <Badge variant="outline" className="text-xs">
          {displayData.category}
        </Badge>
      )}
    </div>
  )
}