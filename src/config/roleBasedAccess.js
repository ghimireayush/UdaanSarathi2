/**
 * Role-Based Access Control Configuration
 * For Nepali Foreign Employment Manpower Agency
 * 
 * Defines what features/routes are available to each role
 * 
 * IMPORTANT: Role definitions come from src/config/roles.js
 * This file only defines permissions for each role.
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
      paymentTracking: true,
      visaProcessing: true,
      complianceReports: true,
    }
  },

  // Admin - Manages operations, team, and most features
  [ROLES.ADMIN.value]: {
    label: ROLES.ADMIN.label,
    description: ROLES.ADMIN.description,
    color: ROLES.ADMIN.color,
    features: {
      dashboard: true,
      jobs: true,
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
      paymentTracking: true,
      visaProcessing: true,
      complianceReports: false, // Cannot view compliance reports
    }
  },

  // Manager - Manages recruitment process and team
  [ROLES.MANAGER.value]: {
    label: ROLES.MANAGER.label,
    description: ROLES.MANAGER.description,
    color: ROLES.MANAGER.color,
    features: {
      dashboard: true,
      jobs: true,
      drafts: true,
      applications: true,
      interviews: true,
      workflow: true,
      teamMembers: false, // Cannot manage team members
      auditLog: false,
      settings: false,
      analytics: true,
      candidateManagement: true,
      documentManagement: true,
      paymentTracking: false, // Cannot track payments
      visaProcessing: true,
      complianceReports: false,
    }
  },

  // Staff - Basic access to job and application management
  [ROLES.STAFF.value]: {
    label: ROLES.STAFF.label,
    description: ROLES.STAFF.description,
    color: ROLES.STAFF.color,
    features: {
      dashboard: true,
      jobs: true,
      drafts: false, // Cannot create drafts
      applications: true,
      interviews: false, // Cannot schedule interviews
      workflow: true,
      teamMembers: false,
      auditLog: false,
      settings: false,
      analytics: false,
      candidateManagement: true,
      documentManagement: true,
      paymentTracking: false,
      visaProcessing: false,
      complianceReports: false,
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
      paymentTracking: false,
      visaProcessing: false,
      complianceReports: false,
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
      paymentTracking: false,
      visaProcessing: false,
      complianceReports: false,
    }
  },

  // Visa Officer - Handles visa and document processing
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
      paymentTracking: false,
      visaProcessing: true,
      complianceReports: false,
    }
  },

  // Accountant - Handles payments and financial tracking
  [ROLES.ACCOUNTANT.value]: {
    label: ROLES.ACCOUNTANT.label,
    description: ROLES.ACCOUNTANT.description,
    color: ROLES.ACCOUNTANT.color,
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
      analytics: true,
      candidateManagement: false,
      documentManagement: false,
      paymentTracking: true,
      visaProcessing: false,
      complianceReports: true,
    }
  },
};

/**
 * Navigation items configuration
 * Maps to navbar items with role-based visibility
 */
export const NAVIGATION_ITEMS = {
  dashboard: {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'BarChart3',
    description: 'View agency overview and metrics',
    roles: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'coordinator', 'visaOfficer', 'accountant'],
  },
  jobs: {
    path: '/jobs',
    label: 'Jobs',
    icon: 'Briefcase',
    description: 'Manage job postings',
    roles: ['owner', 'admin', 'manager', 'staff', 'recruiter'],
  },

  applications: {
    path: '/applications',
    label: 'Applications',
    icon: 'Users',
    description: 'Review candidate applications',
    roles: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'coordinator', 'visaOfficer', 'accountant'],
  },
  interviews: {
    path: '/interviews',
    label: 'Interviews',
    icon: 'Calendar',
    description: 'Schedule and manage interviews',
    roles: ['owner', 'admin', 'manager', 'recruiter', 'coordinator'],
  },
  workflow: {
    path: '/workflow',
    label: 'Workflow',
    icon: 'GitBranch',
    description: 'Track candidate workflow stages',
    roles: ['owner', 'admin', 'manager', 'staff', 'visaOfficer'],
  },
  teamMembers: {
    path: '/teammembers',
    label: 'Team Members',
    icon: 'UsersRound',
    description: 'Manage team members and roles',
    roles: ['owner', 'admin'],
  },
  auditLog: {
    path: '/auditlog',
    label: 'Audit Log',
    icon: 'History',
    description: 'View system activity logs',
    roles: ['owner', 'admin'],
  },
  settings: {
    path: '/settings',
    label: 'Settings',
    icon: 'Settings',
    description: 'Configure agency settings',
    roles: ['owner'],
  },
  jobManagement: {
    path: '/job-management',
    label: 'Job Management',
    icon: 'Briefcase',
    description: 'Create and edit job postings',
    roles: ['owner', 'admin', 'manager'],
  },
};

