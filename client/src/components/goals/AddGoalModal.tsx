import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().optional(),
  deadline: z.date({
    required_error: "Deadline is required",
  }),
})

type GoalFormData = z.infer<typeof goalSchema>

interface AddGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddGoalModal({ open, onOpenChange }: AddGoalModalProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      category: "",
      deadline: undefined,
    },
  })

  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      return apiRequest("/api/goals", {
        method: "POST",
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] })
      toast({
        title: "Success",
        description: "Goal created successfully",
      })
      form.reset()
      onOpenChange(false)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: GoalFormData) => {
    createGoalMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Goal</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a new business goal to track your progress and stay focused on what matters most.
          </p>
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
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
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
                className="bg-primary hover:bg-primary/90"
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