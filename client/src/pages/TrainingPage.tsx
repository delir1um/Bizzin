import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Headphones, Clock, Star, Users, Award, Search, Mic, BookOpen } from "lucide-react"
import { StandardPageLayout, createStatCard } from "@/components/layout/StandardPageLayout"
import { motion } from "framer-motion"
import { AnimatedCard, AnimatedGrid, AnimatedItem } from "@/components/ui/animated-card"

export function PodcastPage() {
  const statCards = [
    createStatCard(
      'available',
      'Episodes Available',
      42,
      'Episodes Available',
      <Headphones className="w-6 h-6 text-white" />,
      'blue'
    ),
    createStatCard(
      'completed',
      'Episodes Completed',
      8,
      'Episodes Completed',
      <Award className="w-6 h-6 text-white" />,
      'green'
    ),
    createStatCard(
      'time',
      'Listening Time',
      '6.2h',
      'Listening Time',
      <Clock className="w-6 h-6 text-white" />,
      'purple'
    ),
    createStatCard(
      'streak',
      'Learning Streak',
      5,
      'Learning Streak',
      <Play className="w-6 h-6 text-white" />,
      'orange'
    )
  ]

  const secondaryActions = [{
    label: 'Browse All Episodes',
    icon: <Search className="w-4 h-4 mr-2" />,
    onClick: () => console.log('Browse episodes'),
    variant: 'outline' as const,
    className: 'border-orange-200 text-orange-700 hover:bg-orange-50'
  }]

  return (
    <StandardPageLayout
      title="Business Podcast"
      subtitle="15-minute business insights to grow your entrepreneurial mindset"
      secondaryActions={secondaryActions}
      stats={statCards}
      showSearch={false}
      showFilters={false}
    >

      {/* Continue Listening */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Continue Listening</h2>
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Episode 8
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400">Marketing Series</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Digital Marketing on a Startup Budget
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Practical strategies to market your business effectively without breaking the bank.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">8:32 / 15:00</span>
                  </div>
                  <Progress value={57} className="h-2" />
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6">
                <Button className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white">
                  <Play className="w-4 h-4 mr-2" />
                  Continue Listening
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Podcast Series */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Popular Series</h2>
        <AnimatedGrid className="grid grid-cols-2 md:grid-cols-4 gap-4" stagger={0.1}>
          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Strategy</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">12 episodes</p>
            </CardContent>
          </Card>

          </AnimatedItem>
          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Marketing</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">10 episodes</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Finance</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">8 episodes</p>
              </CardContent>
            </Card>
          </AnimatedItem>

          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Leadership</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">12 episodes</p>
              </CardContent>
            </Card>
          </AnimatedItem>
        </AnimatedGrid>
      </div>

      {/* Featured Episodes */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Featured Episodes</h2>
        <AnimatedGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.15}>
          {/* Episode 1 */}
          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    The 15-Minute Business Model
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Quick framework to validate your business idea
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Strategy
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  15 minutes
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.8 (234)
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                <Play className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </CardContent>
          </Card>
          </AnimatedItem>

          {/* Episode 2 */}
          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Cash Flow Crisis Management
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Practical steps when money gets tight
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  Finance
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  15 minutes
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.9 (189)
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                <Play className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </CardContent>
          </Card>
          </AnimatedItem>

          {/* Episode 3 */}
          <AnimatedItem>
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Building Team Culture Remotely
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Leadership tactics for distributed teams
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                  Leadership
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  15 minutes
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  4.7 (156)
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                <Play className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </CardContent>
          </Card>
          </AnimatedItem>
        </AnimatedGrid>
      </div>
    </StandardPageLayout>
  )
}