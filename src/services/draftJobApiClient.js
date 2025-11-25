// Draft Job API Client - Real backend integration
import authService from './authService.js';

const API_BASE_URL = 'http://localhost:3000';

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = () => {
  const user = authService.getCurrentUser();
  const token = user?.token || localStorage.getItem('authToken');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Get agency license number from current user
 */
const getAgencyLicense = () => {
  const user = authService.getCurrentUser();
  return user?.agency?.license_number || user?.license_number;
};

/**
 * Handle API errors
 */
const handleApiError = (error, operation) => {
  console.error(`API Error [${operation}]:`, error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.statusText;
    throw new Error(`${operation} failed: ${message}`);
  } else if (error.request) {
    // Request made but no response
    throw new Error(`${operation} failed: No response from server`);
  } else {
    // Error in request setup
    throw new Error(`${operation} failed: ${error.message}`);
  }
};

/**
 * Draft Job API Client
 */
class DraftJobApiClient {
  /**
   * Get all draft jobs for current agency/user
   */
  async getDraftJobs() {
    try {
      const license = getAgencyLicense();
      if (!license) {
        throw new Error('Agency license not found');
      }

      const response = await fetch(`${API_BASE_URL}/agencies/${license}/draft-jobs`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const drafts = await response.json();
      return drafts;
    } catch (error) {
      return handleApiError(error, 'Get draft jobs');
    }
  }

  /**
   * Get single draft job by ID
   */
  async getDraftJobById(draftId) {
    try {
      const license = getAgencyLicense();
      if (!license) {
        throw new Error('Agency license not found');
      }

      const response = await fetch(`${API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const draft = await response.json();
      return draft;
    } catch (error) {
      return handleApiError(error, 'Get draft job');
    }
  }

  /**
   * Create new draft job
   */
  async createDraftJob(draftData) {
    try {
      const license = getAgencyLicense();
      if (!license) {
        throw new Error('Agency license not found');
      }

      const response = await fetch(`${API_BASE_URL}/agencies/${license}/draft-jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(draftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const draft = await response.json();
      return draft;
    } catch (error) {
      return handleApiError(error, 'Create draft job');
    }
  }

  /**
   * Update draft job
   */
  async updateDraftJob(draftId, updateData) {
    try {
      const license = getAgencyLicense();
      if (!license) {
        throw new Error('Agency license not found');
      }

      const response = await fetch(`${API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const draft = await response.json();
      return draft;
    } catch (error) {
      return handleApiError(error, 'Update draft job');
    }
  }

  /**
   * Delete draft job
   */
  async deleteDraftJob(draftId) {
    try {
      const license = getAgencyLicense();
      if (!license) {
        throw new Error('Agency license not found');
      }

      const response = await fetch(`${API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      return true;
    } catch (error) {
      return handleApiError(error, 'Delete draft job');
    }
  }

  /**
   * Validate draft job
   */
  async validateDraftJob(draftId) {
    try {
      const license = getAgencyLicense();
      if (!license) {
        throw new Error('Agency license not found');
      }

      const response = await fetch(`${API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const validation = await response.json();
      return validation;
    } catch (error) {
      return handleApiError(error, 'Validate draft job');
    }
  }

  /**
   * Publish draft job (convert to actual job posting)
   */
  async publishDraftJob(draftId) {
    try {
      const license = getAgencyLicense();
      if (!license) {
        throw new Error('Agency license not found');
      }

      const response = await fetch(`${API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}/publish`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      return handleApiError(error, 'Publish draft job');
    }
  }
}

// Export singleton instance
const draftJobApiClient = new DraftJobApiClient();
export default draftJobApiClient;
