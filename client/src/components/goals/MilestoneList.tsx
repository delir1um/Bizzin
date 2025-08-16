import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { MilestonesService } from "@/lib/services/milestones"
import { GoalsService } from "@/lib/services/goals"
import { Milestone } from "@/types/goals"
import { Plus, GripVertical, Calendar, Trash2, Weight } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { MilestoneTemplates } from "./MilestoneTemplates"

interface MilestoneListProps {
  goalId: string
  milestones: Milestone[]
  isLoading?: boolean
  useWeightedProgress?: boolean
  onMilestoneUpdate?: () => void
}

export function MilestoneList({ goalId, milestones, isLoading, useWeightedProgress = false, onMilestoneUpdate }: MilestoneListProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("")
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { status?: 'todo' | 'in_progress' | 'done' } }) => {
      const updatedMilestone = await MilestonesService.updateMilestone(id, updates)
      // Update goal progress after milestone status change using weighted calculation if enabled
      await GoalsService.updateGoalProgress(goalId)
      return updatedMilestone
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      onMilestoneUpdate?.()
    },
    onError: (error) => {
      console.error('Error updating milestone:', error)
      toast({
        title: "Error",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      })
    },
  })

  const createMilestoneMutation = useMutation({
    mutationFn: async (title: string) => {
      const orderIndex = MilestonesService.getNextOrderIndex(milestones)
      const newMilestone = await MilestonesService.createMilestone({
        goal_id: goalId,
        title,
        status: 'todo',
        order_index: orderIndex,
        weight: 1,
      })
      // Update goal progress after adding milestone
      await GoalsService.updateGoalProgress(goalId)
      return newMilestone
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      setNewMilestoneTitle("")
      setIsAddingMilestone(false)
      onMilestoneUpdate?.()
      toast({
        title: "Success",
        description: "Milestone added successfully!",
      })
    },
    onError: (error) => {
      console.error('Error creating milestone:', error)
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      })
    },
  })

  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: string) => {
      await MilestonesService.deleteMilestone(id)
      // Update goal progress after deleting milestone
      await GoalsService.updateGoalProgress(goalId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      onMilestoneUpdate?.()
      toast({
        title: "Success",
        description: "Milestone deleted successfully!",
      })
    },
    onError: (error) => {
      console.error('Error deleting milestone:', error)
      toast({
        title: "Error",
        description: "Failed to delete milestone. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleStatusToggle = (milestone: Milestone) => {
    const newStatus = milestone.status === 'done' ? 'todo' : 'done'
    updateMilestoneMutation.mutate({ id: milestone.id, updates: { status: newStatus } })
  }

  const handleAddMilestone = () => {
    if (newMilestoneTitle.trim()) {
      createMilestoneMutation.mutate(newMilestoneTitle.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddMilestone()
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {milestones.map((milestone) => (
          <motion.div
            key={milestone.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-center space-x-3 p-2 rounded-md border transition-colors",
              milestone.status === 'done' 
                ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            )}
          >
            <Checkbox
              checked={milestone.status === 'done'}
              onCheckedChange={() => handleStatusToggle(milestone)}
              disabled={updateMilestoneMutation.isPending}
              className="flex-shrink-0"
            />
            
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                milestone.status === 'done' && "line-through text-slate-500 dark:text-slate-400"
              )}>
                {milestone.title}
              </p>
              {milestone.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {milestone.description}
                </p>
              )}
            </div>

            {milestone.due_date && (
              <div className="flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{new Date(milestone.due_date).toLocaleDateString()}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {useWeightedProgress && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Weight className="w-3 h-3" />
                  {milestone.weight}x
                </Badge>
              )}
              <Badge 
                variant={milestone.status === 'done' ? 'default' : milestone.status === 'in_progress' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {milestone.status === 'done' ? 'Done' : milestone.status === 'in_progress' ? 'In Progress' : 'To Do'}
              </Badge>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteMilestoneMutation.mutate(milestone.id)}
              disabled={deleteMilestoneMutation.isPending}
              className="text-slate-400 hover:text-red-600 p-1 h-6 w-6"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Template Selection and Add New Milestone */}
      <div className="flex gap-2 mt-4">
        <MilestoneTemplates 
          goalId={goalId} 
          onTemplateApplied={() => {
            onMilestoneUpdate?.()
          }} 
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingMilestone(true)}
          className="flex-1 text-slate-600 dark:text-slate-400 border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add milestone
        </Button>
      </div>

      {/* Add new milestone form */}
      {isAddingMilestone ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center space-x-2"
        >
          <Input
            placeholder="Enter milestone title..."
            value={newMilestoneTitle}
            onChange={(e) => setNewMilestoneTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={createMilestoneMutation.isPending}
            className="flex-1 text-sm"
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleAddMilestone}
            disabled={!newMilestoneTitle.trim() || createMilestoneMutation.isPending}
          >
            Add
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddingMilestone(false)
              setNewMilestoneTitle("")
            }}
            disabled={createMilestoneMutation.isPending}
          >
            Cancel
          </Button>
        </motion.div>
      ) : null}

      {milestones.length === 0 && !isAddingMilestone && (
        <div className="text-center py-4 text-slate-500 dark:text-slate-400">
          <p className="text-sm">No milestones yet</p>
          <p className="text-xs">Break down your goal into actionable steps</p>
        </div>
      )}
    </div>
  )
}