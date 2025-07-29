import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { GoalsService } from "@/lib/services/goals"
import { useAuth } from "@/hooks/AuthProvider"
import { Goal } from "@/types/goals"

const editGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  deadline: z.date({
    required_error: "Deadline is required",
  }),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'at_risk']),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().max(50, "Category must be less than 50 characters").optional(),
  progress: z.number().min(0).max(100),
  reflection: z.string().max(1000, "Reflection must be less than 1000 characters").optional(),
})

type EditGoalFormData = z.infer<typeof editGoalSchema>

type EditGoalModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  onGoalCompleted?: (goal: Goal) => void
}

const statusOptions = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'at_risk', label: 'At Risk' },
]

const priorityOptions = [
  { value: 'low', label: 'Low Priority' },
  { value: 'medium', label: 'Medium Priority' },
  { value: 'high', label: 'High Priority' },
]

export function EditGoalModal({ open, onOpenChange, goal, onGoalCompleted }: EditGoalModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const form = useForm<EditGoalFormData>({
    resolver: zodResolver(editGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: new Date(),
      status: 'not_started',
      priority: 'medium',
      category: "",
      progress: 0,
      reflection: "",
    },
  })

  // Reset form when goal changes
  useEffect(() => {
    if (goal) {
      form.reset({
        title: goal.title,
        description: goal.description || "",
        deadline: new Date(goal.deadline),
        status: goal.status,
        priority: goal.priority,
        category: goal.category || "",
        progress: goal.progress,
        reflection: goal.reflection || "",
      })
    }
  }, [goal, form])

  const updateGoalMutation = useMutation({
    mutationFn: async (data: EditGoalFormData) => {
      if (!user || !goal) throw new Error("User not authenticated or goal not found")
      
      const updates: Partial<Goal> = {
        title: data.title,
        description: data.description || "",
        status: data.status,
        progress: data.progress,
        deadline: data.deadline.toISOString(),
        priority: data.priority,
        category: data.category || "",
        reflection: data.reflection || "",
      }
      
      return GoalsService.updateGoal(goal.id, updates)
    },
    onSuccess: (updatedGoal, variables) => {
      // Check if goal was just completed
      const wasCompleted = goal?.status !== 'completed' && variables.status === 'completed'
      
      // Invalidate and refetch goals
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['usage-status'] })
      
      // Show success message
      toast({
        title: "Goal updated successfully",
        description: wasCompleted ? "Congratulations on completing your goal! 🎉" : "Your goal has been updated.",
      })
      
      // Trigger celebration if goal was completed
      if (wasCompleted && onGoalCompleted) {
        onGoalCompleted(updatedGoal)
      }
      
      // Close modal
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update goal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: EditGoalFormData) => {
    updateGoalMutation.mutate(data)
  }

  const handleClose = () => {
    if (!updateGoalMutation.isPending) {
      onOpenChange(false)
    }
  }

  // Watch status changes to auto-update progress
  const watchedStatus = form.watch("status")
  useEffect(() => {
    if (watchedStatus === 'completed') {
      form.setValue("progress", 100)
    } else if (watchedStatus === 'not_started') {
      form.setValue("progress", 0)
    }
  }, [watchedStatus, form])

  if (!goal) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>
            Update your goal details and track your progress.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Reach 10,000 monthly users"
                      {...field}
                      disabled={updateGoalMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your goal in detail..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      disabled={updateGoalMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={updateGoalMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={updateGoalMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Growth, Product, Marketing"
                        {...field}
                        disabled={updateGoalMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={updateGoalMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline *</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={updateGoalMutation.isPending}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          console.log('Date selected:', date)
                          if (date) {
                            field.onChange(date)
                            setCalendarOpen(false)
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return date < today
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reflection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reflection & Learnings</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, challenges, wins, and key learnings from working on this goal..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      disabled={updateGoalMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={updateGoalMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateGoalMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateGoalMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Goal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}