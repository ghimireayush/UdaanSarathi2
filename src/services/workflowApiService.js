/**
 * Workflow API Service
 * Connects to the backend workflow endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class WorkflowApiService {
  /**
   * Get auth token from localStorage
   */
  getAuthToken() {
    // Use the same key as tokenManager
    const token = localStorage.getItem('udaan_token');
    if (!token) {
      console.warn('[WorkflowApiService] No auth token found in localStorage');
    }
    return token;
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const token = this.getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get workflow candidates
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Candidates with pagination and analytics
   */
  async getWorkflowCandidates(filters = {}) {
    const params = new URLSearchParams();
    
    // When filtering by interview_scheduled, also include interview_rescheduled
    // Note: Backend doesn't support multiple stages in one filter, so we'll handle this in the UI
    if (filters.stage && filters.stage !== 'all') {
      params.append('stage', filters.stage);
    }
    if (filters.job_posting_id) {
      params.append('job_posting_id', filters.job_posting_id);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.limit) {
      params.append('limit', filters.limit);
    }
    if (filters.sort) {
      params.append('sort', filters.sort);
    }

    const queryString = params.toString();
    const endpoint = `/workflow/candidates${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * Update candidate stage
   * @param {string} candidateId - Candidate ID
   * @param {Object} updateData - Stage update data
   * @returns {Promise<Object>} Update result
   */
  async updateCandidateStage(candidateId, updateData) {
    return this.request(`/workflow/candidates/${candidateId}/stage`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Get workflow analytics
   * @param {Object} filters - Analytics filters
   * @returns {Promise<Object>} Analytics data
   */
  async getWorkflowAnalytics(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.date_from) {
      params.append('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params.append('date_to', filters.date_to);
    }
    if (filters.job_posting_id) {
      params.append('job_posting_id', filters.job_posting_id);
    }

    const queryString = params.toString();
    const endpoint = `/workflow/analytics${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * Get workflow stages
   * @returns {Promise<Object>} Available stages
   */
  async getWorkflowStages() {
    return this.request('/workflow/stages');
  }
}

// Create and export singleton instance
const workflowApiService = new WorkflowApiService();
export default workflowApiService;
