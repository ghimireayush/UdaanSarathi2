import React, { useState, useEffect } from 'react'
import { Search, MapPin, Briefcase, ArrowRight } from 'lucide-react'

/**
 * TypeScript-style interfaces defined as JSDoc types for JavaScript
 * These match the backend API response structure and component data model
 */

/**
 * @typedef {Object} APIAgency
 * @property {string} id - Unique agency identifier
 * @property {string} name - Agency name
 * @property {string} license_number - Agency license number
 * @property {string} [logo_url] - Optional agency logo URL
 * @property {string} [description] - Optional agency description
 * @property {string} [city] - Agency city
 * @property {string} [country] - Agency country
 * @property {string} [website] - Optional agency website
 * @property {boolean} is_active - Whether agency is active
 * @property {string} created_at - Creation timestamp
 * @property {number} job_posting_count - Number of active job postings
 * @property {string[]} [specializations] - Optional array of specializations
 */

/**
 * @typedef {Object} Agency
 * @property {string} id - Unique agency identifier
 * @property {string} name - Agency name
 * @property {string} location - Formatted location string (City, Country)
 * @property {string[]} specializations - Array of specialization tags
 * @property {number} rating - Agency rating (default 4.5)
 * @property {number} activeJobs - Number of active job postings
 */

/**
 * @typedef {Object} PaginatedResponseMeta
 * @property {number} total - Total number of items
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 * @property {number} totalPages - Total number of pages
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {APIAgency[]} data - Array of agency data
 * @property {PaginatedResponseMeta} meta - Pagination metadata
 */

/**
 * AgencySearch Component
 * 
 * A comprehensive agency search component for the UdaanSarathi landing page.
 * Features include:
 * - Keyword and location-based search with debouncing
 * - Autocomplete suggestions
 * - Top agencies display
 * - Paginated "View All" modal
 * - Download modal for mobile app promotion
 * 
 * @param {Object} props
 * @param {Function} props.t - Translation function
 */
