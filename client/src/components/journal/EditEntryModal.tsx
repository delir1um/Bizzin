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
import { GoalsService } from "@/lib/services/goals"
import { JOURNAL_MOODS, JOURNAL_CATEGORIES } from "@/types/journal"
import type { JournalEntry, UpdateJournalEntry } from "@/types/journal"
import type { Goal } from "@/types/goals"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/AuthProvider"
import { format } from "date-fns"

const editEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(10000, "Content must be less than 10000 characters"),
  entry_date: z.string().optional(),
  mood: z.string().optional(),
  category: z.string().optional(),
  related_goal_id: z.string().optional(),
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

  // Fetch user goals for linking
  const { data: userGoals = [] } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => user ? GoalsService.getUserGoals(user.id) : Promise.resolve([]),
    enabled: !!user && isOpen
  })

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
      related_goal_id: "",
    }
  })

  // Helper function to map AI business categories to journal categories  
  const mapBusinessCategoryToJournal = (businessCategory: string): string => {
    const mapping: Record<string, string> = {
      'growth': 'Strategy',
      'challenge': 'Problem-Solving',
      'achievement': 'Milestone',
      'planning': 'Planning',
      'reflection': 'Learning'
    }
    return mapping[businessCategory] || businessCategory
  }

  // Helper function to capitalize mood properly
  const capitalizeMood = (mood: string): string => {
    return mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase()
  }

  // Reset form when entry changes
  useEffect(() => {
    if (entry && isOpen) {
      setValue("title", entry.title)
      setValue("content", entry.content)
      setValue("entry_date", entry.entry_date ? format(new Date(entry.entry_date), 'yyyy-MM-dd') : "")
      
      // Use AI-generated values if available, otherwise use manual values
      const aiMood = entry.sentiment_data?.primary_mood ? capitalizeMood(entry.sentiment_data.primary_mood) : ""
      const aiCategory = entry.sentiment_data?.business_category ? mapBusinessCategoryToJournal(entry.sentiment_data.business_category) : ""
      
      setValue("mood", entry.mood || aiMood)
      setValue("category", entry.category || aiCategory)
      setValue("related_goal_id", entry.related_goal_id || "")
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
      mood: data.mood && data.mood !== "none" ? data.mood : undefined,
      category: data.category && data.category !== "none" ? data.category : undefined,
      related_goal_id: data.related_goal_id && data.related_goal_id !== "none" ? data.related_goal_id : undefined,
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

            {/* Mood and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mood
                </label>
                <Select value={watch("mood")} onValueChange={(value) => setValue("mood", value)}>
                  <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                    <SelectValue placeholder="How are you feeling?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {JOURNAL_MOODS.map((mood) => (
                      <SelectItem key={mood} value={mood}>
                        {mood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <Select value={watch("category")} onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {JOURNAL_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Related Goal (Optional) */}
            {userGoals.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Related Goal (Optional)
                </label>
                <Select
                  value={watch("related_goal_id") || "none"}
                  onValueChange={(value) => setValue("related_goal_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                    <SelectValue placeholder="Link to a goal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No goal selected</SelectItem>
                    {userGoals
                      .filter(goal => goal.status !== 'completed')
                      .map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connect this journal entry to one of your active goals
                </p>
              </div>
            )}

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