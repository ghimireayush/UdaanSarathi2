import httpClient from '../config/httpClient.js'

/**
 * Interview Data Source
 * Handles all API calls related to interview management
 */
class InterviewDataSource {
  /**
   * Schedule an interview
   * @param {string} applicationId - Application ID
   * @param {Object} interviewData - Interview details
   * @param {string} interviewData.date - Interview date
   * @param {string} interviewData.time - Interview time
   * @param {number} interviewData.duration - Duration in minutes
   * @param {string} interviewData.location - Interview location
   * @param {string} interviewData.interviewer - Contact person
   * @param {string[]} interviewData.requirements - Required documents
   * @param {string} interviewData.notes - Additional notes
   * @param {string} interviewData.updatedBy - User ID
   * @returns {Promise<Object>} Created interview
   */
  async scheduleInterview(applicationId, interviewData) {
    return httpClient.post(`/applications/${applicationId}/schedule-interview`, {
      interview_date_ad: interviewData.date,
      interview_time: interviewData.time,
      duration_minutes: interviewData.duration || 60,
      location: interviewData.location,
      contact_person: interviewData.interviewer,
      required_documents: interviewData.requirements || [],
      notes: interviewData.notes,
      updatedBy: interviewData.updatedBy || 'agency'
    })
  }

  /**
   * Reschedule an interview
   * @param {string} applicationId - Application ID
   * @param {string} interviewId - Interview ID
   * @param {Object} updates - Updated interview details
   * @returns {Promise<Object>} Updated interview
   */
  async rescheduleInterview(applicationId, interviewId, updates) {
    return httpClient.post(`/applications/${applicationId}/reschedule-interview`, {
      interview_id: interviewId,
      interview_date_ad: updates.date,
      interview_time: updates.time,
      duration_minutes: updates.duration,
      location: updates.location,
      contact_person: updates.interviewer,
      required_documents: updates.requirements,
      notes: updates.notes,
      updatedBy: updates.updatedBy || 'agency'
    })
  }

  /**
   * Complete an interview (mark as passed/failed)
   * @param {string} applicationId - Application ID
   * @param {string} result - "passed" or "failed"
   * @param {string} note - Optional feedback/notes
   * @returns {Promise<Object>} Updated application
   */
  async completeInterview(applicationId, result, note = '') {
    return httpClient.post(`/applications/${applicationId}/complete-interview`, {
      result,
      note,
      updatedBy: 'agency'
    })
  }

  /**
   * Get interviews with filtering (for interview management page)
   * @param {string} license - Agency license number
   * @param {string} jobId - Job ID (optional)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Response with candidates array containing interview data
   */
  async getInterviewsForJob(license, jobId, filters = {}) {
    const params = new URLSearchParams({
      stage: 'interview_scheduled'
    })
    
    if (jobId) {
      params.append('job_id', jobId)
    }
    
    if (filters.interview_filter) {
      params.append('interview_filter', filters.interview_filter)
    }
    if (filters.search) {
      params.append('search', filters.search)
    }
    if (filters.date_from) {
      params.append('date_from', filters.date_from)
    }
    if (filters.date_to) {
      params.append('date_to', filters.date_to)
    }
    if (filters.date_alias) {
      params.append('date_alias', filters.date_alias)
    }
    if (filters.page) {
      params.append('page', filters.page)
    }
    if (filters.limit) {
      params.append('limit', filters.limit)
    }
    
    return httpClient.get(`/agencies/${license}/jobs/candidates?${params}`)
  }

  /**
   * Get interview statistics
   * @param {string} license - Agency license number
   * @param {string} jobId - Job ID (optional)
   * @param {string} dateRange - Date range filter ('today', 'week', 'month', 'all')
   * @returns {Promise<Object>} Statistics object
   */
  async getInterviewStats(license, jobId, dateRange = 'all') {
    const params = new URLSearchParams({
      date_range: dateRange
    })
    
    if (jobId) {
      params.append('job_id', jobId)
    }
    
    return httpClient.get(`/agencies/${license}/jobs/interview-stats?${params}`)
  }

  /**
   * Get interviews for candidates (legacy method)
   * @param {Array<string>} candidateIds - Array of candidate IDs
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of interviews
   */
  async getInterviews(candidateIds, options = {}) {
    const params = new URLSearchParams({
      candidate_ids: candidateIds.join(','),
      page: options.page || 1,
      limit: options.limit || 10,
      only_upcoming: options.onlyUpcoming || false,
      order: options.order || 'upcoming'
    })
    
    return httpClient.get(`/interviews?${params}`)
  }

  /**
   * Get interviews for agency (across all jobs or filtered by job)
   * @param {string} license - Agency license number
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Response with candidates array containing interview data
   */
  async getInterviewsForAgency(license, filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.job_id) {
      params.append('job_id', filters.job_id)
    }
    if (filters.interview_filter) {
      params.append('interview_filter', filters.interview_filter)
    }
    if (filters.date_alias) {
      params.append('date_alias', filters.date_alias)
    }
    if (filters.date_from) {
      params.append('date_from', filters.date_from)
    }
    if (filters.date_to) {
      params.append('date_to', filters.date_to)
    }
    if (filters.search) {
      params.append('search', filters.search)
    }
    if (filters.limit) {
      params.append('limit', filters.limit)
    }
    if (filters.offset) {
      params.append('offset', filters.offset)
    }
    
    return httpClient.get(`/agencies/${license}/interviews?${params}`)
  }

  /**
   * Get aggregated interview statistics for agency (across all jobs)
   * @param {string} license - Agency license number
   * @param {string} dateRange - Date range filter ('today', 'week', 'month', 'all')
   * @returns {Promise<Object>} Statistics object
   */
  async getAgencyInterviewStats(license, dateRange = 'all') {
    return httpClient.get(`/agencies/${license}/interviews/stats?date_range=${dateRange}`)
  }
}

export default new InterviewDataSource()
