import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { X, Plus, Download, Save, Calculator, TrendingUp, TrendingDown, DollarSign, PieChart, History } from "lucide-react"
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie } from "recharts"
import { CalculationHistory } from "@/components/calculators/CalculationHistory"

interface IncomeItem {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time'
  category: string
}

interface ExpenseItem {
  id: string
  name: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time'
  category: string
  type: 'fixed' | 'variable'
}

interface BudgetData {
  income: IncomeItem[]
  expenses: ExpenseItem[]
  notes: string

  period: 'monthly' | 'quarterly' | 'annually'
}

const incomeCategories = [
  'Product Sales',
  'Service Revenue',
  'Subscription Revenue',
  'Consulting',
  'Licensing',
  'Investments',
  'Grants',
  'Other'
]

const expenseCategories = [
  'Rent & Utilities',
  'Salaries & Benefits',
  'Marketing & Advertising',
  'Office Supplies',
  'Equipment',
  'Software & Tools',
  'Professional Services',
  'Insurance',
  'Travel',
  'Other'
]

const COLORS = ['#EA7A57', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16']

interface BusinessBudgetCalculatorProps {
  onClose: () => void
}

export function BusinessBudgetCalculator({ onClose }: BusinessBudgetCalculatorProps) {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    income: [],
    expenses: [],
    notes: '',
    period: 'monthly'
  })

  const [activeTab, setActiveTab] = useState('income')
  const [newIncomeItem, setNewIncomeItem] = useState<Partial<IncomeItem>>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    category: ''
  })
  const [newExpenseItem, setNewExpenseItem] = useState<Partial<ExpenseItem>>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    category: '',
    type: 'variable'
  })
  const [incomeValidationErrors, setIncomeValidationErrors] = useState<{[key: string]: boolean}>({})
  const [expenseValidationErrors, setExpenseValidationErrors] = useState<{[key: string]: boolean}>({})

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('businessBudgetCalculator')
    if (saved) {
      try {
        setBudgetData(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load saved budget data')
      }
    }
  }, [])

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('businessBudgetCalculator', JSON.stringify(budgetData))
  }, [budgetData])

  // Calculate totals based on selected period
  const calculatePeriodAmount = (amount: number, frequency: string, targetPeriod: string) => {
    const monthlyAmount = frequency === 'monthly' ? amount :
                         frequency === 'quarterly' ? amount / 3 :
                         frequency === 'annually' ? amount / 12 :
                         amount / 12 // one-time divided by 12 months

    if (targetPeriod === 'monthly') return monthlyAmount
    if (targetPeriod === 'quarterly') return monthlyAmount * 3
    return monthlyAmount * 12
  }

  const totalIncome = budgetData.income.reduce((sum, item) => 
    sum + calculatePeriodAmount(item.amount, item.frequency, budgetData.period), 0)
  
  const totalExpenses = budgetData.expenses.reduce((sum, item) => 
    sum + calculatePeriodAmount(item.amount, item.frequency, budgetData.period), 0)
  
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

  const addIncomeItem = () => {
    const errors: {[key: string]: boolean} = {}
    
    if (!newIncomeItem.name?.trim()) errors.name = true
    if (!newIncomeItem.amount || newIncomeItem.amount <= 0) errors.amount = true
    if (!newIncomeItem.category) errors.category = true
    
    setIncomeValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    const item: IncomeItem = {
      id: Date.now().toString(),
      name: newIncomeItem.name || '',
      amount: newIncomeItem.amount || 0,
      frequency: newIncomeItem.frequency || 'monthly',
      category: newIncomeItem.category || ''
    }
    
    setBudgetData(prev => ({ ...prev, income: [...prev.income, item] }))
    setNewIncomeItem({ name: '', amount: 0, frequency: 'monthly', category: '' })
    setIncomeValidationErrors({})
  }

  const addExpenseItem = () => {
    const errors: {[key: string]: boolean} = {}
    
    if (!newExpenseItem.name?.trim()) errors.name = true
    if (!newExpenseItem.amount || newExpenseItem.amount <= 0) errors.amount = true
    if (!newExpenseItem.category) errors.category = true
    
    setExpenseValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    const item: ExpenseItem = {
      id: Date.now().toString(),
      name: newExpenseItem.name || '',
      amount: newExpenseItem.amount || 0,
      frequency: newExpenseItem.frequency || 'monthly',
      category: newExpenseItem.category || '',
      type: newExpenseItem.type || 'variable'
    }
    
    setBudgetData(prev => ({ ...prev, expenses: [...prev.expenses, item] }))
    setNewExpenseItem({ name: '', amount: 0, frequency: 'monthly', category: '', type: 'variable' })
    setExpenseValidationErrors({})
  }

  const removeIncomeItem = (id: string) => {
    setBudgetData(prev => ({ ...prev, income: prev.income.filter(item => item.id !== id) }))
  }

  const removeExpenseItem = (id: string) => {
    setBudgetData(prev => ({ ...prev, expenses: prev.expenses.filter(item => item.id !== id) }))
  }

  // Prepare chart data
  const incomeByCategory = incomeCategories.map(category => {
    const total = budgetData.income
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + calculatePeriodAmount(item.amount, item.frequency, budgetData.period), 0)
    return { name: category, value: total }
  }).filter(item => item.value > 0)

  const expenseByCategory = expenseCategories.map(category => {
    const total = budgetData.expenses
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + calculatePeriodAmount(item.amount, item.frequency, budgetData.period), 0)
    return { name: category, value: total }
  }).filter(item => item.value > 0)

  const monthlyComparison = [
    { name: 'Income', amount: totalIncome, color: '#10B981' },
    { name: 'Expenses', amount: totalExpenses, color: '#EF4444' },
    { name: 'Net Profit', amount: netProfit, color: netProfit >= 0 ? '#10B981' : '#EF4444' }
  ]

  const exportToCSV = () => {
    const csvData = []
    
    // Header
    csvData.push(['Business Budget Report'])

    csvData.push(['Period:', budgetData.period])
    csvData.push(['Generated:', new Date().toLocaleDateString()])
    csvData.push([]) // Empty row
    
    // Summary
    csvData.push(['FINANCIAL SUMMARY'])
    csvData.push(['Total Income:', `R${totalIncome.toLocaleString()}`])
    csvData.push(['Total Expenses:', `R${totalExpenses.toLocaleString()}`])
    csvData.push(['Net Profit:', `R${netProfit.toLocaleString()}`])
    csvData.push(['Profit Margin:', `${profitMargin.toFixed(1)}%`])
    csvData.push([]) // Empty row
    
    // Income Details
    csvData.push(['INCOME BREAKDOWN'])
    csvData.push(['Name', 'Category', 'Amount', 'Frequency', `${budgetData.period} Amount`])
    budgetData.income.forEach(item => {
      csvData.push([
        item.name,
        item.category,
        `R${item.amount.toLocaleString()}`,
        item.frequency,
        `R${calculatePeriodAmount(item.amount, item.frequency, budgetData.period).toLocaleString()}`
      ])
    })
    csvData.push([]) // Empty row
    
    // Expense Details
    csvData.push(['EXPENSE BREAKDOWN'])
    csvData.push(['Name', 'Category', 'Type', 'Amount', 'Frequency', `${budgetData.period} Amount`])
    budgetData.expenses.forEach(item => {
      csvData.push([
        item.name,
        item.category,
        item.type,
        `R${item.amount.toLocaleString()}`,
        item.frequency,
        `R${calculatePeriodAmount(item.amount, item.frequency, budgetData.period).toLocaleString()}`
      ])
    })
    
    // Add notes if present
    if (budgetData.notes.trim()) {
      csvData.push([]) // Empty row
      csvData.push(['NOTES'])
      csvData.push([budgetData.notes])
    }
    
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetCalculator = () => {
    setBudgetData({
      income: [],
      expenses: [],
      notes: '',
      period: 'monthly'
    })
    localStorage.removeItem('businessBudgetCalculator')
  }

  const loadCalculation = (data: Record<string, any>) => {
    setBudgetData(data as BudgetData)
    setActiveTab('income')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Business Budget Calculator</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Plan and track your business finances</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
          {/* Left Panel - Input */}
          <div className="lg:w-1/2 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-700">
            {/* Business Info */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>

                </div>
                <div>
                  <Label htmlFor="period">Budget Period</Label>
                  <Select value={budgetData.period} onValueChange={(value: any) => setBudgetData(prev => ({ ...prev, period: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="income" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Add Income Source</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className={incomeValidationErrors.name ? 'text-red-600' : ''}>Income Name *</Label>
                        <Input
                          value={newIncomeItem.name}
                          onChange={(e) => {
                            setNewIncomeItem(prev => ({ ...prev, name: e.target.value }))
                            if (incomeValidationErrors.name) {
                              setIncomeValidationErrors(prev => ({ ...prev, name: false }))
                            }
                          }}
                          placeholder="e.g., Product Sales"
                          className={incomeValidationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {incomeValidationErrors.name && <p className="text-sm text-red-600 mt-1">Income name is required</p>}
                      </div>
                      <div>
                        <Label className={incomeValidationErrors.amount ? 'text-red-600' : ''}>Amount *</Label>
                        <Input
                          type="number"
                          value={newIncomeItem.amount}
                          onChange={(e) => {
                            setNewIncomeItem(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                            if (incomeValidationErrors.amount) {
                              setIncomeValidationErrors(prev => ({ ...prev, amount: false }))
                            }
                          }}
                          placeholder="0.00"
                          className={incomeValidationErrors.amount ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {incomeValidationErrors.amount && <p className="text-sm text-red-600 mt-1">Amount must be greater than 0</p>}
                      </div>
                      <div>
                        <Label className={incomeValidationErrors.category ? 'text-red-600' : ''}>Category *</Label>
                        <Select value={newIncomeItem.category} onValueChange={(value) => {
                          setNewIncomeItem(prev => ({ ...prev, category: value }))
                          if (incomeValidationErrors.category) {
                            setIncomeValidationErrors(prev => ({ ...prev, category: false }))
                          }
                        }}>
                          <SelectTrigger className={incomeValidationErrors.category ? 'border-red-500 focus:border-red-500' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {incomeCategories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {incomeValidationErrors.category && <p className="text-sm text-red-600 mt-1">Please select a category</p>}
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select value={newIncomeItem.frequency} onValueChange={(value: any) => setNewIncomeItem(prev => ({ ...prev, frequency: value }))}>
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
                    <Button onClick={addIncomeItem} className="w-full bg-orange-600 hover:bg-orange-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Income Source
                    </Button>
                  </CardContent>
                </Card>

                {/* Income List */}
                <div className="space-y-2">
                  {budgetData.income.map(item => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="secondary">{item.category}</Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            R{item.amount.toLocaleString()} {item.frequency}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-600">
                            R{calculatePeriodAmount(item.amount, item.frequency, budgetData.period).toLocaleString()}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => removeIncomeItem(item.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Add Expense</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className={expenseValidationErrors.name ? 'text-red-600' : ''}>Expense Name *</Label>
                        <Input
                          value={newExpenseItem.name}
                          onChange={(e) => {
                            setNewExpenseItem(prev => ({ ...prev, name: e.target.value }))
                            if (expenseValidationErrors.name) {
                              setExpenseValidationErrors(prev => ({ ...prev, name: false }))
                            }
                          }}
                          placeholder="e.g., Office Rent"
                          className={expenseValidationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {expenseValidationErrors.name && <p className="text-sm text-red-600 mt-1">Expense name is required</p>}
                      </div>
                      <div>
                        <Label className={expenseValidationErrors.amount ? 'text-red-600' : ''}>Amount *</Label>
                        <Input
                          type="number"
                          value={newExpenseItem.amount}
                          onChange={(e) => {
                            setNewExpenseItem(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                            if (expenseValidationErrors.amount) {
                              setExpenseValidationErrors(prev => ({ ...prev, amount: false }))
                            }
                          }}
                          placeholder="0.00"
                          className={expenseValidationErrors.amount ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {expenseValidationErrors.amount && <p className="text-sm text-red-600 mt-1">Amount must be greater than 0</p>}
                      </div>
                      <div>
                        <Label className={expenseValidationErrors.category ? 'text-red-600' : ''}>Category *</Label>
                        <Select value={newExpenseItem.category} onValueChange={(value) => {
                          setNewExpenseItem(prev => ({ ...prev, category: value }))
                          if (expenseValidationErrors.category) {
                            setExpenseValidationErrors(prev => ({ ...prev, category: false }))
                          }
                        }}>
                          <SelectTrigger className={expenseValidationErrors.category ? 'border-red-500 focus:border-red-500' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseCategories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {expenseValidationErrors.category && <p className="text-sm text-red-600 mt-1">Please select a category</p>}
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={newExpenseItem.type} onValueChange={(value: any) => setNewExpenseItem(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Cost</SelectItem>
                            <SelectItem value="variable">Variable Cost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Frequency</Label>
                        <Select value={newExpenseItem.frequency} onValueChange={(value: any) => setNewExpenseItem(prev => ({ ...prev, frequency: value }))}>
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
                    <Button onClick={addExpenseItem} className="w-full bg-orange-600 hover:bg-orange-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  </CardContent>
                </Card>

                {/* Expense List */}
                <div className="space-y-2">
                  {budgetData.expenses.map(item => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant="secondary">{item.category}</Badge>
                            <Badge variant={item.type === 'fixed' ? 'default' : 'outline'} className="text-xs">
                              {item.type}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            R{item.amount.toLocaleString()} {item.frequency}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-600">
                            R{calculatePeriodAmount(item.amount, item.frequency, budgetData.period).toLocaleString()}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => removeExpenseItem(item.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <CalculationHistory
                  calculatorType="business_budget"
                  currentData={budgetData}
                  onLoadCalculation={loadCalculation}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">Total Income</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        R{totalIncome.toLocaleString()}
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
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        R{totalExpenses.toLocaleString()}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-gradient-to-r ${netProfit >= 0 ? 'from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800' : 'from-red-50 to-rose-100 dark:from-red-950 dark:to-rose-900 border-red-200 dark:border-red-800'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>Net Profit</p>
                      <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                        R{netProfit.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className={`w-8 h-8 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Profit Margin</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {profitMargin.toFixed(1)}%
                      </p>
                    </div>
                    <PieChart className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {(incomeByCategory.length > 0 || expenseByCategory.length > 0) && (
              <div className="space-y-6">
                {/* Income Distribution */}
                {incomeByCategory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Income Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPieChart>
                          <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                            {incomeByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, 'Amount']} />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Expense Distribution */}
                {expenseByCategory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Expense Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPieChart>
                          <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>
                            {expenseByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, 'Amount']} />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={monthlyComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, 'Amount']} />
                        <Bar dataKey="amount" fill="#EA7A57" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notes Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={budgetData.notes}
                  onChange={(e) => setBudgetData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes about your budget assumptions, goals, or other important details..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={exportToCSV} className="bg-orange-600 hover:bg-orange-700">
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
                      This action will permanently delete all your budget data including income sources, expenses, and notes. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={resetCalculator}
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