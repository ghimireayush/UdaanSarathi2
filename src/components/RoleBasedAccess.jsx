/**
 * Role-Based Access Component
 * Conditionally renders content based on user role and permissions
 */

import React from 'react';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';

/**
 * RoleBasedAccess Component
 * Shows content only if user has the specified role(s)
 * 
 * @param {React.ReactNode} children - Content to show if access is granted
 * @param {string|Array} roles - Role(s) that can see this content
 * @param {React.ReactNode} fallback - Content to show if access is denied (default: null)
 */
export const RoleBasedAccess = ({ children, roles, fallback = null }) => {
  const { userRole } = useRoleBasedAccess();

  // Normalize roles to array
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  // Check if user has access
  const hasAccess = allowedRoles.includes(userRole);

  return hasAccess ? children : fallback;
};

/**
 * FeatureAccess Component
 * Shows content only if user has access to a specific feature
 * 
 * @param {React.ReactNode} children - Content to show if feature is accessible
 * @param {string} feature - Feature name to check access for
 * @param {React.ReactNode} fallback - Content to show if feature is not accessible (default: null)
 */
export const FeatureAccess = ({ children, feature, fallback = null }) => {
  const { hasFeatureAccess } = useRoleBasedAccess();

  return hasFeatureAccess(feature) ? children : fallback;
};

/**
 * ActionAccess Component
 * Shows content only if user can perform a specific action on a feature
 * 
 * @param {React.ReactNode} children - Content to show if action is allowed
 * @param {string} feature - Feature name
 * @param {string} action - Action name (view, create, edit, delete, etc.)
 * @param {React.ReactNode} fallback - Content to show if action is not allowed (default: null)
 */
export const ActionAccess = ({ children, feature, action, fallback = null }) => {
  const { canPerformAction } = useRoleBasedAccess();

  return canPerformAction(feature, action) ? children : fallback;
};

/**
 * OwnerOrAdminOnly Component
 * Shows content only to owner or admin users
 * 
 * @param {React.ReactNode} children - Content to show
 * @param {React.ReactNode} fallback - Content to show if not owner/admin (default: null)
 */
export const OwnerOrAdminOnly = ({ children, fallback = null }) => {
  const { isOwnerOrAdmin } = useRoleBasedAccess();

  return isOwnerOrAdmin() ? children : fallback;
};

/**
 * ManagerOrAboveOnly Component
 * Shows content only to manager, admin, or owner users
 * 
 * @param {React.ReactNode} children - Content to show
 * @param {React.ReactNode} fallback - Content to show if not manager/admin/owner (default: null)
 */
export const ManagerOrAboveOnly = ({ children, fallback = null }) => {
  const { isManagerOrAbove } = useRoleBasedAccess();

  return isManagerOrAbove() ? children : fallback;
};

/**
 * DisabledForRole Component
 * Disables content for specific roles
 * 
 * @param {React.ReactNode} children - Content to potentially disable
 * @param {string|Array} disabledRoles - Role(s) that cannot access this
 * @param {React.ReactNode} fallback - Content to show if disabled (default: null)
 */
export const DisabledForRole = ({ children, disabledRoles, fallback = null }) => {
  const { userRole } = useRoleBasedAccess();

  // Normalize disabledRoles to array
  const roles = Array.isArray(disabledRoles) ? disabledRoles : [disabledRoles];

  // Check if user's role is in disabled list
  const isDisabled = roles.includes(userRole);

  return !isDisabled ? children : fallback;
};

export default RoleBasedAccess;
