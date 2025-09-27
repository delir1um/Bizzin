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
// Dialog components removed - using custom modal instead
import { X, Download, Calculator, TrendingUp, DollarSign, Target, AlertTriangle, History } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts"
import { useBusinessName } from "@/hooks/useUserProfile"
import { CalculationHistory } from "@/components/calculators/CalculationHistory"

interface BreakEvenData {
  productName: string
  sellingPrice: number
  variableCostPerUnit: number
  fixedCosts: FixedCost[]
  timeframe: 'monthly' | 'quarterly' | 'annually'
  notes: string
}

interface FixedCost {
  id: string
  name: string
  amount: number
  category: string
}

const fixedCostCategories = [
  'Rent & Utilities',
  'Salaries & Benefits',
  'Insurance',
  'Marketing & Advertising',
  'Equipment & Software',
  'Professional Services',
  'Loan Payments',
  'Other Fixed Costs'
]

export default function BreakEvenCalculator({ onClose }: { onClose: () => void }) {
  const businessName = useBusinessName()
  const [breakEvenData, setBreakEvenData] = useState<BreakEvenData>({
    productName: '',
    sellingPrice: 0,
    variableCostPerUnit: 0,
    fixedCosts: [],
    timeframe: 'monthly',
    notes: ''
  })

  const [newFixedCost, setNewFixedCost] = useState<Partial<FixedCost>>({
    name: '',
    amount: 0,
    category: ''
  })

  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({})
  const [activeTab, setActiveTab] = useState('setup')

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('breakEvenCalculator')
    if (saved) {
      try {
        setBreakEvenData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved data:', error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('breakEvenCalculator', JSON.stringify(breakEvenData))
  }, [breakEvenData])

  // Calculations (using Excel template formulas)
  const totalFixedCosts = breakEvenData.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0)
  const contributionMargin = breakEvenData.sellingPrice - breakEvenData.variableCostPerUnit
  const contributionMarginRatio = breakEvenData.sellingPrice > 0 ? (contributionMargin / breakEvenData.sellingPrice) * 100 : 0
  const breakEvenUnits = contributionMargin > 0 ? Math.ceil(totalFixedCosts / contributionMargin) : 0
  const breakEvenRevenue = breakEvenUnits * breakEvenData.sellingPrice
  const safetyMarginUnits = Math.max(0, breakEvenUnits * 0.2) // 20% safety margin
  const recommendedUnits = breakEvenUnits + safetyMarginUnits
  
  // Additional Excel template calculations
  const marginOfSafetyUnits = (units: number) => Math.max(0, units - breakEvenUnits)
  const marginOfSafetyPercentage = (units: number) => units > 0 ? (marginOfSafetyUnits(units) / units) * 100 : 0
  const profitAtUnits = (units: number) => (units * contributionMargin) - totalFixedCosts

  // Validation for adding fixed costs
  const addFixedCost = () => {
    const errors: {[key: string]: boolean} = {}
    
    if (!newFixedCost.name?.trim()) errors.name = true
    if (!newFixedCost.amount || newFixedCost.amount <= 0) errors.amount = true
    if (!newFixedCost.category) errors.category = true
    
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      return
    }
    
    const cost: FixedCost = {
      id: Date.now().toString(),
      name: newFixedCost.name!,
      amount: newFixedCost.amount!,
      category: newFixedCost.category!
    }
    
    setBreakEvenData(prev => ({ ...prev, fixedCosts: [...prev.fixedCosts, cost] }))
    setNewFixedCost({ name: '', amount: 0, category: '' })
    setValidationErrors({})
  }

  const removeFixedCost = (id: string) => {
    setBreakEvenData(prev => ({ 
      ...prev, 
      fixedCosts: prev.fixedCosts.filter(cost => cost.id !== id) 
    }))
  }

  // Generate scenario analysis data
  const generateScenarioData = () => {
    const scenarios = []
    const baseUnits = breakEvenUnits
    
    for (let i = 0; i <= 200; i += 10) {
      const units = Math.max(1, baseUnits * (i / 100))
      const revenue = units * breakEvenData.sellingPrice
      const variableCosts = units * breakEvenData.variableCostPerUnit
      const totalCosts = totalFixedCosts + variableCosts
      const profit = revenue - totalCosts
      
      scenarios.push({
        units: Math.round(units),
        revenue,
        fixedCosts: totalFixedCosts,
        variableCosts,
        totalCosts,
        profit,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0
      })
    }
    
    return scenarios
  }

  const scenarioData = generateScenarioData()

  // Export to CSV
  const exportToCSV = () => {
    const csvData = []
    
    // Header information
    csvData.push(['BREAK-EVEN ANALYSIS REPORT'])
    csvData.push(['Generated on:', new Date().toLocaleDateString()])
    csvData.push(['Business Name:', businessName])
    csvData.push(['Product/Service:', breakEvenData.productName || 'Not specified'])
    csvData.push(['Timeframe:', breakEvenData.timeframe])
    csvData.push([]) // Empty row
    
    // Key Metrics
    csvData.push(['KEY BREAK-EVEN METRICS'])
    csvData.push(['Selling Price per Unit:', `R${breakEvenData.sellingPrice.toLocaleString()}`])
    csvData.push(['Variable Cost per Unit:', `R${breakEvenData.variableCostPerUnit.toLocaleString()}`])
    csvData.push(['Contribution Margin per Unit:', `R${contributionMargin.toLocaleString()}`])
    csvData.push(['Contribution Margin Ratio:', `${contributionMarginRatio.toFixed(1)}%`])
    csvData.push(['Total Fixed Costs:', `R${totalFixedCosts.toLocaleString()}`])
    csvData.push(['Break-Even Units:', breakEvenUnits.toLocaleString()])
    csvData.push(['Break-Even Revenue:', `R${breakEvenRevenue.toLocaleString()}`])
    csvData.push(['Recommended Units (with 20% buffer):', recommendedUnits.toLocaleString()])
    csvData.push([]) // Empty row
    
    // Margin of Safety Analysis (from Excel template)
    csvData.push(['MARGIN OF SAFETY ANALYSIS'])
    csvData.push(['Margin of Safety Units:', marginOfSafetyUnits(recommendedUnits).toLocaleString()])
    csvData.push(['Margin of Safety Percentage:', `${marginOfSafetyPercentage(recommendedUnits).toFixed(1)}%`])
    csvData.push(['Expected Profit at Recommended Units:', `R${profitAtUnits(recommendedUnits).toLocaleString()}`])
    csvData.push(['Revenue at Recommended Units:', `R${(recommendedUnits * breakEvenData.sellingPrice).toLocaleString()}`])
    csvData.push([]) // Empty row
    
    // Fixed Costs Breakdown
    csvData.push(['FIXED COSTS BREAKDOWN'])
    csvData.push(['Cost Name', 'Category', 'Amount'])
    breakEvenData.fixedCosts.forEach(cost => {
      csvData.push([cost.name, cost.category, `R${cost.amount.toLocaleString()}`])
    })
    csvData.push(['TOTAL FIXED COSTS:', '', `R${totalFixedCosts.toLocaleString()}`])
    csvData.push([]) // Empty row
    
    // Scenario Analysis
    csvData.push(['SCENARIO ANALYSIS'])
    csvData.push(['Units Sold', 'Revenue', 'Variable Costs', 'Total Costs', 'Profit/Loss', 'Profit Margin %'])
    scenarioData.slice(0, 11).forEach(scenario => { // First 11 scenarios (0% to 100%)
      csvData.push([
        scenario.units,
        `R${scenario.revenue.toLocaleString()}`,
        `R${scenario.variableCosts.toLocaleString()}`,
        `R${scenario.totalCosts.toLocaleString()}`,
        `R${scenario.profit.toLocaleString()}`,
        `${scenario.profitMargin.toFixed(1)}%`
      ])
    })
    
    // Add notes if present
    if (breakEvenData.notes.trim()) {
      csvData.push([]) // Empty row
      csvData.push(['NOTES'])
      csvData.push([breakEvenData.notes])
    }
    
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `breakeven-${businessName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetTool = () => {
    setBreakEvenData({
      productName: '',
      sellingPrice: 0,
      variableCostPerUnit: 0,
      fixedCosts: [],
      timeframe: 'monthly',
      notes: ''
    })
    localStorage.removeItem('breakEvenCalculator')
  }

  const loadCalculation = (data: Record<string, any>) => {
    setBreakEvenData(data as BreakEvenData)
    setActiveTab('setup')
  }

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-7xl min-h-screen sm:min-h-0 sm:max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 my-2 sm:my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Break-Even Calculator</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">Calculate how many units you need to sell to break even</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Single Column Layout with Logical Flow */}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full p-4 sm:p-6 max-w-6xl mx-auto">
            {/* Tabs at the top */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="setup">Basic Setup</TabsTrigger>
                <TabsTrigger value="costs">Fixed Costs</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4">
                {/* Business Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Product/Service Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Product/Service Name</Label>
                      <Input
                        value={breakEvenData.productName}
                        onChange={(e) => setBreakEvenData(prev => ({ ...prev, productName: e.target.value }))}
                        placeholder="Enter product or service name"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Pricing & Costs</CardTitle>
                    <CardDescription>Enter your unit pricing and variable costs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Selling Price per Unit (R)</Label>
                      <Input
                        type="number"
                        value={breakEvenData.sellingPrice === 0 ? '' : breakEvenData.sellingPrice}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBreakEvenData(prev => ({ 
                            ...prev, 
                            sellingPrice: value === '' ? 0 : parseFloat(value) || 0 
                          }));
                        }}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label>Variable Cost per Unit (R)</Label>
                      <Input
                        type="number"
                        value={breakEvenData.variableCostPerUnit === 0 ? '' : breakEvenData.variableCostPerUnit}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBreakEvenData(prev => ({ 
                            ...prev, 
                            variableCostPerUnit: value === '' ? 0 : parseFloat(value) || 0 
                          }));
                        }}
                        placeholder="0.00"
                        step="0.01"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Costs that vary with each unit sold (materials, shipping, etc.)
                      </p>
                    </div>
                    {contributionMargin > 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Contribution Margin: R{contributionMargin.toLocaleString()} ({contributionMarginRatio.toFixed(1)}%)
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300">
                          This is how much each unit contributes to covering fixed costs
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Notes & Assumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={breakEvenData.notes}
                      onChange={(e) => setBreakEvenData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes about your assumptions, seasonal factors, or other important details..."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="costs" className="space-y-4">
                {/* Add Fixed Cost */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Add Fixed Cost</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className={validationErrors.name ? 'text-red-600' : ''}>Cost Name *</Label>
                        <Input
                          value={newFixedCost.name}
                          onChange={(e) => {
                            setNewFixedCost(prev => ({ ...prev, name: e.target.value }))
                            if (validationErrors.name) {
                              setValidationErrors(prev => ({ ...prev, name: false }))
                            }
                          }}
                          placeholder="e.g., Office Rent"
                          className={validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {validationErrors.name && <p className="text-sm text-red-600 mt-1">Cost name is required</p>}
                      </div>
                      <div>
                        <Label className={validationErrors.amount ? 'text-red-600' : ''}>Amount (R) *</Label>
                        <Input
                          type="number"
                          value={newFixedCost.amount === 0 ? '' : newFixedCost.amount}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewFixedCost(prev => ({ 
                              ...prev, 
                              amount: value === '' ? 0 : parseFloat(value) || 0 
                            }));
                            if (validationErrors.amount) {
                              setValidationErrors(prev => ({ ...prev, amount: false }))
                            }
                          }}
                          placeholder="0.00"
                          step="0.01"
                          className={validationErrors.amount ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {validationErrors.amount && <p className="text-sm text-red-600 mt-1">Amount must be greater than 0</p>}
                      </div>
                      <div>
                        <Label className={validationErrors.category ? 'text-red-600' : ''}>Category *</Label>
                        <Select value={newFixedCost.category} onValueChange={(value) => {
                          setNewFixedCost(prev => ({ ...prev, category: value }))
                          if (validationErrors.category) {
                            setValidationErrors(prev => ({ ...prev, category: false }))
                          }
                        }}>
                          <SelectTrigger className={validationErrors.category ? 'border-red-500 focus:border-red-500' : ''}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {fixedCostCategories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.category && <p className="text-sm text-red-600 mt-1">Please select a category</p>}
                      </div>
                    </div>
                    <Button onClick={addFixedCost} className="w-full bg-orange-600 hover:bg-orange-700">
                      Add Fixed Cost
                    </Button>
                  </CardContent>
                </Card>

                {/* Fixed Costs List */}
                <div className="space-y-2">
                  {breakEvenData.fixedCosts.map(cost => (
                    <Card key={cost.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{cost.name}</span>
                            <Badge variant="secondary">{cost.category}</Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">
                            R{cost.amount.toLocaleString()}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFixedCost(cost.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {breakEvenData.fixedCosts.length > 0 && (
                  <Card className="p-4 bg-orange-50 dark:bg-orange-900/20">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                        Total Fixed Costs: R{totalFixedCosts.toLocaleString()}
                      </p>
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <CalculationHistory
                  calculatorType="break_even"
                  currentData={breakEvenData}
                  onLoadCalculation={loadCalculation}
                />
              </TabsContent>
            </Tabs>

            {/* Results Section - After Inputs */}
            <div className="mt-8 space-y-6">
              {/* Key Metrics */}
              {contributionMargin > 0 && totalFixedCosts > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                    <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                      {breakEvenUnits.toLocaleString()}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">Break-Even Units</p>
                  </Card>
                  <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      R{breakEvenRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">Break-Even Revenue</p>
                  </Card>
                </div>

                {/* Additional Metrics */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Contribution Margin:</span>
                      <span className="font-medium">R{contributionMargin.toLocaleString()} ({contributionMarginRatio.toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recommended Units (20% buffer):</span>
                      <span className="font-medium text-orange-600">{recommendedUnits.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue at Recommended Units:</span>
                      <span className="font-medium">R{(recommendedUnits * breakEvenData.sellingPrice).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Margin of Safety Analysis (from Excel template) */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Margin of Safety Analysis
                    </CardTitle>
                    <CardDescription>How much sales can drop before reaching break-even</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-lg font-bold text-amber-800 dark:text-amber-200">
                          {marginOfSafetyUnits(recommendedUnits).toLocaleString()}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-300">Safety Units</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-lg font-bold text-green-800 dark:text-green-200">
                          {marginOfSafetyPercentage(recommendedUnits).toFixed(1)}%
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300">Safety Margin</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                          R{profitAtUnits(recommendedUnits).toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">Expected Profit</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">What this means:</h4>
                      <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                        <li>• You can sell {marginOfSafetyUnits(recommendedUnits).toLocaleString()} units below target before breaking even</li>
                        <li>• Sales can drop by {marginOfSafetyPercentage(recommendedUnits).toFixed(1)}% and you'll still be profitable</li>
                        <li>• At recommended sales level, you'll generate R{profitAtUnits(recommendedUnits).toLocaleString()} profit</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Break-Even Chart */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Break-Even Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={scenarioData.slice(0, 11)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="units" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue" strokeWidth={2} />
                        <Line type="monotone" dataKey="totalCosts" stroke="#EF4444" name="Total Costs" strokeWidth={2} />
                        <Line type="monotone" dataKey="profit" stroke="#3B82F6" name="Profit" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Fixed Costs Breakdown */}
                {breakEvenData.fixedCosts.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Fixed Costs Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={breakEvenData.fixedCosts}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="amount"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {breakEvenData.fixedCosts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, 'Amount']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
                </>
              )}

              {/* Warning for invalid data */}
              {(contributionMargin <= 0 || totalFixedCosts === 0) && (
              <Card className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Complete Setup Required</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Please complete the following to see your break-even analysis:
                </p>
                <div className="space-y-2 text-sm">
                  {breakEvenData.sellingPrice <= 0 && (
                    <p className="text-red-600">• Enter a selling price greater than 0</p>
                  )}
                  {contributionMargin <= 0 && breakEvenData.sellingPrice > 0 && (
                    <p className="text-red-600">• Variable cost must be less than selling price</p>
                  )}
                  {totalFixedCosts === 0 && (
                    <p className="text-red-600">• Add at least one fixed cost</p>
                  )}
                </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={exportToCSV} className="bg-orange-600 hover:bg-orange-700" disabled={breakEvenUnits === 0}>
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
                      This action will permanently delete all your break-even analysis data including costs, pricing, and notes. This cannot be undone.
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
    </div>
  )
}