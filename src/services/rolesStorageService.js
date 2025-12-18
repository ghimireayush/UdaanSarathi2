/**
 * Roles Storage Service
 * Manages roles availability using local storage
 * Flag: true = show all roles, false = show only Admin and Staff
 */

const STORAGE_KEY = 'udaan_advanced_roles_enabled';

/**
 * Check if advanced roles are enabled
 * @returns {boolean} True if all roles should be shown, false if only Admin and Staff
 */
export const isAdvancedRolesEnabled = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch (error) {
    console.error('Error reading advanced roles setting from localStorage:', error);
    return false;
  }
};

/**
 * Set advanced roles flag
 * @param {boolean} enabled - true to show all roles, false to show only Admin and Staff
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
 * @returns {boolean} New state after toggle
 */
export const toggleAdvancedRoles = () => {
  const newState = !isAdvancedRolesEnabled();
  setAdvancedRoles(newState);
  return newState;
};

/**
 * Get filtered roles based on advanced roles setting
 * @param {Array} allRoles - All available roles
 * @returns {Array} Filtered roles (Admin and Staff if disabled, all if enabled)
 */
export const getFilteredRoles = (allRoles) => {
  if (isAdvancedRolesEnabled()) {
    return allRoles;
  }
  return allRoles.filter(role => role.value === 'admin' || role.value === 'staff');
};

export default {
  isAdvancedRolesEnabled,
  setAdvancedRoles,
  toggleAdvancedRoles,
  getFilteredRoles,
};
