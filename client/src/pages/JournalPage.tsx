import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Search, Calendar, BookOpen } from "lucide-react"

export function JournalPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Journal</h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
              Track your progress, insights, and business learnings
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search journal entries..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Calendar className="w-4 h-4 mr-2" />
          Filter by Date
        </Button>
      </div>

      {/* Journal Entries */}
      <div className="space-y-6">
        {/* Sample Entry 1 */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">
                  Market Research Insights
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  January 15, 2024 • 3 min read
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Research</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Today I discovered some interesting trends in our target market. The demand for 
              business planning tools has increased by 40% in the last quarter. This validates 
              our decision to focus on this space...
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                Market Research
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                Validation
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sample Entry 2 */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">
                  Customer Feedback Analysis
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  January 12, 2024 • 5 min read
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Feedback</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Received valuable feedback from our beta users. Key takeaways: Users love the 
              simplicity but want more advanced analytics. Need to balance ease of use with 
              powerful features...
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                User Feedback
              </span>
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm rounded-full">
                Product Development
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sample Entry 3 */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-slate-900 dark:text-white">
                  Milestone Achievement
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  January 10, 2024 • 2 min read
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">Milestone</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Reached 1,000 registered users today! This is a significant milestone for our 
              platform. Time to celebrate and plan for the next phase of growth...
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm rounded-full">
                Achievement
              </span>
              <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 text-sm rounded-full">
                Growth
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load More */}
      <div className="mt-12 text-center">
        <Button variant="outline" className="w-full sm:w-auto">
          Load More Entries
        </Button>
      </div>
    </div>
  )
}