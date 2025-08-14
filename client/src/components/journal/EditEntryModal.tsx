import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { X, Calendar, Save, Trash2, Settings } from "lucide-react"
import type { JournalEntry, UpdateJournalEntry } from "@/types/journal"
import { JOURNAL_MOODS, JOURNAL_CATEGORIES } from "@/types/journal"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { JournalService } from "@/lib/services/journal"
import { useAuth } from "@/hooks/AuthProvider"
import { getEntryDisplayData, getMoodEmoji } from "@/lib/journalDisplayUtils"

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
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

  // Get display values using centralized utility
  const displayData = entry ? getEntryDisplayData(entry) : null

  // Initialize form with entry data when modal opens - only once per entry
  useEffect(() => {
    if (entry && isOpen && displayData) {
      reset({
        title: entry.title || "",
        content: entry.content || "",
        entry_date: entry.entry_date ? format(new Date(entry.entry_date), 'yyyy-MM-dd') : (entry.created_at ? format(new Date(entry.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
        mood: entry.mood || "",
        category: entry.category || "",
      })
    }
  }, [entry?.id, isOpen, reset]) // Only depend on entry.id and isOpen, not displayData

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
      mood: data.mood || undefined,
      category: data.category || undefined,
    }

    editEntryMutation.mutate(updateData)
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

            {/* AI Analysis Section - Always Visible */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-base font-medium text-slate-900 mb-4">AI Analysis & Classification</h3>
              
              {/* Current AI Detection with Easy Edit */}
              {entry?.sentiment_data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Mood Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Mood</label>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        AI: {entry?.sentiment_data?.primary_mood || 'None'}
                      </Badge>
                    </div>
                    <Select 
                      value={watch("mood") || ''} 
                      onValueChange={(value) => {
                        setValue("mood", value, { shouldValidate: true, shouldDirty: true })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select mood..." />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {entry?.sentiment_data?.primary_mood && (
                          <SelectItem key={`ai-${entry.sentiment_data.primary_mood}`} value={entry.sentiment_data.primary_mood}>
                            ✨ Use AI: {getMoodEmoji(entry.sentiment_data.primary_mood)} {entry.sentiment_data.primary_mood}
                          </SelectItem>
                        )}
                        {JOURNAL_MOODS.filter(mood => mood !== entry?.sentiment_data?.primary_mood).map((mood) => (
                          <SelectItem key={`manual-${mood}`} value={mood}>
                            {getMoodEmoji(mood)} {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Category</label>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        AI: {entry?.sentiment_data?.business_category || 'None'}
                      </Badge>
                    </div>
                    <Select 
                      value={watch("category") || ''} 
                      onValueChange={(value) => {
                        setValue("category", value, { shouldValidate: true, shouldDirty: true })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {entry?.sentiment_data?.business_category && (
                          <SelectItem key={`ai-${entry.sentiment_data.business_category}`} value={entry.sentiment_data.business_category}>
                            ✨ Use AI: {entry.sentiment_data.business_category}
                          </SelectItem>
                        )}
                        {JOURNAL_CATEGORIES.filter(category => category !== entry?.sentiment_data?.business_category).map((category) => (
                          <SelectItem key={`manual-${category}`} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* AI Insights Preview */}
              {entry?.sentiment_data?.insights && entry.sentiment_data.insights.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      💡
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-orange-800 text-sm mb-1">AI Business Insight</h4>
                      <p className="text-sm text-orange-700 leading-relaxed">
                        {entry.sentiment_data.insights[0]}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Saving Status Indicator */}
            {(editEntryMutation.isPending || isSubmitting) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="font-medium text-blue-800">Saving your entry...</p>
                    <p className="text-sm text-blue-600">AI is analyzing your content and updating the entry</p>
                  </div>
                </div>
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
                    disabled={editEntryMutation.isPending || isSubmitting}
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
                  disabled={editEntryMutation.isPending || isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editEntryMutation.isPending || isSubmitting}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {(editEntryMutation.isPending || isSubmitting) ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}