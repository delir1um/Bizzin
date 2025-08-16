import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/AuthProvider'
import { BaseStatsCard, CardZones } from './BaseStatsCard'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calculator, BarChart3, TrendingUp, FileSpreadsheet, Target, Briefcase } from 'lucide-react'
import { CalculatorHistoryService } from '@/lib/services/calculatorHistory'

interface BizBuilderStatsCardProps {
  onNavigate: (path: string) => void
}

export function BizBuilderStatsCard({ onNavigate }: BizBuilderStatsCardProps) {
  const { user } = useAuth()

  const { data: calculations = [], isLoading } = useQuery({
    queryKey: ['calculator-history', user?.id],
    queryFn: () => user ? CalculatorHistoryService.getCalculationHistory(user.id) : Promise.resolve([]),
    enabled: !!user
  })

  if (isLoading) {
    const loadingZones: CardZones = {
      header: {
        icon: <Calculator className="w-4 h-4" />,
        title: 'BizBuilder Tools'
      },
      metric: {
        primary: <Skeleton className="h-8 w-16 mx-auto" />,
        label: 'Loading...',
        status: 'Loading',
        statusColor: 'text-gray-500'
      },
      stats: {
        left: { value: <Skeleton className="h-6 w-8" />, label: 'Tools Used' },
        right: { value: <Skeleton className="h-6 w-8" />, label: 'This Week' }
      },
      action: {
        text: 'Loading...',
        icon: <Calculator className="h-4 w-4 mr-2" />,
        onClick: () => {},
        variant: 'default'
      }
    }

    const theme = {
      primary: 'orange',
      gradient: 'from-orange-50 to-amber-100',
      darkGradient: 'dark:from-orange-950/20 dark:to-amber-900/20',
      border: 'border-orange-200 dark:border-orange-800',
      hover: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30',
      hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-600'
    }

    return <BaseStatsCard zones={loadingZones} theme={theme} />
  }

  const totalCalculations = calculations.length
  const recentCalculations = calculations.filter(calc => {
    const calcDate = new Date(calc.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return calcDate >= weekAgo
  }).length

  // Get unique calculator types used
  const calculatorTypes = Array.from(new Set(calculations.map(calc => calc.calculator_type)))
  const totalAvailableTools = 6 // business_budget, cash_flow, break_even, loan_amortisation, compound_interest, simple_interest
  const toolsUsed = calculatorTypes.length
  const completionPercentage = Math.round((toolsUsed / totalAvailableTools) * 100)

  // Get most recent calculation info
  const mostRecentCalc = calculations[0]
  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'today'
    if (diffDays === 2) return 'yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  const getCalculatorDisplayName = (type: string) => {
    const names = {
      'business_budget': 'Budget',
      'cash_flow': 'Cash Flow',
      'break_even': 'Break-Even',
      'loan_amortisation': 'Loan',
      'compound_interest': 'Compound Interest',
      'simple_interest': 'Simple Interest'
    }
    return names[type as keyof typeof names] || type
  }

  const hasCalculations = totalCalculations > 0
  const hasRecentActivity = recentCalculations > 0

  // Determine status
  const getStatus = () => {
    if (completionPercentage >= 80) return { status: 'Tool Master', color: 'text-green-600' }
    if (completionPercentage >= 50) return { status: 'Strategic Planning', color: 'text-blue-600' }
    if (hasCalculations) return { status: 'Getting Started', color: 'text-orange-600' }
    return { status: 'Ready to Plan', color: 'text-gray-500' }
  }

  const statusInfo = getStatus()

  // Create insight text
  const insightText = mostRecentCalc ? 
    `Last used: ${getCalculatorDisplayName(mostRecentCalc.calculator_type)} ${getTimeSince(mostRecentCalc.created_at)}` :
    '6 powerful calculators to plan and grow your business'

  // Create header badge for consistency
  const headerBadge = (
    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs">
      {toolsUsed} tools used
    </Badge>
  )

  const zones: CardZones = {
    header: {
      icon: <Calculator className="w-4 h-4" />,
      title: 'BizBuilder Tools',
      badge: headerBadge
    },
    metric: {
      primary: totalCalculations,
      label: hasCalculations ? 'Saved Scenarios' : 'Start Planning',
      status: statusInfo.status,
      statusColor: statusInfo.color,
      statusIcon: hasCalculations ? <Briefcase className="h-3 w-3" /> : <Target className="h-3 w-3" />
    },
    progress: {
      value: hasCalculations ? completionPercentage : 0,
      color: 'orange',
      subtitle: '6 tools complete',
      showPercentage: false
    },
    stats: {
      left: {
        value: toolsUsed,
        label: 'Tools Used'
      },
      right: {
        value: recentCalculations,
        label: 'This Week'
      }
    },
    insight: {
      icon: <BarChart3 className="h-3 w-3" />,
      text: insightText,
      variant: 'default'
    },
    action: {
      text: hasCalculations ? 'View Scenarios' : 'Start Planning',
      icon: hasCalculations ? <FileSpreadsheet className="h-4 w-4 mr-2" /> : <Calculator className="h-4 w-4 mr-2" />,
      onClick: () => onNavigate('/bizbuilder'),
      variant: 'primary'
    }
  }

  const theme = {
    primary: 'orange',
    gradient: 'from-orange-50 to-amber-100',
    darkGradient: 'dark:from-orange-950/20 dark:to-amber-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    hover: 'hover:shadow-orange-200/50 dark:hover:shadow-orange-900/30',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-600'
  }

  return (
    <BaseStatsCard 
      zones={zones} 
      theme={theme} 
      onClick={() => onNavigate('/bizbuilder')}
    />
  )
}