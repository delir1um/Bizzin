import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Car, Home, BarChart3, Target, Activity, CreditCard, Calendar, PiggyBank, Percent } from "lucide-react"
import { motion } from "framer-motion"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"
import { BusinessBudgetCalculator } from "@/components/bizbuilder/BusinessBudgetCalculator"

import BreakEvenCalculator from "@/components/bizbuilder/BreakEvenCalculator"
import LoanAmortisationCalculator from "@/components/bizbuilder/LoanAmortisationCalculator"
import CashFlowCalculator from "@/components/bizbuilder/CashFlowCalculator"
import CompoundInterestCalculator from "@/components/bizbuilder/CompoundInterestCalculator"
import SimpleInterestCalculator from "@/components/bizbuilder/SimpleInterestCalculator"

const tools = [
  {
    id: "business-budget",
    title: "Business Budget Calculator",
    description: "Plan and track your business income and expenses with detailed budget analysis",
    icon: DollarSign,
    category: "Financial Planning",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  {
    id: "cash-flow",
    title: "Cash Flow Projection Calculator",
    description: "Project monthly cash flows and identify potential shortfalls before they happen",
    icon: Calendar,
    category: "Financial Planning",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  {
    id: "break-even",
    title: "Break-Even Calculator",
    description: "Determine the break-even point for your business operations with margin of safety analysis",
    icon: BarChart3,
    category: "Business Analysis",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  {
    id: "loan-amortisation",
    title: "Loan Amortisation Calculator",
    description: "Calculate loan payments, interest schedules, and early payoff scenarios",
    icon: CreditCard,
    category: "Financial Planning",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  },
  {
    id: "compound-interest",
    title: "Compound Interest Calculator",
    description: "Calculate investment growth with compound interest and monthly contributions",
    icon: PiggyBank,
    category: "Investment Analysis",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
  },
  {
    id: "simple-interest",
    title: "Simple Interest Calculator",
    description: "Calculate simple interest with monthly compounding and tax considerations",
    icon: Percent,
    category: "Investment Analysis",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
  }
]

const categories = [
  "All Tools",
  "Financial Planning",
  "Business Analysis",
  "Investment Analysis"
]

export function BizBuilderToolsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Tools")
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const filteredTools = selectedCategory === "All Tools" 
    ? tools 
    : tools.filter(tool => tool.category === selectedCategory)

  const handleToolSelect = (toolId: string) => {
    // Add delightful transition animation
    const toolElement = document.querySelector(`[data-tool-id="${toolId}"]`) as HTMLElement
    if (toolElement) {
      toolElement.style.transform = 'scale(0.95)'
      setTimeout(() => {
        toolElement.style.transform = 'scale(1)'
      }, 150)
    }
    
    setSelectedTool(toolId)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header - Exact Same Animation as Journal & Goals */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          >
            <motion.h1 
              className="text-3xl font-bold text-slate-900 dark:text-white"
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
            >
              <motion.span
                animate={{ 
                  color: ["#1e293b", "#ea7a57", "#1e293b"],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="dark:animate-none dark:text-white"
              >
                Professional Financial Suite
              </motion.span>
            </motion.h1>
            <motion.p 
              className="mt-2 text-lg text-slate-600 dark:text-slate-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Complete business intelligence platform with professional calculators and analysis tools
            </motion.p>
            <motion.div 
              className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span>Financial Planning - Budget, cash flow, and loan analysis</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span>Business Analysis - Break-even and performance metrics</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                <span>Investment Analysis - Interest calculations and growth projections</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="mt-4 sm:mt-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "backOut" }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/20
                  transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Professional Suite
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>



      {/* Category Filter with Smooth Animations */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      >
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.5 + (index * 0.1),
                ease: "backOut"
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`
                  ${selectedCategory === category ? "bg-orange-600 hover:bg-orange-700" : ""}
                  transition-all duration-300 ease-out
                  hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0
                `}
              >
                {category}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tools Grid with Enhanced Animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <AnimatedGrid className="grid gap-8 grid-cols-1 md:grid-cols-3" stagger={0.15}>
        {filteredTools.map((tool, index) => {
          const IconComponent = tool.icon
          return (
            <AnimatedItem key={tool.id}>
              <motion.div
                layout
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ 
                  scale: 0.98,
                  transition: { duration: 0.1 }
                }}
              >
                <Card 
                  className="group cursor-pointer border h-full flex flex-col relative overflow-hidden
                    bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm
                    hover:border-orange-300 dark:hover:border-orange-700
                    hover:shadow-xl hover:shadow-orange-100/20 dark:hover:shadow-orange-900/20
                    transition-all duration-300 ease-out"
                  onClick={() => handleToolSelect(tool.id)}
                >
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-900/10 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-start justify-between">
                      {/* Animated Icon Container */}
                      <motion.div 
                        className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-3
                          group-hover:bg-orange-200 dark:group-hover:bg-orange-800
                          transition-colors duration-300"
                        whileHover={{ 
                          rotate: [0, -10, 10, 0],
                          scale: 1.1
                        }}
                        transition={{ duration: 0.4 }}
                      >
                        <IconComponent className="w-6 h-6 text-orange-600 dark:text-orange-400 
                          group-hover:text-orange-700 dark:group-hover:text-orange-300
                          transition-colors duration-300" />
                      </motion.div>
                      
                      {/* Animated Badge */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (index * 0.05) }}
                      >
                        <Badge 
                          className={`${tool.color} group-hover:shadow-sm transition-shadow duration-300`} 
                          variant="secondary"
                        >
                          {tool.category}
                        </Badge>
                      </motion.div>
                    </div>
                    
                    {/* Animated Title */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (index * 0.05) }}
                    >
                      <CardTitle className="text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 
                        transition-colors duration-300">
                        {tool.title}
                      </CardTitle>
                    </motion.div>
                    
                    {/* Animated Description */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + (index * 0.05) }}
                    >
                      <CardDescription className="text-sm leading-relaxed">
                        {tool.description}
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 flex-1 flex flex-col justify-end relative z-10">
                    {/* Animated Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + (index * 0.05) }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        className="w-full bg-orange-600 hover:bg-orange-700 
                          transform transition-all duration-300 ease-out
                          hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30
                          group-hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToolSelect(tool.id)
                        }}
                      >
                        <motion.span
                          initial={{ opacity: 1 }}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2"
                        >
                          Open Tool
                          <motion.div
                            animate={{ x: [0, 4, 0] }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity, 
                              ease: "easeInOut" 
                            }}
                          >
                            →
                          </motion.div>
                        </motion.span>
                      </Button>
                    </motion.div>
                  </CardContent>
                  
                  {/* Hover Effect Shine */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                      transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                      transition-transform duration-700 ease-out" />
                  </div>
                </Card>
              </motion.div>
            </AnimatedItem>
          )
        })}
        </AnimatedGrid>
      </motion.div>



      {/* Business Budget Calculator */}
      {selectedTool === 'business-budget' && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <BusinessBudgetCalculator onClose={() => setSelectedTool(null)} />
        </motion.div>
      )}

      {/* Cash Flow Projection Calculator */}
      {selectedTool === 'cash-flow' && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <CashFlowCalculator onClose={() => setSelectedTool(null)} />
        </motion.div>
      )}

      {/* Break-Even Calculator */}
      {selectedTool === 'break-even' && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <BreakEvenCalculator onClose={() => setSelectedTool(null)} />
        </motion.div>
      )}

      {/* Loan Amortisation Calculator */}
      {selectedTool === 'loan-amortisation' && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <LoanAmortisationCalculator onClose={() => setSelectedTool(null)} />
        </motion.div>
      )}

      {/* Compound Interest Calculator */}
      {selectedTool === 'compound-interest' && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <CompoundInterestCalculator onClose={() => setSelectedTool(null)} />
        </motion.div>
      )}

      {/* Simple Interest Calculator */}
      {selectedTool === 'simple-interest' && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <SimpleInterestCalculator onClose={() => setSelectedTool(null)} />
        </motion.div>
      )}

      {/* Tool Opening Animation */}
      {selectedTool && !['business-budget', 'cash-flow', 'break-even', 'loan-amortisation', 'compound-interest', 'simple-interest'].includes(selectedTool) && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setSelectedTool(null)}
        >
          <motion.div 
            className="bg-white dark:bg-slate-800 p-8 rounded-xl max-w-md mx-4 relative
              border border-orange-200 dark:border-orange-700 shadow-2xl"
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            transition={{ 
              duration: 0.4, 
              ease: "backOut"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Animated Icon */}
            <motion.div 
              className="flex items-center mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                {(() => {
                  const tool = tools.find(t => t.id === selectedTool)
                  if (tool) {
                    const IconComponent = tool.icon
                    return <IconComponent className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  }
                  return <Calculator className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                })()}
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Professional Tool</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Business Intelligence Suite</p>
              </div>
            </motion.div>
            
            {/* Content with Typing Animation */}
            <motion.p 
              className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              The <span className="font-semibold text-orange-600 dark:text-orange-400">
                {tools.find(t => t.id === selectedTool)?.title}
              </span> will be available as part of our comprehensive business intelligence platform. 
              This professional-grade tool will help you make data-driven decisions with precision and confidence.
            </motion.p>
            
            {/* Feature Highlights */}
            <motion.div 
              className="mb-6 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                Professional calculations with history tracking
              </div>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                Export capabilities for strategic planning
              </div>
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
                Real-time business insights and analytics
              </div>
            </motion.div>
            
            {/* Action Buttons with Animations */}
            <motion.div 
              className="flex gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTool(null)}
                  className="w-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                >
                  Close Preview
                </Button>
              </motion.div>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 transition-all duration-200
                    shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30"
                  onClick={() => setSelectedTool(null)}
                >
                  <motion.span 
                    className="flex items-center gap-2"
                    animate={{ opacity: [1, 0.7, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Coming Soon
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ✨
                    </motion.div>
                  </motion.span>
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-orange-100 to-transparent dark:from-orange-900/20 rounded-xl" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-orange-50 to-transparent dark:from-orange-900/10 rounded-xl" />
            
            {/* Floating Particles */}
            <motion.div 
              className="absolute top-4 right-8 w-2 h-2 bg-orange-400 rounded-full"
              animate={{ 
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute bottom-8 right-6 w-1.5 h-1.5 bg-blue-400 rounded-full"
              animate={{ 
                y: [0, -8, 0],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}