import httpClient from '../config/httpClient.js'

/**
 * Document Data Source
 * Handles all API calls related to document management
 */
class DocumentDataSource {
  /**
   * Get all document types
   * @returns {Promise<Array>} List of document types
   */
  async getDocumentTypes() {
    return httpClient.get('/document-types')
  }

  /**
   * Get candidate documents by application ID
   * Server derives job, position, candidate from application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Documents with slots and summary
   */
  async getCandidateDocumentsByApplication(applicationId) {
    return httpClient.get(`/applications/${applicationId}/documents`)
  }

  /**
   * Upload document by application ID
   * Server derives job, position, candidate from application ID
   * @param {string} applicationId - Application ID
   * @param {FormData} formData - Form data with file and metadata
   * @returns {Promise<Object>} Uploaded document details
   */
  async uploadDocumentByApplication(applicationId, formData) {
    return httpClient.upload(
      `/applications/${applicationId}/documents`,
      formData
    )
  }

  /**
   * Verify (approve/reject) document by application ID
   * Server derives job, position, candidate from application ID
   * @param {string} applicationId - Application ID
   * @param {string} documentId - Document ID
   * @param {Object} data - Verification data { status: 'approved'|'rejected', rejection_reason?: string }
   * @returns {Promise<Object>} Verification result
   */
  async verifyDocumentByApplication(applicationId, documentId, data) {
    return httpClient.post(
      `/applications/${applicationId}/documents/${documentId}/verify`,
      data
    )
  }
}

export default new DocumentDataSource()
