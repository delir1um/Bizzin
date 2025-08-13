import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Save, Zap } from "lucide-react"
import { JournalService } from "@/lib/services/journal"
import type { CreateJournalEntry } from "@/types/journal"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

const quickEntrySchema = z.object({
  content: z.string().min(5, "Write at least 5 characters").max(10000, "Content must be less than 10000 characters"),
})

type FormData = z.infer<typeof quickEntrySchema>

interface QuickEntryModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
}

export function QuickEntryModal({ isOpen, onClose, selectedDate }: QuickEntryModalProps) {
  const [title, setTitle] = useState("")
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(quickEntrySchema),
    defaultValues: {
      content: "",
    }
  })

  const content = watch("content")

  // Auto-generate title from content
  useEffect(() => {
    if (content && content.length > 10) {
      const words = content.trim().split(/\s+/)
      const firstFewWords = words.slice(0, 8).join(' ')
      const autoTitle = firstFewWords.length > 50 
        ? firstFewWords.substring(0, 47) + '...'
        : firstFewWords
      setTitle(autoTitle)
    } else {
      setTitle("")
    }
  }, [content])

  const createEntryMutation = useMutation({
    mutationFn: (entry: CreateJournalEntry) => JournalService.createEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      // queryClient.invalidateQueries({ queryKey: ['usage-status'] }) // Disabled to prevent HEAD requests
      toast({
        title: "Entry saved",
        description: "Your journal entry has been saved successfully.",
      })
      onClose()
      reset()
      setTitle("")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save entry",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: FormData) => {
    const entryData: CreateJournalEntry = {
      title: title || `Entry from ${format(selectedDate || new Date(), 'MMM d')}`,
      content: data.content,
      entry_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
      tags: [],
    }

    createEntryMutation.mutate(entryData)
  }

  // Auto-save draft to localStorage
  useEffect(() => {
    if (content && content.length > 5) {
      localStorage.setItem('journal-quick-draft', content)
    }
  }, [content])

  // Load draft on open
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem('journal-quick-draft')
      if (draft) {
        setValue('content', draft)
      }
    }
  }, [isOpen, setValue])

  // Clear draft on successful submit
  useEffect(() => {
    if (!isOpen) {
      localStorage.removeItem('journal-quick-draft')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Quick Entry
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Auto-generated title preview */}
            {title && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Title:</span>
                  <span className="text-sm text-orange-600 dark:text-orange-400">{title}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <Textarea
                {...register("content")}
                placeholder="What's on your mind? Share your thoughts, wins, challenges, or insights from today..."
                rows={8}
                className="focus:ring-orange-500 focus:border-orange-500 text-base"
                autoFocus
              />
              <div className="flex justify-between items-center mt-2">
                <div className="text-sm text-slate-500">
                  {errors.content && (
                    <span className="text-red-500">{errors.content.message}</span>
                  )}
                </div>
                <span className="text-sm text-slate-500">{content?.length || 0}/10000</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
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
                disabled={isSubmitting || !content || content.length < 5}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}