import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Plus, TrendingUp, CheckCircle, Clock, AlertCircle, Lock, ArrowRight } from "lucide-react"
import { useLocation } from "wouter"

const demoGoals = [
  {
    id: "demo-1",
    title: "Launch MVP Product",
    description: "Develop and launch the minimum viable product for our SaaS platform",
    progress: 75,
    status: "in_progress",
    priority: "high",
    category: "Product",
    deadline: "2025-08-15",
    isBlurred: false
  },
  {
    id: "demo-2", 
    title: "Hire 3 Engineers",
    description: "Expand the technical team to accelerate development",
    progress: 40,
    status: "in_progress",
    priority: "medium",
    category: "Growth",
    deadline: "2025-09-01",
    isBlurred: true
  },
  {
    id: "demo-3",
    title: "Reach $10K MRR",
    description: "Achieve monthly recurring revenue milestone",
    progress: 90,
    status: "completed",
    priority: "high", 
    category: "Revenue",
    deadline: "2025-07-30",
    isBlurred: true
  }
]

const statusConfig = {
  not_started: { label: "Not Started", className: "bg-gray-100 text-gray-800", icon: Clock },
  in_progress: { label: "In Progress", className: "bg-orange-100 text-orange-800", icon: Clock },
  completed: { label: "Completed", className: "bg-green-100 text-green-800", icon: CheckCircle },
  at_risk: { label: "At Risk", className: "bg-red-100 text-red-800", icon: AlertCircle }
}

const priorityColors = {
  low: "border-l-green-500",
  medium: "border-l-amber-500", 
  high: "border-l-red-500"
}

export function GoalsPreviewPage() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:bg-[#0B0A1D]">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-[#0B0A1D]/80 backdrop-blur-sm border-b border-orange-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Goals Tracking</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Create and track your own business goals with our comprehensive management system
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Preview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Track Goals</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Organized</div>
              <p className="text-xs text-muted-foreground">Set and prioritize</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Visual</div>
              <p className="text-xs text-muted-foreground">Track completion</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filter & Sort</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Flexible</div>
              <p className="text-xs text-muted-foreground">Find what matters</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-600 to-red-500 text-white p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Ready to Set Your Goals?</h2>
            <p className="text-orange-100 mb-4">Create and manage your own business objectives with our goal tracking system</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-white text-orange-600 hover:bg-orange-50 font-medium"
              >
                Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

            </div>
          </div>
        </div>

        {/* Goals Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Example Goal Layout</h2>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {demoGoals.map((goal, index) => (
              <Card 
                key={goal.id} 
                className={`${priorityColors[goal.priority as keyof typeof priorityColors]} border-l-4 relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm ${goal.isBlurred ? 'opacity-60' : ''}`}
              >
                {goal.isBlurred && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Sign up to see all goals
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-orange-600 hover:bg-orange-700"
                        onClick={() => setLocation('/auth')}
                      >
                        Unlock Now
                      </Button>
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{goal.title}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {goal.description}
                      </CardDescription>
                    </div>
                    <Badge className={statusConfig[goal.status as keyof typeof statusConfig].className}>
                      {statusConfig[goal.status as keyof typeof statusConfig].label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-300">Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                    
                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{goal.priority}</Badge>
                        <Badge variant="secondary">{goal.category}</Badge>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400">
                        Due {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Target className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Goal Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Create goals with descriptions, deadlines, priorities, and categories
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Monitor progress with visual indicators and status updates
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Organization</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Filter by status, priority, search, and sort to stay organized
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <Button 
            size="lg"
            onClick={() => setLocation('/auth')}
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg"
          >
            Start Tracking Your Goals Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Free trial • No credit card required
          </p>
        </div>
      </div>
    </div>
  )
}