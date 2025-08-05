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

  // Check if user is admin - simplified approach for your specific email
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user) return false
      
      console.log('Checking admin access for user:', user.id, user.email)
      
      // Direct admin check for anton@cloudfusion.co.za
      if (user.email === 'anton@cloudfusion.co.za') {
        console.log('User is admin: hardcoded admin email')
        return true
      }
      
      // Also check user ID directly (from logs: 9502ea97-1adb-4115-ba05-1b6b1b5fa721)
      if (user.id === '9502ea97-1adb-4115-ba05-1b6b1b5fa721') {
        console.log('User is admin: hardcoded admin user ID')
        return true
      }
      
      // Try to check admin_users table without RLS issues
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle()
        
        console.log('Admin data result:', { adminData, adminError })
        
        if (adminData?.is_admin) {
          console.log('User is admin via admin_users table')
          return true
        }
      } catch (error) {
        console.log('Admin table check failed:', error)
      }
      
      console.log('User is not admin')
      return false
    },
    enabled: !!user
  })

  // Fetch admin statistics with better error handling
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      console.log('Fetching admin stats...')
      
      // Start with default stats
      let stats = {
        totalUsers: 1, // At least you exist
        activeUsers: 1,
        paidUsers: 0,
        earlySignups: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        journalEntries: 0,
        completedGoals: 0,
        podcastViews: 0,
        documentUploads: 0,
        storageUsed: 0,
        systemHealth: 'healthy' as const
      }

      // Try to get real data from existing tables
      try {
        // Check for early_signups
        const { data: signupsData, error: signupsError } = await supabase
          .from('early_signups')
          .select('id', { count: 'exact' })
        
        console.log('Early signups result:', { count: signupsData, error: signupsError })
        if (!signupsError && signupsData) {
          stats.earlySignups = signupsData.length || 0
        }
        
        // Check for documents  
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('file_size')
        
        console.log('Documents result:', { count: documentsData?.length, error: documentsError })
        if (!documentsError && documentsData) {
          stats.documentUploads = documentsData.length
          stats.storageUsed = documentsData.reduce((sum, doc) => sum + (doc.file_size || 0), 0)
        }
        
        // Check for journal entries
        const { data: journalData, error: journalError } = await supabase
          .from('journal_entries')
          .select('id', { count: 'exact' })
        
        if (!journalError && journalData) {
          stats.journalEntries = journalData.length || 0
        }
        
      } catch (error) {
        console.log('Error fetching stats:', error)
      }

      console.log('Final stats:', stats)
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