import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Users, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Phone, 
  Briefcase, 
  Calendar,
  CreditCard,
  Paperclip,
  Eye,
  FileText,
  X
} from 'lucide-react'
import workflowApiService from '../services/workflowApiService'
import stageTransitionService from '../services/stageTransitionService'
import InterviewScheduleDialog from '../components/InterviewScheduleDialog'
import { useAgency } from '../contexts/AgencyContext'
import { useLanguage } from '../hooks/useLanguage'
import { useStageTranslations } from '../hooks/useStageTranslations'
import { format } from 'date-fns'

const WorkflowV2 = () => {
  const { agencyData, isLoading: agencyLoading } = useAgency()
  const { tPageSync } = useLanguage({ pageName: 'workflow', autoLoad: true })
  const { getStageLabel, getStageAction } = useStageTranslations()
  
  // Helper function for translations with fallback
  const t = (key, fallback = key) => {
    const result = tPageSync(key)
    return result === key ? fallback : result
  }
  // State
  const [candidates, setCandidates] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [stages, setStages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
  const [selectedStage, setSelectedStage] = useState('applied')
  const [previousStage, setPreviousStage] = useState('applied') // Store stage before search
  const [searchInput, setSearchInput] = useState('') // Local input state
  const [searchQuery, setSearchQuery] = useState('') // Debounced search query
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  
  // Refs
  const searchTimeoutRef = useRef(null)
  const searchInputRef = useRef(null)
  const wasSearchFocusedRef = useRef(false)
  
  // Interview scheduling dialog
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [selectedCandidateForInterview, setSelectedCandidateForInterview] = useState(null)
  const [isReschedule, setIsReschedule] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // When searching, use 'all' stage to search across all stages
      const effectiveStage = searchQuery ? 'all' : selectedStage

      // Fetch candidates with filters
      const response = await workflowApiService.getWorkflowCandidates({
        stage: effectiveStage,
        search: searchQuery,
        page: currentPage,
        limit: 15,
      })

      if (response.success) {
        setCandidates(response.data.candidates)
        setPagination(response.data.pagination)
        setAnalytics(response.data.analytics)
      }

      // Fetch stages (only once)
      if (stages.length === 0) {
        const stagesResponse = await workflowApiService.getWorkflowStages()
        if (stagesResponse.success) {
          setStages(stagesResponse.data.stages)
        }
      }
    } catch (err) {
      console.error('Error loading workflow data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedStage, currentPage, searchQuery, stages.length])

  // Debounce search input
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500) // 500ms debounce

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchInput])

  // Load initial data
  useEffect(() => {
    // Wait for agency data to load before fetching workflow data
    if (!agencyLoading && agencyData) {
      loadData()
    }
  }, [agencyLoading, agencyData, loadData])

  // Restore focus after loading completes if user was searching
  useEffect(() => {
    if (!isLoading && wasSearchFocusedRef.current && searchInput) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
          searchInputRef.current.focus()
          // Move cursor to end
          const length = searchInputRef.current.value.length
          searchInputRef.current.setSelectionRange(length, length)
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isLoading, searchInput])

  // Define strict stage progression rules (matching CandidateSummaryS2)
  const getNextAllowedStage = (currentStage) => {
    const stageOrder = {
      'applied': 'shortlisted',
      'shortlisted': 'interview_scheduled',
      'interview_scheduled': 'interview_passed',
      'interview_passed': null // Final stage
    }
    return stageOrder[currentStage]
  }

  const validateStageTransition = (currentStage, targetStage) => {
    // Allow pass/fail from interview_scheduled stage
    if (currentStage === 'interview_scheduled' && 
        (targetStage === 'interview_passed' || targetStage === 'interview_failed')) {
      return true
    }
    
    // Allow pass/fail from interview_rescheduled stage (same as scheduled)
    if (currentStage === 'interview_rescheduled' && 
        (targetStage === 'interview_passed' || targetStage === 'interview_failed')) {
      return true
    }
    
    // Strict progression: allow only immediate next stage
    const nextAllowed = getNextAllowedStage(currentStage)
    return targetStage === nextAllowed
  }

  const getValidNextStages = (currentStage) => {
    const validStages = []
    
    // Add the next allowed stage
    const nextStage = getNextAllowedStage(currentStage)
    if (nextStage) {
      validStages.push(nextStage)
    }
    
    // Special case: from interview_scheduled, allow both pass and fail
    if (currentStage === 'interview_scheduled') {
      validStages.push('interview_passed')
      // Optionally add interview_failed if you want to support it
      // validStages.push('interview_failed')
    }
    
    return validStages
  }

  const handleStageChange = (stage) => {
    setSelectedStage(stage)
    setPreviousStage(stage) // Remember this stage
    setCurrentPage(1) // Reset to first page
    // useEffect will handle the reload automatically
  }

  const handleSearchInput = (e) => {
    const value = e.target.value
    setSearchInput(value)
    wasSearchFocusedRef.current = true // Mark that user is actively searching
    
    // If starting to search, remember current stage
    if (value && !searchInput) {
      setPreviousStage(selectedStage)
    }
    // Debounce logic in useEffect will handle the actual search
  }

  const handleSearchFocus = (e) => {
    wasSearchFocusedRef.current = true
    // Move cursor to end of input when focusing
    const input = e.target
    const length = input.value.length
    input.setSelectionRange(length, length)
  }

  const handleSearchBlur = () => {
    wasSearchFocusedRef.current = false
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    setSelectedStage(previousStage) // Restore previous stage
    setCurrentPage(1)
    // Keep focus on input after clearing
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

  const handleUpdateStage = async (candidateId, applicationId, newStage, currentStage, interviewDetails = null) => {
    // Validate stage transition
    if (!validateStageTransition(currentStage, newStage)) {
      const currentStageLabel = stageTransitionService.getStageLabel(currentStage)
      const newStageLabel = stageTransitionService.getStageLabel(newStage)
      
      alert(`❌ Invalid stage transition!\n\nYou cannot move directly from "${currentStageLabel}" to "${newStageLabel}".\n\nPlease follow the proper workflow sequence:\napplied → shortlisted → interview_scheduled → interview_passed`)
      return
    }

    // Show confirmation
    const currentStageLabel = stageTransitionService.getStageLabel(currentStage)
    const newStageLabel = stageTransitionService.getStageLabel(newStage)
    
    const confirmed = window.confirm(
      `Are you sure you want to move this candidate from "${currentStageLabel}" to "${newStageLabel}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      // Use the unified stage transition service with working API endpoints
      await stageTransitionService.updateStage(applicationId, currentStage, newStage, {
        note: `Updated via workflow UI at ${new Date().toISOString()}`,
        interviewDetails: interviewDetails
      })

      alert(`✓ Successfully moved candidate to ${newStageLabel}`)
      loadData() // Reload data
    } catch (err) {
      console.error('Stage update error:', err)
      alert(`✗ Error: ${err.message}`)
    }
  }

  // Show loading while agency or workflow data is loading
  if ((agencyLoading || isLoading) && candidates.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show message if no agency data
  if (!agencyLoading && !agencyData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Agency Found</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please set up your agency profile first.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button onClick={loadData} className="btn-primary">
            {t('actions.retry', 'Retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('title', 'Workflow Management')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('subtitle', 'Manage candidates through post-interview workflow stages')}
        </p>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="mb-8">
          {/* Summary Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 transition-all duration-300 ${searchQuery ? 'opacity-50' : 'opacity-100'}`}>
            <div className="card p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">{t('analytics.totalCandidates', 'Total Candidates')}</p>
                  <p className="text-3xl font-bold">{analytics.total_candidates || 0}</p>
                </div>
                <Users className="w-10 h-10 text-blue-200" />
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">{t('analytics.interviewPassed', 'Interview Passed')}</p>
                  <p className="text-3xl font-bold">{analytics.by_stage?.interview_passed || 0}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-200" />
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">{t('analytics.totalProcessed', 'Total Processed')}</p>
                  <p className="text-3xl font-bold">{analytics.by_stage?.interview_passed || 0}</p>
                </div>
                <Users className="w-10 h-10 text-purple-200" />
              </div>
            </div>

            <div className="card p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">{t('analytics.successRate', 'Success Rate')}</p>
                  <p className="text-3xl font-bold">
                    {analytics.conversion_rates?.overall_success_rate?.toFixed(1) || 0}%
                  </p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Circular Stage Overview - Hidden when searching */}
          {!searchQuery && (
            <div className="grid grid-cols-5 gap-4">
              {stages
                .filter(stage => stage.id !== 'interview_rescheduled') // Hide interview_rescheduled from filters
                .map((stage) => {
                // For interview_scheduled, include interview_rescheduled count
                let count = analytics.by_stage?.[stage.id] || 0
                if (stage.id === 'interview_scheduled') {
                  count += analytics.by_stage?.['interview_rescheduled'] || 0
                }
                const isActive = stage.id === selectedStage

                return (
                  <div
                    key={stage.id}
                    className="flex flex-col items-center cursor-pointer transition-all hover:scale-105"
                    onClick={() => handleStageChange(stage.id)}
                  >
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-gray-100 font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:border-gray-400 dark:hover:border-gray-500
                      ${isActive ? 'ring-4 ring-primary-300 dark:ring-primary-500/50 scale-110 border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : ''}
                    `}>
                      {count}
                    </div>
                    <p className={`text-xs text-center mt-2 font-medium leading-tight whitespace-nowrap ${
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-400'
                    }`}>
                      {getStageLabel(stage.id)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Search mode indicator */}
          {searchQuery && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <Search className="w-4 h-4 inline mr-2" />
                Searching across all workflow stages
              </p>
            </div>
          )}
        </div>
      )}



      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name, phone, passport, email..."
            value={searchInput}
            onChange={handleSearchInput}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            autoComplete="off"
            className="pl-10 pr-10 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {searchInput !== searchQuery && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            )}
            {searchInput && (
              <button
                onClick={handleClearSearch}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4 mb-6 relative">
        {isLoading && candidates.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}
        {!isLoading && candidates.length === 0 ? (
          <div className="card p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('empty.noCandidates')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? t('empty.noSearchResults') : t('empty.noStageResults')}
            </p>
          </div>
        ) : (
          candidates.map((candidate) => (
            <CandidateWorkflowCard
              key={candidate.application?.id || candidate.id}
              candidate={candidate}
              stages={stages}
              onUpdateStage={handleUpdateStage}
              getValidNextStages={getValidNextStages}
              onScheduleInterview={() => {
                setSelectedCandidateForInterview(candidate)
                setIsReschedule(false)
                setShowInterviewDialog(true)
              }}
              onRescheduleInterview={(candidate) => {
                setSelectedCandidateForInterview(candidate)
                setIsReschedule(true)
                setShowInterviewDialog(true)
              }}
              t={t}
            />
          ))
        )}
      </div>

      {/* Interview Schedule Dialog */}
      <InterviewScheduleDialog
        isOpen={showInterviewDialog}
        onClose={() => {
          setShowInterviewDialog(false)
          setSelectedCandidateForInterview(null)
          setIsReschedule(false)
        }}
        onSubmit={async (interviewDetails) => {
          if (selectedCandidateForInterview) {
            if (isReschedule) {
              // Reschedule existing interview
              try {
                const interviewId = selectedCandidateForInterview.interview?.id
                if (!interviewId) {
                  throw new Error('Interview ID not found')
                }
                
                await stageTransitionService.rescheduleInterview(
                  selectedCandidateForInterview.application.id,
                  interviewId,
                  interviewDetails
                )
                
                alert('✓ Interview rescheduled successfully')
                loadData()
              } catch (err) {
                alert(`✗ Error: ${err.message}`)
              }
            } else {
              // Schedule new interview
              await handleUpdateStage(
                selectedCandidateForInterview.id,
                selectedCandidateForInterview.application.id,
                'interview_scheduled',
                selectedCandidateForInterview.application.status,
                interviewDetails
              )
            }
          }
        }}
        candidateName={selectedCandidateForInterview?.full_name}
        initialData={isReschedule ? {
          date: selectedCandidateForInterview?.interview?.interview_date_ad || '',
          time: selectedCandidateForInterview?.interview?.interview_time?.substring(0, 5) || '10:00',
          location: selectedCandidateForInterview?.interview?.location || 'Office',
          interviewer: selectedCandidateForInterview?.interview?.contact_person || '',
          duration: selectedCandidateForInterview?.interview?.duration_minutes || 60,
          requirements: selectedCandidateForInterview?.interview?.required_documents || ['cv', 'citizenship', 'education', 'photo', 'hardcopy'],
          notes: ''
        } : null}
        isReschedule={isReschedule}
      />

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between card p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1} to{' '}
            {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of{' '}
            {pagination.total_items} candidates
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={pagination.current_page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('actions.previous', 'Previous')}
            </button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              {t('pagination.page', 'Page {{current}} of {{total}}').replace('{{current}}', pagination.current_page).replace('{{total}}', pagination.total_pages)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('actions.next', 'Next')}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// Candidate Card Component (matching original Workflow design)
const CandidateWorkflowCard = ({ candidate, stages, onUpdateStage, getValidNextStages, onScheduleInterview, onRescheduleInterview, t }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (newStage, interviewDetails = null) => {
    setIsUpdating(true)
    try {
      await onUpdateStage(candidate.id, candidate.application.id, newStage, candidate.application.status, interviewDetails)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStage = stages.find(s => s.id === candidate.application.status)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow bg-white dark:bg-gray-800">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Candidate info */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {candidate.full_name?.charAt(0)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                  {candidate.full_name}
                </h3>
                {currentStage && (
                  <span className="chip chip-blue text-xs flex-shrink-0">
                    {currentStage.label}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Phone className="w-3 h-3 mr-1" />
                  <span>{candidate.phone}</span>
                </div>

                {candidate.passport_number && (
                  <div className="flex items-center">
                    <CreditCard className="w-3 h-3 mr-1" />
                    <span>{t('candidateCard.passportLabel', 'Passport')}: {candidate.passport_number}</span>
                  </div>
                )}

                {candidate.job?.posting_title && (
                  <div className="flex items-center">
                    <Briefcase className="w-3 h-3 mr-1" />
                    <span className="font-medium">{candidate.job.posting_title}</span>
                  </div>
                )}

                {candidate.interview?.interview_date_ad && (
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Interview: {candidate.interview.interview_date_ad}</span>
                  </div>
                )}

                {candidate.documents && candidate.documents.length > 0 && (
                  <div className="flex items-center">
                    <Paperclip className="w-3 h-3 mr-1 text-gray-400 dark:text-gray-500" />
                    <span>{candidate.documents.length} docs</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
            {/* Stage-specific action buttons */}
            {candidate.application?.status === 'applied' && (
              <button
                onClick={() => handleStatusUpdate('shortlisted')}
                disabled={isUpdating}
                className="text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
                title="Shortlist candidate"
              >
                {t('actions.shortlist', 'Shortlist')}
              </button>
            )}

            {candidate.application?.status === 'shortlisted' && (
              <button
                onClick={onScheduleInterview}
                disabled={isUpdating}
                className="text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                title="Schedule interview"
              >
                {t('actions.scheduleInterview', 'Schedule Interview')}
              </button>
            )}

            {(candidate.application?.status === 'interview_scheduled' || 
              candidate.application?.status === 'interview_rescheduled') && (
              <>
                <button
                  onClick={() => handleStatusUpdate('interview_passed')}
                  disabled={isUpdating}
                  className="text-xs px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
                  title="Mark interview as passed"
                >
                  {t('actions.pass', 'Pass')}
                </button>
                <button
                  onClick={async () => {
                    const confirmed = window.confirm(
                      `Are you sure you want to mark this interview as FAILED?\n\nThis action cannot be undone.`
                    )
                    if (confirmed) {
                      await handleStatusUpdate('interview_failed')
                    }
                  }}
                  disabled={isUpdating}
                  className="text-xs px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors"
                  title="Mark interview as failed"
                >
                  {t('actions.fail', 'Fail')}
                </button>
                <button
                  onClick={() => onRescheduleInterview(candidate)}
                  disabled={isUpdating}
                  className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  title="Reschedule interview"
                >
                  {t('actions.reschedule', 'Reschedule')}
                </button>
              </>
            )}

            {candidate.application?.status === 'interview_passed' && (
              <span className="text-xs px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {t('actions.finalStage', 'Final Stage')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowV2
