import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UserLearningSystem, UserFeedback } from '@/lib/aiTrainingData'
import { useAuth } from '@/hooks/AuthProvider'
import { useToast } from '@/hooks/use-toast'

interface FeedbackLearningModalProps {
  isOpen: boolean
  onClose: () => void
  entryData: {
    id: string
    text: string
    current_category: string
    current_mood: string
  }
  onFeedbackSubmitted: () => void
}

const categories = [
  { value: 'Growth', label: 'Growth' },
  { value: 'Challenge', label: 'Challenge' }, 
  { value: 'Achievement', label: 'Achievement' },
  { value: 'Planning', label: 'Planning' },
  { value: 'Learning', label: 'Learning' },
  { value: 'Research', label: 'Research' }
]

const moods = [
  { value: 'Confident', label: 'Confident' },
  { value: 'Excited', label: 'Excited' },
  { value: 'Focused', label: 'Focused' },
  { value: 'Optimistic', label: 'Optimistic' },
  { value: 'Stressed', label: 'Stressed' },
  { value: 'Uncertain', label: 'Uncertain' },
  { value: 'Frustrated', label: 'Frustrated' },
  { value: 'Accomplished', label: 'Accomplished' },
  { value: 'Reflective', label: 'Reflective' },
  { value: 'Determined', label: 'Determined' },
  { value: 'Thoughtful', label: 'Thoughtful' },
  { value: 'Curious', label: 'Curious' }
]

export function FeedbackLearningModal({ 
  isOpen, 
  onClose, 
  entryData, 
  onFeedbackSubmitted 
}: FeedbackLearningModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [correctedCategory, setCorrectedCategory] = useState(entryData.current_category)
  const [correctedMood, setCorrectedMood] = useState(entryData.current_mood)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user) return
    
    setIsSubmitting(true)
    
    try {
      const feedbackType = 
        correctedCategory !== entryData.current_category && correctedMood !== entryData.current_mood ? 'both' :
        correctedCategory !== entryData.current_category ? 'category_correction' : 
        'mood_correction'

      const feedback: UserFeedback = {
        entry_id: entryData.id,
        original_category: entryData.current_category,
        corrected_category: correctedCategory,
        original_mood: entryData.current_mood,
        corrected_mood: correctedMood,
        text_content: entryData.text,
        user_id: user.id,
        timestamp: new Date(),
        feedback_type: feedbackType
      }

      // Record the feedback for future learning
      UserLearningSystem.recordUserFeedback(feedback)
      
      toast({
        title: "Feedback recorded",
        description: "The AI will learn from your corrections to improve future analysis.",
      })
      
      onFeedbackSubmitted()
      onClose()
      
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: "Failed to record feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasChanges = correctedCategory !== entryData.current_category || 
                    correctedMood !== entryData.current_mood

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎯 Improve AI Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">Entry text:</p>
            <p className="text-sm font-medium">"{entryData.text.substring(0, 100)}..."</p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="category">Business Category</Label>
              <Select value={correctedCategory} onValueChange={setCorrectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                      {cat.value === entryData.current_category && ' (Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mood">Mood</Label>
              <Select value={correctedMood} onValueChange={setCorrectedMood}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.label}
                      {mood.value === entryData.current_mood && ' (Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-950 p-2 rounded">
            💡 Your corrections help the AI learn your preferences and improve accuracy for future entries.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!hasChanges || isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? 'Learning...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}