import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Mic, Brain, Lightbulb, TrendingUp, Calendar, X } from "lucide-react"
import { JournalService } from "@/lib/services/journal"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface SimpleCreateEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onEntryCreated: () => void
}

interface AIPreview {
  suggested_title?: string
  suggested_mood?: string
  suggested_category?: string
  suggested_insights?: string[]
}

interface SuggestedTitleButtonProps {
  suggestedTitle: string
  onUseSuggestion: (title: string) => void
  isVisible: boolean
}

const SuggestedTitleButton: React.FC<SuggestedTitleButtonProps> = ({ 
  suggestedTitle, 
  onUseSuggestion, 
  isVisible 
}) => {
  if (!isVisible || !suggestedTitle) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-3"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onUseSuggestion(suggestedTitle)}
        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 text-sm"
      >
        <Lightbulb className="w-3 h-3 mr-1" />
        Use AI suggestion: "{suggestedTitle}"
      </Button>
    </motion.div>
  )
}

export function SimpleCreateEntryModal({ isOpen, onClose, onEntryCreated }: SimpleCreateEntryModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [aiPreview, setAiPreview] = useState<AIPreview | null>(null)
  
  // Mobile-only voice recording states
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState("")
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const { toast } = useToast()

  const createEntryMutation = useMutation({
    mutationFn: async (entry: { title: string; content: string; entry_date: string; tags: string[] }) => {
      try {
        const result = await JournalService.createEntry(entry)
        return result
      } catch (error: any) {
        throw new Error(error.message || 'Failed to create journal entry')
      }
    },
    onSuccess: () => {
      onEntryCreated()
      handleClose()
      toast({
        title: "Journal entry created!",
        description: "Your thoughts have been saved and analyzed.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create entry",
        description: error.message || "Please try again.",
        variant: "destructive"
      })
    }
  })

  // Mobile device detection and speech setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detect mobile devices - speech recognition works reliably here
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                      ('ontouchstart' in window) ||
                      (navigator.maxTouchPoints > 0)
      
      if (!isMobile) {
        console.log('Voice input available only on mobile devices')
        setSpeechSupported(false)
        return
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        console.log('Speech recognition not supported on this mobile device')
        setSpeechSupported(false)
        return
      }

      // Mobile speech recognition setup
      try {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          console.log('📱 Mobile voice recognition started')
        }

        recognition.onresult = (event: any) => {
          let interimTranscript = ""
          let finalTranscript = ""
          
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }
          
          if (interimTranscript) {
            setInterimTranscript(interimTranscript)
          }
          
          if (finalTranscript && finalTranscript.trim()) {
            setContent(prev => {
              const currentContent = prev.trim()
              const newContent = currentContent + (currentContent ? ' ' : '') + finalTranscript.trim()
              return newContent
            })
            setInterimTranscript("")
            
            toast({
              title: "✅ Voice captured!",
              description: `Added: "${finalTranscript.trim()}"`,
              className: "border-green-200 bg-green-50 text-green-800"
            })
          }
        }

        recognition.onerror = (event: any) => {
          console.log('Mobile speech error:', event.error)
          setIsListening(false)
          
          if (event.error === 'not-allowed') {
            setSpeechSupported(false)
            toast({
              title: "Microphone permission needed",
              description: "Please allow microphone access to use voice input",
              variant: "destructive"
            })
          } else if (event.error === 'no-speech') {
            toast({
              title: "No speech detected",
              description: "Try speaking louder or closer to your device",
              variant: "destructive"
            })
          }
        }

        recognition.onend = () => {
          console.log('📱 Mobile speech recognition ended')
          setIsListening(false)
          setInterimTranscript("")
        }

        recognitionRef.current = recognition
        setSpeechSupported(true)
        console.log('📱 Mobile voice input ready')
        
      } catch (error) {
        console.log('Mobile speech recognition not available:', error)
        setSpeechSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [toast])

  const startListening = async () => {
    if (!speechSupported || !recognitionRef.current) {
      toast({
        title: "Voice input unavailable",
        description: "Voice recording is only available on mobile devices",
        variant: "destructive"
      })
      return
    }

    try {
      setIsListening(true)
      setInterimTranscript("")
      recognitionRef.current.start()
      
      toast({
        title: "🎤 Recording started",
        description: "Speak clearly into your device microphone",
        className: "border-green-200 bg-green-50 text-green-800"
      })
    } catch (error) {
      console.error('Failed to start voice recording:', error)
      setIsListening(false)
      toast({
        title: "Voice recording failed",
        description: "Could not start voice recording. Please try again.",
        variant: "destructive"
      })
    }
  }

  const stopListening = () => {
    setIsListening(false)
    setInterimTranscript("")
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Error stopping recognition:', e)
      }
    }
    
    toast({
      title: "🛑 Recording stopped",
      description: "Click the microphone to record more",
      className: "border-blue-200 bg-blue-50 text-blue-800"
    })
  }

  const handleUseSuggestedTitle = (suggestedTitle: string) => {
    setTitle(suggestedTitle)
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
    if (!category) return 'bg-gray-100 text-gray-600'
    
    const categoryColors: Record<string, string> = {
      'business growth': 'bg-green-100 text-green-700',
      'team management': 'bg-blue-100 text-blue-700',
      'financial planning': 'bg-purple-100 text-purple-700',
      'strategy': 'bg-indigo-100 text-indigo-700',
      'personal': 'bg-pink-100 text-pink-700',
      'challenges': 'bg-orange-100 text-orange-700',
      'achievements': 'bg-emerald-100 text-emerald-700',
      'decisions': 'bg-amber-100 text-amber-700'
    }
    
    return categoryColors[category.toLowerCase()] || 'bg-gray-100 text-gray-600'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || content.trim().length < 10) {
      toast({
        title: "Entry too short",
        description: "Please write at least 10 characters for your journal entry.",
        variant: "destructive"
      })
      return
    }

    const entryData = {
      title: title.trim() || '',
      content: content.trim(),
      entry_date: new Date().toISOString(),
      tags: [] as string[]
    }

    createEntryMutation.mutate(entryData)
  }

  const handleClose = () => {
    if (isListening) {
      stopListening()
    }
    setTitle("")
    setContent("")
    setAiPreview(null)
    setInterimTranscript("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-orange-600" />
            </div>
            New Journal Entry
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
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
                  placeholder="What's on your mind? Start typing or use voice input on mobile devices, and AI will analyze your business thoughts..."
                  value={content + (interimTranscript ? ` ${interimTranscript}` : '')}
                  onChange={(e) => setContent(e.target.value.replace(interimTranscript, '').trim())}
                  className="min-h-[120px] resize-none pr-14 sm:pr-12"
                  rows={6}
                  autoFocus
                />
                
                {/* Mobile-only Voice Input Button */}
                {speechSupported && (
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
                      title={isListening ? "Stop recording" : "Start voice input (mobile only)"}
                      disabled={createEntryMutation.isPending}
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
                )}
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
                      🎤 Recording... Speak clearly into your device microphone
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
                  Analyzing...
                </>
              ) : (
                'Save Entry'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}