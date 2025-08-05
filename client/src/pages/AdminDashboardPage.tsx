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

  // Check if user is admin
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user) return false
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single()
      
      if (error) return false
      return data?.is_admin === true
    },
    enabled: !!user
  })

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        usersResult,
        activeUsersResult,
        paidUsersResult,
        earlySignupsResult,
        journalEntriesResult,
        goalsResult,
        podcastProgressResult,
        documentsResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('user_profiles').select('id', { count: 'exact' }).gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('user_plans').select('id', { count: 'exact' }).eq('plan_type', 'premium'),
        supabase.from('early_signups').select('id', { count: 'exact' }),
        supabase.from('journal_entries').select('id', { count: 'exact' }),
        supabase.from('goals').select('id', { count: 'exact' }).eq('status', 'completed'),
        supabase.from('podcast_progress').select('id', { count: 'exact' }),
        supabase.from('documents').select('file_size')
      ])

      const totalStorage = documentsResult.data?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0

      return {
        totalUsers: usersResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
        paidUsers: paidUsersResult.count || 0,
        earlySignups: earlySignupsResult.count || 0,
        totalRevenue: (paidUsersResult.count || 0) * 199, // Assuming R199/month
        monthlyRevenue: (paidUsersResult.count || 0) * 199,
        journalEntries: journalEntriesResult.count || 0,
        completedGoals: goalsResult.count || 0,
        podcastViews: podcastProgressResult.count || 0,
        documentUploads: documentsResult.data?.length || 0,
        storageUsed: totalStorage,
        systemHealth: 'healthy' as const
      } as AdminStats
    },
    enabled: !!isAdmin,
    refetchInterval: 30000 // Refresh every 30 seconds
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
                <Badge variant={currentStats.systemHealth === 'healthy' ? 'default' : 'destructive'}>
                  {currentStats.systemHealth}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {(currentStats.storageUsed / (1024 * 1024 * 1024)).toFixed(1)}GB storage used
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