import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { GoalsService } from "@/lib/services/goals"
import { useAuth } from "@/hooks/AuthProvider"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"

const addGoalSchema = z.object({
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
  progress: z.number().min(0).max(100).optional(),
})

type AddGoalFormData = z.infer<typeof addGoalSchema>

interface AddGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddGoalModal({ open, onOpenChange }: AddGoalModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCalendar, setShowCalendar] = useState(false)

  const form = useForm<AddGoalFormData>({
    resolver: zodResolver(addGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: undefined,
      status: 'not_started',
      priority: 'medium',
      category: "",
      target_value: undefined,
      current_value: undefined,
      progress: 0,
    },
  })

  const createGoalMutation = useMutation({
    mutationFn: async (data: AddGoalFormData) => {
      if (!user) throw new Error("User not authenticated")
      
      const goalData = {
        ...data,
        description: data.description || "",
        category: data.category || "",
        deadline: data.deadline.toISOString(),
        progress: data.progress || 0,
        progress_type: 'manual' as const, // Default to manual for Phase 1
        user_id: user.id,
      }
      
      return await GoalsService.createGoal(goalData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({
        title: "Success",
        description: "Goal created successfully!",
      })
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error creating goal:', error)
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: AddGoalFormData) => {
    createGoalMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
          <DialogDescription>
            Create a new business goal to track your progress and stay focused on what matters most.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      disabled={createGoalMutation.isPending}
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
                      className="resize-none"
                      {...field}
                      disabled={createGoalMutation.isPending}
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
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={createGoalMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
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
                      defaultValue={field.value}
                      disabled={createGoalMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
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
                      disabled={createGoalMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress Tracking</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Set target and current values for automatic progress calculation, or manually set progress percentage.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="current_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="e.g., 3500"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          disabled={createGoalMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="e.g., 10000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          disabled={createGoalMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                        disabled={createGoalMutation.isPending}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Auto-calculated when current/target values are set</p>
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
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "pl-3 text-left font-normal justify-start",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={createGoalMutation.isPending}
                      onClick={() => setShowCalendar(!showCalendar)}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a deadline date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                  
                  {showCalendar && (
                    <div className="border rounded-md p-3 bg-background w-full">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date)
                            setShowCalendar(false)
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return date < today
                        }}
                        initialFocus
                        className="w-full flex justify-center"
                        classNames={{
                          months: "flex w-full justify-center",
                          month: "w-full",
                          table: "w-full",
                          head_row: "flex w-full",
                          head_cell: "flex-1 text-center",
                          row: "flex w-full mt-2",
                          cell: "flex-1 text-center p-0",
                          day: "h-9 w-full p-0 font-normal aria-selected:opacity-100"
                        }}
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createGoalMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createGoalMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}