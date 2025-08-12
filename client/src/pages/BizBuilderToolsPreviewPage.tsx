import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Calendar, BarChart3, CreditCard, PiggyBank, Percent, ArrowRight, Target, FileSpreadsheet } from "lucide-react"
import { useLocation } from "wouter"
import { FadeInUp, FadeInLeft, FadeInRight } from "@/components/animations/ScrollReveal"

// Actual BizBuilder tools from the portal
const demoTools = [
  // Core Tools (Free)
  {
    id: "business-budget",
    title: "Business Budget Calculator",
    description: "Plan and track your business income and expenses with detailed budget analysis",
    icon: DollarSign,
    category: "Core",
    tier: "free",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  {
    id: "cash-flow",
    title: "Cash Flow Projection Calculator", 
    description: "Project monthly cash flows and identify potential shortfalls before they happen",
    icon: Calendar,
    category: "Core",
    tier: "free",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  {
    id: "break-even",
    title: "Break-Even Calculator",
    description: "Determine the break-even point for your business operations with margin of safety analysis",
    icon: BarChart3,
    category: "Core",
    tier: "free",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  // Premium Tools
  {
    id: "loan-amortisation",
    title: "Loan Amortisation Calculator",
    description: "Calculate loan payments, interest schedules, and early payoff scenarios",
    icon: CreditCard,
    category: "Premium",
    tier: "premium",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  },
  {
    id: "compound-interest",
    title: "Compound Interest Calculator",
    description: "Calculate investment growth with compound interest and monthly contributions",
    icon: PiggyBank,
    category: "Premium",
    tier: "premium",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
  },
  {
    id: "simple-interest",
    title: "Simple Interest Calculator",
    description: "Calculate simple interest with monthly compounding and tax considerations",
    icon: Percent,
    category: "Premium",
    tier: "premium",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
  }
]

export function BizBuilderToolsPreviewPage() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-[#0B0A1D]">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-[#0B0A1D]/80 backdrop-blur-sm border-b border-orange-200 dark:border-slate-700 min-h-[200px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <FadeInUp>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Calculator className="w-8 h-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Professional Financial Suite</h1>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Enterprise-grade calculators with CSV export, real-time calculations, advanced financial modeling, and professional business analysis tools
              </p>
            </div>
          </FadeInUp>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Preview */}
        <FadeInUp delay={0.2}>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-600 to-amber-500 p-2 rounded">
                  <Calculator className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-900 dark:text-orange-100">6</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Business Tools</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-600 to-amber-500 p-2 rounded">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">Tiered</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-600 to-amber-500 p-2 rounded">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">Simple</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Easy to Use</div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </FadeInUp>

        {/* CTA Section */}
        <FadeInUp delay={0.4}>
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-2">Use Our Business Planning Tools</h2>
              <p className="text-orange-100 mb-4">Make informed decisions with our professionally built calculator suite</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => setLocation('/auth')}
                  className="bg-white text-orange-600 hover:bg-orange-50 font-medium"
                >
                  Start Using Tools <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </FadeInUp>

        {/* Tools Preview */}
        <FadeInUp delay={0.6}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Essential Business Tools</h2>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Access All Tools
            </Button>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {demoTools.map((tool) => {
              const IconComponent = tool.icon
              return (
                <Card 
                  key={tool.id}
                  className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:shadow-lg transition-all h-full flex flex-col"
                >
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-3">
                      <IconComponent className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-lg">{tool.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <Badge className={tool.color + " mb-3"}>
                      {tool.category}
                    </Badge>
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      onClick={() => setLocation('/auth')}
                    >
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          </div>
        </FadeInUp>

        {/* Professional Features */}
        <FadeInUp delay={0.8}>
          <div className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Professional Business Analysis</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
              <Calculator className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Enterprise-Grade Calculations</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Professional financial modeling tools with real-time accuracy
              </p>
            </div>
            
            <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
              <FileSpreadsheet className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Data Export & Analysis</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Export calculations to CSV for further analysis and reporting
              </p>
            </div>

            <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
              <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Decision Support</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Make informed business decisions with comprehensive financial insights
              </p>
            </div>
          </div>
          </div>
        </FadeInUp>

        {/* Final CTA */}
        <FadeInUp delay={0.6}>
          <div className="mt-12 text-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/auth')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg"
            >
              Access Business Tools Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Free trial • No credit card required
            </p>
          </div>
        </FadeInUp>
      </div>
    </div>
  )
}