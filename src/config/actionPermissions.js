/**
 * CENTRALIZED ACTION PERMISSIONS CONFIGURATION
 * 
 * Maps each actionable element (button, dialog, workflow action) to:
 * - Allowed roles
 * - API endpoint
 * - Audit action name
 * - Category
 * 
 * This is the single source of truth for what roles can perform which actions.
 * 
 * Usage:
 * import { canPerformAction, getActionsForRole } from '../config/actionPermissions'
 * 
 * if (canPerformAction(userRole, 'SHORTLIST_CANDIDATE')) {
 *   // Show button or execute action
 * }
 */

/**
 * All actionable elements in the system
 * Organized by domain (workflow, job management, team management, etc.)
 */
export const ACTION_PERMISSIONS = {
  // ============================================
  // WORKFLOW ACTIONS (Application Status Changes)
  // ============================================
  
  SHORTLIST_CANDIDATE: {
    roles: ['owner', 'recruiter'],
    description: 'Shortlist a candidate for interview',
    apiEndpoint: 'POST /applications/{id}/shortlist',
    auditAction: 'shortlist_candidate',
    category: 'application',
  },
  
  SCHEDULE_INTERVIEW: {
    roles: ['owner', 'recruiter', 'coordinator'],
    description: 'Schedule an interview with candidate',
    apiEndpoint: 'POST /applications/{id}/schedule-interview',
    auditAction: 'schedule_interview',
    category: 'interview',
  },
  
  RESCHEDULE_INTERVIEW: {
    roles: ['owner', 'recruiter', 'coordinator'],
    description: 'Reschedule an existing interview',
    apiEndpoint: 'POST /applications/{id}/reschedule-interview',
    auditAction: 'reschedule_interview',
    category: 'interview',
  },
  
  COMPLETE_INTERVIEW: {
    roles: ['owner', 'recruiter', 'coordinator'],
    description: 'Mark interview as passed or failed',
    apiEndpoint: 'POST /applications/{id}/complete-interview',
    auditAction: 'complete_interview',
    category: 'interview',
  },
  
  REJECT_APPLICATION: {
    roles: ['owner', 'recruiter'],
    description: 'Reject a candidate application',
    apiEndpoint: 'POST /applications/{id}/reject',
    auditAction: 'reject_application',
    category: 'application',
  },
  
  WITHDRAW_APPLICATION: {
    roles: ['candidate'],
    description: 'Withdraw job application',
    apiEndpoint: 'POST /applications/{id}/withdraw',
    auditAction: 'withdraw_application',
    category: 'application',
  },
  
  UPDATE_APPLICATION_STATUS: {
    roles: ['owner', 'admin', 'manager', 'recruiter'],
    description: 'Update application status',
    apiEndpoint: 'POST /applications/{id}/update-status',
    auditAction: 'update_application_status',
    category: 'application',
  },
  
  // ============================================
  // BULK/BATCH WORKFLOW ACTIONS
  // ============================================
  
  BULK_SHORTLIST_CANDIDATES: {
    roles: ['owner', 'recruiter'],
    description: 'Bulk shortlist multiple candidates',
    apiEndpoint: 'POST /agencies/{license}/jobs/{jobId}/candidates/bulk-shortlist',
    auditAction: 'bulk_shortlist_candidates',
    category: 'application',
  },
  
  BULK_REJECT_CANDIDATES: {
    roles: ['owner', 'recruiter'],
    description: 'Bulk reject multiple candidates',
    apiEndpoint: 'POST /agencies/{license}/jobs/{jobId}/candidates/bulk-reject',
    auditAction: 'bulk_reject',
    category: 'application',
  },
  
  BULK_SCHEDULE_INTERVIEWS: {
    roles: ['owner', 'recruiter', 'coordinator'],
    description: 'Bulk schedule interviews for multiple candidates',
    apiEndpoint: 'POST /agencies/{license}/jobs/{jobId}/candidates/bulk-schedule-interview',
    auditAction: 'bulk_schedule_interviews',
    category: 'interview',
  },
  
  MULTI_BATCH_SCHEDULE_INTERVIEWS: {
    roles: ['owner', 'recruiter', 'coordinator'],
    description: 'Multi-batch schedule interviews across multiple jobs',
    apiEndpoint: 'POST /agencies/{license}/jobs/{jobId}/candidates/multi-batch-schedule',
    auditAction: 'multi_batch_schedule_interviews',
    category: 'interview',
  },
  
  // ============================================
  // JOB MANAGEMENT ACTIONS
  // ============================================
  
  CREATE_JOB: {
    roles: ['owner'],
    description: 'Create a new job posting',
    apiEndpoint: 'POST /agencies/{license}/job-postings',
    auditAction: 'create_job_posting',
    category: 'job_posting',
  },
  
  EDIT_JOB_BASIC: {
    roles: ['owner'],
    description: 'Edit job basic information',
    apiEndpoint: 'PATCH /agencies/{license}/job-management/{jobId}/basic',
    auditAction: 'update_job_posting',
    category: 'job_posting',
  },
  
  EDIT_JOB_EMPLOYER: {
    roles: ['owner'],
    description: 'Edit job employer information',
    apiEndpoint: 'PATCH /agencies/{license}/job-management/{jobId}/employer',
    auditAction: 'update_job_posting',
    category: 'job_posting',
  },
  
  EDIT_JOB_CONTRACT: {
    roles: ['owner'],
    description: 'Edit job contract information',
    apiEndpoint: 'PATCH /agencies/{license}/job-management/{jobId}/contract',
    auditAction: 'update_job_posting',
    category: 'job_posting',
  },
  
  EDIT_JOB_TAGS: {
    roles: ['owner'],
    description: 'Edit job requirements and tags',
    apiEndpoint: 'PATCH /agencies/{license}/job-management/{jobId}/tags',
    auditAction: 'update_job_tags',
    category: 'job_posting',
  },
  
  EDIT_JOB_EXPENSES: {
    roles: ['owner'],
    description: 'Edit job expenses',
    apiEndpoint: 'PATCH /agencies/{license}/job-management/{jobId}/expenses',
    auditAction: 'update_job_posting',
    category: 'job_posting',
  },
  
  MANAGE_JOB_POSITIONS: {
    roles: ['owner'],
    description: 'Create, update, or delete job positions',
    apiEndpoint: 'POST/PATCH/DELETE /agencies/{license}/job-management/{jobId}/positions',
    auditAction: 'manage_job_positions',
    category: 'job_posting',
  },
  
  PUBLISH_JOB: {
    roles: ['owner'],
    description: 'Publish a job posting',
    apiEndpoint: 'PATCH /jobs/{jobId}/toggle',
    auditAction: 'toggle_job_posting_draft',
    category: 'job_posting',
  },
  
  CLOSE_JOB: {
    roles: ['owner'],
    description: 'Close a job posting',
    apiEndpoint: 'POST /agencies/{license}/job-postings/{jobId}/close',
    auditAction: 'close_job_posting',
    category: 'job_posting',
  },
  
  CREATE_JOB_TEMPLATE: {
    roles: ['owner'],
    description: 'Create a job template',
    apiEndpoint: 'POST /agencies/{license}/job-management/template',
    auditAction: 'create_job_template',
    category: 'job_posting',
  },
  
  DELETE_JOB_CUTOUT: {
    roles: ['owner'],
    description: 'Delete a job cutout',
    apiEndpoint: 'DELETE /agencies/{license}/job-postings/{jobId}/cutout',
    auditAction: 'delete_job_cutout',
    category: 'job_posting',
  },
  
  // ============================================
  // TEAM MANAGEMENT ACTIONS
  // ============================================
  
  INVITE_MEMBER: {
    roles: ['owner'],
    description: 'Invite a new team member',
    apiEndpoint: 'POST /agencies/owner/members/invite',
    auditAction: 'add_team_member',
    category: 'agency',
  },
  
  EDIT_MEMBER: {
    roles: ['owner'],
    description: 'Edit team member details',
    apiEndpoint: 'PATCH /agencies/owner/members/{id}',
    auditAction: 'add_team_member',
    category: 'agency',
  },
  
  CHANGE_MEMBER_STATUS: {
    roles: ['owner'],
    description: 'Change team member status',
    apiEndpoint: 'PATCH /agencies/owner/members/{id}/status',
    auditAction: 'add_team_member',
    category: 'agency',
  },
  
  DELETE_MEMBER: {
    roles: ['owner'],
    description: 'Remove a team member',
    apiEndpoint: 'DELETE /agencies/owner/members/{id}',
    auditAction: 'remove_team_member',
    category: 'agency',
  },
  
  // ============================================
  // APPLICATION NOTES ACTIONS
  // ============================================
  
  ADD_NOTE: {
    roles: ['owner', 'recruiter', 'coordinator'],
    description: 'Add a note to application',
    apiEndpoint: 'POST /application-notes',
    auditAction: 'create_note',
    category: 'application',
  },
  
  EDIT_NOTE: {
    roles: ['owner', 'recruiter', 'coordinator'],
    description: 'Edit application note',
    apiEndpoint: 'PATCH /application-notes/{id}',
    auditAction: 'update_note',
    category: 'application',
  },
  
  DELETE_NOTE: {
    roles: ['owner', 'recruiter', 'coordinator'],
    description: 'Delete application note',
    apiEndpoint: 'DELETE /application-notes/{id}',
    auditAction: 'delete_note',
    category: 'application',
  },
  
  // ============================================
  // DOCUMENT MANAGEMENT ACTIONS
  // ============================================
  
  DELETE_DOCUMENT: {
    roles: ['owner', 'recruiter'],
    description: 'Delete a candidate document',
    apiEndpoint: 'DELETE /agencies/{license}/jobs/{jobId}/candidates/{candidateId}/documents/{documentId}',
    auditAction: 'delete_document',
    category: 'candidate',
  },
  
  VERIFY_DOCUMENT: {
    roles: ['owner', 'recruiter'],
    description: 'Verify a candidate document',
    apiEndpoint: 'POST /agencies/{license}/jobs/{jobId}/candidates/{candidateId}/documents/{documentId}/verify',
    auditAction: 'verify_document',
    category: 'candidate',
  },
};

