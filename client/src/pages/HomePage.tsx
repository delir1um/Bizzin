import { Button } from "@/components/ui/button"
import { Target, BookOpen, Calculator, Shield, PenTool, Headphones } from "lucide-react"
import { useLocation } from "wouter"

export function HomePage() {
  const [, setLocation] = useLocation()
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:bg-[#0B0A1D]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome to <span className="text-orange-600 italic">Bizzin</span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-6 text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Plan, Learn, and Grow Your Business
            </p>
            
            {/* Description */}
            <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Create your own business goals, journal your journey, listen to business podcasts, and use professional calculators to grow your business.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-medium transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/goals')}
                className="w-full sm:w-auto border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-8 py-4 text-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Explore Features
              </Button>
            </div>

            {/* Value Proposition */}
            <div className="mt-16">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Everything you need to plan, track, and grow your business</p>
              <div className="flex justify-center items-center space-x-8 text-slate-400 dark:text-slate-500">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Goal Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4" />
                  <span className="text-sm">Business Journal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span className="text-sm">Business Tools</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <section className="py-24 bg-white dark:bg-[#0B0A1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Complete Business Management Platform</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Create your own content with our professional tools and expert-led training</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Goals */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/goals')}
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Goals Tracking</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Set business goals with progress tracking, priority levels, and journal integration.</p>
            </div>

            {/* Journal */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/journal')}
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
                <PenTool className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Business Journal</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">AI-powered sentiment analysis, mood tracking, and reflection prompts. 10 entries/month free.</p>
            </div>

            {/* Podcast */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/training')}
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Business Podcast</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">15-minute episodes with progress tracking, completion detection, and learning streaks.</p>
            </div>

            {/* BizBuilder Tools */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/bizbuilder')}
            >
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">BizBuilder Tools</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Budget calculator, break-even analysis, cash flow projections, and premium financial tools.</p>
            </div>

            {/* DocSafe */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/docsafe')}
            >
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">DocSafe</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Drag & drop file upload, multi-format viewer, search, and categorization. 50MB free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Choose Your Plan</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Start free, upgrade when you're ready to grow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Free Tier</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">Get started with basic features</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Target className="w-5 h-5 text-green-500 mr-3" />
                  Unlimited goal tracking
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <PenTool className="w-5 h-5 text-green-500 mr-3" />
                  10 journal entries per month
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <BookOpen className="w-5 h-5 text-green-500 mr-3" />
                  Limited training content
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Calculator className="w-5 h-5 text-green-500 mr-3" />
                  Limited calculator usage
                </li>
              </ul>
              <Button 
                onClick={() => setLocation('/auth')}
                variant="outline" 
                className="w-full"
              >
                Get Started Free
              </Button>
            </div>

            {/* Paid Subscription */}
            <div className="bg-orange-50 dark:bg-orange-900/20 p-8 rounded-xl border-2 border-orange-200 dark:border-orange-800 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium">Popular</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Paid Subscription</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">Full access to all platform features</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Target className="w-5 h-5 text-orange-500 mr-3" />
                  Unlimited goal tracking with analytics
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <PenTool className="w-5 h-5 text-orange-500 mr-3" />
                  Advanced journal features
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <BookOpen className="w-5 h-5 text-orange-500 mr-3" />
                  Full training library access
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Calculator className="w-5 h-5 text-orange-500 mr-3" />
                  Unlimited calculator usage
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Shield className="w-5 h-5 text-orange-500 mr-3" />
                  Increased storage limits
                </li>
              </ul>
              <Button 
                onClick={() => setLocation('/auth')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}