// Job Title Service - Fetch job titles from backend API
import performanceService from './performanceService.js';
import JobDataSource from '../api/datasources/JobDataSource.js';

class JobTitleService {
  /**
   * Fetch all job titles from the backend API
   * @param {Object} params - Query parameters
   * @param {string} params.q - Search query
   * @param {boolean} params.is_active - Filter by active status
   * @param {number} params.limit - Max results
   * @returns {Promise<Array>} Array of job title objects
   */
  async getJobTitles(params = {}) {
    try {
      const result = await JobDataSource.getJobTitles(params);
      return result.data || result || [];
    } catch (error) {
      console.error('[jobTitleService] Failed to fetch job titles:', error);
      return [];
    }
  }

  /**
   * Search job titles by query
   * @param {string} query - Search query
   * @param {number} limit - Max results (default 10)
   * @returns {Promise<Array>} Array of matching job titles
   */
  async searchJobTitles(query, limit = 10) {
    if (!query || query.length < 2) return [];
    
    try {
      const result = await JobDataSource.getJobTitles({ q: query, limit, is_active: true });
      return result.data || result || [];
    } catch (error) {
      console.error('[jobTitleService] Failed to search job titles:', error);
      return [];
    }
  }

  /**
   * Get cached list of popular job titles
   * @returns {Promise<Array>} Array of job title names
   */
  async getPopularJobTitles() {
    return await performanceService.getCachedData('job_titles_popular', async () => {
      try {
        const result = await JobDataSource.getJobTitles({ is_active: true, limit: 50 });
        const titles = result.data || result || [];
        return titles.map(t => t.title).filter(Boolean);
      } catch (error) {
        console.error('[jobTitleService] Failed to fetch popular job titles:', error);
        return [];
      }
    }, 'jobTitles', 3600000); // Cache for 1 hour
  }
}

// Create and export singleton instance
const jobTitleService = new JobTitleService();
export default jobTitleService;
