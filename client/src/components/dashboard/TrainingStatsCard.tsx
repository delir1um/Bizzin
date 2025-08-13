import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Brain, PlayCircle, BookOpen, Info } from 'lucide-react'

interface TrainingStatsCardProps {
  onNavigate: (path: string) => void
}

export function TrainingStatsCard({ onNavigate }: TrainingStatsCardProps) {
  // Training modules data - This would typically come from a service
  // For now, using representative data based on the Training page structure
  const trainingStats = {
    modulesCompleted: 3, // Based on typical user progress
    totalModules: 12, // Total available modules
    learningStreak: 5, // Days with training activity
    timeInvestedHours: 8.5, // Hours spent this month
    nextRecommended: 'Business Model Canvas',
    completionRate: 25 // Percentage of modules completed
  }
  
  // Determine learning status and color
  const getLearningStatus = (streak: number, completionRate: number) => {
    if (completionRate >= 75) return { status: 'Advanced', color: 'text-green-600' }
    if (completionRate >= 50) return { status: 'Progressing', color: 'text-blue-600' }
    if (completionRate >= 25) return { status: 'Learning', color: 'text-orange-600' }
    if (streak > 0) return { status: 'Getting Started', color: 'text-purple-600' }
    return { status: 'Start Learning', color: 'text-gray-500' }
  }
  
  const learningInfo = getLearningStatus(trainingStats.learningStreak, trainingStats.completionRate)
  
  return (
    <Card className="relative overflow-hidden group 
      hover:shadow-lg hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30
      hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer
      hover:border-purple-300 dark:hover:border-purple-600
      bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 
      border-purple-200 dark:border-purple-800 h-full flex flex-col"
      onClick={() => onNavigate('/training')}
    >
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-900/10 
        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px] relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Brain className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Training</h3>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
          {trainingStats.modulesCompleted}/{trainingStats.totalModules} modules
        </Badge>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full space-y-4">
        {/* Primary Metrics */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {trainingStats.completionRate}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
          <div className={`text-xs font-medium ${learningInfo.color}`}>
            {learningInfo.status}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-purple-200/50 dark:bg-purple-800/30 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-400 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${trainingStats.completionRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0%</span>
            <span>100% mastery</span>
          </div>
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{trainingStats.learningStreak}</div>
            <div className="text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{trainingStats.timeInvestedHours}h</div>
            <div className="text-gray-600 dark:text-gray-400">This Month</div>
          </div>
        </div>
        
        {/* Next Recommended */}
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
          <BookOpen className="h-3 w-3 inline mr-1" />
          Next: {trainingStats.nextRecommended}
        </div>
        
        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>
        
        {/* Action Button */}
        <Button 
          onClick={() => onNavigate('/training')}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
          size="sm"
        >
          <PlayCircle className="h-4 w-4 mr-2" />
          Continue Learning
        </Button>
        

      </CardContent>
    </Card>
  )
}