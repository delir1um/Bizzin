import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Car, Home, BarChart3, Target, Activity } from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"
import { BusinessBudgetCalculator } from "@/components/bizbuilder/BusinessBudgetCalculator"

const tools = [
  {
    id: "business-budget",
    title: "Business Budget Calculator",
    description: "Plan and track your business income and expenses with detailed budget analysis",
    icon: DollarSign,
    category: "Essential Calculators",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  {
    id: "cash-flow",
    title: "Cash Flow Projection Tool",
    description: "Forecast your business cash flow to better plan for the future",
    icon: TrendingUp,
    category: "Essential Calculators",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  {
    id: "break-even",
    title: "Break-Even Calculator",
    description: "Determine the break-even point for your business operations",
    icon: BarChart3,
    category: "Essential Calculators",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  }
]

const categories = [
  "All Tools",
  "Essential Calculators"
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
            <Button 
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/20"
            >
              <Calculator className="w-4 h-4 mr-2" />
              All Tools
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">3</div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Essential Tools</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">Free</div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Access Level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">24/7</div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
      <AnimatedGrid className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" stagger={0.1}>
        {filteredTools.map((tool, index) => {
          const IconComponent = tool.icon
          return (
            <AnimatedItem key={tool.id}>
              <Card 
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
            </AnimatedItem>
          )
        })}
      </AnimatedGrid>

      {/* Usage & Access Info */}
      <div className="mt-12">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Calculator Access</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Free Tier</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Limited calculations per month with basic export functionality
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Paid Subscription</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Unlimited calculations with advanced export and saving features
              </p>
            </div>
          </div>
        </div>

        {/* Phase 2 Features */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Phase 2 Features</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 opacity-60">
              <CardHeader>
                <CardTitle className="text-lg text-slate-600 dark:text-slate-400">
                  SARS API Integration
                </CardTitle>
                <CardDescription>
                  Automatic tax updates and compliance features
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 opacity-60">
              <CardHeader>
                <CardTitle className="text-lg text-slate-600 dark:text-slate-400">
                  Advanced Reporting
                </CardTitle>
                <CardDescription>
                  Detailed analytics and business insights
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-600 opacity-60">
              <CardHeader>
                <CardTitle className="text-lg text-slate-600 dark:text-slate-400">
                  Additional Calculators
                </CardTitle>
                <CardDescription>
                  Tax estimators, loan calculators, and more
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Business Budget Calculator */}
      {selectedTool === 'business-budget' && (
        <BusinessBudgetCalculator onClose={() => setSelectedTool(null)} />
      )}

      {/* Other Tools - Future Implementation */}
      {selectedTool && selectedTool !== 'business-budget' && (
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