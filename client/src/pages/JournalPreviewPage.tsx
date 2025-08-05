import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Plus, Calendar, Lock, ArrowRight, PenTool, TrendingUp, Target } from "lucide-react"
import { useLocation } from "wouter"

const demoEntries = [
  {
    id: "demo-1",
    title: "Q3 Planning Session",
    content: "Completed strategic planning for Q3. Key focus areas: product development, team scaling, and market expansion. Set aggressive but achievable targets for revenue growth...",
    date: "2025-07-20",
    mood: "Optimistic",
    tags: ["Planning", "Strategy", "Q3"],
    isBlurred: false
  },
  {
    id: "demo-2",
    title: "Customer Feedback Review",
    content: "Analyzed feedback from 50+ customer interviews. Main insights: users love the core features but want better mobile experience. Need to prioritize mobile app development...",
    date: "2025-07-18",
    mood: "Thoughtful",
    tags: ["Customer Research", "Product"],
    isBlurred: true
  },
  {
    id: "demo-3",
    title: "Team Meeting Reflections",
    content: "Great team sync today. Everyone is aligned on our vision and excited about upcoming features. Sarah's ideas for user onboarding are brilliant. Need to document and implement...",
    date: "2025-07-15",
    mood: "Inspired",
    tags: ["Team", "Leadership", "Ideas"],
    isBlurred: true
  }
]

const moodColors = {
  "Optimistic": "bg-green-100 text-green-800",
  "Thoughtful": "bg-blue-100 text-blue-800", 
  "Inspired": "bg-purple-100 text-purple-800",
  "Focused": "bg-orange-100 text-orange-800"
}

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
        {/* Stats Preview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Write Entries</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Document</div>
              <p className="text-xs text-muted-foreground">Business insights</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Search & Filter</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Organized</div>
              <p className="text-xs text-muted-foreground">Find entries easily</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorize</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Tagged</div>
              <p className="text-xs text-muted-foreground">Label and organize</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Create Your AI-Enhanced Business Journal</h2>
            <p className="text-purple-100 mb-4">Write entries with automatic sentiment analysis, mood tracking, and personalized reflection prompts. Free plan includes 10 entries per month.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-white text-purple-600 hover:bg-purple-50 font-medium"
              >
                Begin Journaling <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

            </div>
          </div>
        </div>

        {/* Journal Entries Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Example Journal Layout</h2>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Your Journal
            </Button>
          </div>
          
          <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              <strong>Note:</strong> This shows the journal interface layout. You'll create and write all your own entries once you sign up.
            </p>
          </div>

          <div className="space-y-4">
            {demoEntries.map((entry, index) => (
              <Card 
                key={entry.id}
                className={`relative overflow-hidden bg-white/60 dark:bg-card/60 backdrop-blur-sm ${entry.isBlurred ? 'opacity-60' : ''}`}
              >
                {entry.isBlurred && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <PenTool className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Sign up to start journaling
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-purple-600 hover:bg-purple-700"
                        onClick={() => setLocation('/auth')}
                      >
                        Start Writing
                      </Button>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{entry.title}</CardTitle>
                      <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(entry.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={moodColors[entry.mood as keyof typeof moodColors]}>
                        {entry.mood}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-slate-700 dark:text-slate-300 mb-4 line-clamp-3">
                    {entry.content}
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <PenTool className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Business Journaling</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Document your business journey, insights, and learning experiences
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Entry Management</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Create, edit, and organize journal entries with categories and tags
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search & Filter</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Find specific entries quickly with search and date filtering tools
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
            Start Your Business Journal
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