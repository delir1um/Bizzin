import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { X, Plus, Download, TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts"

interface CashFlowItem {
  id: string
  name: string
  amount: number
  type: 'inflow' | 'outflow'
  category: string
  startMonth: number
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time'
  growth: number // percentage growth per period
}

interface CashFlowData {
  items: CashFlowItem[]
  startingBalance: number
  businessName: string
  projectionMonths: number
  notes: string
}

const inflowCategories = [
  'Product Sales',
  'Service Revenue',
  'Subscription Revenue',
  'Consulting',
  'Licensing',
  'Investment',
  'Loan/Funding',
  'Other Income'
]

const outflowCategories = [
  'Rent & Utilities',
  'Salaries & Benefits',
  'Marketing & Advertising',
  'Inventory/Materials',
  'Equipment Purchase',
  'Software & Tools',
  'Loan Payments',
  'Tax Payments',
  'Other Expenses'
]

const COLORS = ['#EA7A57', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444']

interface CashFlowProjectionToolProps {
  onClose: () => void
}

export function CashFlowProjectionTool({ onClose }: CashFlowProjectionToolProps) {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData>({
    items: [],
    startingBalance: 0,
    businessName: '',
    projectionMonths: 12,
    notes: ''
  })

  const [activeTab, setActiveTab] = useState('setup')
  const [newItem, setNewItem] = useState<Partial<CashFlowItem>>({
    name: '',
    amount: 0,
    type: 'inflow',
    category: '',
    startMonth: 1,
    frequency: 'monthly',
    growth: 0
  })
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({})
  const [showResetDialog, setShowResetDialog] = useState(false)

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cashFlowProjectionTool')
    if (saved) {
      try {
        setCashFlowData(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load saved cash flow data')
      }
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('cashFlowProjectionTool', JSON.stringify(cashFlowData))
  }, [cashFlowData])

  // Calculate cash flow projection
  const calculateProjection = () => {
    const projection = []
    let runningBalance = cashFlowData.startingBalance

    for (let month = 1; month <= cashFlowData.projectionMonths; month++) {
      let monthlyInflow = 0
      let monthlyOutflow = 0

      cashFlowData.items.forEach(item => {
        if (month < item.startMonth) return

        let shouldInclude = false
        const monthsSinceStart = month - item.startMonth

        switch (item.frequency) {
          case 'monthly':
            shouldInclude = true
            break
          case 'quarterly':
            shouldInclude = monthsSinceStart % 3 === 0
            break
          case 'annually':
            shouldInclude = monthsSinceStart % 12 === 0
            break
          case 'one-time':
            shouldInclude = month === item.startMonth
            break
        }

        if (shouldInclude) {
          const growthMultiplier = Math.pow(1 + item.growth / 100, Math.floor(monthsSinceStart / (item.frequency === 'monthly' ? 1 : item.frequency === 'quarterly' ? 3 : 12)))
          const adjustedAmount = item.amount * growthMultiplier

          if (item.type === 'inflow') {
            monthlyInflow += adjustedAmount
          } else {
            monthlyOutflow += adjustedAmount
          }
        }
      })

      const netCashFlow = monthlyInflow - monthlyOutflow
      runningBalance += netCashFlow

      projection.push({
        month,
        monthName: new Date(2024, month - 1).toLocaleString('default', { month: 'short' }),
        inflow: monthlyInflow,
        outflow: monthlyOutflow,
        netCashFlow,
        runningBalance,
        isNegative: runningBalance < 0
      })
    }

    return projection
  }

  const projection = calculateProjection()
  const totalInflow = projection.reduce((sum, month) => sum + month.inflow, 0)
  const totalOutflow = projection.reduce((sum, month) => sum + month.outflow, 0)
  const finalBalance = projection[projection.length - 1]?.runningBalance || cashFlowData.startingBalance
  const negativeMonths = projection.filter(month => month.runningBalance < 0).length
  const lowestBalance = Math.min(...projection.map(p => p.runningBalance))

  const addItem = () => {
    const errors: {[key: string]: boolean} = {}
    
    if (!newItem.name?.trim()) errors.name = true
    if (!newItem.amount || newItem.amount <= 0) errors.amount = true
    if (!newItem.category) errors.category = true
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    const item: CashFlowItem = {
      id: Date.now().toString(),
      name: newItem.name!,
      amount: newItem.amount!,
      type: newItem.type || 'inflow',
      category: newItem.category!,
      startMonth: newItem.startMonth || 1,
      frequency: newItem.frequency || 'monthly',
      growth: newItem.growth || 0
    }
    
    setCashFlowData(prev => ({ ...prev, items: [...prev.items, item] }))
    setNewItem({ name: '', amount: 0, type: 'inflow', category: '', startMonth: 1, frequency: 'monthly', growth: 0 })
    setValidationErrors({})
  }

  const removeItem = (id: string) => {
    setCashFlowData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }))
  }

  const exportToCSV = () => {
    const csvData = []
    
    // Header
    csvData.push(['Cash Flow Projection Report'])
    csvData.push(['Business Name:', cashFlowData.businessName || 'N/A'])
    csvData.push(['Projection Period:', `${cashFlowData.projectionMonths} months`])
    csvData.push(['Starting Balance:', `R${cashFlowData.startingBalance.toLocaleString()}`])
    csvData.push(['Generated:', new Date().toLocaleDateString()])
    csvData.push([]) // Empty row
    
    // Summary
    csvData.push(['PROJECTION SUMMARY'])
    csvData.push(['Total Projected Inflow:', `R${totalInflow.toLocaleString()}`])
    csvData.push(['Total Projected Outflow:', `R${totalOutflow.toLocaleString()}`])
    csvData.push(['Final Balance:', `R${finalBalance.toLocaleString()}`])
    csvData.push(['Lowest Balance:', `R${lowestBalance.toLocaleString()}`])
    csvData.push(['Months with Negative Balance:', negativeMonths])
    csvData.push([]) // Empty row
    
    // Monthly Projection
    csvData.push(['MONTHLY CASH FLOW PROJECTION'])
    csvData.push(['Month', 'Month Name', 'Inflow', 'Outflow', 'Net Cash Flow', 'Running Balance'])
    projection.forEach(month => {
      csvData.push([
        month.month,
        month.monthName,
        `R${month.inflow.toLocaleString()}`,
        `R${month.outflow.toLocaleString()}`,
        `R${month.netCashFlow.toLocaleString()}`,
        `R${month.runningBalance.toLocaleString()}`
      ])
    })
    csvData.push([]) // Empty row
    
    // Cash Flow Items
    csvData.push(['CASH FLOW ITEMS'])
    csvData.push(['Name', 'Type', 'Category', 'Amount', 'Start Month', 'Frequency', 'Growth %'])
    cashFlowData.items.forEach(item => {
      csvData.push([
        item.name,
        item.type,
        item.category,
        `R${item.amount.toLocaleString()}`,
        `Month ${item.startMonth}`,
        item.frequency,
        `${item.growth}%`
      ])
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
    a.download = `cashflow-${cashFlowData.businessName?.replace(/[^a-zA-Z0-9]/g, '-') || 'business'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetTool = () => {
    setCashFlowData({
      items: [],
      startingBalance: 0,
      businessName: '',
      projectionMonths: 12,
      notes: ''
    })
    localStorage.removeItem('cashFlowProjectionTool')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Cash Flow Projection Tool</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Forecast your business cash flow over time</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Left Panel - Setup */}
          <div className="lg:w-1/2 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-700">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="items">Cash Flow Items</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4">
                {/* Basic Setup */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Basic Setup</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={cashFlowData.businessName}
                          onChange={(e) => setCashFlowData(prev => ({ ...prev, businessName: e.target.value }))}
                          placeholder="Enter business name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="startingBalance">Starting Cash Balance</Label>
                        <Input
                          id="startingBalance"
                          type="number"
                          value={cashFlowData.startingBalance === 0 ? '' : cashFlowData.startingBalance}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCashFlowData(prev => ({ 
                              ...prev, 
                              startingBalance: value === '' ? 0 : parseFloat(value) || 0 
                            }));
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="projectionMonths">Projection Period (months)</Label>
                        <Select value={cashFlowData.projectionMonths.toString()} onValueChange={(value) => setCashFlowData(prev => ({ ...prev, projectionMonths: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6">6 months</SelectItem>
                            <SelectItem value="12">12 months</SelectItem>
                            <SelectItem value="18">18 months</SelectItem>
                            <SelectItem value="24">24 months</SelectItem>
                            <SelectItem value="36">36 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Notes & Assumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={cashFlowData.notes}
                      onChange={(e) => setCashFlowData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes about your assumptions, seasonal factors, or other important details..."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items" className="space-y-4">
                {/* Add Cash Flow Item */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Add Cash Flow Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className={validationErrors.name ? 'text-red-600' : ''}>Item Name *</Label>
                        <Input
                          value={newItem.name}
                          onChange={(e) => {
                            setNewItem(prev => ({ ...prev, name: e.target.value }))
                            if (validationErrors.name) {
                              setValidationErrors(prev => ({ ...prev, name: false }))
                            }
                          }}
                          placeholder="e.g., Monthly Sales"
                          className={validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {validationErrors.name && <p className="text-sm text-red-600 mt-1">Item name is required</p>}
                      </div>
                      <div>
                        <Label className={validationErrors.amount ? 'text-red-600' : ''}>Amount *</Label>
                        <Input
                          type="number"
                          value={newItem.amount === 0 ? '' : newItem.amount}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewItem(prev => ({ 
                              ...prev, 
                              amount: value === '' ? 0 : parseFloat(value) || 0 
                            }));
                            if (validationErrors.amount) {
                              setValidationErrors(prev => ({ ...prev, amount: false }))
                            }
                          }}
                          placeholder="0.00"
                          className={validationErrors.amount ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {validationErrors.amount && <p className="text-sm text-red-600 mt-1">Amount must be greater than 0</p>}
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={newItem.type} onValueChange={(value: any) => setNewItem(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inflow">Cash Inflow</SelectItem>
                            <SelectItem value="outflow">Cash Outflow</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className={validationErrors.category ? 'text-red-600' : ''}>Category *</Label>
                        <Select value={newItem.category} onValueChange={(value) => {
                          setNewItem(prev => ({ ...prev, category: value }))
                          if (validationErrors.category) {
                            setValidationErrors(prev => ({ ...prev, category: false }))
                          }
                        }}>
                          <SelectTrigger className={validationErrors.category ? 'border-red-500 focus:border-red-500' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(newItem.type === 'inflow' ? inflowCategories : outflowCategories).map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.category && <p className="text-sm text-red-600 mt-1">Please select a category</p>}
                      </div>
                      <div>
                        <Label>Start Month</Label>
                        <Select value={newItem.startMonth?.toString()} onValueChange={(value) => setNewItem(prev => ({ ...prev, startMonth: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: cashFlowData.projectionMonths }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>Month {i + 1}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select value={newItem.frequency} onValueChange={(value: any) => setNewItem(prev => ({ ...prev, frequency: value }))}>
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
                      <div>
                        <Label>Growth Rate (%)</Label>
                        <Input
                          type="number"
                          value={newItem.growth === 0 ? '' : newItem.growth}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewItem(prev => ({ 
                              ...prev, 
                              growth: value === '' ? 0 : parseFloat(value) || 0 
                            }));
                          }}
                          placeholder="0.0"
                          step="0.1"
                        />
                      </div>
                    </div>
                    <Button onClick={addItem} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Cash Flow Item
                    </Button>
                  </CardContent>
                </Card>

                {/* Cash Flow Items List */}
                <div className="space-y-2">
                  {cashFlowData.items.map(item => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant={item.type === 'inflow' ? 'default' : 'destructive'}>
                              {item.type === 'inflow' ? 'Inflow' : 'Outflow'}
                            </Badge>
                            <Badge variant="secondary">{item.category}</Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            R{item.amount.toLocaleString()} {item.frequency} • Starts Month {item.startMonth}
                            {item.growth > 0 && ` • ${item.growth}% growth`}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Projection Results */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Inflow</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        R{totalInflow.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Total Outflow</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        R{totalOutflow.toLocaleString()}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-r ${finalBalance >= cashFlowData.startingBalance ? 'from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800' : 'from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900 border-orange-200 dark:border-orange-800'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${finalBalance >= cashFlowData.startingBalance ? 'text-blue-800 dark:text-blue-200' : 'text-orange-800 dark:text-orange-200'}`}>Final Balance</p>
                      <p className={`text-2xl font-bold ${finalBalance >= cashFlowData.startingBalance ? 'text-blue-900 dark:text-blue-100' : 'text-orange-900 dark:text-orange-100'}`}>
                        R{finalBalance.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className={`w-8 h-8 ${finalBalance >= cashFlowData.startingBalance ? 'text-blue-600' : 'text-orange-600'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-r ${negativeMonths === 0 ? 'from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800' : 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${negativeMonths === 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>Risk Months</p>
                      <p className={`text-2xl font-bold ${negativeMonths === 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                        {negativeMonths}
                      </p>
                      <p className={`text-xs ${negativeMonths === 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {negativeMonths === 0 ? 'No cash flow issues' : 'Months with negative balance'}
                      </p>
                    </div>
                    {negativeMonths === 0 ? (
                      <Calendar className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cash Flow Chart */}
            {projection.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Cash Flow Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={projection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthName" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="runningBalance" stroke="#EA7A57" strokeWidth={3} name="Running Balance" />
                      <Line type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={2} name="Monthly Inflow" />
                      <Line type="monotone" dataKey="outflow" stroke="#EF4444" strokeWidth={2} name="Monthly Outflow" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Monthly Breakdown */}
            {projection.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={projection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthName" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Bar dataKey="inflow" fill="#10B981" name="Inflow" />
                      <Bar dataKey="outflow" fill="#EF4444" name="Outflow" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export to CSV
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    Reset Tool
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to reset?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all your cash flow projection data including items, settings, and notes. This cannot be undone.
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