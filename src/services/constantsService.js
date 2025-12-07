// Constants Service - System constants and enums
import constantsData from '../data/constants.json'
import performanceService from './performanceService.js'
import i18nService from './i18nService.js'

// Utility function to simulate API delay (reduced for performance)
const delay = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms))

class ConstantsService {
  /**
   * Get all job statuses
   * @returns {Promise<Object>} Job status constants
   */
  async getJobStatuses() {
    return await performanceService.getCachedData('job_statuses', async () => {
      await delay()
      return constantsData.jobStatuses
    }, 'constants')
  }

  /**
   * Get all application stages
   * @returns {Promise<Object>} Application stage constants
   */
  async getApplicationStages() {
    return await performanceService.getCachedData('application_stages', async () => {
      await delay()
      return constantsData.applicationStages
    }, 'constants')
  }

  /**
   * Get all interview statuses
   * @returns {Promise<Object>} Interview status constants
   */
  async getInterviewStatuses() {
    return await performanceService.getCachedData('interview_statuses', async () => {
      await delay()
      return constantsData.interviewStatuses
    }, 'constants')
  }

  /**
   * Get list of countries
   * @returns {Promise<Array>} Array of country names
   */
  async getCountries() {
    return await performanceService.getCachedData('countries', async () => {
      await delay()
      return constantsData.countries
    }, 'constants')
  }

  /**
   * Get list of job categories
   * @returns {Promise<Array>} Array of job categories
   */
  async getJobCategories() {
    return await performanceService.getCachedData('job_categories', async () => {
      await delay()
      return constantsData.jobCategories
    }, 'constants')
  }

  /**
   * Get interview types
   * @returns {Promise<Array>} Array of interview types
   */
  async getInterviewTypes() {
    return await performanceService.getCachedData('interview_types', async () => {
      await delay()
      return constantsData.interviewTypes
    }, 'constants')
  }

  /**
   * Get education levels
   * @returns {Promise<Array>} Array of education levels
   */
  async getEducationLevels() {
    return await performanceService.getCachedData('education_levels', async () => {
      await delay()
      return constantsData.educationLevels
    }, 'constants')
  }

  /**
   * Get gender options
   * @returns {Promise<Array>} Array of gender options
   */
  async getGenders() {
    return await performanceService.getCachedData('genders', async () => {
      await delay()
      return constantsData.genders
    }, 'constants')
  }

  /**
   * Get priority levels
   * @returns {Promise<Object>} Priority level constants
   */
  async getPriorities() {
    return await performanceService.getCachedData('priorities', async () => {
      await delay()
      return constantsData.priorities
    }, 'constants')
  }

  /**
   * Get supported currencies
   * @returns {Promise<Array>} Array of currency codes
   */
  async getCurrencies() {
    return await performanceService.getCachedData('currencies', async () => {
      await delay()
      return constantsData.currencies
    }, 'constants')
  }

  /**
   * Get all constants at once
   * @returns {Promise<Object>} All constants data
   */
  async getAllConstants() {
    return await performanceService.getCachedData('all_constants', async () => {
      await delay()
      return constantsData
    }, 'constants')
  }

  /**
   * Get label for job status
   * @param {string} status - Status key
   * @returns {string} Formatted status label
   */
  getJobStatusLabel(status) {
    const labels = {
      [constantsData.jobStatuses.DRAFT]: 'Draft',
      [constantsData.jobStatuses.PUBLISHED]: 'Published',
      [constantsData.jobStatuses.CLOSED]: 'Closed',
      [constantsData.jobStatuses.PAUSED]: 'Paused'
    }
    return labels[status] || status
  }

