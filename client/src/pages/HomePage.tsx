import { Button } from "@/components/ui/button"
import { ClipboardList, BookOpen, TrendingUp } from "lucide-react"

export function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-900 dark:to-slate-800"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome to <span className="text-orange-600">Bizzin</span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-6 text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Plan, Learn, and Grow Your Business
            </p>
            
            {/* Description */}
            <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Transform your business ideas into actionable plans with our comprehensive suite of tools designed for entrepreneurs and growing companies.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-medium transition-colors shadow-lg hover:shadow-xl">
                Start Your Journey
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-8 py-4 text-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Trusted by 10,000+ entrepreneurs worldwide</p>
              <div className="flex justify-center items-center space-x-8 opacity-60">
                <div className="h-8 w-24 bg-slate-300 dark:bg-slate-600 rounded"></div>
                <div className="h-8 w-24 bg-slate-300 dark:bg-slate-600 rounded"></div>
                <div className="h-8 w-24 bg-slate-300 dark:bg-slate-600 rounded"></div>
                <div className="h-8 w-24 bg-slate-300 dark:bg-slate-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <section className="py-24 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Everything you need to succeed</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Powerful tools designed to help your business thrive</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-6">
                <ClipboardList className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Business Planning</h3>
              <p className="text-slate-600 dark:text-slate-300">Create comprehensive business plans with our guided templates and expert insights.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Learning Resources</h3>
              <p className="text-slate-600 dark:text-slate-300">Access curated courses, articles, and tutorials from industry experts.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Growth Analytics</h3>
              <p className="text-slate-600 dark:text-slate-300">Track your progress with detailed analytics and actionable insights.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}