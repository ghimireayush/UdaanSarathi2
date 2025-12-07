import { useState, useEffect, useRef } from 'react'
import { Search, Calendar } from 'lucide-react'
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import ScheduledInterviews from '../components/ScheduledInterviews'
import InterviewDateNavigation from '../components/InterviewDateNavigation'
import InterviewDataSource from '../api/datasources/InterviewDataSource.js'
import { jobService } from '../services/index.js'
import { useLanguage } from '../hooks/useLanguage'
import { useAgency } from '../contexts/AgencyContext.jsx'
import LanguageSwitch from '../components/LanguageSwitch'

const Interviews = () => {
  const { tPageSync } = useLanguage({ 
    pageName: 'interviews', 
    autoLoad: true 
  })
  const { agencyData } = useAgency()

  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  // Core state
  const [selectedJob, setSelectedJob] = useState('')
  const [jobs, setJobs] = useState([])
  const [interviews, setInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Mode state
  const [mode, setMode] = useState('contemporary') // 'contemporary' | 'calendar'
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  
  // Contemporary mode filters
  const [contemporaryFilter, setContemporaryFilter] = useState('all') // 'today', 'tomorrow', 'unattended', 'all'
  
  // Calendar mode filters
  const [calendarViewMode, setCalendarViewMode] = useState('week') // 'week', 'custom'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isDaySelected, setIsDaySelected] = useState(false) // Track if a specific day is selected
  const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' })

  // Stats
  const [stats, setStats] = useState({
    scheduled: 0,
    today: 0,
    unattended: 0,
    completed: 0
  })

  // Track scroll position to prevent jump on data reload
  const scrollPositionRef = useRef(0)
  const shouldPreserveScrollRef = useRef(false)

  // Load jobs on mount
  useEffect(() => {
    loadJobs()
  }, [])

  // Load interviews when job, mode, or filters change
  // Note: selectedDate is converted to string for proper dependency comparison
  useEffect(() => {
    console.log('🔄 Interviews useEffect triggered:', {
      selectedJob,
      mode,
      contemporaryFilter,
      calendarViewMode,
      selectedDate: format(selectedDate, 'yyyy-MM-dd'),
      isDaySelected,
      customDateRange
    })
    loadInterviews()
  }, [selectedJob, mode, contemporaryFilter, calendarViewMode, format(selectedDate, 'yyyy-MM-dd'), isDaySelected, customDateRange.from, customDateRange.to])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadInterviews()
      }
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const loadJobs = async () => {
    try {
      const jobsData = await jobService.getJobs({ status: 'published' })
      // Ensure jobsData is always an array
      const safeJobsData = Array.isArray(jobsData) ? jobsData : []
      setJobs(safeJobsData)
    } catch (error) {
      console.error('Failed to load jobs:', error)
      setJobs([])
    }
  }

  const loadInterviews = async () => {
    if (!agencyData?.license_number) return
    
    try {
      // Save current scroll position before loading
      if (shouldPreserveScrollRef.current) {
        scrollPositionRef.current = window.scrollY
      }
      
      setIsLoading(true)
      
      // Build filter params based on mode
      const filterParams = {
        search: searchQuery,
        page: 1,
        limit: 100
      }
        
      if (mode === 'contemporary') {
        // Contemporary mode: use interview_filter (today, tomorrow, unattended, all)
        filterParams.interview_filter = contemporaryFilter
      } else if (mode === 'calendar') {
        // Calendar mode: use date ranges
        if (calendarViewMode === 'week') {
          if (isDaySelected) {
            // A specific day is selected: show only that day
            const dayStr = format(selectedDate, 'yyyy-MM-dd')
            filterParams.date_from = dayStr
            filterParams.date_to = dayStr
          } else {
            // No specific day selected: show the entire week
            const weekStart = startOfWeek(selectedDate)
            const weekEnd = endOfWeek(selectedDate)
            filterParams.date_from = format(weekStart, 'yyyy-MM-dd')
            filterParams.date_to = format(weekEnd, 'yyyy-MM-dd')
          }
        } else if (calendarViewMode === 'custom' && customDateRange.from && customDateRange.to) {
          // Custom range: use user-selected dates
          filterParams.date_from = customDateRange.from
          filterParams.date_to = customDateRange.to
        }
      }
      
      console.log('Loading interviews with filters:', filterParams)
      
      // ✅ Use new agency-level endpoint (works with or without job selection)
      const response = await InterviewDataSource.getInterviewsForAgency(
        agencyData.license_number,
        {
          ...filterParams,
          job_id: selectedJob || undefined // Optional: filter by job if selected
        }
      )
      
      const interviewsData = (response.candidates || []).map(candidate => ({
        ...candidate,
        interview: candidate.interview || null
      }))
      
      console.log('✅ Received interviews:', {
        count: interviewsData.length,
        dateRange: filterParams.date_from && filterParams.date_to 
          ? `${filterParams.date_from} to ${filterParams.date_to}`
          : 'No date filter',
        sampleDates: interviewsData.slice(0, 3).map(c => c.interview?.scheduled_at)
      })
      
      setInterviews(interviewsData)
      
      // Load stats
      await loadStats()
      
      // Restore scroll position after data loads
      if (shouldPreserveScrollRef.current) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPositionRef.current)
          shouldPreserveScrollRef.current = false
        })
      }
    } catch (error) {
      console.error('Failed to load interviews:', error)
      alert(`Failed to load interviews: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    if (!agencyData?.license_number) return
    
    try {
      // ✅ Use new agency-level stats endpoint (aggregates across all jobs)
      const response = await InterviewDataSource.getAgencyInterviewStats(
        agencyData.license_number,
        'all'
      )
      
      setStats({
        scheduled: response.total_scheduled || 0,
        today: response.today || 0,
        unattended: response.unattended || 0,
        completed: response.completed || 0
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleJobSelect = (jobId) => {
    setSelectedJob(jobId)
    // Don't reset filters when job changes - keep them active
  }

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter)
  }

  // Date navigation handlers
  const handleDateChange = (newDate) => {
    console.log('📅 Date clicked:', format(newDate, 'yyyy-MM-dd'))
    setSelectedDate(newDate)
    setIsDaySelected(true) // Mark that a specific day is selected
  }

  const handlePrevious = () => {
    console.log('⬅️ Previous week clicked')
    if (calendarViewMode === 'week') {
      shouldPreserveScrollRef.current = true // Preserve scroll on week change
      setSelectedDate(prev => {
        const newDate = subWeeks(prev, 1)
        console.log('📅 Moving to previous week:', format(newDate, 'yyyy-MM-dd'))
        return newDate
      })
      setIsDaySelected(false) // Clear day selection, show whole week
    }
  }

  const handleNext = () => {
    console.log('➡️ Next week clicked')
    if (calendarViewMode === 'week') {
      shouldPreserveScrollRef.current = true // Preserve scroll on week change
      setSelectedDate(prev => {
        const newDate = addWeeks(prev, 1)
        console.log('📅 Moving to next week:', format(newDate, 'yyyy-MM-dd'))
        return newDate
      })
      setIsDaySelected(false) // Clear day selection, show whole week
    }
  }

  const clearDateFilter = () => {
    setCalendarViewMode('week')
    setSelectedDate(new Date())
    setCustomDateRange({ from: '', to: '' })
  }

  if (isLoading && interviews.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tPage('title') || 'Interview Management'}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {tPage('subtitle') || 'Manage and schedule candidate interviews'}
          </p>
        </div>
        <LanguageSwitch />
      </div>

      {/* Stats - At the top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{tPage('stats.todaysInterviews') || 'Today'}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.today}</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{tPage('stats.totalScheduled') || 'Scheduled'}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.scheduled}</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{tPage('stats.unattended') || 'Unattended'}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.unattended}</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{tPage('stats.completed') || 'Completed'}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completed}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Common Filters: Job and Search - Above tabs */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tPage('filters.filterByJob') || 'Filter by Job'}
            </label>
            <select
              value={selectedJob}
              onChange={(e) => handleJobSelect(e.target.value)}
              className="form-select"
            >
              <option value="">{tPage('filters.allJobs') || 'All Jobs'}</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tPage('filters.searchCandidate') || 'Search Candidate'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={tPage('filters.searchPlaceholder') || 'Search by name, email, phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Contemporary | Calendar */}
      <div className="card mb-6">
        {/* Tab Headers */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setMode('contemporary')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                mode === 'contemporary'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Contemporary
            </button>
            <button
              onClick={() => setMode('calendar')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                mode === 'calendar'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-4">
          {/* Contemporary Mode Content */}
          {mode === 'contemporary' && (
            <div>
              {/* Contemporary filters are in ScheduledInterviews component */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tPage('filters.useTabsHint') || 'Use the tabs below to filter by Today, Tomorrow, Unattended, or All interviews.'}
              </p>
            </div>
          )}

          {/* Calendar Mode Content */}
          {mode === 'calendar' && (
        <div className="card p-4 mb-6">
          <div className="space-y-4">
            {/* Calendar View Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCalendarViewMode('week')
                    setCustomDateRange({ from: '', to: '' })
                  }}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    calendarViewMode === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Week View
                </button>
                <button
                  onClick={() => {
                    // Prefill custom range with current week's dates
                    const weekStart = startOfWeek(selectedDate)
                    const weekEnd = endOfWeek(selectedDate)
                    setCustomDateRange({
                      from: format(weekStart, 'yyyy-MM-dd'),
                      to: format(weekEnd, 'yyyy-MM-dd')
                    })
                    setCalendarViewMode('custom')
                    setIsDaySelected(false) // Clear day selection
                  }}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    calendarViewMode === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Custom Range
                </button>
              </div>
            </div>

            {/* Week Navigation (only shown in week mode) */}
            {calendarViewMode === 'week' && (
              <div>
                <InterviewDateNavigation
                  viewMode="week"
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                />
              </div>
            )}

            {/* Custom Date Range Inputs (only shown in custom mode) */}
            {calendarViewMode === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customDateRange.from}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={customDateRange.to}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, to: e.target.value }))}
                  min={customDateRange.from}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                {customDateRange.from && customDateRange.to && (
                  <button
                    onClick={() => setCustomDateRange({ from: '', to: '' })}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
          )}
        </div>
      </div>

      {/* Interviews List */}
      <ScheduledInterviews
        candidates={interviews}
        jobId={selectedJob}
        currentFilter={mode === 'contemporary' ? contemporaryFilter : 'all'}
        onFilterChange={(filter) => {
          console.log('📍 onFilterChange called:', { mode, filter, currentFilter: contemporaryFilter })
          if (mode === 'contemporary') {
            console.log('✅ Setting contemporaryFilter to:', filter)
            setContemporaryFilter(filter)
          } else {
            console.log('⚠️ Not in contemporary mode, ignoring filter change')
          }
        }}
        onDataReload={loadInterviews}
        showFilters={mode === 'contemporary'}
      />
    </div>
  )
}

export default Interviews
