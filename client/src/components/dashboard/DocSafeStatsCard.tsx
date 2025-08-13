import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { File, Upload, Database, Info } from 'lucide-react'

interface DocSafeStatsCardProps {
  storageStats: {
    storage_used: number
    storage_limit: number
    total_documents: number
    storage_percentage: number
  } | null
  onNavigate: (path: string) => void
}

export function DocSafeStatsCard({ storageStats, onNavigate }: DocSafeStatsCardProps) {
  // Default values if storage stats not available
  const stats = storageStats || {
    storage_used: 0,
    storage_limit: 50 * 1024 * 1024, // 50MB default
    total_documents: 0,
    storage_percentage: 0
  }
  
  // Format storage size for display
  const formatStorageSize = (bytes: number) => {
    if (bytes === 0) return '0 MB'
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
    return `${mb.toFixed(1)} MB`
  }
  
  const formatStorageLimit = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1) return `${gb.toFixed(1)} GB`
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  }
  
  // Determine storage status and color - Positive framing
  const getStorageStatus = (percentage: number, documentCount: number) => {
    if (documentCount >= 20) return { status: 'Rich Collection', color: 'text-emerald-600' }
    if (documentCount >= 10) return { status: 'Growing Library', color: 'text-blue-600' }
    if (documentCount >= 5) return { status: 'Active Storage', color: 'text-purple-600' }
    if (documentCount > 0) return { status: 'Getting Started', color: 'text-green-600' }
    return { status: 'Ready to Store', color: 'text-gray-500' }
  }
  
  const storageInfo = getStorageStatus(stats.storage_percentage, stats.total_documents)
  
  // Calculate recent activity - show actual recent documents
  const recentUploads = stats.total_documents // Show all documents for now
  
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <File className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">DocSafe</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs">
            Secure Storage
          </Badge>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            {stats.total_documents} docs
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col h-full space-y-4">
        {/* Primary Metrics */}
        <div className="text-center space-y-1">
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.total_documents}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Documents Stored</div>
          <div className={`text-xs font-medium ${storageInfo.color}`}>
            {storageInfo.status}
          </div>
        </div>
        
        {/* Organization Progress */}
        <div className="space-y-2">
          <div className="w-full bg-emerald-200/50 dark:bg-emerald-800/30 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 to-emerald-500"
              style={{ width: `${Math.min(100, (stats.total_documents / 50) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0 docs</span>
            <span>Well organized</span>
          </div>
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{formatStorageSize(stats.storage_used)}</div>
            <div className="text-gray-600 dark:text-gray-400">Space Used</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-gray-100">{recentUploads}</div>
            <div className="text-gray-600 dark:text-gray-400">Recent</div>
          </div>
        </div>
        
        {/* Storage Insight */}
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
          {stats.total_documents >= 10 ? (
            <>
              <Database className="h-3 w-3 inline mr-1" />
              Your document library is well organized
            </>
          ) : stats.total_documents > 0 ? (
            <>
              <Upload className="h-3 w-3 inline mr-1" />
              Keep building your secure collection
            </>
          ) : (
            <>
              <Upload className="h-3 w-3 inline mr-1" />
              Start storing your documents securely
            </>
          )}
        </div>
        
        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>
        
        {/* Action Button */}
        <Button 
          onClick={() => onNavigate('/docsafe')}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
          size="sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          {stats.total_documents > 0 ? 'Manage Docs' : 'Upload Docs'}
        </Button>
        

      </CardContent>
    </Card>
  )
}