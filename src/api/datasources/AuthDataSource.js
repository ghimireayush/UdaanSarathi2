import httpClient from '../config/httpClient.js'

/**
 * Authentication Data Source
 * Handles all API calls related to authentication and authorization
 */
class AuthDataSource {
  /**
   * Register owner with backend (start OTP flow)
   * @param {Object} data - Registration data
   * @param {string} data.fullName - Full name
   * @param {string} data.phone - Phone number
   * @returns {Promise<Object>} Response with dev_otp
   */
  async registerOwner({ fullName, phone }) {
    return httpClient.post('/agency/register-owner', {
      full_name: fullName,
      phone
    }, { requireAuth: false })
  }

  /**
   * Verify owner registration OTP
   * @param {Object} data - Verification data
   * @param {string} data.phone - Phone number
   * @param {string} data.otp - OTP code
   * @returns {Promise<Object>} Response with token, user_id, agency_id, user_type, phone, full_name
   */
  async verifyOwner({ phone, otp }) {
    return httpClient.post('/agency/verify-owner', {
      phone,
      otp
    }, { requireAuth: false })
  }

  /**
   * Start login OTP flow (admin portal)
   * @param {Object} data - Login data
   * @param {string} data.phone - Phone number
   * @returns {Promise<Object>} Response with dev_otp
   */
  async loginStart({ phone }) {
    return httpClient.post('/login/start', { phone }, { requireAuth: false })
  }

  /**
   * Verify login OTP (admin portal)
   * @param {Object} data - Verification data
   * @param {string} data.phone - Phone number
   * @param {string} data.otp - OTP code
   * @returns {Promise<Object>} Response with token, user_id, candidate_id, candidate
   */
  async loginVerify({ phone, otp }) {
    return httpClient.post('/login/verify', {
      phone,
      otp
    }, { requireAuth: false })
  }

  /**
   * Start owner login OTP flow
   * @param {Object} data - Login data
   * @param {string} data.phone - Phone number
   * @returns {Promise<Object>} Response with dev_otp
   */
  async loginStartOwner({ phone }) {
    return httpClient.post('/agency/login/start-owner', { phone }, { requireAuth: false })
  }

  /**
   * Verify owner login OTP
   * @param {Object} data - Verification data
   * @param {string} data.phone - Phone number
   * @param {string} data.otp - OTP code
   * @returns {Promise<Object>} Response with token, user_id, agency_id, user_type, phone, full_name, role
   */
  async loginVerifyOwner({ phone, otp }) {
    return httpClient.post('/agency/login/verify-owner', {
      phone,
      otp
    }, { requireAuth: false })
  }

  /**
   * Member login with password
   * @param {Object} data - Login data
   * @param {string} data.phone - Phone number
   * @param {string} data.password - Password
   * @returns {Promise<Object>} Response with token, user_id, agency_id, user_type
   */
  async memberLogin({ phone, password }) {
    return httpClient.post('/member/login', {
      phone,
      password
    }, { requireAuth: false })
  }

  /**
   * Start member login OTP flow
   * @param {Object} data - Login data
   * @param {string} data.phone - Phone number
   * @returns {Promise<Object>} Response with dev_otp
   */
  async memberLoginStart({ phone }) {
    return httpClient.post('/member/login/start', { phone }, { requireAuth: false })
  }

  /**
   * Verify member login OTP
   * @param {Object} data - Verification data
   * @param {string} data.phone - Phone number
   * @param {string} data.otp - OTP code
   * @returns {Promise<Object>} Response with token, user_id, agency_id, user_type, phone, full_name
   */
  async memberLoginVerify({ phone, otp }) {
    return httpClient.post('/member/login/verify', {
      phone,
      otp
    }, { requireAuth: false })
  }

  /**
   * Create agency (company)
   * @param {Object} companyData - Company data
   * @param {string} companyData.companyName - Company name
   * @param {string} companyData.registrationNumber - License number
   * @param {string} companyData.address - Address
   * @param {string} companyData.city - City
   * @param {string} companyData.country - Country
   * @param {string} companyData.phone - Phone number
   * @param {string} companyData.website - Website URL
   * @param {string} companyData.description - Description
   * @returns {Promise<Object>} Response with id, license_number
   */
  async createAgency(companyData) {
    return httpClient.post('/agencies/owner/agency', {
      name: companyData.companyName,
      license_number: companyData.registrationNumber,
      address: companyData.address,
      city: companyData.city,
      country: companyData.country,
      phone: companyData.phone,
      website: companyData.website,
      description: companyData.description
    })
  }
}

export default new AuthDataSource()
