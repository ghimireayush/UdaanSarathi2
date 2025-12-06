import httpClient from '../config/httpClient.js'

/**
 * Application Data Source
 * Handles all API calls related to application workflow management
 */
class ApplicationDataSource {
  /**
   * Shortlist an application
   * @param {string} applicationId - Application ID
   * @param {string} note - Optional note
   * @param {string} updatedBy - User ID
   * @returns {Promise<Object>} Updated application
   */
  async shortlistApplication(applicationId, note = '', updatedBy = 'agency') {
    return httpClient.post(`/applications/${applicationId}/shortlist`, {
      note,
      updatedBy
    })
  }

  /**
   * Withdraw/reject an application
   * @param {string} applicationId - Application ID
   * @param {string} note - Rejection reason
   * @param {string} updatedBy - User ID
   * @returns {Promise<Object>} Updated application
   */
  async withdrawApplication(applicationId, note = '', updatedBy = 'agency') {
    return httpClient.post(`/applications/${applicationId}/withdraw`, {
      note,
      updatedBy
    })
  }

  /**
   * Get application with history
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Application with history_blob
   */
  async getApplicationWithHistory(applicationId) {
    return httpClient.get(`/applications/${applicationId}`)
  }

  /**
   * Update application status (generic status update)
   * @param {string} applicationId - Application ID
   * @param {string} status - New status
   * @param {string} note - Optional note
   * @param {string} updatedBy - User ID
   * @returns {Promise<Object>} Updated application
   */
  async updateApplicationStatus(applicationId, status, note = '', updatedBy = 'agency') {
    return httpClient.post(`/applications/${applicationId}/update-status`, {
      status,
      note,
      updatedBy
    })
  }
}

export default new ApplicationDataSource()
