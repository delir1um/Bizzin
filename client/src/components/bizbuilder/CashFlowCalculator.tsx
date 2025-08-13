import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
// Dialog components removed - using custom modal instead
import { X, Download, TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar, Plus, History } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import { CalculationHistory } from "@/components/calculators/CalculationHistory"

interface CashFlowData {
  startingCash: number
  projectionMonths: number
  inflows: CashFlowItem[]
  outflows: CashFlowItem[]
  notes: string
}

interface CashFlowItem {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time'
  startMonth: number
  category: string
}

const inflowCategories = [
  'Sales Revenue',
  'Service Income',
  'Investment Income',
  'Loan/Financing',
  'Asset Sales',
  'Other Income'
]

const outflowCategories = [
  'Cost of Goods Sold',
  'Salaries & Wages',
  'Rent & Utilities',
  'Marketing & Advertising',
  'Equipment & Software',
  'Loan Payments',
  'Insurance',
  'Professional Services',
  'Taxes',
  'Other Expenses'
]

const COLORS = ['#EA7A57', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

export default function CashFlowCalculator({ onClose }: { onClose: () => void }) {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData>({
    startingCash: 0,
    projectionMonths: 12,
    inflows: [],
    outflows: [],
    notes: ''
  })

  const [newInflow, setNewInflow] = useState<Partial<CashFlowItem>>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    startMonth: 1,
    category: ''
  })

  const [newOutflow, setNewOutflow] = useState<Partial<CashFlowItem>>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    startMonth: 1,
    category: ''
  })

  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({})
  const [activeTab, setActiveTab] = useState('setup')

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cashFlowCalculator')
    if (saved) {
      try {
        setCashFlowData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved data:', error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cashFlowCalculator', JSON.stringify(cashFlowData))
  }, [cashFlowData])

  // Calculate monthly cash flow projections
  const generateCashFlowProjection = () => {
    const projection = []
    let runningBalance = cashFlowData.startingCash

    for (let month = 1; month <= cashFlowData.projectionMonths; month++) {
      let monthlyInflows = 0
      let monthlyOutflows = 0

      // Calculate inflows for this month
      cashFlowData.inflows.forEach(inflow => {
        if (shouldIncludeInMonth(inflow, month)) {
          monthlyInflows += inflow.amount
        }
      })

      // Calculate outflows for this month
      cashFlowData.outflows.forEach(outflow => {
        if (shouldIncludeInMonth(outflow, month)) {
          monthlyOutflows += outflow.amount
        }
      })

      const netCashFlow = monthlyInflows - monthlyOutflows
      runningBalance += netCashFlow

      projection.push({
        month,
        monthName: getMonthName(month),
        inflows: monthlyInflows,
        outflows: monthlyOutflows,
        netCashFlow,
        runningBalance,
        isNegative: runningBalance < 0
      })
    }

    return projection
  }

  // Helper function to determine if an item should be included in a specific month
  const shouldIncludeInMonth = (item: CashFlowItem, month: number): boolean => {
    if (month < item.startMonth) return false

    switch (item.frequency) {
      case 'monthly':
        return true
      case 'quarterly':
        return (month - item.startMonth) % 3 === 0
      case 'annually':
        return (month - item.startMonth) % 12 === 0
      case 'one-time':
        return month === item.startMonth
      default:
        return false
    }
  }

  // Helper function to get month name
  const getMonthName = (month: number): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    return months[(currentMonth + month - 1) % 12]
  }

  // Validation for adding inflows
  const addInflow = () => {
    const errors: {[key: string]: boolean} = {}
    
    if (!newInflow.name?.trim()) errors.inflowName = true
    if (!newInflow.amount || newInflow.amount <= 0) errors.inflowAmount = true
    if (!newInflow.category) errors.inflowCategory = true
    if (!newInflow.startMonth || newInflow.startMonth < 1 || newInflow.startMonth > cashFlowData.projectionMonths) errors.inflowStartMonth = true
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    const inflow: CashFlowItem = {
      id: Date.now().toString(),
      name: newInflow.name!,
      amount: newInflow.amount!,
      frequency: newInflow.frequency!,
      startMonth: newInflow.startMonth!,
      category: newInflow.category!
    }
    
    setCashFlowData(prev => ({ ...prev, inflows: [...prev.inflows, inflow] }))
    setNewInflow({ name: '', amount: 0, frequency: 'monthly', startMonth: 1, category: '' })
    setValidationErrors({})
  }

  // Validation for adding outflows
  const addOutflow = () => {
    const errors: {[key: string]: boolean} = {}
    
    if (!newOutflow.name?.trim()) errors.outflowName = true
    if (!newOutflow.amount || newOutflow.amount <= 0) errors.outflowAmount = true
    if (!newOutflow.category) errors.outflowCategory = true
    if (!newOutflow.startMonth || newOutflow.startMonth < 1 || newOutflow.startMonth > cashFlowData.projectionMonths) errors.outflowStartMonth = true
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    const outflow: CashFlowItem = {
      id: Date.now().toString(),
      name: newOutflow.name!,
      amount: newOutflow.amount!,
      frequency: newOutflow.frequency!,
      startMonth: newOutflow.startMonth!,
      category: newOutflow.category!
    }
    
    setCashFlowData(prev => ({ ...prev, outflows: [...prev.outflows, outflow] }))
    setNewOutflow({ name: '', amount: 0, frequency: 'monthly', startMonth: 1, category: '' })
    setValidationErrors({})
  }

  const removeInflow = (id: string) => {
    setCashFlowData(prev => ({ 
      ...prev, 
      inflows: prev.inflows.filter(item => item.id !== id) 
    }))
  }

  const removeOutflow = (id: string) => {
    setCashFlowData(prev => ({ 
      ...prev, 
      outflows: prev.outflows.filter(item => item.id !== id) 
    }))
  }

  const projection = generateCashFlowProjection()
  const hasNegativeBalance = projection.some(month => month.runningBalance < 0)
  const lowestBalance = Math.min(...projection.map(month => month.runningBalance))
  const highestBalance = Math.max(...projection.map(month => month.runningBalance))

  // Export to CSV
  const exportToCSV = () => {
    const csvData = []
    
    // Header information
    csvData.push(['CASH FLOW PROJECTION REPORT'])
    csvData.push(['Generated on:', new Date().toLocaleDateString()])

    csvData.push(['Starting Cash Balance:', `R${cashFlowData.startingCash.toLocaleString()}`])
    csvData.push(['Projection Period:', `${cashFlowData.projectionMonths} months`])
    csvData.push([]) // Empty row
    
    // Monthly projections
    csvData.push(['MONTHLY CASH FLOW PROJECTIONS'])
    csvData.push(['Month', 'Cash Inflows', 'Cash Outflows', 'Net Cash Flow', 'Running Balance'])
    projection.forEach(month => {
      csvData.push([
        month.monthName,
        `R${month.inflows.toLocaleString()}`,
        `R${month.outflows.toLocaleString()}`,
        `R${month.netCashFlow.toLocaleString()}`,
        `R${month.runningBalance.toLocaleString()}`
      ])
    })
    csvData.push([]) // Empty row
    
    // Summary metrics
    csvData.push(['SUMMARY METRICS'])
    csvData.push(['Highest Balance:', `R${highestBalance.toLocaleString()}`])
    csvData.push(['Lowest Balance:', `R${lowestBalance.toLocaleString()}`])
    csvData.push(['Cash Flow Risk:', hasNegativeBalance ? 'HIGH - Negative balance predicted' : 'LOW - Positive cash flow maintained'])
    csvData.push([]) // Empty row
    
    // Inflows breakdown
    csvData.push(['CASH INFLOWS'])
    csvData.push(['Item Name', 'Category', 'Amount', 'Frequency', 'Start Month'])
    cashFlowData.inflows.forEach(inflow => {
      csvData.push([inflow.name, inflow.category, `R${inflow.amount.toLocaleString()}`, inflow.frequency, inflow.startMonth])
    })
    csvData.push([]) // Empty row
    
    // Outflows breakdown
    csvData.push(['CASH OUTFLOWS'])
    csvData.push(['Item Name', 'Category', 'Amount', 'Frequency', 'Start Month'])
    cashFlowData.outflows.forEach(outflow => {
      csvData.push([outflow.name, outflow.category, `R${outflow.amount.toLocaleString()}`, outflow.frequency, outflow.startMonth])
    })
    
    // Add notes if present
    if (cashFlowData.notes.trim()) {
      csvData.push([]) // Empty row
      csvData.push(['NOTES'])
      csvData.push([cashFlowData.notes])
    }
    
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cashflow-projection-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetTool = () => {
    setCashFlowData({
      startingCash: 0,
      projectionMonths: 12,
      inflows: [],
      outflows: [],
      notes: ''
    })
    setValidationErrors({})
    setActiveTab('setup')
  }

  const loadCalculation = (data: Record<string, any>) => {
    setCashFlowData(data as CashFlowData)
    setActiveTab('setup')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-7xl max-h-[95vh] overflow-hidden mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cash Flow Projection Calculator</h2>
            <p className="text-slate-600 dark:text-slate-300">Project your business cash flow and identify potential shortfalls</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Input */}
          <div className="lg:w-1/2 border-r border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="inflows">Inflows</TabsTrigger>
                <TabsTrigger value="outflows">Outflows</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4">
                {/* Business Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Cash Flow Setup</CardTitle>
                    <CardDescription>Configure your cash flow projection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Starting Cash Balance (R)</Label>
                      <Input
                        type="number"
                        value={cashFlowData.startingCash}
                        onChange={(e) => setCashFlowData(prev => ({ ...prev, startingCash: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Projection Period (Months)</Label>
                      <Select
                        value={cashFlowData.projectionMonths.toString()}
                        onValueChange={(value) => setCashFlowData(prev => ({ ...prev, projectionMonths: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                          <SelectItem value="18">18 months</SelectItem>
                          <SelectItem value="24">24 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inflows" className="space-y-4">
                {/* Add Cash Inflow */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-600" />
                      Add Cash Inflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={validationErrors.inflowName ? 'text-red-600' : ''}>Income Name *</Label>
                        <Input
                          value={newInflow.name}
                          onChange={(e) => {
                            setNewInflow(prev => ({ ...prev, name: e.target.value }))
                            if (validationErrors.inflowName) {
                              setValidationErrors(prev => ({ ...prev, inflowName: false }))
                            }
                          }}
                          placeholder="e.g., Product Sales"
                          className={validationErrors.inflowName ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {validationErrors.inflowName && <p className="text-sm text-red-600 mt-1">Income name is required</p>}
                      </div>
                      <div>
                        <Label className={validationErrors.inflowAmount ? 'text-red-600' : ''}>Amount (R) *</Label>
                        <Input
                          type="number"
                          value={newInflow.amount}
                          onChange={(e) => {
                            setNewInflow(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                            if (validationErrors.inflowAmount) {
                              setValidationErrors(prev => ({ ...prev, inflowAmount: false }))
                            }
                          }}
                          placeholder="0.00"
                          step="0.01"
                          className={validationErrors.inflowAmount ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {validationErrors.inflowAmount && <p className="text-sm text-red-600 mt-1">Amount must be greater than 0</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={validationErrors.inflowCategory ? 'text-red-600' : ''}>Category *</Label>
                        <Select
                          value={newInflow.category}
                          onValueChange={(value) => {
                            setNewInflow(prev => ({ ...prev, category: value }))
                            if (validationErrors.inflowCategory) {
                              setValidationErrors(prev => ({ ...prev, inflowCategory: false }))
                            }
                          }}>
                          <SelectTrigger className={validationErrors.inflowCategory ? 'border-red-500 focus:border-red-500' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {inflowCategories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.inflowCategory && <p className="text-sm text-red-600 mt-1">Please select a category</p>}
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={newInflow.frequency}
                          onValueChange={(value: any) => setNewInflow(prev => ({ ...prev, frequency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className={validationErrors.inflowStartMonth ? 'text-red-600' : ''}>Start Month *</Label>
                      <Input
                        type="number"
                        value={newInflow.startMonth}
                        onChange={(e) => {
                          setNewInflow(prev => ({ ...prev, startMonth: parseInt(e.target.value) || 1 }))
                          if (validationErrors.inflowStartMonth) {
                            setValidationErrors(prev => ({ ...prev, inflowStartMonth: false }))
                          }
                        }}
                        placeholder="1"
                        min="1"
                        max={cashFlowData.projectionMonths}
                        className={validationErrors.inflowStartMonth ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {validationErrors.inflowStartMonth && <p className="text-sm text-red-600 mt-1">Start month must be between 1 and {cashFlowData.projectionMonths}</p>}
                    </div>
                    <Button onClick={addInflow} className="w-full bg-green-600 hover:bg-green-700">
                      Add Cash Inflow
                    </Button>
                  </CardContent>
                </Card>

                {/* Inflows List */}
                <div className="space-y-2">
                  {cashFlowData.inflows.map(inflow => (
                    <Card key={inflow.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{inflow.name}</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">{inflow.category}</Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            R{inflow.amount.toLocaleString()} • {inflow.frequency} • starts month {inflow.startMonth}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeInflow(inflow.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="outflows" className="space-y-4">
                {/* Add Cash Outflow */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-red-600" />
                      Add Cash Outflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={validationErrors.outflowName ? 'text-red-600' : ''}>Expense Name *</Label>
                        <Input
                          value={newOutflow.name}
                          onChange={(e) => {
                            setNewOutflow(prev => ({ ...prev, name: e.target.value }))
                            if (validationErrors.outflowName) {
                              setValidationErrors(prev => ({ ...prev, outflowName: false }))
                            }
                          }}
                          placeholder="e.g., Office Rent"
                          className={validationErrors.outflowName ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {validationErrors.outflowName && <p className="text-sm text-red-600 mt-1">Expense name is required</p>}
                      </div>
                      <div>
                        <Label className={validationErrors.outflowAmount ? 'text-red-600' : ''}>Amount (R) *</Label>
                        <Input
                          type="number"
                          value={newOutflow.amount}
                          onChange={(e) => {
                            setNewOutflow(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                            if (validationErrors.outflowAmount) {
                              setValidationErrors(prev => ({ ...prev, outflowAmount: false }))
                            }
                          }}
                          placeholder="0.00"
                          step="0.01"
                          className={validationErrors.outflowAmount ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {validationErrors.outflowAmount && <p className="text-sm text-red-600 mt-1">Amount must be greater than 0</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={validationErrors.outflowCategory ? 'text-red-600' : ''}>Category *</Label>
                        <Select
                          value={newOutflow.category}
                          onValueChange={(value) => {
                            setNewOutflow(prev => ({ ...prev, category: value }))
                            if (validationErrors.outflowCategory) {
                              setValidationErrors(prev => ({ ...prev, outflowCategory: false }))
                            }
                          }}>
                          <SelectTrigger className={validationErrors.outflowCategory ? 'border-red-500 focus:border-red-500' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {outflowCategories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.outflowCategory && <p className="text-sm text-red-600 mt-1">Please select a category</p>}
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select
                          value={newOutflow.frequency}
                          onValueChange={(value: any) => setNewOutflow(prev => ({ ...prev, frequency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className={validationErrors.outflowStartMonth ? 'text-red-600' : ''}>Start Month *</Label>
                      <Input
                        type="number"
                        value={newOutflow.startMonth}
                        onChange={(e) => {
                          setNewOutflow(prev => ({ ...prev, startMonth: parseInt(e.target.value) || 1 }))
                          if (validationErrors.outflowStartMonth) {
                            setValidationErrors(prev => ({ ...prev, outflowStartMonth: false }))
                          }
                        }}
                        placeholder="1"
                        min="1"
                        max={cashFlowData.projectionMonths}
                        className={validationErrors.outflowStartMonth ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {validationErrors.outflowStartMonth && <p className="text-sm text-red-600 mt-1">Start month must be between 1 and {cashFlowData.projectionMonths}</p>}
                    </div>
                    <Button onClick={addOutflow} className="w-full bg-red-600 hover:bg-red-700">
                      Add Cash Outflow
                    </Button>
                  </CardContent>
                </Card>

                {/* Outflows List */}
                <div className="space-y-2">
                  {cashFlowData.outflows.map(outflow => (
                    <Card key={outflow.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="font-medium">{outflow.name}</span>
                            <Badge variant="secondary" className="bg-red-100 text-red-800">{outflow.category}</Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            R{outflow.amount.toLocaleString()} • {outflow.frequency} • starts month {outflow.startMonth}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeOutflow(outflow.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                {/* Notes */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Notes & Assumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={cashFlowData.notes}
                      onChange={(e) => setCashFlowData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes about seasonal variations, assumptions, or other important details..."
                      rows={8}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <CalculationHistory
                  calculatorType="cash_flow"
                  currentData={cashFlowData}
                  onLoadCalculation={loadCalculation}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            {/* Key Metrics */}
            {projection.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      R{highestBalance.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">Highest Balance</p>
                  </Card>
                  <Card className={`p-4 text-center ${lowestBalance < 0 ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20' : 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'}`}>
                    <TrendingDown className={`w-8 h-8 mx-auto mb-2 ${lowestBalance < 0 ? 'text-red-600' : 'text-blue-600'}`} />
                    <p className={`text-2xl font-bold ${lowestBalance < 0 ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'}`}>
                      R{lowestBalance.toLocaleString()}
                    </p>
                    <p className={`text-sm ${lowestBalance < 0 ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-blue-300'}`}>Lowest Balance</p>
                  </Card>
                  <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                    <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                      {cashFlowData.projectionMonths}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">Months Projected</p>
                  </Card>
                </div>

                {/* Cash Flow Risk Alert */}
                {hasNegativeBalance && (
                  <Card className="mb-6 border-red-300 bg-red-50 dark:bg-red-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <div>
                          <h4 className="font-semibold text-red-800 dark:text-red-200">Cash Flow Risk Detected</h4>
                          <p className="text-sm text-red-600 dark:text-red-300">
                            Your projection shows negative cash balance in some months. Consider adjusting inflows, reducing outflows, or securing additional financing.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cash Flow Chart */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Monthly Cash Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={projection}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthName" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                        <Legend />
                        <Line type="monotone" dataKey="inflows" stroke="#10B981" name="Cash Inflows" strokeWidth={2} />
                        <Line type="monotone" dataKey="outflows" stroke="#EF4444" name="Cash Outflows" strokeWidth={2} />
                        <Line type="monotone" dataKey="runningBalance" stroke="#3B82F6" name="Running Balance" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Net Cash Flow Chart */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Net Cash Flow by Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={projection}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthName" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, 'Net Cash Flow']} />
                        <Bar dataKey="netCashFlow" fill="#EA7A57" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Validation Messages */}
            {(cashFlowData.inflows.length === 0 || cashFlowData.outflows.length === 0) && (
              <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Complete Your Cash Flow Setup</h3>
                  <div className="text-sm text-amber-600 dark:text-amber-300 space-y-1">
                    {cashFlowData.inflows.length === 0 && (
                      <p className="text-red-600">• Add at least one cash inflow</p>
                    )}
                    {cashFlowData.outflows.length === 0 && (
                      <p className="text-red-600">• Add at least one cash outflow</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={exportToCSV} className="bg-orange-600 hover:bg-orange-700" disabled={projection.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    Reset Calculator
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to reset?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all your cash flow projection data including inflows, outflows, and notes. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={resetTool}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                      Yes, Reset All Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}