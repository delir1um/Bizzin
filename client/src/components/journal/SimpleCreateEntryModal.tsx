import { useState } from "react"
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
    onClose()
  }

  const handleUseSuggestedTitle = (suggestedTitle: string) => {
    setTitle(suggestedTitle)
  }

  // Handle voice input transcription
  const handleVoiceTranscript = (transcript: string, isFinal: boolean) => {
    if (isFinal && transcript.trim()) {
      // Only append the new transcript, don't accumulate
      setContent(prev => {
        const currentContent = prev.trim()
        const cleanTranscript = transcript.trim()
        
        // Check if this transcript is already at the end of content to prevent duplication
        if (currentContent.endsWith(cleanTranscript)) {
          return prev // Don't add if already present
        }
        
        const newContent = currentContent + (currentContent ? ' ' : '') + cleanTranscript
        return newContent
      })
    }
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
                  placeholder="What's on your mind? Start typing or use voice input, and AI will analyze your business thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[140px] sm:min-h-[120px] resize-none text-base sm:text-sm leading-relaxed pr-12"
                  rows={6}
                  autoFocus
                  data-testid="textarea-content"
                />
                
                {/* Integrated Voice Input Component */}
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  isDisabled={createEntryMutation.isPending}
                  language="en-US"
                  className="absolute bottom-3 right-3"
                  compact={true}
                />
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