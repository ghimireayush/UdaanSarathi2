import { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, X, Users, Zap, FileText, User, GraduationCap, Camera, Clipboard, Plus } from 'lucide-react'
import { interviewService, candidateService } from '../services/index.js'
import InterviewDataSource from '../api/datasources/InterviewDataSource.js' // ✅ Phase 2: Real API client
import CandidateDataSource from '../api/datasources/CandidateDataSource.js' // ✅ Phase 2: Bulk scheduling
import { getMembersList } from '../services/memberService.js' // ✅ Get team members
import { useAgency } from '../contexts/AgencyContext.jsx' // ✅ Phase 2: Get agency license
import { format, addMinutes, isSameMinute, parseISO, addDays, startOfDay } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { formatTime12Hour } from '../utils/helpers.js'

const EnhancedInterviewScheduling = ({ candidates, jobId, onScheduled }) => {
  const navigate = useNavigate()
  const { agencyData } = useAgency() // ✅ Phase 2: Get agency context
  const [selectedCandidates, setSelectedCandidates] = useState(new Set())
  const [schedulingMode, setSchedulingMode] = useState('individual') // 'individual', 'batch', 'suggested', 'ai'
  const [schedulingData, setSchedulingData] = useState({
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), // Tomorrow by default
    time: '10:00', // 10 AM by default
    duration: 60,
    interviewer: '',
    location: 'Office',
    notes: ''
  })
  const [teamMembers, setTeamMembers] = useState([])
  const [batchScheduling, setBatchScheduling] = useState([])
  const [suggestedScheduling, setSuggestedScheduling] = useState({
    duration: '2 weeks',
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    interviewsPerDay: 3
  })
  const [requirements, setRequirements] = useState([
    { id: 'cv', label: 'CV', icon: FileText, selected: true },
    { id: 'citizenship', label: 'Citizenship', icon: User, selected: true },
    { id: 'education', label: 'Education Certificate', icon: GraduationCap, selected: true },
    { id: 'photo', label: 'PP Photo', icon: Camera, selected: true },
    { id: 'hardcopy', label: 'Hardcopy Requirements', icon: Clipboard, selected: true }
  ])
  const [conflicts, setConflicts] = useState([])
  const [isScheduling, setIsScheduling] = useState(false)
  const [existingInterviews, setExistingInterviews] = useState([])
  const [candidateStatuses, setCandidateStatuses] = useState({})

  useEffect(() => {
    loadExistingInterviews()
    loadCandidateStatuses()
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      const response = await getMembersList()
      if (response.success && response.data) {
        setTeamMembers(response.data)
      }
    } catch (error) {
      console.error('Failed to load team members:', error)
    }
  }

  const loadExistingInterviews = async () => {
    try {
      const interviews = await interviewService.getAllInterviews()
      setExistingInterviews(interviews)
    } catch (error) {
      console.error('Failed to load existing interviews:', error)
    }
  }

  const loadCandidateStatuses = async () => {
    try {
      const statuses = {}
      for (const candidate of candidates) {
        const candidateInterviews = await interviewService.getInterviewsByCandidate(candidate.id)
        const jobInterview = candidateInterviews.find(interview => interview.job_id === jobId)
        statuses[candidate.id] = jobInterview ? jobInterview.status : 'not_scheduled'
      }
      setCandidateStatuses(statuses)
    } catch (error) {
      console.error('Failed to load candidate statuses:', error)
    }
  }

  const toggleRequirement = (requirementId) => {
    setRequirements(prev => 
      prev.map(req => 
        req.id === requirementId 
          ? { ...req, selected: !req.selected }
          : req
      )
    )
  }

  const generateSuggestedSchedule = () => {
    const startDate = parseISO(suggestedScheduling.startDate)
    const durationInDays = suggestedScheduling.duration === '2 weeks' ? 14 : 2
    const interviewsPerDay = suggestedScheduling.interviewsPerDay
    
    const schedule = []
    let currentDate = startDate
    let candidateIndex = 0
    
    while (candidateIndex < candidates.length && schedule.length < durationInDays) {
      const daySchedule = {
        date: format(currentDate, 'yyyy-MM-dd'),
        candidates: []
      }
      
      for (let i = 0; i < interviewsPerDay && candidateIndex < candidates.length; i++) {
        const timeSlot = format(addMinutes(startOfDay(currentDate).setHours(9), i * 60), 'HH:mm')
        daySchedule.candidates.push({
          candidate: candidates[candidateIndex],
          time: timeSlot
        })
        candidateIndex++
      }
      
      if (daySchedule.candidates.length > 0) {
        schedule.push(daySchedule)
      }
      
      currentDate = addDays(currentDate, 1)
    }
    
    return schedule
  }

  const generateAISchedule = () => {
    // AI-assisted scheduling for top 5 candidates
    const topCandidates = candidates
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, 5)
    
    const aiSchedule = topCandidates.map((candidate, index) => ({
      candidate,
      suggestedDate: format(addDays(new Date(), index + 1), 'yyyy-MM-dd'),
      suggestedTime: format(addMinutes(startOfDay(new Date()).setHours(10), index * 90), 'HH:mm'),
      priority: 'high',
      reasoning: `Top ${index + 1} candidate based on skill match (${candidate.priority_score}% match)`
    }))
    
    return aiSchedule
  }

  const checkForConflicts = (candidateId, proposedDateTime, duration) => {
    const proposedStart = parseISO(proposedDateTime)
    const proposedEnd = addMinutes(proposedStart, duration)
    
    const candidateConflicts = existingInterviews.filter(interview => {
      if (interview.candidate_id !== candidateId) return false
      
      const existingStart = parseISO(interview.scheduled_at)
      const existingEnd = addMinutes(existingStart, interview.duration || 60)
      
      // Check for time overlap
      return (proposedStart < existingEnd && proposedEnd > existingStart)
    })

    return candidateConflicts
  }

  const handleCandidateSelect = (candidateId) => {
    const newSelected = new Set(selectedCandidates)
    
    // In Individual mode, only allow single selection
    if (schedulingMode === 'individual') {
      if (newSelected.has(candidateId)) {
        newSelected.delete(candidateId)
      } else {
        // Clear all previous selections and select only this one
        newSelected.clear()
        newSelected.add(candidateId)
      }
    } else {
      // In other modes (batch, suggested, ai), allow multiple selection
      if (newSelected.has(candidateId)) {
        newSelected.delete(candidateId)
      } else {
        newSelected.add(candidateId)
      }
    }
    
    setSelectedCandidates(newSelected)
    
    // Check for conflicts when candidates are selected
    if (schedulingData.date && schedulingData.time) {
      checkAllConflicts(newSelected)
    }
  }

  const checkAllConflicts = (candidateIds) => {
    if (!schedulingData.date || !schedulingData.time) return

    const proposedDateTime = `${schedulingData.date}T${schedulingData.time}:00`
    const allConflicts = []

    candidateIds.forEach(candidateId => {
      const candidateConflicts = checkForConflicts(candidateId, proposedDateTime, schedulingData.duration)
      if (candidateConflicts.length > 0) {
        const candidate = candidates.find(c => c.id === candidateId)
        allConflicts.push({
          candidateId,
          candidateName: candidate?.name || 'Unknown',
          conflicts: candidateConflicts
        })
      }
    })

    setConflicts(allConflicts)
  }

  // ✅ Phase 2: Batch scheduling handler
  const handleBatchSchedule = async () => {
    if (batchScheduling.length === 0) return

    try {
      setIsScheduling(true)
      
      // Get agency license
      const license = agencyData?.license_number
      if (!license) {
        throw new Error('Agency license not available')
      }

      // Get selected requirements
      const selectedRequirements = requirements
        .filter(req => req.selected)
        .map(req => req.id)

      // Filter out incomplete batches
      const validBatches = batchScheduling.filter(batch => 
        batch.date && batch.time && batch.candidates.length > 0
      )

      if (validBatches.length === 0) {
        alert('No valid batches to schedule. Please ensure all batches have date, time, and at least one candidate.')
        return
      }

      // Prepare batches with requirements
      const batchesWithRequirements = validBatches.map(batch => ({
        ...batch,
        requirements: selectedRequirements,
        interviewer: batch.interviewer || schedulingData.interviewer || 'HR Manager'
      }))

      // Single API call for all batches
      const result = await CandidateDataSource.multiBatchScheduleInterviews(
        license,
        jobId,
        batchesWithRequirements
      )

      const totalScheduled = result.updated_count || 0
      const totalFailed = result.failed?.length || 0

      // Show results
      if (totalFailed === 0) {
        console.log(`✅ Successfully scheduled ${totalScheduled} interview(s) across ${validBatches.length} batch(es)`)
        alert(`Successfully scheduled ${totalScheduled} interviews!`)
      } else {
        console.warn(
          `⚠️ Scheduled ${totalScheduled} interviews. ${totalFailed} failed.`,
          result.errors
        )
        alert(`Scheduled ${totalScheduled} interviews. ${totalFailed} failed. Check console for details.`)
      }

      // Reset form
      setBatchScheduling([])
      setConflicts([])
      
      // Reload existing interviews
      await loadExistingInterviews()
      
      // Notify parent component
      if (onScheduled) {
        onScheduled()
      }
      
      // Redirect to scheduled tab
      navigate(`/jobs/${jobId}?tab=scheduled`)

    } catch (error) {
      console.error('❌ Failed to schedule batch interviews:', error)
      alert(`Failed to schedule batch interviews: ${error.message}`)
    } finally {
      setIsScheduling(false)
    }
  }

  const handleSchedulingDataChange = (field, value) => {
    console.log(`Scheduling data change: ${field} = "${value}"`)
    const newData = { ...schedulingData, [field]: value }
    setSchedulingData(newData)
    console.log('New scheduling data:', newData)
    
    // Check for conflicts when date/time changes
    if (field === 'date' || field === 'time' || field === 'duration') {
      checkAllConflicts(selectedCandidates)
    }
  }

  const handleScheduleInterviews = async () => {
    if (selectedCandidates.size === 0 || conflicts.length > 0) return

    try {
      setIsScheduling(true)
      
      // Get agency license
      const license = agencyData?.license_number
      if (!license) {
        throw new Error('Agency license not available')
      }

      // Get selected requirements
      const selectedRequirements = requirements
        .filter(req => req.selected)
        .map(req => req.id)

      // ✅ Phase 2: Use bulk scheduling API instead of looping
      const candidateIds = Array.from(selectedCandidates)
      
      const result = await CandidateDataSource.bulkScheduleInterviews(
        agencyData.license_number,
        jobId,
        candidateIds,
        {
          date: schedulingData.date,
          time: schedulingData.time,
          duration: schedulingData.duration, // ✅ Phase 2: Duration field
          location: schedulingData.location,
          interviewer: schedulingData.interviewer,
          requirements: selectedRequirements,
          notes: schedulingData.notes
        },
        license
      )

      // ✅ Phase 2: Handle partial failures
      if (result.success) {
        console.log(`✅ Successfully scheduled ${result.updated_count} interview(s)`)
      } else {
        const succeeded = result.updated_count || 0
        const failed = result.failed?.length || 0
        console.warn(
          `⚠️ Scheduled ${succeeded} of ${candidateIds.length} interviews. ${failed} failed.`,
          result.errors
        )
      }
      
      // Reset form
      setSelectedCandidates(new Set())
      setSchedulingData({
        date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        time: '10:00',
        duration: 60,
        interviewer: '',
        location: 'Office',
        notes: ''
      })
      setConflicts([])
      
      // Reload existing interviews
      await loadExistingInterviews()
      
      // Notify parent component
      if (onScheduled) {
        onScheduled()
      }
      
      // Redirect to the job details page with scheduled tab
      navigate(`/jobs/${jobId}?tab=scheduled`)

    } catch (error) {
      console.error('❌ Failed to schedule interviews:', error)
      alert(`Failed to schedule interviews: ${error.message}`)
    } finally {
      setIsScheduling(false)
    }
  }

  const ConflictAlert = ({ conflicts }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Scheduling Conflicts Detected</h4>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="text-sm text-red-700 dark:text-red-300">
                <strong>{conflict.candidateName}</strong> has {conflict.conflicts.length} conflicting interview(s):
                <ul className="ml-4 mt-1">
                  {conflict.conflicts.map((existingInterview, idx) => (
                    <li key={idx} className="text-xs text-red-600 dark:text-red-400">
                      • {format(parseISO(existingInterview.scheduled_at), 'MMM dd, yyyy HH:mm')} 
                      ({existingInterview.duration || 60} min)
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            Please choose a different time slot or deselect conflicting candidates.
          </p>
        </div>
      </div>
    </div>
  )

  const getStatusBadge = (status) => {
    const statusConfig = {
      'not_scheduled': { class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', label: 'Not Scheduled' },
      'scheduled': { class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200', label: 'Scheduled' },
      'completed': { class: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200', label: 'Completed' },
      'cancelled': { class: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200', label: 'Cancelled' },
      'rescheduled': { class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200', label: 'Rescheduled' }
    }
    const config = statusConfig[status] || statusConfig['not_scheduled']
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Interview Scheduling</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Review shortlisted candidates and create interview schedules with multiple scheduling options.
        </p>
      </div>

      {/* Requirements Checklist */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Requirements Checklist</h4>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Auto-selected requirements for interviews:</p>
          <div className="flex flex-wrap gap-2">
            {requirements.map(requirement => {
              const IconComponent = requirement.icon
              return (
                <div
                  key={requirement.id}
                  className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    requirement.selected
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-600'
                      : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {requirement.label}
                  {requirement.selected && (
                    <button
                      onClick={() => toggleRequirement(requirement.id)}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Click X to remove requirements. Selected requirements will be communicated to candidates.
          </p>
        </div>
      </div>

      {/* Scheduling Mode Selection */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Scheduling Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => {
              setSchedulingMode('individual')
              // Clear selection when switching to individual mode
              if (selectedCandidates.size > 1) {
                setSelectedCandidates(new Set())
              }
            }}
            className={`p-4 rounded-lg border-2 transition-colors ${
              schedulingMode === 'individual'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
          >
            <User className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Individual</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Schedule one by one</div>
          </button>
          
          <button
            onClick={() => setSchedulingMode('batch')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              schedulingMode === 'batch'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
          >
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Batch</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Schedule multiple</div>
          </button>
          
          <button
            onClick={() => setSchedulingMode('suggested')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              schedulingMode === 'suggested'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
          >
            <Calendar className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Suggested</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Auto-generated schedule</div>
          </button>
          
          <button
            onClick={() => setSchedulingMode('ai')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              schedulingMode === 'ai'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }`}
          >
            <Zap className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">AI-Assisted</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Smart recommendations</div>
          </button>
        </div>
      </div>

      {/* Individual Scheduling */}
      {schedulingMode === 'individual' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Individual Scheduling</h4>
          
          {/* Candidate Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-md font-medium text-gray-900 dark:text-gray-100">Select Candidate</h5>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                Select one candidate at a time
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {candidates.map(candidate => (
                <div
                  key={candidate.id}
                  onClick={() => handleCandidateSelect(candidate.id)}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    selectedCandidates.has(candidate.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          {candidate.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{candidate.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {getStatusBadge(candidateStatuses[candidate.id] || 'not_scheduled')}
                        </div>
                      </div>
                    </div>
                    {selectedCandidates.has(candidate.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scheduling Form */}
          {selectedCandidates.size > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">Schedule Details</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date {!schedulingData.date && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="date"
                    value={schedulingData.date}
                    onChange={(e) => handleSchedulingDataChange('date', e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      schedulingData.date
                        ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }`}
                    style={!schedulingData.date ? { opacity: 0.6 } : {}}
                  />
                  {!schedulingData.date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      Click to select interview date
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time {!schedulingData.time && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="time"
                    value={schedulingData.time}
                    onChange={(e) => handleSchedulingDataChange('time', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      schedulingData.time
                        ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }`}
                    style={!schedulingData.time ? { opacity: 0.6 } : {}}
                  />
                  {schedulingData.time ? (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                      {formatTime12Hour(schedulingData.time + ':00')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      Click to select interview time
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
                  <select
                    value={schedulingData.duration}
                    onChange={(e) => handleSchedulingDataChange('duration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interviewer</label>
                  <select
                    value={schedulingData.interviewer}
                    onChange={(e) => handleSchedulingDataChange('interviewer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select interviewer</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.name}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={schedulingData.location}
                    onChange={(e) => handleSchedulingDataChange('location', e.target.value)}
                    placeholder="Enter location"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={schedulingData.notes}
                    onChange={(e) => handleSchedulingDataChange('notes', e.target.value)}
                    placeholder="Add any additional notes for the interview"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Scheduling */}
      {schedulingMode === 'batch' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Batch Scheduling</h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-md font-medium text-gray-900 dark:text-gray-100">Batch Schedule Groups</h5>
              <button
                onClick={() => {
                  const newBatch = {
                    id: Date.now(),
                    date: '',
                    time: '',
                    duration: 60,
                    interviewer: '',
                    location: 'Office',
                    notes: '',
                    candidates: []
                  }
                  setBatchScheduling(prev => [...prev, newBatch])
                }}
                className="btn-primary text-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Batch
              </button>
            </div>
            
            {batchScheduling.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No batch schedules created yet.</p>
                <p className="text-sm mt-1">Click "Add Batch" to create your first batch schedule.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {batchScheduling.map((batch, index) => (
                  <div key={batch.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h6 className="font-medium text-gray-900 dark:text-gray-100">Batch {index + 1}</h6>
                      <button
                        onClick={() => {
                          setBatchScheduling(prev => prev.filter(b => b.id !== batch.id))
                        }}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date {!batch.date && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="date"
                          value={batch.date}
                          onChange={(e) => {
                            const updatedBatch = { ...batch, date: e.target.value }
                            setBatchScheduling(prev => prev.map(b => b.id === batch.id ? updatedBatch : b))
                          }}
                          min={format(new Date(), 'yyyy-MM-dd')}
                          className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            batch.date
                              ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                          }`}
                          style={!batch.date ? { opacity: 0.6 } : {}}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Time {!batch.time && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="time"
                          value={batch.time}
                          onChange={(e) => {
                            const updatedBatch = { ...batch, time: e.target.value }
                            setBatchScheduling(prev => prev.map(b => b.id === batch.id ? updatedBatch : b))
                          }}
                          className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            batch.time
                              ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                          }`}
                          style={!batch.time ? { opacity: 0.6 } : {}}
                        />
                        {batch.time && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5 font-medium">
                            {formatTime12Hour(batch.time + ':00')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (min)</label>
                        <select
                          value={batch.duration || 60}
                          onChange={(e) => {
                            const updatedBatch = { ...batch, duration: parseInt(e.target.value) }
                            setBatchScheduling(prev => prev.map(b => b.id === batch.id ? updatedBatch : b))
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value={15}>15 min</option>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                          <option value={90}>90 min</option>
                          <option value={120}>120 min</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {candidates.filter(c => {
                        // Check if candidate is already in ANY batch (not just current batch)
                        const isInAnyBatch = batchScheduling.some(b => b.candidates.includes(c.id))
                        return !isInAnyBatch
                      }).map(candidate => (
                        <button
                          key={candidate.id}
                          onClick={() => {
                            const updatedBatch = { ...batch, candidates: [...batch.candidates, candidate.id] }
                            setBatchScheduling(prev => prev.map(b => b.id === batch.id ? updatedBatch : b))
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        >
                          {candidate.name}
                        </button>
                      ))}
                      {candidates.every(c => batchScheduling.some(b => b.candidates.includes(c.id))) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                          All candidates have been assigned to batches
                        </div>
                      )}
                    </div>
                    
                    {batch.candidates.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-700 dark:text-gray-300 mb-1">Selected candidates:</div>
                        <div className="flex flex-wrap gap-1">
                          {batch.candidates.map(candidateId => {
                            const candidate = candidates.find(c => c.id === candidateId)
                            return (
                              <div key={candidateId} className="flex items-center text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                {candidate?.name}
                                <button
                                  onClick={() => {
                                    const updatedBatch = { ...batch, candidates: batch.candidates.filter(id => id !== candidateId) }
                                    setBatchScheduling(prev => prev.map(b => b.id === batch.id ? updatedBatch : b))
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggested Scheduling */}
      {schedulingMode === 'suggested' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Suggested Scheduling</h4>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-800 dark:text-green-300 mb-1">Duration</label>
                <select
                  value={suggestedScheduling.duration}
                  onChange={(e) => setSuggestedScheduling(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="2 weeks">2 weeks</option>
                  <option value="2 days">2 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-green-800 dark:text-green-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={suggestedScheduling.startDate}
                  onChange={(e) => setSuggestedScheduling(prev => ({ ...prev, startDate: e.target.value }))}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-800 dark:text-green-300 mb-1">Interviews per Day</label>
                <select
                  value={suggestedScheduling.interviewsPerDay}
                  onChange={(e) => setSuggestedScheduling(prev => ({ ...prev, interviewsPerDay: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value={1}>1 per day</option>
                  <option value={2}>2 per day</option>
                  <option value={3}>3 per day</option>
                  <option value={4}>4 per day</option>
                  <option value={5}>5 per day</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Generated Schedule Preview</h5>
            <div className="space-y-3">
              {generateSuggestedSchedule().map((day, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {format(parseISO(day.date), 'EEEE, MMM dd, yyyy')}
                  </div>
                  <div className="space-y-1">
                    {day.candidates.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex items-center justify-between text-sm">
                        <span>{slot.time} - {slot.candidate.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">Priority: {slot.candidate.priority_score}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI-Assisted Scheduling */}
      {schedulingMode === 'ai' && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">AI-Assisted Scheduling</h4>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <Zap className="w-5 h-5 text-purple-600 mr-2 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-purple-800 dark:text-purple-300">Smart Scheduling for Top Candidates</h5>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  AI has analyzed candidate profiles and suggests optimal scheduling for your top 5 candidates.
                  Please review and approve the suggestions.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {generateAISchedule().map((suggestion, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800/50 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">#{index + 1}</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-100">{suggestion.candidate.name}</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.reasoning}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          📅 {format(parseISO(suggestion.suggestedDate), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          🕒 {suggestion.suggestedTime}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {suggestion.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{suggestion.candidate.priority_score}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Match Score</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Review Required</h5>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  AI suggestions need thorough review. Please verify candidate availability and interviewer schedules before confirming.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Alerts */}
      {conflicts.length > 0 && <ConflictAlert conflicts={conflicts} />}

      {/* Schedule Button */}
      {((schedulingMode === 'individual' && selectedCandidates.size > 0) ||
        (schedulingMode === 'batch' && batchScheduling.length > 0) ||
        (schedulingMode === 'suggested') ||
        (schedulingMode === 'ai')) && (
        <div className="flex justify-end space-x-3">
          {/* Debug info */}
          {schedulingMode === 'individual' && (
            <div className="text-xs text-gray-500 mr-4 self-center">
              Debug: Candidates={selectedCandidates.size}, Date={schedulingData.date ? '✓' : '✗'}, Time={schedulingData.time ? '✓' : '✗'}, Interviewer={schedulingData.interviewer ? '✓' : '✗'}, Conflicts={conflicts.length}
            </div>
          )}
          {schedulingMode === 'suggested' && (
            <button
              onClick={() => {
                const schedule = generateSuggestedSchedule()
                // Handle suggested schedule implementation
                console.log('Implementing suggested schedule:', schedule)
              }}
              disabled={isScheduling}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isScheduling ? 'Scheduling...' : 'Apply Suggested Schedule'}
            </button>
          )}
          
          {schedulingMode === 'ai' && (
            <button
              onClick={() => {
                const aiSchedule = generateAISchedule()
                // Handle AI schedule implementation
                console.log('Implementing AI schedule:', aiSchedule)
              }}
              disabled={isScheduling}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              {isScheduling ? 'Scheduling...' : 'Apply AI Schedule'}
            </button>
          )}
          
          {schedulingMode === 'batch' && (
            <button
              onClick={handleBatchSchedule}
              disabled={isScheduling || batchScheduling.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Users className="w-4 h-4 mr-2" />
              {isScheduling ? 'Scheduling...' : `Schedule ${batchScheduling.length} Batch${batchScheduling.length !== 1 ? 'es' : ''}`}
            </button>
          )}
          
          {schedulingMode === 'individual' && (
            <button
              onClick={handleScheduleInterviews}
              disabled={
                isScheduling || 
                conflicts.length > 0 || 
                selectedCandidates.size === 0 ||
                !schedulingData.date || 
                !schedulingData.time ||
                !schedulingData.interviewer
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isScheduling ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedInterviewScheduling