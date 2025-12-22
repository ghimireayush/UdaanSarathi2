/**
 * Role Helper Functions
 * Centralized role checking utilities to replace hardcoded role strings
 * 
 * This file provides single-source-of-truth role checks throughout the app
 */

import { getRoleByValue } from '../config/roles';

/**
 * Check if user is an owner
 * Handles legacy role names (agency_owner) and normalizes them
 * @param {Object} user - User object from auth context
 * @returns {boolean} True if user is an owner
 */
export const isOwnerRole = (user) => {
  if (!user) return false;
  
  const role = user.role || user.specificRole;
  const userType = user.userType;
  
  // Check against normalized role values
  return role === 'owner' || 
         role === 'agency_owner' || 
         userType === 'owner';
};

/**
 * Check if user is a member (not owner)
 * @param {Object} user - User object from auth context
 * @returns {boolean} True if user is a member
 */
export const isMemberRole = (user) => {
  if (!user) return false;
  
  const role = user.role || user.specificRole;
  const userType = user.userType;
  
  return role === 'agency_user' || 
         role === 'agency_member' || 
         userType === 'member';
};

/**
 * Check if user has a specific role
 * @param {Object} user - User object from auth context
 * @param {string} roleValue - Role value to check (e.g., 'admin', 'recruiter')
 * @returns {boolean} True if user has the role
 */
export const hasRole = (user, roleValue) => {
  if (!user) return false;
  
  const userRole = user.specificRole || user.role;
  
  // Normalize legacy role names
  const normalizedUserRole = userRole === 'agency_owner' ? 'owner' : 
                             userRole === 'agency_member' ? 'staff' : 
                             userRole;
  
  const normalizedCheckRole = roleValue === 'agency_owner' ? 'owner' : 
                              roleValue === 'agency_member' ? 'staff' : 
                              roleValue;
  
  return normalizedUserRole === normalizedCheckRole;
};

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object from auth context
 * @param {Array<string>} roleValues - Array of role values to check
 * @returns {boolean} True if user has any of the roles
 */
export const hasAnyRole = (user, roleValues) => {
  if (!user || !Array.isArray(roleValues)) return false;
  return roleValues.some(role => hasRole(user, role));
};

/**
 * Get user's display role name
 * @param {Object} user - User object from auth context
 * @returns {string} Display name for the role
 */
export const getUserRoleDisplay = (user) => {
  if (!user) return 'Unknown';
  
  const role = user.specificRole || user.role;
  const roleObj = getRoleByValue(role);
  
  return roleObj ? roleObj.label : role;
};

/**
 * Check if user needs to set up an agency
 * Owner without agency should be redirected to setup
 * @param {Object} user - User object from auth context
 * @returns {boolean} True if user needs to set up agency
 */
export const needsAgencySetup = (user) => {
  if (!user) return false;
  
  const isOwner = isOwnerRole(user);
  const hasAgency = user.agencyId || user.agency_id;
  
  return isOwner && !hasAgency;
};

export default {
  isOwnerRole,
  isMemberRole,
  hasRole,
  hasAnyRole,
  getUserRoleDisplay,
  needsAgencySetup,
};
