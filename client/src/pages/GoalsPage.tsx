import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, Plus, Calendar, TrendingUp, CheckCircle, Clock } from "lucide-react"

export function GoalsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Goals</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Set, track, and achieve your business objectives
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </div>
        </div>
      </div>

      {/* Goal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">12</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">8</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">3</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">67%</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        {/* Active Goal 1 */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">
                  Reach 10,000 Monthly Active Users
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Target Date: March 31, 2024
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                In Progress
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">7,500 / 10,000</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  45 days remaining
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  On track
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Goal 2 */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">
                  Launch Premium Features
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Target Date: February 15, 2024
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                At Risk
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">6 / 10 features</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  12 days remaining
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Behind schedule
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Goal */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 opacity-75">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">
                  Complete MVP Development
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Completed on: January 10, 2024
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Successfully launched the minimum viable product with core features including user registration, 
                business plan templates, and basic analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600">
          <CardContent className="p-8">
            <Target className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Ready to set a new goal?
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Define clear objectives and track your progress toward business success.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}