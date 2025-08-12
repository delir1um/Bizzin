import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, BookOpen, Calculator, Shield, PenTool, Headphones, ArrowRight, Brain, Users, LayoutDashboard, TrendingUp, Flame, BarChart3 } from "lucide-react"
import { useLocation } from "wouter"
import { PreLaunchWrapper } from "@/components/PreLaunchWrapper"

export function HomePage() {
  const [, setLocation] = useLocation()
  
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  return (
    <PreLaunchWrapper>
      <main className="flex-1">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Enhanced Background with Multiple Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:bg-[#0B0A1D]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100/30 via-transparent to-red-100/30 dark:from-orange-900/10 dark:to-red-900/10"></div>
        
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full opacity-20 blur-sm animate-pulse"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-br from-red-200 to-red-300 rounded-full opacity-15 blur-sm animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-8 h-8 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full opacity-25 blur-sm animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              <span className="block">Plan, Learn, Track & Grow</span>
              <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mt-2">
                All in One Platform
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-6 text-xl sm:text-2xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
              <span className="text-orange-600 italic">Bizzin</span> combines AI-powered business analytics, goal tracking, financial tools, learning content, and secure document storage — everything you need to grow your business.
            </p>
            
            {/* Description */}
            <p className="mt-6 text-lg text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
              Track your business health with AI insights, manage goals with smart analytics, access professional financial tools, learn from business content, and secure your important documents.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-medium transition-colors shadow-lg hover:shadow-xl"
              >
                Start My 14-Day Free Trial
              </Button>
              <Button 
                variant="outline" 
                onClick={scrollToFeatures}
                className="w-full sm:w-auto border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-8 py-4 text-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Explore All Features
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

      {/* Business Health Preview - Matching Portal */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Know Exactly How You're Tracking</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">See a live view of your goals, burnout risk, and performance trends — make decisions with confidence.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Business Health Score */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Business Health</CardTitle>
                    <div className="text-3xl font-bold text-blue-600">69</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-4">
                    <div className="bg-blue-600 h-3 rounded-full" style={{width: '69%'}}></div>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Overall business health score</p>
                </CardContent>
              </Card>

              {/* Burnout Risk */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-green-900 dark:text-green-100">Burnout Risk</CardTitle>
                    <div className="text-3xl font-bold text-green-600">8%</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-3 mb-4">
                    <div className="bg-green-600 h-3 rounded-full" style={{width: '8%'}}></div>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">Low risk - excellent work-life balance</p>
                </CardContent>
              </Card>
            </div>

            {/* AI Mood Detection */}
            <div className="mt-8 text-center">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">Current AI-Detected Mood</span>
                </div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">Analytical</div>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Focused on data-driven decision making</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features-section" className="py-24 bg-white dark:bg-[#0B0A1D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Comprehensive Business Intelligence Platform</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Advanced AI-powered analytics, professional tools, and intelligent automation — everything built in:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dashboard */}
            <div 
              className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
              onClick={() => setLocation('/dashboard')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mb-6">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">AI Business Intelligence Dashboard</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                <strong>• Business Health Radar:</strong> Multi-dimensional health scoring<br/>
                <strong>• Burnout Risk Analysis:</strong> Stress pattern detection<br/>
                <strong>• Growth Momentum:</strong> Progress trend analytics<br/>
                <strong>• Recovery Resilience:</strong> Performance bounce-back tracking
              </p>
            </div>

            {/* Journal */}
            <div 
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
              onClick={() => setLocation('/journal')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">AI-Powered Business Journal</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                <strong>• Automatic Sentiment Analysis:</strong> AI mood detection<br/>
                <strong>• Business Health Insights:</strong> Trend identification<br/>
                <strong>• Writing Streak Tracking:</strong> Consistency metrics<br/>
                <strong>• Smart Categorization:</strong> Intelligent entry organization
              </p>
            </div>

            {/* Goals */}
            <div 
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
              onClick={() => setLocation('/goals')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-500 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Intelligent Goal Management</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                <strong>• Progress Analytics:</strong> Visual completion tracking<br/>
                <strong>• Deadline Intelligence:</strong> Overdue & upcoming alerts<br/>
                <strong>• Priority Filtering:</strong> Strategic focus management<br/>
                <strong>• Achievement Celebrations:</strong> Automated milestone recognition
              </p>
            </div>

            {/* Podcast */}
            <div 
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
              onClick={() => setLocation('/training')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center mb-6">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Business Podcast Platform</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                <strong>• Progress Tracking:</strong> Episode completion analytics<br/>
                <strong>• Learning Streaks:</strong> Consistency measurement<br/>
                <strong>• Professional Player:</strong> Custom video/audio controls<br/>
                <strong>• Cloudflare Streaming:</strong> Optimized content delivery
              </p>
            </div>

            {/* BizBuilder Tools */}
            <div 
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
              onClick={() => setLocation('/bizbuilder')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-500 rounded-lg flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Professional Financial Suite</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                <strong>• Business Calculators:</strong> Break-even, ROI, cash flow tools<br/>
                <strong>• CSV Export:</strong> Download calculations for analysis<br/>
                <strong>• Real-time Updates:</strong> Dynamic calculation results<br/>
                <strong>• Professional Reports:</strong> Export-ready business analysis
              </p>
            </div>

            {/* DocSafe */}
            <div 
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
              onClick={() => setLocation('/docsafe')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Smart Document Intelligence</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                <strong>• Auto-Categorization:</strong> AI-powered file organization<br/>
                <strong>• Advanced Search:</strong> Content & metadata indexing<br/>
                <strong>• Multi-Format Viewer:</strong> Universal file support<br/>
                <strong>• Storage Analytics:</strong> Usage monitoring & optimization
              </p>
            </div>
          </div>

          {/* Additional Intelligence Features */}
          <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-700">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Advanced Intelligence Features</h3>
              <p className="text-slate-600 dark:text-slate-300">Powerful automation and analytics working behind the scenes</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Referral Program</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">Earn 10 days free subscription per successful referral with automatic tracking</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Streak Intelligence</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">Writing and learning streaks with pattern analysis and motivation triggers</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Sentiment Trends</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">Long-term mood analysis with business correlation insights and alerts</p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Platform Insights</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">Dashboard metrics showing your business health trends and platform usage</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Tiers */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Simple Pricing. Powerful Value.</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Try <span className="italic">Bizzin</span> free for 14 days. Then just R299/month — cancel anytime.</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {/* Single Pricing Card */}
            <div className="bg-orange-50 dark:bg-orange-900/20 p-8 rounded-xl border-2 border-orange-200 dark:border-orange-800 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium">14-Day Free Trial</span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Start Your Free Trial</h3>
                <p className="text-slate-600 dark:text-slate-300">Full access to everything for 14 days, then R299/month</p>
              </div>

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
                  <Calculator className="w-5 h-5 text-orange-500 mr-3" />
                  Premium financial calculators + CSV export
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Headphones className="w-5 h-5 text-orange-500 mr-3" />
                  Business learning modules & progress tracking
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Users className="w-5 h-5 text-orange-500 mr-3" />
                  Referral program - earn free subscription days
                </li>
                <li className="flex items-center text-slate-700 dark:text-slate-300">
                  <Shield className="w-5 h-5 text-orange-500 mr-3" />
                  Professional document storage & management
                </li>
              </ul>
              
              <Button 
                onClick={() => setLocation('/auth')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3"
              >
                Start My 14-Day Free Trial
              </Button>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
                Cancel anytime during your trial. No commitment required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section className="py-24 bg-gradient-to-r from-orange-50 to-red-50 dark:bg-gradient-to-r dark:from-[#0B0A1D] dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Earn Free Subscription Days</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">A simple referral programme with rewards that save you money</p>
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
                Start Earning My Free Days
              </Button>
            </div>
          </div>
        </div>
      </section>
      </main>
    </PreLaunchWrapper>
  )
}