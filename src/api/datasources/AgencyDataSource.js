import httpClient from '../config/httpClient.js'

/**
 * Agency Data Source
 * Handles all API calls related to agency profile and settings
 */
class AgencyDataSource {
  /**
   * Get agency profile
   * @returns {Promise<Object>} Agency profile data
   */
  async getAgencyProfile() {
    return httpClient.get('/agencies/owner/agency', {
      headers: { 'Accept': 'application/json' }
    })
  }

  /**
   * Update location information (address and optional coordinates)
   * @param {Object} locationInfo - Location information to update
   * @param {string} locationInfo.address - Address
   * @param {number} locationInfo.latitude - Latitude
   * @param {number} locationInfo.longitude - Longitude
   * @returns {Promise<Object>} Updated profile
   */
  async updateLocation(locationInfo) {
    return httpClient.patch('/agencies/owner/agency/location', {
      address: locationInfo.address,
      latitude: locationInfo.latitude,
      longitude: locationInfo.longitude
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Update basic agency information
   * @param {Object} basicInfo - Basic information to update
   * @param {string} basicInfo.name - Agency name
   * @param {string} basicInfo.description - Description
   * @param {number} basicInfo.established_year - Established year
   * @param {string} basicInfo.license_number - License number
   * @returns {Promise<Object>} Updated profile
   */
  async updateBasicInfo(basicInfo) {
    return httpClient.patch('/agencies/owner/agency/basic', {
      name: basicInfo.name,
      description: basicInfo.description,
      established_year: basicInfo.established_year,
      license_number: basicInfo.license_number
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Update contact information
   * @param {Object} contactInfo - Contact information to update
   * @param {string} contactInfo.phone - Phone number
   * @param {string} contactInfo.mobile - Mobile number
   * @param {string} contactInfo.email - Email address
   * @param {string} contactInfo.website - Website URL
   * @param {Array} contactInfo.contact_persons - Contact persons array
   * @returns {Promise<Object>} Updated profile
   */
  async updateContactInfo(contactInfo) {
    return httpClient.patch('/agencies/owner/agency/contact', {
      phone: contactInfo.phone,
      mobile: contactInfo.mobile,
      email: contactInfo.email,
      website: contactInfo.website,
      contact_persons: contactInfo.contact_persons
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Update social media links
   * @param {Object} socialMedia - Social media links
   * @returns {Promise<Object>} Updated profile
   */
  async updateSocialMedia(socialMedia) {
    return httpClient.patch('/agencies/owner/agency/social-media', {
      social_media: socialMedia
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Update agency settings
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateSettings(settings) {
    return httpClient.patch('/agencies/owner/agency/settings', {
      settings
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Upload agency logo
   * @param {string} license - Agency license number
   * @param {File} logoFile - Logo file
   * @returns {Promise<Object>} Upload result
   */
  async uploadLogo(license, logoFile) {
    const formData = new FormData()
    formData.append('file', logoFile)
    
    return httpClient.upload(`/agencies/${encodeURIComponent(license)}/logo`, formData)
  }

  /**
   * Upload agency banner
   * @param {string} license - Agency license number
   * @param {File} bannerFile - Banner file
   * @returns {Promise<Object>} Upload result
   */
  async uploadBanner(license, bannerFile) {
    const formData = new FormData()
    formData.append('file', bannerFile)
    
    return httpClient.upload(`/agencies/${encodeURIComponent(license)}/banner`, formData)
  }

  /**
   * Update specializations
   * @param {Array} specializations - Array of specialization names
   * @param {Array} services - Array of service names
   * @param {Array} targetCountries - Array of target countries
   * @returns {Promise<Object>} Updated profile
   */
  async updateSpecializations(specializations, services, targetCountries) {
    return httpClient.patch('/agencies/owner/agency/services', {
      services,
      specializations,
      target_countries: targetCountries
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Update target countries
   * @param {Array} countries - Array of country names
   * @param {Array} services - Array of service names
   * @param {Array} specializations - Array of specializations
   * @returns {Promise<Object>} Updated profile
   */
  async updateTargetCountries(countries, services, specializations) {
    return httpClient.patch('/agencies/owner/agency/services', {
      services,
      specializations,
      target_countries: countries
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Update services
   * @param {Array} services - Array of service names
   * @param {Array} specializations - Array of specializations
   * @param {Array} targetCountries - Array of target countries
   * @returns {Promise<Object>} Updated profile
   */
  async updateServices(services, specializations, targetCountries) {
    return httpClient.patch('/agencies/owner/agency/services', {
      services,
      specializations,
      target_countries: targetCountries
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }
}

export default new AgencyDataSource()
