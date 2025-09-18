import { useState, useRef, useEffect } from "react"
import { queryClient } from "@/lib/queryClient"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Brain } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { SuggestedTitleButton } from "./SuggestedTitleButton"
import { VoiceInput } from "./VoiceInput"
import { formatAndAppendSpeechText, formatAndReplaceSpeechText } from "@/utils/speechFormatter"

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
  const [interimContent, setInterimContent] = useState("")
  const [isTypingAnimation, setIsTypingAnimation] = useState(false)
  
  // Selection tracking for voice input replacement
  const [voiceSelectionStart, setVoiceSelectionStart] = useState<number | null>(null)
  const [voiceSelectionEnd, setVoiceSelectionEnd] = useState<number | null>(null)
  const [hadSelectionOnVoiceStart, setHadSelectionOnVoiceStart] = useState(false)
  
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout[]>([])
  const contentRef = useRef<string>("")

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

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTypingTimeouts()
    }
  }, [])
  
  const handleClose = () => {
    clearTypingTimeouts()
    setTitle("")
    setContent("")
    setInterimContent("")
    setAiPreview(null)
    setIsAnalyzing(false)
    setIsTypingAnimation(false)
    
    // Reset selection tracking
    setVoiceSelectionStart(null)
    setVoiceSelectionEnd(null)
    setHadSelectionOnVoiceStart(false)
    
    onClose()
  }

  const handleUseSuggestedTitle = (suggestedTitle: string) => {
    setTitle(suggestedTitle)
  }

  // Clear all typing timeouts
  const clearTypingTimeouts = () => {
    typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout))
    typingTimeoutRef.current = []
  }
  
  // Update content ref whenever content changes
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Capture current text selection when voice input starts
  const captureSelectionForVoice = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      
      // Only consider it a selection if start !== end (actual text selected)
      const hasSelection = start !== end
      
      console.log('Capturing selection for voice:', { start, end, hasSelection })
      
      if (hasSelection) {
        setVoiceSelectionStart(start)
        setVoiceSelectionEnd(end)
        setHadSelectionOnVoiceStart(true)
      } else {
        // No selection, just cursor position
        setVoiceSelectionStart(null)
        setVoiceSelectionEnd(null)
        setHadSelectionOnVoiceStart(false)
      }
    }
  }

  // Clear selection tracking when voice input ends
  const clearVoiceSelection = () => {
    setVoiceSelectionStart(null)
    setVoiceSelectionEnd(null)
    setHadSelectionOnVoiceStart(false)
  }

  // Voice input handling with speech formatting and selection replacement
  const handleVoiceTranscript = (transcript: string, isFinal: boolean) => {
    if (!transcript.trim()) return
    
    const cleanTranscript = transcript.trim()
    const currentContent = contentRef.current // Use ref to get fresh content
    console.log('Voice transcript received:', { 
      transcript: cleanTranscript, 
      isFinal, 
      currentContent: currentContent.substring(0, 50) + '...',
      hadSelection: hadSelectionOnVoiceStart,
      selectionStart: voiceSelectionStart,
      selectionEnd: voiceSelectionEnd
    })
    
    if (isFinal) {
      // Clear interim display
      setInterimContent("")
      
      let formattedContent: string
      
      // Check if we should replace selected text or append
      if (hadSelectionOnVoiceStart && voiceSelectionStart !== null && voiceSelectionEnd !== null) {
        // Replace selected text with voice input
        const selectedText = currentContent.substring(voiceSelectionStart, voiceSelectionEnd)
        
        console.log('Using text replacement mode:', {
          selectedText: selectedText,
          selectionStart: voiceSelectionStart,
          selectionEnd: voiceSelectionEnd,
          newTranscript: cleanTranscript
        })
        
        formattedContent = formatAndReplaceSpeechText(
          currentContent,
          selectedText,
          cleanTranscript,
          voiceSelectionStart,
          voiceSelectionEnd,
          {
            enablePunctuation: true,
            enableCapitalization: true,
            addEndPeriod: false
          }
        )
        
        // Clear selection tracking after use
        clearVoiceSelection()
        
      } else {
        // No selection, use append mode (existing behavior)
        console.log('Using text append mode (no selection)')
        
        formattedContent = formatAndAppendSpeechText(currentContent, cleanTranscript, {
          enablePunctuation: true,
          enableCapitalization: true,
          addEndPeriod: false
        })
      }
      
      console.log('Speech formatted content:', { 
        mode: hadSelectionOnVoiceStart ? 'replace' : 'append',
        original: cleanTranscript, 
        currentContent: currentContent.substring(0, 30) + '...', 
        formatted: formattedContent.substring(0, 100) + '...'
      })
      
      // Set the formatted content
      setContent(formattedContent)
      
      // Set cursor position after content update
      setTimeout(() => {
        if (textareaRef.current) {
          let newCursorPosition: number
          
          if (hadSelectionOnVoiceStart && voiceSelectionStart !== null && voiceSelectionEnd !== null) {
            // For replacement mode, calculate exact position after replacement
            const beforeSelection = currentContent.substring(0, voiceSelectionStart)
            const afterSelection = currentContent.substring(voiceSelectionEnd)
            
            // The new cursor position should be: beforeSelection length + formatted replacement text length
            const formattedNewTextLength = formattedContent.length - (beforeSelection.length + afterSelection.length)
            newCursorPosition = beforeSelection.length + formattedNewTextLength
            
            // Clamp to content bounds
            newCursorPosition = Math.max(0, Math.min(newCursorPosition, formattedContent.length))
            
            console.log('Cursor positioned after replacement:', { 
              originalSelection: [voiceSelectionStart, voiceSelectionEnd],
              beforeLength: beforeSelection.length,
              afterLength: afterSelection.length,
              replacementLength: formattedNewTextLength,
              newPosition: newCursorPosition,
              contentLength: formattedContent.length
            })
          } else {
            // For append mode, position cursor at end
            newCursorPosition = formattedContent.length
            console.log('Cursor positioned after append:', { newPosition: newCursorPosition })
          }
          
          textareaRef.current.selectionStart = newCursorPosition
          textareaRef.current.selectionEnd = newCursorPosition
          textareaRef.current.focus()
        }
      }, 10) // Small delay to ensure content is updated
      
      // Add visual feedback with a brief flash
      if (textareaRef.current) {
        textareaRef.current.classList.add('bg-green-50')
        setTimeout(() => {
          textareaRef.current?.classList.remove('bg-green-50')
        }, 300)
      }
      
    } else {
      // Show interim text without formatting (formatting happens only on final)
      setInterimContent(cleanTranscript)
    }
  }
  
  // React-driven typewriter animation
  const startTypewriterAnimation = (finalContent: string, newPortion: string, startIndex: number) => {
    clearTypingTimeouts()
    setIsTypingAnimation(true)
    
    const words = newPortion.trim().split(' ')
    let currentLength = startIndex
    
    words.forEach((word, wordIndex) => {
      const timeout = setTimeout(() => {
        // Build the word with proper spacing
        const needsLeadingSpace = wordIndex === 0 && startIndex > 0 && !newPortion.startsWith(' ')
        const needsTrailingSpace = wordIndex < words.length - 1
        const wordToAdd = (needsLeadingSpace ? ' ' : '') + word + (needsTrailingSpace ? ' ' : '')
        
        currentLength += wordToAdd.length
        setContent(finalContent.slice(0, currentLength))
        
        // Add flash effect to textarea
        if (textareaRef.current) {
          textareaRef.current.classList.add('bg-green-50')
          const flashTimeout = setTimeout(() => {
            textareaRef.current?.classList.remove('bg-green-50')
          }, 200)
          typingTimeoutRef.current.push(flashTimeout)
        }
        
        // Animation complete
        if (wordIndex === words.length - 1) {
          setIsTypingAnimation(false)
        }
      }, wordIndex * 150)
      
      typingTimeoutRef.current.push(timeout)
    })
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
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <PlusCircle className="w-5 h-5 text-orange-600" />
            New Journal Entry
          </DialogTitle>
          <DialogDescription className="sr-only">
            Create a new business journal entry with AI-powered sentiment analysis and insights
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 p-1">
          {/* Entry Form */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Input
                placeholder="Entry title (optional - AI will suggest one)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-3 sm:mb-4 h-12 sm:h-10 text-base sm:text-sm"
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
            
            <div className="space-y-2 sm:space-y-3">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder={interimContent ? "" : "What's on your mind? Start typing or use voice input, and AI will analyze your business thoughts..."}
                  value={content}
                  onChange={(e) => {
                    if (!isTypingAnimation) {
                      setContent(e.target.value)
                      setInterimContent("") // Clear interim when manually typing
                    }
                  }}
                  readOnly={false}
                  className="min-h-[140px] sm:min-h-[120px] resize-none text-base sm:text-sm leading-relaxed pr-12 transition-colors duration-200"
                  rows={6}
                  autoFocus
                  data-testid="textarea-content"
                />
                
                {/* Interim text display - simple approach */}
                {interimContent && (
                  <div className="absolute bottom-12 left-3 right-12 bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm text-blue-700 shadow-lg z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="italic">"{interimContent}"</span>
                    </div>
                  </div>
                )}
                
                {/* Integrated Voice Input Component */}
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  onStateChange={(newState) => {
                    // Capture selection when voice recording starts
                    if (newState === 'listening') {
                      captureSelectionForVoice()
                    }
                    // Clear selection tracking when voice input ends
                    else if (newState === 'ready' || newState === 'error') {
                      clearVoiceSelection()
                    }
                  }}
                  isDisabled={createEntryMutation.isPending}
                  language="en-US"
                  className="absolute bottom-3 right-3"
                  compact={true}
                  textareaRef={textareaRef}
                  showInterimOverlay={false}
                />
              </div>
              
              {/* Character Counter */}
              <div className="flex justify-end mt-2">
                <span className={`text-sm ${
                  content.length > 1800 ? 'text-red-600' : 
                  content.length > 1600 ? 'text-orange-600' : 
                  'text-gray-500'
                }`}>
                  {content.length}/2,000 characters
                </span>
              </div>
            </div>
          </div>

          {/* Saving Status Indicator */}
          {createEntryMutation.isPending && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 flex-shrink-0"
                >
                  <Brain className="w-5 h-5 text-blue-600" />
                </motion.div>
                <div>
                  <p className="text-sm sm:text-base font-medium text-blue-800">Creating your journal entry...</p>
                  <p className="text-xs sm:text-sm text-blue-600">AI is analyzing your content and generating insights</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createEntryMutation.isPending}
              className="min-h-[48px] sm:min-h-[44px] order-2 sm:order-1 touch-manipulation"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={createEntryMutation.isPending || !content.trim() || content.trim().length < 10}
              className="bg-orange-600 hover:bg-orange-700 text-white min-h-[48px] sm:min-h-[44px] order-1 sm:order-2 touch-manipulation font-medium"
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
                  Creating...
                </>
              ) : (
                "Create Entry"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}