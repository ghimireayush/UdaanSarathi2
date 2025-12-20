import httpClient from '../config/httpClient.js'
import { mapStageToBackend } from '../../utils/stageMapper.js'

/**
 * Candidate Data Source
 * Handles all API calls related to candidates and job applications
 */
class CandidateDataSource {
  /**
   * Get complete candidate details for a job application
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting UUID
   * @param {string} candidateId - Candidate UUID
   * @param {string} applicationId - Application UUID (optional, for specific application)
   * @returns {Promise<Object>} Complete candidate details
   */
  async getCandidateDetails(license, jobId, candidateId, applicationId = null) {
    let url = `/agencies/${license}/jobs/${jobId}/candidates/${candidateId}/details`
    if (applicationId) {
      url += `?application_id=${applicationId}`
    }
    return httpClient.get(url)
  }

  /**
   * Get job details with analytics
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @returns {Promise<Object>} Job details with analytics
   */
  async getJobDetails(license, jobId) {
    return httpClient.get(`/agencies/${license}/jobs/${jobId}/details`, {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Get candidates for a job with filtering and pagination
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Object} options - Query options
   * @param {string} options.stage - Application stage (frontend format: 'interview-scheduled')
   * @param {number} options.limit - Number of candidates to return
   * @param {number} options.offset - Pagination offset
   * @param {string[]} options.skills - Array of skills for filtering
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort order 'asc' or 'desc'
   * @param {string} options.interviewFilter - Interview date filter
   * @returns {Promise<Object>} Candidates with pagination info
   */
  async getCandidates(license, jobId, options = {}) {
    // Map frontend stage to backend format
    const backendStage = mapStageToBackend(options.stage)
    
    const params = new URLSearchParams({
      stage: backendStage,
      limit: (options.limit || 10).toString(),
      offset: (options.offset || 0).toString()
    })
    
    if (options.skills && options.skills.length > 0) {
      params.set('skills', options.skills.join(','))
    }
    
    if (options.sortBy) {
      params.set('sort_by', options.sortBy)
    }
    
    if (options.sortOrder) {
      params.set('sort_order', options.sortOrder)
    }
    
    if (options.interviewFilter) {
      params.set('interview_filter', options.interviewFilter)
    }
    
    return httpClient.get(`/agencies/${license}/jobs/${jobId}/candidates?${params}`, {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Get all candidates for a stage (handles pagination automatically)
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Object} options - Query options
   * @param {Function} onProgress - Optional callback for progress updates
   * @returns {Promise<Array>} All candidates for the stage
   */
  async getAllCandidates(license, jobId, options = {}, onProgress = null) {
    const allCandidates = []
    let offset = 0
    const limit = Math.min(options.limit || 100, 100)
    let hasMore = true
    let total = 0
    
    while (hasMore) {
      const response = await this.getCandidates(license, jobId, {
        ...options,
        limit,
        offset
      })
      
      allCandidates.push(...response.candidates)
      hasMore = response.pagination.has_more
      total = response.pagination.total
      offset += limit
      
      if (onProgress) {
        onProgress(allCandidates.length, total)
      }
    }
    
    return allCandidates
  }

  /**
   * Bulk shortlist candidates
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string[]} candidateIds - Array of candidate IDs to shortlist
   * @returns {Promise<Object>} Result with success status and errors
   */
  async bulkShortlistCandidates(license, jobId, candidateIds) {
    return httpClient.post(`/agencies/${license}/jobs/${jobId}/candidates/bulk-shortlist`, {
      candidate_ids: candidateIds
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Bulk reject candidates
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string[]} candidateIds - Array of candidate IDs to reject
   * @param {string} reason - Optional rejection reason
   * @returns {Promise<Object>} Result with success status and errors
   */
  async bulkRejectCandidates(license, jobId, candidateIds, reason = null) {
    const body = { candidate_ids: candidateIds }
    if (reason) {
      body.reason = reason
    }
    
    return httpClient.post(`/agencies/${license}/jobs/${jobId}/candidates/bulk-reject`, body, {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Bulk schedule interviews for multiple candidates
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string[]} candidateIds - Array of candidate IDs to schedule
   * @param {Object} interviewData - Interview details
   * @param {string} interviewData.date - Interview date (AD format)
   * @param {string} interviewData.time - Interview time
   * @param {number} interviewData.duration - Duration in minutes
  /**
   * Multi-batch schedule interviews - Schedule multiple batches in a single API call
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Array} batches - Array of batch objects with application_ids, date, time, etc.
   * @returns {Promise<Object>} Result with success status, updated_count, failed candidates, and errors
   */
  async multiBatchScheduleInterviews(license, jobId, batches) {
    return httpClient.post(`/agencies/${license}/jobs/${jobId}/candidates/multi-batch-schedule`, {
      batches: batches.map(batch => ({
        application_ids: batch.candidates, // Now sending application IDs instead of candidate IDs
        interview_date_ad: batch.date,
        interview_date_bs: batch.date_bs,
        interview_time: batch.time,
        duration_minutes: batch.duration || 60,
        location: batch.location || 'Office',
        contact_person: batch.interviewer || 'HR Manager',
        required_documents: batch.requirements || [],
        notes: batch.notes || ''
      })),
      updatedBy: 'agency'
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export default new CandidateDataSource()
