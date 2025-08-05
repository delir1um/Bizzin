import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { TrendingUp, Users, FileText, Target, DollarSign, Activity } from "lucide-react"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  paidUsers: number
  earlySignups: number
  totalRevenue: number
  monthlyRevenue: number
  journalEntries: number
  completedGoals: number
  podcastViews: number
  documentUploads: number
  storageUsed: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

interface AdminAnalyticsProps {
  stats: AdminStats | null
}

export function AdminAnalytics({ stats }: AdminAnalyticsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Mock data for charts (in production, this would come from real analytics)
  const userGrowthData = [
    { month: 'Jan', users: Math.max(1, Math.floor(stats.totalUsers * 0.6)) },
    { month: 'Feb', users: Math.max(1, Math.floor(stats.totalUsers * 0.7)) },
    { month: 'Mar', users: Math.max(1, Math.floor(stats.totalUsers * 0.8)) },
    { month: 'Apr', users: Math.max(1, Math.floor(stats.totalUsers * 0.85)) },
    { month: 'May', users: Math.max(1, Math.floor(stats.totalUsers * 0.92)) },
    { month: 'Jun', users: stats.totalUsers }
  ]

  const featureUsageData = [
    { name: 'Journal', value: stats.journalEntries, color: '#8B5CF6' },
    { name: 'Goals', value: stats.completedGoals, color: '#06B6D4' },
    { name: 'Podcast', value: stats.podcastViews, color: '#F59E0B' },
    { name: 'Documents', value: stats.documentUploads, color: '#10B981' }
  ]

  const revenueData = [
    { month: 'Jan', revenue: Math.max(0, Math.floor(stats.monthlyRevenue * 0.5)) },
    { month: 'Feb', revenue: Math.max(0, Math.floor(stats.monthlyRevenue * 0.6)) },
    { month: 'Mar', revenue: Math.max(0, Math.floor(stats.monthlyRevenue * 0.7)) },
    { month: 'Apr', revenue: Math.max(0, Math.floor(stats.monthlyRevenue * 0.8)) },
    { month: 'May', revenue: Math.max(0, Math.floor(stats.monthlyRevenue * 0.9)) },
    { month: 'Jun', revenue: stats.monthlyRevenue }
  ]

  const conversionRate = stats.totalUsers > 0 ? (stats.paidUsers / stats.totalUsers) * 100 : 0
  const activeUserRate = stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <Progress value={conversionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.paidUsers} of {stats.totalUsers} users upgraded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUserRate.toFixed(1)}%</div>
            <Progress value={activeUserRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Active users this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Revenue Per User</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{stats.paidUsers > 0 ? Math.floor(stats.totalRevenue / stats.paidUsers) : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Monthly ARPU
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Engagement</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((stats.journalEntries + stats.podcastViews + stats.documentUploads) / Math.max(1, stats.totalUsers))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg. actions per user
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={featureUsageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {featureUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Journal Entries</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{stats.journalEntries.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total entries</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Completed Goals</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{stats.completedGoals.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Goals achieved</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-600" />
                <span className="text-sm">Podcast Views</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{stats.podcastViews.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Episodes watched</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm">Documents</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{stats.documentUploads.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Files uploaded</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}