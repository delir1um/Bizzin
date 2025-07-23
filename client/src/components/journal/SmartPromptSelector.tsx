import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Lightbulb, RefreshCw, Clock, Target, TrendingUp, Sparkles, Zap } from "lucide-react"
import { generateSmartPrompts, getBestPrompt, getTimeOptimizedPrompt, type SmartPrompt, type PromptContext } from "@/lib/aiPromptGenerator"
import type { JournalEntry } from "@/types/journal"
import type { Goal } from "@/types/goals"

interface SmartPromptSelectorProps {
  recentEntries: JournalEntry[]
  activeGoals: Goal[]
  onPromptSelect: (prompt: SmartPrompt) => void
  onUseAsTitle: (prompt: SmartPrompt) => void
  className?: string
}

export function SmartPromptSelector({ 
  recentEntries, 
  activeGoals, 
  onPromptSelect, 
  onUseAsTitle,
  className = "" 
}: SmartPromptSelectorProps) {
  const [currentPrompts, setCurrentPrompts] = useState<SmartPrompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<SmartPrompt | null>(null)
  const [showReasoningIndex, setShowReasoningIndex] = useState<number | null>(null)

  // Generate initial prompts
  useEffect(() => {
    const context: PromptContext = {
      recentEntries: recentEntries.slice(0, 10), // Last 10 entries for context
      activeGoals: activeGoals.filter(goal => goal.status !== 'completed'),
      currentMood: recentEntries[0]?.sentiment_data?.primary_mood,
      timeOfDay: getTimeOfDay(),
      availableTime: 'medium'
    }

    const smartPrompts = generateSmartPrompts(context)
    
    // Add time-optimized prompt if we don't have enough variety
    if (smartPrompts.length < 3) {
      smartPrompts.push(getTimeOptimizedPrompt())
    }

    setCurrentPrompts(smartPrompts)
    setSelectedPrompt(smartPrompts[0] || null)
  }, [recentEntries, activeGoals])

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'goal-focused': return <Target className="w-4 h-4" />
      case 'mood-based': return <Brain className="w-4 h-4" />
      case 'strategic': return <TrendingUp className="w-4 h-4" />
      case 'contextual': return <Clock className="w-4 h-4" />
      case 'reflection': return <Lightbulb className="w-4 h-4" />
      default: return <Sparkles className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'goal-focused': return 'bg-green-100 text-green-700 border-green-200'
      case 'mood-based': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'strategic': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'contextual': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'reflection': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDepthIcon = (depth: string) => {
    switch (depth) {
      case 'quick': return <Zap className="w-3 h-3" />
      case 'deep': return <Brain className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  const refreshPrompts = () => {
    const context: PromptContext = {
      recentEntries: recentEntries.slice(0, 10),
      activeGoals: activeGoals.filter(goal => goal.status !== 'completed'),
      currentMood: recentEntries[0]?.sentiment_data?.primary_mood,
      timeOfDay: getTimeOfDay(),
      availableTime: 'medium'
    }

    const newPrompts = generateSmartPrompts(context)
    setCurrentPrompts(newPrompts)
    setSelectedPrompt(newPrompts[0] || null)
    setShowReasoningIndex(null)
  }

  if (!selectedPrompt) return null

  return (
    <Card className={`bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 ${className}`}>
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-orange-900 text-sm">Smart Reflection Prompt</h4>
              <p className="text-xs text-orange-600">AI-powered based on your recent entries</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshPrompts}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Prompt Display */}
        <div className="space-y-4">
          <div className="bg-white/80 rounded-lg p-4 border border-orange-200/50">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${getCategoryColor(selectedPrompt.category)}`}>
                  {getCategoryIcon(selectedPrompt.category)}
                  <span className="ml-1 capitalize">{selectedPrompt.category.replace('-', ' ')}</span>
                </Badge>
                <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600 border-slate-200">
                  {getDepthIcon(selectedPrompt.depth)}
                  <span className="ml-1 capitalize">{selectedPrompt.depth}</span>
                </Badge>
              </div>
            </div>
            
            <p className="text-orange-900 font-medium leading-relaxed mb-3">
              {selectedPrompt.question}
            </p>
            
            {selectedPrompt.followUp && (
              <p className="text-sm text-orange-700 italic mb-3">
                Follow-up: {selectedPrompt.followUp}
              </p>
            )}

            {/* AI Reasoning (toggleable) */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReasoningIndex(showReasoningIndex === 0 ? null : 0)}
                className="text-xs text-orange-600 hover:text-orange-700 px-0"
              >
                <Brain className="w-3 h-3 mr-1" />
                {showReasoningIndex === 0 ? 'Hide' : 'Show'} AI reasoning
              </Button>
            </div>

            {showReasoningIndex === 0 && (
              <div className="mt-3 p-3 bg-orange-50 rounded-md border border-orange-200">
                <p className="text-xs text-orange-700">
                  <strong>Why this prompt:</strong> {selectedPrompt.reasoning}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => onUseAsTitle(selectedPrompt)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Use as Title
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPromptSelect(selectedPrompt)}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Start Writing
            </Button>
          </div>

          {/* Alternative Prompts */}
          {currentPrompts.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-orange-700">Other suggestions:</p>
              <div className="space-y-2">
                {currentPrompts.slice(1, 3).map((prompt, index) => (
                  <div key={prompt.id} className="bg-white/60 rounded-md p-3 border border-orange-200/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-orange-800 leading-snug mb-2">
                          {prompt.question}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getCategoryColor(prompt.category)}`}>
                            {getCategoryIcon(prompt.category)}
                            <span className="ml-1 capitalize">{prompt.category.replace('-', ' ')}</span>
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPrompt(prompt)
                            setShowReasoningIndex(null)
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 h-auto"
                        >
                          Select
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowReasoningIndex(showReasoningIndex === index + 1 ? null : index + 1)}
                          className="text-xs text-orange-500 hover:text-orange-600 px-2 py-1 h-auto"
                        >
                          <Brain className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {showReasoningIndex === index + 1 && (
                      <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                        <p className="text-xs text-orange-600">
                          <strong>Why:</strong> {prompt.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}