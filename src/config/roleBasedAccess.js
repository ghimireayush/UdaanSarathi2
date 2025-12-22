/**
 * Role-Based Access Control Configuration
 * For Nepali Foreign Employment Manpower Agency
 * 
 * Defines what features/routes are available to each role
 * 
 * IMPORTANT: Role definitions come from src/config/roles.js
 * This file only defines permissions for each role.
 * 
 * SUPPORTED ROLES (from backend):
 * - owner: Agency owner (full access)
 * - admin: Operations manager (manage team, settings, reports)
 * - recruiter: Candidate sourcing and screening
 * - coordinator: Interview scheduling and coordination
 * - visa_officer: Document and visa processing
 * - viewer: Read-only access
 */

import ROLES from './roles';

export const ROLE_FEATURES = {
  // Agency Owner - Full access to everything
  [ROLES.OWNER.value]: {
    label: ROLES.OWNER.label,
    description: ROLES.OWNER.description,
    color: ROLES.OWNER.color,
    features: {
      dashboard: true,
      jobs: true,
      jobManagement: true,
      drafts: true,
      applications: true,
      interviews: true,
      workflow: true,
      teamMembers: true,
      auditLog: true,
      settings: true,
      analytics: true,
      candidateManagement: true,
      documentManagement: true,
    }
  },

  // Admin - Manages operations, team, and reports
  [ROLES.ADMIN.value]: {
    label: ROLES.ADMIN.label,
    description: ROLES.ADMIN.description,
    color: ROLES.ADMIN.color,
    features: {
      dashboard: true,
      jobs: true,
      jobManagement: true,
      drafts: true,
      applications: true,
      interviews: true,
      workflow: true,
      teamMembers: true,
      auditLog: true,
      settings: false, // Cannot change agency settings
      analytics: true,
      candidateManagement: true,
      documentManagement: true,
    }
  },

  // Recruiter - Focuses on candidate sourcing and screening
  [ROLES.RECRUITER.value]: {
    label: ROLES.RECRUITER.label,
    description: ROLES.RECRUITER.description,
    color: ROLES.RECRUITER.color,
    features: {
      dashboard: true,
      jobs: true,
      drafts: false,
      applications: true,
      interviews: true,
      workflow: false,
      teamMembers: false,
      auditLog: false,
      settings: false,
      analytics: false,
      candidateManagement: true,
      documentManagement: true,
    }
  },

  // Interview Coordinator - Manages interview scheduling
  [ROLES.COORDINATOR.value]: {
    label: ROLES.COORDINATOR.label,
    description: ROLES.COORDINATOR.description,
    color: ROLES.COORDINATOR.color,
    features: {
      dashboard: true,
      jobs: false,
      drafts: false,
      applications: true,
      interviews: true,
      workflow: false,
      teamMembers: false,
      auditLog: false,
      settings: false,
      analytics: false,
      candidateManagement: false,
      documentManagement: false,
    }
  },

  // Visa Officer - Handles document and visa processing
  [ROLES.VISA_OFFICER.value]: {
    label: ROLES.VISA_OFFICER.label,
    description: ROLES.VISA_OFFICER.description,
    color: ROLES.VISA_OFFICER.color,
    features: {
      dashboard: true,
      jobs: false,
      drafts: false,
      applications: true,
      interviews: false,
      workflow: true,
      teamMembers: false,
      auditLog: false,
      settings: false,
      analytics: false,
      candidateManagement: true,
      documentManagement: true,
    }
  },

  // Viewer - Read-only access
  [ROLES.VIEWER.value]: {
    label: ROLES.VIEWER.label,
    description: ROLES.VIEWER.description,
    color: ROLES.VIEWER.color,
    features: {
      dashboard: true,
      jobs: false,
      drafts: false,
      applications: true,
      interviews: false,
      workflow: false,
      teamMembers: false,
      auditLog: false,
      settings: false,
      analytics: false,
      candidateManagement: false,
      documentManagement: false,
    }
  },
};

/**
 * Navigation items configuration
 * Maps to navbar items with role-based visibility
 * Order matters - items appear in sidebar in this order
 * 
 * Only includes roles supported by backend: owner, admin, recruiter, coordinator, visa_officer, viewer
 */
export const NAVIGATION_ITEMS = {
  dashboard: {
    path: '/dashboard',
    label: 'Dashboard',
    translationKey: 'dashboard',
    icon: 'BarChart3',
    description: 'View agency overview and metrics',
    roles: ['owner', 'admin', 'recruiter', 'coordinator', 'visa_officer', 'viewer'],
  },
  jobs: {
    path: '/jobs',
    label: 'Jobs',
    translationKey: 'jobs',
    icon: 'Briefcase',
    description: 'Manage job postings',
    roles: ['owner', 'admin', 'recruiter'],
  },
  jobManagement: {
    path: '/job-management',
    label: 'Job Management',
    translationKey: 'jobManagement',
    icon: 'FileEdit',
    description: 'Create and edit job postings',
    roles: ['owner', 'admin'],
  },
  applications: {
    path: '/applications',
    label: 'Applications',
    translationKey: 'applications',
    icon: 'Users',
    description: 'Review candidate applications',
    roles: ['owner', 'admin', 'recruiter', 'coordinator', 'visa_officer', 'viewer'],
  },
  interviews: {
    path: '/interviews',
    label: 'Interviews',
    translationKey: 'interviews',
    icon: 'Calendar',
    description: 'Schedule and manage interviews',
    roles: ['owner', 'admin', 'recruiter', 'coordinator'],
  },
  workflow: {
    path: '/workflow',
    label: 'Workflow',
    translationKey: 'workflow',
    icon: 'GitBranch',
    description: 'Track candidate workflow stages',
    roles: ['owner', 'admin', 'visa_officer'],
  },
  teamMembers: {
    path: '/teammembers',
    label: 'Team Members',
    translationKey: 'teamMembers',
    icon: 'UsersRound',
    description: 'Manage team members and roles',
    roles: ['owner', 'admin'],
  },
  auditLog: {
    path: '/auditlog',
    label: 'Audit Log',
    translationKey: 'auditLog',
    icon: 'History',
    description: 'View system activity logs',
    roles: ['owner', 'admin'],
  },
  settings: {
    path: '/settings',
    label: 'Agency Settings',
    translationKey: 'agencySettings',
    icon: 'Settings',
    description: 'Configure agency settings',
    roles: ['owner'],
  },
};

