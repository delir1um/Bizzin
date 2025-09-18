import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Brain, Check, ArrowRight, Sparkles, Lightbulb } from "lucide-react"
import { aiBusinessCoach } from "@/lib/aiBusinessCoach"
import { JournalService } from "@/lib/services/journal"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface SimplifiedJournalInterfaceProps {
  isOpen: boolean
  onClose: () => void
  onEntryCreated?: () => void
}

export function SimplifiedJournalInterface({ 
  isOpen, 
  onClose, 
  onEntryCreated 
}: SimplifiedJournalInterfaceProps) {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showAICoaching, setShowAICoaching] = useState(false)
  const [aiPrompt, setAIPrompt] = useState("")
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getCurrentUser()
  }, [])

  // Initialize AI coaching when modal opens
  useEffect(() => {
    if (isOpen && user) {
      initializeAICoaching()
      setTimeout(() => {
        titleRef.current?.focus()
      }, 200)
    }
  }, [isOpen, user])

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length
    setWordCount(content.trim() ? words : 0)
  }, [content])

  const initializeAICoaching = async () => {
    if (!user) return

    try {
      await aiBusinessCoach.initializeMemory(user.id)
      const memory = aiBusinessCoach.getMemory()
      
      if (memory && memory.entryCount > 0) {
        setIsAIThinking(true)
        
        // Simulate brief AI thinking period
        setTimeout(() => {
          const prompt = aiBusinessCoach.generateCoachingPrompt()
          setAIPrompt(prompt)
          setShowAICoaching(true)
          setIsAIThinking(false)
        }, 800)
      }
    } catch (error) {
      console.error('Error initializing AI coaching:', error)
    }
  }

  const handleUseAIPrompt = () => {
    setTitle(aiPrompt)
    setShowAICoaching(false)
    contentRef.current?.focus()
  }

  const handleApplySuggestion = (suggestion: string, type: 'title' | 'content') => {
    if (type === 'title') {
      setTitle(suggestion)
      titleRef.current?.focus()
    } else {
      const currentContent = content
      const newContent = currentContent ? `${currentContent}\n\n${suggestion}` : suggestion
      setContent(newContent)
      contentRef.current?.focus()
      // Move cursor to end
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.selectionStart = contentRef.current.value.length
          contentRef.current.selectionEnd = contentRef.current.value.length
        }
      }, 0)
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your journal entry",
        variant: "destructive",
      })
      titleRef.current?.focus()
      return
    }

    if (!content.trim()) {
      toast({
        title: "Content required", 
        description: "Please write your thoughts before saving",
        variant: "destructive",
      })
      contentRef.current?.focus()
      return
    }

    setIsCreating(true)
    try {
      await JournalService.createEntry({
        title: title.trim(),
        content: content.trim(),
        entry_date: new Date().toISOString().split('T')[0],
        tags: [],
        mood: undefined,
        category: undefined,
        related_goal_id: undefined
      })

      toast({
        title: "Entry saved",
        description: "Your insights have been captured and the AI coach is learning from your entry",
        className: "border-green-200 bg-green-50 text-green-800"
      })

      // Reset form
      setTitle("")
      setContent("")
      setShowAICoaching(false)
      onEntryCreated?.()
      onClose()
    } catch (error) {
      console.error('Error creating entry:', error)
      toast({
        title: "Save failed",
        description: "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.metaKey && e.key === 'Enter') {
      handleCreate()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ height: "90vh" }}
          onKeyDown={handleKeyDown}
        >
          {/* Minimal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-600">
                {wordCount > 0 ? `${wordCount} words` : 'Start writing...'}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full w-8 h-8 p-0 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* AI Thinking State */}
          <AnimatePresence>
            {isAIThinking && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-b border-orange-100"
              >
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"
                    >
                      <Brain className="w-3 h-3 text-orange-600" />
                    </motion.div>
                    <span className="text-sm text-orange-700">
                      AI Coach is preparing a personalized prompt for you...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Coaching Prompt */}
          <AnimatePresence>
            {showAICoaching && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-b border-orange-100"
              >
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-orange-100 text-orange-700 text-xs border-orange-200">
                          Personalized Prompt
                        </Badge>
                      </div>
                      <p className="text-slate-800 text-sm leading-relaxed mb-3">
                        {aiPrompt}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={handleUseAIPrompt}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7"
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Use as Title
                        </Button>
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAICoaching(false)}
                          className="text-slate-600 hover:text-slate-800 text-xs h-7"
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Title Input */}
            <div className="p-6 pb-4">
              <Input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind about your business?"
                className="text-2xl font-light border-none p-0 h-auto focus-visible:ring-0 placeholder:text-slate-300"
                style={{ boxShadow: 'none' }}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 pb-6">
              <Textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts, insights, challenges, or wins. The AI learns from every entry to provide better coaching..."
                className="w-full h-full resize-none border-none p-0 text-base leading-relaxed focus-visible:ring-0 placeholder:text-slate-300"
                style={{ 
                  boxShadow: 'none',
                  minHeight: '400px'
                }}
                maxLength={2000}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 bg-slate-50/50 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>⌘ + Enter to save</span>
                <span>•</span>
                <span>Esc to close</span>
                {wordCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600">{wordCount} words</span>
                  </>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !title.trim() || !content.trim()}
                  className="bg-orange-600 hover:bg-orange-700 text-white min-w-[100px] shadow-sm"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Saving
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Save Entry
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Intelligent Writing Assistant - Removed for streamlined AI system */}
    </>
  )
}