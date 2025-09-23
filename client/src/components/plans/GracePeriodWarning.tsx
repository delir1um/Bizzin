import { AlertTriangle, CreditCard, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePlans } from "@/hooks/usePlans";

interface GracePeriodWarningProps {
  className?: string;
  onUpgradeClick?: () => void;
}

export function GracePeriodWarning({ className, onUpgradeClick }: GracePeriodWarningProps) {
  const { isInGracePeriod, gracePeriodDaysRemaining, isSuspended } = usePlans();

  // Don't show if user is not in grace period and not suspended
  if (!isInGracePeriod && !isSuspended) {
    return null;
  }

  // Suspended account warning
  if (isSuspended) {
    return (
      <Alert className={`border-red-500 bg-red-50 dark:bg-red-950/20 ${className}`} data-testid="alert-suspended">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-800 dark:text-red-300">
          Account Suspended
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-400">
          <div className="space-y-2">
            <p>
              Your account has been suspended due to payment issues. You no longer have access to premium features.
            </p>
            <p className="text-sm">
              <strong>To reactivate your account:</strong> Update your payment method and contact support.
            </p>
            {onUpgradeClick && (
              <Button 
                size="sm" 
                className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={onUpgradeClick}
                data-testid="button-reactivate"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Reactivate Account
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Grace period warning
  const urgencyLevel = gracePeriodDaysRemaining <= 2 ? 'urgent' : gracePeriodDaysRemaining <= 5 ? 'warning' : 'info';
  const alertStyles = {
    urgent: 'border-red-500 bg-red-50 dark:bg-red-950/20',
    warning: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
  };

  const iconStyles = {
    urgent: 'text-red-600 dark:text-red-400',
    warning: 'text-orange-600 dark:text-orange-400',
    info: 'text-blue-600 dark:text-blue-400'
  };

  const textStyles = {
    urgent: 'text-red-800 dark:text-red-300',
    warning: 'text-orange-800 dark:text-orange-300',
    info: 'text-blue-800 dark:text-blue-300'
  };

  const descriptionStyles = {
    urgent: 'text-red-700 dark:text-red-400',
    warning: 'text-orange-700 dark:text-orange-400',
    info: 'text-blue-700 dark:text-blue-400'
  };

  return (
    <Alert className={`${alertStyles[urgencyLevel]} ${className}`} data-testid="alert-grace-period">
      <Clock className={`h-4 w-4 ${iconStyles[urgencyLevel]}`} />
      <AlertTitle className={textStyles[urgencyLevel]}>
        Payment Issue - Grace Period Active
      </AlertTitle>
      <AlertDescription className={descriptionStyles[urgencyLevel]}>
        <div className="space-y-2">
          <p>
            We couldn't process your payment, but you still have access to premium features for{' '}
            <strong data-testid="text-days-remaining">
              {gracePeriodDaysRemaining} {gracePeriodDaysRemaining === 1 ? 'day' : 'days'}
            </strong>.
          </p>
          
          {gracePeriodDaysRemaining <= 2 && (
            <p className="font-medium">
              ⚠️ Your access will be suspended soon! Please update your payment method immediately.
            </p>
          )}
          
          <p className="text-sm">
            <strong>What you need to do:</strong> Update your payment method or contact your bank if the payment was declined.
          </p>
          
          {onUpgradeClick && (
            <Button 
              size="sm" 
              className={`mt-2 ${
                urgencyLevel === 'urgent' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : urgencyLevel === 'warning'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              onClick={onUpgradeClick}
              data-testid="button-update-payment"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Update Payment Method
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}