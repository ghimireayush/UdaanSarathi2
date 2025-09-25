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
import { format } from 'date-fns'
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
    loadAllData()
  }, [id, activeTab, topNFilter, selectedTags])

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

      // Load constants first
      const stages = await constantsService.getApplicationStages()
      setApplicationStages(stages)

      // Load job details
      const jobData = await jobService.getJobById(id)
      if (!jobData) {
        setError(new Error('Job not found'))
        return
      }
      setJob(jobData)

      // Set available tags from job tags
      if (jobData.tags && jobData.tags.length > 0) {
        setAvailableTags(jobData.tags);
      }

      // Load analytics data
      const analyticsData = {
        view_count: jobData.view_count || 0,
        total_applicants: jobData.applications_count || 0,
        shortlisted_count: jobData.shortlisted_count || 0,
        passed_count: jobData.passed_count || 0
      }
      setAnalytics(analyticsData)

      // Load all applications for this job
      const allJobApplications = await applicationService.getApplicationsByJobId(id)

      // Get detailed applications with candidate data
      const detailedApplications = await Promise.all(
        allJobApplications.map(async (app) => {
          const candidate = await candidateService.getCandidateById(app.candidate_id)
          return {
            ...candidate,
            application: app,
            documents: app.documents || []
          }
        })
      )

      // Filter by stage
      let applied = detailedApplications.filter(item => item.application.stage === stages.APPLIED)

      // Apply skill-based filtering if tags are selected
      if (selectedTags.length > 0) {
        applied = applied.filter(candidate => {
          // Check if candidate has ALL selected tags (AND semantics)
          return selectedTags.every(tag =>
            candidate.skills.includes(tag) ||
            (job && job.tags && job.tags.includes(tag))
          );
        });
      }

      // Sort by priority score (highest first)
      // Note: Backend handles all ranking algorithms based on skill matching criteria
      // Priority scores are calculated server-side using sophisticated matching algorithms
      applied.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

      const shortlisted = detailedApplications.filter(item => item.application.stage === stages.SHORTLISTED)
      const scheduled = detailedApplications.filter(item => item.application.stage === stages.SCHEDULED)

      setAppliedCandidates(applied.slice(0, activeTab === 'applied' ? topNFilter : applied.length))
      setShortlistedCandidates(shortlisted)
      setScheduledCandidates(scheduled)

    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
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
    setTopNFilter(value)
    updateUrlParams({ limit: value === 10 ? null : value })
  }

  const handleShowShortlistPoolChange = (show) => {
    setShowShortlistPool(show)
    updateUrlParams({ view: show ? 'shortlist' : null })
  }

  const handleShortlist = async (candidateId) => {
    try {
      setIsShortlisting(true)
      const candidate = appliedCandidates.find(c => c.id === candidateId)
      if (candidate && candidate.application) {
        await applicationService.updateApplicationStage(
          candidate.application.id,
          applicationStages.SHORTLISTED
        )
        loadAllData() // Reload data
      }
    } catch (error) {
      console.error('Failed to shortlist candidate:', error)
      setError(error)
    } finally {
      setIsShortlisting(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedCandidates.size === 0) return

    try {
      setIsBulkRejecting(true)
      const applicationIds = Array.from(selectedCandidates).map(candidateId => {
        const candidate = appliedCandidates.find(c => c.id === candidateId)
        return candidate?.application?.id
      }).filter(Boolean)

      await Promise.all(
        applicationIds.map(appId =>
          applicationService.updateApplicationStage(
            appId,
            applicationStages.REJECTED
          )
        )
      )

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
      const applicationIds = Array.from(selectedCandidates).map(candidateId => {
        const candidate = appliedCandidates.find(c => c.id === candidateId)
        return candidate?.application?.id
      }).filter(Boolean)

      await Promise.all(
        applicationIds.map(appId =>
          applicationService.updateApplicationStage(
            appId,
            applicationStages.SHORTLISTED
          )
        )
      )

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

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate)
    setIsSidebarOpen(true)
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

  const handleUpdateStatus = async (candidateId, newStage) => {
    try {
      const candidate = [
        ...appliedCandidates,
        ...shortlistedCandidates,
        ...scheduledCandidates
      ].find(c => c.id === candidateId)
      if (!candidate) return

      const currentStage = candidate.application.stage

      // Prevent any backward flow or skipping stages
      if (!validateStageTransition(currentStage, newStage)) {
        await confirm({
          title: 'Invalid Stage Transition',
          message: `You cannot move directly from "${workflowStages.find(s => s.id === currentStage)?.label}" to "${workflowStages.find(s => s.id === newStage)?.label}". Please follow the proper workflow sequence.`,
          confirmText: 'Okay',
          type: 'warning'
        })
        return
      }

      // Show confirmation dialog for valid transitions
      const currentStageLabel = workflowStages.find(s => s.id === currentStage)?.label
      const newStageLabel = workflowStages.find(s => s.id === newStage)?.label

      const confirmed = await confirm({
        title: 'Confirm Stage Update',
        message: `Are you sure you want to move this candidate from "${currentStageLabel}" to "${newStageLabel}"? This action cannot be undone.`,
        confirmText: 'Yes, Update Stage',
        cancelText: 'Cancel',
        type: 'warning'
      })

      if (confirmed) {
        await applicationService.updateApplicationStage(candidate.application.id, newStage)
        await loadAllData() // Reload data
      }
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

      // Get all non-shortlisted applications for this job
      const allJobApplications = await applicationService.getApplicationsByJobId(id)
      const nonShortlistedApplications = allJobApplications.filter(
        app => app.stage === applicationStages.APPLIED
      )

      // Bulk reject all non-shortlisted applications
      await Promise.all(
        nonShortlistedApplications.map(app =>
          applicationService.updateApplicationStage(app.id, applicationStages.REJECTED)
        )
      )

      // Reload data to reflect changes
      loadAllData()

      // Show success message or notification here if you have a toast system
      console.log(`Successfully rejected ${nonShortlistedApplications.length} non-shortlisted candidates`)

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between py-4 border-b">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error?.message === 'Job not found' ? 'Job not found' : 'Failed to load job'}
          </h2>
          <p className="text-gray-600 mb-4">
            {error?.message === 'Job not found'
              ? "The job you're looking for doesn't exist or has been removed."
              : error?.message || 'An error occurred while loading the job details.'
            }
          </p>
          <div className="space-x-3">
            <button
              onClick={loadAllData}
              className="btn-secondary"
            >
              Retry
            </button>
            <Link to="/jobs" className="btn-primary">
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const CandidateCard = ({ candidate, onShortlist, showShortlistButton = false, showSelectCheckbox = false }) => (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer bg-white dark:bg-gray-800 shadow-sm hover:shadow-md"
      onClick={() => handleCandidateClick(candidate)}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 flex-1">
          {showSelectCheckbox && (
            <input
              type="checkbox"
              checked={selectedCandidates.has(candidate.id)}
              onChange={(e) => {
                e.stopPropagation()
                handleCandidateSelect(candidate.id)
              }}
              className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 self-start h-5 w-5"
            />
          )}

          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-medium text-gray-600 dark:text-gray-300">
              {candidate.name.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{candidate.name}</h3>
              {candidate.priority_score && (
                <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{candidate.priority_score}% match</span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-start text-base text-gray-600 dark:text-gray-400">
                <MapPin className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="truncate">{candidate.address}</span>
              </div>
              <div className="flex items-center text-base text-gray-600 dark:text-gray-400">
                <Phone className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{candidate.phone}</span>
              </div>
              <div className="flex items-center text-base text-gray-600 dark:text-gray-400">
                <FileText className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{candidate.experience} experience</span>
              </div>
              {candidate.documents && candidate.documents.length > 0 && (
                <div className="flex items-center text-base text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>{candidate.documents.length} document{candidate.documents.length !== 1 ? 's' : ''} attached</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.skills.slice(0, 6).map((skill, index) => (
                <span key={index} className="chip chip-blue text-sm px-3 py-1">
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 6 && (
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  +{candidate.skills.length - 6} more
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end space-y-3 min-w-max">
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
{tPage('labels.appliedOn', { date: format(new Date(candidate.applied_at), 'MMM dd, yyyy') })}
          </span>

          {showShortlistButton && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShortlist(candidate.id)
              }}
              className="btn-primary text-sm px-4 py-2 whitespace-nowrap flex items-center"
              disabled={isShortlisting}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              {isShortlisting ? 'Shortlisting...' : 'Shortlist'}
            </button>
          )}

          <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 whitespace-nowrap flex items-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              View Profile
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 whitespace-nowrap flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Download CV
            </button>
          </div>
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
                  Mark Shortlisting Complete
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    This action will finalize the shortlisting process for this job. Here's what will happen:
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
                    <h4 className="text-sm font-semibold text-green-800 mb-2">✅ After completion:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• You can proceed to schedule interviews with shortlisted candidates</li>
                      <li>• The job will move to the interview scheduling phase</li>
                      <li>• All application data will be preserved for reporting</li>
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
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Why I'm here</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Verify applicants for this job and shortlist candidates.</p>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  💡 Candidates are automatically ranked by skill/education match. Use filters to refine results.
                </div>
              </div>
            )}

            {/* Skill-Based Filtering - Increased size */}
            {!showShortlistPool && (
              <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Skill-Based Filtering (priority ranking)</h3>
                  <div className="flex items-center space-x-4">
                    <label className="text-base font-medium text-gray-700 dark:text-gray-300">Show top:</label>
                    <select
                      value={topNFilter}
                      onChange={(e) => handleTopNFilterChange(Number(e.target.value))}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value={10}>Top 10</option>
                      <option value={20}>Top 20</option>
                      <option value={50}>Top 50</option>
                      <option value={0}>View All ({appliedCandidates.length})</option>
                    </select>
                  </div>
                </div>

                <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                  Candidates ranked to the top by skill/education match. Select prioritized tags (AND semantics) to refine results:
                </p>

                {/* Results summary */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-base">
                    <span className="text-gray-700 dark:text-gray-300">
                      Showing {appliedCandidates.length} of {appliedCandidates.length} candidates
                      {selectedTags.length > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 ml-2">
                          (filtered by {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''})
                        </span>
                      )}
                      {(searchParams.toString() && searchParams.toString() !== 'tab=applied') && (
                        <span className="text-green-600 dark:text-green-400 ml-2 text-sm">
                          • Filters preserved in URL
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
                        Clear all filters
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
                          <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">Shortlisting Progress</h4>
                          <p className="text-base text-green-700 dark:text-green-300">
                            {shortlistedCandidates.length} candidate{shortlistedCandidates.length !== 1 ? 's' : ''} shortlisted,
                            {' '}{appliedCandidates.length} remaining to review
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                          {Math.round((shortlistedCandidates.length / (shortlistedCandidates.length + appliedCandidates.length)) * 100)}%
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">Complete</div>
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
                  Tag sources: original job tags + prioritized tags selected here (removable).
                </p>
              </div>
            )}

            {/* Action Buttons - Increased size and better spacing */}
            {!showShortlistPool && (
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  {shortlistedCandidates.length > 0 && (
                    <button
                      onClick={handleCompleteShortlisting}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-base font-medium"
                      disabled={isCompletingShortlisting}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {isCompletingShortlisting ? 'Processing...' : 'Mark Shortlisting Complete'}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedCandidates.size > 0 && (
                    <>
                      <button
                        onClick={handleBulkShortlist}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap text-base font-medium"
                        disabled={isShortlisting}
                      >
                        <UserCheck className="w-5 h-5 mr-2" />
                        {isShortlisting ? 'Shortlisting...' : `Shortlist (${selectedCandidates.size})`}
                      </button>
                      <button
                        onClick={handleBulkSchedule}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center whitespace-nowrap text-base font-medium"
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        Schedule ({selectedCandidates.size})
                      </button>
                      <button
                        onClick={handleBulkReject}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap text-base font-medium"
                        disabled={isBulkRejecting}
                      >
                        <X className="w-5 h-5 mr-2" />
                        {isBulkRejecting ? 'Rejecting...' : `Reject (${selectedCandidates.size})`}
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
                  These candidates have been shortlisted for this position. Click any candidate to view their full profile.
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
            {scheduledCandidates.length > 0 ? (
              <ScheduledInterviews
                candidates={scheduledCandidates}
                jobId={id}
              />
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{tPage('labels.noScheduledInterviews')}</h3>
                <p className="text-gray-600 dark:text-gray-400">{tPage('labels.scheduleFromShortlisted')}</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-8 lg:px-12 py-8 w-full">
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
        candidate={selectedCandidate}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onUpdateStatus={handleUpdateStatus}
        onAttachDocument={handleAttachDocument}
        onRemoveDocument={handleRemoveDocument}
        workflowStages={workflowStages}
        isFromJobsPage={true}
        jobId={id}
      />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
        <Link to="/jobs" className="hover:text-primary-600 transition-colors">
          Jobs
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">{job.title}</span>
      </div>

      {/* Job Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{job.title}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">{job.company}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{job.city}, {job.country}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Posted {format(new Date(job.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>

              <Link to="/jobs" className="btn-secondary flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </Link>
            </div>

            {/* Analytics Section */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">View Count</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">{analytics?.view_count || job.view_count || 0}</p>
                      <p className="text-xs text-purple-700 dark:text-purple-300">Individual job views</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{tPage('labels.applicantCount')}</p>
                      <div className="text-lg font-semibold text-blue-900 dark:text-blue-200">
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
      <div className="card mt-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{tPage('labels.candidatesByPhase')}</h2>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${activeTab === tab.id
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

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default JobDetails 

