import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Users, Gift, Calendar, CheckCircle, Clock } from 'lucide-react'
import { ReferralService } from '@/lib/services/referrals'

interface ReferralStatsCardProps {
  onNavigate: (path: string) => void
}

export function ReferralStatsCard({ onNavigate }: ReferralStatsCardProps) {
  const { user } = useAuth()

  const { data: referralStats, isLoading } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: () => user ? ReferralService.getReferralStats(user.id) : Promise.resolve(null),
    enabled: !!user
  })

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle className="text-base font-semibold text-purple-900 dark:text-purple-100">
              Referrals
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
          </div>
          <Skeleton className="h-9 w-full mt-4" />
        </CardContent>
      </Card>
    )
  }

  const hasReferrals = referralStats && referralStats.total_referrals > 0
  const hasAvailableDays = referralStats && referralStats.available_bonus_days > 0
  const hasActiveExtension = referralStats?.subscription_extension_until && new Date(referralStats.subscription_extension_until) > new Date()

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 min-h-[50px]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <CardTitle className="text-base font-semibold text-purple-900 dark:text-purple-100">
            Referrals
          </CardTitle>
        </div>
        {hasActiveExtension && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <Clock className="w-3 h-3 mr-1" />
            Extended
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between pb-12">
        {/* Main Stats */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              {referralStats?.total_referrals || 0}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              {hasReferrals ? 'Total Referrals' : 'Start Referring'}
            </div>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">
                  {referralStats?.active_referrals || 0}
                </span>
              </div>
              <div className="text-purple-700 dark:text-purple-300">Active</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gift className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">
                  {referralStats?.available_bonus_days || 0}
                </span>
              </div>
              <div className="text-purple-700 dark:text-purple-300">Days Available</div>
            </div>
          </div>

          {/* Status Information */}
          <div className="text-xs text-purple-600 dark:text-purple-400 text-center bg-purple-50 dark:bg-purple-950/30 p-2 rounded">
            {hasAvailableDays ? (
              <>You have {referralStats!.available_bonus_days} bonus days to use!</>
            ) : hasReferrals ? (
              <>Earned {referralStats!.bonus_days_earned} days total • Used {referralStats!.bonus_days_used}</>
            ) : (
              <>Refer friends and earn 10 days free subscription for each paid referral</>
            )}
          </div>
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>
        
        {/* Action Button */}
        <Button 
          onClick={() => onNavigate('/profile?tab=referrals')}
          variant="outline"
          size="sm"
          className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/50"
        >
          <Users className="w-4 h-4 mr-2" />
          {hasReferrals ? 'Manage Referrals' : 'Start Referring'}
        </Button>
      </CardContent>
    </Card>
  )
}