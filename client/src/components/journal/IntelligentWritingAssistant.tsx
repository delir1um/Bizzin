import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, Target, Lightbulb, ArrowRight, Sparkles, X } from "lucide-react"
import { aiBusinessCoach, type CoachingInsight } from "@/lib/aiBusinessCoach"
import { motion, AnimatePresence } from "framer-motion"

interface IntelligentWritingAssistantProps {
  userId: string
  currentContent: string
  currentTitle: string
  onSuggestionApply?: (suggestion: string, type: 'title' | 'content') => void
  className?: string
}

export function IntelligentWritingAssistant({
  userId,
  currentContent,
  currentTitle,
  onSuggestionApply,
  className = ""
}: IntelligentWritingAssistantProps) {
  const [insights, setInsights] = useState<CoachingInsight[]>([])
  const [writingSuggestions, setWritingSuggestions] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [memory, setMemory] = useState<any>(null)

  useEffect(() => {
    loadAssistantData()
  }, [userId])

  // Analyze content as user types (debounced)
  useEffect(() => {
    if (!currentContent && !currentTitle) return

    const timer = setTimeout(() => {
      if (currentContent.length > 50 || currentTitle.length > 10) {
        analyzeWritingSession()
      }
    }, 2000) // 2 second debounce

    return () => clearTimeout(timer)
  }, [currentContent, currentTitle])

  const loadAssistantData = async () => {
    try {
      await aiBusinessCoach.initializeMemory(userId)
      const businessMemory = aiBusinessCoach.getMemory()
      const coachingInsights = aiBusinessCoach.getInsights()
      
      setMemory(businessMemory)
      setInsights(coachingInsights)
      
      // Show assistant if we have insights or established patterns
      if (businessMemory && (coachingInsights.length > 0 || businessMemory.entryCount > 3)) {
        setShowAssistant(true)
      }
    } catch (error) {
      console.error('Error loading assistant data:', error)
    }
  }

  const analyzeWritingSession = async () => {
    if (!memory || isAnalyzing) return

    setIsAnalyzing(true)
    try {
      // Generate contextual writing suggestions based on current content
      const suggestions = generateWritingSuggestions(currentContent, currentTitle, memory)
      setWritingSuggestions(suggestions)
      setShowAssistant(true)
    } catch (error) {
      console.error('Error analyzing writing session:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateWritingSuggestions = (content: string, title: string, businessMemory: any): string[] => {
    const suggestions: string[] = []
    const context = businessMemory.context
    const patterns = businessMemory.patterns
    
    // Content analysis
    const contentLower = content.toLowerCase()
    const wordCount = content.split(/\s+/).length

    // Length-based suggestions
    if (wordCount < 50 && content.length > 0) {
      suggestions.push("Consider expanding on your initial thoughts - what specific details or examples can you add?")
    }

    // Pattern-based suggestions
    const recentChallenges = context.currentChallenges.slice(0, 2)
    if (recentChallenges.length > 0 && !recentChallenges.some((challenge: string) => 
      contentLower.includes(challenge.toLowerCase().slice(0, 20)))) {
      suggestions.push(`You mentioned "${recentChallenges[0].slice(0, 50)}..." recently. How does today's entry relate to this challenge?`)
    }

    // Business stage specific suggestions
    if (context.businessStage === 'growth' && !contentLower.includes('scale') && !contentLower.includes('team')) {
      suggestions.push("As you're in growth mode, consider reflecting on scaling challenges or team development.")
    }

    // Emotional pattern suggestions
    const dominantMoods = patterns
      .filter((p: any) => p.type === 'emotional' && p.frequency > 2)
      .sort((a: any, b: any) => b.frequency - a.frequency)

    if (dominantMoods.length > 0) {
      const mood = dominantMoods[0].pattern
      if (!contentLower.includes(mood) && !contentLower.includes('feel')) {
        suggestions.push(`You've been feeling ${mood} frequently. How are you feeling about this situation today?`)
      }
    }

    // Recent wins connection
    if (context.recentWins.length > 0 && !contentLower.includes('win') && !contentLower.includes('success')) {
      suggestions.push("What recent wins or progress can you build upon in this situation?")
    }

    // Depth encouragement based on writing style
    if (context.writingStyle === 'deep' && wordCount < 150) {
      suggestions.push("Your previous entries show deep reflection. What underlying patterns or insights are emerging?")
    }

    return suggestions.slice(0, 3) // Return top 3 most relevant
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />
      case 'opportunity': return <Target className="w-4 h-4" />
      case 'guidance': return <Lightbulb className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const handleApplySuggestion = (suggestion: string) => {
    onSuggestionApply?.(suggestion, 'content')
  }

  if (!showAssistant || (!insights.length && !writingSuggestions.length && !isAnalyzing)) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`fixed right-4 top-1/2 transform -translate-y-1/2 w-80 z-40 ${className}`}
      >
        <Card className="bg-white/95 backdrop-blur-sm border-orange-200 shadow-lg">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <Brain className="w-3 h-3 text-orange-600" />
                </div>
                <h3 className="text-sm font-medium text-slate-900">Writing Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssistant(false)}
                className="w-6 h-6 p-0 hover:bg-slate-100 rounded-full"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Analysis State */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg mb-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-4 h-4 text-orange-600" />
                </motion.div>
                <span className="text-sm text-orange-700">Analyzing your writing...</span>
              </motion.div>
            )}

            {/* Writing Suggestions */}
            {writingSuggestions.length > 0 && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-slate-800">Smart Suggestions</span>
                </div>
                {writingSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <p className="text-sm text-slate-700 mb-2">{suggestion}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-6 text-xs"
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Apply
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Coaching Insights */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-slate-800">Active Insights</span>
                </div>
                {insights.slice(0, 2).map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (writingSuggestions.length + index) * 0.1 }}
                    className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 mb-1">
                          {insight.type}
                        </Badge>
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Business Context Summary */}
            {memory && memory.entryCount > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 space-y-1">
                  <div>Business Stage: <span className="font-medium capitalize">{memory.context.businessStage}</span></div>
                  <div>Entries Analyzed: <span className="font-medium">{memory.entryCount}</span></div>
                  <div>Patterns Found: <span className="font-medium">{memory.patterns.length}</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}