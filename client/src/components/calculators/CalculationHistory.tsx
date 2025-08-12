import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Save, History, Trash2, Eye, Search, Calendar, FileText } from "lucide-react"
import { CalculatorHistoryService } from "@/lib/services/calculatorHistory"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import type { CalculatorHistory } from "../../../../shared/schema"

interface CalculationHistoryProps {
  calculatorType: 'cash_flow' | 'break_even' | 'business_budget'
  currentData: Record<string, any>
  onLoadCalculation: (data: Record<string, any>) => void
  className?: string
}

interface SaveCalculationDialogProps {
  calculatorType: 'cash_flow' | 'break_even' | 'business_budget'
  currentData: Record<string, any>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function SaveCalculationDialog({ 
  calculatorType, 
  currentData, 
  isOpen, 
  onOpenChange 
}: SaveCalculationDialogProps) {
  const [user, setUser] = useState<any>(null)
  const [calculationName, setCalculationName] = useState("")
  const [notes, setNotes] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getCurrentUser()
  }, [])

  const saveCalculation = useMutation({
    mutationFn: async () => {
      if (!user || !calculationName.trim()) {
        throw new Error('User not found or calculation name is empty')
      }

      return await CalculatorHistoryService.saveCalculation({
        user_id: user.id,
        calculator_type: calculatorType,
        calculation_name: calculationName.trim(),
        calculation_data: currentData,
        notes: notes.trim() || undefined
      })
    },
    onSuccess: (data) => {
      if (data) {
        toast({
          title: "Calculation Saved",
          description: `"${calculationName}" has been saved to your history.`
        })
        queryClient.invalidateQueries({ queryKey: ['calculator-history', user?.id, calculatorType] })
        setCalculationName("")
        setNotes("")
        onOpenChange(false)
      } else {
        toast({
          title: "Save Failed",
          description: "Unable to save calculation. Please try again.",
          variant: "destructive"
        })
      }
    },
    onError: (error) => {
      console.error('Save calculation error:', error)
      toast({
        title: "Save Failed",
        description: "Unable to save calculation. Please try again.",
        variant: "destructive"
      })
    }
  })

  const handleSave = () => {
    if (!calculationName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this calculation.",
        variant: "destructive"
      })
      return
    }
    saveCalculation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Calculation</DialogTitle>
          <DialogDescription>
            Save this calculation to access it later or compare different scenarios.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="calculation-name">Calculation Name</Label>
            <Input
              id="calculation-name"
              placeholder="e.g., Conservative Scenario, Q2 Budget"
              value={calculationName}
              onChange={(e) => setCalculationName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="calculation-notes">Notes (Optional)</Label>
            <Textarea
              id="calculation-notes"
              placeholder="Add any notes about this calculation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={saveCalculation.isPending || !calculationName.trim()}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveCalculation.isPending ? 'Saving...' : 'Save Calculation'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CalculationHistory({ 
  calculatorType, 
  currentData, 
  onLoadCalculation, 
  className = "" 
}: CalculationHistoryProps) {
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getCurrentUser()
  }, [])

  // Fetch calculation history
  const { data: calculations = [], isLoading } = useQuery({
    queryKey: ['calculator-history', user?.id, calculatorType],
    queryFn: () => user ? CalculatorHistoryService.getCalculationHistory(user.id, calculatorType) : [],
    enabled: !!user,
  })

  // Delete calculation mutation
  const deleteCalculation = useMutation({
    mutationFn: (id: string) => CalculatorHistoryService.deleteCalculation(id),
    onSuccess: (success, id) => {
      if (success) {
        toast({
          title: "Calculation Deleted",
          description: "Calculation has been removed from your history."
        })
        queryClient.invalidateQueries({ queryKey: ['calculator-history', user?.id, calculatorType] })
      } else {
        toast({
          title: "Delete Failed",
          description: "Unable to delete calculation. Please try again.",
          variant: "destructive"
        })
      }
    }
  })

  // Filter calculations based on search
  const filteredCalculations = calculations.filter(calc =>
    calc.calculation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (calc.notes && calc.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleLoadCalculation = (calculation: CalculatorHistory) => {
    onLoadCalculation(calculation.calculation_data)
    toast({
      title: "Calculation Loaded",
      description: `"${calculation.calculation_name}" has been loaded.`
    })
  }

  const getCalculatorDisplayName = (type: string) => {
    switch (type) {
      case 'cash_flow': return 'Cash Flow'
      case 'break_even': return 'Break-Even'
      case 'business_budget': return 'Business Budget'
      default: return type
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Saved Calculations
          </h3>
        </div>
        <Button 
          onClick={() => setShowSaveDialog(true)}
          size="sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Current
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Search saved calculations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-slate-500 mt-2">Loading calculations...</p>
        </div>
      )}

      {/* Calculations List */}
      {!isLoading && (
        <AnimatePresence>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCalculations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    {searchTerm ? 'No calculations match your search.' : 'No saved calculations yet.'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Save your first calculation to start building your history.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCalculations.map((calculation) => (
                <motion.div
                  key={calculation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {calculation.calculation_name}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {getCalculatorDisplayName(calculation.calculator_type)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(calculation.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                          {calculation.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                              {calculation.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadCalculation(calculation)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Load
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Calculation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{calculation.calculation_name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteCalculation.mutate(calculation.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </AnimatePresence>
      )}

      {/* Save Dialog */}
      <SaveCalculationDialog
        calculatorType={calculatorType}
        currentData={currentData}
        isOpen={showSaveDialog}
        onOpenChange={setShowSaveDialog}
      />
    </div>
  )
}