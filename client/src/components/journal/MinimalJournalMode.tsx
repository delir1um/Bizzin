import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, PenTool, Sparkles, ArrowUp, Clock } from "lucide-react"
import { getBestPrompt, getTimeOptimizedPrompt, type SmartPrompt, type PromptContext } from "@/lib/aiPromptGenerator"
import type { JournalEntry } from "@/types/journal"
import type { Goal } from "@/types/goals"
import { JournalService } from "@/lib/services/journal"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"

interface MinimalJournalModeProps {
  recentEntries: JournalEntry[]
  activeGoals: Goal[]
  onClose: () => void
  selectedDate?: Date
}

export function MinimalJournalMode({ recentEntries, activeGoals, onClose, selectedDate }: MinimalJournalModeProps) {
  const [content, setContent] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState<SmartPrompt | null>(null)
  const [isWriting, setIsWriting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(true)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getCurrentUser()
  }, [])

  // Generate smart prompt on load
  useEffect(() => {
    const context: PromptContext = {
      recentEntries: recentEntries.slice(0, 5),
      activeGoals: activeGoals.filter(goal => goal.status !== 'completed'),
      currentMood: recentEntries[0]?.sentiment_data?.primary_mood,
      timeOfDay: getTimeOfDay(),
      availableTime: 'medium'
    }

    const smartPrompt = getBestPrompt(context)
    setCurrentPrompt(smartPrompt)
  }, [recentEntries, activeGoals])

  // Track session time
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isWriting) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isWriting])

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    setWordCount(words.length)
    
    if (content.length > 0 && !isWriting) {
      setIsWriting(true)
    }
  }, [content])

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const usePrompt = () => {
    if (currentPrompt) {
      setContent(`${currentPrompt.question}\n\n`)
      setShowPrompt(false)
    }
  }

  const refreshPrompt = () => {
    const timePrompt = getTimeOptimizedPrompt()
    setCurrentPrompt(timePrompt)
  }

  const handleSave = async () => {
    if (!user || !content.trim()) return

    setIsSaving(true)
    try {
      // Create title from first line or smart prompt
      const firstLine = content.split('\n')[0].slice(0, 80)
      const title = firstLine || currentPrompt?.question.slice(0, 80) || `${getTimeOfDay()} reflection`

      await JournalService.createEntry({
        title,
        content: content.trim(),
        tags: [],
        entry_date: (selectedDate || new Date()).toISOString().split('T')[0]
      })

      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      
      toast({
        title: "Entry saved",
        description: `${wordCount} words captured in ${formatTime(sessionTime)}`,
      })

      onClose()
    } catch (error) {
      toast({
        title: "Error saving entry",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col">
      {/* Minimal Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {isWriting ? `${wordCount} words • ${formatTime(sessionTime)}` : 'Start writing...'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {content.trim() && (
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Smart Prompt (when shown) */}
      {showPrompt && currentPrompt && (
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 dark:text-white font-medium leading-relaxed mb-2">
                  {currentPrompt.question}
                </p>
                {currentPrompt.followUp && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {currentPrompt.followUp}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                    <Clock className="w-3 h-3 mr-1" />
                    {currentPrompt.depth} reflection
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={usePrompt}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <PenTool className="w-3 h-3 mr-1" />
                Start with this prompt
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshPrompt}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Different prompt
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPrompt(false)}
                className="text-slate-500"
              >
                Write freely
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Writing Area */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto h-full">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={showPrompt ? "Or start writing your own thoughts..." : "What's on your mind?"}
            className="w-full h-full min-h-[400px] text-lg leading-relaxed border-none shadow-none resize-none focus:ring-0 focus:outline-none bg-transparent p-0"
            autoFocus
          />
        </div>
      </div>

      {/* Bottom Actions (only show when writing) */}
      {!showPrompt && currentPrompt && content.length < 50 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPrompt(true)}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Need inspiration?
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-600">
        <span className="inline-flex items-center gap-4">
          <span>⌘+Enter to save</span>
          <span>Escape to close</span>
        </span>
      </div>
    </div>
  )
}