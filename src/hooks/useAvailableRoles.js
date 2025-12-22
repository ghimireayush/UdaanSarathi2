import { useState, useEffect } from 'react';
import httpClient from '../api/config/httpClient.js';

/**
 * Hook to fetch available roles from backend
 * 
 * Fetches roles from /roles/available endpoint.
 * Falls back to local config if API fails.
 * 
 * Usage:
 * const { roles, loading, error } = useAvailableRoles();
 * 
 * @returns {Object} { roles: Array, loading: boolean, error: string|null }
 */
export const useAvailableRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableRoles();
  }, []);

  const fetchAvailableRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await httpClient.get('/roles/available', { requireAuth: false });
      
      if (data.roles && Array.isArray(data.roles)) {
        setRoles(data.roles);
      } else {
        throw new Error('Invalid roles response format');
      }
    } catch (err) {
      console.error('Error fetching available roles:', err);
      setError(err.message);
      // Fallback to backend-supported roles if API fails
      setRoles(getFallbackRoles());
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fallback roles when API is unavailable
   * These match the backend's supported roles from rolePermissions.ts
   */
  const getFallbackRoles = () => {
    return [
      {
        value: 'recruiter',
        label: 'Recruiter',
        description: 'Focuses on candidate sourcing and screening'
      },
      {
        value: 'coordinator',
        label: 'Interview Coordinator',
        description: 'Manages interview scheduling and coordination'
      },
      {
        value: 'viewer',
        label: 'Viewer',
        description: 'Read-only access to view information'
      }
    ];
  };

  return { roles, loading, error };
};

export default useAvailableRoles;
