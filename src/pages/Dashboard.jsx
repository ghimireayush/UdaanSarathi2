import { useState, useEffect, useMemo, useRef } from 'react'

import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  Briefcase, 
  AlertCircle, 
  Shield,
  FileText,
  Activity,
  BarChart3,
  RefreshCw,
  Bell,
  ChevronDown,
  Search
} from 'lucide-react'

import dashboardApi from '../api/dashboardApi.js'
import countryService from '../services/countryService.js'
import DateDisplay from '../components/DateDisplay.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { PERMISSIONS } from '../services/authService.js'
import PermissionGuard from '../components/PermissionGuard.jsx'
import { InteractiveCard, InteractiveButton, InteractiveDropdown, InteractiveLoader } from '../components/InteractiveUI'
import DateRangePicker from '../components/DateRangePicker.jsx'
import LanguageSwitch from '../components/LanguageSwitch.jsx'
import { useLanguage } from '../hooks/useLanguage'

import { useNotificationContext } from '../contexts/NotificationContext'
import LoadingScreen from '../components/LoadingScreen'

// UI helpers (progress ring + mini bar) --------------------------------------
const ProgressRing = ({ completed, total, size = 88, stroke = 8, color = '#eab308' }) => {
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, total ? completed / total : 0))
  const dash = circ * pct
  return (
    <svg width={size} height={size} className="overflow-visible">
      <circle cx={size/2} cy={size/2} r={radius} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-gray-900 text-sm font-semibold">
        {completed}/{total}
      </text>
    </svg>
  )
}

const MiniBarChart = ({ passed = 0, failed = 0, pending = 0, tPage }) => {
  const max = Math.max(1, passed, failed, pending)
  const bars = [
    { label: tPage('chart.passed'), value: passed, color: 'fill-green-500' },
    { label: tPage('chart.failed'), value: failed, color: 'fill-red-500' },
    { label: tPage('chart.pending'), value: pending, color: 'fill-yellow-500' },
  ]
  return (
    <div className="flex items-end gap-3 h-20">
      {bars.map(b => (
        <div key={b.label} className="flex flex-col items-center">
          <svg width="16" height="72" className="overflow-visible">
            <rect x="3" y={70 - (b.value/max)*66} width="10" height={(b.value/max)*66} className={`${b.color}`} rx="2" />
          </svg>
          <span className="text-[10px] text-gray-500 mt-1">{b.label}</span>
        </div>
      ))}
    </div>
  )
}

