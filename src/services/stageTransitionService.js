/**
 * Stage Transition Service
 * 
 * SINGLE SOURCE OF TRUTH for all stage transition operations across the application.
 * 
 * This service consolidates ALL stage transition API calls from:
 * - WorkflowV2 page
 * - Workflow page (original)
 * - JobDetails page
 * - Applications page
 * - CandidateSummaryS2 component
 * - Any other component that needs to update application stages
 * 
 * Uses EXISTING working API endpoints:
 * - POST /applications/:id/shortlist
 * - POST /applications/:id/schedule-interview
 * - POST /applications/:id/reschedule-interview
 * - POST /applications/:id/complete-interview
 * - POST /applications/:id/withdraw
 * - POST /applications/:id/update-status (generic fallback)
 * 
 * NO NEW APIs are created - we reuse what already exists and works.
 */

import ApplicationDataSource from '../api/datasources/ApplicationDataSource.js'
import InterviewDataSource from '../api/datasources/InterviewDataSource.js'
import authService from './authService.js'
import dialogService from './dialogService.js'

// Stage transition rules - matching backend
const STAGE_TRANSITIONS = {
  'applied': 'shortlisted',
  'shortlisted': 'interview_scheduled',
  'interview_scheduled': 'interview_passed',
  'interview_passed': null // Final stage
}

class StageTransitionService {
  /**
   * Get the next allowed stage for a given current stage
   * @param {string} currentStage - Current stage
   * @returns {string|null} Next allowed stage or null if final stage
   */
  getNextAllowedStage(currentStage) {
    return STAGE_TRANSITIONS[currentStage] || null
  }

  /**
   * Validate if a stage transition is allowed
   * @param {string} currentStage - Current stage
   * @param {string} targetStage - Target stage
   * @returns {boolean} True if transition is valid
   */
  validateStageTransition(currentStage, targetStage) {
    // Allow pass/fail from interview_scheduled stage
    if (currentStage === 'interview_scheduled' && 
        (targetStage === 'interview_passed' || targetStage === 'interview_failed')) {
      return true
    }
    
    // Allow pass/fail from interview_rescheduled stage (same as scheduled)
    if (currentStage === 'interview_rescheduled' && 
        (targetStage === 'interview_passed' || targetStage === 'interview_failed')) {
      return true
    }
    
    // Strict progression: allow only immediate next stage
    const nextAllowed = this.getNextAllowedStage(currentStage)
    return targetStage === nextAllowed
  }

  /**
   * Get valid next stages for a given current stage
   * @param {string} currentStage - Current stage
   * @returns {Array<string>} Array of valid next stages
   */
  getValidNextStages(currentStage) {
    const validStages = []
    
    // Add the next allowed stage
    const nextStage = this.getNextAllowedStage(currentStage)
    if (nextStage) {
      validStages.push(nextStage)
    }
    
    // Special case: from interview_scheduled, allow both pass and fail
    if (currentStage === 'interview_scheduled') {
      validStages.push('interview_passed')
      validStages.push('interview_failed')
    }
    
    return validStages
  }

  /**
   * Shortlist an application
   * @param {string} applicationId - Application ID
   * @param {string} note - Optional note
   * @returns {Promise<Object>} API response
   */
  async shortlistApplication(applicationId, note = '') {
    const actor = authService.getCurrentUser() || { name: 'Agency' }
    return ApplicationDataSource.shortlistApplication(applicationId, note, actor.name)
  }

  /**
   * Schedule an interview
   * @param {string} applicationId - Application ID
   * @param {Object} interviewDetails - Interview details
   * @param {string} interviewDetails.date - Interview date (YYYY-MM-DD)
   * @param {string} interviewDetails.time - Interview time (HH:MM)
   * @param {number} interviewDetails.duration - Duration in minutes (default: 60)
   * @param {string} interviewDetails.location - Interview location
   * @param {string} interviewDetails.interviewer - Contact person name
   * @param {Array<string>} interviewDetails.requirements - Required documents
   * @param {string} interviewDetails.notes - Additional notes
   * @returns {Promise<Object>} API response
   */
  async scheduleInterview(applicationId, interviewDetails) {
    // Validate required fields
    if (!interviewDetails.date) {
      throw new Error('Interview date is required')
    }
    if (!interviewDetails.time) {
      throw new Error('Interview time is required')
    }
    if (!interviewDetails.location) {
      throw new Error('Interview location is required')
    }
    
    const actor = authService.getCurrentUser() || { name: 'Agency' }
    return InterviewDataSource.scheduleInterview(applicationId, {
      date: interviewDetails.date,
      time: interviewDetails.time,
      duration: interviewDetails.duration || 60,
      location: interviewDetails.location,
      interviewer: interviewDetails.interviewer || actor.name,
      requirements: interviewDetails.requirements || [],
      notes: interviewDetails.notes || '',
      updatedBy: actor.name
    })
  }

