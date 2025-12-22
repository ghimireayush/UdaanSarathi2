import { useState, useEffect, useContext } from 'react'
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
import { WorkflowStagesContext } from '../contexts/WorkflowStagesContext.jsx'
import ApplicationHistory from './ApplicationHistory.jsx'
import ApplicationNotes from './ApplicationNotes.jsx'
import DocumentDataSource from '../api/datasources/DocumentDataSource.js'
import InterviewDataSource from '../api/datasources/InterviewDataSource.js'
import applicationNotesService from '../services/applicationNotesService.js'
import httpClient from '../api/config/httpClient.js'
import InterviewScheduleDialog from './InterviewScheduleDialog.jsx'
import { formatTime12Hour } from '../utils/helpers.js'
import { useLanguage } from '../hooks/useLanguage'
import dialogService from '../services/dialogService.js'

const CandidateSummaryS2 = ({ 
  applicationId,
  candidateId,
  isOpen, 
  onClose
}) => {
  // Data fetching state
  const [candidate, setCandidate] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadSection, setShowUploadSection] = useState(false)
  
  // Get contexts
  const workflowStages = useContext(WorkflowStagesContext)
  
  // Load data on mount
  useEffect(() => {
    if (!isOpen || !applicationId || !candidateId) return
    
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await httpClient.get(`/applications/${applicationId}/details`)
        setCandidate(data)
      } catch (err) {
        console.error('Failed to load S2 data:', err)
        setError(err.message || 'Failed to load candidate data')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [isOpen, applicationId, candidateId])
  
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
      // Get candidate ID - this is all we need
      const cId = candidate?.candidate?.id || candidateId
      if (!cId) return
      
      try {
        setLoadingDocuments(true)
        setDocumentError(null)
        // Get all document slots (uploaded + empty) for the candidate
        const response = await DocumentDataSource.getCandidateDocuments(cId)
        setApiDocuments(response)
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
  }, [candidate, isOpen, candidateId])

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
        isOpen
      })
    }
  }, [candidate, isOpen])

  // EARLY RETURN MUST BE AFTER ALL HOOKS
  if (!isOpen) return null
  
  if (!applicationId || !candidateId) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        <div className="absolute right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-xl" style={{ width: '60vw' }}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Error</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Missing required IDs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        <div className="absolute right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-xl" style={{ width: '60vw' }}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Loading...</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
        <div className="absolute right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-xl" style={{ width: '60vw' }}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Error</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{error || 'Failed to load data'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Helper function to safely access candidate data (handles both old and new structure)
  const getCandidateData = () => {
    // Stage mapping from backend format (with underscores) to frontend format (with hyphens)
    const stageMap = {
      'applied': 'applied',
      'shortlisted': 'shortlisted',
      'interview_scheduled': 'interview-scheduled',
      'interview_rescheduled': 'interview-scheduled',
      'interview_passed': 'interview-passed',
      'interview_failed': 'interview-failed'
    }

    // API response structure: /applications/:id/details
    // Returns: { candidate: {...}, application: {...}, job: {...}, employer: {...}, documents: [...], job_profile: {...} }
    if (candidate && candidate.candidate && candidate.application) {
      const addr = candidate.candidate.address
      const addressStr = typeof addr === 'string' ? addr : (addr?.name || 'N/A')
      
      // Map the stage from backend format to frontend format
      const backendStage = candidate.application.stage
      const mappedStage = stageMap[backendStage] || backendStage
      
      return {
        id: candidate.candidate.id,
        name: candidate.candidate.name,
        phone: candidate.candidate.phone,
        email: candidate.candidate.email,
        address: addressStr,
        passport_number: candidate.candidate.passport_number,
        profile_image: candidate.candidate.profile_image,
        
        // Job details from API response
        job_title: candidate.job?.title,
        job_company: candidate.job?.company,
        job_location: candidate.job?.location,
        job_salary: candidate.job?.salary,
        job_description: candidate.job?.description,
        
        // Employer details
        employer_name: candidate.employer?.name,
        employer_country: candidate.employer?.country,
        agency_name: candidate.employer?.agency,
        agency_license: candidate.employer?.license,
        agency_phone: candidate.employer?.agencyPhone,
        agency_email: candidate.employer?.agencyEmail,
        
        // Application data
        application: {
          id: candidate.application.id,
          stage: mappedStage,
          created_at: candidate.application.created_at,
          updated_at: candidate.application.updated_at,
          history_blob: candidate.application.history_blob || []
        },
        
        // Job Profile - Skills, Education, Experience, Trainings
        job_profile: candidate.job_profile || {},
        skills: candidate.job_profile?.skills || [],
        education: candidate.job_profile?.education || [],
        experience: candidate.job_profile?.experience || [],
        trainings: candidate.job_profile?.trainings || [],
        
        // Documents
        documents: candidate.documents || []
      }
    }
    
    // Fallback for other structures
    return candidate || {}
  }
  
  const candidateData = getCandidateData()

  // Define the 4 main workflow stages
  const mainWorkflowStages = [
    { id: 'applied', label: t('stages.applied') },
    { id: 'shortlisted', label: t('stages.shortlisted') },
    { id: 'interview-scheduled', label: t('stages.interviewScheduled') },
    { id: 'interview-passed', label: t('stages.interviewPassed') }
  ]

  const currentStage = mainWorkflowStages.find(s => s.id === candidate.application?.stage) || 
                     workflowStages.find(s => s.id === candidate.application?.stage)
  const rejectedStage = workflowStages.find(s => s.label === 'Rejected')
  // Use candidate.application as the source of truth (handles both old and new API structures)
  const currentApplication = candidate.application
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
    setIsUpdating(true)
    try {
      const currentStage = candidate.application?.stage
      
      if (currentStage === newStage) {
        setIsUpdating(false)
        return
      }
      
      if (!validateStageTransition(currentStage, newStage)) {
        const currentStageLabel = workflowStages.find(s => s.id === currentStage)?.label || currentStage
        const newStageLabel = workflowStages.find(s => s.id === newStage)?.label || newStage
        
        await confirm({
          title: 'Invalid Stage Transition',
          message: `Cannot move from "${currentStageLabel}" to "${newStageLabel}".`,
          confirmText: 'Okay',
          type: 'warning'
        })
        return
      }

      const currentStageLabel = workflowStages.find(s => s.id === currentStage)?.label || currentStage
      const newStageLabel = workflowStages.find(s => s.id === newStage)?.label || newStage
      
      const confirmed = await confirm({
        title: 'Confirm Stage Update',
        message: `Move from "${currentStageLabel}" to "${newStageLabel}"?`,
        confirmText: 'Yes, Update',
        cancelText: 'Cancel',
        type: 'warning'
      })

      if (confirmed) {
        let endpoint = ''
        let body = {}
        
        if (newStage === 'shortlisted') {
          endpoint = `/applications/${applicationId}/shortlist`
        } else if (newStage === 'interview-scheduled') {
          endpoint = `/applications/${applicationId}/schedule-interview`
          body = { interview_date_ad: new Date().toISOString().split('T')[0], interview_time: '10:00', duration_minutes: 60, location: 'TBD', contact_person: 'HR', notes: 'Scheduled' }
        } else if (newStage === 'interview-passed') {
          endpoint = `/applications/${applicationId}/complete-interview`
          body = { result: 'passed' }
        } else if (newStage === 'interview-failed') {
          endpoint = `/applications/${applicationId}/complete-interview`
          body = { result: 'failed' }
        }
        
        if (endpoint) {
          await httpClient.post(endpoint, body)
          const data = await httpClient.get(`/applications/${applicationId}/details`)
          setCandidate(data)
          
          await confirm({
            title: 'Success',
            message: `Moved to ${newStageLabel}`,
            confirmText: 'Okay',
            type: 'success'
          })
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      await confirm({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to update status.',
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
      const cId = candidate?.candidate?.id || candidateId
      
      if (!cId) {
        throw new Error('Candidate ID not available')
      }

      console.log('📤 Uploading document:', { candidateId: cId, documentTypeId, fileName: file.name })
      
      if (!documentTypeId) {
        throw new Error('Document type ID is missing')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type_id', documentTypeId)
      formData.append('name', file.name)
      formData.append('notes', 'Uploaded by agency')

      await DocumentDataSource.uploadAgencyCandidateDocument(
        agencyData?.license,
        candidate?.job_posting?.id,
        cId,
        formData
      )

      // Reload documents
      const response = await DocumentDataSource.getCandidateDocuments(cId)
      setApiDocuments(response)

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
      // Prompt for rejection reason using custom dialog
      rejectionReason = await dialogService.prompt(
        t('document.rejectTitle'),
        t('document.rejectMessage'),
        {
          placeholder: t('document.rejectPlaceholder'),
          confirmText: t('common.confirm'),
          cancelText: t('common.cancel')
        }
      )
      if (!rejectionReason) {
        return // User cancelled
      }
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
      const applicationId = candidate?.application?.id

      if (!applicationId) {
        throw new Error('Application ID not available')
      }

      await DocumentDataSource.verifyDocumentByApplication(
        applicationId,
        documentId,
        { status, rejection_reason: rejectionReason }
      )

      // Reload documents
      const docs = await DocumentDataSource.getCandidateDocumentsByApplication(applicationId)
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

            {/* Job & Employer Details */}
            {(candidateData.job_title || candidateData.employer_name) && (
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-amber-600" />
                  {t('jobEmployer.title')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Job Details */}
                  {candidateData.job_title && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-amber-200 dark:border-amber-600">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('jobEmployer.position')}</h5>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.jobTitle')}</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{candidateData.job_title}</div>
                        </div>
                        {candidateData.job_company && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.company')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">{candidateData.job_company}</div>
                          </div>
                        )}
                        {candidateData.job_location && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.location')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">{candidateData.job_location}</div>
                          </div>
                        )}
                        {candidateData.job_salary && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.salary')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium text-green-600 dark:text-green-400">{candidateData.job_salary}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Employer Details */}
                  {candidateData.employer_name && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-amber-200 dark:border-amber-600">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('jobEmployer.employer')}</h5>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.companyName')}</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{candidateData.employer_name}</div>
                        </div>
                        {candidateData.employer_country && (
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.country')}</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100">{candidateData.employer_country}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Agency Details */}
                {candidateData.agency_name && (
                  <div className="mt-4 bg-white dark:bg-gray-700 rounded-lg p-4 border border-amber-200 dark:border-amber-600">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{t('jobEmployer.recruitingAgency')}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.agencyName')}</div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{candidateData.agency_name}</div>
                      </div>
                      {candidateData.agency_license && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.license')}</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{candidateData.agency_license}</div>
                        </div>
                      )}
                      {candidateData.agency_phone && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.phone')}</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{candidateData.agency_phone}</div>
                        </div>
                      )}
                      {candidateData.agency_email && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('jobEmployer.email')}</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{candidateData.agency_email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Job Description */}
                {candidateData.job_description && (
                  <div className="mt-4 bg-white dark:bg-gray-700 rounded-lg p-4 border border-amber-200 dark:border-amber-600">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t('jobEmployer.jobDescription')}</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{candidateData.job_description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Professional Information */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                {t('professional.title')}
              </h4>
              
              <div className="space-y-4">
                {/* Experience */}
                {candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0 ? (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('professional.experience')}</h5>
                    <div className="space-y-2">
                      {candidate.experience.map((exp, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {exp.formatted || `${exp.title} at ${exp.employer}`}
                          </div>
                          {!exp.formatted && exp.months && (
                            <div className="text-xs text-gray-500">{exp.months} {t('professional.months')}</div>
                          )}
                          {exp.description && <div className="mt-1 text-xs">{exp.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : candidate.experience ? (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('professional.experience')}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.experience}</p>
                  </div>
                ) : null}
                
                {/* Education */}
                {candidate.education && Array.isArray(candidate.education) && candidate.education.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      {t('professional.education')}
                    </h5>
                    <div className="space-y-2">
                      {candidate.education.map((edu, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {edu.formatted || edu.degree}
                          </div>
                          {!edu.formatted && edu.institution && (
                            <div className="text-xs text-gray-500">{edu.institution}</div>
                          )}
                          {!edu.formatted && edu.year_completed && (
                            <div className="text-xs text-gray-500">{t('professional.completed')} {edu.year_completed}</div>
                          )}
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
                          {skill.formatted || skill.title || (typeof skill === 'string' ? skill : 'Skill')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trainings */}
                {candidateData.trainings && Array.isArray(candidateData.trainings) && candidateData.trainings.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('professional.trainings', 'Trainings')}</h5>
                    <div className="space-y-2">
                      {candidateData.trainings.map((training, index) => (
                        <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {training.formatted || `${training.title} - ${training.provider}`}
                          </div>
                          {!training.formatted && (
                            <>
                              {training.hours && (
                                <div className="text-xs text-gray-500">{training.hours} hours</div>
                              )}
                              {training.certificate && (
                                <div className="text-xs text-green-600 dark:text-green-400">✓ Certificate</div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interview Details Section - Show when interview data exists */}
            {candidate.interview && (
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
                        {candidate.interview.date || t('interview.notScheduled')}
                      </div>
                      {candidate.interview.time && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {candidate.interview.time}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('interview.mode')}</div>
                      <div className="text-base text-gray-900 dark:text-gray-100">{candidate.interview.mode || 'In-person'}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('interview.location')}</div>
                      <div className="text-base text-gray-900 dark:text-gray-100">{candidate.interview.location || t('interview.notSpecified')}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('interview.contactPerson')}</div>
                      <div className="text-base text-gray-900 dark:text-gray-100">{candidate.interview.contactPerson || t('interview.notAssigned')}</div>
                    </div>
                  </div>
                  
                  {/* Contact Details - Only show if phone or email are provided (not "Not provided") */}
                  {(candidate.interview.contactPhone && candidate.interview.contactPhone !== 'Not provided') || 
                   (candidate.interview.contactEmail && candidate.interview.contactEmail !== 'Not provided') ? (
                    <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-600">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('interview.contactDetails')}</div>
                      <div className="space-y-1 text-sm">
                        {candidate.interview.contactPhone && candidate.interview.contactPhone !== 'Not provided' && (
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4 mr-2 text-green-600" />
                            {candidate.interview.contactPhone}
                          </div>
                        )}
                        {candidate.interview.contactEmail && candidate.interview.contactEmail !== 'Not provided' && (
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <Mail className="w-4 h-4 mr-2 text-green-600" />
                            {candidate.interview.contactEmail}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Required Documents */}
                  {candidate.interview.documents && candidate.interview.documents.length > 0 && (
                    <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                        <Paperclip className="w-4 h-4 mr-2 text-purple-600" />
                        {t('interview.requiredDocuments')}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {candidate.interview.documents.map((docType, index) => {
                          // Map document type IDs to readable names
                          const docNames = {
                            'cv': 'CV/Resume',
                            'citizenship': 'Citizenship',
                            'education': 'Education Certificate',
                            'photo': 'PP Photo',
                            'hardcopy': 'Hardcopy Requirements',
                            'passport': 'Passport',
                            'medical': 'Medical Certificate',
                            'police': 'Police Clearance',
                            'experience_letters': 'Experience Letters'
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
                  {candidate.interview.notes && (
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-600">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-yellow-600" />
                        {t('interview.notes')}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{candidate.interview.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Application Notes Section */}
            {candidate.application?.id ? (
              <>
              
                <ApplicationNotes applicationId={candidate.application.id} />
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

            {/* Documents Section - Display from API Response */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <Paperclip className="w-5 h-5 mr-2" />
                    {t('documents.title')}
                    {candidateData.documents && candidateData.documents.length > 0 && (
                      <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                        {candidateData.documents.length}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t('documents.viewAndDownload')}
                  </p>
                </div>
              </div>
              
              {/* Documents List */}
              {apiDocuments?.data && apiDocuments.data.length > 0 ? (
                <div className="space-y-3">
                  {apiDocuments.data.map((slot, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {slot.document_type?.name || 'Document'}
                              {slot.document_type?.is_required && (
                                <span className="ml-1 text-red-600">*</span>
                              )}
                            </p>
                            {slot.document ? (
                              <>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{slot.document.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{slot.document.file_size}</p>
                                {slot.document.verification_status && (
                                  <div className={`text-xs font-medium mt-1 ${
                                    slot.document.verification_status === 'approved' 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : slot.document.verification_status === 'rejected'
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-yellow-600 dark:text-yellow-400'
                                  }`}>
                                    {slot.document.verification_status.charAt(0).toUpperCase() + slot.document.verification_status.slice(1)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400 dark:text-gray-500">Not uploaded</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {slot.document ? (
                          <>
                            <button
                              onClick={() => handleViewDocument(slot.document)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                              title="View document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(slot.document)}
                              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {slot.document.verification_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleDocumentVerify(slot.document.id, 'approved', slot.document.name)}
                                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                  title="Approve document"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDocumentVerify(slot.document.id, 'rejected', slot.document.name)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                  title="Reject document"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <label className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition cursor-pointer">
                            <Upload className="w-4 h-4" />
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleDocumentUpload(e, slot.document_type?.id, slot.document_type?.name)}
                              accept={slot.document_type?.allowed_mime_types?.join(',') || '.pdf,.jpg,.jpeg,.png'}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No document types available</p>
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
                  {candidateData.application?.stage === 'applied' && (
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
                  {candidateData.application?.stage === 'shortlisted' && (
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Schedule Interview',
                          message: `Are you sure you want to schedule an interview for ${candidate.name}?`,
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
                  {candidateData.application?.stage === 'interview-scheduled' && (
                    <>
                      <button
                        onClick={async () => {
                          // Show confirmation dialog first
                          const confirmed = await confirm({
                            title: t('dialogs.markPassed.title'),
                            message: t('dialogs.markPassed.message', { name: candidate.name }),
                            confirmText: t('dialogs.markPassed.confirm'),
                            cancelText: t('actions.cancel'),
                            type: 'warning'
                          })
                          
                          if (!confirmed) return
                          
                          try {
                            setIsUpdating(true)
                            const applicationId = candidate.application?.id
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
                            message: t('dialogs.markFailed.message', { name: candidate.name }),
                            confirmText: t('dialogs.markFailed.confirm'),
                            cancelText: t('actions.cancel'),
                            type: 'danger'
                          })
                          
                          if (!confirmed) return
                          
                          try {
                            setIsUpdating(true)
                            const applicationId = candidate.application?.id
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
                                  message: `Are you sure you want to reschedule the interview for ${candidate.name}?`,
                                  confirmText: 'Yes, Reschedule',
                                  cancelText: 'Cancel',
                                  type: 'info'
                                })
                                
                                if (confirmed) {
                                  setIsReschedule(true)
                                  setInitialInterviewData({
                                    date: candidate.interview?.interview_date_ad || '',
                                    time: candidate.interview?.interview_time?.substring(0, 5) || '',
                                    location: candidate.interview?.location || 'Office',
                                    interviewer: candidate.interview?.contact_person || '',
                                    duration: candidate.interview?.duration_minutes || 60,
                                    requirements: candidate.interview?.required_documents || [],
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
                                    message: `The interview time has elapsed. Would you like to reschedule for ${candidate.name}?`,
                                    confirmText: 'Yes, Reschedule',
                                    cancelText: 'Cancel',
                                    type: 'warning'
                                  })
                                  
                                  if (confirmed) {
                                    setIsReschedule(true)
                                    setInitialInterviewData({
                                      date: candidate.interview?.interview_date_ad || '',
                                      time: candidate.interview?.interview_time?.substring(0, 5) || '',
                                      location: candidate.interview?.location || 'Office',
                                      interviewer: candidate.interview?.contact_person || '',
                                      duration: candidate.interview?.duration_minutes || 60,
                                      requirements: candidate.interview?.required_documents || [],
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
                  onReject(candidate.id, rejectionReason).finally(() => {
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
            const applicationId = candidate.application?.id
            
            if (!applicationId) {
              throw new Error('Missing application ID')
            }
            
            if (isReschedule) {
              // Reschedule existing interview - use the application ID directly
              // The backend will find the interview_details record by application_id
              await InterviewDataSource.rescheduleInterview(
                applicationId,
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
        candidateName={candidate.name}
        initialData={initialInterviewData}
        isReschedule={isReschedule}
      />
    </div>
  )
}

export default CandidateSummaryS2