import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from "date-fns"
import type { JournalEntry } from "@/types/journal"

interface CalendarViewProps {
  entries: JournalEntry[]
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  onCreateEntry: () => void
}

export function CalendarView({ entries, selectedDate, onDateSelect, onCreateEntry }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get entries for each day
  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => 
      isSameDay(new Date(entry.created_at), date)
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onDateSelect(today)
  }

  return (
    <Card className="bg-white dark:bg-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map(date => {
            const dayEntries = getEntriesForDate(date)
            const hasEntries = dayEntries.length > 0
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const isTodayDate = isToday(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`
                  relative p-2 h-12 text-sm rounded-lg transition-colors
                  ${isSelected 
                    ? 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200' 
                    : isTodayDate
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200'
                      : hasEntries
                        ? 'bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'
                  }
                  ${!isSameMonth(date, currentMonth) ? 'opacity-30' : ''}
                `}
              >
                <span className="block">{format(date, 'd')}</span>
                {hasEntries && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className={`
                      w-1.5 h-1.5 rounded-full
                      ${dayEntries.length === 1 ? 'bg-orange-400' : 'bg-orange-600'}
                    `} />
                    {dayEntries.length > 1 && (
                      <div className="absolute -right-1 -top-1">
                        <Badge variant="secondary" className="text-xs h-4 px-1 bg-orange-100 text-orange-800">
                          {dayEntries.length}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg text-slate-900 dark:text-white">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {getEntriesForDate(selectedDate).length} {getEntriesForDate(selectedDate).length === 1 ? 'entry' : 'entries'} for this date
                </p>
              </div>
              <Button
                onClick={onCreateEntry}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}