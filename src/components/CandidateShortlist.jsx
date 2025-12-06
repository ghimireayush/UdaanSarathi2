import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Filter,
  Star,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  Tag,
  TrendingUp,
  Award,
  Eye,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react'
import { formatInNepalTz, getRelativeTime, isToday } from '../utils/nepaliDate'
import { useConfirm } from './ConfirmProvider.jsx'
import CandidateSummaryS2 from './CandidateSummaryS2'
import { applicationService } from '../services/index.js'
import Pagination from './ui/Pagination'
import { useLanguage } from '../hooks/useLanguage'

const CandidateShortlist = ({
  jobId,
  candidates = [],
  job = null,
  onUpdateCandidateStatus,
  onScheduleInterview,
  onRefresh,
  workflowStages = []
}) => {
  const { confirm } = useConfirm()
  const { tPageSync } = useLanguage({ 
    pageName: 'shortlist',
    autoLoad: true 
  })

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('priority_score') // priority_score, applied_at, name
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterStage, setFilterStage] = useState('all')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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

  // Filter and sort candidates based on skill matching and priority
  const processedCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      // Text search
      const matchesSearch = !searchTerm ||
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())

      // Stage filter
      const matchesStage = filterStage === 'all' || candidate.stage === filterStage

      return matchesSearch && matchesStage
    })

    // Calculate skill match score if job tags exist
    if (job?.tags && job.tags.length > 0) {
      filtered = filtered.map(candidate => {
        const candidateSkills = candidate.skills || []
        const jobTags = job.tags || []

        // Calculate skill match percentage
        const matchingSkills = candidateSkills.filter(skill =>
          jobTags.some(tag =>
            skill.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(skill.toLowerCase())
          )
        )

        const skillMatchScore = jobTags.length > 0
          ? (matchingSkills.length / jobTags.length) * 100
          : 0

        return {
          ...candidate,
          skillMatchScore,
          matchingSkills
        }
      })
    }

    // Sort candidates
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'priority_score':
          aValue = a.priority_score || 0
          bValue = b.priority_score || 0
          break
        case 'skill_match':
          aValue = a.skillMatchScore || 0
          bValue = b.skillMatchScore || 0
          break
        case 'applied_at':
          aValue = new Date(a.applied_at || 0).getTime()
          bValue = new Date(b.applied_at || 0).getTime()
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        default:
          aValue = a.priority_score || 0
          bValue = b.priority_score || 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [candidates, searchTerm, sortBy, sortOrder, filterStage, job])

  // Paginated candidates
  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return processedCandidates.slice(startIndex, endIndex)
  }, [processedCandidates, currentPage, itemsPerPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStage, sortBy, sortOrder])

  const totalPages = Math.ceil(processedCandidates.length / itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }



  const getStageInfo = (stage) => {
    const stageConfig = workflowStages.find(s => s.id === stage) || { label: stage, color: 'gray' }
    return stageConfig
  }

  const getPriorityColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300'
    if (score >= 80) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300'
    return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
  }

  const getSkillMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300'
    if (score >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300'
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300'
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
    // Strict next-step-only transitions
    const nextAllowed = getNextAllowedStage(currentStage)
    return targetStage === nextAllowed
  }

  const handleUpdateStatus = async (candidateId, newStage) => {
    try {
      const candidate = candidates.find(c => c.id === candidateId)
      if (!candidate) return

      const currentStage = candidate.application?.stage

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
        if (onRefresh) {
          await onRefresh() // Reload data
        }

        // Update the selected candidate to reflect the new stage
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          setSelectedCandidate({
            ...selectedCandidate,
            stage: newStage,
            application: {
              ...selectedCandidate.application,
              stage: newStage
            }
          })
        }
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
        if (onRefresh) {
          await onRefresh() // Reload data
        }

        // Update the selected candidate to reflect the new document (mock data approach)
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          const updatedDocuments = [...(selectedCandidate.documents || []), document]
          setSelectedCandidate({
            ...selectedCandidate,
            documents: updatedDocuments
          })
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
      if (onRefresh) {
        await onRefresh() // Reload data
      }

      // Update the selected candidate to reflect the removed document (mock data approach)
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        const updatedDocuments = [...(selectedCandidate.documents || [])]
        updatedDocuments.splice(docIndex, 1)
        setSelectedCandidate({
          ...selectedCandidate,
          documents: updatedDocuments
        })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tPage('candidateList.title')}</h2>
          {job && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tPage('candidateList.description', { jobTitle: job.title, company: job.company, count: processedCandidates.length })}
            </p>
          )}
        </div>

        {job?.tags && job.tags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{tPage('candidateList.jobSkills')}:</span>
            <div className="flex flex-wrap gap-1">
              {job.tags.map((tag, index) => (
                <span key={index} className="chip chip-primary text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={tPage('candidateList.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Stage Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">{tPage('candidateList.filters.allStages')}</option>
                {workflowStages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{tPage('candidateList.filters.sortBy')}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="priority_score">{tPage('candidateList.filters.sortOptions.priorityScore')}</option>
                {job?.tags && job.tags.length > 0 && (
                  <option value="skill_match">{tPage('candidateList.filters.sortOptions.skillMatch')}</option>
                )}
                <option value="applied_at">{tPage('candidateList.filters.sortOptions.applicationDate')}</option>
                <option value="name">{tPage('candidateList.filters.sortOptions.name')}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {processedCandidates.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{tPage('candidateList.empty.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterStage !== 'all'
                ? tPage('candidateList.empty.description')
                : tPage('candidateList.empty.noApplications')
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-[22%] px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tPage('candidateList.table.headers.candidate')}
                  </th>
                  <th className="w-[18%] px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tPage('candidateList.table.headers.contact')}
                  </th>
                  <th className="w-[20%] px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tPage('candidateList.table.headers.skillsExperience')}
                  </th>
                  <th className="w-[12%] px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tPage('candidateList.table.headers.scores')}
                  </th>
                  <th className="w-[8%] px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tPage('candidateList.table.headers.status')}
                  </th>
                  <th className="w-[8%] px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tPage('candidateList.table.headers.applied')}
                  </th>
                  <th className="w-[12%] px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tPage('candidateList.table.headers.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedCandidates.map((candidate) => {
                  const stageInfo = getStageInfo(candidate.stage)
                  const appliedToday = isToday(candidate.applied_at)

                  return (
                    <tr key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {/* Candidate */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                {candidate.name?.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {candidate.name}
                              {appliedToday && (
                                <span className="ml-2 chip chip-green text-xs">{tPage('candidateList.table.candidate.newLabel')}</span>
                              )}
                            </div>
                            {candidate.education && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {candidate.education}
                              </div>
                            )}
                            {candidate.documents && candidate.documents.length > 0 && (
                              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-1">
                                <FileText className="w-3 h-3 mr-1" />
                                <span>{tPage('candidateList.table.candidate.documentsCount', { count: candidate.documents.length })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-2">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-900 dark:text-gray-100">{candidate.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-500 dark:text-gray-400 truncate" title={candidate.email}>{candidate.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-500 dark:text-gray-400 truncate" title={candidate.address}>{candidate.address}</span>
                          </div>
                        </div>
                      </td>

                      {/* Skills & Experience */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {candidate.experience}
                          </div>
                          {candidate.skills && candidate.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {candidate.skills.slice(0, 4).map((skill, index) => {
                                const isMatching = candidate.matchingSkills?.includes(skill)
                                return (
                                  <span
                                    key={index}
                                    className={`chip text-xs px-2 py-1 ${isMatching ? 'chip-green' : 'chip-gray'
                                      }`}
                                  >
                                    {skill}
                                    {isMatching && <Star className="w-3 h-3 ml-1" />}
                                  </span>
                                )
                              })}
                              {candidate.skills.length > 4 && (
                                <span className="text-xs text-primary-500 font-medium">
                                  +{candidate.skills.length - 4}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Scores */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(candidate.priority_score)}`}>
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {candidate.priority_score || 0}%
                          </div>
                          {candidate.skillMatchScore !== undefined && (
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSkillMatchColor(candidate.skillMatchScore)}`}>
                              <Award className="w-3 h-3 mr-1" />
                              {Math.round(candidate.skillMatchScore)}%
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`chip chip-${stageInfo.color || 'gray'} text-xs px-3 py-1`}>
                          {stageInfo.label}
                        </span>
                      </td>

                      {/* Applied */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <div>
                            <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{getRelativeTime(candidate.applied_at)}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {formatInNepalTz(candidate.applied_at, 'MMM dd')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCandidateClick(candidate)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center px-3 py-2 rounded-lg text-xs font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border border-primary-200 dark:border-primary-700 hover:border-primary-300 dark:hover:border-primary-600 shadow-sm hover:shadow-md"
                            title="View candidate"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {tPage('candidateList.table.actions.view')}
                          </button>

                          {/* Applied -> Shortlist */}
                          {candidate.stage === 'applied' && (
                            <button
                              onClick={() => handleUpdateStatus(candidate.id, 'shortlisted')}
                              className="text-xs px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                              title="Shortlist candidate"
                            >
                              Shortlist
                            </button>
                          )}

                          {/* Shortlisted -> Schedule Interview */}
                          {candidate.stage === 'shortlisted' && (
                            <button
                              onClick={() => onScheduleInterview ? onScheduleInterview(candidate.id) : handleUpdateStatus(candidate.id, 'interview-scheduled')}
                              className="text-xs px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                              title="Schedule interview"
                            >
                              Schedule Interview
                            </button>
                          )}

                          {/* Interview Scheduled -> Pass / Fail (+Reschedule when elapsed) */}
                          {candidate.stage === 'interview-scheduled' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(candidate.id, 'interview-passed')}
                                className="text-xs px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                title="Mark interview as passed"
                              >
                                Pass
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(candidate.id, 'shortlisted')}
                                className="text-xs px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                                title="Mark interview as failed"
                              >
                                Fail
                              </button>
                              {(() => {
                                const scheduledAtStr = candidate?.interview?.scheduled_at || candidate?.application?.interview_scheduled_at
                                if (!scheduledAtStr) return (
                                  <button
                                    onClick={() => onScheduleInterview ? onScheduleInterview(candidate.id) : handleCandidateClick(candidate)}
                                    className="text-xs px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    title="Open reschedule dialog"
                                  >
                                    Reschedule
                                  </button>
                                )
                                try {
                                  const scheduledAt = new Date(scheduledAtStr)
                                  const durationMin = 60
                                  const endTime = new Date(scheduledAt.getTime() + durationMin * 60000)
                                  const now = new Date()
                                  if (now > endTime) {
                                    return (
                                      <button
                                        onClick={() => onScheduleInterview ? onScheduleInterview(candidate.id) : handleCandidateClick(candidate)}
                                        className="text-xs px-3 py-2 rounded border border-amber-400 text-amber-700 hover:bg-amber-50"
                                        title="Interview time elapsed — reschedule"
                                      >
                                        Reschedule
                                      </button>
                                    )
                                  }
                                } catch (_) {}
                                return null
                              })()}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {processedCandidates.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={processedCandidates.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              showItemsPerPage={true}
              showPageInfo={true}
              className="justify-between"
            />
          </div>
        )}
      </div>

      {/* Candidate Summary Modal */}
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

export default CandidateShortlist