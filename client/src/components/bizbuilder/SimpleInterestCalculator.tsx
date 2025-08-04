import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { X, Download, Calculator, DollarSign, Calendar, TrendingUp, Target } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts"


interface SimpleInterestData {
  principal: number
  annualRate: number
  termYears: number
  includeTax: boolean
  taxRate: number
  notes: string
}

export default function SimpleInterestCalculator({ onClose }: { onClose: () => void }) {
  const [interestData, setInterestData] = useState<SimpleInterestData>({
    principal: 25000,
    annualRate: 15,
    termYears: 3,
    includeTax: false,
    taxRate: 20,
    notes: ''
  })

  const [activeTab, setActiveTab] = useState('setup')

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('simpleInterestCalculator')
    if (saved) {
      try {
        setInterestData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved data:', error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('simpleInterestCalculator', JSON.stringify(interestData))
  }, [interestData])

  // Excel FV function implementation: FV(rate, nper, pmt, pv, type)
  // For simple interest with monthly compounding: FV(monthly_rate, months, 0, -principal, 1)
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

  // Calculate simple interest results based on Excel formula
  const calculateResults = () => {
    const annualRate = interestData.annualRate / 100
    const monthlyRate = annualRate / 12
    const months = interestData.termYears * 12

    // Simple interest calculation using Excel FV formula with type=1 (annuity due)
    // FV(monthly_rate, months, 0, -principal, 1)
    const futureValue = calculateFV(monthlyRate, months, 0, -interestData.principal, 1)
    const totalInterest = futureValue - interestData.principal

    // Tax calculations
    const interestAfterTax = interestData.includeTax 
      ? totalInterest - (totalInterest * interestData.taxRate / 100)
      : totalInterest
    
    const futureValueAfterTax = interestData.principal + interestAfterTax

    // Simple interest rate for comparison
    const simpleInterestAmount = interestData.principal * annualRate * interestData.termYears
    const simpleInterestFV = interestData.principal + simpleInterestAmount

    return {
      futureValue,
      totalInterest,
      monthlyRate: monthlyRate * 100,
      effectiveAnnualRate: ((futureValue / interestData.principal) ** (1 / interestData.termYears) - 1) * 100,
      afterTax: {
        interest: interestAfterTax,
        futureValue: futureValueAfterTax
      },
      comparison: {
        simpleInterest: simpleInterestAmount,
        simpleFV: simpleInterestFV,
        monthlyCompoundAdvantage: futureValue - simpleInterestFV
      }
    }
  }

  // Generate month-by-month projection data
  const generateProjectionData = () => {
    const projectionData = []
    const annualRate = interestData.annualRate / 100
    const monthlyRate = annualRate / 12
    const totalMonths = interestData.termYears * 12

    for (let month = 0; month <= totalMonths; month++) {
      // Monthly compounding using FV formula
      const monthlyCompoundValue = month === 0 ? interestData.principal : 
        calculateFV(monthlyRate, month, 0, -interestData.principal, 1)

      // Simple interest for comparison
      const simpleInterestValue = interestData.principal + 
        (interestData.principal * annualRate * (month / 12))

      const interest = monthlyCompoundValue - interestData.principal
      const simpleInterest = simpleInterestValue - interestData.principal

      projectionData.push({
        month,
        year: month / 12,
        monthlyCompound: monthlyCompoundValue,
        simpleInterest: simpleInterestValue,
        interest,
        simpleInterestOnly: simpleInterest,
        advantage: monthlyCompoundValue - simpleInterestValue
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
    csvData.push(['SIMPLE INTEREST CALCULATION REPORT'])
    csvData.push(['Generated on:', new Date().toLocaleDateString()])
    csvData.push(['Interest Calculation Report'])
    csvData.push([]) // Empty row
    
    // Investment parameters
    csvData.push(['INVESTMENT PARAMETERS'])
    csvData.push(['Principal Amount:', `R${interestData.principal.toLocaleString()}`])
    csvData.push(['Annual Interest Rate:', `${interestData.annualRate}%`])
    csvData.push(['Monthly Interest Rate:', `${results.monthlyRate.toFixed(4)}%`])
    csvData.push(['Term:', `${interestData.termYears} years (${interestData.termYears * 12} months)`])
    
    if (interestData.includeTax) {
      csvData.push(['Tax Rate on Interest:', `${interestData.taxRate}%`])
    }
    csvData.push([]) // Empty row
    
    // Results
    csvData.push(['CALCULATION RESULTS'])
    csvData.push(['Monthly Compounding Method:'])
    csvData.push(['Future Value:', `R${results.futureValue.toLocaleString()}`])
    csvData.push(['Total Interest Earned:', `R${results.totalInterest.toLocaleString()}`])
    csvData.push(['Effective Annual Rate:', `${results.effectiveAnnualRate.toFixed(2)}%`])
    
    if (interestData.includeTax) {
      csvData.push(['Interest After Tax:', `R${results.afterTax.interest.toLocaleString()}`])
      csvData.push(['Future Value After Tax:', `R${results.afterTax.futureValue.toLocaleString()}`])
    }
    csvData.push([]) // Empty row
    
    // Comparison
    csvData.push(['COMPARISON WITH SIMPLE INTEREST'])
    csvData.push(['Simple Interest Method:', `R${results.comparison.simpleInterest.toLocaleString()}`])
    csvData.push(['Simple Interest Future Value:', `R${results.comparison.simpleFV.toLocaleString()}`])
    csvData.push(['Monthly Compounding Advantage:', `R${results.comparison.monthlyCompoundAdvantage.toLocaleString()}`])
    csvData.push([]) // Empty row
    
    // Month-by-month projection
    csvData.push(['MONTH-BY-MONTH PROJECTION'])
    csvData.push(['Month', 'Year', 'Monthly Compound Value', 'Simple Interest Value', 'Compound Interest', 'Simple Interest Only', 'Advantage'])
    
    projectionData.forEach(data => {
      csvData.push([
        data.month.toString(),
        data.year.toFixed(2),
        `R${data.monthlyCompound.toLocaleString()}`,
        `R${data.simpleInterest.toLocaleString()}`,
        `R${data.interest.toLocaleString()}`,
        `R${data.simpleInterestOnly.toLocaleString()}`,
        `R${data.advantage.toLocaleString()}`
      ])
    })
    
    // Add notes if present
    if (interestData.notes.trim()) {
      csvData.push([]) // Empty row
      csvData.push(['NOTES'])
      csvData.push([interestData.notes])
    }
    
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simple-interest-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetTool = () => {
    setInterestData({
      principal: 25000,
      annualRate: 15,
      termYears: 3,
      includeTax: false,
      taxRate: 20,
      notes: ''
    })
    setActiveTab('setup')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Simple Interest Calculator</h2>
            <p className="text-slate-600 dark:text-slate-300">Calculate simple interest with monthly compounding for loans and investments</p>
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="tax">Tax & Advanced</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4">
                {/* Business Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Investment Details</CardTitle>
                    <CardDescription>Enter your simple interest calculation information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">

                  </CardContent>
                </Card>

                {/* Investment Parameters */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Interest Calculation Parameters</CardTitle>
                    <CardDescription>Set your principal, rate, and term</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Principal Amount (R)</Label>
                      <Input
                        type="number"
                        value={interestData.principal}
                        onChange={(e) => setInterestData(prev => ({ ...prev, principal: parseFloat(e.target.value) || 0 }))}
                        placeholder="25000"
                        step="100"
                      />
                      <p className="text-xs text-slate-500 mt-1">Initial amount invested or borrowed</p>
                    </div>
                    <div>
                      <Label>Annual Interest Rate (%)</Label>
                      <Input
                        type="number"
                        value={interestData.annualRate}
                        onChange={(e) => setInterestData(prev => ({ ...prev, annualRate: parseFloat(e.target.value) || 0 }))}
                        placeholder="15.0"
                        step="0.1"
                      />
                      <p className="text-xs text-slate-500 mt-1">Monthly rate: {(interestData.annualRate / 12).toFixed(4)}%</p>
                    </div>
                    <div>
                      <Label>Term (Years)</Label>
                      <Input
                        type="number"
                        value={interestData.termYears}
                        onChange={(e) => setInterestData(prev => ({ ...prev, termYears: parseFloat(e.target.value) || 0 }))}
                        placeholder="3"
                        step="0.5"
                        min="0.1"
                        max="50"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {interestData.termYears * 12} months total
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Use Cases */}
                <Card className="border-green-300 bg-green-50 dark:bg-green-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-800 dark:text-green-200">
                      Common Business Applications
                    </CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-300">
                      Perfect for these financial scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
                      <p>• Short-term business loans and credit facilities</p>
                      <p>• Quick investment return calculations</p>
                      <p>• Supplier payment terms analysis</p>
                      <p>• Cash flow planning with interest costs</p>
                      <p>• Comparing loan offers from different banks</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tax" className="space-y-4">
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
                        checked={interestData.includeTax}
                        onChange={(e) => setInterestData(prev => ({ ...prev, includeTax: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="includeTax">Include tax on interest earnings</Label>
                    </div>
                    {interestData.includeTax && (
                      <div>
                        <Label>Tax Rate on Interest (%)</Label>
                        <Input
                          type="number"
                          value={interestData.taxRate}
                          onChange={(e) => setInterestData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
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

                {/* Interest vs Compound Comparison */}
                <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
                      Simple vs Compound Interest
                    </CardTitle>
                    <CardDescription className="text-amber-600 dark:text-amber-300">
                      Understanding the calculation methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                      <p><strong>Simple Interest:</strong> Principal × Rate × Time</p>
                      <p><strong>Monthly Compounding:</strong> Interest calculated monthly and added to principal</p>
                      <p><strong>Best for:</strong> Short-term loans, quick calculations, basic planning</p>
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
                      value={interestData.notes}
                      onChange={(e) => setInterestData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes about loan terms, investment assumptions, risk factors, or other important details..."
                      rows={8}
                      className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            {/* Key Results */}
            {interestData.principal > 0 && interestData.annualRate > 0 && interestData.termYears > 0 && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                      R{Math.round(results.futureValue).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-300">Future Value</p>
                  </Card>
                  <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                      R{Math.round(results.totalInterest).toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Total Interest</p>
                  </Card>
                </div>

                {/* Detailed Results */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Interest Calculation Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Monthly Compounding Method</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Principal Amount:</span>
                          <span className="font-medium">R{interestData.principal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Interest Rate:</span>
                          <span className="font-medium">{results.monthlyRate.toFixed(4)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Term:</span>
                          <span className="font-medium">{interestData.termYears} years ({interestData.termYears * 12} months)</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Future Value:</span>
                          <span className="font-medium">R{Math.round(results.futureValue).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Interest:</span>
                          <span className="font-medium text-green-600">R{Math.round(results.totalInterest).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Effective Annual Rate:</span>
                          <span className="font-medium">{results.effectiveAnnualRate.toFixed(2)}%</span>
                        </div>
                        {interestData.includeTax && (
                          <>
                            <div className="flex justify-between border-t pt-2">
                              <span>Interest After Tax:</span>
                              <span className="font-medium">R{Math.round(results.afterTax.interest).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Future Value After Tax:</span>
                              <span className="font-medium">R{Math.round(results.afterTax.futureValue).toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Comparison */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">Comparison with Simple Interest</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Simple Interest Method:</span>
                          <span className="font-medium">R{Math.round(results.comparison.simpleInterest).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Simple Interest Future Value:</span>
                          <span className="font-medium">R{Math.round(results.comparison.simpleFV).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span>Monthly Compounding Advantage:</span>
                          <span className="font-medium text-green-600">
                            R{Math.round(results.comparison.monthlyCompoundAdvantage).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Growth Chart */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Interest Growth Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                        <Legend />
                        <Line type="monotone" dataKey="monthlyCompound" stroke="#10B981" strokeWidth={2} name="Monthly Compounding" />
                        <Line type="monotone" dataKey="simpleInterest" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" name="Simple Interest" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Monthly Interest Chart */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Interest Earned Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                        <Legend />
                        <Area type="monotone" dataKey="interest" stackId="1" stroke="#EA7A57" fill="#EA7A57" fillOpacity={0.6} name="Monthly Compound Interest" />
                        <Area type="monotone" dataKey="simpleInterestOnly" stackId="2" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.4} name="Simple Interest" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Validation Messages */}
            {(interestData.principal <= 0 || interestData.annualRate <= 0 || interestData.termYears <= 0) && (
              <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-300">
                <div className="text-center">
                  <Target className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">Complete Your Interest Calculation</h3>
                  <div className="text-sm text-amber-600 dark:text-amber-300 space-y-1">
                    {interestData.principal <= 0 && (
                      <p className="text-red-600">• Enter a principal amount</p>
                    )}
                    {interestData.annualRate <= 0 && (
                      <p className="text-red-600">• Enter an annual interest rate</p>
                    )}
                    {interestData.termYears <= 0 && (
                      <p className="text-red-600">• Enter the term in years</p>
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
                disabled={interestData.principal <= 0 || interestData.annualRate <= 0 || interestData.termYears <= 0}
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
                      This action will permanently delete all your simple interest calculation data. This cannot be undone.
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