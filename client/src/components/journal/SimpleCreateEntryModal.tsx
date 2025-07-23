import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PlusCircle, Brain, Sparkles, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { analyzeBusinessSentiment } from "@/lib/aiSentimentAnalysis"
import { motion, AnimatePresence } from "framer-motion"

interface SimpleCreateEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onEntryCreated: () => void
}

export function SimpleCreateEntryModal({ isOpen, onClose, onEntryCreated }: SimpleCreateEntryModalProps) {
  const [content, setContent] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiPreview, setAiPreview] = useState<any>(null)
  const { toast } = useToast()

  const createEntryMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Analyze content with AI and generate title
      setIsAnalyzing(true)
      const sentimentData = await analyzeBusinessSentiment(content)
      
      // Generate AI title from content
      const aiTitle = generateTitleFromContent(content)
      
      setIsAnalyzing(false)
      setAiPreview({ ...sentimentData, generated_title: aiTitle })

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          title: aiPreview?.generated_title || generateTitleFromContent(content),
          content: content.trim(),
          user_id: user.id,
          sentiment_data: sentimentData,
          entry_date: format(new Date(), 'yyyy-MM-dd')
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
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
    setContent("")
    setAiPreview(null)
    setIsAnalyzing(false)
    onClose()
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
            Create Business Journal Entry
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Just write your thoughts - AI will automatically generate a title and analyze your entry
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entry Form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                What's on your mind?
              </label>
              <Textarea
                placeholder="Share your business thoughts, challenges, wins, or reflections. The AI will automatically generate a title, detect your mood, and categorize your entry..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
                rows={6}
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">
                AI will automatically create a title based on your content
              </p>
            </div>
          </div>

          {/* AI Analysis Preview */}
          {(isAnalyzing || aiPreview) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Brain className="w-4 h-4 text-orange-600" />
                AI Analysis Preview
              </div>

              {isAnalyzing ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center"
                      >
                        <Sparkles className="w-3 h-3 text-orange-600" />
                      </motion.div>
                      <span className="text-sm text-slate-600">
                        Analyzing your business insights...
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : aiPreview ? (
                <Card className="border-orange-200">
                  <CardContent className="p-4 space-y-3">
                    {/* Generated Title */}
                    {aiPreview.generated_title && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start gap-2">
                          <PlusCircle className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Generated Title</p>
                            <p className="text-sm text-slate-600 font-medium">{aiPreview.generated_title}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mood and Category */}
                    <div className="flex flex-wrap gap-2">
                      {aiPreview.primary_mood && (
                        <Badge className={getMoodColor(aiPreview.primary_mood)}>
                          Mood: {aiPreview.primary_mood}
                        </Badge>
                      )}
                      {aiPreview.category && (
                        <Badge className={getCategoryColor(aiPreview.category)}>
                          Category: {aiPreview.category}
                        </Badge>
                      )}
                      {aiPreview.confidence && (
                        <Badge variant="outline" className="text-xs">
                          AI Confidence: {Math.round(aiPreview.confidence)}%
                        </Badge>
                      )}
                    </div>

                    {/* Business Context */}
                    {aiPreview.business_context && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Business Context: </span>
                        <span className="text-slate-600">{aiPreview.business_context}</span>
                      </div>
                    )}

                    {/* AI Insights */}
                    {aiPreview.business_insights && (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-orange-900 mb-1">AI Business Insight</p>
                            <p className="text-sm text-orange-800">{aiPreview.business_insights}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createEntryMutation.isPending}
            >
              Cancel
            </Button>
            
            {content.trim() && !aiPreview && !isAnalyzing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAnalyzing(true)
                  analyzeBusinessSentiment(content).then(result => {
                    const aiTitle = generateTitleFromContent(content)
                    setAiPreview({ ...result, generated_title: aiTitle })
                    setIsAnalyzing(false)
                  })
                }}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Brain className="w-4 h-4 mr-2" />
                Preview AI Analysis
              </Button>
            )}

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
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Saving Entry...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Entry
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}