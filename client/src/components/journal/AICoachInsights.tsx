import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, TrendingUp, Target, AlertTriangle, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react"
import { aiBusinessCoach, type CoachingInsight, type BusinessMemory } from "@/lib/aiBusinessCoach"

interface AICoachInsightsProps {
  userId: string
  className?: string
}

export function AICoachInsights({ userId, className = "" }: AICoachInsightsProps) {
  const [memory, setMemory] = useState<BusinessMemory | null>(null)
  const [insights, setInsights] = useState<CoachingInsight[]>([])
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    const loadCoachingData = async () => {
      try {
        await aiBusinessCoach.initializeMemory(userId)
        const businessMemory = aiBusinessCoach.getMemory()
        const coachingInsights = aiBusinessCoach.getInsights()
        
        setMemory(businessMemory)
        setInsights(coachingInsights)
      } catch (error) {
        console.error('Error loading AI coaching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCoachingData()
  }, [userId])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />
      case 'opportunity': return <Target className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'celebration': return <Sparkles className="w-4 h-4" />
      case 'guidance': return <Brain className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'opportunity': return 'bg-green-100 text-green-700 border-green-200'
      case 'warning': return 'bg-red-100 text-red-700 border-red-200'
      case 'celebration': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'guidance': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-slate-600">AI Coach analyzing...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!memory || insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <Brain className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              {memory?.entryCount === 0 
                ? "Start journaling to unlock AI business coaching insights!"
                : "Keep journaling! AI insights will appear as patterns emerge."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-orange-900">AI Business Coach</CardTitle>
              <p className="text-xs text-orange-600">
                {memory.entryCount} entries analyzed • {insights.length} insights
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="text-orange-600 hover:text-orange-700"
          >
            {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Business Context Summary */}
        {showStats && memory && (
          <div className="p-3 bg-white/60 rounded-lg border border-orange-200/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-orange-800">Business Stage:</span>
                <p className="text-slate-700 capitalize">{memory.context.businessStage}</p>
              </div>
              <div>
                <span className="font-medium text-orange-800">Writing Style:</span>
                <p className="text-slate-700 capitalize">{memory.context.writingStyle}</p>
              </div>
              <div>
                <span className="font-medium text-orange-800">Key Areas:</span>
                <p className="text-slate-700">
                  {memory.context.keyAreas.length > 0 
                    ? memory.context.keyAreas.slice(0, 2).join(', ')
                    : 'Learning...'
                  }
                </p>
              </div>
              <div>
                <span className="font-medium text-orange-800">Patterns Found:</span>
                <p className="text-slate-700">{memory.patterns.length} behavioral patterns</p>
              </div>
            </div>
          </div>
        )}

        {/* Coaching Insights */}
        <div className="space-y-3">
          {insights.slice(0, 3).map((insight, index) => (
            <div key={index} className="bg-white/80 rounded-lg border border-orange-200/50 p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getInsightColor(insight.type)}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={`text-xs ${getInsightColor(insight.type)}`}>
                      {insight.type}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${getUrgencyColor(insight.urgency)}`} />
                    <span className="text-xs text-slate-500 capitalize">{insight.urgency} priority</span>
                  </div>
                  
                  <p className="text-sm text-slate-800 leading-relaxed mb-2">
                    {insight.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600">
                        {insight.confidence}% confidence
                      </Badge>
                      {insight.actionable && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-600">
                          Actionable
                        </Badge>
                      )}
                    </div>
                    
                    {insight.relevantEntries.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedInsight(
                          expandedInsight === insight.message ? null : insight.message
                        )}
                        className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 h-auto"
                      >
                        {expandedInsight === insight.message ? 'Hide' : 'Show'} context
                      </Button>
                    )}
                  </div>
                  
                  {expandedInsight === insight.message && insight.relevantEntries.length > 0 && (
                    <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                      <p className="text-xs font-medium text-orange-700 mb-1">Related entries:</p>
                      <div className="space-y-1">
                        {insight.relevantEntries.slice(0, 3).map((entry, idx) => (
                          <p key={idx} className="text-xs text-orange-600">• {entry}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center pt-2">
          <p className="text-xs text-orange-600">
            AI Coach learns from your entries to provide personalized business guidance
          </p>
        </div>
      </CardContent>
    </Card>
  )
}