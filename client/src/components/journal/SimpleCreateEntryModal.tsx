import { useState, useRef, useEffect } from "react"
import { queryClient } from "@/lib/queryClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Brain, Sparkles, X, Mic, MicOff, Volume2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { analyzeBusinessSentimentAI } from "@/lib/aiSentimentAnalysis"
import { motion, AnimatePresence } from "framer-motion"
import { SuggestedTitleButton } from "./SuggestedTitleButton"

interface SimpleCreateEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onEntryCreated: () => void
}

export function SimpleCreateEntryModal({ isOpen, onClose, onEntryCreated }: SimpleCreateEntryModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiPreview, setAiPreview] = useState<any>(null)
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef<string>("")
  const { toast } = useToast()

  const createEntryMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Analyze content with AI and generate title
      setIsAnalyzing(true)
      const sentimentData = await analyzeBusinessSentimentAI(content)
      
      setIsAnalyzing(false)
      setAiPreview(sentimentData)
      
      // Auto-suggest title if none provided
      if (!title && sentimentData.suggested_title) {
        setTimeout(() => {
          toast({
            title: "AI Title Suggestion",
            description: `Suggested: "${sentimentData.suggested_title}"`,
            className: "border-orange-200 bg-orange-50 text-orange-800"
          })
        }, 500)
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          title: title || sentimentData.suggested_title || generateTitleFromContent(content),
          content: content.trim(),
          user_id: user.id,
          sentiment_data: sentimentData,
          entry_date: format(new Date(), 'yyyy-MM-dd')
        })
        .select()
        .single()

      if (error) throw error
      
      // Update usage tracking after successful journal entry creation
      try {
        const { PlansService } = await import('@/lib/services/plans')
        await PlansService.incrementUsage(user.id, 'journal')
      } catch (usageError) {
        console.warn('Failed to update usage tracking:', usageError)
        // Don't fail the entry creation if usage tracking fails
      }
      
      return data
    },
    onSuccess: async () => {
      // Invalidate usage stats to update the plan banner
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['usage-status', user.id] })
      }
      
      toast({
        title: "Entry created successfully",
        description: "Your business insights have been captured and analyzed by AI",
        className: "border-green-200 bg-green-50 text-green-800"
      })
      handleClose()
      onEntryCreated()
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create entry",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || content.trim().length < 10) {
      toast({
        title: "Content required",
        description: "Please write at least 10 characters for your journal entry",
        variant: "destructive"
      })
      return
    }
    createEntryMutation.mutate()
  }

  const handleClose = () => {
    setTitle("")
    setContent("")
    setAiPreview(null)
    setIsAnalyzing(false)
    stopListening()
    onClose()
  }

  const handleUseSuggestedTitle = (suggestedTitle: string) => {
    setTitle(suggestedTitle)
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          
          if (transcript && transcript.trim()) {
            setContent(prev => {
              const currentContent = prev.trim()
              return currentContent + (currentContent ? ' ' : '') + transcript.trim()
            })
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone access denied",
              description: "Please allow microphone access to use voice input",
              variant: "destructive"
            })
          } else if (event.error === 'no-speech') {
            toast({
              title: "No speech detected",
              description: "Please try speaking again",
              variant: "destructive"
            })
          }
        }

        recognition.onend = () => {
          setIsListening(false)
          setInterimTranscript("")
          
          // Auto-restart if still listening (for continuous capture)
          if (isListening) {
            setTimeout(() => {
              if (recognitionRef.current && isListening) {
                try {
                  recognitionRef.current.start()
                } catch (e) {
                  console.log('Auto-restart failed:', e)
                }
              }
            }, 100)
          }
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [toast])

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support voice input",
        variant: "destructive"
      })
      return
    }

    try {
      setIsListening(true)
      setInterimTranscript("")
      finalTranscriptRef.current = ""
      recognitionRef.current.start()
      
      toast({
        title: "Listening...",
        description: "Start speaking your journal entry",
        className: "border-blue-200 bg-blue-50 text-blue-800"
      })
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setInterimTranscript("")
      finalTranscriptRef.current = ""
    }
  }

  // Generate a smart title from content
  const generateTitleFromContent = (text: string): string => {
    if (!text.trim()) return "Journal Entry"
    
    // Remove extra whitespace and get first sentence
    const cleanText = text.trim().replace(/\s+/g, ' ')
    const firstSentence = cleanText.split(/[.!?]/)[0]
    
    // If first sentence is too long, take first meaningful part
    if (firstSentence.length > 50) {
      const words = firstSentence.split(' ')
      const meaningfulWords = words.filter(word => 
        word.length > 2 && 
        !['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should'].includes(word.toLowerCase())
      )
      
      if (meaningfulWords.length >= 3) {
        return meaningfulWords.slice(0, 6).join(' ')
      }
      
      return words.slice(0, 8).join(' ')
    }
    
    // Return first sentence if reasonable length
    if (firstSentence.length >= 10) {
      return firstSentence
    }
    
    // Fallback to first few words
    return cleanText.split(' ').slice(0, 6).join(' ')
  }

  const getMoodColor = (mood: string | null | undefined) => {
    if (!mood) return 'bg-gray-100 text-gray-600'
    
    const moodColors: Record<string, string> = {
      'excited': 'bg-yellow-100 text-yellow-700',
      'confident': 'bg-blue-100 text-blue-700',
      'optimistic': 'bg-green-100 text-green-700',
      'focused': 'bg-purple-100 text-purple-700',
      'content': 'bg-emerald-100 text-emerald-700',
      'neutral': 'bg-gray-100 text-gray-600',
      'concerned': 'bg-orange-100 text-orange-700',
      'frustrated': 'bg-red-100 text-red-700',
      'stressed': 'bg-red-200 text-red-800',
      'overwhelmed': 'bg-red-300 text-red-900'
    }
    
    return moodColors[mood.toLowerCase()] || 'bg-gray-100 text-gray-600'
  }

  const getCategoryColor = (category: string | null | undefined) => {
    if (!category) return 'bg-slate-100 text-slate-600'
    
    const categoryColors: Record<string, string> = {
      'planning': 'bg-blue-100 text-blue-700',
      'strategy': 'bg-purple-100 text-purple-700',
      'operations': 'bg-green-100 text-green-700',
      'finance': 'bg-emerald-100 text-emerald-700',
      'marketing': 'bg-pink-100 text-pink-700',
      'reflection': 'bg-indigo-100 text-indigo-700',
      'challenges': 'bg-red-100 text-red-700',
      'wins': 'bg-yellow-100 text-yellow-700'
    }
    
    return categoryColors[category.toLowerCase()] || 'bg-slate-100 text-slate-600'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-orange-600" />
            New Journal Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entry Form */}
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Entry title (optional - AI will suggest one)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-4"
              />
            </div>
            
            {/* AI Suggested Title */}
            {aiPreview?.suggested_title && (
              <SuggestedTitleButton
                suggestedTitle={aiPreview.suggested_title}
                onUseSuggestion={handleUseSuggestedTitle}
                isVisible={true}
              />
            )}
            
            <div className="relative">
              <Textarea
                placeholder="What's on your mind? Start typing or use voice input, and AI will analyze your business thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none pr-12"
                rows={6}
                autoFocus
              />
              
              {/* Voice Input Button */}
              <div className="absolute bottom-3 right-3">
                <Button
                  type="button"
                  size="sm"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={isListening ? stopListening : startListening}
                  className={`w-10 h-10 p-0 transition-all duration-200 relative ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 border-red-300 shadow-lg' 
                      : 'hover:bg-orange-50 border-orange-200 text-orange-600'
                  }`}
                  title={isListening ? "Stop recording" : "Start voice input"}
                  disabled={createEntryMutation.isPending}
                >
                  {isListening ? (
                    <div className="relative flex items-center justify-center">
                      {/* Pulsing recording animation */}
                      <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute inset-1 bg-red-300 rounded-full animate-pulse"></div>
                      {/* Recording dot */}
                      <div className="relative w-3 h-3 bg-white rounded-full z-10"></div>
                    </div>
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
              </div>
              
              {/* Voice Status Indicator */}
              {isListening && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                  <div className="flex items-center gap-2">
                    {/* Audio waveform animation */}
                    <div className="flex items-center gap-0.5">
                      <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{ height: '8px', animationDelay: '0ms' }}></div>
                      <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{ height: '12px', animationDelay: '150ms' }}></div>
                      <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{ height: '6px', animationDelay: '300ms' }}></div>
                      <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{ height: '10px', animationDelay: '450ms' }}></div>
                      <div className="w-1 bg-red-500 rounded-full animate-pulse" style={{ height: '8px', animationDelay: '600ms' }}></div>
                    </div>
                    <span className="font-medium">Recording... Speak clearly, then pause</span>
                  </div>
                </div>
              )}
            </div>
          </div>



          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createEntryMutation.isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={createEntryMutation.isPending || !content.trim() || content.trim().length < 10}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {createEntryMutation.isPending ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <Brain className="w-4 h-4" />
                  </motion.div>
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}