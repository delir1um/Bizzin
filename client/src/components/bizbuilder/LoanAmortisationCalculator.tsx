import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, CreditCard, Download, Calendar, DollarSign, Percent, Clock, Calculator, History } from "lucide-react"
// Dialog components removed - using custom modal instead
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { CalculationHistory } from "@/components/calculators/CalculationHistory"

interface LoanAmortisationCalculatorProps {
  onClose: () => void
}

interface PaymentEntry {
  paymentNumber: number
  paymentDate: Date
  beginningBalance: number
  scheduledPayment: number
  extraPayment: number
  totalPayment: number
  principal: number
  interest: number
  endingBalance: number
  cumulativeInterest: number
}

interface LoanData {
  loanAmount: string
  annualInterestRate: string
  loanTermYears: string
  paymentsPerYear: string
  startDate: string
  extraPayment: string
  lenderName: string
  notes: string
}

export default function LoanAmortisationCalculator({ onClose }: LoanAmortisationCalculatorProps) {
  const [activeTab, setActiveTab] = useState('setup')
  
  // Consolidated loan data state
  const [loanData, setLoanData] = useState<LoanData>({
    loanAmount: "200000",
    annualInterestRate: "7.5", 
    loanTermYears: "6",
    paymentsPerYear: "12",
    startDate: "2025-08-01",
    extraPayment: "0",
    lenderName: "",
    notes: ""
  })

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('loanAmortisationCalculator')
    if (saved) {
      try {
        setLoanData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved data:', error)
      }
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('loanAmortisationCalculator', JSON.stringify(loanData))
  }, [loanData])

  // Reset function
  const resetTool = () => {
    setLoanData({
      loanAmount: "200000",
      annualInterestRate: "7.5", 
      loanTermYears: "6",
      paymentsPerYear: "12",
      startDate: "2025-08-01",
      extraPayment: "0",
      lenderName: "",
      notes: ""
    })
    localStorage.removeItem('loanAmortisationCalculator')
  }

  // Load calculation function
  const loadCalculation = (data: Record<string, any>) => {
    setLoanData(data as LoanData)
    setActiveTab('setup')
  }

  // Calculations
  const calculations = useMemo(() => {
    const principal = parseFloat(loanData.loanAmount) || 0
    const rate = (parseFloat(loanData.annualInterestRate) || 0) / 100
    const years = parseFloat(loanData.loanTermYears) || 0
    const paymentsYear = parseFloat(loanData.paymentsPerYear) || 12
    const extra = parseFloat(loanData.extraPayment) || 0
    
    if (principal <= 0 || rate <= 0 || years <= 0 || paymentsYear <= 0) {
      return {
        monthlyPayment: 0,
        totalPayments: 0,
        totalInterest: 0,
        actualPayments: 0,
        schedule: [],
        chartData: []
      }
    }

    const monthlyRate = rate / paymentsYear
    const totalPayments = years * paymentsYear
    
    // Calculate monthly payment using standard amortisation formula
    // M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1)

    // Generate payment schedule
    const schedule: PaymentEntry[] = []
    const chartData: any[] = []
    let remainingBalance = principal
    let cumulativeInterest = 0
    let actualPaymentCount = 0
    const start = new Date(loanData.startDate)

    for (let i = 1; i <= totalPayments && remainingBalance > 0.01; i++) {
      const interestPayment = remainingBalance * monthlyRate
      let principalPayment = monthlyPayment - interestPayment
      let extraPmt = extra
      
      // Handle final payment and extra payments
      if (remainingBalance < monthlyPayment + extra) {
        principalPayment = remainingBalance - interestPayment
        extraPmt = 0
      } else if (remainingBalance < principalPayment + extra) {
        extraPmt = remainingBalance - principalPayment
      }
      
      const totalPmt = Math.min(monthlyPayment + extraPmt, remainingBalance + interestPayment)
      principalPayment = totalPmt - interestPayment
      
      const newBalance = Math.max(0, remainingBalance - principalPayment)
      cumulativeInterest += interestPayment
      
      // Calculate payment date
      const paymentDate = new Date(start)
      paymentDate.setMonth(start.getMonth() + (i - 1) * (12 / paymentsYear))
      
      schedule.push({
        paymentNumber: i,
        paymentDate,
        beginningBalance: remainingBalance,
        scheduledPayment: monthlyPayment,
        extraPayment: extraPmt,
        totalPayment: totalPmt,
        principal: principalPayment,
        interest: interestPayment,
        endingBalance: newBalance,
        cumulativeInterest
      })

      // Chart data (sample every 6 months for readability)
      if (i % Math.max(1, Math.floor(paymentsYear / 2)) === 0 || newBalance === 0) {
        chartData.push({
          payment: i,
          principal: principalPayment,
          interest: interestPayment,
          balance: newBalance,
          cumulativeInterest
        })
      }
      
      remainingBalance = newBalance
      actualPaymentCount = i
      
      if (remainingBalance <= 0.01) break
    }

    return {
      monthlyPayment,
      totalPayments: actualPaymentCount,
      totalInterest: cumulativeInterest,
      actualPayments: actualPaymentCount,
      schedule,
      chartData
    }
  }, [loanData.loanAmount, loanData.annualInterestRate, loanData.loanTermYears, loanData.paymentsPerYear, loanData.startDate, loanData.extraPayment])

  const handleExportCSV = () => {
    const headers = [
      'Payment #', 'Payment Date', 'Beginning Balance', 'Scheduled Payment', 
      'Extra Payment', 'Total Payment', 'Principal', 'Interest', 'Ending Balance', 'Cumulative Interest'
    ]
    
    const csvContent = [
      headers.join(','),
      ...calculations.schedule.map(entry => [
        entry.paymentNumber,
        entry.paymentDate.toLocaleDateString(),
        entry.beginningBalance.toFixed(2),
        entry.scheduledPayment.toFixed(2),
        entry.extraPayment.toFixed(2),
        entry.totalPayment.toFixed(2),
        entry.principal.toFixed(2),
        entry.interest.toFixed(2),
        entry.endingBalance.toFixed(2),
        entry.cumulativeInterest.toFixed(2)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `loan-amortisation-schedule-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-7xl min-h-screen sm:min-h-0 sm:max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 my-2 sm:my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Loan Amortisation Calculator</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">Compare loan options for equipment and expansion financing</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Left Panel - Setup */}
          <div className="flex-1 lg:w-1/2 p-4 sm:p-6 overflow-y-auto lg:border-r border-slate-200 dark:border-slate-700">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="setup">Loan Setup</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4">
                {/* Loan Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Loan Details</CardTitle>
                    <CardDescription>Configure your loan parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="loanAmount">Loan Amount (R)</Label>
                      <Input
                        id="loanAmount"
                        type="number"
                        value={loanData.loanAmount}
                        onChange={(e) => setLoanData(prev => ({ ...prev, loanAmount: e.target.value }))}
                        placeholder="200000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.01"
                        value={loanData.annualInterestRate}
                        onChange={(e) => setLoanData(prev => ({ ...prev, annualInterestRate: e.target.value }))}
                        placeholder="7.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="loanTerm">Loan Period (Years)</Label>
                      <Input
                        id="loanTerm"
                        type="number"
                        value={loanData.loanTermYears}
                        onChange={(e) => setLoanData(prev => ({ ...prev, loanTermYears: e.target.value }))}
                        placeholder="6"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentsPerYear">Payments Per Year</Label>
                      <Input
                        id="paymentsPerYear"
                        type="number"
                        value={loanData.paymentsPerYear}
                        onChange={(e) => setLoanData(prev => ({ ...prev, paymentsPerYear: e.target.value }))}
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={loanData.startDate}
                        onChange={(e) => setLoanData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="extraPayment">Optional Extra Payment (R)</Label>
                      <Input
                        id="extraPayment"
                        type="number"
                        value={loanData.extraPayment}
                        onChange={(e) => setLoanData(prev => ({ ...prev, extraPayment: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lenderName">Lender Name (Optional)</Label>
                      <Input
                        id="lenderName"
                        type="text"
                        value={loanData.lenderName}
                        onChange={(e) => setLoanData(prev => ({ ...prev, lenderName: e.target.value }))}
                        placeholder="Bank Name"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={resetTool} variant="outline" size="sm" className="flex-1">
                    Reset
                  </Button>
                  <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Calculation Notes</CardTitle>
                    <CardDescription>Add notes about this loan scenario</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                      placeholder="Add notes about this loan calculation, assumptions, or comparison notes..."
                      value={loanData.notes}
                      onChange={(e) => setLoanData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <CalculationHistory
                  calculatorType="loan_amortisation"
                  currentData={loanData}
                  onLoadCalculation={loadCalculation}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 lg:w-1/2 p-4 sm:p-6 overflow-y-auto flex-shrink-0">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Monthly Payment</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        R{calculations.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Total Payments</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {calculations.actualPayments}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Total Interest</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        R{calculations.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Total Cost</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        R{(parseFloat(loanData.loanAmount) + calculations.totalInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {calculations.chartData.length > 0 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Principal vs Interest Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={calculations.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="payment" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, '']} />
                          <Area type="monotone" dataKey="principal" stackId="1" stroke="#8884d8" fill="#8884d8" />
                          <Area type="monotone" dataKey="interest" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Remaining Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={calculations.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="payment" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => [`R${value.toLocaleString()}`, 'Balance']} />
                          <Line type="monotone" dataKey="balance" stroke="#ff7300" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
