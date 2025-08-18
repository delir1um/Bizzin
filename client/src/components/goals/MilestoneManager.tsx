import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { MilestonesService } from "@/lib/services/milestones"
import { GoalsService } from "@/lib/services/goals"
import { Goal, Milestone } from "@/types/goals"
import { Target, Plus, Edit3, Trash2, CheckCircle, Circle, Calendar, Weight } from "lucide-react"

interface MilestoneManagerProps {
  goal: Goal
  onProgressUpdate?: (newProgress: number) => void
}

export function MilestoneManager({ goal, onProgressUpdate }: MilestoneManagerProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [editingMilestone, setEditingMilestone] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    weight: 10
  })
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    weight: 10
  })

  // Fetch milestones for this goal
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', goal.id],
    queryFn: () => MilestonesService.getMilestonesByGoalId(goal.id),
    enabled: !!goal.id
  })

  // Calculate progress from completed milestones
  const calculateProgress = () => {
    return calculateProgressFromMilestones(milestones)
  }

  const calculateProgressFromMilestones = (milestonesList: Milestone[]) => {
    if (!milestonesList || milestonesList.length === 0) return 0
    
    const totalWeight = milestonesList.reduce((sum: number, m: Milestone) => sum + (m.weight || 0), 0)
    if (totalWeight === 0) return 0
    
    const completedWeight = milestonesList
      .filter((m: Milestone) => m.status === 'done')
      .reduce((sum: number, m: Milestone) => sum + (m.weight || 0), 0)
    
    // Normalize progress based on current total weight (handles partial milestone setups)
    const normalizedProgress = Math.round((completedWeight / totalWeight) * 100)
    
    // If milestones don't total 100%, show proportional progress
    if (totalWeight < 100) {
      return Math.round((normalizedProgress * totalWeight) / 100)
    }
    
    return normalizedProgress
  }

  // Update goal progress when milestones change
  useEffect(() => {
    const newProgress = calculateProgress()
    if (onProgressUpdate) {
      onProgressUpdate(newProgress)
    }
    
    // Also update the goal in the database to keep them in sync
    if (milestones.length > 0) {
      GoalsService.updateGoal(goal.id, { progress: newProgress })
        .then(() => {
          console.log(`Goal progress synced: ${newProgress}%`)
        })
        .catch(error => {
          console.error('Failed to sync goal progress:', error)
        })
    }
  }, [milestones, goal.id])

  // Toggle milestone completion
  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string, completed: boolean }) => {
      return await MilestonesService.updateMilestone(milestoneId, { 
        status: completed ? 'done' : 'todo'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', goal.id] })
      
      // Calculate and update goal progress immediately
      setTimeout(() => {
        // Use a small delay to ensure milestone data is updated first
        const { data: updatedMilestones } = queryClient.getQueryData(['milestones', goal.id]) || { data: [] }
        const milestonesList = updatedMilestones || milestones
        const newProgress = calculateProgressFromMilestones(milestonesList)
        
        GoalsService.updateGoal(goal.id, { progress: newProgress })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['goals'] })
            console.log(`Goal progress updated to ${newProgress}% after milestone toggle`)
          })
      }, 100)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      })
    }
  })

  // Add new milestone
  const addMilestoneMutation = useMutation({
    mutationFn: async () => {
      return await MilestonesService.createMilestone({
        goal_id: goal.id,
        title: newMilestone.title,
        description: newMilestone.description,
        weight: newMilestone.weight,
        order_index: milestones.length + 1,
        status: 'todo'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', goal.id] })
      setNewMilestone({ title: '', description: '', weight: 10 })
      toast({
        title: "Milestone Added",
        description: "New milestone created successfully!",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      })
    }
  })

  // Edit milestone
  const editMilestoneMutation = useMutation({
    mutationFn: async () => {
      if (!editingMilestone) throw new Error('No milestone selected for editing')
      return await MilestonesService.updateMilestone(editingMilestone, {
        title: editData.title,
        description: editData.description,
        weight: editData.weight
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', goal.id] })
      setEditingMilestone(null)
      setEditData({ title: '', description: '', weight: 10 })
      toast({
        title: "Milestone Updated",
        description: "Milestone updated successfully!",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update milestone. Please try again.",
        variant: "destructive",
      })
    }
  })

  // Delete milestone
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return await MilestonesService.deleteMilestone(milestoneId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', goal.id] })
      toast({
        title: "Milestone Deleted",
        description: "Milestone removed successfully!",
      })
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: "Failed to delete milestone. Please try again.",
        variant: "destructive",
      })
    }
  })

  const handleToggleMilestone = (milestone: Milestone) => {
    toggleMilestoneMutation.mutate({
      milestoneId: milestone.id,
      completed: milestone.status !== 'done'
    })
  }

  const handleAddMilestone = (e?: React.MouseEvent) => {
    // FIX #3: Prevent modal from closing when adding milestone
    e?.preventDefault()
    e?.stopPropagation()
    
    if (!newMilestone.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a milestone title.",
        variant: "destructive",
      })
      return
    }
    
    // FIX #4: Validate milestone weight logic
    const currentTotal = totalWeight
    const newTotal = currentTotal + newMilestone.weight
    
    if (newTotal > 100) {
      toast({
        title: "Weight Limit Exceeded", 
        description: `Adding this milestone would make total weight ${newTotal}%. Maximum allowed is 100%.`,
        variant: "destructive",
      })
      return
    }
    
    // Allow adding milestones that get us closer to 100%, but warn about the goal
    if (newTotal < 100 && milestones.length > 0) {
      toast({
        title: "Milestone Added",
        description: `Milestone added. Total weight is now ${newTotal}%. You'll need more milestones to reach 100% for accurate progress tracking.`,
      })
    }
    
    addMilestoneMutation.mutate()
  }

  const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 0), 0)
  const currentProgress = calculateProgress()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-slate-600 dark:text-slate-400">
            Loading milestones...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Milestone Progress
          </CardTitle>
          <CardDescription>
            Track your goal completion through milestone achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <Badge variant={currentProgress === 100 ? "default" : "secondary"}>
                {currentProgress}%
              </Badge>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className="bg-orange-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${currentProgress}%` }}
              />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {milestones.filter(m => m.status === 'done').length} of {milestones.length} milestones completed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>
            Complete milestones to automatically update your goal progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              data-milestone-weight={milestone.weight || 0}
              className={`p-4 border rounded-lg transition-all duration-200 ${
                milestone.status === 'done'
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
            >
              {editingMilestone === milestone.id ? (
                // Edit mode
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <Label htmlFor={`edit-title-${milestone.id}`}>Title</Label>
                      <Input
                        id={`edit-title-${milestone.id}`}
                        value={editData.title}
                        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Milestone title"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-weight-${milestone.id}`}>Weight (%)</Label>
                      <Input
                        id={`edit-weight-${milestone.id}`}
                        type="number"
                        min="1"
                        max="100"
                        value={editData.weight}
                        onChange={(e) => setEditData(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`edit-description-${milestone.id}`}>Description</Label>
                    <Textarea
                      id={`edit-description-${milestone.id}`}
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingMilestone(null)
                        setEditData({ title: '', description: '', weight: 10 })
                      }}
                      disabled={editMilestoneMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (!editData.title.trim()) {
                          toast({
                            title: "Error",
                            description: "Please enter a milestone title.",
                            variant: "destructive",
                          })
                          return
                        }
                        editMilestoneMutation.mutate()
                      }}
                      disabled={editMilestoneMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {editMilestoneMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={milestone.status === 'done'}
                    onCheckedChange={() => handleToggleMilestone(milestone)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${
                        milestone.status === 'done' 
                          ? 'line-through text-slate-500' 
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {milestone.title}
                      </h4>
                      <Badge variant="outline">
                        {milestone.weight || 0}%
                      </Badge>
                    </div>
                    {milestone.description && (
                      <p className={`text-sm mt-1 ${
                        milestone.status === 'done' 
                          ? 'line-through text-slate-400' 
                          : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {milestone.description}
                      </p>
                    )}
                    {milestone.status === 'done' && milestone.updated_at && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Completed {new Date(milestone.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        // FIX #5: Prevent modal from closing when clicking edit
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingMilestone(milestone.id)
                        setEditData({
                          title: milestone.title,
                          description: milestone.description || '',
                          weight: milestone.weight || 10
                        })
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        // FIX #6: Prevent modal from closing and add confirmation
                        e.preventDefault()
                        e.stopPropagation()
                        if (window.confirm(`Are you sure you want to delete "${milestone.title}"? This action cannot be undone.`)) {
                          deleteMilestoneMutation.mutate(milestone.id)
                        }
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {milestones.length === 0 && (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No milestones yet. Add your first milestone below.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Milestone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Milestone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="new-milestone-title">Milestone Title</Label>
              <Input
                id="new-milestone-title"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Complete user research"
              />
            </div>
            <div>
              <Label htmlFor="new-milestone-weight">Weight (%)</Label>
              <Input
                id="new-milestone-weight"
                type="number"
                min="1"
                max="100"
                value={newMilestone.weight}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, weight: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="new-milestone-description">Description (Optional)</Label>
            <Textarea
              id="new-milestone-description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this milestone involves..."
              rows={2}
            />
          </div>
          
          {/* Weight validation display */}
          <div className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Weight:</span>
              <Badge variant={totalWeight === 100 ? "default" : totalWeight < 100 ? "secondary" : "destructive"}>
                {totalWeight}%
              </Badge>
            </div>
            {totalWeight === 100 && (
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ Perfect! Your milestones total 100% for accurate progress tracking.
              </p>
            )}
            {totalWeight < 100 && (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                ⚠️ Total is {totalWeight}%. You need {100 - totalWeight}% more weight to reach 100% for accurate progress.
              </p>
            )}
            {totalWeight > 100 && (
              <p className="text-sm text-red-700 dark:text-red-300">
                ❌ Total exceeds 100%! Reduce weights by {totalWeight - 100}% to fix progress calculation.
              </p>
            )}
          </div>

          <Button 
            onClick={handleAddMilestone} 
            disabled={addMilestoneMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {addMilestoneMutation.isPending ? "Adding..." : "Add Milestone"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}