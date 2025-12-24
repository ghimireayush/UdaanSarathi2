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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{tPageSync('error.failedToLoad')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
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
                className="btn-secondary"
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tPageSync('title')}</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {tPageSync('subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <LanguageSwitch 
            variant="ghost" 
            size="sm" 
            showLabel={true}
            position="bottom-right"
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={tPageSync('filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select 
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="form-select-sm"
            >
              <option value="All Countries">{tPageSync('filters.allCountries')}</option>
              {Object.keys(countryDistribution).map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            
            <select 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="form-select-sm"
            >
              <option value="published_date">{tPageSync('sortOptions.publishedDate')}</option>
              <option value="applications">{tPageSync('sortOptions.applications')}</option>
              <option value="shortlisted">{tPageSync('sortOptions.shortlisted')}</option>
              <option value="interviews">{tPageSync('sortOptions.interviews')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Country Distribution */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{tPageSync('sections.countryDistribution.title')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1">
          {Object.entries(countryDistribution)
            .filter(([country, count]) => count > 0)
            .map(([country, count]) => (
              <button 
                key={country} 
                className="flex items-center justify-center p-2 text-center hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-sm transition-colors"
                onClick={() => handleFilterChange('country', country)}
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {country} ({count})
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Jobs Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{tPageSync('sections.jobListings.title')}</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {tPageSync('table.headers.jobDetails')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {tPageSync('table.headers.applicationStatus')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {tPageSync('table.headers.posted')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{job.title}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{job.company}</div>
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{job.city ? `${job.city}, ${job.country}` : job.country}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <div title={absoluteDate}>
                            <div className="font-medium">{relativeDate}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(publishedDate), 'MMM d, yyyy')}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col space-y-1">
                            <PermissionGuard permission={PERMISSIONS.VIEW_JOBS}>
                              <Link 
                                to={`/jobs/${job.id}`}
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {tPageSync('table.actions.viewDetails')}
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
                              <Link 
                                to={`/jobs/${job.id}?tab=shortlisted`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                {tPageSync('table.actions.viewShortlist')}
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.VIEW_APPLICATIONS}>
                              <Link 
                                to={`/jobs/${job.id}?tab=applied`}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
                              >
                                <Users className="w-4 h-4 mr-1" />
                                {tPageSync('table.actions.manageCandidates')}
                              </Link>
                            </PermissionGuard>
                            <PermissionGuard permission={PERMISSIONS.SCHEDULE_INTERVIEW}>
                              <Link 
                                to={`/jobs/${job.id}?tab=shortlisted`}
                                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
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
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
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
    </div>
  )
}

export default Jobs