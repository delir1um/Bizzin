import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, BookOpen, Clock, Star, Users, Award, Search } from "lucide-react"

export function TrainingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Training</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Learn essential skills to grow your business
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/20"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse All Courses
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">24</div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Courses Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">3</div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">45h</div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Learning Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Learning */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Continue Learning</h2>
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Digital Marketing Fundamentals
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Learn the basics of digital marketing to promote your business online effectively.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">7 / 12 lessons</span>
                  </div>
                  <Progress value={58} className="h-2" />
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6">
                <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Categories */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Popular Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Strategy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">8 courses</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Marketing</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">6 courses</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Finance</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">5 courses</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Leadership</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">5 courses</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Featured Courses */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Featured Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Course 1 */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Business Plan Essentials
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Learn to create a comprehensive business plan
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Beginner
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  4.5 hours
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.8 (124)
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Start Course
              </Button>
            </CardContent>
          </Card>

          {/* Course 2 */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Financial Management
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Master cash flow and financial planning
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                  Intermediate
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  6 hours
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.7 (89)
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Start Course
              </Button>
            </CardContent>
          </Card>

          {/* Course 3 */}
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Scaling Your Business
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Strategies for sustainable growth
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                  Advanced
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  8 hours
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.9 (156)
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Start Course
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}