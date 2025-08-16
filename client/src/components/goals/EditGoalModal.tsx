import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GoalsService } from "@/lib/services/goals"
import { Goal } from "@/types/goals"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Target, Sliders } from "lucide-react"

interface EditGoalModalProps {
  goal: Goal | null
  isOpen: boolean
  onClose: () => void
}

export function EditGoalModal({ goal, isOpen, onClose }: EditGoalModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    progress_type: 'manual' as 'manual' | 'milestone',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'at_risk',
    target_value: '',
    current_value: '',
    unit: '',
    deadline: '',
    progress: 0,
    reflection: ''
  })

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || '',
        priority: goal.priority || 'medium',
        progress_type: goal.progress_type || 'manual',
        status: goal.status || 'not_started',
        target_value: goal.target_value?.toString() || '',
        current_value: goal.current_value?.toString() || '',
        unit: goal.unit || '',
        deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : '',
        progress: goal.progress || 0,
        reflection: goal.reflection || ''
      })
    }
  }, [goal])

  const updateGoalMutation = useMutation({
    mutationFn: async (updates: Partial<Goal>) => {
      if (!goal) throw new Error("No goal to update")
      return await GoalsService.updateGoal(goal.id, updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({
        title: "Success",
        description: "Goal updated successfully!",
      })
      onClose()
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
      progress_type: formData.progress_type,
      status: formData.status,
      target_value: formData.target_value ? parseFloat(formData.target_value) : undefined,
      current_value: formData.current_value ? parseFloat(formData.current_value) : undefined,
      unit: formData.unit || undefined,
      deadline: new Date(formData.deadline).toISOString(),
      reflection: formData.reflection || undefined
    }

    // Only update progress for manual progress type
    if (formData.progress_type === 'manual') {
      updates.progress = formData.progress
    }

    updateGoalMutation.mutate(updates)
  }

  const handleProgressTypeChange = (value: 'manual' | 'milestone') => {
    setFormData(prev => ({ ...prev, progress_type: value }))
    
    // Show information about progress type change
    if (value === 'milestone') {
      toast({
        title: "Milestone Mode Enabled",
        description: "Progress will be calculated automatically based on milestone completion.",
      })
    }
  }

  const getProgressText = () => {
    if (formData.target_value && formData.current_value) {
      return `${formData.current_value} / ${formData.target_value} ${formData.unit || ''}`
    }
    return `${formData.progress}%`
  }

  if (!goal) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => 
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

          {/* Progress Type Selection - Phase 2 Feature */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Label className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Progress Tracking Method
            </Label>
            <RadioGroup
              value={formData.progress_type}
              onValueChange={handleProgressTypeChange}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="cursor-pointer">
                  Manual Progress
                  <span className="block text-xs text-slate-600 dark:text-slate-400">
                    Set progress manually using slider or values
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="milestone" id="milestone" />
                <Label htmlFor="milestone" className="cursor-pointer">
                  Milestone-based
                  <span className="block text-xs text-slate-600 dark:text-slate-400">
                    Progress calculated from milestone completion
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Progress Configuration */}
          {formData.progress_type === 'manual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="current_value">Current Value</Label>
                  <Input
                    id="current_value"
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_value: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="e.g., books, lbs, $"
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center justify-between">
                  <span>Progress: {getProgressText()}</span>
                  <Badge variant="outline">{formData.progress}%</Badge>
                </Label>
                <Slider
                  value={[formData.progress]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, progress: value[0] }))}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>
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

          {/* Reflection */}
          <div>
            <Label htmlFor="reflection">Reflection & Notes</Label>
            <Textarea
              id="reflection"
              value={formData.reflection}
              onChange={(e) => setFormData(prev => ({ ...prev, reflection: e.target.value }))}
              placeholder="Add your thoughts, learnings, or notes about this goal..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateGoalMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {updateGoalMutation.isPending ? "Updating..." : "Update Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}