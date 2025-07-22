import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Calendar } from "lucide-react"
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from "date-fns"

interface DateFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilter: (startDate: string, endDate: string, label: string) => void
  onClearFilter: () => void
}

export function DateFilterModal({ isOpen, onClose, onApplyFilter, onClearFilter }: DateFilterModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const today = new Date()
  
  const quickFilters = [
    {
      label: "Today",
      startDate: startOfDay(today),
      endDate: endOfDay(today)
    },
    {
      label: "Last 7 days",
      startDate: startOfDay(subDays(today, 7)),
      endDate: endOfDay(today)
    },
    {
      label: "Last 2 weeks",
      startDate: startOfDay(subWeeks(today, 2)),
      endDate: endOfDay(today)
    },
    {
      label: "Last month",
      startDate: startOfDay(subMonths(today, 1)),
      endDate: endOfDay(today)
    },
    {
      label: "Last 3 months",
      startDate: startOfDay(subMonths(today, 3)),
      endDate: endOfDay(today)
    }
  ]

  const handleQuickFilter = (filter: typeof quickFilters[0]) => {
    onApplyFilter(
      filter.startDate.toISOString(),
      filter.endDate.toISOString(),
      filter.label
    )
    onClose()
  }

  const handleCustomFilter = () => {
    if (startDate && endDate) {
      const start = startOfDay(new Date(startDate))
      const end = endOfDay(new Date(endDate))
      
      if (start <= end) {
        onApplyFilter(
          start.toISOString(),
          end.toISOString(),
          `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`
        )
        onClose()
      }
    }
  }

  const handleClearFilter = () => {
    onClearFilter()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filter by Date
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Filters */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Quick Filters
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.label}
                  variant="outline"
                  onClick={() => handleQuickFilter(filter)}
                  className="justify-start hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-900/20"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Custom Date Range
            </h4>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClearFilter}
              className="text-slate-600 hover:text-slate-800"
            >
              Clear Filter
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCustomFilter}
                disabled={!startDate || !endDate}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}