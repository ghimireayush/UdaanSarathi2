import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Users,
  Search,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  CreditCard,
  Calendar,
  Briefcase,
  Paperclip,
  Eye
} from 'lucide-react'
import { applicationService, candidateService, constantsService } from '../services/index.js'
import { format } from 'date-fns'
import { useConfirm } from '../components/ConfirmProvider.jsx'
import { useLanguage } from '../hooks/useLanguage'
import LanguageSwitch from '../components/LanguageSwitch'

import CandidateSummaryS2 from '../components/CandidateSummaryS2.jsx'
import { usePagination } from '../hooks/usePagination.js'
import PaginationWrapper from '../components/PaginationWrapper.jsx'

const Workflow = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { confirm } = useConfirm()
  const { tPageSync } = useLanguage({ 
    pageName: 'workflow', 
    autoLoad: true 
  })

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  // Data state - declare first to avoid temporal dead zone
  const [candidates, setCandidates] = useState([])
  const [allCandidates, setAllCandidates] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // State management
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'by-job')
  const [selectedStage, setSelectedStage] = useState(searchParams.get('stage') || 'applied')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedJobFilter, setSelectedJobFilter] = useState('all')

  // Pagination hook
  const {
    currentData: paginatedCandidates,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    itemsPerPageOptions,
    goToPage,
    changeItemsPerPage,
    resetPagination
  } = usePagination(candidates, {
    initialItemsPerPage: 15,
    itemsPerPageOptions: [10, 15, 25, 50]
  })

  // Workflow stages configuration - Simplified 4-stage pipeline
  const workflowStages = [
    { id: 'applied', label: tPage('stages.applied'), icon: FileText, description: tPage('stages.appliedDescription') },
    { id: 'shortlisted', label: tPage('stages.shortlisted'), icon: CheckCircle, description: tPage('stages.shortlistedDescription') },
    { id: 'interview-scheduled', label: tPage('stages.interviewScheduled'), icon: Calendar, description: tPage('stages.interviewScheduledDescription') },
    { id: 'interview-passed', label: tPage('stages.interviewPassed'), icon: Users, description: tPage('stages.interviewPassedDescription') }
  ]

  useEffect(() => {
    loadWorkflowData()
  }, [selectedStage, activeTab])

  const loadWorkflowData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load application stages (for future use)
      await constantsService.getApplicationStages()

      // Always load ALL candidates for analytics calculation
      const allCandidatesData = await applicationService.getAllCandidatesInWorkflow()

      // Enrich with candidate details
      const allEnrichedCandidates = await Promise.all(
        allCandidatesData.map(async (item) => {
          const candidate = await candidateService.getCandidateById(item.candidate_id)
          return {
            ...candidate,
            application: item,
            job_title: item.job_title,
            interviewed_at: item.interviewed_at,
            interview_remarks: item.interview_remarks,
            documents: item.documents || []
          }
        })
      )

      // Filter candidates for display based on selected stage
      const filteredCandidates = allEnrichedCandidates.filter(c => c.application.stage === selectedStage)
      setAllCandidates(filteredCandidates) // Store all filtered candidates

      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage
      const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + itemsPerPage)
      setCandidates(paginatedCandidates)

      // Calculate analytics using ALL candidates (not just filtered ones)
      const analyticsData = calculateAnalytics(allEnrichedCandidates)
      setAnalytics(analyticsData)

    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateAnalytics = (candidatesData) => {
    const stageCounts = workflowStages.reduce((acc, stage) => {
      acc[stage.id] = candidatesData.filter(c => c.application.stage === stage.id).length
      return acc
    }, {})

    const totalCandidates = candidatesData.length
    const interviewPassed = stageCounts['interview-passed'] || 0
    const totalProcessed = interviewPassed

    return {
      stageCounts,
      totalCandidates,
      interviewPassed,
      totalProcessed,
      summary: `${totalProcessed} interview passed of ${totalCandidates}`,
      conversionRate: totalCandidates > 0 ? ((totalProcessed / totalCandidates) * 100).toFixed(1) : 0
    }
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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSelectedJobFilter('all') // Reset to show all jobs when switching tabs
    updateUrlParams({ tab })
  }

  const handleStageChange = (stage) => {
    setSelectedStage(stage)
    setSelectedJobFilter('all') // Reset to show all jobs when changing stages
    updateUrlParams({ stage })
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
      const candidate = candidates.find(c => c.id === candidateId)
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
        loadWorkflowData() // Reload data
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
        loadWorkflowData() // Reload data
        
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
      loadWorkflowData() // Reload data
      
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

  // Filter candidates based on search query
  const filteredCandidates = candidates.filter(candidate => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      candidate.phone?.toLowerCase().includes(query) ||
      candidate.passport_number?.toLowerCase().includes(query) ||
      candidate.name?.toLowerCase().includes(query) ||
      candidate.email?.toLowerCase().includes(query) ||
      candidate.job_title?.toLowerCase().includes(query)
    )
  })

  // Group candidates by job for "By Job Post" view
  const candidatesByJob = activeTab === 'by-job' ?
    filteredCandidates.reduce((acc, candidate) => {
      const jobTitle = candidate.job_title || 'Unknown Job'
      if (!acc[jobTitle]) {
        acc[jobTitle] = []
      }
      acc[jobTitle].push(candidate)
      return acc
    }, {}) : {}

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination()
  }, [selectedStage, activeTab, searchQuery, selectedJobFilter, resetPagination])

  if (isLoading) {
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
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{tPage('error.failedToLoad')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
          <button onClick={loadWorkflowData} className="btn-primary">
{tPage('actions.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{tPage('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{tPage('subtitle')}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <LanguageSwitch />
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="mb-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">{tPage('analytics.totalCandidates')}</p>
                <p className="text-3xl font-bold">{analytics.totalCandidates || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-200" />
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{tPage('analytics.interviewPassed')}</p>
                <p className="text-3xl font-bold">{analytics.interviewPassed || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-200" />
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">{tPage('analytics.totalProcessed')}</p>
                <p className="text-3xl font-bold">{analytics.totalProcessed || 0}</p>
              </div>
              <Users className="w-10 h-10 text-purple-200" />
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">{tPage('analytics.successRate')}</p>
                <p className="text-3xl font-bold">{analytics.conversionRate || 0}%</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Circular Stage Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {workflowStages.map((stage) => {
            const count = analytics.stageCounts?.[stage.id] || 0
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
                <p className={`text-xs text-center mt-2 font-medium leading-tight ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-400'
                  }`}>
                  {stage.label}
                </p>
                {count > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {count} {count === 1 ? tPage('analytics.candidate') : tPage('analytics.candidates')}
                  </p>
                )}
              </div>
            )
          })}
        </div>


      </div>



      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('by-job')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'by-job'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              {tPage('tabs.byJob')}
            </button>
            <button
              onClick={() => handleTabChange('by-applicant')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'by-applicant'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              {tPage('tabs.byApplicant')}
            </button>
          </nav>
        </div>
      </div>

      {/* Job Distribution Controls (for By Job Post tab) */}
      {activeTab === 'by-job' && Object.keys(candidatesByJob).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">{tPage('filters.applicantDistribution')}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedJobFilter('all')}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${selectedJobFilter === 'all'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              {tPage('filters.all', { count: Object.values(candidatesByJob).reduce((sum, candidates) => sum + candidates.length, 0) })}
            </button>
            {Object.entries(candidatesByJob).map(([jobTitle, jobCandidates]) => (
              <button
                key={jobTitle}
                onClick={() => setSelectedJobFilter(jobTitle)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${selectedJobFilter === jobTitle
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                {jobTitle} ({jobCandidates.length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder={activeTab === 'by-job' ? tPage('search.byJobPlaceholder') : tPage('search.byApplicantPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Pagination Controls - Top */}
      {(activeTab === 'by-job' ? Object.keys(candidatesByJob).length > 0 : filteredCandidates.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
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
            size="sm"
          />
        </div>
      )}

      {/* Candidates List */}
      <div className="space-y-6">
        {(activeTab === 'by-job' ? Object.keys(candidatesByJob).length === 0 : filteredCandidates.length === 0) ? (
          <div className="card p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{tPage('empty.noCandidates')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'by-applicant' && searchQuery
                ? tPage('empty.noSearchResults')
                : tPage('empty.noStageResults', { stage: workflowStages.find(s => s.id === selectedStage)?.label })
              }
            </p>
          </div>
        ) : activeTab === 'by-job' ? (
          // Group by Job Post view - filtered by selected job
          (() => {
            const jobEntries = Object.entries(candidatesByJob)
            const filteredJobEntries = selectedJobFilter === 'all'
              ? jobEntries
              : jobEntries.filter(([jobTitle]) => jobTitle === selectedJobFilter)
            const startIndex = (currentPage - 1) * itemsPerPage
            const endIndex = startIndex + itemsPerPage
            const paginatedJobEntries = filteredJobEntries.slice(startIndex, endIndex)
            return paginatedJobEntries.map(([jobTitle, jobCandidates]) => (
              <div key={jobTitle} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                      {jobTitle} ({jobCandidates.length})
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {jobCandidates.length} {jobCandidates.length === 1 ? tPage('analytics.candidate') : tPage('analytics.candidates')} in {workflowStages.find(s => s.id === selectedStage)?.label} stage
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="chip chip-blue">
                      {jobCandidates.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {jobCandidates.map((candidate) => (
                    <CandidateWorkflowCard
                      key={candidate.id}
                      candidate={candidate}
                      onCandidateClick={handleCandidateClick}
                      onUpdateStatus={handleUpdateStatus}
                      onAttachDocument={handleAttachDocument}
                      workflowStages={workflowStages}
                      showJobTitle={false}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
            ))
          })()
        ) : (
          // By Applicant view - paginated
          <div className="space-y-4">
            {paginatedCandidates.map((candidate) => (
              <CandidateWorkflowCard
                key={candidate.id}
                candidate={candidate}
                onCandidateClick={handleCandidateClick}
                onUpdateStatus={handleUpdateStatus}
                onAttachDocument={handleAttachDocument}
                workflowStages={workflowStages}
                showJobTitle={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls - Bottom */}
      {totalItems > itemsPerPage && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <PaginationWrapper
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={itemsPerPageOptions}
            onPageChange={goToPage}
            onItemsPerPageChange={changeItemsPerPage}
            showInfo={false}
            showItemsPerPageSelector={false}
            size="md"
          />
        </div>
      )}

      {/* Candidate Summary Sidebar */}
      <CandidateSummaryS2
        candidate={selectedCandidate}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onUpdateStatus={handleUpdateStatus}
        onAttachDocument={handleAttachDocument}
        onRemoveDocument={handleRemoveDocument}
        workflowStages={workflowStages}
      />
    </div>
  )
}

const CandidateWorkflowCard = ({
  candidate,
  onCandidateClick,
  onUpdateStatus,
  onAttachDocument,
  workflowStages,
  showJobTitle = false,
  compact = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (newStage) => {
    setIsUpdating(true)
    try {
      await onUpdateStatus(candidate.id, newStage)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentStage = workflowStages.find(s => s.id === candidate.application.stage)

  // Define strict stage progression - only allow current and next stage
  const getNextAllowedStage = (currentStage) => {
    const stageOrder = {
      'applied': 'shortlisted',
      'shortlisted': 'interview-scheduled', 
      'interview-scheduled': 'interview-passed',
      'interview-passed': null // Final stage
    }
    return stageOrder[currentStage]
  }

  // Only allow current stage and next stage in dropdown (strict progression)
  const getAllowedStages = (currentStageId) => {
    const nextStage = getNextAllowedStage(currentStageId)
    if (nextStage) {
      return [currentStageId, nextStage] // Current stage + next stage only
    }
    return [currentStageId] // Final stage - no further progression
  }

  const allowedStages = getAllowedStages(candidate.application?.stage)
  const availableStages = workflowStages.filter(stage => allowedStages.includes(stage.id))

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow bg-white dark:bg-gray-800">
      {/* List-style layout */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left side - Candidate info in horizontal layout */}
          <div
            className="flex items-center space-x-4 flex-1 cursor-pointer"
            onClick={() => onCandidateClick(candidate)}
          >
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {candidate.name?.charAt(0)}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                  {candidate.name}
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
                    <span>Passport: {candidate.passport_number}</span>
                  </div>
                )}

                {showJobTitle && candidate.job_title && (
                  <div className="flex items-center">
                    <Briefcase className="w-3 h-3 mr-1" />
                    <span className="font-medium">{candidate.job_title}</span>
                  </div>
                )}

                {candidate.interviewed_at && (
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Interviewed: {format(new Date(candidate.interviewed_at), 'MMM dd')}</span>
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

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
            <button
              onClick={() => onCandidateClick(candidate)}
              className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
              title="View candidate details"
            >
              <Eye className="w-4 h-4" />
            </button>

            <select
              value={candidate.application?.stage || ''}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={isUpdating}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 min-w-[120px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Update candidate status"
            >
              {availableStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Workflow