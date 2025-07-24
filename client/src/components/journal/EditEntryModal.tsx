import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { X, Plus, Save, Trash2, Calendar } from "lucide-react"
import { JournalService } from "@/lib/services/journal"

import { JOURNAL_MOODS, JOURNAL_CATEGORIES } from "@/types/journal"
import type { JournalEntry, UpdateJournalEntry } from "@/types/journal"

import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/AuthProvider"
import { format } from "date-fns"

const editEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(10000, "Content must be less than 10000 characters"),
  entry_date: z.string().optional(),
  mood: z.string().optional(),
  category: z.string().optional(),

})

type FormData = z.infer<typeof editEntrySchema>

interface EditEntryModalProps {
  isOpen: boolean
  onClose: () => void
  entry: JournalEntry | null
  onDeleteEntry?: (entry: JournalEntry) => void
}

export function EditEntryModal({ isOpen, onClose, entry, onDeleteEntry }: EditEntryModalProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()



  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(editEntrySchema),
    defaultValues: {
      title: "",
      content: "",
      entry_date: "",
      mood: "",
      category: "",

    }
  })

  // Helper function to map AI business categories to journal categories  
  const mapBusinessCategoryToJournal = (businessCategory: string): string => {
    const mapping: Record<string, string> = {
      'growth': 'Strategy',
      'challenge': 'Research', // Map to existing category
      'achievement': 'Milestone',
      'planning': 'Planning',
      'reflection': 'Learning'
    }
    return mapping[businessCategory] || 'Strategy' // Default fallback to existing category
  }

  // Helper function to map AI moods to journal moods
  const mapAIMoodToJournal = (aiMood: string): string => {
    const mapping: Record<string, string> = {
      'optimistic': 'Optimistic',
      'excited': 'Excited',
      'focused': 'Focused',
      'frustrated': 'Frustrated',
      'reflective': 'Reflective',
      'confident': 'Confident',
      'determined': 'Determined',
      'accomplished': 'Motivated', // Map accomplished to motivated
      'uncertain': 'Thoughtful', // Map uncertain to thoughtful
      'stressed': 'Frustrated', // Map stressed to frustrated
      'neutral': 'Neutral',
      'inspired': 'Inspired'
    }
    
    // First try exact mapping, then capitalize the mood if it doesn't exist
    const mapped = mapping[aiMood.toLowerCase()]
    if (mapped) return mapped
    
    // Fallback: capitalize the AI mood
    return aiMood.charAt(0).toUpperCase() + aiMood.slice(1).toLowerCase()
  }

  // Reset form when entry changes
  useEffect(() => {
    if (entry && isOpen) {
      setValue("title", entry.title)
      setValue("content", entry.content)
      setValue("entry_date", entry.entry_date ? format(new Date(entry.entry_date), 'yyyy-MM-dd') : "")
      
      // Use AI-generated values if available, otherwise use manual values
      let displayMood = ""
      let displayCategory = ""
      
      // Priority: AI-generated values first, then manual values
      if (entry.sentiment_data?.primary_mood) {
        displayMood = mapAIMoodToJournal(entry.sentiment_data.primary_mood)
      } else if (entry.mood) {
        displayMood = entry.mood
      }
      
      if (entry.sentiment_data?.business_category) {
        displayCategory = mapBusinessCategoryToJournal(entry.sentiment_data.business_category)
      } else if (entry.category) {
        displayCategory = entry.category
      }
      
      setValue("mood", displayMood)
      setValue("category", displayCategory)

      setTags(entry.tags || [])
    }
  }, [entry, isOpen, setValue])

  const editEntryMutation = useMutation({
    mutationFn: (data: UpdateJournalEntry & { id: string }) => 
      JournalService.updateEntry(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      toast({
        title: "Entry updated",
        description: "Your journal entry has been successfully updated.",
      })
      onClose()
      reset()
      setTags([])
      setNewTag("")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update entry",
        variant: "destructive",
      })
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => JournalService.deleteEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been successfully deleted.",
      })
      setDeleteDialogOpen(false)
      onClose()
      reset()
      setTags([])
      setNewTag("")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete entry",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: FormData) => {
    if (!entry) return
    
    const updateData: UpdateJournalEntry & { id: string } = {
      id: entry.id,
      title: data.title,
      content: data.content,
      entry_date: data.entry_date || undefined,
      // Note: mood and category are now handled by AI, not manual selection
      tags: tags.length > 0 ? tags : undefined,
    }

    editEntryMutation.mutate(updateData)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleDeleteEntry = () => {
    if (!entry) return
    
    // If onDeleteEntry is provided, use it (for consistency with existing patterns)
    if (onDeleteEntry) {
      onDeleteEntry(entry)
      setDeleteDialogOpen(false)
      onClose()
    } else {
      // Otherwise use the mutation directly
      deleteEntryMutation.mutate(entry.id)
    }
  }

  if (!isOpen || !entry) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl text-slate-900 dark:text-white">
            Edit Journal Entry
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Entry Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Entry Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="date"
                  {...register("entry_date")}
                  className="pl-10 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose the date for this journal entry
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Title *
              </label>
              <Input
                {...register("title")}
                placeholder="Enter a title for your journal entry..."
                className="focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Content *
              </label>
              <Textarea
                {...register("content")}
                placeholder="What's on your mind? Share your thoughts, insights, challenges, or wins..."
                rows={8}
                className="focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            {/* AI Analysis Note */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-orange-800 mb-1">AI Analysis</h4>
                  <p className="text-sm text-orange-700">
                    Mood and category are automatically detected by AI based on your content. Edit the content above and the AI will update the analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tags
              </label>
              
              {/* Tag Input */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="flex-1 focus:ring-orange-500 focus:border-orange-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Tag List */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="flex items-center gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="h-auto p-0 text-orange-600 hover:text-orange-800"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>



            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              {/* Delete Button */}
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Entry
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{entry?.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteEntry}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteEntryMutation.isPending}
                    >
                      {deleteEntryMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Update/Cancel Buttons */}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Updating..." : "Update Entry"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}