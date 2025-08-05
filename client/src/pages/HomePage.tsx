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
              AI-Powered Business Intelligence for <span className="text-orange-600 italic">Bizzin</span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-6 text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Professional Business Analytics & Growth Intelligence Platform
            </p>
            
            {/* Description */}
            <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Make data-driven business decisions with comprehensive analytics, AI-powered insights, professional financial tools, and intelligent document management.
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
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">AI-Powered Business Intelligence Suite</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Professional analytics, intelligent insights, and enterprise-grade tools for growing businesses</p>
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Advanced Goal Analytics</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Professional goal tracking with progress analytics, priority filtering, and intelligent insights.</p>
            </div>

            {/* Journal */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/journal')}
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
                <PenTool className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">AI Business Intelligence</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Automatic mood detection, trend analysis, and AI-powered business insights from your entries.</p>
            </div>

            {/* Podcast */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/training')}
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                <Headphones className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Learning Analytics</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Professional development tracking with completion analytics, streak monitoring, and progress insights.</p>
            </div>

            {/* BizBuilder Tools */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/bizbuilder')}
            >
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Professional Financial Suite</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Enterprise-grade calculators with CSV export, real-time calculations, and advanced financial modeling.</p>
            </div>

            {/* DocSafe */}
            <div 
              className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation('/docsafe')}
            >
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Intelligent Document Hub</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Smart categorization, advanced search, multi-format viewer, and professional document management.</p>
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
                  Basic goal tracking & analytics
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <PenTool className="w-5 h-5 text-green-500 mr-3" />
                  10 AI-analyzed entries per month
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <BookOpen className="w-5 h-5 text-green-500 mr-3" />
                  Core business calculators
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Shield className="w-5 h-5 text-green-500 mr-3" />
                  50MB secure document storage
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
                  Advanced goal analytics & health metrics
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <PenTool className="w-5 h-5 text-orange-500 mr-3" />
                  Unlimited AI analysis & business insights
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <BookOpen className="w-5 h-5 text-orange-500 mr-3" />
                  Premium financial calculators + CSV export
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Calculator className="w-5 h-5 text-orange-500 mr-3" />
                  Referral program - earn free subscription days
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Shield className="w-5 h-5 text-orange-500 mr-3" />
                  10GB professional document storage
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

      {/* Referral Program Section */}
      <section className="py-24 bg-gradient-to-r from-orange-50 to-red-50 dark:bg-gradient-to-r dark:from-[#0B0A1D] dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Earn Free Subscription Days</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Professional referral program with real rewards</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Share Your Link</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Get your unique referral code and share with business contacts</p>
              </div>
              
              <div>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Friend Subscribes</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">They sign up and subscribe to any paid plan</p>
              </div>
              
              <div>
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">10</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">You Get Rewarded</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Earn 10 days free subscription for each active referral</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-medium"
              >
                Start Earning Free Days
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}