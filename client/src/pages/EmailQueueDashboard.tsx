// Email Queue Monitoring Dashboard
// Real-time monitoring of the scalable email processing system

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Play, Users, Mail, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  total: number;
  worker_id: string;
  processing_stats: Record<string, number>;
}

interface SystemStats {
  queue: QueueStats;
  processing: any;
  workers: {
    active_workers: number;
    workers: any[];
  };
  system: {
    uptime: number;
    memory: any;
    node_env: string;
  };
}

export default function EmailQueueDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch queue statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/email-queue/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch queue stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual action handlers
  const handleAction = async (action: string, endpoint: string) => {
    setActionLoading(action);
    try {
      const response = await fetch(`/api/email-queue/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`${action} result:`, result);
        // Refresh stats after action
        setTimeout(fetchStats, 1000);
      }
    } catch (error) {
      console.error(`${action} failed:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'retrying': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading queue statistics...</span>
        </div>
      </div>
    );
  }

  const successRate = stats?.queue?.total ? 
    ((stats.queue.completed / stats.queue.total) * 100).toFixed(1) : '0.0';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Queue Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor scalable email processing system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.queue?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total jobs today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Emails delivered successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.workers?.active_workers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Processing emails
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.system ? formatUptime(stats.system.uptime) : '0h 0m'}
            </div>
            <p className="text-xs text-muted-foreground">
              Environment: {stats?.system?.node_env || 'unknown'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
            <CardDescription>Current status of email jobs in queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.queue && Object.entries(stats.queue)
              .filter(([key]) => ['pending', 'processing', 'completed', 'failed', 'retrying'].includes(key))
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                    <span className="capitalize">{status}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))
            }
          </CardContent>
        </Card>

        {/* Processing Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Performance</CardTitle>
            <CardDescription>Queue processing efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.queue?.total > 0 && (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Completion Rate</span>
                    <span>{successRate}%</span>
                  </div>
                  <Progress value={parseFloat(successRate)} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Queue Progress</span>
                    <span>{stats.queue.completed + stats.queue.failed}/{stats.queue.total}</span>
                  </div>
                  <Progress 
                    value={((stats.queue.completed + stats.queue.failed) / stats.queue.total) * 100} 
                    className="h-2" 
                  />
                </div>
              </>
            )}
            
            <div className="text-sm text-muted-foreground">
              Worker ID: {stats?.queue?.worker_id || 'unknown'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Controls</CardTitle>
          <CardDescription>
            Trigger email processing and queue management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleAction('Process All Users', 'process-all')}
              disabled={actionLoading === 'Process All Users'}
              className="w-full"
            >
              {actionLoading === 'Process All Users' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Queue All Users
            </Button>

            <Button
              onClick={() => handleAction('Process Pending', 'process-pending')}
              disabled={actionLoading === 'Process Pending'}
              className="w-full"
              variant="outline"
            >
              {actionLoading === 'Process Pending' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Process Pending
            </Button>

            <Button
              onClick={() => handleAction('Create Hourly Jobs', 'create-hourly-jobs')}
              disabled={actionLoading === 'Create Hourly Jobs'}
              className="w-full"
              variant="outline"
            >
              {actionLoading === 'Create Hourly Jobs' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Create Hourly Jobs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      {stats?.system && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Server resources and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Memory Usage:</span>
                <div className="text-muted-foreground">
                  RSS: {(stats.system.memory.rss / 1024 / 1024).toFixed(1)} MB
                </div>
                <div className="text-muted-foreground">
                  Heap Used: {(stats.system.memory.heapUsed / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
              <div>
                <span className="font-medium">Environment:</span>
                <div className="text-muted-foreground">
                  Node.js: {stats.system.node_env}
                </div>
                <div className="text-muted-foreground">
                  Uptime: {formatUptime(stats.system.uptime)}
                </div>
              </div>
              <div>
                <span className="font-medium">Queue Worker:</span>
                <div className="text-muted-foreground">
                  ID: {stats.queue.worker_id}
                </div>
                <div className="text-muted-foreground">
                  Jobs Today: {stats.queue.processing_stats?.jobs_today || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}