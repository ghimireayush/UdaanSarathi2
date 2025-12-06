import httpClient from './config/httpClient'

/**
 * Dashboard Analytics API
 */
export const dashboardApi = {
  /**
   * Get dashboard analytics for the authenticated agency owner
   * @param {Object} params - Query parameters
   * @param {string} [params.startDate] - Start date (ISO 8601)
   * @param {string} [params.endDate] - End date (ISO 8601)
   * @param {string} [params.country] - Filter by country
   * @param {string} [params.jobId] - Filter by job ID
   * @returns {Promise<Object>} Dashboard analytics data
   */
  async getAnalytics(params = {}) {
    const queryParams = new URLSearchParams()
    
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.country) queryParams.append('country', params.country)
    if (params.jobId) queryParams.append('jobId', params.jobId)
    
    const queryString = queryParams.toString()
    const url = `/agencies/owner/dashboard/analytics${queryString ? `?${queryString}` : ''}`
    
    console.log('[dashboardApi] Fetching analytics from:', url)
    const response = await httpClient.get(url)
    console.log('[dashboardApi] Response received:', response)
    
    // httpClient.get already returns the parsed JSON, no need for .data
    return response
  }
}

export default dashboardApi
