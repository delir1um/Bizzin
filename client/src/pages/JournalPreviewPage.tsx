import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Calendar, Lock, ArrowRight, PenTool, TrendingUp, Target, Search, Brain, Flame } from "lucide-react"
import { useLocation } from "wouter"

// Portal-matching entries
const todayEntry = {
  id: "today-1",
  title: "Strategic Planning: Plan",
  content: "Spent the entire day working on our 2025 strategic plan. I've been analyzing market trends, competitor movements, and our internal capabilities to chart our course for next year. The key priorities are: expanding our AI capabilities, entering two new market verticals, and building a world-class customer...",
  date: "Aug 5, 2025",
  category: "Planning",
  mood: "Medium Energy",
  emoji: "🧠",
  isBlurred: false
}

const weekEntries = [
  {
    id: "week-1",
    title: "Major Client Win: Standard Bank Partnership",
    content: "Incredible news! We just secured Standard Bank as our largest enterprise client. After months of presentations and negotiations, they've chosen our platform to digitize their SME onboarding process across all South African branches. This R2.5M contract validates everything we've built and opens doors to other major financial institutions.",
    date: "Aug 4, 2025",
    category: "Achievement",
    emoji: "🏆",
    mood: "High Energy",
    isBlurred: false
  },
  {
    id: "week-2",
    title: "Team Milestone: 50 Employees",
    content: "Today we welcomed our 50th team member - Thabo, a brilliant AI engineer from Wits University. From our humble beginnings in a Sandton co-working space to now having offices in Johannesburg, Cape Town, and Durban. The energy in our teams is incredible and we're building something truly special for South African businesses.",
    date: "Aug 3, 2025",
    category: "Team",
    emoji: "🎉",
    mood: "High Energy",
    isBlurred: false
  },
  {
    id: "week-3",
    title: "Revenue Breakthrough: R10M ARR",
    content: "We've officially crossed R10 million in Annual Recurring Revenue! What started as a side project to help local businesses manage their operations has grown into something that's genuinely transforming how South African companies work. Our client retention rate is at 94% and the testimonials keep pouring in.",
    date: "Aug 2, 2025",
    category: "Finance",
    emoji: "💰",
    mood: "High Energy",
    isBlurred: false
  },
  {
    id: "week-4",
    title: "Product Launch Success: Mobile App",
    content: "The mobile app launch exceeded all expectations! Over 5,000 downloads in the first week, with an average rating of 4.8 stars on Google Play Store. South African business owners are loving the ability to manage their operations on-the-go. The feedback has been overwhelmingly positive, especially the offline functionality for areas with poor connectivity.",
    date: "Aug 1, 2025",
    category: "Product",
    emoji: "🚀",
    mood: "High Energy",
    isBlurred: false
  }
]

export function JournalPreviewPage() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:bg-[#0B0A1D]">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-[#0B0A1D]/80 backdrop-blur-sm border-b border-purple-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Business Intelligence Journal</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Automatic mood detection, business health analytics, trend analysis, and AI-powered insights from your daily entries
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Preview - Exact Portal Match */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
          <Card className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">2</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Day Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-800 p-2 rounded">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">7</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Growth Wins</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded">
                  <Brain className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">Analytical</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Dominant Mood</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section - Matching Portal Style */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Start Your Business Intelligence Journal</h2>
            <p className="text-purple-100 mb-4">Document your entrepreneurial journey with AI-powered mood detection and business insights</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-white text-purple-600 hover:bg-purple-50 font-medium"
              >
                Write Today's Entry <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar - Portal Style */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search your entries..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              disabled
            />
          </div>
        </div>

        {/* Today Section - Exact Portal Match */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-orange-500 rounded"></div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Today</h2>
            <Badge variant="secondary" className="text-xs">1 entries</Badge>
          </div>

          {/* Today's Entry - Larger and More Prominent */}
          <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{todayEntry.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{todayEntry.title}</h3>
                  <div className="flex items-center gap-4 text-base text-slate-500 dark:text-slate-400 mb-4">
                    <span className="font-medium">{todayEntry.date}</span>
                    <Badge variant="outline" className="text-sm px-3 py-1">{todayEntry.category}</Badge>
                    <span className="text-green-600 font-medium">🔥 {todayEntry.mood}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-4">
                    {todayEntry.content}
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-orange-600 hover:text-orange-700 text-base font-medium"
                    onClick={() => setLocation('/auth')}
                  >
                    Read more...
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earlier this week section */}
          <div className="flex items-center gap-3 mb-4 mt-8">
            <div className="w-1 h-6 bg-blue-500 rounded"></div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Earlier this week</h2>
            <Badge variant="secondary" className="text-xs">4 entries</Badge>
          </div>

          {/* Week Entries - Full Examples */}
          {weekEntries.map((entry) => (
            <Card key={entry.id} className="bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{entry.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{entry.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-2">
                      <span>{entry.date}</span>
                      <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                      <span>🔥 {entry.mood}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      {entry.content}
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-orange-600 hover:text-orange-700 text-sm mt-2"
                      onClick={() => setLocation('/auth')}
                    >
                      Read more...
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* More sections - collapsed */}
          <div className="flex items-center gap-3 mb-4 mt-8">
            <div className="w-1 h-6 bg-purple-500 rounded"></div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Earlier this year</h2>
            <Badge variant="secondary" className="text-xs">5 entries</Badge>
            <Button variant="ghost" size="sm" className="ml-auto">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-6 bg-slate-500 rounded"></div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2024</h2>
            <Badge variant="secondary" className="text-xs">1 entries</Badge>
            <Button variant="ghost" size="sm" className="ml-auto">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">AI Mood Detection</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Automatic analysis of business emotions and energy levels from your entries
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Track your entrepreneurial journey with visual insights and patterns
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Smart Search</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Find and filter entries by mood, category, or content keywords
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <Button 
            size="lg"
            onClick={() => setLocation('/auth')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg"
          >
            Start Journaling Today
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