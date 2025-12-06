import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, isSameDay, isToday } from 'date-fns'

const InterviewDateNavigation = ({ 
  viewMode, // 'week', 'day', 'custom'
  selectedDate, 
  onDateChange,
  onPrevious,
  onNext
}) => {
  
  if (viewMode === 'custom') {
    // No navigation in custom mode - user uses date pickers
    return null
  }

  if (viewMode === 'week') {
    // Week view: Show 7 days with navigation
    const weekStart = startOfWeek(selectedDate)
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="flex items-center gap-2 py-4">
        {/* Previous Week Button */}
        <button
          onClick={onPrevious}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
          title="Previous week"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Days of the week - Take full available width */}
        <div className="flex gap-2 flex-1">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate)
            const isTodayDate = isToday(day)
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : isTodayDate
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <div className="text-xs">{format(day, 'EEE')}</div>
                <div className="text-lg font-bold">{format(day, 'd')}</div>
              </button>
            )
          })}
        </div>

        {/* Next Week Button */}
        <button
          onClick={onNext}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
          title="Next week"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    )
  }

  if (viewMode === 'day') {
    // Day view: Show single day with navigation
    const isTodayDate = isToday(selectedDate)

    return (
      <div className="flex items-center justify-center space-x-4 py-4">
        {/* Previous Day Button */}
        <button
          onClick={onPrevious}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Previous day"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Current Day Display */}
        <div
          className={`
            px-6 py-3 rounded-lg text-center min-w-[280px]
            ${isTodayDate
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            }
          `}
        >
          <div className="text-sm font-medium">{format(selectedDate, 'EEEE')}</div>
          <div className="text-2xl font-bold">{format(selectedDate, 'MMMM d, yyyy')}</div>
          {isTodayDate && <div className="text-xs mt-1 opacity-90">Today</div>}
        </div>

        {/* Next Day Button */}
        <button
          onClick={onNext}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Next day"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    )
  }

  return null
}

export default InterviewDateNavigation
