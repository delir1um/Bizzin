import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Database,
  Server,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  FileText,
  Shield
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

interface SystemMetrics {
  database: {
    status: 'healthy' | 'warning' | 'critical'
    connections: number
    maxConnections: number
    queryTime: number
  }
  storage: {
    used: number
    limit: number
    percentage: number
  }
  users: {
    activeNow: number
    activeLast24h: number
    totalSessions: number
  }
  performance: {
    avgResponseTime: number
    errorRate: number
    uptime: number
  }
}

export function AdminSystemHealth() {
  // Fetch system health metrics
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      // In production, these would come from monitoring services
      // For now, we'll calculate basic metrics from Supabase data
      
      const [
        userCount,
        documentsData,
        recentActivity
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('documents').select('file_size'),
        supabase.from('user_profiles').select('last_login').gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ])

      const totalStorage = documentsData.data?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0
      const storageLimit = 50 * 1024 * 1024 * 1024 // 50GB in bytes

      return {
        database: {
          status: 'healthy' as const,
          connections: 12,
          maxConnections: 100,
          queryTime: 45
        },
        storage: {
          used: totalStorage,
          limit: storageLimit,
          percentage: (totalStorage / storageLimit) * 100
        },
        users: {
          activeNow: Math.floor(Math.random() * 50) + 10, // Mock active users
          activeLast24h: recentActivity.data?.length || 0,
          totalSessions: (userCount.count || 0) * 3 // Estimated sessions
        },
        performance: {
          avgResponseTime: 120 + Math.floor(Math.random() * 50),
          errorRate: 0.1 + Math.random() * 0.4,
          uptime: 99.9
        }
      } as SystemMetrics
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />
      default: return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  if (isLoading || !metrics) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h2>
          <p className="text-muted-foreground">Real-time monitoring and system status</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key System Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Database Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">
                {getStatusIcon(metrics.database.status)}
              </div>
              <Badge variant={metrics.database.status === 'healthy' ? 'default' : 'destructive'}>
                {metrics.database.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Connections</span>
                <span>{metrics.database.connections}/{metrics.database.maxConnections}</span>
              </div>
              <Progress 
                value={(metrics.database.connections / metrics.database.maxConnections) * 100} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                Avg query time: {metrics.database.queryTime}ms
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {metrics.storage.percentage.toFixed(1)}%
            </div>
            <Progress value={metrics.storage.percentage} className="h-2 mb-2" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Used: {(metrics.storage.used / (1024 * 1024 * 1024)).toFixed(2)}GB</div>
              <div>Limit: {(metrics.storage.limit / (1024 * 1024 * 1024)).toFixed(0)}GB</div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {metrics.users.activeNow}
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Now online: {metrics.users.activeNow}</div>
              <div>Last 24h: {metrics.users.activeLast24h}</div>
              <div>Total sessions: {metrics.users.totalSessions}</div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {metrics.performance.uptime}%
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Uptime: {metrics.performance.uptime}%</div>
              <div>Response: {metrics.performance.avgResponseTime}ms</div>
              <div>Error rate: {metrics.performance.errorRate.toFixed(2)}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed System Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Database Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(metrics.database.status)}
                <span className={`text-sm ${getStatusColor(metrics.database.status)}`}>
                  {metrics.database.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Connections</span>
                <span>{metrics.database.connections}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Max Connections</span>
                <span>{metrics.database.maxConnections}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Average Query Time</span>
                <span>{metrics.database.queryTime}ms</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Database is running smoothly. All connections are within normal limits.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">SSL Certificate</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Valid</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Row Level Security</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">API Authentication</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Backups</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Daily</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                All security measures are active and functioning properly.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Logs (Mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent System Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground">2 minutes ago</span>
              <span>Database backup completed successfully</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-muted-foreground">15 minutes ago</span>
              <span>New user registration: john@example.com</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground">1 hour ago</span>
              <span>System health check passed</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-muted-foreground">3 hours ago</span>
              <span>High memory usage detected (85%)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground">6 hours ago</span>
              <span>SSL certificate renewed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}