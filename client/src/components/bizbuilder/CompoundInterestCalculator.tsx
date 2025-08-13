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
import { X, Download, TrendingUp, DollarSign, PiggyBank, Calendar, Target, Zap } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts"


interface CompoundInterestData {
  calculationType: 'lump-sum' | 'monthly-contributions' | 'both'
  // Lump sum fields
  principal: number
  annualRate: number
  years: number
  compoundingFrequency: number
  // Monthly contributions fields
  monthlyContribution: number
  contributionsPerYear: number
  // Tax considerations
  includeTax: boolean
  taxRate: number
  notes: string
}

const compoundingFrequencies = [
  { value: 1, label: 'Annually' },
  { value: 4, label: 'Quarterly' },
  { value: 12, label: 'Monthly' },
  { value: 365, label: 'Daily' }
]

const COLORS = ['#EA7A57', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

export default function CompoundInterestCalculator({ onClose }: { onClose: () => void }) {
  const [compoundData, setCompoundData] = useState<CompoundInterestData>({
    calculationType: 'lump-sum',
    principal: 5000,
    annualRate: 5,
    years: 10,
    compoundingFrequency: 12,
    monthlyContribution: 500,
    contributionsPerYear: 12,
    includeTax: false,
    taxRate: 20,
    notes: ''
  })

  const [activeTab, setActiveTab] = useState('setup')

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('compoundInterestCalculator')
    if (saved) {
      try {
        setCompoundData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved data:', error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('compoundInterestCalculator', JSON.stringify(compoundData))
  }, [compoundData])

  // Excel FV function implementation: FV(rate, nper, pmt, pv, type)
  const calculateFV = (rate: number, nper: number, pmt: number, pv: number, type: number = 0): number => {
    if (rate === 0) {
      return -(pv + pmt * nper)
    }
    
    const pvif = Math.pow(1 + rate, nper)
    let fvifa = (pvif - 1) / rate
    
    if (type === 1) {
      fvifa = fvifa * (1 + rate)
    }
    
    return -(pv * pvif + pmt * fvifa)
  }

  // Calculate compound interest results based on Excel formulas
  const calculateResults = () => {
    const rate = compoundData.annualRate / 100
    const periodicRate = rate / compoundData.compoundingFrequency
    const totalPeriods = compoundData.years * compoundData.compoundingFrequency
    const monthlyRate = rate / 12
    const totalMonthlyPayments = compoundData.years * 12

    // Lump sum calculation: FV(rate, years, 0, -principal)
    const lumpSumFV = calculateFV(periodicRate, totalPeriods, 0, -compoundData.principal)
    const lumpSumInterest = lumpSumFV - compoundData.principal

    // Monthly contributions calculation: FV(monthly_rate, total_payments, -monthly_payment, -principal)
    const monthlyFV = calculateFV(
      monthlyRate, 
      totalMonthlyPayments, 
      -compoundData.monthlyContribution, 
      -compoundData.principal
    )
    const totalContributions = compoundData.principal + (compoundData.monthlyContribution * totalMonthlyPayments)
    const monthlyInterest = monthlyFV - totalContributions

    // Tax calculations
    const lumpSumAfterTax = compoundData.includeTax 
      ? lumpSumFV - (lumpSumInterest * compoundData.taxRate / 100)
      : lumpSumFV
    
    const monthlyAfterTax = compoundData.includeTax 
      ? monthlyFV - (monthlyInterest * compoundData.taxRate / 100)
      : monthlyFV

    return {
      lumpSum: {
        futureValue: lumpSumFV,
        interest: lumpSumInterest,
        afterTax: lumpSumAfterTax,
        effectiveRate: ((lumpSumFV / compoundData.principal) ** (1 / compoundData.years) - 1) * 100
      },
      monthly: {
        futureValue: monthlyFV,
        totalContributions,
        interest: monthlyInterest,
        afterTax: monthlyAfterTax,
        monthlyGrowth: compoundData.monthlyContribution > 0 ? 
          ((monthlyFV / totalContributions) ** (1 / compoundData.years) - 1) * 100 : 0
      }
    }
  }

  // Generate year-by-year projection data
  const generateProjectionData = () => {
    const projectionData = []
    const rate = compoundData.annualRate / 100
    const monthlyRate = rate / 12

    for (let year = 0; year <= compoundData.years; year++) {
      const periodicRate = rate / compoundData.compoundingFrequency
      const periods = year * compoundData.compoundingFrequency
      const monthlyPayments = year * 12

      // Lump sum value
      const lumpSumValue = year === 0 ? compoundData.principal : 
        calculateFV(periodicRate, periods, 0, -compoundData.principal)

      // Monthly contributions value
      const monthlyValue = year === 0 ? compoundData.principal :
        calculateFV(monthlyRate, monthlyPayments, -compoundData.monthlyContribution, -compoundData.principal)

      const totalContributed = compoundData.principal + (compoundData.monthlyContribution * monthlyPayments)

      projectionData.push({
        year,
        lumpSum: lumpSumValue,
        monthly: monthlyValue,
        contributed: totalContributed,
        lumpSumInterest: lumpSumValue - compoundData.principal,
        monthlyInterest: monthlyValue - totalContributed
      })
    }

    return projectionData
  }

  const results = calculateResults()
  const projectionData = generateProjectionData()

  // Export to CSV
  const exportToCSV = () => {
    const csvData = []
    
    // Header information
    csvData.push(['COMPOUND INTEREST CALCULATION REPORT'])
    csvData.push(['Generated on:', new Date().toLocaleDateString()])
    csvData.push(['Compound Interest Report'])
    csvData.push(['Calculation Type:', compoundData.calculationType.replace('-', ' ').toUpperCase()])
    csvData.push([]) // Empty row
    
    // Investment parameters
    csvData.push(['INVESTMENT PARAMETERS'])
    csvData.push(['Initial Principal:', `R${compoundData.principal.toLocaleString()}`])
    csvData.push(['Annual Interest Rate:', `${compoundData.annualRate}%`])
    csvData.push(['Investment Period:', `${compoundData.years} years`])
    csvData.push(['Compounding Frequency:', `${compoundingFrequencies.find(f => f.value === compoundData.compoundingFrequency)?.label}`])
    
    if (compoundData.calculationType !== 'lump-sum') {
      csvData.push(['Monthly Contribution:', `R${compoundData.monthlyContribution.toLocaleString()}`])
    }
    
    if (compoundData.includeTax) {
      csvData.push(['Tax Rate:', `${compoundData.taxRate}%`])
    }
    csvData.push([]) // Empty row
    
    // Results
    csvData.push(['CALCULATION RESULTS'])
    
    if (compoundData.calculationType !== 'monthly-contributions') {
      csvData.push(['LUMP SUM INVESTMENT'])
      csvData.push(['Future Value:', `R${results.lumpSum.futureValue.toLocaleString()}`])
      csvData.push(['Interest Earned:', `R${results.lumpSum.interest.toLocaleString()}`])
      csvData.push(['Effective Annual Rate:', `${results.lumpSum.effectiveRate.toFixed(2)}%`])
      if (compoundData.includeTax) {
        csvData.push(['After Tax Value:', `R${results.lumpSum.afterTax.toLocaleString()}`])
      }
      csvData.push([]) // Empty row
    }
    
    if (compoundData.calculationType !== 'lump-sum') {
      csvData.push(['MONTHLY CONTRIBUTIONS'])
      csvData.push(['Future Value:', `R${results.monthly.futureValue.toLocaleString()}`])
      csvData.push(['Total Contributions:', `R${results.monthly.totalContributions.toLocaleString()}`])
      csvData.push(['Interest Earned:', `R${results.monthly.interest.toLocaleString()}`])
      csvData.push(['Growth Rate:', `${results.monthly.monthlyGrowth.toFixed(2)}%`])
      if (compoundData.includeTax) {
        csvData.push(['After Tax Value:', `R${results.monthly.afterTax.toLocaleString()}`])
      }
      csvData.push([]) // Empty row
    }
    
    // Year-by-year projection
    csvData.push(['YEAR-BY-YEAR PROJECTION'])
    const headers = ['Year']
    if (compoundData.calculationType !== 'monthly-contributions') {
      headers.push('Lump Sum Value', 'Lump Sum Interest')
    }
    if (compoundData.calculationType !== 'lump-sum') {
      headers.push('Monthly Contributions Value', 'Total Contributed', 'Monthly Interest')
    }
    csvData.push(headers)
    
    projectionData.forEach(data => {
      const row = [data.year.toString()]
      if (compoundData.calculationType !== 'monthly-contributions') {
        row.push(`R${data.lumpSum.toLocaleString()}`, `R${data.lumpSumInterest.toLocaleString()}`)
      }
      if (compoundData.calculationType !== 'lump-sum') {
        row.push(`R${data.monthly.toLocaleString()}`, `R${data.contributed.toLocaleString()}`, `R${data.monthlyInterest.toLocaleString()}`)
      }
      csvData.push(row)
    })
    
    // Add notes if present
    if (compoundData.notes.trim()) {
      csvData.push([]) // Empty row
      csvData.push(['NOTES'])
      csvData.push([compoundData.notes])
    }
    
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compound-interest-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetTool = () => {
    setCompoundData({
      calculationType: 'lump-sum',
      principal: 5000,
      annualRate: 5,
      years: 10,
      compoundingFrequency: 12,
      monthlyContribution: 500,
      contributionsPerYear: 12,
      includeTax: false,
      taxRate: 20,
      notes: ''
    })
    setActiveTab('setup')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Compound Interest Calculator</h2>
            <p className="text-slate-600 dark:text-slate-300">Calculate long-term investment growth with compound interest and regular contributions</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Panel - Input */}
          <div className="lg:w-1/2 border-r border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4">
                {/* Business Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Investment Details</CardTitle>
                    <CardDescription>Enter your investment information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    <div>
                      <Label>Calculation Type</Label>
                      <Select
                        value={compoundData.calculationType}
                        onValueChange={(value: any) => setCompoundData(prev => ({ ...prev, calculationType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lump-sum">Lump Sum Only</SelectItem>
                          <SelectItem value="monthly-contributions">Monthly Contributions Only</SelectItem>
                          <SelectItem value="both">Both (Lump Sum + Monthly)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Investment Parameters */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Investment Parameters</CardTitle>
                    <CardDescription>Set your investment terms</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Initial Principal (R)</Label>
                      <Input
                        type="number"
                        value={compoundData.principal}
                        onChange={(e) => setCompoundData(prev => ({ ...prev, principal: parseFloat(e.target.value) || 0 }))}
                        placeholder="5000"
                        step="100"
                      />
                    </div>
                    <div>
                      <Label>Annual Interest Rate (%)</Label>
                      <Input
                        type="number"
                        value={compoundData.annualRate}
                        onChange={(e) => setCompoundData(prev => ({ ...prev, annualRate: parseFloat(e.target.value) || 0 }))}
                        placeholder="5.0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label>Investment Period (Years)</Label>
                      <Input
                        type="number"
                        value={compoundData.years}
                        onChange={(e) => setCompoundData(prev => ({ ...prev, years: parseInt(e.target.value) || 0 }))}
                        placeholder="10"
                        min="1"
                        max="50"
                      />
                    </div>
                    <div>
                      <Label>Compounding Frequency</Label>
                      <Select
                        value={compoundData.compoundingFrequency.toString()}
                        onValueChange={(value) => setCompoundData(prev => ({ ...prev, compoundingFrequency: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {compoundingFrequencies.map(freq => (
                            <SelectItem key={freq.value} value={freq.value.toString()}>{freq.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Contributions */}
                {compoundData.calculationType !== 'lump-sum' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Monthly Contributions</CardTitle>
                      <CardDescription>Regular monthly investment amounts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Monthly Contribution (R)</Label>
                        <Input
                          type="number"
                          value={compoundData.monthlyContribution}
                          onChange={(e) => setCompoundData(prev => ({ ...prev, monthlyContribution: parseFloat(e.target.value) || 0 }))}
                          placeholder="500"
                          step="50"
                        />
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          Annual Contribution: R{(compoundData.monthlyContribution * 12).toLocaleString()}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                          Total over {compoundData.years} years: R{(compoundData.monthlyContribution * 12 * compoundData.years + compoundData.principal).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                {/* Tax Considerations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Tax Considerations</CardTitle>
                    <CardDescription>Include tax impact on interest earnings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="includeTax"
                        checked={compoundData.includeTax}
                        onChange={(e) => setCompoundData(prev => ({ ...prev, includeTax: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="includeTax">Include tax on interest earnings</Label>
                    </div>
                    {compoundData.includeTax && (
                      <div>
                        <Label>Tax Rate on Interest (%)</Label>
                        <Input
                          type="number"
                          value={compoundData.taxRate}
                          onChange={(e) => setCompoundData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                          placeholder="20"
                          step="1"
                          min="0"
                          max="100"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Typical SA marginal tax rates: 18%, 26%, 31%, 36%, 39%, 41%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SA Tax-Free Savings */}
                <Card className="border-green-300 bg-green-50 dark:bg-green-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-800 dark:text-green-200">
                      SA Tax-Free Savings Account
                    </CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-300">
                      Consider using your R36,000 annual limit
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                      <p>• Annual contribution limit: R36,000</p>
                      <p>• Lifetime limit: R500,000</p>
                      <p>• No tax on interest, dividends, or capital gains</p>
                      <p>• Monthly limit: R3,000</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                {/* Notes */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Notes & Assumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={compoundData.notes}
                      onChange={(e) => setCompoundData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes about investment assumptions, risk factors, or other important details..."
                      rows={8}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:w-1/2 p-6 overflow-y-auto flex-shrink-0">
            {/* Key Results */}
            {compoundData.principal > 0 && compoundData.annualRate > 0 && compoundData.years > 0 && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {compoundData.calculationType !== 'monthly-contributions' && (
                    <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                      <PiggyBank className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                        R{Math.round(results.lumpSum.futureValue).toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-300">Lump Sum Future Value</p>
                    </Card>
                  )}
                  {compoundData.calculationType !== 'lump-sum' && (
                    <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                      <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        R{Math.round(results.monthly.futureValue).toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-300">Monthly Contributions Value</p>
                    </Card>
                  )}
                </div>

                {/* Detailed Results */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Investment Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {compoundData.calculationType !== 'monthly-contributions' && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Lump Sum Investment</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Initial Investment:</span>
                            <span className="font-medium">R{compoundData.principal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Future Value:</span>
                            <span className="font-medium">R{Math.round(results.lumpSum.futureValue).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Interest Earned:</span>
                            <span className="font-medium text-green-600">R{Math.round(results.lumpSum.interest).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Effective Annual Rate:</span>
                            <span className="font-medium">{results.lumpSum.effectiveRate.toFixed(2)}%</span>
                          </div>
                          {compoundData.includeTax && (
                            <div className="flex justify-between border-t pt-2">
                              <span>After Tax Value:</span>
                              <span className="font-medium">R{Math.round(results.lumpSum.afterTax).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {compoundData.calculationType !== 'lump-sum' && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Monthly Contributions</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Initial + Contributions:</span>
                            <span className="font-medium">R{Math.round(results.monthly.totalContributions).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Future Value:</span>
                            <span className="font-medium">R{Math.round(results.monthly.futureValue).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Interest Earned:</span>
                            <span className="font-medium text-blue-600">R{Math.round(results.monthly.interest).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Growth Rate:</span>
                            <span className="font-medium">{results.monthly.monthlyGrowth.toFixed(2)}%</span>
                          </div>
                          {compoundData.includeTax && (
                            <div className="flex justify-between border-t pt-2">
                              <span>After Tax Value:</span>
                              <span className="font-medium">R{Math.round(results.monthly.afterTax).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Growth Chart */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Investment Growth Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                        <Legend />
                        {compoundData.calculationType !== 'monthly-contributions' && (
                          <Area type="monotone" dataKey="lumpSum" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Lump Sum" />
                        )}
                        {compoundData.calculationType !== 'lump-sum' && (
                          <>
                            <Area type="monotone" dataKey="contributed" stackId="2" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.4} name="Contributions" />
                            <Area type="monotone" dataKey="monthly" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Monthly Total" />
                          </>
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Interest vs Principal Chart */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Interest vs Principal Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={projectionData.slice(1)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                        <Legend />
                        {compoundData.calculationType !== 'monthly-contributions' && (
                          <Bar dataKey="lumpSumInterest" fill="#EA7A57" name="Lump Sum Interest" />
                        )}
                        {compoundData.calculationType !== 'lump-sum' && (
                          <Bar dataKey="monthlyInterest" fill="#10B981" name="Monthly Interest" />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Validation Messages */}
            {(compoundData.principal <= 0 || compoundData.annualRate <= 0 || compoundData.years <= 0) && (
              <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300">
                <div className="text-center">
                  <Target className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Complete Your Investment Setup</h3>
                  <div className="text-sm text-amber-600 dark:text-amber-300 space-y-1">
                    {compoundData.principal <= 0 && (
                      <p className="text-red-600">• Enter an initial principal amount</p>
                    )}
                    {compoundData.annualRate <= 0 && (
                      <p className="text-red-600">• Enter an annual interest rate</p>
                    )}
                    {compoundData.years <= 0 && (
                      <p className="text-red-600">• Enter the investment period in years</p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button 
                onClick={exportToCSV} 
                className="bg-orange-600 hover:bg-orange-700" 
                disabled={compoundData.principal <= 0 || compoundData.annualRate <= 0 || compoundData.years <= 0}
              >
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
                      This action will permanently delete all your compound interest calculation data. This cannot be undone.
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