  /**
   * Prompt user for interview details (for use in UI)
   * Returns a promise that resolves with interview details or null if cancelled
   * @returns {Promise<Object|null>} Interview details or null
   */
  async promptForInterviewDetails() {
    // Use custom dialog service instead of browser prompts
    const date = await dialogService.prompt(
      'Interview Date',
      'Enter the interview date',
      {
        placeholder: 'YYYY-MM-DD',
        confirmText: 'Next',
        cancelText: 'Cancel'
      }
    )
    if (!date) return null
    
    const time = await dialogService.prompt(
      'Interview Time',
      'Enter the interview time',
      {
        defaultValue: '10:00',
        placeholder: 'HH:MM',
        confirmText: 'Next',
        cancelText: 'Cancel'
      }
    )
    if (!time) return null
    
    const location = await dialogService.prompt(
      'Interview Location',
      'Enter the interview location',
      {
        defaultValue: 'Office',
        placeholder: 'Location',
        confirmText: 'Next',
        cancelText: 'Cancel'
      }
    )
    if (!location) return null
    
    const interviewer = await dialogService.prompt(
      'Interviewer Name',
      'Enter the interviewer name (optional)',
      {
        placeholder: 'Name',
        confirmText: 'Next',
        cancelText: 'Cancel'
      }
    )
    
    const notes = await dialogService.prompt(
      'Additional Notes',
      'Enter any additional notes (optional)',
      {
        placeholder: 'Notes',
        confirmText: 'Done',
        cancelText: 'Cancel'
      }
    )
    
    return {
      date,
      time,
      location,
      interviewer: interviewer || undefined,
      notes: notes || undefined,
      duration: 60,
      requirements: []
    }
  }

  /**
   * Reschedule an interview
   * @param {string} applicationId - Application ID
   * @param {string} interviewId - Interview ID
   * @param {Object} updates - Updated interview details
   * @returns {Promise<Object>} API response
   */
  async rescheduleInterview(applicationId, interviewId, updates) {
    const actor = authService.getCurrentUser() || { name: 'Agency' }
    return InterviewDataSource.rescheduleInterview(applicationId, interviewId, {
      ...updates,
      updatedBy: actor.name
    })
  }

  /**
   * Mark interview as passed
   * @param {string} applicationId - Application ID
   * @param {string} note - Optional feedback
   * @returns {Promise<Object>} API response
   */
  async passInterview(applicationId, note = '') {
    return InterviewDataSource.completeInterview(applicationId, 'passed', note)
  }

  /**
   * Mark interview as failed
   * @param {string} applicationId - Application ID
   * @param {string} note - Optional feedback
   * @returns {Promise<Object>} API response
   */
  async failInterview(applicationId, note = '') {
    return InterviewDataSource.completeInterview(applicationId, 'failed', note)
  }

  /**
   * Withdraw/reject an application
   * @param {string} applicationId - Application ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} API response
   */
  async rejectApplication(applicationId, reason) {
    const actor = authService.getCurrentUser() || { name: 'Agency' }
    return ApplicationDataSource.withdrawApplication(applicationId, reason, actor.name)
  }

