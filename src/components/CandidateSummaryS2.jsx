import React, { useState } from 'react'
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
  CheckCircle,
  AlertCircle,
  Eye
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
  workflowStages = [] 
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const { confirm } = useConfirm()

  if (!isOpen || !candidate) return null

  const currentStage = mainWorkflowStages.find(s => s.id === candidate.application?.stage) || 
                     workflowStages.find(s => s.id === candidate.application?.stage)
  const rejectedStage = workflowStages.find(s => s.label === 'Rejected')
  // Check for rejected status from either the separate application prop or the candidate.application
  const currentApplication = application || candidate.application
  const isApplicationRejected = currentApplication?.stage === rejectedStage?.id || currentApplication?.stage === 'rejected'

  // Define the 4 main workflow stages
  const mainWorkflowStages = [
    { id: 'applied', label: 'Applied' },
    { id: 'shortlisted', label: 'Shortlisted' },
    { id: 'interview-scheduled', label: 'Interview Scheduled' },
    { id: 'interview-passed', label: 'Interview Passed' }
  ]

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
    // Allow staying in the same stage or moving to the next stage
    if (currentStage === targetStage) return true
    
    // Allow progression to the immediate next stage
    const nextAllowed = getNextAllowedStage(currentStage)
    return targetStage === nextAllowed
  }

  const handleStatusUpdate = async (newStage) => {
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
    setSelectedFiles(files)
    
    if (files.length > 0) {
      // Show confirmation for document upload
      const confirmed = await confirm({
        title: 'Confirm Document Upload',
        message: `Are you sure you want to upload ${files.length} document${files.length !== 1 ? 's' : ''} for this candidate?`,
        confirmText: 'Yes, Upload',
        cancelText: 'Cancel',
        type: 'info'
      })

      if (!confirmed) {
        setSelectedFiles([])
        event.target.value = '' // Reset file input
        return
      }

      setIsUploading(true)
      try {
        for (const file of files) {
          await onAttachDocument(candidate.id, {
            name: file.name,
            size: file.size,
            type: file.type,
            stage: candidate.application?.stage,
            uploaded_at: new Date().toISOString()
          })
        }
        setSelectedFiles([])
        event.target.value = '' // Reset file input
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
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Paperclip className="w-5 h-5 mr-2" />
                Documents & Attachments
              </h4>
              
              {/* Upload Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload documents for current stage: {currentStage?.label}
                  </label>
                </div>
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {isUploading ? 'Uploading documents...' : 'Click to upload documents'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Supports PDF, DOC, DOCX, JPG, PNG files
                    </p>
                  </div>
                </label>
              </div>
              
              {/* Documents List by Stage */}
              <div className="space-y-4">
                {candidate.documents && candidate.documents.length > 0 ? (
                  (() => {
                    // Group documents by stage
                    const documentsByStage = candidate.documents.reduce((acc, doc) => {
                      const stage = doc.stage || 'general'
                      if (!acc[stage]) acc[stage] = []
                      acc[stage].push(doc)
                      return acc
                    }, {})
                    
                    return Object.entries(documentsByStage).map(([stage, docs]) => (
                      <div key={stage} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-600" />
                          {stage === 'general' ? 'General Documents' : `${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage`}
                          <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                            {docs.length} file{docs.length !== 1 ? 's' : ''}
                          </span>
                        </h5>
                        
                        <div className="space-y-2">
                          {docs.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-primary-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.name}</p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                    {doc.size && (
                                      <span>{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                                    )}
                                    {doc.uploaded_at && (
                                      <>
                                        <span>•</span>
                                        <span>{format(new Date(doc.uploaded_at), 'MMM dd, yyyy HH:mm')}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button 
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                  title="View document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  className="text-primary-600 hover:text-primary-800 p-1 rounded"
                                  title="Download document"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button 
                                  className="text-gray-400 hover:text-red-600 p-1 rounded"
                                  title="Remove document"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No documents uploaded yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Upload documents to track candidate progress through each stage
                    </p>
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