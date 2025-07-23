import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Brain, Sparkles, Check, ArrowRight, PenTool } from "lucide-react"
import { aiBusinessCoach } from "@/lib/aiBusinessCoach"
import { JournalService } from "@/lib/services/journal"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface AppleStyleJournalInterfaceProps {
  isOpen: boolean
  onClose: () => void
  onEntryCreated?: () => void
}

export function AppleStyleJournalInterface({ 
  isOpen, 
  onClose, 
  onEntryCreated 
}: AppleStyleJournalInterfaceProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showAIPrompt, setShowAIPrompt] = useState(false)
  const [aiPrompt, setAIPrompt] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Initialize AI coaching prompt
  useEffect(() => {
    if (isOpen && !sessionStarted) {
      setSessionStarted(true)
      loadAICoachingPrompt()
      
      // Focus on title input with slight delay for smooth UX
      setTimeout(() => {
        titleRef.current?.focus()
      }, 300)
    }
  }, [isOpen, sessionStarted])

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length
    setWordCount(content.trim() ? words : 0)
  }, [content])

  const loadAICoachingPrompt = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await aiBusinessCoach.initializeMemory(user.id)
        const memory = aiBusinessCoach.getMemory()
        
        if (memory && memory.entryCount > 0) {
          setIsThinking(true)
          setTimeout(() => {
            const prompt = aiBusinessCoach.generateCoachingPrompt()
            setAIPrompt(prompt)
            setShowAIPrompt(true)
            setIsThinking(false)
          }, 1000) // Brief thinking animation
        }
      }
    } catch (error) {
      console.error('Error loading AI coaching prompt:', error)
    }
  }

  const handleUsePrompt = () => {
    setTitle(aiPrompt)
    setShowAIPrompt(false)
    contentRef.current?.focus()
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

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
        description: "Your insights have been captured and analyzed",
      })

      // Reset form
      setTitle("")
      setContent("")
      setSessionStarted(false)
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ height: "85vh" }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <PenTool className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Business Journal</h2>
              <p className="text-sm text-slate-500">
                {wordCount > 0 ? `${wordCount} words` : 'Start writing your thoughts...'}
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full w-8 h-8 p-0 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Coaching Prompt */}
        <AnimatePresence>
          {showAIPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-100 text-orange-700 text-xs">
                        AI Business Coach
                      </Badge>
                    </div>
                    <p className="text-slate-800 text-sm leading-relaxed mb-4">
                      {aiPrompt}
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        size="sm"
                        onClick={handleUsePrompt}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <ArrowRight className="w-3 h-3 mr-1" />
                        Use as Title
                      </Button>
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAIPrompt(false)}
                        className="text-slate-600 hover:text-slate-800"
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

        {/* AI Thinking State */}
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-4 h-4 text-orange-600" />
                  </motion.div>
                </div>
                <p className="text-sm text-orange-700">
                  AI Coach is analyzing your patterns to suggest a personalized prompt...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Title Input */}
          <div className="p-6 border-b border-slate-100">
            <Input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind about your business today?"
              className="text-xl font-medium border-none p-0 h-auto focus-visible:ring-0 placeholder:text-slate-400"
              style={{ boxShadow: 'none' }}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6">
            <Textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your thoughts, insights, challenges, or wins. The AI will automatically analyze and learn from your entry to provide better coaching over time..."
              className="w-full h-full resize-none border-none p-0 text-base leading-relaxed focus-visible:ring-0 placeholder:text-slate-400"
              style={{ 
                boxShadow: 'none',
                minHeight: '300px'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>⌘ + Enter to save</span>
              <span>•</span>
              <span>Esc to close</span>
              {wordCount > 0 && (
                <>
                  <span>•</span>
                  <span>{wordCount} words</span>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !title.trim() || !content.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white min-w-[100px]"
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
  )
}