import { useState, useEffect } from 'react'
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
import { format, isToday, isTomorrow, isPast, addMinutes, parseISO } from 'date-fns'

const ScheduledInterviews = ({ candidates, jobId, interviews: propInterviews }) => {
  const [activeSubtab, setActiveSubtab] = useState('today')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [actionType, setActionType] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' })
  const [isProcessing, setIsProcessing] = useState(false)
  const [interviews, setInterviews] = useState([])
  const [gracePeriod] = useState(30) // 30 minutes grace period
  const [showUploadSection, setShowUploadSection] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Check if an interview is unattended (past scheduled time + grace period)
  const isUnattended = (interview) => {
    if (!interview || interview.status !== 'scheduled') return false
    const interviewEnd = addMinutes(parseISO(interview.scheduled_at), (interview.duration || 60) + gracePeriod)
    return isPast(interviewEnd)
  }

  // Calculate counts for each subtab
  const getSubtabCounts = () => {
    const counts = {
      today: 0,
      tomorrow: 0,
      unattended: 0,
      all: interviews.length
    }

    interviews.forEach(candidate => {
      if (!candidate.interview) return

      const interviewDate = parseISO(candidate.interview.scheduled_at)
      const interview = candidate.interview
      
      // Count today's interviews (scheduled or unattended, but not completed/cancelled)
      if (isToday(interviewDate) && (interview.status === 'scheduled' || isUnattended(interview))) {
        counts.today++
      }
      
      // Count tomorrow's scheduled interviews
      if (isTomorrow(interviewDate) && interview.status === 'scheduled') {
        counts.tomorrow++
      }
      
      // Count truly unattended interviews
      if (isUnattended(interview)) {
        counts.unattended++
      }
    })

    return counts
  }

  // Handle candidate click to open sidebar
  const handleCandidateClick = (candidate) => {
    // Add sample documents if none exist (for testing purposes)
    if (!candidate.documents || candidate.documents.length === 0) {
      candidate.documents = [
        {
          name: `${candidate.name || 'Candidate'}_CV.pdf`,
          size: 2400000, // 2.4 MB
          type: 'application/pdf',
          stage: 'applied',
          uploaded_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          uploaded_by: 'candidate',
          file_extension: 'pdf'
        },
        {
          name: `${candidate.name || 'Candidate'}_Passport.jpg`,
          size: 1800000, // 1.8 MB
          type: 'image/jpeg',
          stage: 'shortlisted',
          uploaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          uploaded_by: 'hr_team',
          file_extension: 'jpg'
        },
        {
          name: `${candidate.name || 'Candidate'}_Certificate.pdf`,
          size: 950000, // 0.95 MB
          type: 'application/pdf',
          stage: 'interview-scheduled',
          uploaded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          uploaded_by: 'candidate',
          file_extension: 'pdf'
        }
      ]
    }
    
    setSelectedCandidate(candidate)
    setIsSidebarOpen(true)
  }

  useEffect(() => {
    if (propInterviews) {
      // Use interviews passed as props (from calendar view)
      setInterviews(propInterviews.map(interview => ({
        id: interview.candidate_id || interview.id,
        name: interview.candidate_name || interview.name || 'Unknown Candidate',
        phone: interview.candidate_phone || interview.phone || '',
        email: interview.candidate_email || interview.email || '',
        interview: interview
      })))
    } else {
      // Load interviews from candidates
      loadInterviews()
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

  // Debug: Monitor actionType and selectedCandidate changes
  useEffect(() => {
    console.log('State changed - actionType:', actionType, 'selectedCandidate:', selectedCandidate?.name)
  }, [actionType, selectedCandidate])

  const loadInterviews = async () => {
    try {
      console.log('Loading interviews for candidates:', candidates?.length, 'jobId:', jobId)
      const interviewData = []
      
      if (!candidates || candidates.length === 0) {
        console.warn('No candidates available for loading interviews')
        setInterviews([])
        return
      }
      
      for (const candidate of candidates) {
        const candidateInterviews = await interviewService.getInterviewsByCandidateId(candidate.id)
        const jobInterview = candidateInterviews.find(interview => interview.job_id === jobId)
        if (jobInterview) {
          interviewData.push({
            ...candidate,
            interview: jobInterview
          })
        }
      }
      
      console.log('Loaded interview data:', interviewData.length, 'interviews')
      setInterviews(interviewData)
    } catch (error) {
      console.error('Failed to load interviews:', error)
      setInterviews([]) // Set empty array on error to prevent undefined issues
    }
  }

  // Filter candidates based on active subtab
  const filteredCandidates = interviews.filter(candidate => {
    if (!candidate.interview) return false

    const interviewDate = parseISO(candidate.interview.scheduled_at)
    const interview = candidate.interview

    switch (activeSubtab) {
      case 'today':
        // Show today's interviews that are scheduled or unattended, but not completed/cancelled
        const isTodayResult = isToday(interviewDate) && (interview.status === 'scheduled' || isUnattended(interview))
        return isTodayResult
      case 'tomorrow':
        // Show tomorrow's scheduled interviews
        const isTomorrowResult = isTomorrow(interviewDate) && interview.status === 'scheduled'
        return isTomorrowResult
      case 'unattended':
        // Show only truly unattended interviews (scheduled but past grace period)
        const isUnattendedResult = isUnattended(interview)
        return isUnattendedResult
      case 'all':
      default:
        // Show all interviews regardless of status
        return true
    }
  })

  // Debug: Log filtering results
  console.log(`Filtering for ${activeSubtab}:`, {
    totalInterviews: interviews.length,
    filteredCount: filteredCandidates.length,
    interviews: interviews.map(c => ({ 
      name: c.name, 
      status: c.interview?.status, 
      date: c.interview?.scheduled_at 
    }))
  })





  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedCandidate(null)
    setNotes('')
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
      setIsProcessing(true)
      let updateData = {
        notes: notes,
        updated_at: new Date().toISOString()
      }

      switch (action) {
        case 'send_reminder':
          // In a real app, this would trigger an SMS/email
          updateData.reminder_sent = true
          updateData.reminder_sent_at = new Date().toISOString()
          break
        case 'take_notes':
          // Just update notes
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

      await interviewService.updateInterview(candidate.interview.id, updateData)

      // Reload interviews - handle both prop-based and candidate-based data
      if (propInterviews) {
        // If using propInterviews, we need to refresh the parent component's data
        // For now, we'll update the local state optimistically
        setInterviews(prevInterviews => 
          prevInterviews.map(item => 
            item.interview.id === candidate.interview.id 
              ? { ...item, interview: { ...item.interview, ...updateData } }
              : item
          )
        )
      } else {
        // If using candidates prop, reload from service
        await loadInterviews()
      }

      // Close sidebar and reset state
      handleCloseSidebar()
    } catch (error) {
      console.error('Failed to update interview:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (interview) => {
    const interviewDate = parseISO(interview.scheduled_at)
    const isUnattendedInterview = isUnattended(interview)

    if (isUnattendedInterview) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Unattended</span>
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
      case 'rescheduled':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">Rescheduled</span>
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">Scheduled</span>
    }
  }

  const getActionButtons = (candidate) => {
    const interview = candidate.interview
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
            Mark Pass
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_fail')
            }}
            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
          >
            <XCircle className="w-3 h-3 mr-1 inline" />
            Mark Fail
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
            Reject
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
            Mark Pass
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAction(candidate, 'mark_fail')
            }}
            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
          >
            <XCircle className="w-3 h-3 mr-1 inline" />
            Mark Fail
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
            Reject
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
            Reschedule
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

  const CandidateSidebar = ({ candidate, isOpen, onClose }) => {
    if (!isOpen || !candidate) return null

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        <div className="absolute right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-xl" style={{ width: '60vw' }}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Candidate Summary</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* Profile Section */}
              <div className="mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-600 dark:text-gray-300">
                      {candidate.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{candidate.name || 'Unknown Candidate'}</h3>
                    {candidate.priority_score && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Priority Score: {candidate.priority_score}</span>
                      </div>
                    )}
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      Applied {candidate.applied_at ? format(new Date(candidate.applied_at), 'MMM dd, yyyy') : 'Date unknown'}
                    </div>
                    
                    {/* Current Stage */}
                    {candidate.application?.stage && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="chip chip-blue text-xs">
                          {candidate.application.stage.charAt(0).toUpperCase() + candidate.application.stage.slice(1).replace('-', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Current Stage</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Phone</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.phone || 'Not provided'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.email || 'Not provided'}</div>
                    </div>
                  </div>
                  {candidate.passport_number && (
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Passport</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.passport_number}</div>
                      </div>
                    </div>
                  )}
                  {candidate.job_title && (
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Applied For</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.job_title}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interview Details */}
              {candidate.interview && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Interview Details
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Date & Time</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {format(parseISO(candidate.interview.scheduled_at), 'MMM dd, yyyy h:mm a')}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Duration</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.interview.duration || 60} minutes</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Location</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.interview.location || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Interviewer</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.interview.interviewer || 'Not assigned'}</div>
                      </div>
                      {candidate.interview.status && (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Status</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{candidate.interview.status}</div>
                        </div>
                      )}
                      {candidate.interview.result && (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Result</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{candidate.interview.result}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Interview Feedback/Remarks */}
                    {(candidate.interview.notes || candidate.interview_remarks || candidate.interview.feedback) && (
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                          Interview Feedback & Remarks
                        </h5>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {candidate.interview.notes || candidate.interview_remarks || candidate.interview.feedback || 'No feedback recorded yet.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interview History */}
              {candidate.interviewed_at && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Interview History
                  </h4>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <div className="flex items-center text-sm mb-2">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Interview Completed</span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {format(new Date(candidate.interviewed_at), 'EEEE, MMM dd, yyyy')}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {format(new Date(candidate.interviewed_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes Field */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Interview Notes
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about the interview..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <button
                  onClick={() => handleAction(candidate, 'take_notes')}
                  disabled={isProcessing}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Saving...' : 'Save Notes'}
                </button>
              </div>

              {/* Additional Details */}
              <div className="space-y-6">
                {/* Address */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    Address
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300">{candidate.address || 'Not provided'}</p>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Skills
                  </h4>
                  {(candidate.skills && candidate.skills.length > 0) ? (
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span key={index} className="chip chip-blue">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300">No skills specified</p>
                    </div>
                  )}
                </div>

                {/* Education */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Education
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300">{candidate.education || 'Not specified'}</p>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Experience
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300">{candidate.experience || 'Not provided'}</p>
                  </div>
                </div>

                {/* Documents Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <Paperclip className="w-5 h-5 mr-2" />
                        Documents & Attachments
                        {candidate.documents && candidate.documents.length > 0 && (
                          <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                            {candidate.documents.length} file{candidate.documents.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </h4>
                      {candidate.documents && candidate.documents.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Manage and organize candidate documents by workflow stage
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowUploadSection(!showUploadSection)}
                      className={`btn-primary flex items-center space-x-2 text-sm ${showUploadSection ? 'bg-gray-600 hover:bg-gray-700' : ''}`}
                      disabled={isUploading}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{showUploadSection ? 'Cancel' : 'Add Document'}</span>
                    </button>
                  </div>
                  
                  {/* Advanced Dynamic Upload Section */}
                  {showUploadSection && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-600 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <label className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center">
                            <Paperclip className="w-4 h-4 mr-2" />
                            Upload documents for: {candidate.application?.stage || 'General'}
                          </label>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Documents will be organized by workflow stage automatically
                          </p>
                        </div>
                        <button
                          onClick={() => setShowUploadSection(false)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <label className="block">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls,.ppt,.pptx"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                        <div className="border-2 border-dashed border-blue-300 dark:border-blue-500 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-400 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-md">
                          {isUploading ? (
                            <div className="flex flex-col items-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                                Uploading documents...
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Please wait while we process your files
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                                Click to select documents or drag & drop
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                                Multiple files supported • Max 10MB each
                              </p>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {['PDF', 'DOC', 'DOCX', 'JPG', 'PNG', 'TXT', 'XLSX', 'PPT'].map(format => (
                                  <span key={format} className="text-xs bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                                    {format}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                      
                      {/* Quick Actions */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                          <FileText className="w-3 h-3" />
                          <span>Auto-categorized by stage</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowUploadSection(false)}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Documents List by Stage */}
                  <div className="space-y-4">
                    {candidate.documents && candidate.documents.length > 0 ? (
                      (() => {
                        // Group documents by stage while preserving global indices
                        const documentsByStage = {}
                        candidate.documents.forEach((doc, globalIndex) => {
                          const stage = doc.stage || 'general'
                          if (!documentsByStage[stage]) documentsByStage[stage] = []
                          documentsByStage[stage].push({ doc, globalIndex })
                        })
                        
                        return Object.entries(documentsByStage).map(([stage, docsWithIndices]) => (
                          <div key={stage} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                              {stage === 'general' ? 'General Documents' : `${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage`}
                              <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                                {docsWithIndices.length} file{docsWithIndices.length !== 1 ? 's' : ''}
                              </span>
                            </h5>
                            
                            <div className="space-y-3">
                              {docsWithIndices.map(({ doc, globalIndex }) => {
                                const getFileIcon = (type, extension) => {
                                  if (type?.includes('pdf')) return '📄'
                                  if (type?.includes('image')) return '🖼️'
                                  if (type?.includes('word') || extension === 'doc' || extension === 'docx') return '📝'
                                  if (type?.includes('excel') || extension === 'xlsx' || extension === 'xls') return '📊'
                                  if (type?.includes('powerpoint') || extension === 'ppt' || extension === 'pptx') return '📋'
                                  return '📎'
                                }

                                return (
                                  <div key={globalIndex} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 group">
                                    <div className="flex items-center space-x-4 flex-1">
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-600">
                                        <span className="text-lg">
                                          {getFileIcon(doc.type, doc.file_extension)}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={doc.name}>
                                            {doc.name}
                                          </p>
                                          {doc.file_extension && (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium uppercase">
                                              {doc.file_extension}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                          <span>{doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}</span>
                                          {doc.uploaded_at && (
                                            <span>Uploaded {format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}</span>
                                          )}
                                          {doc.uploaded_by && (
                                            <span>by {doc.uploaded_by}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => handleViewDocument(doc)}
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        title="View Document"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDownloadDocument(doc)}
                                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900/30 transition-colors"
                                        title="Download Document"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleRemoveDocument(globalIndex)}
                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                        title="Remove Document"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      })()
                    ) : (
                      // Default CV section if no documents
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-600">
                              <span className="text-lg">📄</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {candidate.name || 'Unknown'}_CV.pdf
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">PDF • 2.3 MB • Default CV</div>
                            </div>
                          </div>
                          <button className="btn-secondary text-sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Candidate Sidebar */}
      <CandidateSidebar
        candidate={selectedCandidate}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Subtabs/Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'today', label: 'Today', count: getSubtabCounts().today },
          { id: 'tomorrow', label: 'Tomorrow', count: getSubtabCounts().tomorrow },
          { id: 'unattended', label: 'Unattended', count: getSubtabCounts().unattended },
          { id: 'all', label: 'All', count: getSubtabCounts().all }
        ].map(subtab => (
          <button
            key={subtab.id}
            onClick={() => setActiveSubtab(subtab.id)}
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

      {/* Interviews List */}
      <div className="space-y-4">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map(candidate => {
            const interview = candidate.interview
            const interviewDate = parseISO(interview.scheduled_at)
            const isUnattendedCandidate = isUnattended(interview)

            return (
              <div
                key={candidate.id}
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
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{candidate.name || 'Unknown Candidate'}</h3>
                        {getStatusBadge(interview)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{format(interviewDate, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>{format(interviewDate, 'h:mm a')} ({interview.duration || 60} min)</span>
                        </div>
                        <div className="flex items-center">
                          {getLocationIcon(interview.location)}
                          <span className="ml-2">{interview.location || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <User className="w-4 h-4 mr-2" />
                        <span>Interviewer: {interview.interviewer || 'Not assigned'}</span>
                      </div>

                      {interview.notes && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-2 mb-3">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">{interview.notes}</p>
                        </div>
                      )}

                      {/* Unattended Flag */}
                      {isUnattendedCandidate && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-2 mb-3">
                          <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
                            <p className="text-sm text-red-800 dark:text-red-300">
                              Automatically flagged as unattended (grace period expired)
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
                    View Details
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No scheduled interviews</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeSubtab === 'all'
                ? 'No interviews have been scheduled yet.'
                : `No interviews match the "${activeSubtab}" filter.`}
            </p>
          </div>
        )}
      </div>

      {/* Debug: Show actionType state */}
      {actionType && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg" style={{ zIndex: 10000 }}>
          Debug: actionType = {actionType}, candidate = {selectedCandidate?.name}
        </div>
      )}

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
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, date: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <input
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData(prev => ({ ...prev, time: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
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