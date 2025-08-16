import { useEffect, useState } from "react"
import * as React from "react"
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
import { Slider } from "@/components/ui/slider"
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
  target_value: z.number().positive().optional(),
  current_value: z.number().min(0).optional(),
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
  const [showDatePicker, setShowDatePicker] = useState(false)

  const form = useForm<EditGoalFormData>({
    resolver: zodResolver(editGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: new Date(),
      status: 'not_started',
      priority: 'medium',
      category: "",
      target_value: undefined,
      current_value: undefined,
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
        target_value: goal.target_value,
        current_value: goal.current_value,
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
        target_value: data.target_value,
        current_value: data.current_value,
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
      // queryClient.invalidateQueries({ queryKey: ['usage-status'] }) // Disabled to prevent HEAD requests
      
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
      <DialogContent className="w-[95vw] max-w-[525px] max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Don't auto-update progress when manually setting special statuses
                        if (value !== 'on_hold' && value !== 'at_risk') {
                          // For not_started, in_progress, completed - sync with progress slider
                          const targetValue = form.getValues('target_value') || 0
                          if (targetValue > 0) {
                            if (value === 'not_started') {
                              form.setValue('current_value', 0)
                              form.setValue('progress', 0)
                            } else if (value === 'completed') {
                              form.setValue('current_value', targetValue)
                              form.setValue('progress', 100)
                            }
                          }
                        }
                      }}
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
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Auto-updates based on progress. Use "On Hold" or "At Risk" for special cases.
                    </p>
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

            <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress Tracking</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Set your target value, then drag the slider to track your progress.</p>
              
              {/* Target Value Input */}
              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Value</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="e.g., 100 books, 10000 sales"
                        {...field}
                        onChange={(e) => {
                          const newTarget = e.target.value ? Number(e.target.value) : undefined
                          field.onChange(newTarget)
                          
                          // Reset current value if target changes to avoid invalid states
                          const currentValue = form.getValues('current_value') || 0
                          if (newTarget && currentValue > newTarget) {
                            form.setValue('current_value', newTarget)
                            form.setValue('progress', 100)
                            form.setValue('status', 'completed')
                          } else if (newTarget && currentValue > 0) {
                            // Recalculate progress
                            const newProgress = Math.round((currentValue / newTarget) * 100)
                            form.setValue('progress', newProgress)
                            form.setValue('status', newProgress === 100 ? 'completed' : newProgress === 0 ? 'not_started' : 'in_progress')
                          }
                        }}
                        disabled={updateGoalMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Smart Progress Slider */}
              {form.watch('target_value') && form.watch('target_value')! > 0 && (
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="current_value"
                    render={({ field }) => {
                      const targetValue = form.watch('target_value') || 0
                      const currentValue = field.value || 0
                      const progress = targetValue > 0 ? Math.round((currentValue / targetValue) * 100) : 0
                      
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Current Progress</span>
                            <span className="text-sm font-normal text-slate-600">
                              {currentValue} of {targetValue} ({progress}%)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="px-2">
                              <Slider
                                value={[currentValue]}
                                onValueChange={(values) => {
                                  const newValue = values[0]
                                  field.onChange(newValue)
                                  
                                  // Auto-calculate progress and status
                                  const newProgress = targetValue > 0 ? Math.round((newValue / targetValue) * 100) : 0
                                  form.setValue('progress', newProgress)
                                  
                                  // Auto-update status based on progress
                                  if (newProgress === 100) {
                                    form.setValue('status', 'completed')
                                  } else if (newProgress === 0) {
                                    form.setValue('status', 'not_started')
                                  } else {
                                    // Only set to in_progress if not already completed or on_hold/at_risk
                                    const currentStatus = form.getValues('status')
                                    if (currentStatus === 'not_started' || currentStatus === 'completed') {
                                      form.setValue('status', 'in_progress')
                                    }
                                  }
                                }}
                                max={targetValue}
                                min={0}
                                step={1}
                                disabled={updateGoalMutation.isPending}
                                className="w-full"
                              />
                            </div>
                          </FormControl>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>0</span>
                            <span>{targetValue}</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </div>
              )}

              {/* Progress Summary */}
              {form.watch('target_value') && form.watch('target_value')! > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Progress Summary:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {form.watch('current_value') || 0} of {form.watch('target_value')} ({form.watch('progress') || 0}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => {
                const dateInputRef = React.useRef<HTMLInputElement>(null)
                
                return (
                  <FormItem>
                    <FormLabel>Deadline *</FormLabel>
                    <div className="relative">
                      {/* Hidden native date input */}
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            field.onChange(new Date(e.target.value))
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={updateGoalMutation.isPending}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      
                      {/* Custom styled date button */}
                      <div
                        className="relative z-0 w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md flex items-center justify-between cursor-pointer hover:bg-accent pointer-events-none"
                      >
                        <span className={field.value ? "text-foreground" : "text-muted-foreground"}>
                          {field.value ? (
                            format(field.value, "EEEE, MMMM do, yyyy")
                          ) : (
                            "Select deadline date"
                          )}
                        </span>
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
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