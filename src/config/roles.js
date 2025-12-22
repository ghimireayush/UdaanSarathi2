/**
 * FRONTEND ROLES CONFIGURATION
 * 
 * IMPORTANT: These roles are now fetched from the backend via /roles/available endpoint.
 * This file serves as a fallback and reference.
 * 
 * Backend is the source of truth for available roles.
 * See: code/src/config/rolePermissions.ts
 * 
 * Supported roles (from backend):
 * - owner: Agency owner (not assignable to team members)
 * - admin: Manages operations, team, and reports
 * - recruiter: Focuses on candidate sourcing and screening
 * - coordinator: Manages interview scheduling and coordination
 * - visa_officer: Handles document verification and visa processing
 * - viewer: Read-only access to view information
 */

/**
 * Role definitions with metadata
 * 
 * NOTE: This is now primarily used as a fallback when the API is unavailable.
 * The useAvailableRoles hook fetches the actual roles from the backend.
 */
export const ROLES = {
  // Top-level roles
  OWNER: {
    key: 'owner',
    value: 'owner',
    label: 'Agency Owner',
    description: 'Full access to all features',
    color: 'bg-purple-100 text-purple-800',
    canBeAssignedToMembers: false, // Owner role cannot be assigned to team members
  },
  
  ADMIN: {
    key: 'admin',
    value: 'admin',
    label: 'Admin',
    description: 'Manages operations, team, and reports',
    color: 'bg-blue-100 text-blue-800',
    canBeAssignedToMembers: true,
  },
  
  RECRUITER: {
    key: 'recruiter',
    value: 'recruiter',
    label: 'Recruiter',
    description: 'Focuses on candidate sourcing and screening',
    color: 'bg-indigo-100 text-indigo-800',
    canBeAssignedToMembers: true,
  },
  
  COORDINATOR: {
    key: 'coordinator',
    value: 'coordinator',
    label: 'Interview Coordinator',
    description: 'Manages interview scheduling and coordination',
    color: 'bg-pink-100 text-pink-800',
    canBeAssignedToMembers: true,
  },
  
  VISA_OFFICER: {
    key: 'visa_officer',
    value: 'visa_officer',
    label: 'Visa Officer',
    description: 'Handles document verification and visa processing',
    color: 'bg-green-100 text-green-800',
    canBeAssignedToMembers: true,
  },
  
  VIEWER: {
    key: 'viewer',
    value: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to view information',
    color: 'bg-gray-100 text-gray-800',
    canBeAssignedToMembers: true,
  },
};

/**
 * Get all role values as an array
 * @returns {Array<string>} Array of role values
 */
export const getAllRoleValues = () => {
  return Object.values(ROLES).map(role => role.value);
};

/**
 * Get all roles that can be assigned to team members
 * @returns {Array<Object>} Array of assignable roles
 */
export const getAssignableRoles = () => {
  return Object.values(ROLES).filter(role => role.canBeAssignedToMembers);
};

/**
 * Get role by value
 * @param {string} value - Role value
 * @returns {Object|null} Role object or null
 */
export const getRoleByValue = (value) => {
  // Normalize legacy role names
  const normalizedValue = value === 'agency_owner' ? 'owner' : value;
  return Object.values(ROLES).find(role => role.value === normalizedValue) || null;
};

/**
 * Get role label by value
 * @param {string} value - Role value
 * @returns {string} Role label
 */
export const getRoleLabel = (value) => {
  // Normalize legacy role names
  const normalizedValue = value === 'agency_owner' ? 'owner' : value;
  const role = getRoleByValue(normalizedValue);
  return role ? role.label : value;
};

/**
 * Get role description by value
 * @param {string} value - Role value
 * @returns {string} Role description
 */
export const getRoleDescription = (value) => {
  const role = getRoleByValue(value);
  return role ? role.description : '';
};

/**
 * Get role color by value
 * @param {string} value - Role value
 * @returns {string} Role color classes
 */
export const getRoleColor = (value) => {
  const role = getRoleByValue(value);
  return role ? role.color : 'bg-gray-100 text-gray-800';
};

/**
 * Check if a role exists
 * @param {string} value - Role value
 * @returns {boolean} True if role exists
 */
export const isValidRole = (value) => {
  return getAllRoleValues().includes(value);
};

/**
 * Check if a role can be assigned to team members
 * @param {string} value - Role value
 * @returns {boolean} True if role can be assigned
 */
export const canAssignRole = (value) => {
  const role = getRoleByValue(value);
  return role ? role.canBeAssignedToMembers : false;
};

export default ROLES;
