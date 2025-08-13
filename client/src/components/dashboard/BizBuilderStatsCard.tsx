import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Calculator, BarChart3, TrendingUp, FileSpreadsheet } from 'lucide-react'
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
    return (
      <Card className="relative overflow-hidden group bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Calculator className="w-5 h-5" />
            </div>
            <CardTitle className="text-base font-semibold text-orange-900 dark:text-orange-100">
              BizBuilder Tools
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col justify-between pb-12">
          <div className="space-y-4">
            <div className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
          <Skeleton className="h-9 w-full mt-4" />
        </CardContent>
      </Card>
    )
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

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <Calculator className="w-5 h-5" />
          </div>
          <CardTitle className="text-base font-semibold text-orange-900 dark:text-orange-100">
            BizBuilder Tools
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between pb-12">
        {/* Main Stats */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100 mb-1">
              {totalCalculations}
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">
              {hasCalculations ? 'Saved Scenarios' : 'Start Planning'}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-orange-900 dark:text-orange-100">
                  {toolsUsed}
                </span>
              </div>
              <div className="text-orange-700 dark:text-orange-300">Tools Used</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-orange-900 dark:text-orange-100">
                  {recentCalculations}
                </span>
              </div>
              <div className="text-orange-700 dark:text-orange-300">This Week</div>
            </div>
          </div>

          {/* Progress Bar */}
          {hasCalculations && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-orange-700 dark:text-orange-300">
                <span>Planning Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress 
                value={completionPercentage} 
                className="h-2 bg-orange-100 dark:bg-orange-900/20"
              />
            </div>
          )}

          {/* Status Information */}
          <div className="text-xs text-orange-600 dark:text-orange-400 text-center bg-orange-50 dark:bg-orange-950/30 p-2 rounded">
            {hasRecentActivity ? (
              <>Last: {getCalculatorDisplayName(mostRecentCalc.calculator_type)} {getTimeSince(mostRecentCalc.created_at)}</>
            ) : hasCalculations ? (
              <>Last calculation: {getTimeSince(mostRecentCalc.created_at)}</>
            ) : (
              <>6 powerful calculators to plan and grow your business</>
            )}
          </div>
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>
        
        {/* Action Button */}
        <Button 
          onClick={() => onNavigate('/bizbuilder')}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          size="sm"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {hasCalculations ? 'Continue Planning' : 'Start Planning'}
        </Button>
      </CardContent>
    </Card>
  )
}