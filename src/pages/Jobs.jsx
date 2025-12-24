import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Plus, 
  MapPin, 
  Users, 
  Calendar,
  Eye,
  AlertCircle,
  UserCheck,
  Clock,
  Bug
} from 'lucide-react'
import { jobService, constantsService, PERMISSIONS } from '../services/index.js'
import { format } from 'date-fns'
import { getRelativeTime } from '../utils/nepaliDate.js'
import i18nService from '../services/i18nService.js'
import PermissionGuard from '../components/PermissionGuard.jsx'
import useErrorHandler from '../hooks/useErrorHandler.js'
import { useLanguage } from '../hooks/useLanguage.js'
import LanguageSwitch from '../components/LanguageSwitch'
import { usePagination } from '../hooks/usePagination.js'
import PaginationWrapper from '../components/PaginationWrapper.jsx'
import LoadingScreen from '../components/LoadingScreen'


const Jobs = () => {
  const navigate = useNavigate()
  const { error, isRetryable, handleError, clearError } = useErrorHandler()
  const { t, tPageSync, isLoading: translationsLoading } = useLanguage({ 
    pageName: 'jobs', 
    autoLoad: true 
  })
  const [filters, setFilters] = useState({
    search: '',
    country: 'All Countries',
    sortBy: 'published_date'
  })
  const [jobs, setJobs] = useState([])
  const [allJobs, setAllJobs] = useState([]) // Store all jobs for client-side pagination
  const [isLoading, setIsLoading] = useState(true)
  const [countryDistribution, setCountryDistribution] = useState({})
  const [expandedCountries, setExpandedCountries] = useState(false) // For mobile collapse

  // Pagination hook
  const {
    currentData: paginatedJobs,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    itemsPerPageOptions,
    goToPage,
    changeItemsPerPage,
    resetPagination
  } = usePagination(jobs, {
    initialItemsPerPage: 10,
    itemsPerPageOptions: [5, 10, 25, 50]
  })

  // Fetch jobs data using service
  useEffect(() => {
    const fetchJobsData = async () => {
      try {
        setIsLoading(true)
        clearError()
        
        const [jobsData, statsData] = await Promise.all([
          jobService.getJobs(filters),
          jobService.getJobStatistics()
        ])
        
        // Ensure jobsData is always an array
        const safeJobsData = Array.isArray(jobsData) ? jobsData : []
        
        setAllJobs(safeJobsData)
        setJobs(safeJobsData)
        setCountryDistribution(statsData.byCountry || {})
      } catch (err) {
        handleError(err, 'fetch jobs data');
        // Set empty arrays on error to prevent crashes
        setAllJobs([])
        setJobs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobsData()
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    resetPagination() // Reset to first page when filters change
  }



  // Loading state
  if ((isLoading && jobs.length === 0) || translationsLoading) {
    return <LoadingScreen />
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-3 sm:px-6">
        <div className="card p-6 sm:p-8 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{tPageSync('error.failedToLoad')}</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">{error.message}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary text-sm sm:text-base py-2.5 sm:py-3"
            >
              {tPageSync('error.reload')}
            </button>
            {isRetryable && (
              <button 
                onClick={() => {
                  clearError();
                  // Re-fetch data
                  const fetchJobsData = async () => {
                    try {
                      setIsLoading(true)
                      const [jobsData, statsData] = await Promise.all([
                        jobService.getJobs(filters),
                        jobService.getJobStatistics()
                      ])
                      
                      setJobs(jobsData)
                      setCountryDistribution(statsData.byCountry || {})
                      clearError()
                    } catch (err) {
                      handleError(err, 'retry fetch jobs data');
                    } finally {
                      setIsLoading(false)
                    }
                  }
                  
                  fetchJobsData()
                }}
                className="btn-secondary text-sm sm:text-base py-2.5 sm:py-3"
              >
                {tPageSync('error.retry')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{tPageSync('title')}</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {tPageSync('subtitle')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Job Count Badge - Mobile */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{jobs.length}</span>
            </div>
            <LanguageSwitch 
              variant="ghost" 
              size="sm" 
              showLabel={true}
              position="bottom-right"
            />
          </div>
        </div>

      {/* Filters and Search */}
      <div className="card p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col space-y-3 sm:space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Search className="text-gray-500 dark:text-gray-400 w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={tPageSync('filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-14 pr-4 py-3 sm:py-3.5 w-full text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
            />
            {filters.search && (
              <button 
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Country</label>
              <select 
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full form-select-sm text-sm py-2.5 sm:py-3 rounded-xl"
              >
                <option value="All Countries">{tPageSync('filters.allCountries')}</option>
                {Object.keys(countryDistribution).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">Sort By</label>
              <select 
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full form-select-sm text-sm py-2.5 sm:py-3 rounded-xl"
              >
                <option value="published_date">{tPageSync('sortOptions.publishedDate')}</option>
                <option value="applications">{tPageSync('sortOptions.applications')}</option>
                <option value="shortlisted">{tPageSync('sortOptions.shortlisted')}</option>
                <option value="interviews">{tPageSync('sortOptions.interviews')}</option>
              </select>
            </div>
          </div>
          
          {/* Active Filters Summary - Mobile */}
          {(filters.search || filters.country !== 'All Countries') && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">Active filters:</span>
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                  "{filters.search}"
                  <button onClick={() => handleFilterChange('search', '')} className="hover:text-primary-900 dark:hover:text-primary-100">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {filters.country !== 'All Countries' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                  {filters.country}
                  <button onClick={() => handleFilterChange('country', 'All Countries')} className="hover:text-blue-900 dark:hover:text-blue-100">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              <button 
                onClick={() => {
                  handleFilterChange('search', '')
                  handleFilterChange('country', 'All Countries')
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Country Distribution */}
      <div className="card p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <button
          onClick={() => setExpandedCountries(!expandedCountries)}
          className="w-full flex items-center justify-between lg:justify-start lg:cursor-default mb-3 sm:mb-4 group"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">{tPageSync('sections.countryDistribution.title')}</h3>
          </div>
          <div className="lg:hidden flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Object.keys(countryDistribution).filter(c => countryDistribution[c] > 0).length} countries
            </span>
            <div className={`w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center transition-transform ${expandedCountries ? 'rotate-180' : ''}`}>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
        
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 ${expandedCountries ? '' : 'hidden lg:grid'}`}>
          {Object.entries(countryDistribution)
            .filter(([country, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([country, count]) => (
              <button 
                key={country} 
                className={`flex items-center justify-between p-2.5 sm:p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border rounded-xl transition-all active:scale-[0.98] ${
                  filters.country === country 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => handleFilterChange('country', filters.country === country ? 'All Countries' : country)}
              >
                <span className={`text-xs sm:text-sm font-medium line-clamp-1 ${
                  filters.country === country 
                    ? 'text-primary-700 dark:text-primary-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {country}
                </span>
                <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                  filters.country === country 
                    ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200' 
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {count}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Jobs List - Mobile Card View & Desktop Table View */}
      <div className="card overflow-hidden">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{tPageSync('sections.jobListings.title')}</h2>
              <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                {paginatedJobs.length} of {jobs.length}
              </span>
            </div>
            {/* Mobile: Quick stats summary */}
            <div className="flex md:hidden items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Page {currentPage}/{totalPages}</span>
            </div>
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="block md:hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedJobs.map(job => {
              const publishedDate = job.published_at || job.created_at
              const currentLocale = i18nService.getLocale()
              const useNepali = currentLocale === 'ne'
              const relativeDate = getRelativeTime(publishedDate, useNepali)
              
              return (
                <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors active:bg-gray-100 dark:active:bg-gray-700">
                  {/* Job Header with Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">{job.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{job.company}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Location & Time Row */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      <span className="line-clamp-1">{job.city ? `${job.city}, ${job.country}` : job.country}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{relativeDate}</span>
                    </div>
                  </div>

                  {/* Stats Row - Horizontal Scroll on very small screens */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                    <div className="flex-1 min-w-[70px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase tracking-wide font-medium">Applied</span>
                      </div>
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{job.applied_count || 0}</div>
                    </div>
                    <div className="flex-1 min-w-[70px] bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase tracking-wide font-medium">Shortlist</span>
                      </div>
                      <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{job.shortlisted_count || 0}</div>
                    </div>
                    <div className="flex-1 min-w-[70px] bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-2.5 rounded-lg border border-purple-100 dark:border-purple-800/30">
                      <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase tracking-wide font-medium">Interviews</span>
                      </div>
                      <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{job.total_interviews || 0}</div>
                    </div>
                  </div>

                  {/* Action Buttons - Full Width Touch Targets */}
                  <div className="flex gap-2">
                    <PermissionGuard permission={PERMISSIONS.VIEW_JOBS}>
                      <Link 
                        to={`/jobs/${job.id}`}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Link>
                    </PermissionGuard>
                    <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
                      <Link 
                        to={`/jobs/${job.id}?tab=shortlisted`}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-all"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Shortlist</span>
                      </Link>
                    </PermissionGuard>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPageSync('table.headers.jobDetails')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPageSync('table.headers.applicationStatus')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPageSync('table.headers.posted')}
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPageSync('table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedJobs.map(job => {
                const publishedDate = job.published_at || job.created_at
                const currentLocale = i18nService.getLocale()
                const useNepali = currentLocale === 'ne'
                const relativeDate = getRelativeTime(publishedDate, useNepali)
                const absoluteDate = format(new Date(publishedDate), 'MMM d, yyyy HH:mm')
                
                return (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 sm:px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{job.company}</div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{job.city ? `${job.city}, ${job.country}` : job.country}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center text-gray-900 dark:text-gray-100 mb-1">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="font-medium">{tPageSync('table.applicationStatus.applicants', { count: job.applications_count || 0 })}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-1 text-xs">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                          <span>{tPageSync('table.applicationStatus.applied', { count: job.applied_count || 0 })}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-1 text-xs">
                          <UserCheck className="w-4 h-4 mr-1" />
                          <span>{tPageSync('table.applicationStatus.shortlisted', { count: job.shortlisted_count || 0 })}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-1 text-xs">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                          <span>{tPageSync('table.applicationStatus.withdrawn', { count: job.withdrawn_count || 0 })}</span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{tPageSync('table.applicationStatus.interviews', { today: job.interviews_today || 0, total: job.total_interviews || 0 })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div title={absoluteDate}>
                        <div className="font-medium">{relativeDate}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(publishedDate), 'MMM d, yyyy')}</div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      <div className="flex flex-col space-y-1">
                        <PermissionGuard permission={PERMISSIONS.VIEW_JOBS}>
                          <Link 
                            to={`/jobs/${job.id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center text-xs sm:text-sm py-1"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {tPageSync('table.actions.viewDetails')}
                          </Link>
                        </PermissionGuard>
                        <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
                          <Link 
                            to={`/jobs/${job.id}?tab=shortlisted`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center text-xs sm:text-sm py-1"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            {tPageSync('table.actions.viewShortlist')}
                          </Link>
                        </PermissionGuard>
                        <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
                          <Link 
                            to={`/jobs/${job.id}?tab=applied`}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center text-xs sm:text-sm py-1"
                          >
                            <Users className="w-4 h-4 mr-1" />
                            {tPageSync('table.actions.manageCandidates')}
                          </Link>
                        </PermissionGuard>
                        <PermissionGuard permission={PERMISSIONS.SCHEDULE_INTERVIEW}>
                          <Link 
                            to={`/jobs/${job.id}?tab=shortlisted`}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center text-xs sm:text-sm py-1"
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            {tPageSync('table.actions.schedule')}
                          </Link>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {jobs.length > 0 && (
        <div className="mt-4 sm:mt-0 px-3 sm:px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
          <PaginationWrapper
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={itemsPerPageOptions}
            onPageChange={goToPage}
            onItemsPerPageChange={changeItemsPerPage}
            showInfo={true}
            showItemsPerPageSelector={true}
          />
        </div>
      )}
      
      {/* Empty State */}
      {jobs.length === 0 && !isLoading && (
        <div className="card p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No jobs found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <button 
            onClick={() => {
              handleFilterChange('search', '')
              handleFilterChange('country', 'All Countries')
            }}
            className="btn-primary text-sm"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
    </div>
  )
}

export default Jobs