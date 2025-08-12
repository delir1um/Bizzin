import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, Plus, TrendingUp, CheckCircle, Clock, AlertCircle, Lock, ArrowRight } from "lucide-react"
import { useLocation } from "wouter"

const demoGoals = [
  {
    id: "demo-1",
    title: "Reach R500K Annual Revenue",
    description: "Grow our small manufacturing business to R500,000 annual revenue by expanding our product line and reaching customers in Johannesburg, Pretoria, and surrounding areas.",
    progress: 75,
    status: "in_progress",
    priority: "high",
    category: "Revenue",
    deadline: "2025-12-31"
  },
  {
    id: "demo-2", 
    title: "Launch Online Store",
    description: "Build e-commerce website to sell our handcrafted products online. Include secure payment processing, inventory tracking, and customer accounts for repeat buyers.",
    progress: 85,
    status: "in_progress",
    priority: "high",
    category: "Marketing",
    deadline: "2025-09-15"
  },
  {
    id: "demo-3",
    title: "Expand to Durban Market",
    description: "Find distributor or retail partner in Durban to sell our products in KwaZulu-Natal. Target local gift shops, craft markets, and boutique stores.",
    progress: 20,
    status: "in_progress",
    priority: "medium", 
    category: "Expansion",
    deadline: "2025-11-01"
  },
  {
    id: "demo-4",
    title: "Secure R50K Equipment Loan",
    description: "Apply for small business development loan to purchase new production equipment. Research options with Nedbank, FNB, and local development finance institutions.",
    progress: 30,
    status: "in_progress",
    priority: "medium",
    category: "Finance",
    deadline: "2025-08-30"
  },
  {
    id: "demo-5",
    title: "Hire 2 Part-Time Staff",
    description: "Bring on Sarah for customer service and bookkeeping, plus one production assistant to help with order fulfillment during busy periods.",
    progress: 50,
    status: "in_progress",
    priority: "medium",
    category: "Team",
    deadline: "2025-10-15"
  },
  {
    id: "demo-6",
    title: "Business Registration Complete",
    description: "Successfully registered our business as a proprietary limited company, obtained tax clearance certificate, and set up SARS e-filing for VAT compliance.",
    progress: 100,
    status: "completed",
    priority: "high",
    category: "Legal",
    deadline: "2025-03-31"
  },
  {
    id: "demo-7",
    title: "First R100K Revenue Month",
    description: "Achieved our first R100,000 revenue month through consistent sales growth, repeat customers, and two major client orders from local businesses.",
    progress: 100,
    status: "completed",
    priority: "high",
    category: "Revenue",
    deadline: "2025-06-30"
  },
  {
    id: "demo-8",
    title: "Website and Branding Launch",
    description: "Completed professional website design, business logo, and marketing materials. Established consistent brand identity across all customer touchpoints.",
    progress: 100,
    status: "completed",
    priority: "medium",
    category: "Marketing",
    deadline: "2025-05-15"
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
      <div className="bg-white/80 dark:bg-[#0B0A1D]/80 backdrop-blur-sm border-b border-orange-200 dark:border-slate-700 min-h-[200px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Target className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Advanced Goal Analytics</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Professional goal tracking with progress analytics, priority filtering, status monitoring, and intelligent business insights
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Preview - Exact Portal Match */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-4 mb-6">
          <Card className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded">
                  <Target className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">8</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Total Goals</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-800 p-2 rounded">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">3</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">5</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">38%</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section - Matching Portal Style */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-600 to-red-500 text-white p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Set and Track Your Business Goals</h2>
            <p className="text-orange-100 mb-4">Create objectives with progress tracking, priority levels, and deadline management</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-white text-orange-600 hover:bg-orange-50 font-medium"
              >
                Start Goal Tracking <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters - Portal Style */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search goals by title or description..." 
              className="w-full pl-4 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              disabled
            />
          </div>
          
          {/* Filter Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Filters:</span>
            <Badge variant="outline" className="text-xs">Status: All Goals (8)</Badge>
            <Badge variant="outline" className="text-xs">Active (5)</Badge>
            <Badge variant="outline" className="text-xs">Completed (3)</Badge>
            <Badge variant="outline" className="text-xs">At Risk (0)</Badge>
            <Badge variant="outline" className="text-xs">Priority: All Priorities (8)</Badge>
            <Badge variant="outline" className="text-xs">High (4)</Badge>
            <Badge variant="outline" className="text-xs">Medium (4)</Badge>
            <Badge variant="outline" className="text-xs">Low (0)</Badge>
          </div>
          
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Showing 1-7 of 8 goals &nbsp;&nbsp;&nbsp;&nbsp; Page 1 of 1
          </div>
        </div>

        {/* Goals Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-orange-600 hover:bg-orange-700 ml-auto"
            >
              New Goal
            </Button>
          </div>

          {/* Goals Display - Show Multiple SA Business Examples */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {demoGoals.slice(0, 7).map((goal, index) => (
              <Card 
                key={goal.id}
                className={`${priorityColors[goal.priority as keyof typeof priorityColors]} border-l-4 bg-white dark:bg-slate-800 h-full flex flex-col`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <CardDescription className="text-sm mt-1 line-clamp-2">
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
                        <Badge variant="outline" className="capitalize">{goal.priority}</Badge>
                        <Badge variant="secondary">{goal.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400">
                          📅 Due {new Date(goal.deadline).toLocaleDateString('en-ZA')}
                        </span>
                        {goal.progress > 50 && (
                          <span className="text-green-600">✓ On track</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Call to Action */}
          <div className="text-center mt-6">
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              These are examples of goals you could track for your South African business with <em>Bizzin</em>
            </p>
            <Button 
              onClick={() => setLocation('/auth')}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              Start Creating Your Own Goals
            </Button>
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