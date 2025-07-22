import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Car, Home, BarChart3, Target, Activity } from "lucide-react"

const tools = [
  {
    id: "business-budget",
    title: "My Business Budget",
    description: "Plan and track your business income and expenses",
    icon: DollarSign,
    category: "Financial Planning",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  {
    id: "cash-flow",
    title: "Cash Flow Projection",
    description: "Forecast your business cash flow for better planning",
    icon: TrendingUp,
    category: "Financial Planning",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  {
    id: "tax-estimator",
    title: "Tax Estimator",
    description: "Calculate estimated tax obligations for your business",
    icon: Calculator,
    category: "Tax & Compliance",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  },
  {
    id: "vehicle-finance",
    title: "Vehicle Finance Calculator",
    description: "Calculate vehicle loan payments and affordability",
    icon: Car,
    category: "Loans & Finance",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  {
    id: "home-loan",
    title: "Bond / Home Loan Calculator",
    description: "Calculate home loan payments and total interest",
    icon: Home,
    category: "Loans & Finance",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
  },
  {
    id: "break-even",
    title: "Break-Even Calculator",
    description: "Determine the break-even point for your business",
    icon: BarChart3,
    category: "Business Analysis",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  },
  {
    id: "pricing-tool",
    title: "Pricing Tool",
    description: "Set optimal pricing for your products and services",
    icon: Target,
    category: "Business Analysis",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  },
  {
    id: "health-check",
    title: "Business Health Check",
    description: "Assess your business performance and identify areas for improvement",
    icon: Activity,
    category: "Business Analysis",
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200"
  }
]

const categories = [
  "All Tools",
  "Financial Planning",
  "Tax & Compliance", 
  "Loans & Finance",
  "Business Analysis"
]

export function BizBuilderToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Tools")
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const filteredTools = selectedCategory === "All Tools" 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory)

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId)
    // Future: Open tool interface
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">BizBuilder Tools</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Essential calculators and tools to help you plan and manage your business
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button variant="outline">
              <Calculator className="w-4 h-4 mr-2" />
              All Tools
            </Button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-orange-600 hover:bg-orange-700" : ""}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTools.map((tool) => {
          const IconComponent = tool.icon
          return (
            <Card 
              key={tool.id}
              className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-orange-200 dark:hover:border-orange-800"
              onClick={() => handleToolSelect(tool.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-3">
                    <IconComponent className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <Badge className={tool.color} variant="secondary">
                    {tool.category.split(' ')[0]}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription className="text-sm">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToolSelect(tool.id)
                  }}
                >
                  Open Tool
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Coming Soon Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Coming Soon</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 opacity-60">
            <CardHeader>
              <CardTitle className="text-lg text-slate-600 dark:text-slate-400">
                SARS Tax Integration
              </CardTitle>
              <CardDescription>
                Automatic tax bracket updates and compliance features
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 opacity-60">
            <CardHeader>
              <CardTitle className="text-lg text-slate-600 dark:text-slate-400">
                Invoice Generator
              </CardTitle>
              <CardDescription>
                Professional invoice creation and management
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 opacity-60">
            <CardHeader>
              <CardTitle className="text-lg text-slate-600 dark:text-slate-400">
                Accounting Integration
              </CardTitle>
              <CardDescription>
                Connect with Xero, QuickBooks, and other platforms
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Tool Placeholder - Future Implementation */}
      {selectedTool && (
        <div className="mt-8 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-center">
            <Calculator className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Tool Interface Coming Soon
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              The {tools.find(t => t.id === selectedTool)?.title} interface will be available in a future update.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setSelectedTool(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}