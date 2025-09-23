import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePlans } from "@/hooks/usePlans"
import { useAuth } from "@/hooks/AuthProvider"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
  Download,
  ExternalLink,
  RefreshCw,
  Shield,
  DollarSign,
  Zap,
  RotateCcw
} from "lucide-react"
import { motion } from "framer-motion"
import type { PaymentTransaction } from "@/types/plans"

interface UserPlanDetails {
  payment_status: string
  last_payment_date?: string
  next_payment_date?: string
  failed_payment_count?: number
  grace_period_end?: string
  paystack_subscription_code?: string
  paystack_customer_code?: string
  plan_type: string
}

interface PaymentHistoryResponse {
  transactions: PaymentTransaction[]
  total: number
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatCurrency = (amount: number, currency: string = 'ZAR') => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

const getPaymentStatusConfig = (status: string) => {
  switch (status) {
    case 'active':
      return {
        label: 'Active',
        color: 'bg-green-500',
        textColor: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircle
      }
    case 'grace_period':
      return {
        label: 'Grace Period',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: AlertTriangle
      }
    case 'suspended':
      return {
        label: 'Suspended',
        color: 'bg-red-500',
        textColor: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: XCircle
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-gray-500',
        textColor: 'text-gray-700 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: Pause
      }
    case 'trial':
      return {
        label: 'Free Trial',
        color: 'bg-blue-500',
        textColor: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: Zap
      }
    case 'free':
      return {
        label: 'Free Plan',
        color: 'bg-slate-500',
        textColor: 'text-slate-700 dark:text-slate-300',
        bgColor: 'bg-slate-50 dark:bg-slate-950',
        borderColor: 'border-slate-200 dark:border-slate-800',
        icon: Shield
      }
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-500',
        textColor: 'text-gray-700 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-gray-950',
        borderColor: 'border-gray-200 dark:border-gray-800',
        icon: Clock
      }
  }
}

const getTransactionStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return <Badge className="bg-green-500 text-white">Success</Badge>
    case 'failed':
      return <Badge className="bg-red-500 text-white">Failed</Badge>
    case 'pending':
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>
    case 'cancelled':
      return <Badge className="bg-gray-500 text-white">Cancelled</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function BillingManagement() {
  const { user } = useAuth()
  const { usageStatus, isLoading: plansLoading, refetch, isTrial, isPremium, isFree } = usePlans()
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)

  // Fetch user plan details with payment information  
  const { data: planDetails, isLoading: planDetailsLoading } = useQuery({
    queryKey: ['/api/plans/user-plan-details'],
    enabled: !!user,
    queryFn: async () => {
      // For trial users, return trial status immediately
      if (isTrial && usageStatus?.user_plan) {
        return {
          payment_status: 'trial',
          plan_type: usageStatus.user_plan.plan_type,
          paystack_subscription_code: undefined,
          paystack_customer_code: undefined,
          next_payment_date: usageStatus.user_plan.expires_at
        } as UserPlanDetails
      }

      // For free users, return free status
      if (isFree) {
        return {
          payment_status: 'free',
          plan_type: 'free',
          paystack_subscription_code: undefined,
          paystack_customer_code: undefined
        } as UserPlanDetails
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/plans/user-plan-details', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // For non-premium users, don't throw error, return appropriate status
        return {
          payment_status: isTrial ? 'trial' : 'free',
          plan_type: usageStatus?.user_plan?.plan_type || 'free',
          paystack_subscription_code: undefined,
          paystack_customer_code: undefined
        } as UserPlanDetails
      }
      
      return response.json();
    }
  }) as { data: UserPlanDetails, isLoading: boolean }

  // Fetch payment history
  const { data: paymentHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/payment/history'],
    enabled: !!user,
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/payment/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payment history: ${response.status}`);
      }
      
      return response.json();
    }
  }) as { data: PaymentHistoryResponse, isLoading: boolean }

  const isLoading = plansLoading || planDetailsLoading || historyLoading

  // Payment method update mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/payment/update-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to create payment method update session');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Paystack payment authorization page
      if (data.authorization_url) {
        toast({
          title: "Payment Method Update",
          description: "Redirecting to secure payment page to update your card details.",
        });
        
        // Store the reference for verification when user returns
        localStorage.setItem('payment_update_reference', data.reference);
        
        // Redirect to Paystack authorization page
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received from payment processor');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to create payment method update session. Please try again.",
        variant: "destructive",
      });
    }
  })

  // Payment method verification mutation (for when user returns from Paystack)
  const verifyPaymentMethodMutation = useMutation({
    mutationFn: async (reference: string) => {
      const response = await fetch('/api/payment/verify-payment-method-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ reference })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to verify payment method update');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Remove stored reference
      localStorage.removeItem('payment_update_reference');
      
      if (data.success) {
        toast({
          title: "Payment Method Updated",
          description: "Your payment method has been updated successfully.",
        });
        
        // Refresh billing data
        queryClient.invalidateQueries({ queryKey: ['/api/plans/user-plan-details'] });
        queryClient.invalidateQueries({ queryKey: ['/api/payment/history'] });
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Payment method update was not successful.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      // Remove stored reference on error
      localStorage.removeItem('payment_update_reference');
      
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify payment method update.",
        variant: "destructive",
      });
    }
  })

  // Subscription cancellation mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/payment/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to cancel subscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCancelDialogOpen(false);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully. You can reactivate it at any time.",
      });
      
      // Refresh billing data
      queryClient.invalidateQueries({ queryKey: ['/api/plans/user-plan-details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payment/history'] });
    },
    onError: (error: any) => {
      setCancelDialogOpen(false);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  })

  // Subscription reactivation mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/payment/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to reactivate subscription');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setReactivateDialogOpen(false);
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been reactivated successfully. Welcome back!",
      });
      
      // Refresh billing data
      queryClient.invalidateQueries({ queryKey: ['/api/plans/user-plan-details'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payment/history'] });
    },
    onError: (error: any) => {
      setReactivateDialogOpen(false);
      toast({
        title: "Reactivation Failed",
        description: error.message || "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    }
  })

  // Check for payment method update completion on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const updateParam = urlParams.get('update');
    const storedReference = localStorage.getItem('payment_update_reference');
    
    if (updateParam === 'success' && storedReference) {
      // User returned from Paystack, verify the payment method update
      verifyPaymentMethodMutation.mutate(storedReference);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]update=success/, '');
      window.history.replaceState({}, '', newUrl.replace(/[?&]$/, ''));
    }
  }, [verifyPaymentMethodMutation])

  const handleRefreshBilling = async () => {
    setRefreshing(true)
    try {
      await refetch()
      // Force refresh of payment history and plan details
      window.location.reload()
    } catch (error) {
      console.error('Failed to refresh billing information:', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  const paymentStatus = planDetails?.payment_status || 'unknown'
  const statusConfig = getPaymentStatusConfig(paymentStatus)
  const StatusIcon = statusConfig.icon

  const nextPaymentDate = planDetails?.next_payment_date
  const lastPaymentDate = planDetails?.last_payment_date
  const gracePeriodEnd = planDetails?.grace_period_end
  const failedPaymentCount = planDetails?.failed_payment_count || 0

  // Calculate days until next payment or grace period end
  const daysUntilNextPayment = nextPaymentDate 
    ? Math.ceil((new Date(nextPaymentDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  const daysUntilGracePeriodEnd = gracePeriodEnd
    ? Math.ceil((new Date(gracePeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      {/* Payment Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`${statusConfig.bgColor} ${statusConfig.borderColor}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${statusConfig.color} rounded-full flex items-center justify-center`}>
                  <StatusIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className={statusConfig.textColor}>
                    Payment Status: {statusConfig.label}
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {paymentStatus === 'active' && 'Your subscription is active and up to date'}
                    {paymentStatus === 'grace_period' && `Payment overdue - ${daysUntilGracePeriodEnd} days remaining`}
                    {paymentStatus === 'suspended' && 'Account suspended due to payment failure'}
                    {paymentStatus === 'cancelled' && 'Subscription has been cancelled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Subscription Management Buttons */}
                {paymentStatus === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={cancelSubscriptionMutation.isPending}
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                    data-testid="button-cancel-subscription"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Subscription
                  </Button>
                )}
                
                {paymentStatus === 'cancelled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReactivateDialogOpen(true)}
                    disabled={reactivateSubscriptionMutation.isPending}
                    className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                    data-testid="button-reactivate-subscription"
                  >
                    {reactivateSubscriptionMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    {reactivateSubscriptionMutation.isPending ? 'Processing...' : 'Reactivate'}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshBilling}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                  data-testid="button-refresh-billing"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Grace Period Warning */}
            {paymentStatus === 'grace_period' && (
              <Alert className="mb-4 border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action Required:</strong> Your payment failed. Please update your payment method to avoid suspension.
                  {daysUntilGracePeriodEnd !== null && daysUntilGracePeriodEnd > 0 && (
                    <span className="block mt-1">
                      Grace period ends in <strong>{daysUntilGracePeriodEnd} day{daysUntilGracePeriodEnd !== 1 ? 's' : ''}</strong>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Suspension Notice */}
            {paymentStatus === 'suspended' && (
              <Alert className="mb-4 border-red-200 dark:border-red-800">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Account Suspended:</strong> Your account has been suspended due to payment failure.
                  <span className="block mt-1">
                    Please update your payment method and contact support to reactivate your account.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Payment dates grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastPaymentDate && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Payment</p>
                  <p className="text-lg font-semibold" data-testid="text-last-payment-date">{formatDate(lastPaymentDate)}</p>
                </div>
              )}
              {nextPaymentDate && paymentStatus === 'active' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Next Payment</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold" data-testid="text-next-payment-date">{formatDate(nextPaymentDate)}</p>
                    {daysUntilNextPayment !== null && (
                      <Badge variant="outline" className="text-xs">
                        {daysUntilNextPayment > 0 ? `in ${daysUntilNextPayment} days` : 'Due today'}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Failed payment count */}
            {failedPaymentCount > 0 && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>{failedPaymentCount}</strong> failed payment{failedPaymentCount !== 1 ? 's' : ''} this billing cycle
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Subscription Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Plan Type</p>
                <p className="text-lg font-semibold capitalize" data-testid="text-plan-type">
                  {planDetails?.plan_type || 'Free'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Billing Cycle</p>
                <p className="text-lg font-semibold">
                  {isTrial ? 'Trial Period' : isPremium ? 'Monthly' : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Amount</p>
                <p className="text-lg font-semibold">
                  {isTrial ? 'Free Trial' : isPremium ? 'R599.00/month' : 'Free'}
                </p>
              </div>
            </div>

            {planDetails?.paystack_subscription_code && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subscription ID</p>
                <p className="text-sm font-mono text-slate-600 dark:text-slate-400" data-testid="text-subscription-id">
                  {planDetails.paystack_subscription_code}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Method Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Managed securely by Paystack
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-update-payment-method"
                onClick={() => updatePaymentMethodMutation.mutate()}
                disabled={updatePaymentMethodMutation.isPending}
              >
                {updatePaymentMethodMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                {updatePaymentMethodMutation.isPending ? 'Processing...' : 'Update Method'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment History
              </CardTitle>
              <Button variant="outline" size="sm" data-testid="button-download-history">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paymentHistory?.transactions && paymentHistory.transactions.length > 0 ? (
              <div className="space-y-4">
                {paymentHistory.transactions.slice(0, 10).map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.status === 'success' ? 'bg-green-100 dark:bg-green-900' :
                        transaction.status === 'failed' ? 'bg-red-100 dark:bg-red-900' :
                        'bg-yellow-100 dark:bg-yellow-900'
                      }`}>
                        {transaction.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : transaction.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`transaction-amount-${transaction.id}`}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(transaction.created_at)} • {transaction.payment_method}
                        </p>
                        {transaction.failure_reason && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {transaction.failure_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {getTransactionStatusBadge(transaction.status)}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {transaction.transaction_id}
                      </p>
                    </div>
                  </motion.div>
                ))}
                
                {paymentHistory.total > 10 && (
                  <div className="text-center pt-4">
                    <Button variant="outline" size="sm">
                      View All {paymentHistory.total} Transactions
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400">No payment history available</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Payment transactions will appear here once you subscribe
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start h-auto p-4" data-testid="button-update-billing">
                <CreditCard className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Update Billing</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Change payment method</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4" data-testid="button-billing-portal">
                <ExternalLink className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Billing Portal</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Manage subscription</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto p-4" data-testid="button-download-invoices">
                <Download className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Download Invoices</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Get tax receipts</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Subscription Cancellation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? This action will:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Stop automatic billing starting from your next billing cycle
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You'll retain access to premium features until the end of your current billing period
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You can reactivate your subscription at any time
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelSubscriptionMutation.isPending}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelSubscriptionMutation.mutate()}
              disabled={cancelSubscriptionMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Reactivation Dialog */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <RotateCcw className="w-5 h-5" />
              Reactivate Subscription
            </DialogTitle>
            <DialogDescription>
              Welcome back! Reactivating your subscription will:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Restore full access to all premium features immediately
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Resume automatic billing starting from next month
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your existing payment method will be used for future billing
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReactivateDialogOpen(false)}
              disabled={reactivateSubscriptionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => reactivateSubscriptionMutation.mutate()}
              disabled={reactivateSubscriptionMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-reactivate"
            >
              {reactivateSubscriptionMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reactivating...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reactivate Subscription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}