import httpClient from '../config/httpClient.js'

/**
 * Job Data Source
 * Handles all API calls related to job postings (admin jobs and draft jobs)
 */
class JobDataSource {
  // ============================================
  // ADMIN JOB ENDPOINTS
  // ============================================

  /**
   * Get jobs for admin panel with filters and statistics
   * @param {Object} filters - Filter options
   * @param {string} filters.search - Search term
   * @param {string} filters.country - Country filter
   * @param {string} filters.sortBy - Sort field
   * @param {number} filters.page - Page number
   * @param {number} filters.limit - Items per page
   * @returns {Promise<Object>} Response with jobs array
   */
  async getAdminJobs(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.search) {
      params.append('search', filters.search)
    }
    
    if (filters.country && filters.country !== 'All Countries') {
      params.append('country', filters.country)
    }
    
    if (filters.sortBy) {
      params.append('sort_by', filters.sortBy)
      params.append('order', 'desc')
    }
    
    params.append('page', (filters.page || 1).toString())
    params.append('limit', (filters.limit || 1000).toString())

    const queryString = params.toString()
    return httpClient.get(`/admin/jobs?${queryString}`)
  }

  /**
   * Get country distribution statistics
   * @returns {Promise<Object>} Object with country names as keys and job counts as values
   */
  async getCountryDistribution() {
    return httpClient.get('/admin/jobs/statistics/countries')
  }

  /**
   * Get job statistics summary
   * @returns {Promise<Object>} Statistics object with byCountry property
   */
  async getJobStatistics() {
    const distribution = await this.getCountryDistribution()
    return {
      byCountry: distribution
    }
  }

  // ============================================
  // DRAFT JOB ENDPOINTS
  // ============================================

  /**
   * Get all draft jobs for agency
   * @param {string} license - Agency license number
   * @returns {Promise<Array>} Array of draft jobs
   */
  async getDraftJobs(license) {
    return httpClient.get(`/agencies/${license}/draft-jobs`)
  }

  /**
   * Get single draft job by ID
   * @param {string} license - Agency license number
   * @param {string} draftId - Draft job ID
   * @returns {Promise<Object>} Draft job details
   */
  async getDraftJobById(license, draftId) {
    return httpClient.get(`/agencies/${license}/draft-jobs/${draftId}`)
  }

  /**
   * Create new draft job
   * @param {string} license - Agency license number
   * @param {Object} draftData - Draft job data
   * @returns {Promise<Object>} Created draft job
   */
  async createDraftJob(license, draftData) {
    return httpClient.post(`/agencies/${license}/draft-jobs`, draftData)
  }

  /**
   * Update draft job
   * @param {string} license - Agency license number
   * @param {string} draftId - Draft job ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated draft job
   */
  async updateDraftJob(license, draftId, updateData) {
    return httpClient.patch(`/agencies/${license}/draft-jobs/${draftId}`, updateData)
  }

  /**
   * Delete draft job
   * @param {string} license - Agency license number
   * @param {string} draftId - Draft job ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteDraftJob(license, draftId) {
    return httpClient.delete(`/agencies/${license}/draft-jobs/${draftId}`)
  }

  /**
   * Validate draft job
   * @param {string} license - Agency license number
   * @param {string} draftId - Draft job ID
   * @returns {Promise<Object>} Validation result
   */
  async validateDraftJob(license, draftId) {
    return httpClient.post(`/agencies/${license}/draft-jobs/${draftId}/validate`, {})
  }

  /**
   * Publish draft job (convert to actual job posting)
   * @param {string} license - Agency license number
   * @param {string} draftId - Draft job ID
   * @returns {Promise<Object>} Published job result
   */
  async publishDraftJob(license, draftId) {
    return httpClient.post(`/agencies/${license}/draft-jobs/${draftId}/publish`, {})
  }

  // ============================================
  // JOB MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * Toggle job posting status (activate/deactivate)
   * @param {string} jobId - Job ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>} Updated job status
   */
  async toggleJobStatus(jobId, isActive) {
    return httpClient.patch(`/jobs/${jobId}/toggle`, { is_active: isActive })
  }

  /**
   * Create job posting
   * @param {string} licenseNumber - Agency license number
   * @param {Object} jobData - Job posting data
   * @returns {Promise<Object>} Created job posting
   */
  async createJobPosting(licenseNumber, jobData) {
    return httpClient.post(`/agencies/${licenseNumber}/job-postings`, jobData)
  }

  /**
   * Get job titles list with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.q - Search query (ILIKE)
   * @param {boolean} params.is_active - Filter by active status
   * @param {number} params.limit - Max results
   * @param {number} params.offset - Pagination offset
   * @returns {Promise<Object>} Object with data array and total count
   */
  async getJobTitles(params = {}) {
    const queryParams = new URLSearchParams()
    if (params.q) queryParams.append('q', params.q)
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    
    const queryString = queryParams.toString()
    return httpClient.get(`/job-titles${queryString ? `?${queryString}` : ''}`)
  }

  // ============================================
  // TEMPLATE JOB MANAGEMENT ENDPOINTS
  // ============================================

  /**
   * Create a template job posting with minimal input
   * Auto-generates employer, contract, and one position with defaults
   * @param {string} license - Agency license number
   * @param {Object} data - Template data
   * @param {string} data.posting_title - Job posting title (required)
   * @param {string} data.country - Country name or code (required)
   * @param {string} [data.city] - City name (optional)
   * @returns {Promise<Object>} Created template job with id, posting_title, country, city, created_at
   */
  async createTemplateJob(license, data) {
    return httpClient.post(`/agencies/${license}/job-management/template`, data)
  }

  /**
   * Get full job posting details in editable format
   * Returns all fields (including nulls) for form binding
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @returns {Promise<Object>} Complete editable job details
   */
  async getEditableJobDetails(license, jobId) {
    return httpClient.get(`/agencies/${license}/job-management/${jobId}/editable`)
  }

  /**
   * Update basic job posting information (PATCH semantics)
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Object} data - Fields to update
   * @param {string} [data.posting_title] - Job title
   * @param {string} [data.country] - Country
   * @param {string} [data.city] - City
   * @param {string} [data.lt_number] - LT number
   * @param {string} [data.chalani_number] - Chalani number
   * @param {string} [data.approval_date_ad] - Approval date (AD)
   * @param {string} [data.posting_date_ad] - Posting date (AD)
   * @param {string} [data.announcement_type] - Announcement type
   * @param {string} [data.notes] - Notes
   * @returns {Promise<Object>} Updated job with id and updated_at
   */
  async updateBasicInfo(license, jobId, data) {
    return httpClient.patch(`/agencies/${license}/job-management/${jobId}/basic`, data)
  }

  /**
   * Update employer information (PATCH semantics)
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Object} data - Fields to update
   * @param {string} [data.company_name] - Company name
   * @param {string} [data.country] - Country
   * @param {string} [data.city] - City
   * @returns {Promise<Object>} Updated job with id and updated_at
   */
  async updateEmployer(license, jobId, data) {
    return httpClient.patch(`/agencies/${license}/job-management/${jobId}/employer`, data)
  }

  /**
   * Update contract terms (PATCH semantics)
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Object} data - Fields to update
   * @param {number} [data.period_years] - Contract period in years
   * @param {boolean} [data.renewable] - Is contract renewable
   * @param {number} [data.hours_per_day] - Working hours per day
   * @param {number} [data.days_per_week] - Working days per week
   * @param {string} [data.overtime_policy] - Overtime policy
   * @param {number} [data.weekly_off_days] - Weekly off days
   * @param {string} [data.food] - Food provision (free/paid/not_provided)
   * @param {string} [data.accommodation] - Accommodation provision
   * @param {string} [data.transport] - Transport provision
   * @param {number} [data.annual_leave_days] - Annual leave days
   * @returns {Promise<Object>} Updated job with id and updated_at
   */
  async updateContract(license, jobId, data) {
    return httpClient.patch(`/agencies/${license}/job-management/${jobId}/contract`, data)
  }

  /**
   * Update job posting tags (PATCH semantics)
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Object} data - Fields to update
   * @param {string[]} [data.skills] - Skills array
   * @param {string[]} [data.education_requirements] - Education requirements array
   * @param {Object} [data.experience_requirements] - Experience requirements object
   * @param {string[]} [data.canonical_title_ids] - Canonical title IDs
   * @param {string[]} [data.canonical_title_names] - Canonical title names
   * @returns {Promise<Object>} Updated job with id and updated_at
   */
  async updateTags(license, jobId, data) {
    return httpClient.patch(`/agencies/${license}/job-management/${jobId}/tags`, data)
  }

  /**
   * Update job posting expenses (PATCH semantics)
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Object} data - Expense categories to update
   * @param {Object} [data.medical] - Medical expense data
   * @param {Object} [data.insurance] - Insurance expense data
   * @param {Object} [data.travel] - Travel expense data
   * @param {Object} [data.visa_permit] - Visa/permit expense data
   * @param {Object} [data.training] - Training expense data
   * @param {Object} [data.welfare_service] - Welfare/service expense data
   * @returns {Promise<Object>} Updated job with id and updated_at
   */
  async updateExpenses(license, jobId, data) {
    return httpClient.patch(`/agencies/${license}/job-management/${jobId}/expenses`, data)
  }

  /**
   * Add a new position to a job posting
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {Object} data - Position data
   * @param {string} data.title - Position title
   * @param {Object} data.vacancies - Vacancies object { male: number, female: number }
   * @param {Object} data.salary - Salary object { monthly_amount: number, currency: string }
   * @param {string} [data.position_notes] - Position notes
   * @returns {Promise<Object>} Created position with id, title, vacancies, salary
   */
  async addPosition(license, jobId, data) {
    return httpClient.post(`/agencies/${license}/job-management/${jobId}/positions`, data)
  }

  /**
   * Update an existing position (PATCH semantics)
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string} positionId - Position ID
   * @param {Object} data - Fields to update
   * @param {string} [data.title] - Position title
   * @param {Object} [data.vacancies] - Vacancies object { male: number, female: number }
   * @param {Object} [data.salary] - Salary object { monthly_amount: number, currency: string }
   * @param {string} [data.position_notes] - Position notes
   * @returns {Promise<Object>} Updated position
   */
  async updatePosition(license, jobId, positionId, data) {
    return httpClient.patch(`/agencies/${license}/job-management/${jobId}/positions/${positionId}`, data)
  }

  /**
   * Remove a position from a job posting
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string} positionId - Position ID
   * @returns {Promise<Object>} Deletion confirmation { success: true }
   */
  async removePosition(license, jobId, positionId) {
    return httpClient.delete(`/agencies/${license}/job-management/${jobId}/positions/${positionId}`)
  }

  // ============================================
  // IMAGE UPLOAD ENDPOINTS
  // ============================================

  /**
   * Upload job posting cutout image
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Upload result with URL
   */
  async uploadJobImage(license, jobId, file) {
    const formData = new FormData()
    formData.append('file', file)

    return httpClient.upload(
      `/agencies/${license}/job-postings/${jobId}/cutout`,
      formData
    )
  }

  /**
   * Delete job posting cutout image
   * @param {string} license - Agency license number
   * @param {string} jobId - Job posting ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteJobImage(license, jobId) {
    return httpClient.delete(`/agencies/${license}/job-postings/${jobId}/cutout`)
  }
}

export default new JobDataSource()
