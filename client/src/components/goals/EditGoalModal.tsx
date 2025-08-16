import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GoalsService } from "@/lib/services/goals"
import { Goal } from "@/types/goals"
import { format } from "date-fns"
import { Target } from "lucide-react"
import { MilestoneManager } from "@/components/goals/MilestoneManager"

interface EditGoalModalProps {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoalCompleted?: (goal: Goal) => void
}

export function EditGoalModal({ goal, open, onOpenChange, onGoalCompleted }: EditGoalModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Simplified form data to match current database schema
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'at_risk',
    deadline: '',
    progress: 0,
  })

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || '',
        priority: goal.priority || 'medium',
        status: goal.status || 'not_started',
        deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : '',
        progress: goal.progress || 0,
      })
    }
  }, [goal])

  const updateGoalMutation = useMutation({
    mutationFn: async (updates: Partial<Goal>) => {
      if (!goal) throw new Error("No goal to update")
      return await GoalsService.updateGoal(goal.id, updates)
    },
    onSuccess: (updatedGoal) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({
        title: "Success",
        description: "Goal updated successfully!",
      })
      
      // Check if goal was just completed
      if (updatedGoal.status === 'completed' && goal?.status !== 'completed' && onGoalCompleted) {
        onGoalCompleted(updatedGoal)
      }
      
      onOpenChange(false)
    },
    onError: (error) => {
      console.error('Error updating goal:', error)
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updates: Partial<Goal> = {
      title: formData.title,
      description: formData.description,
      category: formData.category || undefined,
      priority: formData.priority,
      status: formData.status,
      deadline: new Date(formData.deadline).toISOString(),
      progress: formData.progress
    }

    updateGoalMutation.mutate(updates)
  }

  const handleProgressChange = (value: number[]) => {
    setFormData(prev => ({ ...prev, progress: value[0] }))
  }

  if (!goal) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Edit Goal
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your goal title..."
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your goal in detail..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Business, Health, Learning"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Progress Tracking - Show different UI based on goal type */}
          {goal.progress_type === 'milestone' ? (
            <div className="space-y-4">
              <Label>Milestone Progress Management</Label>
              <MilestoneManager 
                goal={goal} 
                onProgressUpdate={(newProgress) => {
                  setFormData(prev => ({ ...prev, progress: newProgress }))
                }}
              />
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Label className="flex items-center justify-between">
                <span>Progress</span>
                <Badge variant="outline">{formData.progress}%</Badge>
              </Label>
              <Slider
                value={[formData.progress]}
                onValueChange={handleProgressChange}
                max={100}
                step={1}
                className="mt-2"
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Drag the slider to update your progress percentage
              </p>
            </div>
          )}

          {/* Status and Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={updateGoalMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateGoalMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {updateGoalMutation.isPending ? "Updating..." : "Update Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}