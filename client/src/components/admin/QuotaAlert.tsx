import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from 'lucide-react'

interface QuotaAlertProps {
  requestsToday: number
  errorRate: number
  fallbackActive: boolean
}

export function QuotaAlert({ requestsToday, errorRate, fallbackActive }: QuotaAlertProps) {
  // Alert thresholds
  const HIGH_USAGE_THRESHOLD = 800 // Daily request threshold
  const HIGH_ERROR_RATE = 10 // Error rate percentage
  
  if (fallbackActive) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>API Quota Exceeded:</strong> Fallback mode is active. Users are receiving simplified analysis. 
          Consider upgrading to Hugging Face PRO ($9/month) for 20× more credits to restore full AI functionality.
        </AlertDescription>
      </Alert>
    )
  }
  
  if (requestsToday > HIGH_USAGE_THRESHOLD) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>High API Usage:</strong> {requestsToday} requests today. Approaching potential quota limits. 
          Monitor usage closely and consider upgrading if limits are reached.
        </AlertDescription>
      </Alert>
    )
  }
  
  if (errorRate > HIGH_ERROR_RATE) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>High Error Rate:</strong> {errorRate}% of requests failing. This may indicate API issues or quota concerns.
        </AlertDescription>
      </Alert>
    )
  }
  
  return null
}