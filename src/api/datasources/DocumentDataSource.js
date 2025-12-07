import httpClient from '../config/httpClient.js'

/**
 * Document Data Source
 * Handles all API calls related to document management
 */
class DocumentDataSource {
  /**
   * Get candidate documents (read-only for admin)
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object>} Documents with slots and summary
   */
  async getCandidateDocuments(candidateId) {
    return httpClient.get(`/candidates/${candidateId}/documents`)
  }

  /**
   * Get candidate documents via agency endpoint
   * @param {string} agencyLicense - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Object>} Documents with slots and summary
   */
  async getAgencyCandidateDocuments(agencyLicense, jobId, candidateId) {
    return httpClient.get(`/agencies/${agencyLicense}/jobs/${jobId}/candidates/${candidateId}/documents`)
  }

  /**
   * Upload document for candidate via agency endpoint
   * @param {string} agencyLicense - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string} candidateId - Candidate ID
   * @param {FormData} formData - Form data with file and metadata
   * @returns {Promise<Object>} Uploaded document details
   */
  async uploadAgencyCandidateDocument(agencyLicense, jobId, candidateId, formData) {
    // Use upload method which handles FormData correctly (no JSON.stringify, no Content-Type header)
    return httpClient.upload(
      `/agencies/${agencyLicense}/jobs/${jobId}/candidates/${candidateId}/documents`,
      formData
    )
  }

  /**
   * Delete candidate document via agency endpoint
   * @param {string} agencyLicense - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string} candidateId - Candidate ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAgencyCandidateDocument(agencyLicense, jobId, candidateId, documentId) {
    return httpClient.delete(
      `/agencies/${agencyLicense}/jobs/${jobId}/candidates/${candidateId}/documents/${documentId}`
    )
  }

  /**
   * Verify (approve/reject) candidate document via agency endpoint
   * @param {string} agencyLicense - Agency license number
   * @param {string} jobId - Job posting ID
   * @param {string} candidateId - Candidate ID
   * @param {string} documentId - Document ID
   * @param {Object} data - Verification data { status: 'approved'|'rejected', rejection_reason?: string }
   * @returns {Promise<Object>} Verification result
   */
  async verifyAgencyCandidateDocument(agencyLicense, jobId, candidateId, documentId, data) {
    return httpClient.post(
      `/agencies/${agencyLicense}/jobs/${jobId}/candidates/${candidateId}/documents/${documentId}/verify`,
      data
    )
  }

  /**
   * Get all document types
   * @returns {Promise<Array>} List of document types
   */
  async getDocumentTypes() {
    return httpClient.get('/document-types')
  }
}

export default new DocumentDataSource()
