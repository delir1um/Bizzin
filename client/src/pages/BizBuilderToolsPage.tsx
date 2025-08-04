import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Car, Home, BarChart3, Target, Activity, CreditCard } from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"
import { BusinessBudgetCalculator } from "@/components/bizbuilder/BusinessBudgetCalculator"
import { CashFlowProjectionTool } from "@/components/bizbuilder/CashFlowProjectionTool"
import BreakEvenCalculator from "@/components/bizbuilder/BreakEvenCalculator"
import LoanAmortisationCalculator from "@/components/bizbuilder/LoanAmortisationCalculator"

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
  },
  {
    id: "loan-amortisation",
    title: "Loan Amortisation Calculator",
    description: "Calculate loan payments, interest schedules, and early payoff scenarios",
    icon: CreditCard,
    category: "Essential Calculators",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
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
      <AnimatedGrid className="grid gap-8 grid-cols-1 md:grid-cols-3" stagger={0.1}>
        {filteredTools.map((tool, index) => {
          const IconComponent = tool.icon
          return (
            <AnimatedItem key={tool.id}>
              <Card 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-orange-200 dark:hover:border-orange-800 h-full flex flex-col"
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
              
              <CardContent className="pt-0 flex-1 flex flex-col justify-end">
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



      {/* Business Budget Calculator */}
      {selectedTool === 'business-budget' && (
        <BusinessBudgetCalculator onClose={() => setSelectedTool(null)} />
      )}

      {/* Cash Flow Projection Tool */}
      {selectedTool === 'cash-flow' && (
        <CashFlowProjectionTool onClose={() => setSelectedTool(null)} />
      )}

      {/* Break-Even Calculator */}
      {selectedTool === 'break-even' && (
        <BreakEvenCalculator onClose={() => setSelectedTool(null)} />
      )}

      {/* Loan Amortisation Calculator */}
      {selectedTool === 'loan-amortisation' && (
        <LoanAmortisationCalculator onClose={() => setSelectedTool(null)} />
      )}

      {/* Other Tools - Future Implementation */}
      {selectedTool && !['business-budget', 'cash-flow', 'break-even', 'loan-amortisation'].includes(selectedTool) && (
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