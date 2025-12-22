import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, User, FileText, AlertCircle } from 'lucide-react'
import { getMembersList } from '../services/memberService'
import { useLanguage } from '../hooks/useLanguage'

/**
 * Interview Schedule Dialog
 * 
 * Reusable dialog for scheduling interviews with proper fields:
 * - Date & Time
 * - Location
 * - Interviewer (from team members)
 * - Duration
 * - Required Documents
 * - Notes
 */
const InterviewScheduleDialog = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  candidateName,
  initialData = null,
  isReschedule = false
}) => {
  const { tPageSync } = useLanguage({ pageName: 'workflow', autoLoad: true })
  const [formData, setFormData] = useState({
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow by default
    time: '10:00',
    location: 'Office',
    interviewer: '',
    interviewerName: '',
    duration: 60,
    requirements: ['cv', 'citizenship', 'education', 'photo', 'hardcopy'], // Default selected
    notes: ''
  })
  
  const [teamMembers, setTeamMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Document types that can be required (matching JobDetails)
  const documentTypes = [
    { id: 'cv', label: tPageSync('interviewSchedule.documentTypes.cv') },
    { id: 'citizenship', label: tPageSync('interviewSchedule.documentTypes.citizenship') },
    { id: 'education', label: tPageSync('interviewSchedule.documentTypes.education') },
    { id: 'photo', label: tPageSync('interviewSchedule.documentTypes.photo') },
    { id: 'hardcopy', label: tPageSync('interviewSchedule.documentTypes.hardcopy') },
    { id: 'passport', label: tPageSync('interviewSchedule.documentTypes.passport') },
    { id: 'experience_letters', label: tPageSync('interviewSchedule.documentTypes.experience_letters') }
  ]

  // Load team members on mount
  useEffect(() => {
    if (isOpen) {
      loadTeamMembers()
    }
  }, [isOpen])

  // Initialize form with initial data if provided (for reschedule)
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || '',
        time: initialData.time || '10:00',
        location: initialData.location || 'Office',
        interviewer: initialData.interviewer || '',
        interviewerName: initialData.interviewerName || '',
        duration: initialData.duration || 60,
        requirements: initialData.requirements || [],
        notes: initialData.notes || ''
      })
    }
  }, [initialData])

  const loadTeamMembers = async () => {
    setLoadingMembers(true)
    try {
      const result = await getMembersList()
      if (result.success) {
        setTeamMembers(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load team members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.date) {
      newErrors.date = tPageSync('interviewSchedule.dateRequired')
    } else {
      // Validate date is not in the past
      const selectedDate = new Date(`${formData.date}T${formData.time}`)
      const now = new Date()
      if (selectedDate < now) {
        newErrors.date = tPageSync('interviewSchedule.dateFuture')
      }
    }

    if (!formData.time) {
      newErrors.time = tPageSync('interviewSchedule.timeRequired')
    }

    if (!formData.location || formData.location.trim() === '') {
      newErrors.location = tPageSync('interviewSchedule.locationRequired')
    }

    if (!formData.interviewer && !formData.interviewerName) {
      newErrors.interviewer = tPageSync('interviewSchedule.interviewerRequired')
    }

    if (formData.duration < 15 || formData.duration > 480) {
      newErrors.duration = tPageSync('interviewSchedule.durationInvalid')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Get interviewer name if ID is selected
      let interviewerName = formData.interviewerName
      if (formData.interviewer && !interviewerName) {
        const selectedMember = teamMembers.find(m => m.id === formData.interviewer)
        interviewerName = selectedMember?.full_name || selectedMember?.name || ''
      }

      await onSubmit({
        ...formData,
        interviewer: interviewerName || formData.interviewer // Use name for backend
      })
      
      // Reset form and close
      resetForm()
      onClose()
    } catch (error) {
      console.error('Failed to submit interview schedule:', error)
      setErrors({ submit: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      date: '',
      time: '10:00',
      location: 'Office',
      interviewer: '',
      interviewerName: '',
      duration: 60,
      requirements: [],
      notes: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleRequirement = (docId) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.includes(docId)
        ? prev.requirements.filter(id => id !== docId)
        : [...prev.requirements, docId]
    }))
  }

  const handleInterviewerChange = (e) => {
    const memberId = e.target.value
    const selectedMember = teamMembers.find(m => m.id === memberId)
    
    setFormData(prev => ({
      ...prev,
      interviewer: memberId,
      interviewerName: selectedMember?.full_name || selectedMember?.name || ''
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {isReschedule ? tPageSync('interviewSchedule.rescheduleTitle') : tPageSync('interviewSchedule.scheduleTitle')}
              </h2>
              {candidateName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {tPageSync('interviewSchedule.candidateLabel')} {candidateName}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Date & Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {tPageSync('interviewSchedule.dateLabel')} *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {tPageSync('interviewSchedule.timeLabel')} *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {formData.time && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400 font-medium">
                    {(() => {
                      const [hours, minutes] = formData.time.split(':')
                      const hour = parseInt(hours)
                      const ampm = hour >= 12 ? 'PM' : 'AM'
                      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                      return `${displayHour}:${minutes} ${ampm}`
                    })()}
                  </p>
                )}
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.time}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {tPageSync('interviewSchedule.locationLabel')} *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={tPageSync('interviewSchedule.locationPlaceholder')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                  errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location}</p>
              )}
            </div>

            {/* Interviewer & Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Interviewer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  {tPageSync('interviewSchedule.interviewerLabel')} *
                </label>
                {loadingMembers ? (
                  <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    {tPageSync('interviewSchedule.loadingMembers')}
                  </div>
                ) : teamMembers.length > 0 ? (
                  <select
                    value={formData.interviewer}
                    onChange={handleInterviewerChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                      errors.interviewer ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  >
                    <option value="">{tPageSync('interviewSchedule.interviewerLabel')}</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || member.name} - {member.role}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.interviewerName}
                    onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })}
                    placeholder={tPageSync('interviewSchedule.interviewerPlaceholder')}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                      errors.interviewer ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                )}
                {errors.interviewer && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.interviewer}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {tPageSync('interviewSchedule.durationLabel')}
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  min="15"
                  max="480"
                  step="15"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.duration ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration}</p>
                )}
              </div>
            </div>

            {/* Required Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                {tPageSync('interviewSchedule.documentsLabel')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {documentTypes.map(doc => (
                  <label
                    key={doc.id}
                    className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.requirements.includes(doc.id)}
                      onChange={() => toggleRequirement(doc.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{doc.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {tPageSync('interviewSchedule.documentsSelected').replace('{{count}}', formData.requirements.length)}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tPageSync('interviewSchedule.notesLabel')}
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                placeholder={tPageSync('interviewSchedule.notesPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                {tPageSync('interviewSchedule.buttons.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (isReschedule ? tPageSync('interviewSchedule.buttons.rescheduling') : tPageSync('interviewSchedule.buttons.scheduling')) : (isReschedule ? tPageSync('interviewSchedule.buttons.reschedule') : tPageSync('interviewSchedule.buttons.schedule'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default InterviewScheduleDialog
