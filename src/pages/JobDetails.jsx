import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Eye,
  Star,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  UserCheck,
  Download,
  Phone,
  FileText,
  Mail,
  GraduationCap,
  Heart,
  Briefcase,
  Home,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { jobService, applicationService, candidateService, constantsService } from '../services/index.js'
import CandidateDataSource from '../api/datasources/CandidateDataSource.js'
import ApplicationDataSource from '../api/datasources/ApplicationDataSource.js'
import stageTransitionService from '../services/stageTransitionService.js'
import InterviewScheduleDialog from '../components/InterviewScheduleDialog.jsx'
import { useAgency } from '../contexts/AgencyContext.jsx'
import { formatExperience, formatLocation } from '../utils/candidateFormatter.js'
import { format } from 'date-fns'
import { formatDateWithRelative } from '../utils/helpers.js'
import { useConfirm } from '../components/ConfirmProvider.jsx'
import EnhancedInterviewScheduling from '../components/EnhancedInterviewScheduling.jsx'
import ScheduledInterviews from '../components/ScheduledInterviews.jsx'
import CandidateSummaryS2 from '../components/CandidateSummaryS2.jsx'
import { useLanguage } from '../hooks/useLanguage'


const JobDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { confirm } = useConfirm()
  const { agencyData, isLoading: agencyLoading } = useAgency()
  const { tPageSync } = useLanguage({ 
    pageName: 'job-details', 
    autoLoad: true 
  })

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  // Initialize state from URL params
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'applied')
  const [topNFilter, setTopNFilter] = useState(parseInt(searchParams.get('limit')) || 10)
  const [showShortlistPool, setShowShortlistPool] = useState(searchParams.get('view') === 'shortlist')
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [selectedTags, setSelectedTags] = useState(searchParams.get('tags')?.split(',').filter(Boolean) || [])
  const [availableTags, setAvailableTags] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarLoading, setIsSidebarLoading] = useState(false)

  // State for service layer data
  const [job, setJob] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [appliedCandidates, setAppliedCandidates] = useState([])
  const [shortlistedCandidates, setShortlistedCandidates] = useState([])
  const [scheduledCandidates, setScheduledCandidates] = useState([])
  const [applicationStages, setApplicationStages] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isShortlisting, setIsShortlisting] = useState(false)
  const [isBulkRejecting, setIsBulkRejecting] = useState(false)
  const [isCompletingShortlisting, setIsCompletingShortlisting] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [scheduledFilter, setScheduledFilter] = useState('all') // today, tomorrow, unattended, all - default to 'all'

  // Workflow stages configuration - consistent with Workflow page
  const workflowStages = [
    { id: 'applied', label: tPage('stages.applied') },
    { id: 'shortlisted', label: tPage('stages.shortlisted') },
    { id: 'scheduled', label: tPage('stages.scheduled') },
    { id: 'interviewed', label: tPage('stages.interviewed') },
    { id: 'selected', label: tPage('stages.selected') },
    { id: 'rejected', label: tPage('stages.rejected') }
  ]

  // Load data on mount and when filters change
  useEffect(() => {
    // Wait for agency data to load before fetching job details
    if (!agencyLoading) {
      loadAllData()
    }
  }, [id, topNFilter, selectedTags, agencyLoading])

  // Load only scheduled candidates when filter changes (no full page reload)
  useEffect(() => {
    if (activeTab === 'scheduled' && scheduledFilter) {
      loadScheduledCandidates()
    }
  }, [scheduledFilter])

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        handleCloseSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if agency license is available
      const license = agencyData?.license_number
      if (!license) {
        console.warn('Agency license not available, cannot load job details')
        setError(new Error('Agency information not available. Please try again.'))
        setIsLoading(false)
        return
      }

      // Load constants first
      const stages = await constantsService.getApplicationStages()
      setApplicationStages(stages)

      // ✅ NEW: Single API call for job details + analytics
      const jobData = await CandidateDataSource.getJobDetails(license, id)
      if (!jobData) {
        setError(new Error('Job not found'))
        return
      }
      
      setJob(jobData)
      
      // Set available tags from job tags (for skill filtering)
      if (jobData.tags && jobData.tags.length > 0) {
        setAvailableTags(jobData.tags)
      }
      
      // Set analytics from the job details response
      if (jobData.analytics) {
        setAnalytics(jobData.analytics)
      }

      // ✅ NEW: Load candidates for each tab using optimized endpoint
      // Load applied candidates with filtering and pagination
      const appliedOptions = {
        stage: 'applied',
        limit: topNFilter === 'all' ? 100 : topNFilter, // Use 100 for "all", will paginate if needed
        offset: 0,
        skills: selectedTags.length > 0 ? selectedTags : undefined,
        sortBy: 'priority_score',
        sortOrder: 'desc'
      }
      
      let appliedData
      if (topNFilter === 'all') {
        // For "all", load all candidates with pagination
        appliedData = await CandidateDataSource.getAllCandidates(
          license,
          id,
          appliedOptions,
          (current, total) => {
            console.log(`Loading candidates: ${current}/${total}`)
          },
          license
        )
        setAppliedCandidates(appliedData)
      } else {
        // For limited results, single API call
        const response = await CandidateDataSource.getCandidates(license, id, appliedOptions)
        setAppliedCandidates(response.candidates)
      }

      // Load shortlisted candidates
      if (activeTab === 'shortlisted' || true) { // Always load for counts
        const shortlistedResponse = await CandidateDataSource.getCandidates(
          license,
          id,
          {
            stage: 'shortlisted',
            limit: 100,
            offset: 0,
            sortBy: 'priority_score',
            sortOrder: 'desc'
          },
          license
        )
        setShortlistedCandidates(shortlistedResponse.candidates)
      }

      // Load scheduled candidates with filter
      if (activeTab === 'scheduled' || true) { // Always load for counts
        const scheduledResponse = await CandidateDataSource.getCandidates(
          license,
          id,
          {
            stage: 'interview-scheduled', // ✅ FIXED: Use frontend format, will be mapped to 'interview_scheduled'
            limit: 100,
            offset: 0,
            sortBy: 'priority_score',
            sortOrder: 'desc',
            interviewFilter: scheduledFilter // today, tomorrow, unattended, all
          },
          license
        )
        setScheduledCandidates(scheduledResponse.candidates)
      }

    } catch (err) {
      console.error('Error loading job details:', err)
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Load only scheduled candidates when filter changes (no full page reload)
  const loadScheduledCandidates = async () => {
    try {
      const license = agencyData?.license_number
      if (!license) {
        console.warn('Agency license not available')
        return
      }

      console.log(`📋 Loading scheduled candidates with filter: ${scheduledFilter}`)
      
      const scheduledResponse = await CandidateDataSource.getCandidates(
        license,
        id,
        {
          stage: 'interview-scheduled',
          limit: 100,
          offset: 0,
          sortBy: 'priority_score',
          sortOrder: 'desc',
          interviewFilter: scheduledFilter // today, tomorrow, unattended, all
        },
        license
      )
      
      setScheduledCandidates(scheduledResponse.candidates)
      console.log(`✅ Loaded ${scheduledResponse.candidates.length} scheduled candidates`)
      
    } catch (err) {
      console.error('Error loading scheduled candidates:', err)
      // Don't set global error, just log it
    }
  }

  const handleCandidateSelect = (candidateId) => {
    const newSelected = new Set(selectedCandidates)
    if (newSelected.has(candidateId)) {
      newSelected.delete(candidateId)
    } else {
      newSelected.add(candidateId)
    }
    setSelectedCandidates(newSelected)
  }

  const updateUrlParams = (updates) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    setSearchParams(newParams)
  }

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag]
      setSelectedTags(newTags)
      updateUrlParams({ tags: newTags.join(',') })
    }
  }

  const removeTag = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove)
    setSelectedTags(newTags)
    updateUrlParams({ tags: newTags.length > 0 ? newTags.join(',') : null })
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    updateUrlParams({ tab: tabId })
  }

  const handleTopNFilterChange = (value) => {
    // Save current scroll position
    const scrollY = window.scrollY
    
    setTopNFilter(value)
    updateUrlParams({ limit: value === 10 ? null : value })
    
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }

  const handleShowShortlistPoolChange = (show) => {
    // Save current scroll position
    const scrollY = window.scrollY
    
    setShowShortlistPool(show)
    updateUrlParams({ view: show ? 'shortlist' : null })
    
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }

  const handleScheduledFilterChange = (filter) => {
    // Save current scroll position
    const scrollY = window.scrollY
    
    setScheduledFilter(filter)
    
    // Restore scroll position after state update
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
    })
  }

  const handleShortlist = async (candidateId) => {
    try {
      setIsShortlisting(true)
      const candidate = appliedCandidates.find(c => c.id === candidateId)
      
      if (!candidate) {
        throw new Error('Candidate not found')
      }
      
      // Get application ID from either structure
      const applicationId = candidate.application?.id || candidate.application_id
      
      if (!applicationId) {
        console.error('Candidate data:', candidate)
        throw new Error('Application ID not found for candidate')
      }
      
      // ✅ NEW: Use real API instead of mock
      await ApplicationDataSource.shortlistApplication(
        applicationId,
        'Shortlisted from job details',
        'agency'
      )
      
      console.log('✅ Candidate shortlisted successfully')
      
      // Reload data to reflect changes
      await loadAllData()
      
    } catch (error) {
      console.error('❌ Failed to shortlist candidate:', error)
      alert(error.message || 'Failed to shortlist candidate')
    } finally {
      setIsShortlisting(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedCandidates.size === 0) return

    try {
      setIsBulkRejecting(true)
      
      // Get agency license
      const license = agencyData?.license_number
      if (!license) {
        throw new Error('Agency license not available')
      }

      // Convert Set to Array of candidate IDs and extract application IDs
      const candidateIds = Array.from(selectedCandidates)
      const applicationIds = []
      
      for (const candidateId of candidateIds) {
        const candidate = appliedCandidates.find(c => c.id === candidateId)
        if (candidate) {
          const applicationId = candidate.application?.id || candidate.application_id
          if (applicationId) {
            applicationIds.push(applicationId)
          }
        }
      }
      
      if (applicationIds.length === 0) {
        throw new Error('No valid applications found to reject')
      }
      
      // ✅ NEW: Use bulk reject API with application IDs
      const result = await CandidateDataSource.bulkRejectCandidates(
        license,
        id,
        applicationIds,
        'Does not meet requirements' // Optional reason
      )

      // Show summary message
      if (result.success) {
        const total = applicationIds.length
        const failed = result.failed?.length || 0
        const succeeded = result.updated_count || 0
        
        if (failed === 0) {
          // All succeeded
          console.log(`✅ Successfully rejected ${succeeded} candidate(s)`)
        } else {
          // Partial success
          console.warn(
            `⚠️ Rejected ${succeeded} of ${total} candidates. ${failed} failed.`,
            result.errors
          )
        }
      }

      setSelectedCandidates(new Set())
      loadAllData() // Reload data
    } catch (error) {
      console.error('Failed to bulk reject candidates:', error)
      setError(error)
    } finally {
      setIsBulkRejecting(false)
    }
  }

  const handleBulkShortlist = async () => {
    if (selectedCandidates.size === 0) return

    try {
      setIsShortlisting(true)
      
      // Get agency license
      const license = agencyData?.license_number
      if (!license) {
        throw new Error('Agency license not available')
      }

      // Convert Set to Array of candidate IDs and extract application IDs
      const candidateIds = Array.from(selectedCandidates)
      const applicationIds = []
      
      for (const candidateId of candidateIds) {
        const candidate = appliedCandidates.find(c => c.id === candidateId)
        if (candidate) {
          const applicationId = candidate.application?.id || candidate.application_id
          if (applicationId) {
            applicationIds.push(applicationId)
          }
        }
      }
      
      if (applicationIds.length === 0) {
        throw new Error('No valid applications found to shortlist')
      }
      
      // ✅ NEW: Use bulk shortlist API with application IDs
      const result = await CandidateDataSource.bulkShortlistCandidates(
        license,
        id,
        applicationIds
      )

      // Show summary message
      if (result.success) {
        const total = applicationIds.length
        const failed = result.failed?.length || 0
        const succeeded = result.updated_count || 0
        
        if (failed === 0) {
          // All succeeded
          console.log(`✅ Successfully shortlisted ${succeeded} candidate(s)`)
        } else {
          // Partial success
          console.warn(
            `⚠️ Shortlisted ${succeeded} of ${total} candidates. ${failed} failed.`,
            result.errors
          )
        }
      }

      setSelectedCandidates(new Set())
      loadAllData() // Reload data
    } catch (error) {
      console.error('Failed to bulk shortlist candidates:', error)
      setError(error)
    } finally {
      setIsShortlisting(false)
    }
  }

  const handleBulkSchedule = () => {
    if (selectedCandidates.size === 0) return

    // Navigate to shortlisted tab with selected candidates for scheduling
    const candidateIds = Array.from(selectedCandidates)
    // Use navigate to redirect to the shortlisted tab URL
    navigate(`/jobs/${id}?tab=shortlisted`)
    // You could pass the selected candidate IDs to pre-select them in the scheduling interface
    setSelectedCandidates(new Set())
  }

  const handleCandidateClick = async (candidate) => {
    try {
      // Get the application ID - it could be in different places depending on data source
      const applicationId = candidate.application?.id || candidate.application_id
      const candidateId = candidate.id || candidate.candidate_id
      
      console.log('📋 Candidate clicked:', { candidateId, applicationId, candidate })
      
      if (!applicationId || !candidateId) {
        console.warn('❌ Missing required IDs:', { applicationId, candidateId })
        setError('Missing candidate or application ID')
        return
      }
      
      // Transform candidate to have the structure S2 expects
      const transformedCandidate = {
        ...candidate,
        id: candidateId,
        application: {
          id: applicationId,
          stage: candidate.status // Map status to stage
        }
      }
      
      // Set the candidate - S2 will use applicationId and candidateId from the object
      console.log('✅ Setting candidate for S2:', { id: candidateId, application: { id: applicationId } })
      setSelectedCandidate(transformedCandidate)
      setIsSidebarOpen(true)
      
    } catch (error) {
      console.error('❌ Failed to handle candidate click:', error)
      setError(error.message || 'Failed to load candidate')
    } finally {
      setIsSidebarLoading(false)
    }
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedCandidate(null)
  }

  // Define strict stage progression rules
  const getNextAllowedStage = (currentStage) => {
    const stageOrder = {
      'applied': 'shortlisted',
      'shortlisted': 'interview-scheduled',
      'interview-scheduled': 'interview-passed',
      'interview-passed': null // Final stage
    }
    return stageOrder[currentStage]
  }

  const validateStageTransition = (currentStage, targetStage) => {
    // Only allow progression to the immediate next stage
    const nextAllowed = getNextAllowedStage(currentStage)
    return targetStage === nextAllowed
  }

  const handleUpdateStatus = async (applicationId, newStage) => {
    console.log('🎯 JobDetails.handleUpdateStatus called:', { applicationId, newStage })
    try {
      console.log('✅ Calling API directly...')
      await applicationService.updateApplicationStage(applicationId, newStage)
      console.log('✅ API call completed, reloading data...')
      await loadAllData() // Reload data
      handleCloseSidebar() // Close sidebar after successful update
    } catch (error) {
      console.error('Failed to update status:', error)
      await confirm({
        title: 'Error',
        message: 'Failed to update candidate status. Please try again.',
        confirmText: 'Okay',
        type: 'danger'
      })
    }
  }

  const handleAttachDocument = async (candidateId, document) => {
    try {
      const confirmed = await confirm({
        title: 'Confirm Document Attachment',
        message: `Are you sure you want to attach the document "${document.name}" to this candidate?`,
        confirmText: 'Yes, Attach',
        cancelText: 'Cancel',
        type: 'info'
      })

      if (confirmed) {
        await applicationService.attachDocument(candidateId, document)
        await loadAllData() // Reload data

        // Update the selected candidate to reflect the new document
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          // Get the updated application data for this candidate
          const updatedApplications = await applicationService.getApplicationsByCandidateId(candidateId)
          if (updatedApplications && updatedApplications.length > 0) {
            const updatedApplication = updatedApplications[0] // Get the first (and likely only) application
            setSelectedCandidate({
              ...selectedCandidate,
              application: updatedApplication,
              documents: updatedApplication.documents
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to attach document:', error)
      await confirm({
        title: 'Error',
        message: 'Failed to attach document. Please try again.',
        confirmText: 'Okay',
        type: 'danger'
      })
    }
  }

  const handleRemoveDocument = async (candidateId, docIndex) => {
    try {
      // Pass only the candidateId and docIndex (stage parameter is no longer needed)
      await applicationService.removeDocument(candidateId, docIndex)
      await loadAllData() // Reload data

      // Update the selected candidate to reflect the removed document
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        // Get the updated application data for this candidate
        const updatedApplications = await applicationService.getApplicationsByCandidateId(candidateId)
        if (updatedApplications && updatedApplications.length > 0) {
          const updatedApplication = updatedApplications[0] // Get the first (and likely only) application
          setSelectedCandidate({
            ...selectedCandidate,
            application: updatedApplication,
            documents: updatedApplication.documents
          })
        }
      }
    } catch (error) {
      console.error('Failed to remove document:', error)
      await confirm({
        title: 'Error',
        message: 'Failed to remove document. Please try again.',
        confirmText: 'Okay',
        type: 'danger'
      })
    }
  }

  const handleToggleShortlist = async (candidate) => {
    try {
      const isCurrentlyShortlisted = candidate.application.stage === applicationStages.SHORTLISTED
      const newStage = isCurrentlyShortlisted ? applicationStages.APPLIED : applicationStages.SHORTLISTED

      await applicationService.updateApplicationStage(candidate.application.id, newStage)
      loadAllData() // Reload data

      // Update the selected candidate if it's the same one
      if (selectedCandidate && selectedCandidate.id === candidate.id) {
        const updatedCandidate = { ...candidate }
        updatedCandidate.application.stage = newStage
        setSelectedCandidate(updatedCandidate)
      }
    } catch (error) {
      console.error('Failed to toggle shortlist:', error)
      setError(error)
    }
  }

  const handleCompleteShortlisting = () => {
    setShowCompletionDialog(true)
  }

  const handleConfirmCompleteShortlisting = async () => {
    try {
      setIsCompletingShortlisting(true)
      setShowCompletionDialog(false)

      // Use new toggle API to close job posting (automatically rejects all "applied" candidates)
      const result = await jobService.toggleJobStatus(id, false)

      // Reload data to reflect changes
      loadAllData()

      // Show success message with rejection count
      const rejectedCount = result.rejected_count || 0
      console.log(`✅ Job posting closed successfully. ${rejectedCount} candidates with "applied" status were automatically rejected.`)
      
      // Optional: Show user-friendly notification if you have a toast system
      if (rejectedCount > 0) {
        alert(`Job posting closed. ${rejectedCount} pending applications were automatically rejected.`)
      }

    } catch (error) {
      console.error('Failed to complete shortlisting:', error)
      setError(error)
    } finally {
      setIsCompletingShortlisting(false)
    }
  }

  const tabs = [
    { id: 'applied', label: tPage('tabs.applied'), count: appliedCandidates.length },
    { id: 'shortlisted', label: tPage('tabs.shortlisted'), count: shortlistedCandidates.length },
    { id: 'scheduled', label: tPage('tabs.scheduled'), count: scheduledCandidates.length }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-8xl mx-auto">
          <div className="animate-pulse">
            <div className="h-4 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6 sm:mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <div className="card p-4 sm:p-6">
                  <div className="h-4 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between py-3 sm:py-4 border-b dark:border-gray-700">
                      <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-4 sm:p-6">
                <div className="h-4 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-3 sm:px-6">
        <div className="card p-6 sm:p-8 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {error?.message === 'Job not found' ? 'Job not found' : 'Failed to load job'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6">
            {error?.message === 'Job not found'
              ? "The job you're looking for doesn't exist or has been removed."
              : error?.message || 'An error occurred while loading the job details.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={loadAllData}
              className="btn-secondary text-xs sm:text-sm py-2.5 sm:py-3"
            >
              {tPage('labels.retry')}
            </button>
            <Link to="/jobs" className="btn-primary text-xs sm:text-sm py-2.5 sm:py-3">
              {tPage('actions.backToJobs')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const CandidateCard = ({ candidate, onShortlist, showShortlistButton = false, showSelectCheckbox = false }) => (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer bg-white dark:bg-gray-800 shadow-sm hover:shadow-md"
      onClick={() => handleCandidateClick(candidate)}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6 flex-1 min-w-0">
          {showSelectCheckbox && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-start"
            >
              <input
                type="checkbox"
                checked={selectedCandidates.has(candidate.id)}
                onChange={(e) => {
                  e.stopPropagation()
                  handleCandidateSelect(candidate.id)
                }}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 self-start h-5 w-5"
              />
            </div>
          )}

          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg sm:text-xl font-medium text-gray-600 dark:text-gray-300">
              {candidate.name.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Name and Priority Score */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{candidate.name}</h3>
                {candidate.gender && (
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{candidate.gender}</p>
                )}
              </div>
              {candidate.priority_score && (
                <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap text-xs sm:text-sm">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <span className="font-bold text-yellow-700 dark:text-yellow-300">{candidate.priority_score}% Match</span>
                </div>
              )}
            </div>

            {/* Position Information */}
            {candidate.position && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 line-clamp-1">{candidate.position.title}</p>
                
                {/* Salary */}
                {candidate.position.salary && (
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="text-blue-800 dark:text-blue-200">
                      💰 {candidate.position.salary.amount?.toLocaleString()} {candidate.position.salary.currency}
                    </p>
                    {candidate.position.salary.converted_amount && (
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        ≈ {candidate.position.salary.converted_amount.toLocaleString()} {candidate.position.salary.converted_currency}
                        {candidate.position.salary.conversion_rate && (
                          <span className="text-gray-600 dark:text-gray-400"> @ {candidate.position.salary.conversion_rate}</span>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Contact Information */}
            <div className="space-y-1 text-xs sm:text-sm">
              {candidate.address && (
                <div className="flex items-start text-gray-600 dark:text-gray-400">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="truncate">{candidate.address}</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{candidate.phone}</span>
                </div>
              )}
              {candidate.email && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{candidate.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex flex-col items-start sm:items-end space-y-2 sm:space-y-3 min-w-max">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full">
            {candidate.applied_at 
              ? tPage('labels.appliedOn', { date: format(new Date(candidate.applied_at), 'MMM dd, yyyy') })
              : tPage('labels.appliedRecently')
            }
          </span>

          {showShortlistButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShortlist(candidate.id)
              }}
              className="btn-primary text-xs sm:text-sm px-2 sm:px-4 py-2 whitespace-nowrap flex items-center"
              disabled={isShortlisting}
            >
              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isShortlisting ? tPage('labels.shortlisting') : tPage('actions.shortlist')}</span>
              <span className="sm:hidden">{isShortlisting ? '...' : 'Add'}</span>
            </button>
          )}

          <button
            onClick={(e) => e.stopPropagation()}
            className="text-xs sm:text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 whitespace-nowrap flex items-center"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">{tPage('actions.viewProfile')}</span>
            <span className="sm:hidden">View</span>
          </button>
        </div>
      </div>
    </div>
  )

  const CompletionConfirmationDialog = ({ isOpen, onClose, onConfirm, nonShortlistedCount, shortlistedCount }) => {
    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

          <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                  {tPage('jobStatus.markShortlistingComplete')}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {tPage('dialog.completionTitle')}
                  </p>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">{tPage('dialog.importantImplications')}</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>{tPage('dialog.remainingApplicantsRejected', { count: nonShortlistedCount })}</li>
                      <li>{tPage('dialog.shortlistedProceed', { count: shortlistedCount })}</li>
                      <li>{tPage('dialog.cannotUndo')}</li>
                      <li>{tPage('dialog.rejectedNotified')}</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">{tPage('afterCompletion.title')}</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• {tPage('afterCompletion.proceedToSchedule')}</li>
                      <li>• {tPage('afterCompletion.jobWillMove')}</li>
                      <li>• {tPage('afterCompletion.dataPreserved')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onConfirm}
                disabled={isCompletingShortlisting}
              >
{isCompletingShortlisting ? 'Processing...' : tPage('dialog.confirm')}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={onClose}
                disabled={isCompletingShortlisting}
              >
{tPage('dialog.cancel')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Removed old Applicant Summary; using unified CandidateSummaryS2

  const renderTabContent = () => {
    switch (activeTab) {
      case 'applied':
        const displayedCandidates = showShortlistPool ? shortlistedCandidates : appliedCandidates

        return (
          <div className="space-y-6">
            {/* Why I'm here section */}
            {!showShortlistPool && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">{tPage('whyImHere.title')}</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{tPage('whyImHere.description')}</p>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  {tPage('whyImHere.hint')}
                </div>
              </div>
            )}

            {/* Skill-Based Filtering - Increased size */}
            {!showShortlistPool && (
              <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{tPage('filtering.title')}</h3>
                  <div className="flex items-center space-x-4">
                    <label className="text-base font-medium text-gray-700 dark:text-gray-300">{tPage('filtering.showTop')}</label>
                    <select
                      value={topNFilter}
                      onChange={(e) => handleTopNFilterChange(Number(e.target.value))}
                      className="form-select-sm"
                    >
                      <option value={10}>{tPage('filtering.top10')}</option>
                      <option value={20}>{tPage('filtering.top20')}</option>
                      <option value={50}>{tPage('filtering.top50')}</option>
                      <option value={0}>{tPage('filtering.viewAll', { count: appliedCandidates.length })}</option>
                    </select>
                  </div>
                </div>

                <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                  {tPage('filtering.description')}
                </p>

                {/* Results summary */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-base">
                    <span className="text-gray-700 dark:text-gray-300">
                      {tPage('filtering.showing', { current: appliedCandidates.length, total: appliedCandidates.length })}
                      {selectedTags.length > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 ml-2">
                          {tPage('filtering.filteredBy', { count: selectedTags.length, plural: selectedTags.length !== 1 ? 's' : '' })}
                        </span>
                      )}
                      {(searchParams.toString() && searchParams.toString() !== 'tab=applied') && (
                        <span className="text-green-600 dark:text-green-400 ml-2 text-sm">
                          • {tPage('filtering.filtersPreserved')}
                        </span>
                      )}
                    </span>
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedTags([])
                          updateUrlParams({ tags: null })
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        {tPage('filtering.clearAllFilters')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Shortlisting Progress */}
                {shortlistedCandidates.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                        <div>
                          <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">{tPage('progress.title')}</h4>
                          <p className="text-base text-green-700 dark:text-green-300">
                            {tPage('progress.candidatesShortlisted', { count: shortlistedCandidates.length, plural: shortlistedCandidates.length !== 1 ? 's' : '' })}
                            {' '}{tPage('progress.remainingToReview', { count: appliedCandidates.length })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                          {Math.round((shortlistedCandidates.length / (shortlistedCandidates.length + appliedCandidates.length)) * 100)}%
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">{tPage('progress.complete')}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Tags */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {selectedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    >
                      AND: {tag}
                      <button
                        type="button"
                        className="flex-shrink-0 ml-2 h-5 w-5 rounded-full inline-flex items-center justify-center text-blue-400 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 hover:text-blue-500 dark:hover:text-blue-200 focus:outline-none focus:bg-blue-500 focus:text-white"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Available Tags */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {availableTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => addTag(tag)}
                      className={`text-sm px-4 py-2 rounded-full transition-colors ${selectedTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tPage('filtering.tagSources')}
                </p>
              </div>
            )}

            {/* Action Buttons - Increased size and better spacing */}
            {!showShortlistPool && (
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  {job.is_active === false ? (
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: tPage('dialog.reopenTitle'),
                          message: tPage('dialog.reopenMessage'),
                          confirmText: tPage('dialog.reopenConfirm'),
                          cancelText: tPage('dialog.cancel'),
                          type: 'info'
                        })
                        
                        if (confirmed) {
                          try {
                            setIsLoading(true)
                            
                            // Use new toggle API to reopen
                            const result = await jobService.toggleJobStatus(id, true)
                            
                            // Reload data
                            await loadAllData()
                            
                            console.log('✅ Job posting reopened successfully')
                          } catch (error) {
                            console.error('❌ Failed to reopen job posting:', error)
                            alert(error.message || 'Failed to reopen job posting')
                          } finally {
                            setIsLoading(false)
                          }
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center text-base font-medium"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {tPage('jobStatus.reopenJobPosting')}
                    </button>
                  ) : (
                    <button
                      onClick={handleCompleteShortlisting}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-base font-medium"
                      disabled={isCompletingShortlisting}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {isCompletingShortlisting ? tPage('jobStatus.processing') : tPage('jobStatus.markShortlistingComplete')}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedCandidates.size > 0 && activeTab === 'applied' && (
                    <>
                      <button
                        onClick={handleBulkShortlist}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap text-base font-medium"
                        disabled={isShortlisting}
                      >
                        <UserCheck className="w-5 h-5 mr-2" />
                        {isShortlisting ? tPage('labels.shortlisting') : `${tPage('actions.shortlist')} (${selectedCandidates.size})`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Candidates List Header */}
            {showShortlistPool && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
{tPage('labels.shortlistedCandidates', { count: shortlistedCandidates.length })}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {tPage('labels.shortlistedDescription') || 'These candidates have been shortlisted for this position. Click any candidate to view their full profile.'}
                </p>
              </div>
            )}

            {/* Candidates List */}
            <div className="space-y-4">
              {displayedCandidates.length > 0 ? (
                displayedCandidates.map(candidate => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onShortlist={handleShortlist}
                    showShortlistButton={!showShortlistPool}
                    showSelectCheckbox={!showShortlistPool}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
{showShortlistPool ? tPage('labels.noShortlistedCandidates') : 'No candidates found'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {showShortlistPool
                      ? 'Start by shortlisting candidates from the applied candidates list.'
                      : 'Try adjusting your filters or check back later for new applications.'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Shortlist Pool Toggle - Increased size */}
            {shortlistedCandidates.length > 0 && (
              <div className="border-t pt-6">
                <button
                  onClick={() => handleShowShortlistPoolChange(!showShortlistPool)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between w-full p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors gap-4"
                >
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800/50 rounded-full flex items-center justify-center mr-6">
                      <UserCheck className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-green-900 dark:text-green-100 text-xl">Shortlist Pool</p>
                      <p className="text-lg text-green-700 dark:text-green-300 mt-2">
                        {shortlistedCandidates.length} candidate{shortlistedCandidates.length !== 1 ? 's' : ''} shortlisted
                      </p>
                      <p className="text-base text-green-600 dark:text-green-400 mt-2">
                        {showShortlistPool ? 'Click to show applied candidates' : 'Click to view shortlisted candidates'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="bg-green-600 text-white text-lg font-bold px-5 py-3 rounded-full">
                      {shortlistedCandidates.length}
                    </span>
                    {showShortlistPool ? (
                      <ChevronUp className="w-8 h-8 text-green-600" />
                    ) : (
                      <ChevronDown className="w-8 h-8 text-green-600" />
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>
        )

      case 'shortlisted':
        return (
          <div className="space-y-4">
            {shortlistedCandidates.length > 0 ? (
              <EnhancedInterviewScheduling
                candidates={shortlistedCandidates}
                jobId={id}
                onScheduled={() => {
                  // Refresh data after scheduling
                  loadAllData()
                }}
              />
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{tPage('labels.noShortlistedCandidates')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{tPage('labels.startByShortlisting')}</p>
              </div>
            )}
          </div>
        )

      case 'scheduled':
        return (
          <div className="space-y-4">
            <ScheduledInterviews
              key={`scheduled-${id}`}
              candidates={scheduledCandidates}
              jobId={id}
              currentFilter={scheduledFilter}
              onFilterChange={handleScheduledFilterChange}
              onDataReload={loadAllData}
              hideActionButtons={true}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-8xl mx-auto">
      {/* Completion Confirmation Dialog */}
      <CompletionConfirmationDialog
        isOpen={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        onConfirm={handleConfirmCompleteShortlisting}
        nonShortlistedCount={appliedCandidates.length}
        shortlistedCount={shortlistedCandidates.length}
      />

      {/* Unified Candidate Summary (Workflow-style) */}
      <CandidateSummaryS2
        applicationId={selectedCandidate?.application?.id}
        candidateId={selectedCandidate?.id}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
        <Link to="/jobs" className="hover:text-primary-600 transition-colors">
          Jobs
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">{job.title}</span>
      </div>

      {/* Job Header */}
      <div className="card p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2">{job.title}</h1>
                  {job.is_active === false && (
                    <span className="px-2 sm:px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                      {tPage('jobStatus.inactive')}
                    </span>
                  )}
                  {job.is_active === true && (
                    <span className="px-2 sm:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap">
                      {tPage('jobStatus.active')}
                    </span>
                  )}
                </div>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 truncate">{job.company}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>
                      {job.location 
                        ? `${job.location.city || ''}, ${job.location.country || ''}`.replace(/^, |, $/g, '')
                        : `${job.city || ''}, ${job.country || ''}`.replace(/^, |, $/g, '') || 'Location not specified'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>
                      Posted {job.created_at || job.posted_date 
                        ? formatDateWithRelative(job.created_at || job.posted_date, { format: 'MMM dd, yyyy' })
                        : 'Recently'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link to="/jobs" className="btn-secondary flex items-center justify-center text-xs sm:text-sm py-2 px-2 sm:px-4 w-full sm:w-auto">
                  <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{tPage('actions.backToJobs')}</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="mt-4 sm:mt-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">{tPage('analytics.title')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">{tPage('analytics.viewCount')}</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-200">{analytics?.view_count || job.view_count || 0}</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">{tPage('analytics.individualJobViews')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">{tPage('labels.applicantCount')}</p>
                      <div className="text-sm sm:text-lg font-semibold text-blue-900 dark:text-blue-200">
                        <div>{tPage('labels.total')}: {analytics?.total_applicants || job.applications_count || 0}</div>
                        <div>{tPage('labels.shortlisted')}: {analytics?.shortlisted_count || job.shortlisted_count || 0}</div>
                        <div>{tPage('labels.passed')}: {analytics?.passed_count || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates by Phase - Increased width */}
      <div className="card mt-4 sm:mt-6">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">{tPage('labels.candidatesByPhase')}</h2>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-8 px-3 sm:px-4 md:px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs ${activeTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-3 sm:p-4 md:p-6">
          {renderTabContent()}
        </div>
      </div>
      </div>
    </div>
  )
}

export default JobDetails 

