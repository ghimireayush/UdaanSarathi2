/**
 * SINGLE SOURCE OF TRUTH FOR ALL ROLES
 * 
 * This file defines all roles in the system.
 * Any changes to roles (add, remove, rename) should be made here.
 * 
 * All other files (RBAC, team members, auth service) reference this file.
 */

/**
 * Role definitions with metadata
 * 
 * To add a new role:
 * 1. Add it to this ROLES object with key, value, label, description, and color
 * 2. Add permissions in roleBasedAccess.js ROLE_FEATURES
 * 3. That's it! The role will automatically appear in team member dropdowns
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
    label: 'Administrator',
    description: 'Manages operations, team, and most features',
    color: 'bg-blue-100 text-blue-800',
    canBeAssignedToMembers: true,
  },
  
  MANAGER: {
    key: 'manager',
    value: 'manager',
    label: 'Manager',
    description: 'Manages recruitment process and team coordination',
    color: 'bg-green-100 text-green-800',
    canBeAssignedToMembers: true,
  },
  
  // Staff roles
  STAFF: {
    key: 'staff',
    value: 'staff',
    label: 'Staff',
    description: 'Handles job postings and candidate applications',
    color: 'bg-yellow-100 text-yellow-800',
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
  
  // Specialized roles
  VISA_OFFICER: {
    key: 'visaOfficer',
    value: 'visaOfficer',
    label: 'Visa Officer',
    description: 'Handles visa processing and documentation',
    color: 'bg-cyan-100 text-cyan-800',
    canBeAssignedToMembers: true,
  },
  
  ACCOUNTANT: {
    key: 'accountant',
    value: 'accountant',
    label: 'Accountant',
    description: 'Manages payments and financial tracking',
    color: 'bg-orange-100 text-orange-800',
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