/**
 * Feature-level access control
 * Defines what actions are available for each feature
 */
export const FEATURE_PERMISSIONS = {
  jobs: {
    view: ['owner', 'admin', 'manager', 'staff', 'recruiter'],
    create: ['owner', 'admin', 'manager'],
    edit: ['owner', 'admin', 'manager'],
    delete: ['owner', 'admin'],
    publish: ['owner', 'admin', 'manager'],
  },
  applications: {
    view: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'coordinator', 'visaOfficer', 'accountant'],
    shortlist: ['owner', 'admin', 'manager', 'recruiter'],
    reject: ['owner', 'admin', 'manager', 'recruiter'],
    approve: ['owner', 'admin', 'manager'],
  },
  interviews: {
    view: ['owner', 'admin', 'manager', 'recruiter', 'coordinator'],
    schedule: ['owner', 'admin', 'manager', 'recruiter', 'coordinator'],
    edit: ['owner', 'admin', 'manager', 'coordinator'],
    cancel: ['owner', 'admin', 'manager', 'coordinator'],
  },
  candidates: {
    view: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'coordinator', 'visaOfficer', 'accountant'],
    edit: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'visaOfficer'],
    delete: ['owner', 'admin'],
    export: ['owner', 'admin', 'manager'],
  },
  documents: {
    view: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'coordinator', 'visaOfficer', 'accountant'],
    upload: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'visaOfficer'],
    download: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'coordinator', 'visaOfficer', 'accountant'],
    delete: ['owner', 'admin', 'manager'],
  },
  payments: {
    view: ['owner', 'admin', 'accountant'],
    create: ['owner', 'admin', 'accountant'],
    edit: ['owner', 'admin', 'accountant'],
    delete: ['owner', 'admin'],
    export: ['owner', 'admin', 'accountant'],
  },
  visaProcessing: {
    view: ['owner', 'admin', 'manager', 'visaOfficer'],
    update: ['owner', 'admin', 'manager', 'visaOfficer'],
    approve: ['owner', 'admin', 'manager'],
    reject: ['owner', 'admin', 'manager'],
  },
  teamMembers: {
    view: ['owner', 'admin'],
    invite: ['owner', 'admin'],
    edit: ['owner', 'admin'],
    delete: ['owner', 'admin'],
    changeRole: ['owner', 'admin'],
  },
  reports: {
    view: ['owner', 'admin', 'accountant'],
    generate: ['owner', 'admin', 'accountant'],
    export: ['owner', 'admin', 'accountant'],
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
  const roleConfig = ROLE_FEATURES[role];
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
  const permissions = FEATURE_PERMISSIONS[feature];
  if (!permissions || !permissions[action]) return false;
  return permissions[action].includes(role);
};

/**
 * Get all features accessible by a role
 * @param {string} role - User role
 * @returns {Array} Array of accessible feature names
 */
export const getAccessibleFeatures = (role) => {
  const roleConfig = ROLE_FEATURES[role];
  if (!roleConfig) return [];
  return Object.keys(roleConfig.features).filter(
    feature => roleConfig.features[feature] === true
  );
};

/**
 * Get all navigation items accessible by a role
 * @param {string} role - User role
 * @returns {Array} Array of accessible navigation items
 */
export const getAccessibleNavItems = (role) => {
  return Object.values(NAVIGATION_ITEMS).filter(item =>
    item.roles.includes(role)
  );
};

/**
 * Get role configuration
 * @param {string} role - User role
 * @returns {Object} Role configuration
 */
export const getRoleConfig = (role) => {
  return ROLE_FEATURES[role] || null;
};

/**
 * Get role display info
 * @param {string} role - User role
 * @returns {Object} Role display info (label, description, color)
 */
export const getRoleDisplayInfo = (role) => {
  const config = ROLE_FEATURES[role];
  if (!config) return null;
  return {
    label: config.label,
    description: config.description,
    color: config.color,
  };
};
