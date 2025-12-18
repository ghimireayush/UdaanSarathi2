import { useState, useEffect } from 'react';
import rolesStorageService from '../services/rolesStorageService';

/**
 * Hook to manage advanced roles toggle state
 * Listens to localStorage changes and custom events
 * @returns {Object} { isEnabled, toggle }
 */
export const useAdvancedRoles = () => {
  const [isEnabled, setIsEnabled] = useState(() => 
    rolesStorageService.isAdvancedRolesEnabled()
  );

  useEffect(() => {
    const handleToggle = (event) => {
      setIsEnabled(event.detail.enabled);
    };

    window.addEventListener('advancedRolesToggled', handleToggle);
    return () => window.removeEventListener('advancedRolesToggled', handleToggle);
  }, []);

  const toggle = () => {
    const newState = rolesStorageService.toggleAdvancedRoles();
    setIsEnabled(newState);
  };

  return { isEnabled, toggle };
};

export default useAdvancedRoles;
