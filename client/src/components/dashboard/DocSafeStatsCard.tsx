import React from 'react'
import { BaseStatsCard, CardZones } from './BaseStatsCard'
import { Badge } from '@/components/ui/badge'
import { File, Upload, Database, Shield, Archive } from 'lucide-react'

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

  // Create header badge
  const headerBadge = (
    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-xs">
      {stats.total_documents} docs
    </Badge>
  )

  // Create insight text
  const insightText = stats.total_documents >= 10 ? 
    'Your document library is well organized' :
    stats.total_documents > 0 ? 
    'Keep building your secure collection' :
    'Start storing your documents securely'

  const zones: CardZones = {
    header: {
      icon: <File className="h-4 w-4" />,
      title: 'DocSafe',
      badge: headerBadge
    },
    metric: {
      primary: stats.total_documents,
      label: 'Documents Stored',
      status: storageInfo.status,
      statusColor: storageInfo.color,
      statusIcon: stats.total_documents >= 10 ? <Database className="h-3 w-3" /> : 
                  stats.total_documents > 0 ? <Archive className="h-3 w-3" /> : 
                  <Shield className="h-3 w-3" />
    },
    progress: {
      value: Math.min(100, (stats.total_documents / 50) * 100),
      color: 'emerald',
      subtitle: 'Well organized',
      showPercentage: false
    },
    stats: {
      left: {
        value: formatStorageSize(stats.storage_used),
        label: 'Space Used'
      },
      right: {
        value: recentUploads,
        label: 'Recent'
      }
    },
    insight: {
      icon: stats.total_documents >= 10 ? <Database className="h-3 w-3" /> : <Upload className="h-3 w-3" />,
      text: insightText,
      variant: 'default'
    },
    action: {
      text: stats.total_documents > 0 ? 'Manage Docs' : 'Upload Docs',
      icon: stats.total_documents > 0 ? <Database className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />,
      onClick: () => onNavigate('/docsafe'),
      variant: 'primary'
    }
  }

  const theme = {
    primary: 'emerald',
    gradient: 'from-emerald-50 to-emerald-100',
    darkGradient: 'dark:from-emerald-950/20 dark:to-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    hover: 'hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/30',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-600'
  }

  return (
    <BaseStatsCard 
      zones={zones} 
      theme={theme} 
      onClick={() => onNavigate('/docsafe')}
    />
  )
}