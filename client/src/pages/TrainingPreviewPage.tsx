import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GraduationCap, Plus, Clock, Lock, ArrowRight, BookOpen, Video, Users } from "lucide-react"
import { useLocation } from "wouter"
import { FadeInUp, FadeInLeft, FadeInRight } from "@/components/animations/ScrollReveal"

// Real podcast episodes from the portal
const demoEpisodes = [
  {
    id: "continue-1",
    title: "Cash Flow Crisis Management",
    description: "Practical steps when money gets tight and how to navigate financial challenges while keeping your business operational.",
    duration: "15 min",
    progress: 12,
    series: "Finance",
    episode: 1,
    level: "Intermediate",
    type: "Video"
  },
  {
    id: "episode-1",
    title: "The 15-Minute Business Model",
    description: "Quick framework to validate your business idea and build a sustainable model that attracts customers and generates revenue from day one.",
    duration: "15 min", 
    progress: 0,
    series: "Strategy",
    episode: 1,
    level: "Beginner",
    type: "Audio"
  },
  {
    id: "episode-2",
    title: "Building Your First Sales Funnel",
    description: "Step-by-step guide to creating a sales funnel that converts visitors into customers using practical, low-cost methods.",
    duration: "16 min",
    progress: 0,
    series: "Marketing",
    episode: 1,
    level: "Beginner", 
    type: "Audio"
  },
  {
    id: "episode-3",
    title: "Understanding Business Metrics",
    description: "Key performance indicators every entrepreneur should track to make informed decisions and measure success.",
    duration: "13 min",
    progress: 0,
    series: "Finance",
    episode: 2,
    level: "Beginner",
    type: "Audio"
  },
  {
    id: "episode-4",
    title: "Effective Decision Making",
    description: "Frameworks for making better business decisions faster, especially when facing uncertainty and limited information.",
    duration: "14 min",
    progress: 0,
    series: "Leadership",
    episode: 1,
    level: "Intermediate",
    type: "Audio"
  },
  {
    id: "episode-5",
    title: "Market Research That Actually Works",
    description: "Practical methods to understand your market without expensive research firms or complex surveys.",
    duration: "14 min",
    progress: 0,
    series: "Strategy",
    episode: 2,
    level: "Beginner",
    type: "Audio"
  }
]

const seriesColors = {
  "Strategy": "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  "Marketing": "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200", 
  "Finance": "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
  "Leadership": "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
}

const levelColors = {
  "Beginner": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Intermediate": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", 
  "Advanced": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
}

export function TrainingPreviewPage() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:bg-[#0B0A1D]">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-[#0B0A1D]/80 backdrop-blur-sm border-b border-blue-200 dark:border-slate-700 min-h-[200px] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <FadeInUp>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Podcast</h1>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                15-minute business insights to grow your entrepreneurial mindset
              </p>
            </div>
          </FadeInUp>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <FadeInUp delay={0.2}>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-500 p-2 rounded">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">24</div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Episodes Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-500 p-2 rounded">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">3</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Episodes Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-500 p-2 rounded">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-100">2.5h</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Learning Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-500 p-2 rounded">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-900 dark:text-orange-100">7 days</div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Learning Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </FadeInUp>

        {/* CTA Section - Matching Portal Style */}
        <FadeInUp delay={0.4}>
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg mb-6">
              <h2 className="text-2xl font-bold mb-2">Start Your Business Learning Journey</h2>
              <p className="text-blue-100 mb-4">15-minute business insights to accelerate your entrepreneurial growth</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => setLocation('/auth')}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
                >
                  Start Learning <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </FadeInUp>
        
        {/* Popular Series - Top Content Section */}
        <FadeInUp delay={0.6}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Popular Series</h2>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {['Strategy', 'Marketing', 'Finance', 'Leadership'].map((series) => (
                <Card key={series} className="text-center p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-full ${seriesColors[series as keyof typeof seriesColors]} flex items-center justify-center mx-auto mb-3`}>  
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{series}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">4 episodes</p>
                </Card>
              ))}
            </div>
          </div>
        </FadeInUp>

        {/* Continue Learning Section */}
        <FadeInUp delay={0.8}>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Continue Learning</h2>
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-orange-100 text-orange-800 text-xs">Episode 1</Badge>
                    <Badge variant="outline" className="text-xs">Finance</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Cash Flow Crisis Management
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                    Practical steps when money gets tight and how to navigate financial challenges while keeping your business operational.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                    <span>0:12 / 15:00</span>
                    <span>1% complete</span>
                  </div>
                  <Progress value={1} className="mb-4" />
                </div>
                <Button 
                  onClick={() => setLocation('/auth')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Continue Watching
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Episodes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Featured Episodes</h2>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              View All Episodes
            </Button>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {demoEpisodes.slice(1).map((episode) => (
              <Card 
                key={episode.id}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:shadow-lg transition-all h-full flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={levelColors[episode.level as keyof typeof levelColors]}>
                      {episode.level}
                    </Badge>
                    <Badge variant="outline" className={seriesColors[episode.series as keyof typeof seriesColors]}>
                      {episode.series}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{episode.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {episode.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Episode Info */}
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{episode.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {episode.type === 'Video' ? <Video className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        <span>{episode.type}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => setLocation('/auth')}
                    >
                      {episode.type === 'Video' ? 'Listen Now' : 'Listen Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </div>
        </FadeInUp>

        {/* Features Highlight */}
        <FadeInUp delay={0.6}>
          <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Video className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Business Training</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Access curated business courses across multiple categories
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Course Categories</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Strategy, Marketing, Finance, and Leadership course collections
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <GraduationCap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Monitor your learning progress and completed courses
            </p>
          </div>
          </div>
        </FadeInUp>

        {/* Final CTA */}
        <FadeInUp delay={1.2}>
          <div className="mt-12 text-center">
            <Button 
            size="lg"
            onClick={() => setLocation('/auth')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
          >
            Start Your Learning Journey
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