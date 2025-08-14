import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Brain, TrendingUp, Zap, Heart, Sparkles, Info } from "lucide-react"
// Simplified mood color mapping for streamlined AI system
const getMoodColor = (mood: string) => {
  switch (mood?.toLowerCase()) {
    case 'excited': case 'confident': case 'optimistic': return 'text-green-600 bg-green-50 border-green-200'
    case 'frustrated': case 'stressed': case 'concerned': return 'text-red-600 bg-red-50 border-red-200'
    case 'focused': case 'determined': return 'text-blue-600 bg-blue-50 border-blue-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
import { AIAnalysisIndicator } from "@/components/journal/AIAnalysisIndicator"
import type { JournalEntry } from "@/types/journal"
import { getEntryDisplayData } from "@/lib/journalDisplayUtils"
import { getVersionDisplayFromSource } from "@/lib/ai/version"

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

  // Generate inspirational business insights using our enhanced sentiment analysis
  const generateBusinessInsights = () => {
    // Check if the sentiment_data already contains proper insights from our enhanced system
    if (sentiment.insights && sentiment.insights.length > 0) {
      // Use the inspirational insights from our enhanced sentiment analysis
      return sentiment.insights
    }

    // Fallback: Generate inspirational insights based on mood and category
    const insights = []
    const businessCategory = sentiment.business_category || displayData.category
    const mood = displayData.mood
    const energy = displayData.energy || sentiment.energy

    // Inspirational mood-based insights (matching our enhanced system)
    switch (mood?.toLowerCase()) {
      case 'excited':
        insights.push("This excitement is your inner entrepreneur speaking. Channel this energy into bold action that transforms your vision into reality.")
        break
      case 'strategic':
        insights.push("Your strategic mindset is architecting the future. This deep thinking is the foundation upon which business empires are built.")
        break
      case 'focused':
        insights.push("Your clarity of purpose is a superpower. Stay in this zone - great things happen when vision meets unwavering focus.")
        break
      case 'confident':
        insights.push("Your confidence radiates strength. Trust your instincts - they've brought you this far for a reason.")
        break
      case 'thoughtful':
        insights.push("Your reflection shows wisdom. Great leaders pause to think deeply before they leap boldly.")
        break
      default:
        insights.push("Every moment of reflection builds the entrepreneur you're becoming. Trust the process - your journey is unfolding exactly as it should.")
    }

    // Inspirational category-based insights
    switch (businessCategory?.toLowerCase()) {
      case 'growth':
        insights.push("You're in expansion mode - this is where legends are made. Scale your vision as boldly as you scale your business.")
        break
      case 'planning':
        insights.push("Strategic thinking is your competitive advantage. You're not just building a business - you're architecting the future that others will admire.")
        break
      case 'achievement':
        insights.push("You've just proven what's possible when vision meets determination. This success is a launchpad, not a destination.")
        break
      case 'challenge':
        insights.push("This challenge is your chrysalis. Every entrepreneur's greatest breakthroughs come disguised as their biggest problems.")
        break
      case 'learning':
        insights.push("Every lesson you absorb becomes part of your entrepreneurial DNA. You're not just learning - you're evolving into the leader your vision needs.")
        break
      case 'research':
        insights.push("Your quest for understanding sets you apart. Data becomes wisdom in the hands of someone who knows how to listen.")
        break
    }

    // Return a single, cohesive inspirational paragraph
    return [insights.slice(0, 2).join(" ")]
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
            {getVersionDisplayFromSource((sentiment as any)?.analysis_source)} • {sentiment.confidence || 0}% confidence
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3 h-3 text-orange-500 cursor-help hover:text-orange-600 transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">
                  The confidence percentage shows how certain our AI is about reading your mood and business situation correctly. 
                  Higher percentages (80%+) mean the AI is very confident in its analysis.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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