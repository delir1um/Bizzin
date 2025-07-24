import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, BookOpen, Clock, Star, Users, Award, Search } from "lucide-react"
import { StandardPageLayout, createStatCard } from "@/components/layout/StandardPageLayout"

export function TrainingPage() {
  const statCards = [
    createStatCard(
      'available',
      'Courses Available',
      24,
      'Courses Available',
      <BookOpen className="w-6 h-6 text-white" />,
      'blue'
    ),
    createStatCard(
      'completed',
      'Completed',
      3,
      'Completed',
      <Award className="w-6 h-6 text-white" />,
      'green'
    ),
    createStatCard(
      'time',
      'Learning Time',
      '45h',
      'Learning Time',
      <Clock className="w-6 h-6 text-white" />,
      'purple'
    ),
    createStatCard(
      'progress',
      'In Progress',
      2,
      'In Progress',
      <Play className="w-6 h-6 text-white" />,
      'orange'
    )
  ]

  const secondaryActions = [{
    label: 'Browse All Courses',
    icon: <Search className="w-4 h-4 mr-2" />,
    onClick: () => console.log('Browse courses'),
    variant: 'outline' as const,
    className: 'border-orange-200 text-orange-700 hover:bg-orange-50'
  }]

  return (
    <StandardPageLayout
      title="Business Training"
      subtitle="Learn essential skills to grow your business"
      secondaryActions={secondaryActions}
      stats={statCards}
      showSearch={false}
      showFilters={false}
    >

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
    </StandardPageLayout>
  )
}