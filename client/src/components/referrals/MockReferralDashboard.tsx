import React, { useState } from 'react'
import { useAuth } from '@/hooks/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Copy, Users, Calendar, Gift, TrendingUp, ExternalLink } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export function MockReferralDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  const mockDashboard = {
    user_id: user?.id || '',
    email: user?.email || '',
    referral_code: 'DEMO1234',
    total_referrals: 3,
    active_referrals: 2,
    bonus_days_earned: 20,
    bonus_days_used: 0,
    available_bonus_days: 20,
    plan_status: 'Free',
    subscription_end_date: null,
    referral_extension_days: 20
  }

  const mockReferrals = [
    {
      id: '1',
      referee_email: 'friend1@example.com',
      is_active: true,
      signup_date: '2024-01-15T10:00:00Z',
      activation_date: '2024-01-16T14:30:00Z',
      deactivation_date: null
    },
    {
      id: '2',
      referee_email: 'colleague@business.com',
      is_active: true,
      signup_date: '2024-01-20T09:15:00Z',
      activation_date: '2024-01-21T11:45:00Z',
      deactivation_date: null
    },
    {
      id: '3',
      referee_email: 'partner@startup.co',
      is_active: false,
      signup_date: '2024-01-25T16:20:00Z',
      activation_date: '2024-01-26T10:15:00Z',
      deactivation_date: '2024-01-30T13:00:00Z'
    }
  ]

  const handleCopyReferralLink = async () => {
    const link = `${window.location.origin}/auth?ref=${mockDashboard.referral_code}`
    
    try {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getReferralLink = () => {
    // Check if we have a custom deployment URL
    const deploymentUrl = import.meta.env.VITE_DEPLOYMENT_URL
    if (deploymentUrl) {
      return `${deploymentUrl}/auth?ref=${mockDashboard.referral_code}`
    }
    
    // Use current origin for referral links
    const baseUrl = window.location.origin
    return `${baseUrl}/auth?ref=${mockDashboard.referral_code}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Referral Program
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Refer friends and earn 10 days free subscription for each paid referral
        </p>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            <strong>Demo Mode:</strong> This is a preview of the referral system. Database setup required for full functionality.
          </p>
        </div>
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
                  {mockDashboard.total_referrals}
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
                  {mockDashboard.active_referrals}
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
                  {mockDashboard.bonus_days_earned}
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
                  {mockDashboard.referral_extension_days}
                </div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Extension Days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-orange-600" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <code className="text-sm break-all">
                {getReferralLink()}
              </code>
            </div>
            <Button onClick={handleCopyReferralLink} size="sm" className="shrink-0">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Share this link with friends. When they sign up and subscribe to a paid plan, 
            you'll earn 10 days of free subscription!
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockReferrals.map((referral) => (
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
              <h4 className="font-semibold mb-2">Friend Subscribes</h4>
              <p className="text-sm text-gray-600">
                They sign up and subscribe to any paid plan
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">You Get Rewarded</h4>
              <p className="text-sm text-gray-600">
                Earn 10 days free subscription for each active referral
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="text-yellow-800 dark:text-yellow-300">
            Database Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-yellow-700 dark:text-yellow-400 space-y-2">
            <p>To activate the full referral system functionality:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open your Supabase dashboard</li>
              <li>Go to the SQL Editor</li>
              <li>Run the commands from <code>REFERRAL_SYSTEM_SETUP.sql</code></li>
              <li>Refresh this page to see live data</li>
            </ol>
            <p className="text-sm mt-3">
              See <code>REFERRAL_SYSTEM_SETUP_INSTRUCTIONS.md</code> for detailed setup guide.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}