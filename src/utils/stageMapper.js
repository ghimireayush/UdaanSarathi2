/**
 * Stage Mapper Utility
 * 
 * Maps between frontend and backend stage naming conventions.
 * Frontend uses hyphens (interview-scheduled), backend uses underscores (interview_scheduled).
 */

/**
 * Frontend to Backend stage mapping
 */
export const STAGE_MAPPING = {
  // Frontend → Backend
  'applied': 'applied',
  'shortlisted': 'shortlisted',
  'interview-scheduled': 'interview_scheduled',
  'interview-passed': 'interview_passed',
  'interview-failed': 'interview_failed',
  'scheduled': 'interview_scheduled', // Alias for convenience
  'passed': 'interview_passed', // Alias for convenience
  'failed': 'interview_failed', // Alias for convenience
}

/**
 * Backend to Frontend stage mapping
 */
export const REVERSE_STAGE_MAPPING = {
  // Backend → Frontend
  'applied': 'applied',
  'shortlisted': 'shortlisted',
  'interview_scheduled': 'interview-scheduled',
  'interview_rescheduled': 'interview-scheduled', // Map rescheduled to scheduled
  'interview_passed': 'interview-passed',
  'interview_failed': 'interview-failed',
  'withdrawn': 'withdrawn',
}

/**
 * Map frontend stage name to backend format
 * @param {string} frontendStage - Stage name from frontend (e.g., 'interview-scheduled')
 * @returns {string} Backend stage name (e.g., 'interview_scheduled')
 */
export const mapStageToBackend = (frontendStage) => {
  if (!frontendStage) return frontendStage
  return STAGE_MAPPING[frontendStage] || frontendStage
}

/**
 * Map backend stage name to frontend format
 * @param {string} backendStage - Stage name from backend (e.g., 'interview_scheduled')
 * @returns {string} Frontend stage name (e.g., 'interview-scheduled')
 */
export const mapStageToFrontend = (backendStage) => {
  if (!backendStage) return backendStage
  return REVERSE_STAGE_MAPPING[backendStage] || backendStage
}

/**
 * Get all valid backend stage values
 * @returns {string[]} Array of valid backend stage values
 */
export const getValidBackendStages = () => {
  return Object.values(STAGE_MAPPING).filter((value, index, self) => 
    self.indexOf(value) === index // Remove duplicates
  )
}

/**
 * Get all valid frontend stage values
 * @returns {string[]} Array of valid frontend stage values
 */
export const getValidFrontendStages = () => {
  return Object.keys(STAGE_MAPPING).filter(key => 
    !['scheduled', 'passed', 'failed'].includes(key) // Exclude aliases
  )
}

/**
 * Validate if a stage name is valid for backend
 * @param {string} stage - Stage name to validate
 * @returns {boolean} True if valid backend stage
 */
export const isValidBackendStage = (stage) => {
  return getValidBackendStages().includes(stage)
}

/**
 * Validate if a stage name is valid for frontend
 * @param {string} stage - Stage name to validate
 * @returns {boolean} True if valid frontend stage
 */
export const isValidFrontendStage = (stage) => {
  return Object.keys(STAGE_MAPPING).includes(stage)
}
