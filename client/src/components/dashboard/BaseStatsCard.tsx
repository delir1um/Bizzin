import React, { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface CardZones {
  header: {
    icon: ReactNode
    title: string
    badge?: ReactNode
  }
  metric: {
    primary: string | number
    label: string
    status: string
    statusColor: string
    statusIcon?: ReactNode
  }
  progress?: {
    value: number
    color: string
    subtitle: string
    showPercentage?: boolean
  }
  stats: {
    left: { value: string | number; label: string }
    right: { value: string | number; label: string }
  }
  insight?: {
    icon: ReactNode
    text: string
    variant?: 'default' | 'warning' | 'success' | 'info'
  }
  action: {
    text: string
    icon: ReactNode
    onClick: () => void
    variant?: 'default' | 'primary' | 'success' | 'warning'
  }
}

interface BaseStatsCardProps {
  zones: CardZones
  theme: {
    primary: string // e.g., 'blue', 'orange', 'purple'
    gradient: string // e.g., 'from-blue-50 to-blue-100'
    darkGradient: string // e.g., 'dark:from-blue-950/20 dark:to-blue-900/20'
    border: string // e.g., 'border-blue-200 dark:border-blue-800'
    hover: string // e.g., 'hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30'
    hoverBorder: string // e.g., 'hover:border-blue-300 dark:hover:border-blue-600'
  }
  className?: string
  onClick?: () => void
}

export function BaseStatsCard({ zones, theme, className, onClick }: BaseStatsCardProps) {
  const getActionButtonColors = (variant: string = 'default') => {
    const variants = {
      default: `bg-gradient-to-r from-${theme.primary}-500 to-${theme.primary}-600 hover:from-${theme.primary}-600 hover:to-${theme.primary}-700`,
      primary: `bg-gradient-to-r from-${theme.primary}-500 to-${theme.primary}-600 hover:from-${theme.primary}-600 hover:to-${theme.primary}-700`,
      success: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      warning: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
    }
    return variants[variant as keyof typeof variants] || variants.default
  }

  const getInsightColors = (variant: string = 'default') => {
    const variants = {
      default: `bg-${theme.primary}-50 dark:bg-${theme.primary}-900/20 border-${theme.primary}-200 dark:border-${theme.primary}-800 text-${theme.primary}-700 dark:text-${theme.primary}-300`,
      warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
      info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
    }
    return variants[variant as keyof typeof variants] || variants.default
  }

  return (
    <Card 
      className={cn(
        "relative overflow-hidden group transition-all duration-300 ease-out h-full flex flex-col",
        "hover:shadow-lg hover:-translate-y-1 min-h-[520px]",
        `bg-gradient-to-br ${theme.gradient} ${theme.darkGradient}`,
        theme.border,
        theme.hover,
        theme.hoverBorder,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Animated Background Gradient */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        `bg-gradient-to-br from-${theme.primary}-50/50 to-transparent dark:from-${theme.primary}-900/10`
      )} />

      {/* Header Zone - Truly Centered */}
      <CardHeader className="flex flex-col items-center justify-center space-y-3 pb-4 min-h-[90px] relative z-10 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            `bg-${theme.primary}-500/10 text-${theme.primary}-600 dark:text-${theme.primary}-400`
          )}>
            {zones.header.icon}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
            {zones.header.title}
          </h3>
        </div>
        {zones.header.badge && (
          <div className="flex justify-center items-center">
            {zones.header.badge}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col h-full space-y-4 relative z-10 pb-4 px-6">
        {/* Metric Zone - Perfect Baseline Alignment */}
        <div className="text-center min-h-[110px] flex flex-col justify-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 leading-none mb-3 h-[60px] flex items-center justify-center">
            {zones.metric.primary}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
            {zones.metric.label}
          </div>
          <div className={cn(
            "text-xs font-medium flex items-center justify-center gap-1",
            zones.metric.statusColor
          )}>
            {zones.metric.statusIcon}
            {zones.metric.status}
          </div>
        </div>

        {/* Progress Zone - Always Present */}
        <div className="space-y-2 min-h-[60px] px-2">
          {zones.progress ? (
            <>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    theme.primary === 'orange' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                    theme.primary === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                    theme.primary === 'purple' ? 'bg-gradient-to-r from-purple-400 to-purple-500' :
                    theme.primary === 'emerald' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                    'bg-gradient-to-r from-gray-400 to-gray-500'
                  )}
                  style={{ width: `${Math.min(100, zones.progress.value)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{zones.progress.showPercentage ? '0%' : '0'}</span>
                <span>{zones.progress.subtitle}</span>
              </div>
            </>
          ) : (
            <div className="h-[24px]"></div>
          )}
        </div>

        {/* Stats Zone - Perfect Alignment */}
        <div className="grid grid-cols-2 gap-6 text-sm min-h-[60px] items-center">
          <div className="text-center">
            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">
              {zones.stats.left.value}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-xs font-medium">
              {zones.stats.left.label}
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">
              {zones.stats.right.value}
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-xs font-medium">
              {zones.stats.right.label}
            </div>
          </div>
        </div>

        {/* Insight Zone - Always Present */}
        <div className="min-h-[60px] flex items-center justify-center">
          {zones.insight ? (
            <div className={cn(
              "text-xs text-center p-3 rounded-lg border w-full flex items-center justify-center",
              getInsightColors(zones.insight.variant)
            )}>
              <div className="flex items-center gap-1.5">
                {zones.insight.icon}
                <span className="leading-tight font-medium">{zones.insight.text}</span>
              </div>
            </div>
          ) : (
            <div className="h-[60px]"></div>
          )}
        </div>

        {/* Spacer - Ensures all buttons align at exact same height */}
        <div className="flex-1"></div>

        {/* Action Zone - Perfect Bottom Alignment */}
        <div className="h-[44px] flex items-end">
          <Button 
            onClick={zones.action.onClick}
            className={cn(
              "w-full text-white transition-all duration-200 h-[40px] font-medium",
              getActionButtonColors(zones.action.variant)
            )}
          >
            <div className="flex items-center justify-center gap-2 w-full">
              {zones.action.icon}
              <span className="truncate">{zones.action.text}</span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}