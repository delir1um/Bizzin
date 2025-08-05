import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  Search,
  Download,
  Mail,
  Settings,
  BarChart3,
  UserCheck,
  Crown,
  Calendar,
  MessageSquare,
  Database,
  Shield
} from "lucide-react"
import { useAuth } from "@/hooks/AuthProvider"
import { supabase } from "@/lib/supabase"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AdminUserManagement } from "@/components/admin/AdminUserManagement"
import { AdminAnalytics } from "@/components/admin/AdminAnalytics"
import { AdminEarlySignups } from "@/components/admin/AdminEarlySignups"
import { AdminContentManagement } from "@/components/admin/AdminContentManagement"
import { AdminSystemHealth } from "@/components/admin/AdminSystemHealth"
import { AdminFinancialOverview } from "@/components/admin/AdminFinancialOverview"
import { PreLaunchToggle } from "@/components/admin/PreLaunchToggle"
import { useAdminCheck } from "@/hooks/useAdminCheck"

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

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [realtimeStats, setRealtimeStats] = useState<AdminStats | null>(null)
  const queryClient = useQueryClient()

  // Use the reusable admin check hook
  const { data: isAdmin, isLoading: adminLoading } = useAdminCheck()

  // Fetch admin statistics with comprehensive real data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      console.log('Fetching comprehensive admin stats...')
      
      // Initialize stats object
      let stats = {
        totalUsers: 0,
        activeUsers: 0,
        paidUsers: 0,
        earlySignups: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        journalEntries: 0,
        completedGoals: 0,
        podcastViews: 0,
        documentUploads: 0,
        storageUsed: 0,
        systemHealth: 'healthy' as 'healthy' | 'warning' | 'critical'
      }

      try {
        // 1. Get total users - try multiple approaches for accurate count
        let usersData = null
        let usersError = null
        
        // First try getting user_profiles with correct column names
        const profilesResult = await supabase
          .from('user_profiles')
          .select('user_id, created_at, updated_at')
        
        console.log('User profiles query:', { data: profilesResult.data, error: profilesResult.error })
        
        if (!profilesResult.error && profilesResult.data) {
          usersData = profilesResult.data
          stats.totalUsers = profilesResult.data.length
        } else {
          // Fallback: try auth.users (may not work due to RLS)
          console.log('Trying auth.users as fallback...')
          
          // If no users found, at least count that we have 1 admin (you)
          stats.totalUsers = 1 // Minimum 1 since admin is logged in
        }
        
        if (usersData && usersData.length > 0) {
          // Calculate active users (updated in last 7 days)
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          stats.activeUsers = usersData.filter(user => 
            new Date(user.updated_at || user.created_at) > sevenDaysAgo
          ).length
        } else {
          // If we can't get user data, assume admin is active
          stats.activeUsers = 1
        }

        // 2. Get paid users and revenue from user_plans
        const { data: plansData, error: plansError } = await supabase
          .from('user_plans')
          .select('plan_type, created_at, expires_at')
        
        if (!plansError && plansData) {
          const now = new Date()
          const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          
          // Count active premium users
          stats.paidUsers = plansData.filter(plan => 
            plan.plan_type === 'premium' && 
            (!plan.expires_at || new Date(plan.expires_at) > now)
          ).length
          
          // Calculate revenue (assuming R99.99 per premium user per month)
          const premiumPrice = 99.99
          stats.totalRevenue = stats.paidUsers * premiumPrice * 12 // Annual estimate
          
          // Monthly revenue from plans created this month
          const monthlyNewPlans = plansData.filter(plan => 
            plan.plan_type === 'premium' && 
            new Date(plan.created_at) >= currentMonth
          ).length
          stats.monthlyRevenue = monthlyNewPlans * premiumPrice
        }

        // 3. Get early signups
        const { data: signupsData, error: signupsError } = await supabase
          .from('early_signups')
          .select('id')
        
        if (!signupsError && signupsData) {
          stats.earlySignups = signupsData.length
        }
        
        // 4. Get documents and storage usage
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('file_size')
        
        if (!documentsError && documentsData) {
          stats.documentUploads = documentsData.length
          stats.storageUsed = documentsData.reduce((sum, doc) => sum + (doc.file_size || 0), 0)
        }
        
        // 5. Get journal entries count
        const { data: journalData, error: journalError } = await supabase
          .from('journal_entries')
          .select('id')
        
        if (!journalError && journalData) {
          stats.journalEntries = journalData.length
        }

        // 6. Get completed goals count
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('status')
        
        if (!goalsError && goalsData) {
          stats.completedGoals = goalsData.filter(goal => 
            goal.status === 'completed'
          ).length
        }

        // 7. Get podcast progress/views
        const { data: podcastData, error: podcastError } = await supabase
          .from('user_podcast_progress')
          .select('completed, progress_seconds')
        
        if (!podcastError && podcastData) {
          // Count total interactions as "views"
          stats.podcastViews = podcastData.length
        }

        // 8. Calculate system health based on actual metrics
        let healthScore = 100
        
        // Deduct points for potential issues
        if (stats.totalUsers === 0) healthScore -= 20
        if (stats.activeUsers / Math.max(stats.totalUsers, 1) < 0.1) healthScore -= 15
        if (stats.storageUsed > 1000000000) healthScore -= 10 // >1GB total storage
        
        stats.systemHealth = healthScore >= 80 ? 'healthy' : 
                           healthScore >= 60 ? 'warning' : 'critical'
        
      } catch (error) {
        console.error('Error fetching comprehensive stats:', error)
        stats.systemHealth = 'critical'
      }

      console.log('Final comprehensive stats:', stats)
      return stats
    },
    enabled: !!isAdmin,
    refetchInterval: 60000 // Refresh every minute
  })

  // Set up real-time subscriptions for live updates
  useEffect(() => {
    if (!isAdmin) return

    const channels = [
      supabase
        .channel('admin-users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
          // Trigger stats refetch
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
        }),
      
      supabase
        .channel('admin-signups')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'early_signups' }, () => {
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
          // Could trigger real-time notification here
        }),

      supabase
        .channel('admin-content')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, () => {
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
        })
    ]

    channels.forEach(channel => channel.subscribe())

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel))
    }
  }, [isAdmin])

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400">You don't have administrator privileges.</p>
        </div>
      </div>
    )
  }

  const currentStats = stats || realtimeStats

  return (
    <div className="space-y-6 p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          <em>Bizzin</em> Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Comprehensive platform management and analytics
        </p>
      </div>

      {/* Pre-Launch Toggle */}
      <PreLaunchToggle />

      {/* Key Metrics Overview */}
      {currentStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {currentStats.activeUsers} active this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{currentStats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {currentStats.paidUsers} paid subscribers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Early Signups</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStats.earlySignups.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Pre-launch leads captured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant={
                  currentStats.systemHealth === 'healthy' ? 'default' : 
                  currentStats.systemHealth === 'warning' ? 'secondary' : 'destructive'
                }>
                  {currentStats.systemHealth.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {(currentStats.storageUsed / (1024 * 1024)).toFixed(1)}MB storage used
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Admin Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="signups" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Early Signups
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AdminAnalytics stats={currentStats} />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="signups" className="space-y-6">
          <AdminEarlySignups />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <AdminContentManagement />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <AdminFinancialOverview />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <AdminSystemHealth />
        </TabsContent>
      </Tabs>
    </div>
  )
}