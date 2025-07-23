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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Plus, Save, Lightbulb, RefreshCw, Brain, Calendar } from "lucide-react"
import { format } from "date-fns"
import { JournalService } from "@/lib/services/journal"
import { GoalsService } from "@/lib/services/goals"
import { JOURNAL_MOODS, JOURNAL_CATEGORIES } from "@/types/journal"
import { getDailyPrompt, getRandomPrompt, type ReflectionPrompt } from "@/data/reflectionPrompts"
import type { CreateJournalEntry } from "@/types/journal"
import type { Goal } from "@/types/goals"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/AuthProvider"

const createEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(10, "Content must be at least 10 characters").max(10000, "Content must be less than 10000 characters"),
  entry_date: z.string().optional(),
  related_goal_id: z.string().optional(),
})

type FormData = z.infer<typeof createEntrySchema>

interface CreateEntryModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDate?: Date
}

export function CreateEntryModal({ isOpen, onClose, selectedDate }: CreateEntryModalProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState<ReflectionPrompt>(() => getDailyPrompt())
  const [showPrompt, setShowPrompt] = useState(true)
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
    resolver: zodResolver(createEntrySchema),
    defaultValues: {
      title: "",
      content: "",
      entry_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      related_goal_id: "",
    }
  })

  // Update form when selectedDate changes
  useEffect(() => {
    if (selectedDate && isOpen) {
      setValue("entry_date", format(selectedDate, 'yyyy-MM-dd'))
    }
  }, [selectedDate, setValue, isOpen])

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
      entry_date: data.entry_date || undefined,
      related_goal_id: data.related_goal_id && data.related_goal_id !== "none" ? data.related_goal_id : undefined,
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
    // Convert question to declarative statement for journal entry titles
    let title = currentPrompt.question
    
    // Transform question patterns to declarative statements
    title = title
      .replace(/^What's the biggest challenge you're avoiding right now\?/, "The biggest challenge I'm avoiding right now")
      .replace(/^What was your biggest win today.*\?/, "My biggest win today")
      .replace(/^What obstacle did you overcome today\?/, "The obstacle I overcame today")
      .replace(/^What decision are you most proud of today\?/, "The decision I'm most proud of today")
      .replace(/^How did you move your business forward today\?/, "How I moved my business forward today")
      .replace(/^What did you learn about your customers.*today\?/, "What I learned about my customers today")
      .replace(/^Which of your business goals made the most progress this week\?/, "The business goals that made the most progress this week")
      .replace(/^What relationship.*grew stronger this week\?/, "The relationship that grew stronger this week")
      .replace(/^What's working really well in your business right now\?/, "What's working really well in my business right now")
      .replace(/^When did you feel most confident.*recently\?/, "When I felt most confident as a business owner recently")
      .replace(/^What compliment or positive feedback did you receive recently\?/, "The compliment or positive feedback I received recently")
      .replace(/^What opportunity are you most excited about right now\?/, "The opportunity I'm most excited about right now")
      .replace(/^If you could only focus on three things next month.*\?/, "The three things I want to focus on next month")
      .replace(/^How has your vision for your business evolved recently\?/, "How my vision for my business has evolved recently")
      .replace(/^What skill do you wish you had right now\?/, "The skill I wish I had right now")
      .replace(/^When you think about your biggest business fear.*\?/, "My biggest business fear and what it brings up")
      
    // Generic fallback patterns
    title = title
      .replace(/^What's/, "What is")
      .replace(/^What /, "What ")
      .replace(/^Which /, "Which ")
      .replace(/^How /, "How ")
      .replace(/^When /, "When ")
      .replace(/^If /, "If ")
      .replace(/you're/g, "I'm")
      .replace(/your/g, "my")
      .replace(/you /g, "I ")
      .replace(/You /g, "I ")
      .replace(/are you/g, "I am")
      .replace(/do you/g, "I")
      .replace(/did you/g, "I")
      .replace(/\?$/, '') // Remove question mark at end
    
    // Auto-assign relevant tags from the prompt
    const promptTags = currentPrompt.tags.slice(0, 3) // Limit to first 3 tags to avoid overwhelming
    setTags(promptTags)
    
    setValue('title', title)
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

            {/* Entry Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the date for this journal entry (defaults to today)
              </p>
            </div>

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

            {/* AI Processing Notice */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                    AI-Powered Analysis
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Your mood, category, and tags will be automatically detected and assigned based on your writing.
                  </p>
                </div>
              </div>
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