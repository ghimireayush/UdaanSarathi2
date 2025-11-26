// Admin Job API Client - Dedicated admin endpoints for job listings
import performanceService from './performanceService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('udaan_token');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Handle API errors
 */
const handleApiError = (error, operation) => {
  console.error(`[adminJobApiClient] ${operation} failed:`, error);
  throw new Error(`${operation} failed: ${error.message}`);
};

/**
 * Admin Job API Client
 * Handles all job listing operations for the admin panel
 */
class AdminJobApiClient {
  /**
   * Get jobs for admin panel with filters and statistics
   * @param {Object} filters - Filter options
   * @param {string} filters.search - Search term
   * @param {string} filters.country - Country filter
   * @param {string} filters.sortBy - Sort field (published_date, applications, shortlisted, interviews)
   * @returns {Promise<Array>} Array of jobs with statistics
   */
  async getAdminJobs(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add search filter
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Add country filter (only if not "All Countries")
      if (filters.country && filters.country !== 'All Countries') {
        params.append('country', filters.country);
      }
      
      // Add sort parameters
      if (filters.sortBy) {
        params.append('sort_by', this.mapSortBy(filters.sortBy));
        params.append('order', 'desc'); // Always descending (most recent/highest first)
      }
      
      // Get all jobs for client-side pagination
      params.append('page', '1');
      params.append('limit', '1000'); // Large limit to get all jobs

      const url = `${API_BASE_URL}/admin/jobs?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Return the jobs array from the response
      return data.data || [];
    } catch (error) {
      return handleApiError(error, 'Get admin jobs');
    }
  }

  /**
   * Get country distribution statistics
   * Returns only countries where this agency has created jobs
   * @returns {Promise<Object>} Object with country names as keys and job counts as values
   */
  async getCountryDistribution() {
    return await performanceService.getCachedData('admin_country_dist', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/jobs/statistics/countries`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('[adminJobApiClient] Failed to fetch country distribution:', error);
        return {}; // Return empty object on error
      }
    }, 'admin_jobs', 300000); // Cache for 5 minutes
  }

  /**
   * Get job statistics summary
   * @returns {Promise<Object>} Statistics object with byCountry property
   */
  async getJobStatistics() {
    const distribution = await this.getCountryDistribution();
    return {
      byCountry: distribution
    };
  }

  /**
   * Map frontend sort field to backend field
   * @param {string} frontendSort - Frontend sort field name
   * @returns {string} Backend sort field name
   */
  mapSortBy(frontendSort) {
    const mapping = {
      'published_date': 'published_date',
      'applications': 'applications',
      'shortlisted': 'shortlisted',
      'interviews': 'interviews' // Today's interviews
    };
    return mapping[frontendSort] || 'published_date';
  }

  /**
   * Clear cache (useful after creating/updating/deleting jobs)
   */
  clearCache() {
    performanceService.clearCacheByType('admin_jobs');
  }
}

// Export singleton instance
const adminJobApiClient = new AdminJobApiClient();
export default adminJobApiClient;
