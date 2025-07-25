import { useState } from 'react'
import { usePaystackPayment } from 'react-paystack'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Crown, Check, CreditCard } from 'lucide-react'
import { PaystackService, type PaystackResponse } from '@/lib/services/paystack'
import { useAuth } from '@/hooks/AuthProvider'
import { useToast } from '@/hooks/use-toast'

export function PaystackUpgrade() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly')
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const upgradeMutation = useMutation({
    mutationFn: async (response: PaystackResponse) => {
      const success = await PaystackService.handlePaymentSuccess(response)
      if (!success) throw new Error('Failed to upgrade account')
      return success
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-status'] })
      toast({
        title: "Welcome to Premium!",
        description: "Your account has been successfully upgraded. Enjoy unlimited access to all features.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "There was an error upgrading your account. Please try again.",
        variant: "destructive",
      })
    }
  })

  // Configure Paystack payment
  const config = user ? PaystackService.createPaymentConfig(
    user.email!,
    user.id,
    selectedPlan
  ) : null

  const initializePayment = usePaystackPayment(config || {
    reference: '',
    email: '',
    amount: 0,
    publicKey: ''
  })

  const handlePaymentSuccess = async (response: any) => {
    setIsProcessing(true)
    
    if (user) {
      await PaystackService.logPaymentAttempt(
        user.id,
        config?.amount || 0,
        response.reference,
        'success'
      )
    }

    const paystackResponse: PaystackResponse = {
      reference: response.reference,
      status: 'success',
      message: response.message || 'Payment successful',
      transaction: response.transaction || response.trans || '',
      trxref: response.trxref || response.reference
    }

    upgradeMutation.mutate(paystackResponse)
    setIsProcessing(false)
  }

  const handlePaymentClose = () => {
    if (user && config) {
      PaystackService.logPaymentAttempt(
        user.id,
        config.amount,
        config.reference,
        'cancelled'
      )
    }
    
    toast({
      title: "Payment Cancelled",
      description: "You can upgrade to premium anytime from your profile settings.",
    })
  }

  const handleUpgrade = () => {
    if (!user || !config) {
      toast({
        title: "Error",
        description: "Please sign in to upgrade your account.",
        variant: "destructive",
      })
      return
    }

    PaystackService.logPaymentAttempt(
      user.id,
      config.amount,
      config.reference,
      'initiated'
    )

    initializePayment({
      onSuccess: handlePaymentSuccess,
      onClose: handlePaymentClose
    })
  }

  const monthlyPrice = PaystackService.getSubscriptionPrice('monthly')
  const annualPrice = PaystackService.getSubscriptionPrice('annual')
  const monthlySavings = (monthlyPrice * 12) - annualPrice

  return (
    <div className="space-y-6">
      {/* Plan Selection */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Upgrade to Premium
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Choose your billing cycle and unlock unlimited access
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPlan === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan('annual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              selectedPlan === 'annual'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Annual
            <Badge className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1">
              Save {PaystackService.formatAmount(monthlySavings)}
            </Badge>
          </button>
        </div>
      </div>

      {/* Selected Plan Card */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-slate-900 dark:text-white">
            Premium {selectedPlan === 'annual' ? 'Annual' : 'Monthly'}
          </CardTitle>
          <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
            {PaystackService.formatAmount(selectedPlan === 'annual' ? annualPrice : monthlyPrice)}
            <span className="text-lg font-normal text-slate-600 dark:text-slate-400">
              /{selectedPlan === 'annual' ? 'year' : 'month'}
            </span>
          </div>
          {selectedPlan === 'annual' && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              2 months free!
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              '10GB storage space',
              'Unlimited document uploads',
              'Unlimited journal entries',
              'Unlimited goals tracking',
              'Unlimited BizBuilder calculations',
              'Priority customer support',
              'Advanced analytics dashboard',
              'Export & backup features'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-sm">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={isProcessing || upgradeMutation.isPending}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 text-lg font-semibold"
            size="lg"
          >
            {isProcessing || upgradeMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay with Paystack
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Secure payment powered by Paystack • Cancel anytime
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}