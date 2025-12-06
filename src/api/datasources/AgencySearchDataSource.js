import httpClient from '../config/httpClient.js'

/**
 * Agency Search Data Source
 * Handles all API calls related to public agency search functionality
 */
class AgencySearchDataSource {
  /**
   * Search agencies with filters
   * @param {Object} params - Search parameters
   * @returns {Promise<Array>} Array of matching agencies
   */
  async searchAgencies(params) {
    const queryString = params.toString()
    return httpClient.get(`/api/public/agencies/search?${queryString}`)
  }

  /**
   * Get agency search configuration
   * @returns {Promise<Object>} Search configuration
   */
  async getSearchConfig() {
    return httpClient.get('/agencies/search/config')
  }
}

export default new AgencySearchDataSource()
