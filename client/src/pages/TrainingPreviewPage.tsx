import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { GraduationCap, Plus, Clock, Lock, ArrowRight, BookOpen, Video, Users } from "lucide-react"
import { useLocation } from "wouter"

const demoCourses = [
  {
    id: "demo-1",
    title: "Startup Fundamentals",
    description: "Learn the essential skills every entrepreneur needs to build a successful startup from the ground up.",
    progress: 65,
    duration: "4.5 hours",
    lessons: 12,
    level: "Beginner",
    category: "Entrepreneurship",
    isBlurred: false
  },
  {
    id: "demo-2",
    title: "Growth Marketing Strategies",
    description: "Master proven marketing tactics to scale your business and acquire customers cost-effectively.",
    progress: 30,
    duration: "6 hours",
    lessons: 18,
    level: "Intermediate",
    category: "Marketing",
    isBlurred: true
  },
  {
    id: "demo-3",
    title: "Financial Planning for Startups",
    description: "Understand cash flow, fundraising, and financial management for early-stage companies.",
    progress: 0,
    duration: "5.5 hours", 
    lessons: 15,
    level: "Intermediate",
    category: "Finance",
    isBlurred: true
  }
]

const levelColors = {
  "Beginner": "bg-green-100 text-green-800",
  "Intermediate": "bg-amber-100 text-amber-800",
  "Advanced": "bg-red-100 text-red-800"
}

export function TrainingPreviewPage() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-blue-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Training</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Accelerate your growth with expert-led courses designed for entrepreneurs and business leaders
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Preview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Available</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">150+</div>
              <p className="text-xs text-muted-foreground">New courses weekly</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Watched</CardTitle>
              <Video className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">24.5h</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <GraduationCap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Completed courses</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Level Up Your Business Skills</h2>
            <p className="text-blue-100 mb-4">Access expert courses from industry leaders and successful entrepreneurs</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setLocation('/auth')}
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
              >
                Start Learning <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
              >
                Browse Catalog
              </Button>
            </div>
          </div>
        </div>

        {/* Courses Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Featured Courses</h2>
            <Button 
              onClick={() => setLocation('/auth')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              View All Courses
            </Button>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {demoCourses.map((course, index) => (
              <Card 
                key={course.id}
                className={`relative overflow-hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:shadow-lg transition-all ${course.isBlurred ? 'opacity-60' : ''}`}
              >
                {course.isBlurred && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Sign up to access course
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setLocation('/auth')}
                      >
                        Unlock Now
                      </Button>
                    </div>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={levelColors[course.level as keyof typeof levelColors]}>
                      {course.level}
                    </Badge>
                    <Badge variant="outline">{course.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-300">Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    
                    {/* Course Info */}
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.lessons} lessons</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      variant={course.progress > 0 ? "default" : "outline"}
                      onClick={() => setLocation('/auth')}
                    >
                      {course.progress > 0 ? "Continue Learning" : "Start Course"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Highlight */}
        <div className="mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Video className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">HD Video Content</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              High-quality video lessons with downloadable resources and transcripts
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Expert Instructors</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Learn from successful entrepreneurs and industry leaders
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg">
            <GraduationCap className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Certificates</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Earn certificates of completion to showcase your skills
            </p>
          </div>
        </div>

        {/* Final CTA */}
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
      </div>
    </div>
  )
}