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
}

export default new DocumentDataSource()