const AgencySearchNew = ({ t }) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [debouncedLocation, setDebouncedLocation] = useState('')

  // UI state
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showAllAgenciesModal, setShowAllAgenciesModal] = useState(false)

  // Data state
  /** @type {[Agency[], Function]} */
  const [topAgencies, setTopAgencies] = useState([])
  /** @type {[Agency[], Function]} */
  const [searchResults, setSearchResults] = useState([])
  /** @type {[Agency[], Function]} */
  const [allAgencies, setAllAgencies] = useState([])
  /** @type {[string[], Function]} */
  const [availableLocations, setAvailableLocations] = useState([])

  // Loading/Error state
  const [isLoadingTop, setIsLoadingTop] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [error, setError] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // ============================================================================
  // API UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Build search URL with query parameters
   * @param {string} [keyword] - Search keyword
   * @param {number} [page=1] - Page number
   * @param {number} [limit=6] - Items per page
   * @param {string} [sortBy='name'] - Sort field
   * @param {string} [sortOrder='asc'] - Sort order
   * @returns {string} Complete API URL with parameters
   */
  const buildSearchURL = (keyword, page = 1, limit = 6, sortBy = 'name', sortOrder = 'asc') => {
    const params = new URLSearchParams()
    if (keyword) params.append('keyword', keyword)
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    params.append('sortBy', sortBy)
    params.append('sortOrder', sortOrder)
    return `${import.meta.env.VITE_API_BASE_URL || 'https://dev.kaha.com.np/job-portal'}/agencies/search?${params.toString()}`
  }

  /**
   * Transform API agency response to component data structure
   * @param {APIAgency} apiAgency - Agency data from API
   * @returns {Agency} Transformed agency object
   */
  const transformAgency = (apiAgency) => {
    return {
      id: apiAgency.id,
      name: apiAgency.name,
      location: `${apiAgency.city || 'Nepal'}, ${apiAgency.country || 'Nepal'}`,
      specializations: apiAgency.specializations || [],
      rating: 4.5, // Default until backend provides ratings
      activeJobs: apiAgency.job_posting_count || 0,
      logo_url: apiAgency.logo_url,
      description: apiAgency.description,
      website: apiAgency.website,
      license_number: apiAgency.license_number,
      created_at: apiAgency.created_at
    }
  }

  /**
   * Fetch agencies from backend API
   * @param {string} [keyword] - Search keyword
   * @param {number} [page=1] - Page number
   * @param {number} [limit=6] - Items per page
   * @param {string} [sortBy='name'] - Sort field
   * @param {string} [sortOrder='asc'] - Sort order
   * @returns {Promise<{agencies: Agency[], meta: PaginatedResponseMeta}>}
   */
  const fetchAgencies = async (keyword, page = 1, limit = 6, sortBy = 'name', sortOrder = 'asc') => {
    try {
      const url = buildSearchURL(keyword, page, limit, sortBy, sortOrder)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      /** @type {PaginatedResponse} */
      const data = await response.json()
      
      return {
        agencies: data.data.map(transformAgency),
        meta: data.meta
      }
    } catch (error) {
      console.error('[AgencySearchNew] Failed to fetch agencies:', error)
      setError(error instanceof Error ? error.message : 'Failed to load agencies')
      return {
        agencies: [],
        meta: { total: 0, page: 1, limit: limit, totalPages: 0 }
      }
    }
  }

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  // Job suggestions for autocomplete (not fetched from API as per requirements)
  const jobSuggestions = [
    'Software Developer',
    'Data Analyst',
    'Marketing Manager',
    'Graphic Designer',
    'Project Manager',
    'Sales Executive',
    'HR Manager',
    'Accountant',
    'Civil Engineer',
    'Nurse',
    'Teacher',
    'Digital Marketing'
  ]

  /**
   * Fetch search configuration from backend
   */
  const fetchSearchConfig = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://dev.kaha.com.np/job-portal'}/agencies/search/config`)
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      const data = await response.json()
      setAvailableLocations(data.locations || [])
    } catch (error) {
      console.error('[AgencySearchNew] Failed to fetch search config:', error)
      // Fallback to default locations
      setAvailableLocations([
        'Kathmandu',
        'Pokhara',
        'Lalitpur',
        'Bhaktapur',
        'Biratnagar',
        'Chitwan',
        'Butwal',
        'Dharan',
        'Nepalgunj',
        'Janakpur'
      ])
    }
  }

  // ============================================================================
  // EFFECTS - DEBOUNCING
  // ============================================================================

  // Debounce search query with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Debounce location query with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(locationQuery)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [locationQuery])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle Enter key press to bypass debounce
   * @param {React.KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (searchQuery || locationQuery)) {
      // Bypass debounce and trigger immediate search
      handleSearch(searchQuery, locationQuery)
      setShowSuggestions(false)
      setShowLocationSuggestions(false)
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setShowLocationSuggestions(false)
    }
  }

  /**
   * Handle search button click
   */
  const handleSearchClick = () => {
    if (searchQuery || locationQuery) {
      handleSearch(searchQuery, locationQuery)
    }
  }

  /**
   * Handle suggestion click
   * @param {string} suggestion - Selected suggestion
   */
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    // Don't show download modal, just set the search query
  }

  /**
   * Handle location suggestion click
   * @param {string} suggestion - Selected location suggestion
   */
  const handleLocationSuggestionClick = (suggestion) => {
    setLocationQuery(suggestion)
    setShowLocationSuggestions(false)
    // Don't show download modal, just set the location query
  }

  /**
   * Handle agency card click
   * @param {React.MouseEvent} e - Click event
   */
  const handleCardClick = (e) => {
    e.preventDefault()
    setShowDownloadModal(true)
  }

  /**
   * Handle view details button click
   * @param {React.MouseEvent} e - Click event
   */
  const handleViewDetails = (e) => {
    e.preventDefault()
    setShowDownloadModal(true)
  }

  /**
   * Handle view more button click
   */
  const handleViewMore = () => {
    setShowAllAgenciesModal(true)
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Render agency card
   * @param {Agency} agency - Agency data
   * @returns {JSX.Element}
   */
  const renderAgencyCard = (agency) => (
    <div
      key={agency.id}
      onClick={handleCardClick}
      className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="mb-4">
        {agency.logo_url ? (
          <img 
            src={agency.logo_url} 
            alt={agency.name}
            className="w-12 h-12 rounded-lg object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div 
          className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl"
          style={{ display: agency.logo_url ? 'none' : 'flex' }}
        >
          {agency.name.charAt(0)}
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {agency.name}
      </h3>

      {agency.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {agency.description}
        </p>
      )}

      <div className="flex items-center text-gray-600 dark:text-gray-400 mb-3">
        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-sm">{agency.location}</span>
      </div>

      {agency.specializations && agency.specializations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {agency.specializations.slice(0, 3).map((spec, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full"
            >
              {spec}
            </span>
          ))}
          {agency.specializations.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
              +{agency.specializations.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Briefcase className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">
            {agency.activeJobs} {agency.activeJobs === 1 ? 'Active Job' : 'Active Jobs'}
          </span>
        </div>
        <button 
          onClick={handleViewDetails}
          className="flex items-center text-blue-600 dark:text-blue-400 font-semibold text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300"
        >
          {t('search.viewDetails')}
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )

  /**
   * Render loading skeleton card
   * @param {number} index - Card index
   * @returns {JSX.Element}
   */
  const renderSkeletonCard = (index) => (
    <div key={index} className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 animate-pulse">
      <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-lg mb-4"></div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  )

  /**
   * Perform search with current queries
   * @param {string} query - Search query
   * @param {string} location - Location query
   */
  const handleSearch = async (query, location) => {
    setIsSearching(true)
    setError(null)
    
    try {
      const { agencies } = await fetchAgencies(query, 1, 6)
      
      // Filter by location if provided (client-side filtering)
      let filteredAgencies = agencies
      if (location) {
        filteredAgencies = agencies.filter(agency =>
          agency.location.toLowerCase().includes(location.toLowerCase())
        )
      }
      
      setSearchResults(filteredAgencies)
    } catch (err) {
      console.error('[AgencySearchNew] Search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  // ============================================================================
  // EFFECTS - SEARCH TRIGGER
  // ============================================================================

  // Trigger search when debounced values change
  useEffect(() => {
    if (debouncedQuery || debouncedLocation) {
      handleSearch(debouncedQuery, debouncedLocation)
    } else {
      setSearchResults([])
    }
  }, [debouncedQuery, debouncedLocation])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false)
      setShowLocationSuggestions(false)
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Fetch search config on mount
  useEffect(() => {
    fetchSearchConfig()
  }, [])

  // Fetch top 6 agencies on component mount
  useEffect(() => {
    const loadTopAgencies = async () => {
      setIsLoadingTop(true)
      setError(null)
      
      try {
        // Fetch more agencies and sort by job count client-side
        // Backend doesn't support sortBy=job_posting_count
        const { agencies } = await fetchAgencies('', 1, 20, 'name', 'asc')
        
        // Sort by job posting count descending and take top 6
        const sortedAgencies = agencies
          .sort((a, b) => b.activeJobs - a.activeJobs)
          .slice(0, 6)
        
        setTopAgencies(sortedAgencies)
      } catch (err) {
        console.error('[AgencySearchNew] Failed to load top agencies:', err)
      } finally {
        setIsLoadingTop(false)
      }
    }
    
    loadTopAgencies()
  }, [])

  // Fetch paginated agencies when modal opens or page changes
  useEffect(() => {
    if (showAllAgenciesModal) {
      const loadAllAgencies = async () => {
        setIsLoadingAll(true)
        setError(null)
        
        try {
          // Backend doesn't support sortBy=job_posting_count, so we use name
          const { agencies, meta } = await fetchAgencies('', currentPage, 6, 'name', 'asc')
          
          // Sort by job posting count client-side
          const sortedAgencies = agencies.sort((a, b) => b.activeJobs - a.activeJobs)
          
          setAllAgencies(sortedAgencies)
          setTotalPages(meta.totalPages)
          setTotal(meta.total)
        } catch (err) {
          console.error('[AgencySearchNew] Failed to load all agencies:', err)
        } finally {
          setIsLoadingAll(false)
        }
      }
      
      loadAllAgencies()
    }
  }, [showAllAgenciesModal, currentPage])

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================

  return (
    <section id="agency-search" className="py-16 md:py-24 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('search.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('search.subtitle')}
          </p>
        </div>

        {/* Job Search Bar */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 border-2 border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Job Title/Keywords */}
              <div className="flex-[3] relative" onClick={(e) => e.stopPropagation()}>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowSuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowSuggestions(searchQuery.length > 0)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all"
                />
                
                {/* Job Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">SUGGESTIONS</span>
                      </div>
                      {jobSuggestions
                        .filter(suggestion => 
                          suggestion.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 6)
                        .map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="flex-[1] relative" onClick={(e) => e.stopPropagation()}>
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('search.locationPlaceholder') || 'Location'}
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value)
                    setShowLocationSuggestions(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowLocationSuggestions(locationQuery.length > 0)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-3 text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all"
                />
                
                {/* Location Suggestions Dropdown */}
                {showLocationSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">LOCATIONS</span>
                      </div>
                      {availableLocations
                        .filter(suggestion => 
                          suggestion.toLowerCase().includes(locationQuery.toLowerCase())
                        )
                        .slice(0, 6)
                        .map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleLocationSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button 
                onClick={handleSearchClick}
                className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Search Jobs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top 6 Agencies - Always Shown */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Top Agencies with Most Job Openings
            </h3>
            <button
              onClick={handleViewMore}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <span>View More</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoadingTop && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => renderSkeletonCard(i))}
            </div>
          )}

          {/* Top Agencies Grid */}
          {!isLoadingTop && topAgencies.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topAgencies.map((agency) => renderAgencyCard(agency))}
            </div>
          )}
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => renderSkeletonCard(i))}
          </div>
        )}

        {!isSearching && searchResults.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Search Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((agency) => renderAgencyCard(agency))}
            </div>
          </div>
        )}

        {!isSearching && (searchQuery || locationQuery) && searchResults.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('search.noResults')}</h3>
            <p className="text-gray-600 dark:text-gray-400">{t('search.tryAgain')}</p>
          </div>
        )}

        {/* All Agencies Modal */}
        {showAllAgenciesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => { setShowAllAgenciesModal(false); setCurrentPage(1); }}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  All Agencies
                </h3>
                <button
                  onClick={() => { setShowAllAgenciesModal(false); setCurrentPage(1); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                {isLoadingAll ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => renderSkeletonCard(i))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allAgencies.map((agency) => renderAgencyCard(agency))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {!isLoadingAll && totalPages > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((currentPage - 1) * 6) + 1} to {Math.min(currentPage * 6, total)} of {total} agencies
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download Modal */}
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowDownloadModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {t('search.modal.title')}
                  </h3>
                  {(searchQuery || locationQuery) && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        {searchQuery && `"${searchQuery}"`}
                        {searchQuery && locationQuery && " in "}
                        {locationQuery && `${locationQuery}`}
                      </p>
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('search.modal.subtitle')}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <a
                    href="#"
                    className="flex items-center justify-center space-x-3 bg-black hover:bg-gray-800 rounded-xl px-6 py-3 transition-all transform hover:scale-105 w-full"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">{t('search.modal.downloadOn')}</div>
                      <div className="text-base font-semibold text-white">{t('search.modal.appStore')}</div>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-center space-x-3 bg-black hover:bg-gray-800 rounded-xl px-6 py-3 transition-all transform hover:scale-105 w-full"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-gray-300">{t('search.modal.getItOn')}</div>
                      <div className="text-base font-semibold text-white">{t('search.modal.playStore')}</div>
                    </div>
                  </a>
                </div>

                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
                >
                  {t('search.modal.maybeLater')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default AgencySearchNew