const Dashboard = () => {

  const navigate = useNavigate()
  const { user, isAdmin, isRecipient, isCoordinator } = useAuth()
  const { success } = useNotificationContext()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const profileRef = useRef(null)
  const notifRef = useRef(null)
  const { locale, tPageSync, loadPageTranslations, isLoading: languageLoading } = useLanguage({ 
    pageName: 'dashboard', 
    autoLoad: true 
  })

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  // Redirect owner without agency to setup page
  useEffect(() => {
    const isOwner = user?.role === 'agency_owner' || user?.role === 'owner' || user?.userType === 'owner'
    if (isOwner && !user?.agencyId && !user?.agency_id) {
      navigate('/setup-company', { replace: true })
    }
  }, [user, navigate])

  const [filters, setFilters] = useState({
    timeWindow: 'Week',
    job: 'All Jobs',
    country: 'All Countries',
    customStartDate: '',
    customEndDate: ''
  })
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  const [analytics, setAnalytics] = useState({})
  const [countries, setCountries] = useState([])
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Fetch real-time analytics data
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      
      // Calculate date range based on time window
      let startDate = null
      let endDate = null
      
      if (filters.timeWindow === 'Custom' && filters.customStartDate && filters.customEndDate) {
        startDate = filters.customStartDate
        endDate = filters.customEndDate
      } else if (filters.timeWindow === 'Today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        startDate = today.toISOString()
        endDate = new Date().toISOString()
      } else if (filters.timeWindow === 'Week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        startDate = weekAgo.toISOString()
        endDate = new Date().toISOString()
      } else if (filters.timeWindow === 'Month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        startDate = monthAgo.toISOString()
        endDate = new Date().toISOString()
      }
      
      // Prepare API parameters
      const apiParams = {}
      if (startDate) apiParams.startDate = startDate
      if (endDate) apiParams.endDate = endDate
      if (filters.country && filters.country !== 'All Countries') {
        apiParams.country = filters.country
      }
      if (filters.job && filters.job !== 'All Jobs') {
        apiParams.jobId = filters.job
      }

      // Fetch data in parallel
      const [analyticsData, allCountries] = await Promise.all([
        dashboardApi.getAnalytics(apiParams),
        countryService.getCountryNames()
      ])
      
      // Validate response
      if (!analyticsData || !analyticsData.jobs || !analyticsData.applications || !analyticsData.interviews) {
        throw new Error('Invalid response from server')
      }
      
      // Map backend data to frontend structure
      const calculatedAnalytics = {
        jobs: {
          total: analyticsData.jobs.total || 0,
          open: analyticsData.jobs.active || 0,
          recent: analyticsData.jobs.recentInRange || 0,
          drafts: analyticsData.jobs.drafts || 0,
          // NEW: Time-scoped metrics for enhanced dashboard
          openInTimeframe: analyticsData.jobs.openInTimeframe || 0,
          createdInTimeframe: analyticsData.jobs.createdInTimeframe || 0,
          draftInTimeframe: analyticsData.jobs.draftInTimeframe || 0
        },
        applications: {
          applicants: analyticsData.applications.total || 0,
          jobsApplied: analyticsData.applications.uniqueJobs || 0,
          // Use time-scoped data if available, fallback to current status
          shortlisted: analyticsData.applications.byStatusInTimeframe?.shortlisted || 
                       analyticsData.applications.byStatus?.shortlisted || 0,
          selected: analyticsData.applications.byStatusInTimeframe?.passed || 
                    analyticsData.applications.byStatus?.interview_passed || 0,
          interviewed: analyticsData.applications.byStatusInTimeframe?.interview || 
                       ((analyticsData.applications.byStatus?.interview_scheduled || 0) + 
                        (analyticsData.applications.byStatus?.interview_passed || 0) + 
                        (analyticsData.applications.byStatus?.interview_failed || 0)),
          // NEW: Time-scoped status changes
          appliedInTimeframe: analyticsData.applications.byStatusInTimeframe?.applied || 0
        },
        interviews: {
          weeklyPending: analyticsData.interviews.pending || 0,
          weeklyTotal: analyticsData.interviews.total || 0,
          todayCompleted: analyticsData.interviews.completed || 0,
          todayTotal: analyticsData.interviews.total || 0,
          monthlyInterviewed: analyticsData.interviews.completed || 0,
          monthlyPass: analyticsData.interviews.passed || 0,
          monthlyFail: analyticsData.interviews.failed || 0,
          // NEW: Pass rate and today's status for real-time insights
          passRate: analyticsData.interviews.passRate || 0,
          todayPass: analyticsData.interviews.todayStatus?.pass || 0,
          todayFail: analyticsData.interviews.todayStatus?.fail || 0
        },
        stageCounts: {
          applied: analyticsData.applications.byStatus?.applied || 0,
          shortlisted: analyticsData.applications.byStatus?.shortlisted || 0,
          'interview-scheduled': analyticsData.applications.byStatus?.interview_scheduled || 0,
          'interview-passed': analyticsData.applications.byStatus?.interview_passed || 0
        }
      }
      
      setAnalytics(calculatedAnalytics)
      
      // Use availableCountries from API (countries where agency has jobs)
      // But also include all countries for filtering
      const agencyCountries = analyticsData.availableCountries || []
      setCountries(agencyCountries.length > 0 ? agencyCountries : allCountries)
      
      setJobs(analyticsData.availableJobs || [])
      setLastUpdated(new Date())
      
      if (showRefreshIndicator) {
        success(tPage('success.dashboardUpdated'), tPage('success.dataRefreshed'))
      }
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true)
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Loading state
  if (isLoading) {
    return <LoadingScreen />
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{tPage('error.failedToLoad')}</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary py-3 px-6 text-base font-semibold"
          >
            {tPage('error.retry')}
          </button>
        </div>
      </div>
    )
  }

  const InteractiveMetricCard = ({ title, icon: Icon, metrics, className = "", color = "primary", onClick, tooltip, tooltipPosition = "right" }) => {
    const [showTooltip, setShowTooltip] = useState(false)
    const hasFullHeight = className.includes('h-full')
    
    return (
      <div className={`relative ${hasFullHeight ? 'h-full' : ''}`}>
        <InteractiveCard 
          hoverable 
          clickable={!!onClick}
          onClick={onClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`p-5 ${className} transition-all duration-300 hover:scale-105 ${
            color === 'info' ? 'border-l-4 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30' :
            color === 'success' ? 'border-l-4 border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30' :
            color === 'warning' ? 'border-l-4 border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/30' :
            'border-l-4 border-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/30'
          }`}
        >
          {/* Header with Icon and Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl shadow-sm ${
                color === 'info' ? 'bg-blue-500 text-white' :
                color === 'success' ? 'bg-green-500 text-white' :
                color === 'warning' ? 'bg-yellow-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
            </div>
            {tooltip && (
              <AlertCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          
          {/* Main Metric */}
          <div className="mb-4">
            {metrics.filter(m => m.highlight).map((metric, index) => (
              <div key={index} className="text-center">
                <div className={`text-4xl font-black mb-1 ${
                  color === 'info' ? 'text-blue-700 dark:text-blue-300' :
                  color === 'success' ? 'text-green-700 dark:text-green-300' :
                  color === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                  'text-gray-700 dark:text-gray-300'
                }`}>
                  {metric.value}
                </div>
                <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
          
          {/* Secondary Metrics */}
          <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
            {metrics.filter(m => !m.highlight).map((metric, index) => (
              <div key={index} className="flex justify-between items-center group/metric relative">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{metric.label}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{metric.value}</span>
                {metric.tooltip && (
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover/metric:block z-50 w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg pointer-events-none">
                    {metric.tooltip}
                    <div className="absolute top-full left-4 w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45 -mt-1"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </InteractiveCard>
        
        {/* Card-level Tooltip */}
        {tooltip && showTooltip && (
          <div className={`absolute top-0 z-50 w-96 p-4 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-xl pointer-events-none ${
            tooltipPosition === 'left' ? 'right-full mr-4' : 
            tooltipPosition === 'top' ? 'bottom-full mb-4 left-0' :
            tooltipPosition === 'bottom' ? 'top-full mt-4 left-0' :
            'left-full ml-4'
          }`}>
            <h4 className="font-bold mb-3 text-base border-b border-gray-700 dark:border-gray-600 pb-2">{title}</h4>
            <div className="space-y-2.5">
              {tooltip.map((tip, index) => (
                <div key={index} className="leading-relaxed">
                  <span className="font-semibold text-white">{tip.label}:</span>{' '}
                  <span className="text-gray-200 dark:text-gray-300">{tip.description}</span>
                </div>
              ))}
            </div>
            {/* Arrow positioning based on tooltip position */}
            {tooltipPosition === 'left' && (
              <div className="absolute top-4 left-full w-3 h-3 bg-gray-900 dark:bg-gray-700 transform rotate-45 ml-1.5"></div>
            )}
            {tooltipPosition === 'right' && (
              <div className="absolute top-4 right-full w-3 h-3 bg-gray-900 dark:bg-gray-700 transform rotate-45 mr-1.5"></div>
            )}
            {tooltipPosition === 'top' && (
              <div className="absolute top-full left-8 w-3 h-3 bg-gray-900 dark:bg-gray-700 transform rotate-45 mt-1.5"></div>
            )}
            {tooltipPosition === 'bottom' && (
              <div className="absolute bottom-full left-8 w-3 h-3 bg-gray-900 dark:bg-gray-700 transform rotate-45 mb-1.5"></div>
            )}
          </div>
        )}
      </div>
    )
  }

  const jobMetrics = [
    { 
      label: tPage('metrics.jobs.total'), 
      value: analytics.jobs?.total?.toLocaleString() || '0', 
      highlight: true
    },
    { 
      label: tPage('metrics.jobs.openInTimeframe'), 
      value: analytics.jobs?.openInTimeframe || '0',
      tooltip: tPage('tooltips.jobs.openInTimeframe.description')
    },
    { 
      label: tPage('metrics.jobs.createdInTimeframe'), 
      value: analytics.jobs?.createdInTimeframe || '0',
      tooltip: tPage('tooltips.jobs.createdInTimeframe.description')
    },
    { 
      label: tPage('metrics.jobs.drafts'), 
      value: analytics.jobs?.draftInTimeframe || analytics.jobs?.drafts || '0',
      tooltip: tPage('tooltips.jobs.drafts.description')
    }
  ]

  const applicationMetrics = [
    { 
      label: tPage('metrics.applications.applicants'), 
      value: `${analytics.applications?.applicants || 0}`,
      highlight: true
    },
    { 
      label: tPage('metrics.applications.appliedInTimeframe'), 
      value: `${analytics.applications?.appliedInTimeframe || 0}`,
      tooltip: tPage('tooltips.applications.appliedInTimeframe.description')
    },
    { 
      label: tPage('metrics.applications.shortlisted'), 
      value: analytics.applications?.shortlisted || '0',
      tooltip: tPage('tooltips.applications.shortlisted.description')
    },
    { 
      label: tPage('metrics.applications.selected'), 
      value: `${analytics.applications?.selected || 0}`,
      tooltip: tPage('tooltips.applications.selected.description')
    }
  ]

  const interviewMetrics = [
    {
      label: tPage('metrics.interviews.total'),
      value: `${analytics.interviews?.weeklyTotal || 0}`,
      highlight: true
    },
    {
      label: tPage('metrics.interviews.passRate'),
      value: `${(analytics.interviews?.passRate || 0).toFixed(1)}%`,
      tooltip: tPage('tooltips.interviews.passRate.description')
    },
    {
      label: tPage('metrics.interviews.completed'),
      value: `${analytics.interviews?.monthlyInterviewed || 0}`,
      tooltip: tPage('tooltips.interviews.completed.description')
    },
    {
      label: tPage('metrics.interviews.pending'),
      value: `${analytics.interviews?.weeklyPending || 0}`,
      tooltip: tPage('tooltips.interviews.pending.description')
    }
  ]

  const jobTooltips = [
    { 
      label: tPage('tooltips.jobs.total.label'), 
      description: tPage('tooltips.jobs.total.description') 
    },
    { 
      label: tPage('tooltips.jobs.openInTimeframe.label'), 
      description: tPage('tooltips.jobs.openInTimeframe.description') 
    },
    { 
      label: tPage('tooltips.jobs.createdInTimeframe.label'), 
      description: tPage('tooltips.jobs.createdInTimeframe.description') 
    },
    { 
      label: tPage('tooltips.jobs.drafts.label'), 
      description: tPage('tooltips.jobs.drafts.description') 
    }
  ]

  const applicationTooltips = [
    { 
      label: tPage('tooltips.applications.total.label'), 
      description: tPage('tooltips.applications.total.description') 
    },
    { 
      label: tPage('tooltips.applications.appliedInTimeframe.label'), 
      description: tPage('tooltips.applications.appliedInTimeframe.description') 
    },
    { 
      label: tPage('tooltips.applications.shortlisted.label'), 
      description: tPage('tooltips.applications.shortlisted.description') 
    },
    { 
      label: tPage('tooltips.applications.selected.label'), 
      description: tPage('tooltips.applications.selected.description') 
    }
  ]

  const interviewTooltips = [
    { 
      label: tPage('tooltips.interviews.total.label'), 
      description: tPage('tooltips.interviews.total.description') 
    },
    { 
      label: tPage('tooltips.interviews.passRate.label'), 
      description: tPage('tooltips.interviews.passRate.description') 
    },
    { 
      label: tPage('tooltips.interviews.completed.label'), 
      description: tPage('tooltips.interviews.completed.description') 
    },
    { 
      label: tPage('tooltips.interviews.pending.label'), 
      description: tPage('tooltips.interviews.pending.description') 
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header + Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Top row: welcome + right tools */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  {tPage('header.welcomeBack', { name: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('-', ' ') : 'User' })}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                  {isAdmin() && tPage('header.roleDescriptions.admin')}
                  {isRecipient() && tPage('header.roleDescriptions.recipient')}
                  {isCoordinator() && tPage('header.roleDescriptions.coordinator')}
                </p>
              </div>

              {/* Right tools: search, bell, language, avatar */}
              <div className="flex items-center gap-2">
                <div className="relative hidden lg:block">
                  <input
                    className="pl-9 pr-3 py-2 w-72 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder={tPage('header.searchPlaceholder')}
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <LanguageSwitch variant="default" size="md" showLabel={false} />
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifMenu(v => !v)}
                    className="relative p-3 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    aria-label={tPage('header.notifications')}
                  >
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1">2</span>
                  </button>
                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 p-2 text-sm">
                      <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">{tPage('header.notifications')}</div>
                      <div className="text-gray-600 dark:text-gray-400">{tPage('header.newApplicants', { count: 2 })}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status row + Global filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <DateDisplay 
                  date={new Date()} 
                  showNepali={true} 
                  showTime={true} 
                  className="text-sm bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300" 
                  iconClassName="w-4 h-4"
                />
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-700">
                  <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium capitalize">{tPage('status.access', { role: user?.role })}</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                  <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {tPage('status.updated', { time: lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) })}
                  </span>
                </div>
                {filters.customStartDate && filters.customEndDate && (
                  <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-700">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {tPage('status.customRange', { 
                        startDate: new Date(filters.customStartDate).toLocaleDateString(), 
                        endDate: new Date(filters.customEndDate).toLocaleDateString() 
                      })}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Global Filters: Date Range + Country */}
              <div className="flex items-center gap-2">
                <InteractiveDropdown
                  options={[
                    { value: 'Today', label: tPage('filters.timeWindow.today') },
                    { value: 'Week', label: tPage('filters.timeWindow.week') },
                    { value: 'Month', label: tPage('filters.timeWindow.month') },
                    { value: 'Custom', label: filters.customStartDate && filters.customEndDate ? 
                      `${new Date(filters.customStartDate).toLocaleDateString()} - ${new Date(filters.customEndDate).toLocaleDateString()}` : 
                      tPage('filters.timeWindow.custom') }
                  ]}
                  value={filters.timeWindow}
                  onChange={(value) => {
                    if (value === 'Custom') {
                      setShowDateRangePicker(true)
                    } else {
                      setFilters(prev => ({ 
                        ...prev, 
                        timeWindow: value,
                        customStartDate: '',
                        customEndDate: ''
                      }))
                    }
                  }}
                  placeholder={tPage('filters.timeWindow.today')}
                  size="md"
                  className="w-full min-w-[150px]"
                />
                
                <InteractiveDropdown
                  options={[
                    { value: 'All Countries', label: tPage('filters.allCountries') },
                    ...countries.map(country => ({ value: country, label: country }))
                  ]}
                  value={filters.country}
                  onChange={(value) => setFilters(prev => ({ ...prev, country: value }))}
                  placeholder={tPage('filters.filterByCountry')}
                  size="md"
                  className="w-full min-w-[150px]"
                />
                
                <button
                  onClick={handleRefresh}
                  className={`p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 ${isRefreshing ? 'opacity-60 cursor-wait' : ''}`}
                  aria-label={tPage('buttons.refresh')}
                  title={tPage('buttons.refresh')}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
          {/* Jobs Card - Uses only Date Range + Country */}
          <div className="h-full">
            <InteractiveMetricCard 
              title={tPage('metrics.jobs.title')} 
              icon={Briefcase} 
              metrics={jobMetrics}
              color="info"
              onClick={() => navigate('/jobs')}
              className="cursor-pointer hover:shadow-lg h-full"
              tooltip={jobTooltips}
              tooltipPosition="right"
            />
          </div>
          
          {/* Applications & Interviews - Can use Job Filter */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Filter for Applications & Interviews */}
            {jobs.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPage('filters.filterApplicationsInterviews')}
                  </span>
                  <InteractiveDropdown
                    options={[
                      { value: 'All Jobs', label: tPage('filters.allJobs') },
                      ...jobs.map(job => ({ 
                        value: job.id, 
                        label: `${job.title} - ${job.country}` 
                      }))
                    ]}
                    value={filters.job}
                    onChange={(value) => setFilters(prev => ({ ...prev, job: value }))}
                    placeholder={tPage('filters.filterByJob')}
                    searchable={true}
                    size="sm"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InteractiveMetricCard 
                title={tPage('metrics.applications.title')} 
                icon={Users} 
                metrics={applicationMetrics}
                color="success"
                onClick={() => navigate('/applications')}
                className="cursor-pointer hover:shadow-lg"
                tooltip={applicationTooltips}
                tooltipPosition="left"
              />
              
              <InteractiveMetricCard 
                title={tPage('metrics.interviews.title')} 
                icon={Calendar} 
                metrics={interviewMetrics}
                color="warning"
                onClick={() => navigate('/interviews')}
                className="cursor-pointer hover:shadow-lg"
                tooltip={interviewTooltips}
                tooltipPosition="left"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions - Filtered by selected job */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{tPage('quickActions.title')}</h2>
            {filters.job !== 'All Jobs' && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Filtered by job
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
              <InteractiveCard 
                hoverable 
                clickable
                onClick={() => {
                  const params = new URLSearchParams()
                  if (filters.job !== 'All Jobs') params.append('job', filters.job)
                  if (filters.country !== 'All Countries') params.append('country', filters.country)
                  navigate(`/applications?${params.toString()}`)
                }}
                className="p-4 cursor-pointer group border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors mb-1">{tPage('quickActions.applications.title')}</p>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{analytics.applications?.applicants || 0}</p>
                      <p className="text-xs text-green-500 dark:text-green-400 uppercase tracking-wide">{tPage('quickActions.applications.applicants')}</p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.SCHEDULE_INTERVIEW}>
              <InteractiveCard 
                hoverable 
                clickable
                onClick={() => {
                  const params = new URLSearchParams()
                  if (filters.job !== 'All Jobs') params.append('job', filters.job)
                  if (filters.country !== 'All Countries') params.append('country', filters.country)
                  navigate(`/interviews?${params.toString()}`)
                }}
                className="p-4 cursor-pointer group border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                    <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-1">{tPage('quickActions.interviews.title')}</p>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-2 py-1">
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{analytics.interviews?.weeklyPending || 0}</p>
                      <p className="text-xs text-purple-500 dark:text-purple-400 uppercase tracking-wide">{tPage('quickActions.interviews.pending')}</p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.VIEW_WORKFLOW}>
              <InteractiveCard 
                hoverable 
                clickable
                onClick={() => {
                  const params = new URLSearchParams()
                  if (filters.job !== 'All Jobs') params.append('job', filters.job)
                  if (filters.country !== 'All Countries') params.append('country', filters.country)
                  navigate(`/workflow?${params.toString()}`)
                }}
                className="p-4 cursor-pointer group border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
                    <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-1">{tPage('quickActions.workflow.title')}</p>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2 py-1">
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{analytics.applications?.selected || 0}</p>
                      <p className="text-xs text-orange-500 dark:text-orange-400 uppercase tracking-wide">{tPage('quickActions.workflow.inProcess')}</p>
                    </div>
                  </div>
                </div>
              </InteractiveCard>
            </PermissionGuard>
          </div>
        </div>

        {/* Sticky Live Status Footer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky bottom-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">{tPage('status.liveData')}</span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>{tPage('status.updatesEvery')}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>{tPage('status.lastRefresh', { time: lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Picker Modal */}
      <DateRangePicker
        startDate={filters.customStartDate}
        endDate={filters.customEndDate}
        isOpen={showDateRangePicker}
        onDateRangeChange={(startDate, endDate) => {
          setFilters(prev => ({
            ...prev,
            timeWindow: 'Custom',
            customStartDate: startDate,
            customEndDate: endDate
          }))
        }}
        onClose={() => setShowDateRangePicker(false)}
      />
    </div>
  )
}

export default Dashboard