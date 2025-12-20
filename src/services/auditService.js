// Audit Service - Connects to backend audit logging API
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dev.kaha.com.np/job-portal';

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return typeof localStorage !== 'undefined' 
    ? localStorage.getItem('udaan_token') 
    : null;
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Audit categories for filtering
 */
export const AUDIT_CATEGORIES = {
  AUTH: 'auth',
  APPLICATION: 'application',
  JOB_POSTING: 'job_posting',
  AGENCY: 'agency',
  CANDIDATE: 'candidate',
  INTERVIEW: 'interview',
  ADMIN: 'admin',
  SYSTEM: 'system',
};

/**
 * Audit actions for filtering
 */
export const AUDIT_ACTIONS = {
  // Auth
  REGISTER: 'register',
  LOGIN_START: 'login_start',
  LOGIN_VERIFY: 'login_verify',
  LOGOUT: 'logout',
  
  // Application workflow
  APPLY_JOB: 'apply_job',
  SHORTLIST_CANDIDATE: 'shortlist_candidate',
  SCHEDULE_INTERVIEW: 'schedule_interview',
  RESCHEDULE_INTERVIEW: 'reschedule_interview',
  COMPLETE_INTERVIEW: 'complete_interview',
  WITHDRAW_APPLICATION: 'withdraw_application',
  REJECT_APPLICATION: 'reject_application',
  
  // Job posting
  CREATE_JOB_POSTING: 'create_job_posting',
  UPDATE_JOB_POSTING: 'update_job_posting',
  CLOSE_JOB_POSTING: 'close_job_posting',
  UPDATE_JOB_TAGS: 'update_job_tags',
  
  // Agency
  CREATE_AGENCY: 'create_agency',
  UPDATE_AGENCY: 'update_agency',
  ADD_TEAM_MEMBER: 'add_team_member',
  REMOVE_TEAM_MEMBER: 'remove_team_member',
  
  // Candidate
  CREATE_PROFILE: 'create_profile',
  UPDATE_PROFILE: 'update_profile',
  UPDATE_JOB_PROFILE: 'update_job_profile',
};

class AuditService {
  /**
   * Query audit logs from backend with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated audit logs
   */
  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.action) params.append('action', filters.action);
    if (filters.resourceType) params.append('resource_type', filters.resourceType);
    if (filters.resourceId) params.append('resource_id', filters.resourceId);
    if (filters.outcome) params.append('outcome', filters.outcome);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    const endpoint = `/audit/logs${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest(endpoint);
  }

  /**
   * Get recent activity timeline
   * @param {number} limit - Number of events to fetch
   * @returns {Promise<Array>} Recent audit events
   */
  async getTimeline(limit = 20) {
    return apiRequest(`/audit/timeline?limit=${limit}`);
  }

  /**
   * Get category summary for dashboard
   * @param {string} startDate - Start date (ISO 8601)
   * @param {string} endDate - End date (ISO 8601)
   * @returns {Promise<Object>} Category counts
   */
  async getCategorySummary(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    return apiRequest(`/audit/summary${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Get audit history for a specific resource
   * @param {string} resourceType - Resource type
   * @param {string} resourceId - Resource ID
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Resource audit history
   */
  async getResourceHistory(resourceType, resourceId, limit = 50) {
    return apiRequest(`/audit/resources/${resourceType}/${resourceId}?limit=${limit}`);
  }

  /**
   * Get audit history for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User activity history
   */
  async getUserActivity(userId, options = {}) {
    const params = new URLSearchParams();
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);
    if (options.limit) params.append('limit', options.limit);
    
    const queryString = params.toString();
    return apiRequest(`/audit/users/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Check if audit API is available
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    return apiRequest('/audit/health');
  }

  // ============================================
  // Helper methods for formatting and display
  // ============================================

  /**
   * Format audit log for display
   * @param {Object} auditLog - Audit log entry
   * @returns {Object} Formatted audit log
   */
  formatAuditLog(auditLog) {
    return {
      ...auditLog,
      timestamp_formatted: auditLog.created_at 
        ? format(new Date(auditLog.created_at), 'PPpp')
        : 'Unknown',
      action_label: this.getActionLabel(auditLog.action),
      category_label: this.getCategoryLabel(auditLog.category),
      outcome_color: this.getOutcomeColor(auditLog.outcome),
    };
  }

  /**
   * Get human-readable action label
   * Prefers backend description if available, falls back to local mapping
   * @param {string} action - Action code
   * @param {Object} log - Full log object (optional, may contain description from backend)
   * @returns {string} Action label
   */
  getActionLabel(action, log = null) {
    // Use backend description if available
    if (log?.description) {
      return log.description;
    }
    
    const labels = {
      'register': 'New account registered',
      'login_start': 'Login initiated',
      'login_verify': 'Login completed',
      'logout': 'Logged out',
      'apply_job': 'Applied for a job position',
      'shortlist_candidate': 'Candidate shortlisted for interview',
      'schedule_interview': 'Interview scheduled',
      'reschedule_interview': 'Interview rescheduled',
      'complete_interview': 'Interview completed',
      'withdraw_application': 'Application withdrawn',
      'reject_application': 'Application rejected',
      'create_job_posting': 'New job posting created',
      'update_job_posting': 'Job posting updated',
      'close_job_posting': 'Job posting closed',
      'update_job_tags': 'Job requirements updated',
      'create_agency': 'Agency profile created',
      'update_agency': 'Agency profile updated',
      'add_team_member': 'Team member added',
      'remove_team_member': 'Team member removed',
      'create_profile': 'Candidate profile created',
      'update_profile': 'Profile information updated',
      'update_job_profile': 'Job preferences updated',
    };
    return labels[action] || action?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown action';
  }

  /**
   * Get human-readable category label
   * Prefers backend category_label if available
   * @param {string} category - Category code
   * @param {Object} log - Full log object (optional, may contain category_label from backend)
   * @returns {string} Category label
   */
  getCategoryLabel(category, log = null) {
    // Use backend category_label if available
    if (log?.category_label) {
      return log.category_label;
    }
    
    const labels = {
      'auth': 'Authentication',
      'application': 'Job Applications',
      'job_posting': 'Job Postings',
      'agency': 'Agency Management',
      'candidate': 'Candidate Profiles',
      'interview': 'Interviews',
      'admin': 'Administration',
      'system': 'System',
    };
    return labels[category] || category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  /**
   * Get color class for outcome
   * @param {string} outcome - Outcome (success/failure/denied)
   * @returns {string} Tailwind color class
   */
  getOutcomeColor(outcome) {
    const colors = {
      'success': 'text-green-600 bg-green-50 border-green-200',
      'failure': 'text-red-600 bg-red-50 border-red-200',
      'denied': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    };
    return colors[outcome] || 'text-gray-600 bg-gray-50 border-gray-200';
  }

  /**
   * Get icon for category
   * @param {string} category - Category code
   * @returns {string} Lucide icon name
   */
  getCategoryIcon(category) {
    const icons = {
      'auth': 'Shield',
      'application': 'FileText',
      'job_posting': 'Briefcase',
      'agency': 'Building2',
      'candidate': 'User',
      'interview': 'Calendar',
      'admin': 'Settings',
      'system': 'Server',
    };
    return icons[category] || 'Activity';
  }
}

// Create and export singleton instance
const auditService = new AuditService();
export default auditService;
