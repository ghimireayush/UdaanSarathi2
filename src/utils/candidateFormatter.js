/**
 * Candidate Data Formatter Utility
 * 
 * Formats candidate data from backend format to display format.
 */

/**
 * Format experience data from backend format to display string
 * @param {string|Array} experience - Experience data (string or array of objects)
 * @returns {string} Formatted experience string
 */
export const formatExperience = (experience) => {
  // If already a string, return as is
  if (typeof experience === 'string') {
    return experience
  }
  
  // If array, calculate total experience
  if (Array.isArray(experience) && experience.length > 0) {
    // Sum up all months
    const totalMonths = experience.reduce((sum, exp) => {
      return sum + (exp.months || 0)
    }, 0)
    
    // Convert to years
    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12
    
    if (years === 0 && months === 0) {
      return 'No experience'
    }
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`
    }
    
    if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`
    }
    
    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
  }
  
  // Fallback
  return 'Experience not specified'
}

/**
 * Get experience details for tooltip or expanded view
 * @param {string|Array} experience - Experience data
 * @returns {Array} Array of experience objects
 */
export const getExperienceDetails = (experience) => {
  if (Array.isArray(experience)) {
    return experience
  }
  return []
}

/**
 * Format location from backend format
 * @param {Object|string} location - Location data
 * @returns {string} Formatted location string
 */
export const formatLocation = (location) => {
  if (typeof location === 'string') {
    return location
  }
  
  if (location && typeof location === 'object') {
    const { city, country } = location
    if (city && country) {
      return `${city}, ${country}`
    }
    if (city) return city
    if (country) return country
  }
  
  return 'Location not specified'
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return 'No phone'
  
  // Remove any non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // If starts with country code, format nicely
  if (cleaned.startsWith('+977')) {
    // Nepal format: +977-9841234567
    return cleaned.replace(/(\+977)(\d{3})(\d{7})/, '$1-$2$3')
  }
  
  return cleaned
}

/**
 * Calculate total experience in years from experience array
 * @param {Array} experience - Experience array
 * @returns {number} Total years of experience
 */
export const getTotalExperienceYears = (experience) => {
  if (!Array.isArray(experience)) return 0
  
  const totalMonths = experience.reduce((sum, exp) => {
    return sum + (exp.months || 0)
  }, 0)
  
  return Math.floor(totalMonths / 12)
}

/**
 * Get most recent job title from experience
 * @param {Array} experience - Experience array
 * @returns {string} Most recent job title
 */
export const getMostRecentJobTitle = (experience) => {
  if (!Array.isArray(experience) || experience.length === 0) {
    return null
  }
  
  // Assuming first item is most recent (backend should sort)
  return experience[0].title || null
}

/**
 * Safely format a date string
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string for date-fns
 * @param {string} fallback - Fallback text if date is invalid
 * @returns {string} Formatted date or fallback
 */
export const safeFormatDate = (date, formatStr = 'MMM dd, yyyy', fallback = 'Date not available') => {
  if (!date) return fallback
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback
    }
    
    // Use date-fns format (needs to be imported where used)
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  } catch (error) {
    console.warn('Error formatting date:', error)
    return fallback
  }
}

export default {
  formatExperience,
  getExperienceDetails,
  formatLocation,
  formatPhone,
  getTotalExperienceYears,
  getMostRecentJobTitle,
  safeFormatDate,
}