  /**
   * Update application stage (generic method)
   * Routes to the appropriate specific method based on target stage
   * @param {string} applicationId - Application ID
   * @param {string} currentStage - Current stage
   * @param {string} targetStage - Target stage
   * @param {Object} options - Additional options (notes, interview details, etc.)
   * @param {string} options.note - Optional note
   * @param {Object} options.interviewDetails - Interview details (required for interview_scheduled)
   * @param {boolean} options.promptForDetails - If true, prompt user for interview details (default: false)
   * @returns {Promise<Object>} API response
   */
  async updateStage(applicationId, currentStage, targetStage, options = {}) {
    // Validate transition (skip if current stage is unknown)
    if (currentStage !== 'unknown' && !this.validateStageTransition(currentStage, targetStage)) {
      throw new Error(
        `Invalid stage transition from ${currentStage} to ${targetStage}. ` +
        `You can only move to the next stage in sequence.`
      )
    }

    // Route to appropriate method
    switch (targetStage) {
      case 'shortlisted':
        return this.shortlistApplication(applicationId, options.note || '')

      case 'interview_scheduled': {
        // Check if we have interview details
        let interviewDetails = options.interviewDetails
        
        // If not provided and promptForDetails is true, prompt the user
        if (!interviewDetails && options.promptForDetails) {
          interviewDetails = await this.promptForInterviewDetails()
          if (!interviewDetails) {
            throw new Error('Interview scheduling cancelled by user')
          }
        }
        
        // Validate we have interview details
        if (!interviewDetails) {
          throw new Error(
            'Interview details are required when scheduling an interview. ' +
            'Please provide: date, time, location, and optionally interviewer name.'
          )
        }
        
        return this.scheduleInterview(applicationId, interviewDetails)
      }

      case 'interview_passed':
        return this.passInterview(applicationId, options.note || '')

      case 'interview_failed':
        return this.failInterview(applicationId, options.note || '')

      default:
        // Fallback to generic status update
        const actor = authService.getCurrentUser() || { name: 'Agency' }
        return ApplicationDataSource.updateApplicationStatus(
          applicationId,
          targetStage,
          options.note || '',
          actor.name
        )
    }
  }

  /**
   * Bulk shortlist applications
   * @param {Array<string>} applicationIds - Array of application IDs
   * @param {string} note - Optional note
   * @returns {Promise<Array>} Array of results
   */
  async bulkShortlist(applicationIds, note = '') {
    const results = []
    for (const appId of applicationIds) {
      try {
        const result = await this.shortlistApplication(appId, note)
        results.push({ applicationId: appId, success: true, result })
      } catch (error) {
        results.push({ applicationId: appId, success: false, error: error.message })
      }
    }
    return results
  }

  /**
   * Bulk reject applications
   * @param {Array<string>} applicationIds - Array of application IDs
   * @param {string} reason - Rejection reason
   * @returns {Promise<Array>} Array of results
   */
  async bulkReject(applicationIds, reason) {
    const results = []
    for (const appId of applicationIds) {
      try {
        const result = await this.rejectApplication(appId, reason)
        results.push({ applicationId: appId, success: true, result })
      } catch (error) {
        results.push({ applicationId: appId, success: false, error: error.message })
      }
    }
    return results
  }

  /**
   * Get stage label for display
   * @param {string} stage - Stage ID
   * @returns {string} Human-readable stage label
   */
  getStageLabel(stage) {
    const labels = {
      'applied': 'Applied',
      'shortlisted': 'Shortlisted',
      'interview_scheduled': 'Interview Scheduled',
      'interview_passed': 'Interview Passed',
      'interview_failed': 'Interview Failed'
    }
    return labels[stage] || stage
  }

  /**
   * Get stage color for UI
   * @param {string} stage - Stage ID
   * @returns {string} CSS class for stage color
   */
  getStageColor(stage) {
    const colors = {
      'applied': 'chip-blue',
      'shortlisted': 'chip-yellow',
      'interview_scheduled': 'chip-purple',
      'interview_passed': 'chip-green',
      'interview_failed': 'chip-red'
    }
    return colors[stage] || 'chip-blue'
  }

  /**
   * Get action button config for a stage
   * @param {string} currentStage - Current stage
   * @returns {Object|null} Button configuration or null if no action available
   */
  getActionButtonConfig(currentStage) {
    const configs = {
      'applied': {
        label: 'Shortlist',
        action: 'shortlist',
        color: 'emerald',
        nextStage: 'shortlisted'
      },
      'shortlisted': {
        label: 'Schedule Interview',
        action: 'schedule_interview',
        color: 'indigo',
        nextStage: 'interview_scheduled'
      },
      'interview_scheduled': {
        label: 'Pass',
        action: 'pass',
        color: 'green',
        nextStage: 'interview_passed'
      }
    }
    return configs[currentStage] || null
  }
}

// Export singleton instance
export default new StageTransitionService()
