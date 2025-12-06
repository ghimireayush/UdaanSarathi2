import httpClient from '../config/httpClient.js'

/**
 * Member Data Source
 * Handles all API calls related to team member management
 */
class MemberDataSource {
  /**
   * Invite a new member
   * @param {Object} memberData - Member data
   * @param {string} memberData.full_name - Full name
   * @param {string} memberData.phone - Phone number
   * @param {string} memberData.role - Role (staff, admin, manager)
   * @returns {Promise<Object>} Response with member details and dev_password
   */
  async inviteMember(memberData) {
    return httpClient.post('/agencies/owner/members/invite', {
      full_name: memberData.full_name,
      phone: memberData.phone,
      role: memberData.role
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Get list of members with optional filters
   * @param {Object} filters - Filter options
   * @param {string} filters.search - Search term
   * @param {string} filters.role - Role filter
   * @param {string} filters.status - Status filter
   * @returns {Promise<Array>} Array of members
   */
  async getMembersList(filters = {}) {
    const queryParams = new URLSearchParams()
    
    if (filters.search) {
      queryParams.append('search', filters.search)
    }
    if (filters.role) {
      queryParams.append('role', filters.role)
    }
    if (filters.status) {
      queryParams.append('status', filters.status)
    }
    
    const queryString = queryParams.toString()
    const endpoint = queryString 
      ? `/agencies/owner/members?${queryString}`
      : '/agencies/owner/members'
    
    return httpClient.get(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Delete a member
   * @param {string} memberId - Member ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteMember(memberId) {
    return httpClient.delete(`/agencies/owner/members/${memberId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * Update member status
   * @param {string} memberId - Member ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated member
   */
  async updateMemberStatus(memberId, status) {
    return httpClient.patch(`/agencies/owner/members/${memberId}/status`, {
      status
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }
}

export default new MemberDataSource()
