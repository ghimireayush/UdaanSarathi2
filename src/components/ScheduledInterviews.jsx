import React, { useState, useEffect, useRef } from 'react'
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  Check,
  X,
  RotateCcw,
  Send,
  Phone,
  Video,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  GraduationCap,
  Briefcase,
  Home,
  Star,
  Download,
  Eye,
  CreditCard,
  Paperclip,
  Upload,
  Trash2,
  Plus
} from 'lucide-react'
import { interviewService } from '../services/index.js'
import CandidateDataSource from '../api/datasources/CandidateDataSource.js'
import InterviewDataSource from '../api/datasources/InterviewDataSource.js'
import ApplicationDataSource from '../api/datasources/ApplicationDataSource.js'
import { useAgency } from '../contexts/AgencyContext.jsx'
import { useLanguage } from '../hooks/useLanguage'
import { useStageTranslations } from '../hooks/useStageTranslations'
import { format, isToday, isTomorrow, isPast, addMinutes, parseISO } from 'date-fns'
import CandidateSummaryS2 from './CandidateSummaryS2.jsx'
import { formatTime12Hour } from '../utils/helpers.js'

const ScheduledInterviews = ({ candidates, jobId, interviews: propInterviews, currentFilter, onFilterChange, onDataReload, showFilters = true }) => {
  const { agencyData } = useAgency()
  const { tPageSync } = useLanguage({ pageName: 'interviews', autoLoad: true })
  const { getStageLabel, getStageAction } = useStageTranslations()
  
  // Helper function for translations with fallback
  const t = (key, fallback = key) => {
    const result = tPageSync(key)
    return result === key ? fallback : result
  }
  // Use parent's currentFilter directly, no local state
  const activeSubtab = currentFilter || 'all'
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false)
  const notesRef = useRef(null)
  const charCountRef = useRef(null)
  const [actionType, setActionType] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editingNoteIndex, setEditingNoteIndex] = useState(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const MAX_NOTE_LENGTH = 300
  const [rejectionReason, setRejectionReason] = useState('')
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [interviews, setInterviews] = useState([])
  const [gracePeriod] = useState(30) // 30 minutes grace period
  const [showUploadSection, setShowUploadSection] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Check if an interview is unattended (past scheduled time + grace period)
  const isUnattended = (interview) => {
    if (!interview || interview.status !== 'scheduled' || !interview.scheduled_at) return false
    
    try {
      const interviewEnd = addMinutes(parseISO(interview.scheduled_at), (interview.duration || 60) + gracePeriod)
      return isPast(interviewEnd)
    } catch (error) {
      console.error('Error parsing interview date:', error, interview)
      return false
    }
  }

  // Calculate counts for each subtab
  // Note: With server-side filtering, we only have the filtered results
  // So we show the count of what's currently loaded
  const getSubtabCounts = () => {
    // Since we're using server-side filtering, we only have the current filter's results
    // Show the count for the active filter, others will be fetched when clicked
    const counts = {
      today: activeSubtab === 'today' ? interviews.length : 0,
      tomorrow: activeSubtab === 'tomorrow' ? interviews.length : 0,
      unattended: activeSubtab === 'unattended' ? interviews.length : 0,
      all: activeSubtab === 'all' ? interviews.length : 0
    }

    return counts
  }

  // Handle candidate click to open sidebar
  const handleCandidateClick = (candidateOrApplication) => {
    // Just pass the candidate object - let CandidateSummaryS2 handle API calls
    let candidate = candidateOrApplication;
    
    // If it's an application object, extract the candidate
    if (candidateOrApplication.candidate) {
      candidate = candidateOrApplication.candidate;
      // Ensure application ID is attached to candidate
      if (!candidate.application) {
        candidate.application = { id: candidateOrApplication.id };
      }
    }
    
    setSelectedCandidate(candidate);
    setIsSidebarOpen(true);
  }

  useEffect(() => {
    console.log('🔍 ScheduledInterviews useEffect:', {
      propInterviews: propInterviews?.length,
      candidates: candidates?.length,
      willUse: (propInterviews && propInterviews.length > 0) ? 'propInterviews' : 'candidates'
    })
    
    // Priority: use propInterviews if it has data, otherwise use candidates
    if (propInterviews && propInterviews.length > 0) {
      // Use interviews passed as props (from calendar view)
      const mapped = propInterviews.map(interview => ({
        id: interview.candidate_id || interview.id,
        name: interview.candidate_name || interview.name || 'Unknown Candidate',
        phone: interview.candidate_phone || interview.phone || '',
        email: interview.candidate_email || interview.email || '',
        interview: interview,
        // Include application_id for notes loading in sidebar
        application_id: interview.application_id || interview.job_application_id,
        application: {
          id: interview.application_id || interview.job_application_id,
          stage: interview.application_stage || 'interview_scheduled'
        }
      }))
      console.log('✅ Setting interviews from propInterviews:', mapped.length)
      setInterviews(mapped)
    } else {
      // Use candidates passed from parent (already filtered by server)
      // Ensure application object exists for notes loading
      const mappedCandidates = (candidates || []).map(c => ({
        ...c,
        application_id: c.application_id || c.application?.id || c.interview?.job_application_id,
        application: c.application || {
          id: c.application_id || c.interview?.job_application_id,
          stage: c.stage || c.interview?.status || 'interview_scheduled'
        }
      }))
      console.log('✅ Setting interviews from candidates:', mappedCandidates.length)
      setInterviews(mappedCandidates)
    }
  }, [candidates, jobId, propInterviews])
  
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

  // Helper function to parse notes into individual entries
  const parseNotes = (notesString) => {
    if (!notesString) return []
    
    const entries = []
    const parts = notesString.split(/\n--- Note added on /)
    
    parts.forEach((part, index) => {
      if (index === 0 && !part.includes('---')) {
        // First note without separator (old format or first entry)
        if (part.trim()) {
          entries.push({
            timestamp: null,
            content: part.trim(),
            rawText: part
          })
        }
      } else {
        // Extract timestamp and content
        const subParts = part.split(' ---\n')
        if (subParts.length === 2) {
          entries.push({
            timestamp: subParts[0].trim(),
            content: subParts[1].trim(),
            rawText: `--- Note added on ${part}`
          })
        }
      }
    })
    
    return entries
  }

  // Helper function to reconstruct notes string from entries
  const reconstructNotes = (entries) => {
    return entries.map(entry => {
      if (entry.timestamp) {
        return `--- Note added on ${entry.timestamp} ---\n${entry.content}`
      }
      return entry.content
    }).join('\n\n')
  }



  // Removed loadInterviews - now using real API data from parent component

  // Candidates are already filtered by server based on activeSubtab
  // No client-side filtering needed
  const filteredCandidates = interviews
  
  console.log('📊 ScheduledInterviews render:', {
    interviews: interviews.length,
    filteredCandidates: filteredCandidates.length,
    activeSubtab,
    sample: filteredCandidates[0]
  })





  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedCandidate(null)
    setActionType('')
    setRejectionReason('')
    setRescheduleData({ date: '', time: '' })
    setShowUploadSection(false)
    setIsUploading(false)
  }

  // File upload handler
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    
    if (files.length > 0) {
      // Validate file sizes (max 10MB each)
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        alert(`The following files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}. Please select smaller files.`)
        event.target.value = '' // Reset file input
        return
      }

      setIsUploading(true)
      try {
        const newDocuments = []
        
        for (const file of files) {
          // Create a more detailed document object
          const documentData = {
            name: file.name,
            size: file.size,
            type: file.type,
            stage: selectedCandidate?.application?.stage || 'general',
            uploaded_at: new Date().toISOString(),
            uploaded_by: 'current_user', // This should come from auth context
            file_extension: file.name.split('.').pop()?.toLowerCase(),
            file_data: await fileToBase64(file) // Convert file to base64 for storage
          }
          
          newDocuments.push(documentData)
          console.log('Uploading document:', documentData.name)
        }
        
        // Update the selected candidate's documents array
        setSelectedCandidate(prevCandidate => ({
          ...prevCandidate,
          documents: [...(prevCandidate.documents || []), ...newDocuments]
        }))
        
        // Also update the interviews array to persist the changes
        setInterviews(prevInterviews => 
          prevInterviews.map(interview => 
            interview.id === selectedCandidate.id 
              ? { 
                  ...interview, 
                  documents: [...(interview.documents || []), ...newDocuments] 
                }
              : interview
          )
        )
        
        event.target.value = '' // Reset file input
        setShowUploadSection(false) // Hide upload section after successful upload
        
        alert(`Successfully uploaded ${files.length} document${files.length !== 1 ? 's' : ''}!`)
      } catch (error) {
        console.error('Failed to upload documents:', error)
        alert('Failed to upload documents. Please try again.')
      } finally {
        setIsUploading(false)
      }
    }
  }

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  // Document view handler
  const handleViewDocument = async (doc) => {
    try {
      if (doc.file_data) {
        // If we have base64 data, create a blob URL and open it
        const byteCharacters = atob(doc.file_data.split(',')[1])
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: doc.type })
        const url = URL.createObjectURL(blob)
        
        // Open in new window/tab
        window.open(url, '_blank')
        
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else {
        // Fallback: show document info
        alert(`Document: ${doc.name}\nSize: ${(doc.size / 1024 / 1024).toFixed(2)} MB\nType: ${doc.type}\nUploaded: ${format(new Date(doc.uploaded_at), 'MMM dd, yyyy HH:mm')}`)
      }
    } catch (error) {
      console.error('Failed to view document:', error)
      alert('Failed to open document for viewing. Please try again.')
    }
  }

  // Document download handler
  const handleDownloadDocument = async (doc) => {
    try {
      if (doc.file_data) {
        // Create download link
        const link = document.createElement('a')
        link.href = doc.file_data
        link.download = doc.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        alert(`Download of "${doc.name}" has started.`)
      } else {
        alert('Document data not available for download.')
      }
    } catch (error) {
      console.error('Failed to download document:', error)
      alert('Failed to download document. Please try again.')
    }
  }

  // Document remove handler
  const handleRemoveDocument = async (globalIndex) => {
    const confirmed = confirm('Are you sure you want to remove this document? This action cannot be undone.')

    if (confirmed) {
      try {
        // Update the selected candidate's documents array
        setSelectedCandidate(prevCandidate => ({
          ...prevCandidate,
          documents: (prevCandidate.documents || []).filter((_, index) => index !== globalIndex)
        }))
        
        // Also update the interviews array to persist the changes
        setInterviews(prevInterviews => 
          prevInterviews.map(interview => 
            interview.id === selectedCandidate.id 
              ? { 
                  ...interview, 
                  documents: (interview.documents || []).filter((_, index) => index !== globalIndex)
                }
              : interview
          )
        )
        
        console.log('Removing document at global index:', globalIndex)
        alert('Document removed successfully!')
      } catch (error) {
        console.error('Failed to remove document:', error)
        alert('Failed to remove document. Please try again.')
      }
    }
  }

  const handleAction = async (candidate, action, additionalData = null) => {
    try {
      // Early return if candidate is null or undefined
      if (!candidate) {
        console.warn('handleAction called with null/undefined candidate')
        return
      }
      
      setIsProcessing(true)
      
      // Get the new note content and trim to max length
      let newNote = typeof additionalData === 'string' ? additionalData : (notesRef.current?.value || '')
      
      // Ensure note doesn't exceed max length
      if (newNote.length > MAX_NOTE_LENGTH) {
        newNote = newNote.substring(0, MAX_NOTE_LENGTH)
      }
      
      // For take_notes action, handle different scenarios
      let notesContent = newNote
      if (action === 'take_notes') {
        if (isEditingNotes && editingNoteIndex !== null) {
          // Editing a specific note
          const noteEntries = parseNotes(candidate.interview?.notes || '')
          noteEntries[editingNoteIndex] = {
            ...noteEntries[editingNoteIndex],
            content: newNote
          }
          notesContent = reconstructNotes(noteEntries)
        } else if (!isEditingNotes) {
          // Adding a new note
          const existingNotes = candidate.interview?.notes || ''
          const timestamp = format(new Date(), 'MMM dd, yyyy HH:mm')
          
          if (existingNotes) {
            // Append new note with separator and timestamp
            notesContent = `${existingNotes}\n\n--- Note added on ${timestamp} ---\n${newNote}`
          } else {
            // First note with timestamp
            notesContent = `--- Note added on ${timestamp} ---\n${newNote}`
          }
        }
        // If isEditingNotes is true but editingNoteIndex is null, it means editing all notes (use newNote as is)
      }
      
      let updateData = {
        notes: notesContent,
        updated_at: new Date().toISOString()
      }

      switch (action) {
        case 'send_reminder':
          // In a real app, this would trigger an SMS/email
          updateData.reminder_sent = true
          updateData.reminder_sent_at = new Date().toISOString()
          break
        case 'take_notes':
          // Just update notes (already handled above)
          break
        case 'mark_interviewed':
          updateData.status = 'completed'
          updateData.completed_at = new Date().toISOString()
          break
        case 'mark_pass':
          updateData.status = 'completed'
          updateData.result = 'pass'
          updateData.completed_at = new Date().toISOString()
          break
        case 'mark_fail':
          updateData.status = 'completed'
          updateData.result = 'fail'
          updateData.completed_at = new Date().toISOString()
          break
        case 'reject':
          updateData.status = 'cancelled'
          updateData.result = 'rejected'
          updateData.rejection_reason = rejectionReason
          updateData.cancelled_at = new Date().toISOString()
          break
        case 'reschedule':
          updateData.status = 'scheduled'
          updateData.scheduled_at = `${rescheduleData.date}T${rescheduleData.time}:00`
          updateData.rescheduled_at = new Date().toISOString()
          break
      }

      // ✅ Use real API instead of mock
      switch (action) {
        case 'mark_pass':
        case 'mark_fail':
          // Complete interview with pass/fail result
          await InterviewDataSource.completeInterview(
            candidate.application_id,
            action === 'mark_pass' ? 'passed' : 'failed',
            notesContent || ''
          )
          break
          
        case 'reject':
          // Update application status to withdrawn
          await ApplicationDataSource.updateApplicationStatus(
            candidate.application_id,
            'withdrawn',
            rejectionReason || 'Rejected from scheduled interviews'
          )
          break
          
        case 'reschedule':
          // Reschedule interview
          await InterviewDataSource.rescheduleInterview(
            candidate.application_id,
            candidate.interview.id,
            {
              date: rescheduleData.date,
              time: rescheduleData.time,
              duration: candidate.interview.duration || 60,
              location: candidate.interview.location || 'Office',
              interviewer: candidate.interview.interviewer || '',
              notes: notesContent || 'Rescheduled'
            }
          )
          break
          
        case 'take_notes':
        case 'send_reminder':
        case 'mark_interviewed':
          // These actions might not have dedicated APIs yet
          // Fall back to mock for now, or implement when APIs are available
          console.warn(`Action '${action}' using mock service - real API not yet implemented`)
          await interviewService.updateInterview(candidate.interview.id, updateData)
          break
          
        default:
          console.warn(`Unknown action: ${action}`)
          return
      }

      // Reload data from server after successful action
      if (action !== 'take_notes') {
        // Notify parent to reload data
        if (onDataReload) {
          await onDataReload()
        }
        handleCloseSidebar()
      } else {
        // For notes, update local state immediately
        setSelectedCandidate(prev => prev ? ({
          ...prev,
          interview: { ...prev.interview, notes: notesContent }
        }) : null)
      }
      
      console.log(`✅ Successfully completed action: ${action}`)
      
    } catch (error) {
      console.error(`❌ Failed to ${action}:`, error)
      alert(`Failed to ${action.replace('_', ' ')}: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setActionType('')
      setRejectionReason('')
      setRescheduleData({ date: '', time: '' })
    }
  }

  const getStatusBadge = (interview) => {
    const isUnattendedInterview = isUnattended(interview)

    if (isUnattendedInterview) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">{t('filters.unattended', 'Unattended')}</span>
    }
    
    // ✅ Check rescheduled_at timestamp for rescheduled status
    if (interview.rescheduled_at && interview.status === 'scheduled') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">Rescheduled</span>
    }

    switch (interview.status) {
      case 'scheduled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">Scheduled</span>
      case 'completed':
        if (interview.result === 'pass') {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Passed</span>
        } else if (interview.result === 'fail') {
          return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Failed</span>
        }
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Completed</span>
      case 'cancelled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Cancelled</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">Scheduled</span>
    }
  }
  
  const getInterviewTypeIcon = (type) => {
    switch (type) {
      case 'Online':
        return '💻'
      case 'Phone':
        return '📞'
      case 'In-person':
      default:
        return '🏢'
    }
  }

  const getActionButtons = (candidate) => {
    const interview = candidate.interview
    if (!interview?.scheduled_at) {
      return <div className="text-sm text-gray-600 dark:text-gray-400">No interview scheduled</div>
    }
    
    const interviewDate = parseISO(interview.scheduled_at)
    const isUpcoming = isToday(interviewDate) || isTomorrow(interviewDate)
    const isUnattendedCandidate = isUnattended(interview)

    if (interview.status === 'completed') {
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Interview completed - {interview.result || 'No result recorded'}
        </div>
      )
    }

    // Today, Tomorrow: Send reminder, Take notes during interview, Mark Interviewed, Mark pass, Mark fail, Reject with reason
    if (isUpcoming && interview.status === 'scheduled' && !isUnattendedCandidate) {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'send_reminder')
            }}
            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
          >
            <Send className="w-3 h-3 mr-1 inline" />
            Send Reminder
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_interviewed')
            }}
            className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
          >
            <Check className="w-3 h-3 mr-1 inline" />
            Mark Interviewed
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_pass')
            }}
            className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
          >
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            {getStageAction('markPass')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_fail')
            }}
            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
          >
            <XCircle className="w-3 h-3 mr-1 inline" />
            {getStageAction('markFail')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              console.log('Reject button clicked for candidate:', candidate.name)
              setSelectedCandidate(candidate)
              setActionType('reject')
              setIsSidebarOpen(false) // Close sidebar if open
            }}
            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
          >
            <X className="w-3 h-3 mr-1 inline" />
            {getStageAction('reject')}
          </button>
        </div>
      )
    }

    // Unattended, All: Mark Pass | Fail | Reject with reason (removes from shortlisted list) | Reschedule (future date)
    if (isUnattendedCandidate || activeSubtab === 'all' || activeSubtab === 'unattended') {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_pass')
            }}
            className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
          >
            <CheckCircle className="w-3 h-3 mr-1 inline" />
            {getStageAction('markPass')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_fail')
            }}
            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
          >
            <XCircle className="w-3 h-3 mr-1 inline" />
            {getStageAction('markFail')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              console.log('Reject button clicked for candidate:', candidate.name)
              setSelectedCandidate(candidate)
              setActionType('reject')
              setIsSidebarOpen(false) // Close sidebar if open
            }}
            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
          >
            <X className="w-3 h-3 mr-1 inline" />
            {getStageAction('reject')}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              console.log('Reschedule button clicked for candidate:', candidate.name)
              setSelectedCandidate(candidate)
              setActionType('reschedule')
              setIsSidebarOpen(false) // Close sidebar if open
            }}
            className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
          >
            <RotateCcw className="w-3 h-3 mr-1 inline" />
            {getStageAction('rescheduleInterview')}
          </button>
        </div>
      )
    }

    return (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Scheduled for {format(interviewDate, 'MMM dd, yyyy')}
      </div>
    )
  }

  const getLocationIcon = (location) => {
    if (location?.toLowerCase().includes('video') || location?.toLowerCase().includes('zoom') || location?.toLowerCase().includes('teams')) {
      return <Video className="w-4 h-4" />
    }
    if (location?.toLowerCase().includes('phone') || location?.toLowerCase().includes('call')) {
      return <Phone className="w-4 h-4" />
    }
    return <MapPin className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Candidate Sidebar - Unified Component */}
      <CandidateSummaryS2
        applicationId={selectedCandidate?.application?.id}
        candidateId={selectedCandidate?.id}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Subtabs/Chips - Only show in Contemporary mode */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: t('filters.today', 'Today'), count: getSubtabCounts().today },
            { id: 'tomorrow', label: t('filters.tomorrow', 'Tomorrow'), count: getSubtabCounts().tomorrow },
            { id: 'unattended', label: t('filters.unattended', 'Unattended'), count: getSubtabCounts().unattended },
            { id: 'all', label: t('filters.all', 'All'), count: getSubtabCounts().all }
          ].map(subtab => (
            <button
              key={subtab.id}
              onClick={() => {
                console.log('🔘 Tab clicked:', subtab.id, 'onFilterChange exists:', !!onFilterChange)
                if (onFilterChange) {
                  console.log('📞 Calling onFilterChange with:', subtab.id)
                  onFilterChange(subtab.id)
                } else {
                  console.warn('⚠️ onFilterChange is not defined!')
                }
              }}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSubtab === subtab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {subtab.label}
              {subtab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeSubtab === subtab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                  {subtab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Interviews List */}
      <div className="space-y-4">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate, index) => {
            const interview = candidate.interview
            if (!interview?.scheduled_at) return null
            
            const interviewDate = parseISO(interview.scheduled_at)
            const isUnattendedCandidate = isUnattended(interview)

            return (
              <div
                key={`${candidate.id}-${candidate.application_id || index}`}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer bg-white dark:bg-gray-800"
                onClick={() => handleCandidateClick(candidate)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                        {candidate.name?.charAt(0) || '?'}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{candidate.name || 'Unknown Candidate'}</h3>
                          {candidate.priority_score !== undefined && candidate.priority_score !== null && (
                            <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">{candidate.priority_score}% Match</span>
                            </div>
                          )}
                        </div>
                        {getStatusBadge(interview)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{format(interviewDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{interview.time ? formatTime12Hour(interview.time) : format(interviewDate, 'h:mm a')} ({interview.duration || 60} min)</span>
                        </div>
                        <div className="flex items-center">
                          {getLocationIcon(interview.location)}
                          <span className="ml-2">{interview.location || 'Not specified'}</span>
                        </div>
                      </div>

                      {/* Position Information */}
                      {candidate.position && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{candidate.position.title}</p>
                              
                              {/* Salary Information */}
                              {(candidate.position.salary || candidate.position.monthly_salary_amount) && (
                                <div className="mt-1 space-y-1">
                                  {/* Base Salary */}
                                  <p className="text-sm text-blue-800 dark:text-blue-200">
                                    💰 {(candidate.position.salary?.amount || candidate.position.monthly_salary_amount)?.toLocaleString()} {candidate.position.salary?.currency || candidate.position.salary_currency || 'AED'}
                                  </p>
                                  
                                  {/* Converted Salary (if available) */}
                                  {candidate.position.salary?.converted_amount && (
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                      ≈ {candidate.position.salary.converted_amount.toLocaleString()} {candidate.position.salary.converted_currency || 'NPR'}
                                      {candidate.position.salary.conversion_rate && (
                                        <span className="text-gray-600 dark:text-gray-400"> @ {candidate.position.salary.conversion_rate}</span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Vacancies */}
                              {candidate.position.total_vacancies && (
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                  📋 {candidate.position.total_vacancies} position{candidate.position.total_vacancies !== 1 ? 's' : ''} available
                                  {candidate.position.male_vacancies || candidate.position.female_vacancies ? (
                                    <span> ({candidate.position.male_vacancies || 0}M, {candidate.position.female_vacancies || 0}F)</span>
                                  ) : null}
                                </p>
                              )}
                              
                              {/* Working Hours */}
                              {candidate.position.hours_per_day_override && (
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                  ⏰ {candidate.position.hours_per_day_override}h/day, {candidate.position.days_per_week_override || 5} days/week
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <User className="w-4 h-4 mr-2" />
                        <span>{t('actions.interviewer', 'Interviewer')}: {interview.interviewer || t('status.notScheduled', 'Not assigned')}</span>
                      </div>

                      {/* Interview Type */}
                      {interview.type && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span className="mr-2">{getInterviewTypeIcon(interview.type)}</span>
                          <span>{interview.type}</span>
                        </div>
                      )}

                      {/* Rescheduled Indicator */}
                      {interview.rescheduled_at && (
                        <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mb-3">
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Rescheduled on {format(new Date(interview.rescheduled_at), 'MMM dd, yyyy')}
                        </div>
                      )}

                      {interview.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-2 mb-3">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300 whitespace-pre-wrap break-words">{interview.notes}</p>
                        </div>
                      )}

                      {/* Unattended Flag */}
                      {isUnattendedCandidate && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-2 mb-3">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                            <p className="text-sm text-red-800 dark:text-red-300">
                              {t('card.unattendedFlag', 'Automatically flagged as unattended (grace period expired)')}
                            </p>
                          </div>
                        </div>
                      )}

                      <div onClick={(e) => e.stopPropagation()}>
                        {getActionButtons(candidate)}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCandidateClick(candidate)
                    }}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {t('actions.viewDetails', 'View Details')}
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('empty.noInterviews', 'No scheduled interviews')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeSubtab === 'all'
                ? 'No interviews have been scheduled yet.'
                : `No interviews match the "${activeSubtab}" filter.`}
            </p>
          </div>
        )}
      </div>



      {/* Action Modals */}
      {actionType === 'reject' && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reject Candidate</h3>
              <button
                onClick={() => {
                  setActionType('')
                  setRejectionReason('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ This will remove the candidate from the shortlisted list and cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setActionType('')
                    setRejectionReason('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedCandidate, 'reject')}
                  disabled={!rejectionReason.trim() || isProcessing}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionType === 'reschedule' && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reschedule Interview</h3>
              <button
                onClick={() => {
                  setActionType('')
                  setRescheduleData({ date: '', time: '' })
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Date & Time
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={rescheduleData.date}
                      onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        rescheduleData.date
                          ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                      }`}
                      style={!rescheduleData.date ? { opacity: 0.6 } : {}}
                    />
                    {!rescheduleData.date && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        Select new date
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="time"
                      value={rescheduleData.time}
                      onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        rescheduleData.time
                          ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                      }`}
                      style={!rescheduleData.time ? { opacity: 0.6 } : {}}
                    />
                    {rescheduleData.time ? (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                        {formatTime12Hour(rescheduleData.time + ':00')}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        Select new time
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setActionType('')
                    setRescheduleData({ date: '', time: '' })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedCandidate, 'reschedule')}
                  disabled={!rescheduleData.date || !rescheduleData.time || isProcessing}
                  className="btn-primary disabled:opacity-50"
                >
                  {isProcessing ? 'Rescheduling...' : 'Reschedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduledInterviews