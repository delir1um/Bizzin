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
  const [speechSupported, setSpeechSupported] = useState(true) // Start optimistic - show button by default
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

  // Enhanced speech recognition with environment detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      // Enhanced environment compatibility check
      const isReplitEnvironment = window.location.hostname.includes('replit') || window.location.hostname.includes('repl.co')
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const isHTTPS = window.location.protocol === 'https:'
      
      // Speech recognition requires HTTPS in most browsers, except localhost
      if (!SpeechRecognition) {
        console.log('Speech recognition not available: API not supported')
        setSpeechSupported(false)
        return
      }
      
      // For non-HTTPS environments, still show the button but it may not work
      if (!isHTTPS && !isLocalhost) {
        console.log('Speech recognition may not work: HTTPS required for most browsers')
        // Still set supported to true, let user try
      }

      // Test speech recognition availability with a timeout
      let testRecognition: any
      try {
        testRecognition = new SpeechRecognition()
        testRecognition.continuous = false
        testRecognition.interimResults = false
        testRecognition.lang = 'en-US'
        testRecognition.maxAlternatives = 1

        // Test timeout to detect if service works - be more permissive
        const testTimeout = setTimeout(() => {
          console.log('Speech recognition test timeout - assuming available but slow')
          clearTimeout(testTimeout)
          setSpeechSupported(true) // Assume it works even if test is slow
          try {
            testRecognition?.abort()
          } catch (e) {
            // Ignore cleanup errors
          }
        }, 2000) // Reduced timeout to 2 seconds

        testRecognition.onstart = () => {
          console.log('Speech recognition test successful')
          clearTimeout(testTimeout)
          testRecognition.stop()
          setSpeechSupported(true) // Confirm it works
          
          // Service works, set up the actual recognition
          const recognition = new SpeechRecognition()
          recognition.continuous = true  // Keep listening for multiple phrases
          recognition.interimResults = true  // Show partial results
          recognition.lang = 'en-US'
          recognition.maxAlternatives = 1

          recognition.onstart = () => {
            console.log('Speech recognition started')
            setNetworkErrorCount(0)
          }

          recognition.onresult = (event: any) => {
            console.log('Speech recognition event received:', event.results.length, 'results')
            
            let interimTranscript = ""
            let finalTranscript = ""
            
            // Process all results
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript
              console.log(`Result ${i}: "${transcript}" (final: ${event.results[i].isFinal})`)
              
              if (event.results[i].isFinal) {
                finalTranscript += transcript
              } else {
                interimTranscript += transcript
              }
            }
            
            // Update interim results for real-time feedback
            if (interimTranscript) {
              setInterimTranscript(interimTranscript)
            }
            
            // Add final results to content
            if (finalTranscript && finalTranscript.trim()) {
              console.log('Adding final transcript:', finalTranscript)
              setContent(prev => {
                const currentContent = prev.trim()
                const newContent = currentContent + (currentContent ? ' ' : '') + finalTranscript.trim()
                return newContent
              })
              setInterimTranscript("") // Clear interim when we have final
              setNetworkErrorCount(0)
            }
          }

          recognition.onerror = (event: any) => {
            console.log('Speech recognition error:', event.error)
            
            if (event.error === 'not-allowed') {
              setIsListening(false)
              setSpeechSupported(false)
              toast({
                title: "Microphone permission needed",
                description: "Click the microphone icon in your browser's address bar to enable voice input",
                variant: "destructive"
              })
            } else if (event.error === 'network' || event.error === 'service-not-allowed') {
              setIsListening(false)
              // Don't show error toast for network issues - just silently disable
              console.log('Voice input disabled due to service limitations')
            } else if (event.error === 'audio-capture') {
              setIsListening(false)
              toast({
                title: "Microphone not available",
                description: "No microphone detected. Please connect a microphone to use voice input.",
                variant: "destructive"
              })
            } else {
              // For other errors, just log and continue
              console.log(`Speech error: ${event.error}, continuing...`)
            }
          }

          recognition.onend = () => {
            console.log('Speech recognition ended')
            setInterimTranscript("")
            
            // Only restart if user is still actively listening and no errors occurred
            if (isListening && speechSupported) {
              retryTimeoutRef.current = setTimeout(() => {
                if (isListening && recognitionRef.current && speechSupported) {
                  try {
                    recognitionRef.current.start()
                  } catch (e) {
                    console.log('Restart failed, disabling voice input:', e)
                    setIsListening(false)
                  }
                }
              }, 500)
            }
          }

          recognitionRef.current = recognition
          setSpeechSupported(true)
        }

        testRecognition.onerror = (event: any) => {
          console.log('Speech recognition test failed:', event.error)
          clearTimeout(testTimeout)
          // Only disable for critical errors, not network/service issues
          if (event.error === 'not-allowed' || event.error === 'audio-capture') {
            setSpeechSupported(false)
          } else {
            console.log('Non-critical error during test, keeping button available')
            setSpeechSupported(true)
          }
        }

        // Start the test
        testRecognition.start()

      } catch (error) {
        console.log('Speech recognition initialization failed:', error)
        setSpeechSupported(false)
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

  const startListening = async () => {
    if (!speechSupported) {
      console.log('Voice input not supported in this environment')
      return
    }

    // First, explicitly request microphone permission
    try {
      console.log('🎤 Requesting microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone access granted')
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop())
      
    } catch (error) {
      console.error('❌ Microphone access denied:', error)
      toast({
        title: "Microphone access required",
        description: "Please allow microphone access to use voice input. Check your browser permissions.",
        variant: "destructive"
      })
      setSpeechSupported(false)
      return
    }
    
    // Now create speech recognition with proper permissions
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.log('Speech recognition not available')
      setSpeechSupported(false)
      toast({
        title: "Speech recognition unavailable",
        description: "Your browser doesn't support voice input. Please use a modern browser like Chrome.",
        variant: "destructive"
      })
      return
    }

    try {
      // Create recognition with more basic, reliable settings
      const recognition = new SpeechRecognition()
      recognition.continuous = false  // Single-shot mode for reliability
      recognition.interimResults = false  // Only final results
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1
      
      // Force longer timeout by using these browser-specific properties
      try {
        (recognition as any).serviceURI = 'wss://www.google.com/speech-api/v2/recognize'
        ;(recognition as any).timeout = 30000  // 30 second timeout
        ;(recognition as any).noSpeechTimeout = 15000  // 15 seconds to start speaking
      } catch (e) {
        // Ignore if browser doesn't support these
      }

      let startTime = Date.now()
      let speechDetected = false

      recognition.onstart = () => {
        console.log('🎤 MIC ACTIVE - YOU HAVE 15 SECONDS TO SPEAK!')
        startTime = Date.now()
        
        toast({
          title: "🎤 Say something now!",
          description: "Speak clearly. You have 15 seconds to record your message.",
          className: "border-green-200 bg-green-50 text-green-800"
        })
        
        // Show countdown timer to user
        setTimeout(() => {
          if (isListening && !speechDetected) {
            console.log('⏰ 10 seconds remaining...')
            toast({
              title: "⏰ 10 seconds left",
              description: "Keep speaking! Recording will stop soon.",
              className: "border-orange-200 bg-orange-50 text-orange-800"
            })
          }
        }, 5000)
      }

      recognition.onresult = (event: any) => {
        speechDetected = true
        console.log('🎯 SPEECH CAPTURED!')
        
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript
          console.log('📝 TRANSCRIPT:', transcript)
          
          if (transcript && transcript.trim()) {
            setContent(prev => {
              const newText = prev + (prev ? ' ' : '') + transcript.trim()
              console.log('✅ ADDED TO JOURNAL:', newText)
              return newText
            })
            
            toast({
              title: "✅ Voice captured successfully!",
              description: `Added: "${transcript.trim()}"`,
              className: "border-green-200 bg-green-50 text-green-800"
            })
          }
        }
      }

      recognition.onerror = (event: any) => {
        const duration = Date.now() - startTime
        console.error(`❌ SPEECH ERROR after ${duration}ms:`, event.error)
        setIsListening(false)
        
        switch (event.error) {
          case 'not-allowed':
            setSpeechSupported(false)
            toast({
              title: "Microphone access denied",
              description: "Please allow microphone access in your browser settings",
              variant: "destructive"
            })
            break
          case 'no-speech':
            if (duration < 3000) {
              // Ended too quickly - likely a service issue
              toast({
                title: "Voice input too fast",
                description: "The microphone stopped too quickly. Try again and speak immediately.",
                variant: "destructive"
              })
            } else {
              toast({
                title: "No speech detected",
                description: "Try speaking louder or check your microphone",
                variant: "destructive"
              })
            }
            break
          case 'network':
            toast({
              title: "Connection issue",
              description: "Speech recognition service unavailable. Try again in a moment.",
              variant: "destructive"
            })
            break
          case 'audio-capture':
            toast({
              title: "Microphone error",
              description: "Could not access your microphone. Check your device settings.",
              variant: "destructive"
            })
            break
          default:
            toast({
              title: "Voice input failed",
              description: `Error: ${event.error}. Try the microphone again.`,
              variant: "destructive"
            })
        }
      }

      recognition.onend = () => {
        const duration = Date.now() - startTime
        console.log(`🛑 RECOGNITION ENDED after ${duration}ms`)
        setIsListening(false)
        
        if (speechDetected) {
          toast({
            title: "✅ Recording complete",
            description: "Voice recording finished. Click the microphone to record more.",
            className: "border-blue-200 bg-blue-50 text-blue-800"
          })
        } else if (duration < 2000) {
          // Ended too quickly without speech
          console.log('⚠️ Recognition ended too quickly - likely service issue')
          toast({
            title: "Recording ended too quickly",
            description: "Speech service may be unavailable. Try typing instead.",
            variant: "destructive"
          })
        }
      }

      // Start recognition
      recognitionRef.current = recognition
      setIsListening(true)
      speechDetected = false
      
      console.log('🚀 STARTING SINGLE-SHOT VOICE RECOGNITION...')
      recognition.start()
      
    } catch (error) {
      console.error('❌ FAILED TO CREATE SPEECH RECOGNITION:', error)
      setIsListening(false)
      setSpeechSupported(false)
      toast({
        title: "Voice input unavailable",
        description: "Your browser doesn't support voice input. Please type your entry.",
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
                  value={content + (interimTranscript ? ` ${interimTranscript}` : '')}
                  onChange={(e) => setContent(e.target.value.replace(interimTranscript, '').trim())}
                  className="min-h-[120px] resize-none pr-14 sm:pr-12"
                  rows={6}
                  autoFocus
                />
                
{/* Voice input temporarily disabled due to browser compatibility issues */}
              </div>
              
              {/* Voice Status Indicator - Only show when supported and listening */}
              {speechSupported && isListening && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded-md border border-red-200">
                  <div className="flex items-center gap-2 w-full">
                    {/* Simple recording indicator */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    <span className="font-medium text-xs sm:text-sm">
                      Listening... Speak a phrase and pause for it to appear
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