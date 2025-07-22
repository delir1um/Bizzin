import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { format, addDays } from "date-fns"
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

const addGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  deadline: z.date({
    required_error: "Deadline is required",
  }),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'at_risk']),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().max(50, "Category must be less than 50 characters").optional(),
  reflection: z.string().max(1000, "Reflection must be less than 1000 characters").optional(),
})

type AddGoalFormData = z.infer<typeof addGoalSchema>

type AddGoalModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function AddGoalModal({ open, onOpenChange }: AddGoalModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const form = useForm<AddGoalFormData>({
    resolver: zodResolver(addGoalSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: addDays(new Date(), 30), // Default to 30 days from now
      status: 'not_started',
      priority: 'medium',
      category: "",
      reflection: "",
    },
  })

  const createGoalMutation = useMutation({
    mutationFn: async (data: AddGoalFormData) => {
      if (!user) throw new Error("User not authenticated")
      
      const goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'> = {
        title: data.title,
        description: data.description || "",
        status: data.status,
        progress: data.status === 'completed' ? 100 : 0,
        deadline: data.deadline.toISOString(),
        user_id: user.id,
        priority: data.priority,
        category: data.category || "",
        reflection: data.reflection || "",
      }
      
      return GoalsService.createGoal(goalData)
    },
    onSuccess: () => {
      // Invalidate and refetch goals
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['usage-status'] })
      
      // Show success message
      toast({
        title: "Goal created successfully",
        description: "Your new goal has been added to your list.",
      })
      
      // Reset form and close modal
      form.reset()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create goal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: AddGoalFormData) => {
    createGoalMutation.mutate(data)
  }

  const handleClose = () => {
    if (!createGoalMutation.isPending) {
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
          <DialogDescription>
            Create a new business goal to track your progress and stay focused on what matters most.
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
                      className="min-h-[80px] resize-none"
                      {...field}
                      disabled={createGoalMutation.isPending}
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
                      defaultValue={field.value}
                      disabled={createGoalMutation.isPending}
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
                      defaultValue={field.value}
                      disabled={createGoalMutation.isPending}
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
                      disabled={createGoalMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          disabled={createGoalMutation.isPending}
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setCalendarOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createGoalMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createGoalMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createGoalMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Goal
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}