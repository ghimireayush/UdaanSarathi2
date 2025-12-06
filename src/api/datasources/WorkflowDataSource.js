import httpClient from '../config/httpClient.js'

/**
 * Workflow Data Source
 * Handles all API calls related to workflow and process management
 */
class WorkflowDataSource {
  /**
   * Get workflow data from endpoint
   * @param {string} endpoint - Workflow endpoint path
   * @returns {Promise<Object>} Workflow data
   */
  async getWorkflowData(endpoint) {
    const baseUrl = process.env.VITE_API_BASE_URL || ''
    return httpClient.get(`${baseUrl}${endpoint}`)
  }
}

export default new WorkflowDataSource()
