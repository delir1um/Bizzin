import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Crown, Zap, FileText, Target, BookOpen, Calculator } from "lucide-react"
import { PlansService } from "@/lib/services/plans"
import { useToast } from "@/hooks/use-toast"

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function UpgradeModal({ isOpen, onClose, userId }: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const upgradeMutation = useMutation({
    mutationFn: () => PlansService.upgradeToPremium(userId),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['user-plan'] })
        queryClient.invalidateQueries({ queryKey: ['usage-status'] })
        toast({
          title: "Upgraded to Premium!",
          description: "You now have access to all premium features.",
        })
        onClose()
      } else {
        toast({
          title: "Upgrade failed",
          description: "Please try again or contact support.",
          variant: "destructive",
        })
      }
      setIsUpgrading(false)
    },
    onError: () => {
      toast({
        title: "Upgrade failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      })
      setIsUpgrading(false)
    }
  })

  const handleUpgrade = () => {
    setIsUpgrading(true)
    upgradeMutation.mutate()
  }

  const features = [
    {
      icon: FileText,
      title: "Unlimited Document Storage",
      free: "500MB / 20 documents per month",
      premium: "10GB / Unlimited uploads"
    },
    {
      icon: BookOpen,
      title: "Journal Entries",
      free: "10 entries per month",
      premium: "Unlimited entries with rich formatting"
    },
    {
      icon: Target,
      title: "Goal Management",
      free: "5 active goals",
      premium: "Unlimited goals with advanced features"
    },
    {
      icon: Calculator,
      title: "BizBuilder Tools",
      free: "3 calculations per day",
      premium: "Unlimited use with PDF reports"
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-6 h-6 text-orange-600" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Unlock the full potential of your business planning with premium features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free Plan */}
            <Card className="border-slate-200 dark:border-slate-700">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg">Free Plan</CardTitle>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Current plan</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  500MB storage
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  20 documents/month
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  10 journal entries/month
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  5 active goals
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-orange-500 relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white">
                Recommended
              </Badge>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg flex items-center justify-center gap-2">
                  <Crown className="w-5 h-5 text-orange-600" />
                  Premium Plan
                </CardTitle>
                <div className="text-2xl font-bold">$9.99</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">per month</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  10GB storage
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  Unlimited documents
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  Unlimited journal entries
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  Unlimited goals
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  Priority support
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Feature Comparison</h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <feature.icon className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">{feature.title}</h4>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      <div>Free: {feature.free}</div>
                      <div className="text-orange-600 font-medium">Premium: {feature.premium}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isUpgrading}
          >
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isUpgrading ? (
              "Upgrading..."
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}