/**
 * Roles Storage Service
 * Manages roles availability using local storage
 * 
 * NOTE: This service is now primarily for backward compatibility.
 * Roles are fetched from the backend via /roles/available endpoint.
 * 
 * The advanced roles toggle is deprecated and will be removed in a future version.
 * All roles from the backend are now shown by default.
 */

const STORAGE_KEY = 'udaan_advanced_roles_enabled';

/**
 * Check if advanced roles are enabled
 * @deprecated This is now always true. Roles are fetched from backend.
 * @returns {boolean} Always returns true
 */
export const isAdvancedRolesEnabled = () => {
  return true;
};

/**
 * Set advanced roles flag
 * @deprecated This no longer has any effect. Roles are fetched from backend.
 * @param {boolean} enabled - Ignored
 */
export const setAdvancedRoles = (enabled) => {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('advancedRolesToggled', { detail: { enabled } }));
  } catch (error) {
    console.error('Error setting advanced roles:', error);
  }
};

/**
 * Toggle advanced roles
 * @deprecated This no longer has any effect. Roles are fetched from backend.
 * @returns {boolean} Always returns true
 */
export const toggleAdvancedRoles = () => {
  const newState = true;
  setAdvancedRoles(newState);
  return newState;
};

/**
 * Get filtered roles based on advanced roles setting
 * @deprecated All roles from backend are now shown. This function returns all roles.
 * @param {Array} allRoles - All available roles
 * @returns {Array} All roles (filtering is no longer applied)
 */
export const getFilteredRoles = (allRoles) => {
  // All roles from backend are now shown
  // No filtering is applied
  return allRoles;
};

export default {
  isAdvancedRolesEnabled,
  setAdvancedRoles,
  toggleAdvancedRoles,
  getFilteredRoles,
};
