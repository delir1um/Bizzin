import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PaystackUpgrade } from "./PaystackUpgrade"
import { useAuth } from "@/hooks/AuthProvider"
import { AlertTriangle, LogOut } from "lucide-react"

interface TrialExpiredModalProps {
  isOpen: boolean
  trialEndDate?: string
}

export function TrialExpiredModal({ isOpen, trialEndDate }: TrialExpiredModalProps) {
  const { signOut } = useAuth()

  const formatDate = (dateString?: string) => {
    if (!dateString) return "recently"
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return "recently"
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={() => {}} // Disable close on overlay click or escape
    >
      <AlertDialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()} // Disable escape key
        onPointerDownOutside={(e) => e.preventDefault()} // Disable outside click
        data-testid="modal-trial-expired"
      >
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-2xl text-red-600 dark:text-red-400">
            Your Trial Has Expired
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg">
            Your free trial ended on {formatDate(trialEndDate)}. To continue using all features, 
            please upgrade to Premium or sign out of your account.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6">
          <PaystackUpgrade />
        </div>

        <AlertDialogFooter className="flex flex-col sm:flex-col gap-3">
          <div className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-t">
            <div className="text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don't want to upgrade right now?
              </p>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                data-testid="button-sign-out"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can sign back in anytime to upgrade and access your data
              </p>
            </div>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}