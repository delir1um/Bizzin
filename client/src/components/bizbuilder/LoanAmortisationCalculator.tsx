import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, CreditCard, Download, Calendar, DollarSign, Percent, Clock, Calculator } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

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

export default function LoanAmortisationCalculator({ onClose }: LoanAmortisationCalculatorProps) {
  // Form inputs
  const [loanAmount, setLoanAmount] = useState<string>("200000")
  const [annualInterestRate, setAnnualInterestRate] = useState<string>("7.5")
  const [loanTermYears, setLoanTermYears] = useState<string>("6")
  const [paymentsPerYear, setPaymentsPerYear] = useState<string>("12")
  const [startDate, setStartDate] = useState<string>("2025-08-01")
  const [extraPayment, setExtraPayment] = useState<string>("0")
  const [lenderName, setLenderName] = useState<string>("")

  // Calculations
  const calculations = useMemo(() => {
    const principal = parseFloat(loanAmount) || 0
    const rate = (parseFloat(annualInterestRate) || 0) / 100
    const years = parseFloat(loanTermYears) || 0
    const paymentsYear = parseFloat(paymentsPerYear) || 12
    const extra = parseFloat(extraPayment) || 0
    
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
    const start = new Date(startDate)

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
  }, [loanAmount, annualInterestRate, loanTermYears, paymentsPerYear, startDate, extraPayment])

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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            Loan Amortisation Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loan Details</CardTitle>
                <CardDescription>Enter your loan information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="loanAmount">Loan Amount</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="200000"
                  />
                </div>

                <div>
                  <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={annualInterestRate}
                    onChange={(e) => setAnnualInterestRate(e.target.value)}
                    placeholder="7.5"
                  />
                </div>

                <div>
                  <Label htmlFor="loanTerm">Loan Period (Years)</Label>
                  <Input
                    id="loanTerm"
                    type="number"
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(e.target.value)}
                    placeholder="6"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentsPerYear">Payments Per Year</Label>
                  <Input
                    id="paymentsPerYear"
                    type="number"
                    value={paymentsPerYear}
                    onChange={(e) => setPaymentsPerYear(e.target.value)}
                    placeholder="12"
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="extraPayment">Optional Extra Payment</Label>
                  <Input
                    id="extraPayment"
                    type="number"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="lenderName">Lender Name (Optional)</Label>
                  <Input
                    id="lenderName"
                    type="text"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder="Bank Name"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Monthly Payment</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        ${calculations.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        ${calculations.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        ${(parseFloat(loanAmount) + calculations.totalInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            {calculations.chartData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Principal vs Interest</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={calculations.chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="payment" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, '']} />
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
                          <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Balance']} />
                          <Line type="monotone" dataKey="balance" stroke="#ff7300" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payment Schedule Table */}
            {calculations.schedule.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Payment Schedule</CardTitle>
                      <CardDescription>Detailed month-by-month breakdown</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Begin Balance</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Extra</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead>Interest</TableHead>
                          <TableHead>End Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calculations.schedule.map((entry) => (
                          <TableRow key={entry.paymentNumber}>
                            <TableCell>{entry.paymentNumber}</TableCell>
                            <TableCell>{entry.paymentDate.toLocaleDateString()}</TableCell>
                            <TableCell>${entry.beginningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>${entry.scheduledPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>${entry.extraPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>${entry.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>${entry.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>${entry.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close Calculator
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}