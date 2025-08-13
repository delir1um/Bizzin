import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, RefreshCw, Activity, TrendingUp, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface APIUsageStats {
  requestsToday: number
  errorsToday: number
  lastRequestTime: number
  quotaExceeded: boolean
  fallbackMode: boolean
}

interface APIStatus {
  usage_stats: APIUsageStats
  api_health: 'healthy' | 'quota_exceeded'
  fallback_active: boolean
  last_request: string
  requests_today: number
  errors_today: number
}

export function AdminAIMonitorPage() {
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fetch API status
  const { data: apiStatus, isLoading, error, refetch } = useQuery<APIStatus>({
    queryKey: ['api-status'],
    queryFn: async () => {
      const response = await fetch('/api/huggingface/status')
      if (!response.ok) {
        throw new Error('Failed to fetch API status')
      }
      return response.json()
    },
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds if enabled
  })

  // Auto-refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refetch])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading API monitoring dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load API status. Please check your connection.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const healthColor = apiStatus?.api_health === 'healthy' ? 'text-green-500' : 'text-red-500'
  const HealthIcon = apiStatus?.api_health === 'healthy' ? CheckCircle : AlertTriangle

  const errorRate = apiStatus ? 
    (apiStatus.errors_today / Math.max(apiStatus.requests_today, 1) * 100).toFixed(1) : '0'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI API Monitoring</h1>
          <p className="text-muted-foreground">Monitor Hugging Face API usage and health</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* API Health Status */}
      {apiStatus?.fallback_active && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>API Fallback Mode Active:</strong> Users are receiving simplified sentiment analysis due to API limitations. 
            This ensures no service interruption while maintaining basic functionality.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
            <HealthIcon className={`h-4 w-4 ${healthColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthColor}`}>
              {apiStatus?.api_health === 'healthy' ? 'Healthy' : 'Issues'}
            </div>
            <p className="text-xs text-muted-foreground">
              {apiStatus?.fallback_active ? 'Fallback Active' : 'Full AI Analysis'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiStatus?.requests_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Journal analyses processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              {apiStatus?.errors_today || 0} errors today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Request</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {apiStatus?.last_request ? 
                new Date(apiStatus.last_request).toLocaleTimeString() : 
                'No requests yet'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Latest API call
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Protection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Quota Protection</h3>
            <p className="text-sm text-muted-foreground">
              The system automatically detects API rate limits (429) and quota exceeded errors (403). 
              When these occur, it switches to fallback mode to ensure users never experience errors.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Fallback Analysis</h3>
            <p className="text-sm text-muted-foreground">
              During API limitations, the system provides keyword-based sentiment analysis with 60% confidence. 
              Users receive analysis results with clear indication that full AI will resume when API access is restored.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Recovery Process</h3>
            <p className="text-sm text-muted-foreground">
              The system automatically attempts to resume full AI analysis after 1 hour when quota limits are exceeded. 
              This ensures optimal performance while respecting API boundaries.
            </p>
          </div>

          {apiStatus && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Status Summary</h3>
              <ul className="text-sm space-y-1">
                <li>• Total requests processed today: {apiStatus.requests_today}</li>
                <li>• Error rate: {errorRate}% ({apiStatus.errors_today} errors)</li>
                <li>• Fallback mode: {apiStatus.fallback_active ? 'ACTIVE' : 'Inactive'}</li>
                <li>• Quota status: {apiStatus.api_health === 'healthy' ? 'Within limits' : 'Exceeded'}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}