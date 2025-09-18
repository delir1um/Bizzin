import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Edit3,
  Flag,
  FileText
} from "lucide-react"
import { Goal } from "@/types/goals"
import { format, differenceInDays, isAfter } from "date-fns"
import { MilestoneList } from "./MilestoneList"
import { cn } from "@/lib/utils"

interface GoalDetailsModalProps {
  goal: Goal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (goal: Goal) => void
}

const statusConfig = {
  not_started: {
    variant: "secondary" as const,
    className: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    icon: Play,
    label: "Not Started"
  },
  in_progress: {
    variant: "secondary" as const,
    className: "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
    icon: Clock,
    label: "In Progress"
  },
  completed: {
    variant: "secondary" as const,
    className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
    icon: CheckCircle,
    label: "Completed"
  },
  at_risk: {
    variant: "secondary" as const,
    className: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
    icon: AlertTriangle,
    label: "At Risk"
  },
  on_hold: {
    variant: "secondary" as const,
    className: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
    icon: Clock,
    label: "On Hold"
  }
}

export function GoalDetailsModal({ goal, open, onOpenChange, onEdit }: GoalDetailsModalProps) {
  if (!goal) return null

  const statusInfo = statusConfig[goal.status]
  const StatusIcon = statusInfo.icon
  const deadline = new Date(goal.deadline)
  const daysRemaining = differenceInDays(deadline, new Date())
  const isOverdue = isAfter(new Date(), deadline) && goal.status !== 'completed'

  const calculateMilestoneProgress = () => {
    if (!goal.milestones || goal.milestones.length === 0) {
      return 0
    }
    
    const totalWeight = goal.milestones.reduce((sum, milestone) => sum + (milestone.weight || 0), 0)
    if (totalWeight === 0) return 0
    
    const completedWeight = goal.milestones
      .filter(milestone => milestone.status === 'done')
      .reduce((sum, milestone) => sum + (milestone.weight || 0), 0)
    
    const normalizedProgress = Math.round((completedWeight / totalWeight) * 100)
    
    if (totalWeight < 100) {
      return Math.round((normalizedProgress * totalWeight) / 100)
    }
    
    return normalizedProgress
  }

  const getActualProgress = () => {
    if (goal.progress_type === 'milestone') {
      return calculateMilestoneProgress()
    }
    return goal.progress || 0
  }

  const getProgressText = () => {
    const actualProgress = getActualProgress()
    
    if (goal.target_value && goal.current_value) {
      return `${goal.current_value.toLocaleString()} / ${goal.target_value.toLocaleString()}`
    }
    return `${actualProgress}%`
  }

  const getTimeStatus = () => {
    if (goal.status === 'completed') {
      return {
        text: `Completed on ${format(new Date(goal.updated_at || goal.deadline), 'MMM d, yyyy')}`,
        icon: CheckCircle,
        className: "text-green-600 dark:text-green-400"
      }
    }
    
    if (isOverdue) {
      return {
        text: `${Math.abs(daysRemaining)} days overdue`,
        icon: AlertTriangle,
        className: "text-red-600 dark:text-red-400"
      }
    }
    
    if (daysRemaining === 0) {
      return {
        text: "Due today",
        icon: Clock,
        className: "text-yellow-600 dark:text-yellow-400"
      }
    }
    
    if (daysRemaining > 0) {
      return {
        text: `${daysRemaining} days remaining`,
        icon: Calendar,
        className: "text-slate-600 dark:text-slate-400"
      }
    }
  }

  const timeStatus = getTimeStatus()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="dialog-goal-details">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white pr-8">
              {goal.title}
            </DialogTitle>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(goal)}
                className="flex items-center gap-2"
                data-testid="button-edit-goal"
              >
                <Edit3 className="w-4 h-4" />
                Edit Goal
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Goal Overview Section */}
            <div className="space-y-4">
              {/* Status and Priority Row */}
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant={statusInfo.variant} className={`${statusInfo.className} text-sm font-medium px-3 py-2`}>
                  <StatusIcon className="w-4 h-4 mr-2" />
                  {statusInfo.label}
                </Badge>
                <Badge variant="outline" className="text-sm px-3 py-2 capitalize flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  {goal.priority} Priority
                </Badge>
                {goal.category && (
                  <Badge variant="outline" className="text-sm px-3 py-2">
                    {goal.category}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {goal.description && (
                <div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {goal.description}
                  </p>
                </div>
              )}

              {/* On Track Status */}
              {goal.status === 'in_progress' && !isOverdue && daysRemaining > 7 && (
                <div className="inline-flex items-center px-4 py-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <TrendingUp className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">Goal is on track</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Progress Tracking</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall Progress</span>
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{getProgressText()}</span>
                </div>
                <Progress value={getActualProgress()} className="h-3" />
                
                {/* Milestone Indicators */}
                {goal.progress_type === 'milestone' && goal.milestones && goal.milestones.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between relative h-2 mb-3">
                      {(() => {
                        let cumulativeWeight = 0
                        return goal.milestones.map((milestone, index) => {
                          const position = cumulativeWeight
                          cumulativeWeight += milestone.weight || 0
                          const isCompleted = milestone.status === 'done'
                          return (
                            <div
                              key={milestone.id}
                              className={`absolute w-3 h-3 rounded-full border-2 transform -translate-x-1.5 -translate-y-0.5 transition-colors duration-200 ${
                                isCompleted 
                                  ? 'bg-green-500 border-green-600 dark:bg-green-400 dark:border-green-500' 
                                  : 'bg-slate-300 border-slate-400 dark:bg-slate-600 dark:border-slate-500'
                              }`}
                              style={{ 
                                left: `${Math.min(position, 98)}%`,
                                zIndex: 10 
                              }}
                              title={`${milestone.title} (${milestone.weight}%) - ${isCompleted ? 'Completed' : 'Pending'}`}
                            />
                          )
                        })
                      })()}
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>{goal.milestones.filter(m => m.status === 'done').length} of {goal.milestones.length} milestones completed</span>
                      <span>Total Weight: {goal.milestones.reduce((sum, m) => sum + (m.weight || 0), 0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Timeline Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Timeline</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Target Date</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {format(deadline, 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                
                {timeStatus && (
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    timeStatus.className.includes('green') ? 'bg-green-50 dark:bg-green-950' :
                    timeStatus.className.includes('red') ? 'bg-red-50 dark:bg-red-950' :
                    timeStatus.className.includes('yellow') ? 'bg-yellow-50 dark:bg-yellow-950' :
                    'bg-slate-50 dark:bg-slate-950'
                  }`}>
                    <div className={`flex items-center font-medium ${timeStatus.className}`}>
                      <timeStatus.icon className="w-4 h-4 mr-2" />
                      {timeStatus.text}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Milestones Section */}
            {goal.progress_type === 'milestone' && goal.milestones && goal.milestones.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Milestones ({goal.milestones.filter(m => m.status === 'done').length}/{goal.milestones.length})
                    </h3>
                  </div>
                  
                  <MilestoneList
                    goalId={goal.id}
                    milestones={goal.milestones || []}
                    onMilestoneUpdate={() => {
                      // Refresh goal data after milestone updates
                      // This will be handled by React Query invalidation
                    }}
                  />
                </div>
              </>
            )}

            {/* Reflection Section */}
            {goal.reflection && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reflection</h3>
                  </div>
                  
                  <blockquote className="border-l-4 border-orange-200 dark:border-orange-800 pl-4 py-2 bg-orange-50 dark:bg-orange-950 rounded-r-lg">
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      {goal.reflection}
                    </p>
                  </blockquote>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}