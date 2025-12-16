import { useState, useEffect } from 'react'
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  Upload, 
  Download,
  User,
  Briefcase,
  GraduationCap,
  CreditCard,
  // 
  Clock,
  MessageSquare,
  Paperclip,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { useConfirm } from './ConfirmProvider.jsx'
import { useAgency } from '../contexts/AgencyContext.jsx'
import ApplicationHistory from './ApplicationHistory.jsx'
import ApplicationNotes from './ApplicationNotes.jsx'
import DocumentDataSource from '../api/datasources/DocumentDataSource.js'
import InterviewDataSource from '../api/datasources/InterviewDataSource.js'
import InterviewScheduleDialog from './InterviewScheduleDialog.jsx'
import { formatTime12Hour } from '../utils/helpers.js'
import { useLanguage } from '../hooks/useLanguage'

const CandidateSummaryS2 = ({ 
  candidate, 
  application,
  isOpen, 
  onClose, 
  onUpdateStatus, 
  onAttachDocument,
  onRemoveDocument,
  workflowStages = [],
  isFromJobsPage = false,
  jobId = null,
  // Interview-specific props
  isInterviewContext = false,
  onMarkPass = null,
  onMarkFail = null,
  onReject = null,
  onReschedule = null,
  onUpdateNotes = null,
  onSendReminder = null
}) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadSection, setShowUploadSection] = useState(false)
  
  // Interview-specific state
  const [isProcessingInterview, setIsProcessingInterview] = useState(false)
  const [showInterviewActions, setShowInterviewActions] = useState(false)
  const [interviewActionType, setInterviewActionType] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [interviewNotes, setInterviewNotes] = useState('')
  
  // Interview scheduling dialog
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [isReschedule, setIsReschedule] = useState(false)
  const [initialInterviewData, setInitialInterviewData] = useState(null)
  
  // Document viewing state (read-only for admin)
  const [apiDocuments, setApiDocuments] = useState(null)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [documentError, setDocumentError] = useState(null)
  
  // Application notes state
  const [notes, setNotes] = useState([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [notesError, setNotesError] = useState(null)
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteIsPrivate, setNewNoteIsPrivate] = useState(true)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteText, setEditNoteText] = useState('')
  const [editNoteIsPrivate, setEditNoteIsPrivate] = useState(true)
  
  const { confirm } = useConfirm()
  const { agencyData } = useAgency()
  const { tPageSync } = useLanguage({ pageName: 'candidate-summary', autoLoad: true })
  const t = (key, params = {}) => tPageSync(key, params)
  
  // Load documents from API when candidate changes
  useEffect(() => {
    const loadDocuments = async () => {
      // Get candidate ID from either new or old structure
      const candidateId = candidate?.candidate?.id || candidate?.id
      if (!candidateId) return
      
      try {
        setLoadingDocuments(true)
        setDocumentError(null)
        const docs = await DocumentDataSource.getCandidateDocuments(candidateId)
        setApiDocuments(docs)
      } catch (error) {
        console.error('Failed to load documents:', error)
        setDocumentError(error.message || 'Failed to load documents')
      } finally {
        setLoadingDocuments(false)
      }
    }
    
    if (isOpen && candidate) {
      loadDocuments()
    }
  }, [candidate, isOpen])

  // Load notes from API when candidate changes
  useEffect(() => {
    const loadNotes = async () => {
      const applicationId = candidate?.application?.id || candidate?.candidate?.application?.id
      if (!applicationId) return
      
      try {
        setLoadingNotes(true)
        setNotesError(null)
        const response = await applicationNotesService.getNotesByApplication(applicationId)
        setNotes(response.data || [])
      } catch (error) {
        console.error('Failed to load notes:', error)
        setNotesError(error.message || 'Failed to load notes')
      } finally {
        setLoadingNotes(false)
      }
    }
    
    if (isOpen && candidate) {
      loadNotes()
    }
  }, [candidate, isOpen])

  // Debug logging - MUST BE BEFORE EARLY RETURN
  useEffect(() => {
    if (candidate) {
      console.log('🔍 CandidateSummaryS2 Debug:', {
        candidate,
        isOpen,
        isInterviewContext
      })
    }
  }, [candidate, isOpen, isInterviewContext])

  // EARLY RETURN MUST BE AFTER ALL HOOKS
  if (!isOpen || !candidate) return null

  // Helper function to safely access candidate data (handles both old and new structure)
  const getCandidateData = () => {
    // Stage mapping from backend format to frontend format
    const stageMap = {
      'applied': 'applied',
      'shortlisted': 'shortlisted',
      'interview_scheduled': 'interview-scheduled',
      'interview_rescheduled': 'interview-scheduled',
      'interview_passed': 'interview-passed',
      'interview_failed': 'interview-failed'
    }

    // New unified endpoint structure (from getCandidateDetails)
    if (candidate.candidate) {
      return {
        id: candidate.candidate.id,
        name: candidate.candidate.name,
        phone: candidate.candidate.phone,
        email: candidate.candidate.email,
        address: candidate.candidate.address?.formatted || candidate.candidate.address,
        passport_number: candidate.candidate.passport_number,
        profile_image: candidate.candidate.profile_image,
        
        // Job profile data
        experience: candidate.job_profile?.experience,
        education: candidate.job_profile?.education,
        skills: candidate.job_profile?.skills || [],
        summary: candidate.job_profile?.summary,
        
        // Job context
        job_title: candidate.job_context?.job_title,
        job_company: candidate.job_context?.job_company,
        
        // Application data - convert status to stage
        application: {
          ...candidate.application,
          stage: stageMap[candidate.application?.status] || candidate.application?.status
        },
        
        // Interview data
        interviewed_at: candidate.interview?.interview_date_ad,
        interview_remarks: candidate.interview?.notes,
        interview: candidate.interview
      }
    }
    
    // Candidates list endpoint structure (from getJobCandidates)
    // This has status field instead of application.stage
    if (candidate.status && !candidate.application) {
      return {
        id: candidate.id,
        name: candidate.name,
        phone: candidate.phone,
        email: candidate.email,
        address: candidate.location?.city ? `${candidate.location.city}, ${candidate.location.country}` : 'N/A',
        experience: candidate.experience,
        skills: candidate.skills || [],
        
        // Create application object with converted stage
        application: {
          id: candidate.application_id,
          stage: stageMap[candidate.status] || candidate.status,
          created_at: candidate.applied_at
        },
        
        // Interview data
        interview: candidate.interview
      }
    }
    
    // Old structure (fallback)
    return candidate
  }
  
  const candidateData = getCandidateData()

  // Define the 4 main workflow stages
  const mainWorkflowStages = [
    { id: 'applied', label: t('stages.applied') },
    { id: 'shortlisted', label: t('stages.shortlisted') },
    { id: 'interview-scheduled', label: t('stages.interviewScheduled') },
    { id: 'interview-passed', label: t('stages.interviewPassed') }
  ]

  const currentStage = mainWorkflowStages.find(s => s.id === candidateData.application?.stage) || 
                     workflowStages.find(s => s.id === candidateData.application?.stage)
  const rejectedStage = workflowStages.find(s => s.label === 'Rejected')
  // Use candidateData.application as the source of truth (handles both old and new API structures)
  const currentApplication = candidateData.application
  // Fix: Check for various rejected stage formats
  const isApplicationRejected = currentApplication?.stage === rejectedStage?.id || 
                               currentApplication?.stage === 'rejected' ||
                               currentApplication?.stage === 'REJECTED' ||
                               (typeof currentApplication?.stage === 'string' && currentApplication.stage.toLowerCase().includes('reject'))

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
    // Allow pass/fail from interview-scheduled stage
    if (currentStage === 'interview-scheduled' && 
        (targetStage === 'interview-passed' || targetStage === 'interview-failed')) {
      return true
    }
    
    // Strict progression: allow only immediate next stage
    const nextAllowed = getNextAllowedStage(currentStage)
    return targetStage === nextAllowed
  }

  const handleStatusUpdate = async (newStage) => {
    console.log('🎯 handleStatusUpdate called with:', newStage)
    setIsUpdating(true)
    try {
      const currentStage = candidateData.application?.stage
      
      // Allow staying in the same stage
      if (currentStage === newStage) {
        setIsUpdating(false)
        return
      }
      
      // Validate stage transition
      if (!validateStageTransition(currentStage, newStage)) {
        const currentStageLabel = mainWorkflowStages.find(s => s.id === currentStage)?.label || currentStage
        const newStageLabel = mainWorkflowStages.find(s => s.id === newStage)?.label || newStage
        
        await confirm({
          title: 'Invalid Stage Transition',
          message: `You cannot move directly from "${currentStageLabel}" to "${newStageLabel}". Please follow the proper workflow sequence.`,
          confirmText: 'Okay',
          type: 'warning'
        })
        return
      }

      // Show confirmation dialog for valid transitions
      const currentStageLabel = mainWorkflowStages.find(s => s.id === currentStage)?.label || currentStage
      const newStageLabel = mainWorkflowStages.find(s => s.id === newStage)?.label || newStage
      
      const confirmed = await confirm({
        title: 'Confirm Stage Update',
        message: `Are you sure you want to move this candidate from "${currentStageLabel}" to "${newStageLabel}"? This action cannot be undone.`,
        confirmText: 'Yes, Update Stage',
        cancelText: 'Cancel',
        type: 'warning'
      })

      if (confirmed) {
        console.log('✅ User confirmed stage update')
        // Use the application ID from candidateData.application
        const applicationId = candidateData.application?.id
        console.log('📋 Application ID:', applicationId)
        if (applicationId) {
          console.log('🔄 Calling onUpdateStatus...')
          await onUpdateStatus(applicationId, newStage)
          console.log('✅ onUpdateStatus completed')
        } else {
          throw new Error('No application ID found')
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
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    
    if (files.length > 0) {
      // Validate file sizes (max 10MB each)
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        await confirm({
          title: 'File Size Error',
          message: `The following files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}. Please select smaller files.`,
          confirmText: 'Okay',
          type: 'danger'
        })
        event.target.value = '' // Reset file input
        return
      }

      // Show confirmation for document upload
      const confirmed = await confirm({
        title: 'Confirm Document Upload',
        message: `Are you sure you want to upload ${files.length} document${files.length !== 1 ? 's' : ''} for this candidate?`,
        confirmText: 'Yes, Upload',
        cancelText: 'Cancel',
        type: 'info'
      })

      if (!confirmed) {
        event.target.value = '' // Reset file input
        return
      }

      setIsUploading(true)
      try {
        for (const file of files) {
          // Create a more detailed document object
          const documentData = {
            name: file.name,
            size: file.size,
            type: file.type,
            stage: candidate.application?.stage || 'general',
            uploaded_at: new Date().toISOString(),
            uploaded_by: 'current_user', // This should come from auth context
            file_extension: file.name.split('.').pop()?.toLowerCase(),
            file_data: await fileToBase64(file) // Convert file to base64 for storage
          }
          
          await onAttachDocument(candidate.id, documentData)
        }
        event.target.value = '' // Reset file input
        setShowUploadSection(false) // Hide upload section after successful upload
        
        // Show success message
        await confirm({
          title: 'Upload Successful',
          message: `Successfully uploaded ${files.length} document${files.length !== 1 ? 's' : ''}!`,
          confirmText: 'Great!',
          type: 'success'
        })
      } catch (error) {
        console.error('Failed to upload documents:', error)
        await confirm({
          title: 'Upload Error',
          message: 'Failed to upload documents. Please try again.',
          confirmText: 'Okay',
          type: 'danger'
        })
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

  const handleRemoveDocument = async (globalIndex, stage) => {
    const confirmed = await confirm({
      title: 'Remove Document',
      message: 'Are you sure you want to remove this document? This action cannot be undone.',
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      type: 'danger'
    })

    if (confirmed) {
      try {
        if (onRemoveDocument) {
          // Pass the global index instead of the stage-specific index
          await onRemoveDocument(candidate.id, globalIndex)
        } else {
          console.log('Removing document at global index:', globalIndex)
          // Fallback: just log the action if no remove handler is provided
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
  }

  // Handle document upload for agency (to candidate's document slot)
  const handleDocumentUpload = async (event, documentTypeId, documentTypeName) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      await confirm({
        title: 'File Size Error',
        message: 'File exceeds the 10MB limit. Please select a smaller file.',
        confirmText: 'Okay',
        type: 'danger'
      })
      event.target.value = ''
      return
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      await confirm({
        title: 'Invalid File Type',
        message: 'Please upload a PDF, JPEG, or PNG file.',
        confirmText: 'Okay',
        type: 'danger'
      })
      event.target.value = ''
      return
    }

    const confirmed = await confirm({
      title: 'Upload Document',
      message: `Upload "${file.name}" as ${documentTypeName}?`,
      confirmText: 'Yes, Upload',
      cancelText: 'Cancel',
      type: 'info'
    })

    if (!confirmed) {
      event.target.value = ''
      return
    }

    setIsUploading(true)
    try {
      const candidateId = candidateData.id
      const agencyLicense = agencyData?.license_number
      
      if (!agencyLicense || !jobId) {
        throw new Error('Agency license or job ID not available')
      }

      console.log('📤 Uploading document:', { candidateId, agencyLicense, jobId, documentTypeId, fileName: file.name })
      
      if (!documentTypeId) {
        throw new Error('Document type ID is missing')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type_id', documentTypeId)
      formData.append('name', file.name)
      formData.append('notes', 'Uploaded by agency')

      await DocumentDataSource.uploadAgencyCandidateDocument(
        agencyLicense,
        jobId,
        candidateId,
        formData
      )

      // Reload documents
      const docs = await DocumentDataSource.getAgencyCandidateDocuments(agencyLicense, jobId, candidateId)
      setApiDocuments(docs)

      await confirm({
        title: 'Upload Successful',
        message: `${documentTypeName} uploaded successfully!`,
        confirmText: 'Great!',
        type: 'success'
      })
    } catch (error) {
      console.error('Failed to upload document:', error)
      await confirm({
        title: 'Upload Error',
        message: error.response?.data?.message || error.message || 'Failed to upload document. Please try again.',
        confirmText: 'Okay',
        type: 'danger'
      })
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  // Handle document verification (approve/reject)
  const handleDocumentVerify = async (documentId, status, documentName) => {
    let rejectionReason = null
    
    if (status === 'rejected') {
      // Prompt for rejection reason
      const reason = window.prompt('Please provide a reason for rejection:')
      if (!reason) {
        return // User cancelled
      }
      rejectionReason = reason
    }

    const confirmed = await confirm({
      title: status === 'approved' ? 'Approve Document' : 'Reject Document',
      message: status === 'approved' 
        ? `Are you sure you want to approve "${documentName}"?`
        : `Are you sure you want to reject "${documentName}"?\n\nReason: ${rejectionReason}`,
      confirmText: status === 'approved' ? 'Yes, Approve' : 'Yes, Reject',
      cancelText: 'Cancel',
      type: status === 'approved' ? 'info' : 'danger'
    })

    if (!confirmed) return

    try {
      const candidateId = candidateData.id
      const agencyLicense = agencyData?.license_number

      if (!agencyLicense || !jobId) {
        throw new Error('Agency license or job ID not available')
      }

      await DocumentDataSource.verifyAgencyCandidateDocument(
        agencyLicense,
        jobId,
        candidateId,
        documentId,
        { status, rejection_reason: rejectionReason }
      )

      // Reload documents
      const docs = await DocumentDataSource.getAgencyCandidateDocuments(agencyLicense, jobId, candidateId)
      setApiDocuments(docs)

      await confirm({
        title: 'Success',
        message: `Document ${status} successfully!`,
        confirmText: 'Okay',
        type: 'success'
      })
    } catch (error) {
      console.error('Failed to verify document:', error)
      await confirm({
        title: 'Error',
        message: error.response?.data?.message || error.message || 'Failed to update document status.',
        confirmText: 'Okay',
        type: 'danger'
      })
    }
  }

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
        await confirm({
          title: 'Document Preview',
          message: `Document: ${doc.name}\nSize: ${(doc.size / 1024 / 1024).toFixed(2)} MB\nType: ${doc.type}\nUploaded: ${format(new Date(doc.uploaded_at), 'MMM dd, yyyy HH:mm')}`,
          confirmText: 'Close',
          type: 'info'
        })
      }
    } catch (error) {
      console.error('Failed to view document:', error)
      await confirm({
        title: 'View Error',
        message: 'Failed to open document for viewing. Please try again.',
        confirmText: 'Okay',
        type: 'danger'
      })
    }
  }

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
        
        // Show success message
        await confirm({
          title: 'Download Started',
          message: `Download of "${doc.name}" has started.`,
          confirmText: 'Great!',
          type: 'success'
        })
      } else {
        await confirm({
          title: 'Download Error',
          message: 'Document data not available for download.',
          confirmText: 'Okay',
          type: 'danger'
        })
      }
    } catch (error) {
      console.error('Failed to download document:', error)
      await confirm({
        title: 'Download Error',
        message: 'Failed to download document. Please try again.',
        confirmText: 'Okay',
        type: 'danger'
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-xl" style={{ width: '60vw' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('header.title')}</h2>
              {isInterviewContext && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('header.interviewManagement')}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Profile Section */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-600 dark:text-gray-300">
                    {candidateData.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{candidateData.name}</h3>
                  
                  {/* Current Stage - Always show */}
                  {currentStage && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="chip chip-blue">
                        {currentStage.label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('profile.currentStage')}</span>
                    </div>
                  )}
                  
                  {/* Job Title - Always show */}
                  {candidateData.job_title && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <Briefcase className="w-4 h-4 mr-2" />
                      <span className="font-medium">{t('profile.appliedFor')}</span>
                      <span className="ml-1">{candidateData.job_title}</span>
                    </div>
                  )}
                  
                  {/* Application Date - Always show */}
                  {candidateData.application?.created_at && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">{t('profile.applied')}</span>
                      <span className="ml-1">
                        {format(new Date(candidateData.application.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interview Information */}
            {(candidate.interviewed_at || candidate.interview_remarks) && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  {t('interview.title')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {candidate.interviewed_at && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                      <div className="flex items-center text-sm mb-2">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('interview.dateTime')}</span>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {format(new Date(candidate.interviewed_at), 'EEEE, MMM dd, yyyy')}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {format(new Date(candidate.interviewed_at), 'HH:mm')}
                      </p>
                    </div>
                  )}
                  
                  {candidate.application?.interview_type && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                      <div className="flex items-center text-sm mb-2">
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{t('interview.type')}</span>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {candidate.application.interview_type}
                      </p>
                    </div>
                  )}
                </div>
                
                {candidate.interview_remarks && (
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                      {t('interview.remarks')}
                    </h5>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {candidate.interview_remarks}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            
            {/* Contact Information */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                {t('contact.title')}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('contact.phone')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{candidateData.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('contact.email')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{candidateData.email}</div>
                  </div>
                </div>
                
                {candidateData.passport_number && (
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('contact.passport')}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{candidateData.passport_number}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('contact.address')}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{candidateData.address}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                {t('professional.title')}
              </h4>
              
              <div className="space-y-4">
                {/* Experience */}
                {candidateData.experience && Array.isArray(candidateData.experience) && candidateData.experience.length > 0 ? (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('professional.experience')}</h5>
                    <div className="space-y-2">
                      {candidateData.experience.map((exp, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{exp.title} at {exp.employer}</div>
                          <div className="text-xs text-gray-500">{exp.months} {t('professional.months')}</div>
                          {exp.description && <div className="mt-1">{exp.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : candidateData.experience ? (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('professional.experience')}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{candidateData.experience}</p>
                  </div>
                ) : null}
                
                {/* Education */}
                {candidateData.education && Array.isArray(candidateData.education) && candidateData.education.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      {t('professional.education')}
                    </h5>
                    <div className="space-y-2">
                      {candidateData.education.map((edu, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium text-gray-900 dark:text-gray-100">{edu.degree}</div>
                          {edu.institution && <div className="text-xs text-gray-500">{edu.institution}</div>}
                          {edu.year_completed && <div className="text-xs text-gray-500">{t('professional.completed')} {edu.year_completed}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Skills */}
                {candidateData.skills && candidateData.skills.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('professional.skills')}</h5>
                    <div className="flex flex-wrap gap-2">
                      {candidateData.skills.map((skill, index) => (
                        <span key={index} className="chip chip-blue text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interview Details Section - Show when interview data exists */}
            {candidateData.interview && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  {t('interview.title')}
                </h4>
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('interview.dateTime')}</div>
                      <div className="text-base text-gray-900 dark:text-gray-100 font-medium">
                        {candidateData.interview.scheduled_at 
                          ? format(new Date(candidateData.interview.scheduled_at), 'MMM dd, yyyy')
                          : t('interview.notScheduled')}
                      </div>
                      {candidateData.interview.time && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime12Hour(candidateData.interview.time)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('interview.duration')}</div>
                      <div className="text-base text-gray-900 dark:text-gray-100">{candidateData.interview.duration || 60} {t('interview.minutes')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('interview.location')}</div>
                      <div className="text-base text-gray-900 dark:text-gray-100">{candidateData.interview.location || t('interview.notSpecified')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('interview.interviewer')}</div>
                      <div className="text-base text-gray-900 dark:text-gray-100">{candidateData.interview.interviewer || t('interview.notAssigned')}</div>
                    </div>
                  </div>
                  
                  {/* Required Documents */}
                  {candidateData.interview.required_documents && candidateData.interview.required_documents.length > 0 && (
                    <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                        <Paperclip className="w-4 h-4 mr-2 text-purple-600" />
                        {t('interview.requiredDocuments')}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {candidateData.interview.required_documents.map((docType, index) => {
                          // Map document type IDs to readable names
                          const docNames = {
                            'cv': 'CV/Resume',
                            'citizenship': 'Citizenship',
                            'education': 'Education Certificate',
                            'photo': 'PP Photo',
                            'hardcopy': 'Hardcopy Requirements',
                            'passport': 'Passport',
                            'medical': 'Medical Certificate',
                            'police': 'Police Clearance'
                          }
                          return (
                            <span 
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-600"
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              {docNames[docType] || docType}
                            </span>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {t('interview.bringDocuments')}
                      </p>
                    </div>
                  )}
                  
                  {/* Interview Notes */}
                  {candidateData.interview.notes && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-600">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-yellow-600" />
                        {t('interview.notes')}
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{candidateData.interview.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Application Notes Section */}
            {candidateData.application?.id ? (
              <>
                {/* Debug Info - Remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-4 mx-6 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="text-xs font-mono text-yellow-800 dark:text-yellow-200">
                      <div className="font-semibold mb-1">Debug Info:</div>
                      <div>Application ID: {candidateData.application.id}</div>
                      <div>Candidate ID: {candidateData.id}</div>
                      <div>Current Stage: {candidateData.application.stage}</div>
                    </div>
                  </div>
                )}
                <ApplicationNotes applicationId={candidateData.application.id} />
              </>
            ) : (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="text-center py-4 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm">{t('notes.noApplicationId')}</p>
                </div>
              </div>
            )}

            {/* Application History Section */}
            {candidate.application?.history_blob && candidate.application.history_blob.length > 0 && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <ApplicationHistory historyBlob={candidate.application.history_blob} />
              </div>
            )}

            {/* Documents Section - Read-Only for Admin */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Paperclip className="w-5 h-5 mr-2" />
                    {t('documents.title')}
                    {apiDocuments && (apiDocuments.slots || apiDocuments.data) && (
                      <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {(apiDocuments.slots || apiDocuments.data || []).filter(slot => slot.document).length} / {(apiDocuments.slots || apiDocuments.data || []).length}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('documents.viewAndDownload')}
                  </p>
                </div>
              </div>
              
              {/* Loading State */}
              {loadingDocuments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('documents.loading')}</p>
                </div>
              ) : documentError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 dark:text-red-400 mb-2">
                    <AlertCircle className="w-8 h-8 mx-auto" />
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">{documentError}</p>
                </div>
              ) : apiDocuments && (apiDocuments.slots || apiDocuments.data) ? (
                <div className="space-y-3">
                  {(apiDocuments.slots || apiDocuments.data || []).map((slot) => {
                    // Handle both old format (slots) and new format (data with document_type)
                    const docType = slot.document_type || { name: slot.document_type_name, is_required: slot.is_required, id: slot.document_type_id }
                    const doc = slot.document
                    const isUploaded = !!doc
                    // Get document type ID from slot or docType
                    const typeId = slot.document_type_id || docType?.id
                    
                    return (
                      <div 
                        key={typeId} 
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {docType.name}
                            </span>
                            {docType.is_required && (
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">{t('documents.required')}</span>
                            )}
                          </div>
                          
                          {isUploaded ? (
                            <div className="mt-2 space-y-1">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {doc.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {(doc.file_size / 1024).toFixed(2)} KB • 
                                {doc.file_type} •
                                Uploaded {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  doc.verification_status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  doc.verification_status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {doc.verification_status}
                                </span>
                                {/* Approve/Reject buttons for pending documents */}
                                {jobId && doc.verification_status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleDocumentVerify(doc.id, 'approved', doc.name)}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                                      title={t('documents.approve')}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {t('documents.approve')}
                                    </button>
                                    <button
                                      onClick={() => handleDocumentVerify(doc.id, 'rejected', doc.name)}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                                      title={t('documents.reject')}
                                    >
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      {t('documents.reject')}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 italic">
                              {t('documents.notUploaded')}
                            </div>
                          )}
                        </div>
                        
                        {/* Upload button for empty slots (agency can upload) */}
                        {!isUploaded && jobId && (
                          <label className={`ml-4 inline-flex items-center px-3 py-2 border border-blue-300 dark:border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className="w-4 h-4 mr-1" />
                            {isUploading ? t('documents.uploading') : t('documents.upload')}
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleDocumentUpload(e, typeId, docType.name)}
                              disabled={isUploading}
                            />
                          </label>
                        )}

                        {isUploaded && doc.document_url && (
                          <div className="ml-4 flex items-center space-x-2">
                            <a
                              href={doc.document_url.startsWith('http') ? doc.document_url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${doc.document_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={async () => {
                                const url = doc.document_url.startsWith('http') ? doc.document_url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/${doc.document_url}`
                                try {
                                  const response = await fetch(url)
                                  const blob = await response.blob()
                                  const blobUrl = window.URL.createObjectURL(blob)
                                  const link = document.createElement('a')
                                  link.href = blobUrl
                                  link.download = doc.name || 'document'
                                  document.body.appendChild(link)
                                  link.click()
                                  document.body.removeChild(link)
                                  window.URL.revokeObjectURL(blobUrl)
                                } catch (err) {
                                  console.error('Download failed:', err)
                                  window.open(url, '_blank')
                                }
                              }}
                              className="inline-flex items-center px-2 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('documents.noDocuments')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              {/* Left side: Status indicator */}
              {isUpdating && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  {t('actions.updating')}
                </div>
              )}
              
              {/* Center: Workflow Actions - stage-specific buttons (no dropdown) */}
              <div className="flex flex-wrap gap-3">
                  {/* Applied -> Shortlist */}
                  {currentApplication?.stage === 'applied' && (
                    <button
                      onClick={async () => {
                        console.log('🔘 Shortlist button clicked!')
                        await handleStatusUpdate('shortlisted')
                      }}
                      disabled={isUpdating}
                      className="text-xs px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                      title={t('actions.shortlist')}
                    >
                      {t('actions.shortlist')}
                    </button>
                  )}

                  {/* Shortlisted -> Schedule Interview */}
                  {currentApplication?.stage === 'shortlisted' && (
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Schedule Interview',
                          message: `Are you sure you want to schedule an interview for ${candidateData.name}?`,
                          confirmText: 'Yes, Schedule',
                          cancelText: 'Cancel',
                          type: 'info'
                        })
                        
                        if (confirmed) {
                          setIsReschedule(false)
                          setInitialInterviewData(null)
                          setShowInterviewDialog(true)
                        }
                      }}
                      disabled={isUpdating}
                      className="text-xs px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                      title={t('actions.scheduleInterview')}
                    >
                      {t('actions.scheduleInterview')}
                    </button>
                  )}

                  {/* Interview Scheduled -> Pass / Fail (+Reschedule when elapsed) */}
                  {currentApplication?.stage === 'interview-scheduled' && (
                    <>
                      <button
                        onClick={async () => {
                          // Show confirmation dialog first
                          const confirmed = await confirm({
                            title: t('dialogs.markPassed.title'),
                            message: t('dialogs.markPassed.message', { name: candidateData.name }),
                            confirmText: t('dialogs.markPassed.confirm'),
                            cancelText: t('actions.cancel'),
                            type: 'warning'
                          })
                          
                          if (!confirmed) return
                          
                          try {
                            setIsUpdating(true)
                            const applicationId = candidateData.application?.id
                            if (!applicationId) {
                              throw new Error('Application ID not found')
                            }
                            
                            // Call the API directly like ScheduledInterviews does
                            await InterviewDataSource.completeInterview(
                              applicationId,
                              'passed',
                              'Interview passed'
                            )
                            
                            // Show success message
                            await confirm({
                              title: 'Success',
                              message: 'Interview marked as passed!',
                              confirmText: 'OK',
                              type: 'success'
                            })
                            
                            // Close and trigger parent refresh
                            onClose()
                          } catch (error) {
                            console.error('Failed to mark as passed:', error)
                            await confirm({
                              title: 'Error',
                              message: `Failed to mark interview as passed: ${error.message}`,
                              confirmText: 'OK',
                              type: 'danger'
                            })
                          } finally {
                            setIsUpdating(false)
                          }
                        }}
                        disabled={isUpdating}
                        className="text-xs px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 flex items-center gap-1"
                        title="Mark interview as passed"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            {t('actions.processing')}
                          </>
                        ) : (
                          t('actions.pass')
                        )}
                      </button>

                      <button
                        onClick={async () => {
                          // Show confirmation dialog first
                          const confirmed = await confirm({
                            title: t('dialogs.markFailed.title'),
                            message: t('dialogs.markFailed.message', { name: candidateData.name }),
                            confirmText: t('dialogs.markFailed.confirm'),
                            cancelText: t('actions.cancel'),
                            type: 'danger'
                          })
                          
                          if (!confirmed) return
                          
                          try {
                            setIsUpdating(true)
                            const applicationId = candidateData.application?.id
                            if (!applicationId) {
                              throw new Error('Application ID not found')
                            }
                            
                            // Call the API directly like ScheduledInterviews does
                            await InterviewDataSource.completeInterview(
                              applicationId,
                              'failed',
                              'Interview failed'
                            )
                            
                            // Show success message
                            await confirm({
                              title: 'Success',
                              message: 'Interview marked as failed.',
                              confirmText: 'OK',
                              type: 'success'
                            })
                            
                            // Close and trigger parent refresh
                            onClose()
                          } catch (error) {
                            console.error('Failed to mark as failed:', error)
                            await confirm({
                              title: 'Error',
                              message: `Failed to mark interview as failed: ${error.message}`,
                              confirmText: 'OK',
                              type: 'danger'
                            })
                          } finally {
                            setIsUpdating(false)
                          }
                        }}
                        disabled={isUpdating}
                        className="text-xs px-3 py-2 rounded bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 flex items-center gap-1"
                        title="Mark interview as failed"
                      >
                        {isUpdating ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            {t('actions.processing')}
                          </>
                        ) : (
                          t('actions.fail')
                        )}
                      </button>

                      {(() => {
                        const scheduledAtStr = currentApplication?.interview_scheduled_at || candidateData?.interview?.scheduled_at
                        if (!scheduledAtStr) {
                          return (
                            <button
                              onClick={async () => {
                                const confirmed = await confirm({
                                  title: 'Reschedule Interview',
                                  message: `Are you sure you want to reschedule the interview for ${candidateData.name}?`,
                                  confirmText: 'Yes, Reschedule',
                                  cancelText: 'Cancel',
                                  type: 'info'
                                })
                                
                                if (confirmed) {
                                  setIsReschedule(true)
                                  setInitialInterviewData({
                                    date: candidateData.interview?.interview_date_ad || '',
                                    time: candidateData.interview?.interview_time?.substring(0, 5) || '',
                                    location: candidateData.interview?.location || 'Office',
                                    interviewer: candidateData.interview?.contact_person || '',
                                    duration: candidateData.interview?.duration_minutes || 60,
                                    requirements: candidateData.interview?.required_documents || [],
                                    notes: ''
                                  })
                                  setShowInterviewDialog(true)
                                }
                              }}
                              className="text-xs px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              title={t('actions.reschedule')}
                            >
                              {t('actions.reschedule')}
                            </button>
                          )
                        }
                        try {
                          const scheduledAt = new Date(scheduledAtStr)
                          const durationMin = 60
                          const endTime = new Date(scheduledAt.getTime() + durationMin * 60000)
                          const now = new Date()
                          if (now > endTime) {
                            return (
                              <button
                                onClick={async () => {
                                  const confirmed = await confirm({
                                    title: 'Reschedule Interview',
                                    message: `The interview time has elapsed. Would you like to reschedule for ${candidateData.name}?`,
                                    confirmText: 'Yes, Reschedule',
                                    cancelText: 'Cancel',
                                    type: 'warning'
                                  })
                                  
                                  if (confirmed) {
                                    setIsReschedule(true)
                                    setInitialInterviewData({
                                      date: candidateData.interview?.interview_date_ad || '',
                                      time: candidateData.interview?.interview_time?.substring(0, 5) || '',
                                      location: candidateData.interview?.location || 'Office',
                                      interviewer: candidateData.interview?.contact_person || '',
                                      duration: candidateData.interview?.duration_minutes || 60,
                                      requirements: candidateData.interview?.required_documents || [],
                                      notes: ''
                                    })
                                    setShowInterviewDialog(true)
                                  }
                                }}
                                className="text-xs px-3 py-2 rounded border border-amber-400 text-amber-700 hover:bg-amber-50"
                                title={t('actions.reschedule')}
                              >
                                {t('actions.reschedule')}
                              </button>
                            )
                          }
                        } catch (_) {}
                        return null
                      })()}
                    </>
                  )}
                </div>
              
              {/* Right side: Close button */}
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                {t('actions.close')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Action Modals */}
      {interviewActionType === 'reject' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('dialogs.rejectCandidate.title')}</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('dialogs.rejectCandidate.placeholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4"
              rows={4}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setInterviewActionType('')
                  setRejectionReason('')
                }}
                className="btn-secondary"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={() => {
                  setIsProcessingInterview(true)
                  onReject(candidateData.id, rejectionReason).finally(() => {
                    setIsProcessingInterview(false)
                    setInterviewActionType('')
                    setRejectionReason('')
                  })
                }}
                disabled={!rejectionReason.trim() || isProcessingInterview}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {t('dialogs.rejectCandidate.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Schedule Dialog */}
      <InterviewScheduleDialog
        isOpen={showInterviewDialog}
        onClose={() => {
          setShowInterviewDialog(false)
          setIsReschedule(false)
          setInitialInterviewData(null)
        }}
        onSubmit={async (interviewDetails) => {
          try {
            const applicationId = candidateData.application?.id
            
            if (!applicationId) {
              throw new Error('Missing application ID')
            }
            
            if (isReschedule) {
              // Reschedule existing interview
              const interviewId = candidateData.interview?.id
              if (!interviewId) {
                throw new Error('Missing interview ID')
              }
              
              await InterviewDataSource.rescheduleInterview(
                applicationId,
                interviewId,
                interviewDetails
              )
              
              await confirm({
                title: 'Success',
                message: 'Interview rescheduled successfully!',
                confirmText: 'OK',
                type: 'success'
              })
            } else {
              // Schedule new interview
              await InterviewDataSource.scheduleInterview(
                applicationId,
                interviewDetails
              )
              
              await confirm({
                title: 'Success',
                message: 'Interview scheduled successfully!',
                confirmText: 'OK',
                type: 'success'
              })
            }
            
            // Close the sidebar to trigger parent refresh
            onClose()
          } catch (error) {
            console.error('Failed to schedule/reschedule interview:', error)
            throw error // Let the dialog handle the error display
          }
        }}
        candidateName={candidateData.name}
        initialData={initialInterviewData}
        isReschedule={isReschedule}
      />
    </div>
  )
}

export default CandidateSummaryS2