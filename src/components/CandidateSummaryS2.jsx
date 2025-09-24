import { useState } from 'react'
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
  Clock,
  MessageSquare,
  Paperclip,
  Eye,
  Plus,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { useConfirm } from './ConfirmProvider.jsx'

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
  jobId = null
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [showUploadSection, setShowUploadSection] = useState(false)
  const { confirm } = useConfirm()

  if (!isOpen || !candidate) return null

  // Define the 4 main workflow stages
  const mainWorkflowStages = [
    { id: 'applied', label: 'Applied' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'interview-scheduled', label: 'Interview Scheduled' },
    { id: 'interview-passed', label: 'Interview Passed' }
  ]

  const currentStage = mainWorkflowStages.find(s => s.id === candidate.application?.stage) || 
                     workflowStages.find(s => s.id === candidate.application?.stage)
  const rejectedStage = workflowStages.find(s => s.label === 'Rejected')
  // Check for rejected status from either the separate application prop or the candidate.application
  const currentApplication = application || candidate.application
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
    // Allow staying in the same stage
    if (currentStage === targetStage) return true
    
    // Allow progression to the immediate next stage
    const nextAllowed = getNextAllowedStage(currentStage)
    return targetStage === nextAllowed
  }

  const handleStatusUpdate = async (newStage) => {
    // If accessed from jobs page, don't allow status updates
    if (isFromJobsPage) {
      await confirm({
        title: 'Action Not Allowed',
        message: 'Status updates are not available from the job details page. Please use the main workflow page for status updates.',
        confirmText: 'Okay',
        type: 'info'
      })
      return
    }
    
    setIsUpdating(true)
    try {
      const currentStage = candidate.application?.stage
      
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
        // Use the application ID from the application prop or candidate.application
        const applicationId = application?.id || candidate.application?.id
        if (applicationId) {
          await onUpdateStatus(applicationId, newStage)
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Candidate Summary</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Post-Interview Pipeline Details</p>
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
                    {candidate.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{candidate.name}</h3>
                  
                  {/* Current Stage */}
                  {currentStage && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="chip chip-blue">
                        {currentStage.label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Current Stage</span>
                    </div>
                  )}
                  
                  {/* Job Title */}
                  {candidate.job_title && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <Briefcase className="w-4 h-4 mr-2" />
                      <span className="font-medium">Applied for:</span>
                      <span className="ml-1">{candidate.job_title}</span>
                    </div>
                  )}
                  
                  {/* Application Date */}
                  {candidate.application?.created_at && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">Applied:</span>
                      <span className="ml-1">
                        {format(new Date(candidate.application.created_at), 'MMM dd, yyyy')}
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
                  Interview Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {candidate.interviewed_at && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
                      <div className="flex items-center text-sm mb-2">
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Interview Date & Time</span>
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
                        <span className="font-medium text-gray-700 dark:text-gray-300">Interview Type</span>
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
                      Interview Remarks & Feedback
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
                Contact Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Phone</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.phone}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.email}</div>
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
                
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Address</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{candidate.address}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Professional Details
              </h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Experience</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.experience}</p>
                </div>
                
                {candidate.education && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                      <GraduationCap className="w-4 h-4 mr-1" />
                      Education
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{candidate.education}</p>
                  </div>
                )}
                
                {candidate.skills && candidate.skills.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <span key={index} className="chip chip-blue text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Section */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
                        Upload documents for: {currentStage?.label || 'General'}
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
                          <FileText className="w-4 h-4 mr-2 text-gray-600" />
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
                                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                      {doc.size && (
                                        <div className="flex items-center space-x-1">
                                          <span>📏</span>
                                          <span>{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                                        </div>
                                      )}
                                      {doc.uploaded_at && (
                                        <div className="flex items-center space-x-1">
                                          <span>📅</span>
                                          <span>{format(new Date(doc.uploaded_at), 'MMM dd, yyyy HH:mm')}</span>
                                        </div>
                                      )}
                                      {doc.uploaded_by && (
                                        <div className="flex items-center space-x-1">
                                          <span>👤</span>
                                          <span>{doc.uploaded_by}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors shadow-sm hover:shadow-md"
                                    title="View document"
                                    onClick={() => handleViewDocument(doc)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors shadow-sm hover:shadow-md"
                                    title="Download document"
                                    onClick={() => handleDownloadDocument(doc)}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button 
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shadow-sm hover:shadow-md"
                                    title="Remove document"
                                    onClick={() => handleRemoveDocument(globalIndex, stage)}
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
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-700 dark:to-blue-900/20 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Paperclip className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No documents yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Start building this candidate's document portfolio
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                      Documents will be automatically organized by workflow stage
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowUploadSection(true)}
                        className="btn-primary text-sm flex items-center space-x-2 mx-auto shadow-md hover:shadow-lg transition-shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Upload First Document</span>
                      </button>
                      <div className="flex items-center justify-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>📄</span>
                          <span>PDF</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>📝</span>
                          <span>DOC</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>🖼️</span>
                          <span>Images</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>📊</span>
                          <span>Excel</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              {isApplicationRejected ? (
                // Show disabled state when application is rejected
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Update:</span>
                  <div className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-600">
                    Application Rejected - No updates allowed
                  </div>
                </div>
              ) : (
                // Show simplified "Move to Next Stage" button for shortlisting
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Update Status:</span>
                  <select
                    value={candidate.application?.stage || ''}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={isUpdating}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors"
                  >
                    {mainWorkflowStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                {isUpdating && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Updating...
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidateSummaryS2