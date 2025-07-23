import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Plus, Save, Lightbulb, RefreshCw } from "lucide-react"
import { JournalService } from "@/lib/services/journal"
import { JOURNAL_MOODS, JOURNAL_CATEGORIES } from "@/types/journal"
import { getDailyPrompt, getRandomPrompt, type ReflectionPrompt } from "@/data/reflectionPrompts"
import type { CreateJournalEntry } from "@/types/journal"
import { useToast } from "@/hooks/use-toast"

const createEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(10000, "Content must be less than 10000 characters"),
  mood: z.string().optional(),
  category: z.string().optional(),
})

type FormData = z.infer<typeof createEntrySchema>

interface CreateEntryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateEntryModal({ isOpen, onClose }: CreateEntryModalProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState<ReflectionPrompt>(() => getDailyPrompt())
  const [showPrompt, setShowPrompt] = useState(true)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(createEntrySchema),
    defaultValues: {
      title: "",
      content: "",
      mood: "",
      category: "",
    }
  })

  const createEntryMutation = useMutation({
    mutationFn: (entry: CreateJournalEntry) => JournalService.createEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['usage-status'] })
      toast({
        title: "Entry created",
        description: "Your journal entry has been successfully created.",
      })
      onClose()
      reset()
      setTags([])
      setNewTag("")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create entry",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: FormData) => {
    const entryData: CreateJournalEntry = {
      title: data.title,
      content: data.content,
      mood: data.mood || undefined,
      category: data.category || undefined,
      tags: tags,
    }
    createEntryMutation.mutate(entryData)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const refreshPrompt = () => {
    setCurrentPrompt(getRandomPrompt())
  }

  const usePromptAsTitle = () => {
    setValue('title', currentPrompt.question.replace('?', ''))
    setShowPrompt(false)
  }

  const handleCloseModal = () => {
    reset()
    setTags([])
    setNewTag("")
    setShowPrompt(true)
    setCurrentPrompt(getDailyPrompt())
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Create New Journal Entry</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseModal}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {/* Reflection Prompt Section */}
          {showPrompt && (
            <Card className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">
                        Daily Reflection Prompt
                      </h4>
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                        {currentPrompt.category}
                      </Badge>
                    </div>
                    <p className="text-orange-800 dark:text-orange-200 mb-3 leading-relaxed">
                      {currentPrompt.question}
                    </p>
                    {currentPrompt.followUp && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 mb-3 italic">
                        Follow-up: {currentPrompt.followUp}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={usePromptAsTitle}
                        className="text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-700 dark:hover:bg-orange-900"
                      >
                        Use as Title
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={refreshPrompt}
                        className="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        New Prompt
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPrompt(false)}
                        className="text-orange-500 hover:text-orange-600 dark:text-orange-500 dark:hover:text-orange-400"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Show prompt toggle when dismissed */}
            {!showPrompt && (
              <div className="mb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrompt(true)}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-950"
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Show Reflection Prompt
                </Button>
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Title *
              </label>
              <Input
                {...register("title")}
                placeholder="What's on your mind today?"
                className="focus:ring-orange-500 focus:border-orange-500"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Content *
              </label>
              <Textarea
                {...register("content")}
                placeholder={showPrompt || !currentPrompt ? "Share your thoughts, insights, learnings, or reflections..." : `Reflect on: ${currentPrompt.question}`}
                className="min-h-[200px] focus:ring-orange-500 focus:border-orange-500"
                maxLength={10000}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  {errors.content && (
                    <span className="text-red-500">{errors.content.message}</span>
                  )}
                </span>
                <span>{watch("content")?.length || 0}/10000</span>
              </div>
            </div>

            {/* Mood and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mood */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mood
                </label>
                <Select onValueChange={(value) => setValue("mood", value)}>
                  <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                    <SelectValue placeholder="How are you feeling?" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURNAL_MOODS.map((mood) => (
                      <SelectItem key={mood} value={mood}>
                        {mood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <Select onValueChange={(value) => setValue("category", value)}>
                  <SelectTrigger className="focus:ring-orange-500 focus:border-orange-500">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tags
              </label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 focus:ring-orange-500 focus:border-orange-500"
                  maxLength={30}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  size="sm"
                  disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Display Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTag(tag)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-slate-500">
                {tags.length}/10 tags • Press Enter to add a tag
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
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
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Entry
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}