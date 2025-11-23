// Agency Service - Handles agency settings and profile operations
import agencyData from '../data/agency.json'
import agenciesData from '../data/agencies.json'
import auditService from './auditService.js'

// Utility function to simulate API delay (still used for some mock flows)
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation (0.1% chance - reduced for better development experience)
const shouldSimulateError = () => Math.random() < 0.001

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

// Backend API base URL for real profile integration (owner agency)
const API_BASE_URL = 'http://localhost:3000'

// Helper to build auth headers from stored token
const buildAuthHeaders = (extraHeaders = {}) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('udaan_token') : null
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// Local caches remain for multi-agency mock flows; single-agency profile will
// now be sourced from the backend and hydrated into this cache.
let agencyCache = null
let agenciesCache = deepClone(agenciesData.agencies)

class AgencyService {
  // ============================================
  // MULTI-AGENCY MANAGEMENT (Super Admin)
  // ============================================

  /**
   * Get all agencies with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of agencies
   */
  async getAllAgencies(filters = {}) {
    await delay(400)
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch agencies')
    }

    let agencies = deepClone(agenciesCache)

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      agencies = agencies.filter(a => a.status === filters.status)
    }

    if (filters.subscription && filters.subscription !== 'all') {
      agencies = agencies.filter(a => a.subscription.plan === filters.subscription)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      agencies = agencies.filter(a => 
        a.name.toLowerCase().includes(searchLower) ||
        a.license_number.toLowerCase().includes(searchLower) ||
        a.email.toLowerCase().includes(searchLower) ||
        a.owner_name.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    if (filters.sortBy) {
      agencies.sort((a, b) => {
        let aVal, bVal
        
        switch (filters.sortBy) {
          case 'name':
            aVal = a.name.toLowerCase()
            bVal = b.name.toLowerCase()
            break
          case 'created':
            aVal = new Date(a.created_at)
            bVal = new Date(b.created_at)
            break
          case 'jobs':
            aVal = a.statistics.total_jobs
            bVal = b.statistics.total_jobs
            break
          case 'applicants':
            aVal = a.statistics.active_applicants
            bVal = b.statistics.active_applicants
            break
          default:
            return 0
        }

        if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return agencies
  }

  /**
   * Get single agency by ID
   * @param {string} agencyId - Agency ID
   * @returns {Promise<Object>} Agency details
   */
  async getAgencyById(agencyId) {
    await delay(300)
    
    if (shouldSimulateError()) {
      throw new Error('Failed to fetch agency details')
    }

    const agency = agenciesCache.find(a => a.id === agencyId)
    
    if (!agency) {
      throw new Error('Agency not found')
    }

    return deepClone(agency)
  }

  /**
   * Update agency status
   * @param {string} agencyId - Agency ID
   * @param {string} status - New status (active, inactive)
   * @returns {Promise<Object>} Updated agency
   */
  async updateAgencyStatus(agencyId, status) {
    await delay(400)
    
    if (shouldSimulateError()) {
      throw new Error('Failed to update agency status')
    }

    const index = agenciesCache.findIndex(a => a.id === agencyId)
    
    if (index === -1) {
      throw new Error('Agency not found')
    }

    agenciesCache[index] = {
      ...agenciesCache[index],
      status,
      updated_at: new Date().toISOString()
    }

    return deepClone(agenciesCache[index])
  }

  /**
   * Delete agency
   * @param {string} agencyId - Agency ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAgency(agencyId) {
    await delay(500)
    
    if (shouldSimulateError()) {
      throw new Error('Failed to delete agency')
    }

    const index = agenciesCache.findIndex(a => a.id === agencyId)
    
    if (index === -1) {
      throw new Error('Agency not found')
    }

    agenciesCache.splice(index, 1)
    return true
  }

  /**
   * Bulk update agency status
   * @param {Array<string>} agencyIds - Array of agency IDs
   * @param {string} status - New status
   * @returns {Promise<Object>} Result with success and failed IDs
   */
  async bulkUpdateStatus(agencyIds, status) {
    await delay(600)
    
    const results = {
      success: [],
      failed: []
    }

    for (const id of agencyIds) {
      try {
        await this.updateAgencyStatus(id, status)
        results.success.push(id)
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    return results
  }

  /**
   * Bulk delete agencies
   * @param {Array<string>} agencyIds - Array of agency IDs
   * @returns {Promise<Object>} Result with success and failed IDs
   */
  async bulkDeleteAgencies(agencyIds) {
    await delay(800)
    
    const results = {
      success: [],
      failed: []
    }

    for (const id of agencyIds) {
      try {
        await this.deleteAgency(id)
        results.success.push(id)
      } catch (error) {
        results.failed.push({ id, error: error.message })
      }
    }

    return results
  }

  /**
   * Get agency analytics
   * @param {string} agencyId - Agency ID
   * @returns {Promise<Object>} Agency analytics data
   */
  async getAgencyAnalytics(agencyId) {
    await delay(400)
    
    const agency = await this.getAgencyById(agencyId)
    
    // Calculate additional analytics
    const avgApplicationsPerJob = agency.statistics.total_jobs > 0 
      ? Math.round(agency.statistics.total_applications / agency.statistics.total_jobs)
      : 0

    const activeApplicantRate = agency.statistics.total_applications > 0
      ? Math.round((agency.statistics.active_applicants / agency.statistics.total_applications) * 100)
      : 0

    return {
      ...agency.statistics,
      avg_applications_per_job: avgApplicationsPerJob,
      active_applicant_rate: activeApplicantRate
    }
  }

  /**
   * Get platform-wide statistics
   * @returns {Promise<Object>} Platform statistics
   */
  async getPlatformStatistics() {
    await delay(300)
    
    const agencies = deepClone(agenciesCache)
    
    return {
      total_agencies: agencies.length,
      active_agencies: agencies.filter(a => a.status === 'active').length,
      inactive_agencies: agencies.filter(a => a.status === 'inactive').length,
      total_jobs: agencies.reduce((sum, a) => sum + a.statistics.total_jobs, 0),
      active_jobs: agencies.reduce((sum, a) => sum + a.statistics.active_jobs, 0),
      total_applications: agencies.reduce((sum, a) => sum + a.statistics.total_applications, 0),
      active_applicants: agencies.reduce((sum, a) => sum + a.statistics.active_applicants, 0),
      total_recruiters: agencies.reduce((sum, a) => sum + a.statistics.active_recruiters, 0)
    }
  }

  /**
   * Calculate days until subscription expiry
   * @param {string} expiryDate - Expiry date string
   * @returns {number} Days until expiry
   */
  calculateDaysUntilExpiry(expiryDate) {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // ============================================
  // SINGLE AGENCY PROFILE MANAGEMENT
  // ============================================

  /**
   * Get agency profile
   * @returns {Promise<Object>} Agency profile data
   */
  async getAgencyProfile() {
    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency`, {
      method: 'GET',
      headers: buildAuthHeaders({ 'Accept': 'application/json' })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to load agency profile')
    }

    const data = await response.json()

    // Keep a local cache for subsequent calls
    agencyCache = {
      ...data,
      // Provide flattened fields for UI compatibility
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Update location information (address and optional coordinates)
   * @param {Object} locationInfo - Location information to update
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated profile
   */
  async updateLocation(locationInfo, auditInfo = {}) {
    const payload = {
      address: locationInfo.address,
      latitude: locationInfo.latitude,
      longitude: locationInfo.longitude
    }

    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency/location`, {
      method: 'PATCH',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to update location')
    }

    const data = await response.json()

    agencyCache = {
      ...data,
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Update agency profile
   * @param {Object} updateData - Data to update
   * @param {Object} auditInfo - Audit information (user, section, etc.)
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateAgencyProfile(updateData, auditInfo = {}) {
    // This generic helper is now only used by flows that still rely on the
    // local mock cache (e.g. certifications/contact persons). For the main
    // profile tabs we call specific backend endpoints instead.
    await delay(200)

    const oldData = deepClone(agencyCache || agencyData)

    agencyCache = {
      ...(agencyCache || agencyData),
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const newData = deepClone(agencyCache)

    if (auditInfo.user) {
      await auditService.logAgencyUpdate({
        user: auditInfo.user,
        oldData,
        newData,
        section: auditInfo.section || 'general',
        changes: updateData
      })
    }

    return newData
  }

  /**
   * Get agency basic information
   * @returns {Promise<Object>} Basic agency information
   */
  async getAgencyBasicInfo() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    
    return {
      id: profile.id,
      name: profile.name,
      address: profile.address,
      phone: profile.phone,
      mobile: profile.mobile,
      email: profile.email,
      website: profile.website,
      logo_url: profile.logo_url,
      established_year: profile.established_year
    }
  }

  /**
   * Update basic agency information
   * @param {Object} basicInfo - Basic information to update
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated basic information
   */
  async updateBasicInfo(basicInfo, auditInfo = {}) {
    const payload = {
      name: basicInfo.name,
      description: basicInfo.description,
      established_year: basicInfo.established_year,
      license_number: basicInfo.license_number
    }

    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency/basic`, {
      method: 'PATCH',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to update basic information')
    }

    const data = await response.json()

    // Normalize and cache updated profile
    agencyCache = {
      ...data,
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Get agency contact information
   * @returns {Promise<Object>} Contact information
   */
  async getContactInfo() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    
    return {
      phone: profile.phone,
      mobile: profile.mobile,
      email: profile.email,
      website: profile.website,
      address: profile.address,
      contact_persons: profile.contact_persons
    }
  }

  /**
   * Update contact information
   * @param {Object} contactInfo - Contact information to update
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated contact information
   */
  async updateContactInfo(contactInfo, auditInfo = {}) {
    const payload = {
      phone: contactInfo.phone,
      mobile: contactInfo.mobile,
      email: contactInfo.email,
      website: contactInfo.website,
      contact_persons: contactInfo.contact_persons
    }

    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency/contact`, {
      method: 'PATCH',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to update contact information')
    }

    const data = await response.json()

    agencyCache = {
      ...data,
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Get agency certifications
   * @returns {Promise<Array>} Array of certifications
   */
  async getCertifications() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.certifications || []
  }

  /**
   * Add new certification
   * @param {Object} certification - Certification data
   * @returns {Promise<Object>} Updated agency profile
   */
  async addCertification(certification) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const newCertification = {
      ...certification,
      id: `cert_${Date.now()}`,
      added_at: new Date().toISOString()
    }

    const updatedCertifications = [...(profile.certifications || []), newCertification]
    
    return this.updateAgencyProfile({
      certifications: updatedCertifications
    })
  }

  /**
   * Update certification
   * @param {string} certificationId - Certification ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateCertification(certificationId, updateData) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const certifications = profile.certifications?.map(cert => 
      cert.id === certificationId 
        ? { ...cert, ...updateData, updated_at: new Date().toISOString() }
        : cert
    ) || []

    return this.updateAgencyProfile({
      certifications
    })
  }

  /**
   * Remove certification
   * @param {string} certificationId - Certification ID
   * @returns {Promise<Object>} Updated agency profile
   */
  async removeCertification(certificationId) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const certifications = profile.certifications?.filter(cert => 
      cert.id !== certificationId
    ) || []

    return this.updateAgencyProfile({
      certifications
    })
  }

  /**
   * Get social media links
   * @returns {Promise<Object>} Social media information
   */
  async getSocialMedia() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.social_media || {}
  }

  /**
   * Update social media links
   * @param {Object} socialMedia - Social media links
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateSocialMedia(socialMedia, auditInfo = {}) {
    const payload = {
      social_media: socialMedia
    }

    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency/social-media`, {
      method: 'PATCH',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to update social media')
    }

    const data = await response.json()

    agencyCache = {
      ...data,
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Get bank details
   * @returns {Promise<Object>} Bank account information
   */
  async getBankDetails() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.bank_details || {}
  }

  /**
   * Update bank details
   * @param {Object} bankDetails - Bank account information
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateBankDetails(bankDetails) {
    await delay(300)
    return this.updateAgencyProfile({
      bank_details: bankDetails
    })
  }

  /**
   * Get contact persons
   * @returns {Promise<Array>} Array of contact persons
   */
  async getContactPersons() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.contact_persons || []
  }

  /**
   * Add contact person
   * @param {Object} contactPerson - Contact person data
   * @returns {Promise<Object>} Updated agency profile
   */
  async addContactPerson(contactPerson) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const newContactPerson = {
      ...contactPerson,
      id: `contact_${Date.now()}`,
      added_at: new Date().toISOString()
    }

    const updatedContactPersons = [...(profile.contact_persons || []), newContactPerson]
    
    return this.updateAgencyProfile({
      contact_persons: updatedContactPersons
    })
  }

  /**
   * Update contact person
   * @param {string} contactId - Contact person ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateContactPerson(contactId, updateData) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const contactPersons = profile.contact_persons?.map(contact => 
      contact.id === contactId 
        ? { ...contact, ...updateData, updated_at: new Date().toISOString() }
        : contact
    ) || []

    return this.updateAgencyProfile({
      contact_persons: contactPersons
    })
  }

  /**
   * Remove contact person
   * @param {string} contactId - Contact person ID
   * @returns {Promise<Object>} Updated agency profile
   */
  async removeContactPerson(contactId) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const contactPersons = profile.contact_persons?.filter(contact => 
      contact.id !== contactId
    ) || []

    return this.updateAgencyProfile({
      contact_persons: contactPersons
    })
  }

  /**
   * Get agency settings
   * @returns {Promise<Object>} Agency settings
   */
  async getSettings() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.settings || {}
  }

  /**
   * Update agency settings
   * @param {Object} settings - Settings to update
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateSettings(settings, auditInfo = {}) {
    // Merge with current settings client-side to send full object to backend
    const currentProfile = await this.getAgencyProfile()
    const mergedSettings = {
      ...(currentProfile.settings || {}),
      ...settings
    }

    const payload = {
      settings: mergedSettings
    }

    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency/settings`, {
      method: 'PATCH',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to update settings')
    }

    const data = await response.json()

    agencyCache = {
      ...data,
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Get agency statistics
   * @returns {Promise<Object>} Agency statistics
   */
  async getStatistics() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.statistics || {}
  }

  /**
   * Update statistics
   * @param {Object} stats - Statistics to update
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateStatistics(stats) {
    await delay(300)
    const profile = await this.getAgencyProfile()
    
    const updatedStats = {
      ...profile.statistics,
      ...stats
    }

    return this.updateAgencyProfile({
      statistics: updatedStats
    })
  }

  /**
   * Upload agency logo
   * @param {File} logoFile - Logo file
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated agency profile with new logo URL
   */
  async uploadLogo(logoFile, auditInfo = {}) {
    const profile = await this.getAgencyProfile()
    const license = profile.license_number

    if (!license) {
      throw new Error('Agency license number not available for logo upload')
    }

    const formData = new FormData()
    formData.append('file', logoFile)

    const response = await fetch(`${API_BASE_URL}/agencies/${encodeURIComponent(license)}/logo`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to upload logo')
    }

    // Backend returns upload result; fetch the updated profile for UI
    const updatedProfile = await this.getAgencyProfile()
    return updatedProfile
  }

  /**
   * Upload agency banner
   * @param {File} bannerFile - Banner file
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated agency profile with new banner URL
   */
  async uploadBanner(bannerFile, auditInfo = {}) {
    const profile = await this.getAgencyProfile()
    const license = profile.license_number

    if (!license) {
      throw new Error('Agency license number not available for banner upload')
    }

    const formData = new FormData()
    formData.append('file', bannerFile)

    const response = await fetch(`${API_BASE_URL}/agencies/${encodeURIComponent(license)}/banner`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to upload banner')
    }

    const updatedProfile = await this.getAgencyProfile()
    return updatedProfile
  }

  /**
   * Get agency specializations
   * @returns {Promise<Array>} Array of specializations
   */
  async getSpecializations() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.specializations || []
  }

  /**
   * Update specializations
   * @param {Array} specializations - Array of specialization names
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateSpecializations(specializations, auditInfo = {}) {
    const currentProfile = await this.getAgencyProfile()
    const payload = {
      services: currentProfile.services || [],
      specializations,
      target_countries: currentProfile.target_countries || []
    }

    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency/services`, {
      method: 'PATCH',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to update specializations')
    }

    const data = await response.json()
    agencyCache = {
      ...data,
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Get target countries
   * @returns {Promise<Array>} Array of target countries
   */
  async getTargetCountries() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.target_countries || []
  }

  /**
   * Update target countries
   * @param {Array} countries - Array of country names
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateTargetCountries(countries, auditInfo = {}) {
    const currentProfile = await this.getAgencyProfile()
    const payload = {
      services: currentProfile.services || [],
      specializations: currentProfile.specializations || [],
      target_countries: countries
    }

    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency/services`, {
      method: 'PATCH',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to update target countries')
    }

    const data = await response.json()
    agencyCache = {
      ...data,
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Get agency services
   * @returns {Promise<Array>} Array of services offered
   */
  async getServices() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.services || []
  }

  /**
   * Update services
   * @param {Array} services - Array of service names
   * @param {Object} auditInfo - Audit information
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateServices(services, auditInfo = {}) {
    const currentProfile = await this.getAgencyProfile()
    const payload = {
      services,
      specializations: currentProfile.specializations || [],
      target_countries: currentProfile.target_countries || []
    }

    const response = await fetch(`${API_BASE_URL}/agencies/owner/agency/services`, {
      method: 'PATCH',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(errorText || 'Failed to update services')
    }

    const data = await response.json()
    agencyCache = {
      ...data,
      phone: data.phones?.[0] || null,
      mobile: data.phones?.[1] || null,
      email: data.emails?.[0] || null,
    }

    return deepClone(agencyCache)
  }

  /**
   * Get operating hours
   * @returns {Promise<Object>} Operating hours information
   */
  async getOperatingHours() {
    await delay(150)
    const profile = await this.getAgencyProfile()
    return profile.operating_hours || {}
  }

  /**
   * Update operating hours
   * @param {Object} operatingHours - Operating hours data
   * @returns {Promise<Object>} Updated agency profile
   */
  async updateOperatingHours(operatingHours) {
    await delay(300)
    return this.updateAgencyProfile({
      operating_hours: operatingHours
    })
  }

  /**
   * Validate agency data
   * @param {Object} agencyData - Agency data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateAgencyData(agencyData) {
    await delay(200)
    
    const errors = []
    const warnings = []

    // Required fields validation
    if (!agencyData.name) errors.push('Agency name is required')
    if (!agencyData.email) errors.push('Email is required')
    if (!agencyData.phone) errors.push('Phone number is required')
    if (!agencyData.address) errors.push('Address is required')
    if (!agencyData.license_number) errors.push('License number is required')

    // Email validation
    if (agencyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyData.email)) {
      errors.push('Invalid email format')
    }

    // Phone validation
    if (agencyData.phone && !/^\+?[\d\s-()]+$/.test(agencyData.phone)) {
      warnings.push('Phone number format should be validated')
    }

    // Certification expiry warnings
    if (agencyData.certifications) {
      agencyData.certifications.forEach(cert => {
        if (cert.expiry_date) {
          const expiryDate = new Date(cert.expiry_date)
          const warningDate = new Date()
          warningDate.setDate(warningDate.getDate() + 30) // 30 days warning

          if (expiryDate < warningDate) {
            warnings.push(`Certification "${cert.name}" expires soon`)
          }
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

// Create and export singleton instance
const agencyService = new AgencyService()
export default agencyService