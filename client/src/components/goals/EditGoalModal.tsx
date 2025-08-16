import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
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
import { Target, AlertTriangle, CheckSquare } from "lucide-react"
import { MilestoneManager } from "@/components/goals/MilestoneManager"
import { goalLogger } from '@/lib/logger'

interface EditGoalModalProps {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoalCompleted?: (goal: Goal) => void
}

export function EditGoalModal({ goal, open, onOpenChange, onGoalCompleted }: EditGoalModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Form data including progress_type for goal type conversion
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'not_started' as 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'at_risk',
    deadline: '',
    progress: 0,
    progress_type: 'manual' as 'manual' | 'milestone',
  })

  // Conversion confirmation state
  const [conversionDialog, setConversionDialog] = useState<{
    open: boolean;
    from: 'manual' | 'milestone';
    to: 'manual' | 'milestone';
    milestoneCount?: number;
  }>({ open: false, from: 'manual', to: 'manual' })

  useEffect(() => {
    if (goal) {
      goalLogger.logUpdate(goal.id, { action: 'OPEN_EDIT_MODAL' }, goal.user_id, 'EditGoalModal opened')
      
      // Detect current progress type from goal data
      const progressType = goal.progress_type || 'manual'
      
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || '',
        priority: goal.priority || 'medium',
        status: goal.status || 'not_started',
        deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : '',
        progress: goal.progress || 0,
        progress_type: progressType,
      })
    }
  }, [goal])

  const updateGoalMutation = useMutation({
    mutationFn: async (updates: Partial<Goal>) => {
      if (!goal) throw new Error("No goal to update")
      goalLogger.logUpdate(goal.id, updates, goal.user_id, 'EditGoalModal: Starting goal update mutation')
      return await GoalsService.updateGoal(goal.id, updates)
    },
    onSuccess: (updatedGoal) => {
      goalLogger.logUpdate(updatedGoal.id, updatedGoal, updatedGoal.user_id, 'EditGoalModal: Goal update mutation successful')
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast({
        title: "Success",
        description: "Goal updated successfully!",
      })
      
      // Check if goal was just completed
      if (updatedGoal.status === 'completed' && goal?.status !== 'completed' && onGoalCompleted) {
        goalLogger.logUpdate(updatedGoal.id, { status_change: 'completed' }, updatedGoal.user_id, 'EditGoalModal: Goal marked as completed')
        onGoalCompleted(updatedGoal)
      }
      
      onOpenChange(false)
    },
    onError: (error) => {
      goalLogger.logError('UPDATE_GOAL_UI', error, goal?.id, goal?.user_id, 'EditGoalModal: Goal update mutation failed')
      console.error('Error updating goal:', error)
      toast({
        title: "Error",
        description: "Failed to update goal. Please try again.",
        variant: "destructive",
      })
    },
  })

  // Goal type conversion mutation
  const convertGoalTypeMutation = useMutation({
    mutationFn: async (newProgressType: 'manual' | 'milestone') => {
      if (!goal) throw new Error("No goal to convert")
      goalLogger.logConvert(goal.id, formData.progress_type, newProgressType, goal.user_id, { UI: 'EditGoalModal', action: 'starting_conversion' })
      return await GoalsService.convertGoalType(goal.id, newProgressType)
    },
    onSuccess: (updatedGoal) => {
      goalLogger.logConvert(updatedGoal.id, formData.progress_type, updatedGoal.progress_type, updatedGoal.user_id, { UI: 'EditGoalModal', action: 'conversion_successful' })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setFormData(prev => ({ ...prev, progress_type: updatedGoal.progress_type }))
      setConversionDialog({ open: false, from: 'manual', to: 'manual' })
      toast({
        title: "Success",
        description: "Goal type converted successfully!",
      })
    },
    onError: (error) => {
      goalLogger.logError('CONVERT_GOAL_UI', error, goal?.id, goal?.user_id, 'EditGoalModal: Goal conversion mutation failed')
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to convert goal type",
        variant: "destructive",
      })
    },
  })

  // Handle goal type change with confirmation
  const handleGoalTypeChange = async (newProgressType: 'manual' | 'milestone') => {
    const currentProgressType = formData.progress_type
    
    goalLogger.logUpdate(goal?.id || '', { 
      UI_event: 'goal_type_dropdown_change', 
      from: currentProgressType, 
      to: newProgressType 
    }, goal?.user_id || '', 'EditGoalModal: Goal type dropdown changed')
    
    if (currentProgressType === newProgressType) {
      goalLogger.logUpdate(goal?.id || '', { UI_event: 'goal_type_no_change' }, goal?.user_id || '', 'EditGoalModal: Goal type unchanged, no action needed')
      return // No change needed
    }

    if (newProgressType === 'manual' && currentProgressType === 'milestone') {
      // Check if goal has milestones
      const goalWithMilestones = await GoalsService.getGoalWithMilestones(goal!.id)
      const milestoneCount = goalWithMilestones.milestones?.length || 0
      
      goalLogger.logUpdate(goal!.id, { 
        UI_event: 'conversion_dialog_open', 
        type: 'milestone_to_manual', 
        milestones_to_delete: milestoneCount 
      }, goal!.user_id, 'EditGoalModal: Opening milestone-to-manual conversion dialog')
      
      setConversionDialog({
        open: true,
        from: 'milestone',
        to: 'manual',
        milestoneCount
      })
    } else if (newProgressType === 'milestone' && currentProgressType === 'manual') {
      goalLogger.logUpdate(goal!.id, { 
        UI_event: 'conversion_dialog_open', 
        type: 'manual_to_milestone' 
      }, goal!.user_id, 'EditGoalModal: Opening manual-to-milestone conversion dialog')
      setConversionDialog({
        open: true,
        from: 'manual',
        to: 'milestone'
      })
    }
  }

  // Confirm conversion
  const confirmConversion = () => {
    goalLogger.logConvert(goal?.id || '', conversionDialog.from, conversionDialog.to, goal?.user_id || '', { 
      UI_event: 'conversion_confirmed', 
      milestone_count: conversionDialog.milestoneCount 
    })
    convertGoalTypeMutation.mutate(conversionDialog.to)
  }

  // Cancel conversion
  const cancelConversion = () => {
    goalLogger.logUpdate(goal?.id || '', { 
      UI_event: 'conversion_cancelled', 
      from: conversionDialog.from, 
      to: conversionDialog.to 
    }, goal?.user_id || '', 'EditGoalModal: Goal type conversion cancelled')
    setConversionDialog({ open: false, from: 'manual', to: 'manual' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updates: Partial<Goal> = {
      title: formData.title,
      description: formData.description,
      category: formData.category || undefined,
      priority: formData.priority,
      status: formData.status,
      deadline: new Date(formData.deadline).toISOString(),
      progress: formData.progress,
      progress_type: formData.progress_type  // CRITICAL FIX: Include progress_type in updates
    }

    goalLogger.logUpdate(goal?.id || '', { 
      UI_event: 'form_submit', 
      updates, 
      form_data: formData 
    }, goal?.user_id || '', 'EditGoalModal: Form submitted')

    updateGoalMutation.mutate(updates)
  }

  // Track form field changes
  const handleFormDataChange = (field: string, value: any) => {
    goalLogger.logUpdate(goal?.id || '', { 
      UI_event: 'form_field_change', 
      field, 
      old_value: (formData as any)[field], 
      new_value: value 
    }, goal?.user_id || '', `EditGoalModal: ${field} changed`)
    
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleProgressChange = (value: number[]) => {
    handleFormDataChange('progress', value[0])
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
                onChange={(e) => handleFormDataChange('title', e.target.value)}
                placeholder="Enter your goal title..."
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormDataChange('description', e.target.value)}
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
                  onChange={(e) => handleFormDataChange('category', e.target.value)}
                  placeholder="e.g., Business, Health, Learning"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: any) => 
                  handleFormDataChange('priority', value)
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

            {/* Goal Type Selector */}
            <div>
              <Label htmlFor="goal-type">Goal Type</Label>
              <Select value={formData.progress_type} onValueChange={handleGoalTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>Regular Goal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="milestone">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4" />
                      <span>Milestone-Based Goal</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.progress_type === 'manual' 
                  ? 'Progress tracked manually (0-100%)'
                  : 'Progress calculated from milestone completion'
                }
              </p>
            </div>
          </div>

          {/* Progress Tracking - Show different UI based on goal type */}
          {formData.progress_type === 'milestone' ? (
            <div className="space-y-4">
              <Label>Milestone Progress Management</Label>
              <MilestoneManager 
                goal={goal} 
                onProgressUpdate={(newProgress) => {
                  setFormData(prev => ({ ...prev, progress: newProgress }))
                  // Force re-render to show updated progress
                  const updatedGoal = { ...goal, progress: newProgress }
                  // Trigger parent component update if needed
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('goalProgressUpdated', { 
                      detail: { goalId: goal.id, progress: newProgress } 
                    }))
                  }, 100)
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
                handleFormDataChange('status', value)
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
                onChange={(e) => handleFormDataChange('deadline', e.target.value)}
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

      {/* Goal Type Conversion Confirmation Dialog */}
      <AlertDialog open={conversionDialog.open} onOpenChange={(open) => 
        setConversionDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Convert Goal Type?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {conversionDialog.from === 'milestone' && conversionDialog.to === 'manual' ? (
                <div className="space-y-2">
                  <p>You're about to convert this milestone-based goal to a regular goal.</p>
                  {conversionDialog.milestoneCount && conversionDialog.milestoneCount > 0 ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="font-medium text-amber-800 dark:text-amber-200">
                        ⚠️ This will permanently delete {conversionDialog.milestoneCount} milestone{conversionDialog.milestoneCount > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Your current progress percentage will be preserved, but milestone structure will be lost.
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      The goal will switch to manual progress tracking.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p>You're about to convert this regular goal to milestone-based tracking.</p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <div>✓ Your current progress will be preserved</div>
                      <div>✓ You can then create milestones to structure your goal</div>
                      <div>✓ Progress will be calculated automatically from milestone completion</div>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={convertGoalTypeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConversion}
              disabled={convertGoalTypeMutation.isPending}
              className={conversionDialog.from === 'milestone' && conversionDialog.to === 'manual' 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {convertGoalTypeMutation.isPending ? "Converting..." : "Convert Goal Type"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}