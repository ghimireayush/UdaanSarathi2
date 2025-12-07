/**
 * useStageTranslations Hook
 * 
 * SINGLE SOURCE OF TRUTH for stage translations across the application.
 * 
 * This hook provides translated stage labels, descriptions, and actions
 * that can be used in any component that displays stage information.
 * 
 * Usage:
 *   const { getStageLabel, getStageDescription, getStageAction } = useStageTranslations()
 *   const label = getStageLabel('applied') // Returns "आवेदन दिएको" in Nepali
 */

import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from './useLanguage'

// Fallback English translations (used when translations aren't loaded yet)
const FALLBACK_STAGES = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interview_passed: 'Interview Passed',
  interview_failed: 'Interview Failed',
  interview_rescheduled: 'Interview Rescheduled',
  withdrawn: 'Withdrawn',
  rejected: 'Rejected',
  hired: 'Hired'
}

const FALLBACK_DESCRIPTIONS = {
  applied: 'Candidates who have submitted applications',
  shortlisted: 'Candidates selected for interview',
  interview_scheduled: 'Candidates with scheduled interviews',
  interview_passed: 'Candidates who passed interviews',
  interview_failed: 'Candidates who did not pass interviews',
  interview_rescheduled: 'Candidates with rescheduled interviews',
  withdrawn: 'Candidates who withdrew their application',
  rejected: 'Candidates who were rejected',
  hired: 'Candidates who were hired'
}

const FALLBACK_ACTIONS = {
  shortlist: 'Shortlist',
  scheduleInterview: 'Schedule Interview',
  rescheduleInterview: 'Reschedule Interview',
  markPass: 'Mark Pass',
  markFail: 'Mark Fail',
  reject: 'Reject',
  withdraw: 'Withdraw',
  hire: 'Hire'
}

export const useStageTranslations = () => {
  const { locale, t } = useLanguage()
  const [stageTranslations, setStageTranslations] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load stage translations from common/stages.json
  useEffect(() => {
    const loadStageTranslations = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/translations/${locale}/common/stages.json`)
        if (response.ok) {
          const data = await response.json()
          setStageTranslations(data)
        } else {
          console.warn(`Stage translations not found for locale: ${locale}`)
          setStageTranslations(null)
        }
      } catch (error) {
        console.error('Failed to load stage translations:', error)
        setStageTranslations(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadStageTranslations()
  }, [locale])

  /**
   * Get translated stage label
   * @param {string} stage - Stage ID (e.g., 'applied', 'shortlisted')
   * @returns {string} Translated stage label
   */
  const getStageLabel = useCallback((stage) => {
    if (!stage) return ''
    
    // Normalize stage ID (handle both underscore and hyphen formats)
    const normalizedStage = stage.replace(/-/g, '_')
    
    // Try to get from loaded translations
    if (stageTranslations?.stages?.[normalizedStage]) {
      return stageTranslations.stages[normalizedStage]
    }
    
    // Fallback to English
    return FALLBACK_STAGES[normalizedStage] || stage
  }, [stageTranslations])

  /**
   * Get translated stage description
   * @param {string} stage - Stage ID
   * @returns {string} Translated stage description
   */
  const getStageDescription = useCallback((stage) => {
    if (!stage) return ''
    
    const normalizedStage = stage.replace(/-/g, '_')
    
    if (stageTranslations?.stageDescriptions?.[normalizedStage]) {
      return stageTranslations.stageDescriptions[normalizedStage]
    }
    
    return FALLBACK_DESCRIPTIONS[normalizedStage] || ''
  }, [stageTranslations])

  /**
   * Get translated stage action label
   * @param {string} action - Action ID (e.g., 'shortlist', 'markPass')
   * @returns {string} Translated action label
   */
  const getStageAction = useCallback((action) => {
    if (!action) return ''
    
    if (stageTranslations?.stageActions?.[action]) {
      return stageTranslations.stageActions[action]
    }
    
    return FALLBACK_ACTIONS[action] || action
  }, [stageTranslations])

  /**
   * Get all stage labels as an object
   * @returns {Object} Object with stage IDs as keys and translated labels as values
   */
  const getAllStageLabels = useCallback(() => {
    if (stageTranslations?.stages) {
      return stageTranslations.stages
    }
    return FALLBACK_STAGES
  }, [stageTranslations])

  /**
   * Get stages array for dropdowns/filters
   * @returns {Array} Array of { id, label } objects
   */
  const getStagesArray = useCallback(() => {
    const stages = stageTranslations?.stages || FALLBACK_STAGES
    return Object.entries(stages).map(([id, label]) => ({
      id,
      label
    }))
  }, [stageTranslations])

  return {
    getStageLabel,
    getStageDescription,
    getStageAction,
    getAllStageLabels,
    getStagesArray,
    isLoading,
    locale
  }
}

export default useStageTranslations
