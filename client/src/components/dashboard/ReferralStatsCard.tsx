import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Gift, Calendar } from 'lucide-react'

interface ReferralStatsCardProps {
  onNavigate: (path: string) => void
}

export function ReferralStatsCard({ onNavigate }: ReferralStatsCardProps) {
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
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between pb-12">
        {/* Main Stats */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              Coming Soon
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">
              Earn free days
            </div>
          </div>

          {/* Preview Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">0</span>
              </div>
              <div className="text-purple-700 dark:text-purple-300">Referrals</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gift className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">0</span>
              </div>
              <div className="text-purple-700 dark:text-purple-300">Days Earned</div>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-xs text-purple-600 dark:text-purple-400 text-center bg-purple-50 dark:bg-purple-950/30 p-2 rounded">
            Refer friends and earn 10 days free subscription for each paid referral
          </div>
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>
        
        {/* Action Button */}
        <Button 
          onClick={() => onNavigate('/referrals')}
          variant="outline"
          size="sm"
          className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/50"
        >
          <Users className="w-4 h-4 mr-2" />
          View Referrals
        </Button>
      </CardContent>
    </Card>
  )
}