/**
 * Helper function to check if user can perform action
 * @param {string} userRole - User's role
 * @param {string} actionKey - Action key from ACTION_PERMISSIONS
 * @returns {boolean} True if user can perform action
 */
export const canPerformAction = (userRole, actionKey) => {
  const action = ACTION_PERMISSIONS[actionKey];
  if (!action) {
    console.warn(`Action not found: ${actionKey}`);
    return false;
  }
  return action.roles.includes(userRole);
};

/**
 * Get all actions available to a role
 * @param {string} role - Role value
 * @returns {Array<string>} Array of action keys available to role
 */
export const getActionsForRole = (role) => {
  return Object.entries(ACTION_PERMISSIONS)
    .filter(([_, action]) => action.roles.includes(role))
    .map(([key, _]) => key);
};

/**
 * Get action details
 * @param {string} actionKey - Action key
 * @returns {Object|null} Action details or null
 */
export const getActionDetails = (actionKey) => {
  return ACTION_PERMISSIONS[actionKey] || null;
};

/**
 * Get all actions in a category
 * @param {string} category - Category name
 * @returns {Array<Object>} Array of actions in category
 */
export const getActionsByCategory = (category) => {
  return Object.entries(ACTION_PERMISSIONS)
    .filter(([_, action]) => action.category === category)
    .map(([key, action]) => ({ key, ...action }));
};

/**
 * Get all actions that a role can perform in a category
 * @param {string} role - Role value
 * @param {string} category - Category name
 * @returns {Array<Object>} Array of actions
 */
export const getActionsForRoleInCategory = (role, category) => {
  return Object.entries(ACTION_PERMISSIONS)
    .filter(([_, action]) => action.roles.includes(role) && action.category === category)
    .map(([key, action]) => ({ key, ...action }));
};

export default ACTION_PERMISSIONS;
