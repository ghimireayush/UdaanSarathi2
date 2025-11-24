/**
 * Role-Based Access Control Configuration
 * For Nepali Foreign Employment Manpower Agency
 * 
 * Defines what features/routes are available to each role
 */

export const ROLE_FEATURES = {
  // Agency Owner - Full access to everything
  owner: {
    label: 'Agency Owner',
    description: 'Full access to all features',
    color: 'bg-purple-100 text-purple-800',
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
  admin: {
    label: 'Administrator',
    description: 'Manages operations, team, and most features',
    color: 'bg-blue-100 text-blue-800',
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
  manager: {
    label: 'Manager',
    description: 'Manages recruitment process and team coordination',
    color: 'bg-green-100 text-green-800',
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
  staff: {
    label: 'Staff',
    description: 'Handles job postings and candidate applications',
    color: 'bg-yellow-100 text-yellow-800',
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
  recruiter: {
    label: 'Recruiter',
    description: 'Focuses on candidate sourcing and screening',
    color: 'bg-indigo-100 text-indigo-800',
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
  coordinator: {
    label: 'Interview Coordinator',
    description: 'Manages interview scheduling and coordination',
    color: 'bg-pink-100 text-pink-800',
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
  visaOfficer: {
    label: 'Visa Officer',
    description: 'Handles visa processing and documentation',
    color: 'bg-cyan-100 text-cyan-800',
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
  accountant: {
    label: 'Accountant',
    description: 'Manages payments and financial tracking',
    color: 'bg-orange-100 text-orange-800',
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
  drafts: {
    path: '/drafts',
    label: 'Drafts',
    icon: 'FileEdit',
    description: 'Create and manage job drafts',
    roles: ['owner', 'admin', 'manager'],
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
