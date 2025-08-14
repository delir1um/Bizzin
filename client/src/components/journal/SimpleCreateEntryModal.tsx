import { useState, useRef, useEffect } from "react"
import { queryClient } from "@/lib/queryClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
import { analyzeJournalEntry, initializeAISystem } from "@/lib/ai"
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
  const [networkErrorCount, setNetworkErrorCount] = useState(0)
  const [speechSupported, setSpeechSupported] = useState(true)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const createEntryMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Use JournalService.createEntry which includes enhanced insights logic
      console.log('SimpleCreateEntryModal: Using JournalService.createEntry with enhanced insights');
      
      const { JournalService } = await import('@/lib/services/journal')
      const data = await JournalService.createEntry({
        title: title.trim() || '', // Let AI generate heading if no title provided
        content: content.trim(),
        tags: []
      })

      // Update preview with the actual analyzed data
      setAiPreview(data.sentiment_data)
      setIsAnalyzing(false)
      
      return data
    },
    onSuccess: async () => {
      // Invalidate usage stats to update the plan banner
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        // queryClient.invalidateQueries({ queryKey: ['usage-status', user.id] }) // Disabled to prevent HEAD requests
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

  // Initialize speech recognition with simplified approach
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          console.log('Speech recognition started')
          setNetworkErrorCount(0) // Reset on successful start
        }

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          console.log('Speech result:', transcript)
          
          if (transcript && transcript.trim()) {
            setContent(prev => {
              const currentContent = prev.trim()
              const newContent = currentContent + (currentContent ? ' ' : '') + transcript.trim()
              return newContent
            })
            
            // Reset error count on successful recognition
            setNetworkErrorCount(0)
          }
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          
          if (event.error === 'not-allowed') {
            setIsListening(false)
            setSpeechSupported(false)
            toast({
              title: "Microphone access denied",
              description: "Please allow microphone access to use voice input",
              variant: "destructive"
            })
          } else if (event.error === 'network') {
            setNetworkErrorCount(prev => {
              const newCount = prev + 1
              if (newCount >= 3) {
                setIsListening(false)
                setSpeechSupported(false)
                toast({
                  title: "Voice input unavailable",
                  description: "Network connectivity issues prevent voice input from working. You can still type your journal entry normally.",
                  variant: "destructive"
                })
              }
              return newCount
            })
          } else if (event.error === 'service-not-allowed' || event.error === 'audio-capture') {
            setIsListening(false)
            setSpeechSupported(false)
            toast({
              title: "Voice input not available",
              description: "Speech recognition service is not available in this environment. Please type your journal entry.",
              variant: "destructive"
            })
          } else {
            console.log(`Speech error: ${event.error}, continuing...`)
          }
        }

        recognition.onend = () => {
          console.log('Speech recognition ended')
          setInterimTranscript("")
          
          // Only restart if user is still actively listening
          if (isListening) {
            // Short delay before restart
            retryTimeoutRef.current = setTimeout(() => {
              if (isListening && recognitionRef.current) {
                try {
                  recognitionRef.current.start()
                } catch (e) {
                  console.log('Restart failed:', e)
                  // Don't automatically stop - let user try again
                }
              }
            }, 300)
          }
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log('Error stopping recognition:', e)
        }
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [toast, isListening])

  const startListening = () => {
    if (!recognitionRef.current || !speechSupported) {
      toast({
        title: "Voice input not available",
        description: "Speech recognition is not working in this environment. Please type your journal entry instead.",
        variant: "destructive"
      })
      return
    }

    try {
      setInterimTranscript("")
      finalTranscriptRef.current = ""
      setIsListening(true)
      recognitionRef.current.start()
      
      toast({
        title: "Listening...",
        description: "Start speaking your journal entry",
        className: "border-blue-200 bg-blue-50 text-blue-800"
      })
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setIsListening(false)
      setSpeechSupported(false)
      toast({
        title: "Voice input unavailable",
        description: "Speech recognition is not working. Please type your journal entry instead.",
        variant: "destructive"
      })
    }
  }

  const stopListening = () => {
    setIsListening(false) // Set this first to prevent auto-restart
    setNetworkErrorCount(0)
    
    // Clear any pending retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Error stopping recognition:', e)
      }
    }
    setInterimTranscript("")
    finalTranscriptRef.current = ""
  }

  // Generate a smart title from content


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
          <DialogDescription className="sr-only">
            Create a new business journal entry with AI-powered sentiment analysis and insights
          </DialogDescription>
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
            
            <div className="space-y-3">
              <div className="relative">
                <Textarea
                  placeholder="What's on your mind? Start typing or use voice input, and AI will analyze your business thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px] resize-none pr-14 sm:pr-12"
                  rows={6}
                  autoFocus
                />
                
                {/* Voice Input Button */}
                <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={isListening ? "destructive" : "outline"}
                    onClick={isListening ? stopListening : startListening}
                    className={`w-8 h-8 sm:w-10 sm:h-10 p-0 transition-all duration-200 relative ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 border-red-300 shadow-lg' 
                        : 'hover:bg-orange-50 border-orange-200 text-orange-600'
                    }`}
                    title={isListening ? "Stop recording" : "Start voice input"}
                    disabled={createEntryMutation.isPending || !speechSupported}
                  >
                    {isListening ? (
                      <div className="relative flex items-center justify-center">
                        {/* Pulsing recording animation */}
                        <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute inset-1 bg-red-300 rounded-full animate-pulse"></div>
                        {/* Recording dot */}
                        <div className="relative w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full z-10"></div>
                      </div>
                    ) : (
                      <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Voice Status Indicator - Simplified */}
              {isListening && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded-md border border-red-200">
                  <div className="flex items-center gap-2 w-full">
                    {/* Simple recording indicator */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    <span className="font-medium text-xs sm:text-sm">
                      Listening... Speak a phrase and pause for it to appear
                      {networkErrorCount > 0 && ` (${networkErrorCount} network issues)`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>



          {/* Saving Status Indicator */}
          {createEntryMutation.isPending && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 flex-shrink-0"
                >
                  <Brain className="w-5 h-5 text-blue-600" />
                </motion.div>
                <div>
                  <p className="font-medium text-blue-800">Creating your journal entry...</p>
                  <p className="text-sm text-blue-600">AI is analyzing your content and generating insights</p>
                </div>
              </div>
            </div>
          )}

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