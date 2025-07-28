import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface StatCard {
  id: string
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  gradientColors: string
  borderColor: string
}

interface FilterOption {
  key: string
  label: string
  value: string
}

interface ActionButton {
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

interface StandardPageLayoutProps {
  // Page Identity
  title: string
  subtitle: string
  
  // Header Actions
  primaryAction?: ActionButton
  secondaryActions?: ActionButton[]
  
  // Stats Section
  stats: StatCard[]
  
  // Search & Filters
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  
  filters?: {
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
  }[]
  
  // Content
  children: React.ReactNode
  
  // Layout Options
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '7xl'
  showSearch?: boolean
  showFilters?: boolean
}

export function StandardPageLayout({
  title,
  subtitle,
  primaryAction,
  secondaryActions = [],
  stats,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  children,
  maxWidth = '7xl',
  showSearch = true,
  showFilters = true
}: StandardPageLayoutProps) {
  const containerClass = `max-w-${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8`
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className={containerClass}>
        {/* Standardized Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
              <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>
            
            {/* Header Actions */}
            <div className="mt-4 sm:mt-0 flex gap-3">
              {secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                  className={action.className}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
              
              {primaryAction && (
                <Button
                  variant={primaryAction.variant || 'default'}
                  onClick={primaryAction.onClick}
                  className={primaryAction.className || "bg-orange-600 hover:bg-orange-700 text-white"}
                >
                  {primaryAction.icon}
                  {primaryAction.label}
                </Button>
              )}
            </div>
          </div>
          
          {/* Search Bar */}
          {showSearch && onSearchChange && (
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}
          
          {/* Filters */}
          {showFilters && filters.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-6">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{filter.label}:</span>
                  <Select value={filter.value} onValueChange={filter.onChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filter.options.map((option) => (
                        <SelectItem key={option.key} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Standardized Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats?.map((stat) => (
            <Card 
              key={stat.id}
              className={`${stat.gradientColors} ${stat.borderColor} hover:shadow-md transition-all duration-200`}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg mr-3">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{stat.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Export utility function for creating stat cards
export function createStatCard(
  id: string,
  title: string,
  value: string | number,
  subtitle: string,
  icon: React.ReactNode,
  colorScheme: 'orange' | 'green' | 'blue' | 'purple' | 'slate' = 'orange'
): StatCard {
  const colorSchemes = {
    orange: {
      gradientColors: 'bg-gradient-to-br from-orange-50 to-amber-50',
      borderColor: 'border-orange-200'
    },
    green: {
      gradientColors: 'bg-gradient-to-br from-green-50 to-emerald-50',
      borderColor: 'border-green-200'
    },
    blue: {
      gradientColors: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200'
    },
    purple: {
      gradientColors: 'bg-gradient-to-br from-purple-50 to-pink-50',
      borderColor: 'border-purple-200'
    },
    slate: {
      gradientColors: 'bg-gradient-to-br from-slate-50 to-slate-100',
      borderColor: 'border-slate-200'
    }
  }
  
  const colors = colorSchemes[colorScheme]
  
  return {
    id,
    title,
    value,
    subtitle,
    icon,
    gradientColors: colors.gradientColors,
    borderColor: colors.borderColor
  }
}