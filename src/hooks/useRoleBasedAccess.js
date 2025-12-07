/**
 * Hook for role-based access control
 * Provides utilities to check access based on user role
 */

import { useAuth } from '../contexts/AuthContext';
import {
  hasFeatureAccess,
  canPerformAction,
  getAccessibleFeatures,
  getAccessibleNavItems,
  getRoleConfig,
  getRoleDisplayInfo,
  ROLE_FEATURES,
} from '../config/roleBasedAccess';

export const useRoleBasedAccess = () => {
  const { user } = useAuth();

  // Normalize legacy role names to current RBAC role names
  const normalizeRole = (role) => {
    // Map legacy 'agency_owner' to 'owner' for RBAC compatibility
    if (role === 'agency_owner') return 'owner';
    // Map legacy 'agency_member' to 'staff' as default member role
    if (role === 'agency_member') return 'staff';
    return role;
  };

  // Get user's role
  const getUserRole = () => {
    // If user has a specific role in their profile, use it directly
    if (user?.specificRole) {
      return normalizeRole(user.specificRole);
    }
    
    // Otherwise, use the role directly (backend now returns 'owner' for owners)
    if (user?.role) {
      return normalizeRole(user.role);
    }
    
    // Fallback to staff if no role found
    return 'staff';
  };

  const userRole = getUserRole();

  return {
    // Get user's role
    userRole,

    // Check if user has access to a feature
    hasFeatureAccess: (feature) => hasFeatureAccess(userRole, feature),

    // Check if user can perform an action
    canPerformAction: (feature, action) => canPerformAction(userRole, feature, action),

    // Get all accessible features
    getAccessibleFeatures: () => getAccessibleFeatures(userRole),

    // Get all accessible navigation items
    getAccessibleNavItems: () => getAccessibleNavItems(userRole),

    // Get role configuration
    getRoleConfig: () => getRoleConfig(userRole),

    // Get role display info
    getRoleDisplayInfo: () => getRoleDisplayInfo(userRole),

    // Check if user is a specific role
    isRole: (role) => userRole === role,

    // Check if user is one of multiple roles
    isAnyRole: (roles) => roles.includes(userRole),

    // Check if user is owner or admin
    isOwnerOrAdmin: () => ['owner', 'admin'].includes(userRole),

    // Check if user is manager or above
    isManagerOrAbove: () => ['owner', 'admin', 'manager'].includes(userRole),

    // Get all available roles (for admin purposes)
    getAllRoles: () => Object.keys(ROLE_FEATURES),

    // Get role info for any role
    getRoleInfo: (role) => getRoleDisplayInfo(role),
  };
};

export default useRoleBasedAccess;
