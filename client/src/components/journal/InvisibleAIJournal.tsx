import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Check, ArrowRight, Lightbulb, Circle } from "lucide-react"
import { aiBusinessCoach } from "@/lib/aiBusinessCoach"
import { JournalService } from "@/lib/services/journal"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface InvisibleAIJournalProps {
  isOpen: boolean
  onClose: () => void
  onEntryCreated?: () => void
}

export function InvisibleAIJournal({ 
  isOpen, 
  onClose, 
  onEntryCreated 
}: InvisibleAIJournalProps) {
  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [aiPrompt, setAIPrompt] = useState("")
  const [showPrompt, setShowPrompt] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [sessionReady, setSessionReady] = useState(false)
  
  const titleRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Initialize session when opened
  useEffect(() => {
    if (isOpen) {
      initializeSession()
    } else {
      resetSession()
    }
  }, [isOpen])

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length
    setWordCount(content.trim() ? words : 0)
  }, [content])

  const initializeSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        await aiBusinessCoach.initializeMemory(user.id)
        const memory = aiBusinessCoach.getMemory()
        
        if (memory && memory.entryCount > 0) {
          const prompt = aiBusinessCoach.generateCoachingPrompt()
          setAIPrompt(prompt)
          setShowPrompt(true)
        }
      }
      
      setSessionReady(true)
      setTimeout(() => titleRef.current?.focus(), 300)
    } catch (error) {
      console.error('Error initializing session:', error)
      setSessionReady(true)
    }
  }

  const resetSession = () => {
    setTitle("")
    setContent("")
    setAIPrompt("")
    setShowPrompt(false)
    setSessionReady(false)
    setIsCreating(false)
  }

  const handleUsePrompt = () => {
    setTitle(aiPrompt)
    setShowPrompt(false)
    contentRef.current?.focus()
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Please complete your entry",
        description: "Both title and content are required",
        variant: "destructive",
      })
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
        description: "Your insights are now part of your business intelligence",
        className: "border-green-200 bg-green-50 text-green-800"
      })

      onEntryCreated?.()
      onClose()
    } catch (error) {
      console.error('Error saving entry:', error)
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
      handleSave()
    }
  }

  if (!isOpen) return null

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50 flex flex-col"
    >
      {/* Invisible Header - Clean and minimal */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-sm text-slate-500">
            {sessionReady ? (wordCount > 0 ? `${wordCount} words` : 'Ready to write') : 'Initializing...'}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="rounded-full w-10 h-10 p-0 hover:bg-slate-50 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* AI Prompt - Appears naturally */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Lightbulb className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-slate-800 mb-3 leading-relaxed">
                  {aiPrompt}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={handleUsePrompt}
                    className="bg-orange-600 hover:bg-orange-700 text-white h-8 px-3 text-xs"
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Use this
                  </Button>
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPrompt(false)}
                    className="text-slate-500 hover:text-slate-700 h-8 px-3 text-xs"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Writing Area */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-6" onKeyDown={handleKeyDown}>
        {/* Title Input */}
        <div className="mb-8">
          <Input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="text-3xl font-light border-none p-0 h-auto focus-visible:ring-0 placeholder:text-slate-300 bg-transparent"
            style={{ boxShadow: 'none', outline: 'none' }}
            disabled={!sessionReady}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing... The AI learns from every word to become a better business coach."
            className="w-full h-full resize-none border-none p-0 text-lg leading-relaxed focus-visible:ring-0 placeholder:text-slate-300 bg-transparent"
            style={{ 
              boxShadow: 'none',
              outline: 'none',
              minHeight: '400px'
            }}
            disabled={!sessionReady}
          />
        </div>
      </div>

      {/* Invisible Footer - Clean save action */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>⌘ + Enter to save</span>
            <Circle className="w-1 h-1 fill-current" />
            <span>Esc to close</span>
            {wordCount > 0 && (
              <>
                <Circle className="w-1 h-1 fill-current" />
                <span className="text-slate-500">{wordCount} words</span>
              </>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isCreating || !title.trim() || !content.trim() || !sessionReady}
              className="bg-orange-600 hover:bg-orange-700 text-white min-w-[100px] shadow-sm"
            >
              {isCreating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Save
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}