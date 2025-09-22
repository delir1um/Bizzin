import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/AuthProvider'
import { ReferralService, ReferralDashboard as ReferralDashboardType, ReferralEntry } from '@/lib/services/referrals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Copy, Users, Calendar, Gift, TrendingUp, ExternalLink } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export function ReferralDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [dashboard, setDashboard] = useState<ReferralDashboardType | null>(null)
  const [referrals, setReferrals] = useState<ReferralEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadReferralData()
    }
  }, [user])

  const loadReferralData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const [dashboardData, referralsData] = await Promise.all([
        ReferralService.getReferralDashboard(user.id),
        ReferralService.getUserReferrals(user.id)
      ])
      
      setDashboard(dashboardData)
      setReferrals(referralsData)
    } catch (error) {
      console.error('Error loading referral data:', error)
      toast({
        title: "Error",
        description: "Failed to load referral data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReferralLink = async () => {
    if (!dashboard?.referral_code) return

    const success = await ReferralService.copyReferralLink(dashboard.referral_code)
    if (success) {
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard"
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCopyReferralCode = async () => {
    if (!dashboard?.referral_code) return

    try {
      await navigator.clipboard.writeText(dashboard.referral_code)
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getReferralLink = () => {
    if (!dashboard?.referral_code) return ''
    return ReferralService.generateReferralLink(dashboard.referral_code)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load referral data</p>
        <Button onClick={loadReferralData} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Referral Program
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Refer friends and both of you get benefits! They get a 14-day trial + 30 bonus days, you get 10 days when they convert to premium.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Referrals */}
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {dashboard.total_referrals}
                </div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Referrals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Referrals */}
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {dashboard.active_referrals}
                </div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Active Referrals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bonus Days Earned */}
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg shadow-sm">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {dashboard.bonus_days_earned}
                </div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Days Earned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extension Days */}
        <Card className="hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg shadow-sm">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {dashboard.referral_extension_days}
                </div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Extension Days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-orange-600" />
            Your Referral Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
              <div className="text-3xl font-mono font-bold text-orange-900 dark:text-orange-100">
                {dashboard.referral_code}
              </div>
            </div>
            <Button onClick={handleCopyReferralCode} size="sm" className="shrink-0 bg-orange-600 hover:bg-orange-700">
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </Button>
          </div>
          
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>How it works:</strong> Share this code with friends. When they sign up and enter your code:
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li>• They get a <strong>14-day premium trial</strong> immediately</li>
              <li>• When they convert to premium, they get <strong>30 bonus days</strong> added</li>
              <li>• You get <strong>10 days free</strong> when they convert to premium</li>
              <li>• It's a win-win for everyone!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No referrals yet</p>
              <p className="text-sm text-gray-400">
                Start sharing your referral link to earn free subscription days
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      referral.is_active 
                        ? 'bg-green-500' 
                        : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium">
                        {referral.referee_email}
                      </div>
                      <div className="text-sm text-gray-500">
                        Signed up {formatDistanceToNow(new Date(referral.signup_date), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={referral.is_active ? "default" : "secondary"}>
                      {referral.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {referral.activation_date && (
                      <div className="text-sm text-gray-500 mt-1">
                        Activated {format(new Date(referral.activation_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                    {referral.deactivation_date && (
                      <div className="text-sm text-red-500 mt-1">
                        Cancelled {format(new Date(referral.deactivation_date), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Share Your Link</h4>
              <p className="text-sm text-gray-600">
                Copy and share your unique referral link with friends
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">Friend Gets Trial</h4>
              <p className="text-sm text-gray-600">
                They get a 14-day premium trial when they sign up with your code
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Both Get Rewarded</h4>
              <p className="text-sm text-gray-600">
                When they convert to premium: they get 30 bonus days, you get 10 days free
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}