  /**
   * Get label for application stage (i18n-aware)
   * @param {string} stage - Stage key
   * @param {Function} t - Translation function (optional, will use i18nService if not provided)
   * @returns {string} Formatted stage label
   */
  getApplicationStageLabel(stage, t = null) {
    // Normalize stage ID (handle both underscore and hyphen formats)
    const normalizedStage = stage?.replace(/-/g, '_')
    
    // Map stage values to normalized keys
    const stageMapping = {
      [constantsData.applicationStages.APPLIED]: 'applied',
      [constantsData.applicationStages.SHORTLISTED]: 'shortlisted',
      [constantsData.applicationStages.INTERVIEW_SCHEDULED]: 'interview_scheduled',
      [constantsData.applicationStages.INTERVIEW_PASSED]: 'interview_passed',
      'interview_failed': 'interview_failed',
      'interview_rescheduled': 'interview_rescheduled',
      'rejected': 'rejected',
      'withdrawn': 'withdrawn',
      'hired': 'hired'
    }
    
    const key = stageMapping[normalizedStage] || normalizedStage
    if (!key) return stage
    
    // If translation function provided, use it with the new key format
    if (t) {
      const result = t(`stages.${key}`)
      if (result !== `stages.${key}`) return result
    }
    
    // Fallback labels (English)
    const fallbackLabels = {
      'applied': 'Applied',
      'shortlisted': 'Shortlisted',
      'interview_scheduled': 'Interview Scheduled',
      'interview_passed': 'Interview Passed',
      'interview_failed': 'Interview Failed',
      'interview_rescheduled': 'Interview Rescheduled',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn',
      'hired': 'Hired'
    }
    
    return fallbackLabels[key] || stage
  }

  /**
   * Get label for interview status (i18n-aware)
   * @param {string} status - Status key
   * @param {Function} t - Translation function (optional, will use i18nService if not provided)
   * @returns {string} Formatted status label
   */
  getInterviewStatusLabel(status, t = null) {
    // Map status values to translation keys
    const translationKeys = {
      [constantsData.interviewStatuses.SCHEDULED]: 'scheduled',
      [constantsData.interviewStatuses.COMPLETED]: 'completed',
      [constantsData.interviewStatuses.CANCELLED]: 'cancelled',
      [constantsData.interviewStatuses.NO_SHOW]: 'noShow',
      'rescheduled': 'rescheduled', // Also support rescheduled
      'not_scheduled': 'notScheduled'
    }
    
    const key = translationKeys[status]
    if (!key) return status
    
    // If translation function provided, use it
    if (t) {
      return t(`status.${key}`)
    }
    
    // Otherwise, use i18nService directly
    try {
      // Try to get from interviews page translations
      const translated = i18nService.t(`interviews.status.${key}`)
      // If translation key is returned as-is, fall back to English
      if (translated === `interviews.status.${key}`) {
        const fallbackLabels = {
          'scheduled': 'Scheduled',
          'completed': 'Completed',
          'cancelled': 'Cancelled',
          'noShow': 'No Show',
          'rescheduled': 'Rescheduled',
          'notScheduled': 'Not Scheduled'
        }
        return fallbackLabels[key] || status
      }
      return translated
    } catch (error) {
      // Fallback to English if translation fails
      const fallbackLabels = {
        'scheduled': 'Scheduled',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'noShow': 'No Show',
        'rescheduled': 'Rescheduled',
        'notScheduled': 'Not Scheduled'
      }
      return fallbackLabels[key] || status
    }
  }

  /**
   * Get color for application stage
   * @param {string} stage - Stage key
   * @returns {string} CSS color class
   */
  getApplicationStageColor(stage) {
    const colors = {
      [constantsData.applicationStages.APPLIED]: 'blue',
      [constantsData.applicationStages.SHORTLISTED]: 'yellow',
      [constantsData.applicationStages.INTERVIEW_SCHEDULED]: 'purple',
      [constantsData.applicationStages.INTERVIEW_PASSED]: 'green'
    }
    return colors[stage] || 'gray'
  }

  /**
   * Get color for interview status
   * @param {string} status - Status key
   * @returns {string} CSS color class
   */
  getInterviewStatusColor(status) {
    const colors = {
      [constantsData.interviewStatuses.SCHEDULED]: 'blue',
      [constantsData.interviewStatuses.COMPLETED]: 'green',
      [constantsData.interviewStatuses.CANCELLED]: 'red',
      [constantsData.interviewStatuses.NO_SHOW]: 'orange'
    }
    return colors[status] || 'gray'
  }
}

// Create and export singleton instance
const constantsService = new ConstantsService()
export default constantsService

// Named exports for convenience
export const {
  getJobStatuses,
  getApplicationStages,
  getInterviewStatuses,
  getCountries,
  getJobCategories,
  getInterviewTypes,
  getEducationLevels,
  getGenders,
  getPriorities,
  getCurrencies,
  getAllConstants,
  getJobStatusLabel,
  getApplicationStageLabel,
  getInterviewStatusLabel,
  getApplicationStageColor,
  getInterviewStatusColor
} = constantsService