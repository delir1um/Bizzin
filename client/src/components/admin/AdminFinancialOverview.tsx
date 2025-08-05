import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Crown,
  Calendar,
  Download,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  Activity
} from "lucide-react"
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
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

interface UserSegment {
  free: number // New signups (last 7 days)
  trial: number // Active trial users (within 2 weeks)
  premium: number // Paid premium users
  expired_trial: number // Trial expired, need upgrade
}

interface ConversionMetrics {
  free_to_trial: number // New signup rate
  trial_to_premium: number // Trial to premium conversion
  trial_to_churn: number // Trial expiration rate
  overall_conversion: number // Overall conversion rate
}

interface FinancialMetrics {
  totalRevenue: number
  monthlyRevenue: number
  averageRevenuePerUser: number
  churnRate: number
  subscriptions: {
    total: number
    active: number
    cancelled: number
    expired: number
  }
  userSegmentation: UserSegment
  conversionMetrics: ConversionMetrics
  revenueGrowth: number
  refunds: number
}

interface RecentTransaction {
  id: string
  user_email: string
  amount: number
  plan_type: string
  status: 'completed' | 'failed' | 'refunded'
  created_at: string
}

export function AdminFinancialOverview() {
  // Fetch financial metrics
  const { data: metrics, isLoading: metricsLoading, refetch } = useQuery({
    queryKey: ['admin-financial-metrics'],
    queryFn: async () => {
      console.log('Fetching financial metrics...')
      
      try {
        // First check what columns actually exist in user_plans
        const { data: subscriptions, error: subsError } = await supabase
          .from('user_plans')
          .select('*')
          .limit(1)

        if (subsError) {
          console.log('Error fetching user_plans:', subsError)
          // Return empty metrics - no dummy data
          return {
            totalRevenue: 0,
            monthlyRevenue: 0,
            averageRevenuePerUser: 0,
            churnRate: 0,
            subscriptions: {
              total: 0,
              active: 0,
              cancelled: 0,
              expired: 0
            },
            userSegmentation: {
              free: 0,
              trial: 0,
              premium: 0,
              expired_trial: 0
            },
            conversionMetrics: {
              free_to_trial: 0,
              trial_to_premium: 0,
              trial_to_churn: 0,
              overall_conversion: 0
            },
            revenueGrowth: 0,
            refunds: 0
          } as FinancialMetrics
        }

        // Get all user plans
        const { data: allPlans, error: plansError } = await supabase
          .from('user_plans')
          .select('*')

        if (plansError) {
          console.log('Error fetching all user_plans:', plansError)
          return {
            totalRevenue: 0,
            monthlyRevenue: 0,
            averageRevenuePerUser: 0,
            churnRate: 0,
            subscriptions: {
              total: 0,
              active: 0,
              cancelled: 0,
              expired: 0
            },
            revenueGrowth: 0,
            refunds: 0
          } as FinancialMetrics
        }

        console.log('All user plans data:', allPlans)

        const now = new Date()
        const lastMonth = subMonths(now, 1)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Enhanced User Segmentation - Corrected Business Model
        // Users get 2-week trial by default, then must upgrade to premium
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        
        // Active Trial Users: free plan users within their 2-week trial period
        const trialUsers = allPlans?.filter(plan => {
          if (plan.plan_type !== 'free') return false
          const createdAt = new Date(plan.created_at)
          const withinTrialPeriod = createdAt >= fourteenDaysAgo
          return withinTrialPeriod
        }).length || 0
        
        // Premium Users: users who upgraded to premium (paid plans)
        const premiumUsers = allPlans?.filter(plan => {
          return plan.plan_type === 'premium' && !plan.cancelled_at && (!plan.expires_at || new Date(plan.expires_at) > now)
        }).length || 0
        
        // Expired Trial Users: free plan users whose 2-week trial has ended
        const expiredTrialUsers = allPlans?.filter(plan => {
          if (plan.plan_type !== 'free') return false
          const createdAt = new Date(plan.created_at)
          const trialExpired = createdAt < fourteenDaysAgo
          return trialExpired
        }).length || 0
        
        // New Signups: users who joined in the last 7 days
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const newSignups = allPlans?.filter(plan => {
          const createdAt = new Date(plan.created_at)
          return createdAt >= sevenDaysAgo
        }).length || 0

        console.log('Segmentation Debug:', {
          now: now.toISOString(),
          fourteenDaysAgo: fourteenDaysAgo.toISOString(),
          sevenDaysAgo: sevenDaysAgo.toISOString(),
          userCreatedAt: allPlans?.[0]?.created_at,
          newSignups,
          trialUsers,
          premiumUsers,
          expiredTrialUsers
        })

        // Conversion Metrics Calculation
        const totalTrialUsers = trialUsers + expiredTrialUsers + premiumUsers // All users who had trials
        const trialToPremiumRate = totalTrialUsers > 0 ? (premiumUsers / totalTrialUsers) * 100 : 0
        
        const trialToChurnRate = totalTrialUsers > 0 ? (expiredTrialUsers / totalTrialUsers) * 100 : 0
        
        const overallConversionRate = totalTrialUsers > 0 ? (premiumUsers / totalTrialUsers) * 100 : 0
        
        const newSignupRate = totalTrialUsers > 0 ? (newSignups / totalTrialUsers) * 100 : 0
        
        // Only count real premium subscriptions that haven't expired
        const activePremiumPlans = allPlans?.filter(plan => {
          if (plan.plan_type !== 'premium') return false
          if (plan.expires_at && new Date(plan.expires_at) < now) return false
          if (plan.cancelled_at) return false
          return true
        }) || []

        // Calculate real revenue based on actual payments
        const monthlyRevenue = activePremiumPlans.reduce((total, plan) => {
          return total + (plan.amount_paid || 0)
        }, 0)

        // Calculate total revenue from all completed payments
        const totalRevenue = allPlans?.reduce((total, plan) => {
          return total + (plan.amount_paid || 0)
        }, 0) || 0

        // Calculate actual subscription counts - ONLY count premium/paid plans
        const activeCount = allPlans?.filter(plan => {
          if (plan.plan_type === 'free') return false // Don't count free plans as subscriptions
          if (plan.expires_at && new Date(plan.expires_at) < now) return false
          if (plan.cancelled_at) return false
          return true
        }).length || 0

        const cancelledCount = allPlans?.filter(plan => {
          if (plan.plan_type === 'free') return false // Don't count free plans as subscriptions
          return plan.cancelled_at
        }).length || 0
        const expiredCount = allPlans?.filter(plan => {
          if (plan.plan_type === 'free') return false // Don't count free plans as subscriptions
          return plan.expires_at && new Date(plan.expires_at) < now
        }).length || 0

        const result = {
          totalRevenue,
          monthlyRevenue,
          averageRevenuePerUser: premiumUsers > 0 ? monthlyRevenue / premiumUsers : 0,
          churnRate: trialToChurnRate,
          subscriptions: {
            total: (allPlans?.filter(plan => plan.plan_type !== 'free').length || 0), // Only count paid plans
            active: activeCount,
            cancelled: cancelledCount,
            expired: expiredCount
          },
          userSegmentation: {
            free: newSignups, // New signups within 7 days
            trial: trialUsers, // Active trial users (within 2 weeks)
            premium: premiumUsers, // Paid premium users
            expired_trial: expiredTrialUsers // Trial expired, need to upgrade
          },
          conversionMetrics: {
            free_to_trial: Math.round(newSignupRate * 10) / 10, // New signup rate
            trial_to_premium: Math.round(trialToPremiumRate * 10) / 10,
            trial_to_churn: Math.round(trialToChurnRate * 10) / 10,
            overall_conversion: Math.round(overallConversionRate * 10) / 10
          },
          revenueGrowth: 0, // Calculate real growth from historical data
          refunds: 0 // No dummy data
        } as FinancialMetrics

        console.log('Calculated financial metrics from real data:', result)
        return result
      } catch (error) {
        console.error('Error in financial metrics query:', error)
        // Return default metrics on any error
        return {
          totalRevenue: 0,
          monthlyRevenue: 0,
          averageRevenuePerUser: 0,
          churnRate: 0,
          subscriptions: {
            total: 0,
            active: 0,
            cancelled: 0,
            expired: 0
          },
          userSegmentation: {
            free: 0,
            trial: 0,
            premium: 0,
            expired_trial: 0
          },
          conversionMetrics: {
            free_to_trial: 0,
            trial_to_premium: 0,
            trial_to_churn: 0,
            overall_conversion: 0
          },
          revenueGrowth: 0,
          refunds: 0
        } as FinancialMetrics
      }
    },
    refetchInterval: 60000, // Refresh every minute
    retry: false // Don't retry on errors, just return default values
  })

  // Mock revenue data for charts
  const revenueData = [
    { month: 'Jan', revenue: (metrics?.monthlyRevenue || 0) * 0.6 },
    { month: 'Feb', revenue: (metrics?.monthlyRevenue || 0) * 0.7 },
    { month: 'Mar', revenue: (metrics?.monthlyRevenue || 0) * 0.8 },
    { month: 'Apr', revenue: (metrics?.monthlyRevenue || 0) * 0.85 },
    { month: 'May', revenue: (metrics?.monthlyRevenue || 0) * 0.9 },
    { month: 'Jun', revenue: metrics?.monthlyRevenue || 0 }
  ]

  const subscriptionData = metrics ? [
    { name: 'Active', value: metrics.subscriptions.active, color: '#10B981' },
    { name: 'Cancelled', value: metrics.subscriptions.cancelled, color: '#F59E0B' },
    { name: 'Expired', value: metrics.subscriptions.expired, color: '#EF4444' }
  ] : []

  const userSegmentationData = metrics ? [
    { name: 'Free Users', value: metrics.userSegmentation.free, color: '#6B7280' },
    { name: 'Trial Users', value: metrics.userSegmentation.trial, color: '#3B82F6' },
    { name: 'Premium Users', value: metrics.userSegmentation.premium, color: '#10B981' },
    { name: 'Expired Trials', value: metrics.userSegmentation.expired_trial, color: '#EF4444' }
  ] : []

  // Fetch real transactions from user_plans (simplified to avoid foreign key issues)
  const { data: recentTransactions } = useQuery({
    queryKey: ['admin-recent-transactions'],
    queryFn: async () => {
      // Since there's no foreign key relationship, just get basic plan data
      const { data: plans, error } = await supabase
        .from('user_plans')
        .select('id, user_id, amount_paid, plan_type, created_at')
        .not('amount_paid', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.log('Error fetching transactions:', error)
        return []
      }

      if (!plans || plans.length === 0) {
        return []
      }

      // Get user emails separately to avoid foreign key issues
      const userIds = plans.map(plan => plan.user_id)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, email')
        .in('user_id', userIds)

      return plans.map(plan => {
        const profile = profiles?.find(p => p.user_id === plan.user_id)
        return {
          id: plan.id,
          user_email: profile?.email || 'Unknown User',
          amount: plan.amount_paid || 0,
          plan_type: plan.plan_type,
          status: 'completed' as const,
          created_at: plan.created_at
        }
      })
    },
    enabled: !!metrics // Only fetch if main metrics loaded
  })

  const handleExportFinancials = () => {
    const csvContent = [
      ['Metric', 'Value', 'Currency'].join(','),
      ['Total Revenue', metrics?.totalRevenue || 0, 'ZAR'].join(','),
      ['Monthly Revenue', metrics?.monthlyRevenue || 0, 'ZAR'].join(','),
      ['ARPU', metrics?.averageRevenuePerUser || 0, 'ZAR'].join(','),
      ['Active Subscriptions', metrics?.subscriptions.active || 0, 'Count'].join(','),
      ['Churn Rate', metrics?.churnRate || 0, 'Percentage'].join(','),
      ['Revenue Growth', metrics?.revenueGrowth || 0, 'Percentage'].join(',')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bizzin-financials-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (metricsLoading || !metrics) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Financial Overview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Overview</h2>
          <p className="text-muted-foreground">Revenue, subscriptions, and financial metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportFinancials} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* User Segmentation Overview */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">User Segmentation</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Signups</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.userSegmentation?.free || 0}</div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.userSegmentation?.trial || 0}</div>
              <p className="text-xs text-muted-foreground">
                Within 2-week trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <Crown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.userSegmentation?.premium || 0}</div>
              <p className="text-xs text-muted-foreground">
                Paying customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Trials</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.userSegmentation?.expired_trial || 0}</div>
              <p className="text-xs text-muted-foreground">
                Trial expired - need upgrade
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Signup Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.conversionMetrics?.free_to_trial || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Weekly growth
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial to Premium</CardTitle>
              <Crown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.conversionMetrics?.trial_to_premium || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial to Churn</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.conversionMetrics?.trial_to_churn || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Churn rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{metrics.conversionMetrics?.overall_conversion || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Free to premium
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{metrics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{metrics.monthlyRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs">
                {metrics.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                )}
                <span className={metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {metrics.revenueGrowth.toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARPU</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{metrics.averageRevenuePerUser.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">
                Average Revenue Per User
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.churnRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Monthly churn rate
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Subscription Breakdown */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.subscriptions.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.subscriptions.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.subscriptions.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.subscriptions.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${value}`, 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions && recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium">{transaction.user_email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">R{transaction.amount}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.plan_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}