import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, DollarSign, Car, Home, BarChart3, Target, Activity, Lock, ArrowRight } from "lucide-react"
import { useLocation } from "wouter"

const demoTools = [
  {
    id: "business-budget",
    title: "Business Budget Calculator",
    description: "Plan and track your business income and expenses",
    icon: DollarSign,
    category: "Essential Calculators",
    isBlurred: false
  },
  {
    id: "cash-flow",
    title: "Cash Flow Projection Tool", 
    description: "Forecast your business cash flow for better planning",
    icon: TrendingUp,
    category: "Essential Calculators",
    isBlurred: true
  },
  {
    id: "break-even",
    title: "Break-Even Calculator",
    description: "Determine the break-even point for your business",
    icon: BarChart3,
    category: "Essential Calculators",
    isBlurred: true
  }
]

export function BizBuilderToolsPreviewPage() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-orange-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calculator className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">BizBuilder Tools</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Use our essential business calculators and planning tools for your business decisions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Preview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Tools</CardTitle>
              <Calculator className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Essential calculators</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Tiered</div>
              <p className="text-xs text-muted-foreground">Access levels</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Easy to Use</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Simple</div>
              <p className="text-xs text-muted-foreground">User-friendly interface</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
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

        {/* Tools Preview */}
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

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {demoTools.map((tool, index) => {
              const IconComponent = tool.icon
              return (
                <Card 
                  key={tool.id}
                  className={`relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:shadow-lg transition-all ${tool.isBlurred ? 'opacity-60' : ''}`}
                >
                  {tool.isBlurred && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Sign up to access
                        </p>
                        <Button 
                          size="sm" 
                          className="mt-2 bg-orange-600 hover:bg-orange-700"
                          onClick={() => setLocation('/auth')}
                        >
                          Unlock Tools
                        </Button>
                      </div>
                    </div>
                  )}

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
                    <Badge variant="outline" className="mb-3">
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

        {/* Access Tiers */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Calculator Access</h2>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
              <DollarSign className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Free Tier</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Limited calculations per month with basic export functionality
              </p>
            </div>
            
            <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
              <Target className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Paid Subscription</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Unlimited calculations with advanced export and saving features
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
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
      </div>
    </div>
  )
}