import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PaystackUpgrade } from "./PaystackUpgrade"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: 'free' | 'premium'
}

export function UpgradeModal({ isOpen, onClose, currentPlan = 'free' }: UpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Upgrade Your Business Journey
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose the perfect plan to unlock your business potential
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <PaystackUpgrade />
        </div>

        <div className="text-center pt-4 border-t">
          <Button variant="ghost" onClick={onClose} className="text-slate-600 hover:text-slate-900">
            I'll upgrade later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}