/**
 * Feature-level access control
 * Defines what actions are available for each feature
 * 
 * Only includes roles supported by backend: owner, admin, recruiter, coordinator, visa_officer, viewer
 */
export const FEATURE_PERMISSIONS = {
  jobs: {
    view: ['owner', 'admin', 'recruiter'],
    create: ['owner', 'admin'],
    edit: ['owner', 'admin'],
    delete: ['owner'],
    publish: ['owner', 'admin'],
  },
  applications: {
    view: ['owner', 'admin', 'recruiter', 'coordinator', 'visa_officer', 'viewer'],
    shortlist: ['owner', 'admin', 'recruiter'],
    reject: ['owner', 'admin', 'recruiter'],
    approve: ['owner', 'admin'],
  },
  interviews: {
    view: ['owner', 'admin', 'recruiter', 'coordinator'],
    schedule: ['owner', 'admin', 'recruiter', 'coordinator'],
    edit: ['owner', 'admin', 'coordinator'],
    cancel: ['owner', 'admin', 'coordinator'],
  },
  candidates: {
    view: ['owner', 'admin', 'recruiter', 'coordinator', 'visa_officer', 'viewer'],
    edit: ['owner', 'admin', 'recruiter', 'visa_officer'],
    delete: ['owner', 'admin'],
    export: ['owner', 'admin'],
  },
  documents: {
    view: ['owner', 'admin', 'recruiter', 'coordinator', 'visa_officer', 'viewer'],
    upload: ['owner', 'admin', 'recruiter', 'visa_officer'],
    download: ['owner', 'admin', 'recruiter', 'coordinator', 'visa_officer', 'viewer'],
    delete: ['owner', 'admin'],
    verify: ['owner', 'admin', 'visa_officer'],
  },
  teamMembers: {
    view: ['owner', 'admin'],
    invite: ['owner', 'admin'],
    edit: ['owner', 'admin'],
    delete: ['owner', 'admin'],
    changeRole: ['owner', 'admin'],
  },
  reports: {
    view: ['owner', 'admin', 'visa_officer'],
    generate: ['owner', 'admin'],
    export: ['owner', 'admin'],
  },
};

/**
 * Get available roles for a user
 * @returns {Array} Array of role keys
 */
export const getAvailableRoles = () => {
  return Object.keys(ROLE_FEATURES);
};

/**
 * Check if a role has access to a feature
 * @param {string} role - User role
 * @param {string} feature - Feature name
 * @returns {boolean} True if role has access
 */
export const hasFeatureAccess = (role, feature) => {
  const normalizedRole = normalizeRole(role);
  const roleConfig = ROLE_FEATURES[normalizedRole];
  if (!roleConfig) return false;
  return roleConfig.features[feature] === true;
};

/**
 * Check if a role can perform an action on a feature
 * @param {string} role - User role
 * @param {string} feature - Feature name
 * @param {string} action - Action name (view, create, edit, delete, etc.)
 * @returns {boolean} True if role can perform action
 */
export const canPerformAction = (role, feature, action) => {
  const normalizedRole = normalizeRole(role);
  const permissions = FEATURE_PERMISSIONS[feature];
  if (!permissions || !permissions[action]) return false;
  return permissions[action].includes(normalizedRole);
};

/**
 * Get all features accessible by a role
 * @param {string} role - User role
 * @returns {Array} Array of accessible feature names
 */
export const getAccessibleFeatures = (role) => {
  const normalizedRole = normalizeRole(role);
  const roleConfig = ROLE_FEATURES[normalizedRole];
  if (!roleConfig) return [];
  return Object.keys(roleConfig.features).filter(
    feature => roleConfig.features[feature] === true
  );
};

/**
 * Normalize legacy role names to current RBAC role names
 * @param {string} role - Role value (may be legacy)
 * @returns {string} Normalized role value
 */
const normalizeRole = (role) => {
  if (role === 'agency_owner') return 'owner';
  if (role === 'agency_member') return 'recruiter'; // Default agency member to recruiter
  return role;
};

/**
 * Get all navigation items accessible by a role
 * @param {string} role - User role
 * @returns {Array} Array of accessible navigation items
 */
export const getAccessibleNavItems = (role) => {
  const normalizedRole = normalizeRole(role);
  return Object.values(NAVIGATION_ITEMS).filter(item =>
    item.roles.includes(normalizedRole)
  );
};

/**
 * Get role configuration
 * @param {string} role - User role
 * @returns {Object} Role configuration
 */
export const getRoleConfig = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_FEATURES[normalizedRole] || null;
};

/**
 * Get role display info
 * @param {string} role - User role
 * @returns {Object} Role display info (label, description, color)
 */
export const getRoleDisplayInfo = (role) => {
  const normalizedRole = normalizeRole(role);
  const config = ROLE_FEATURES[normalizedRole];
  if (!config) return null;
  return {
    label: config.label,
    description: config.description,
    color: config.color,
  };
};
