import React from 'react'
import { format } from 'date-fns'
import { useLanguage } from '../hooks/useLanguage'

/**
 * ApplicationHistory Component
 * Displays a timeline of application status changes with audit trail
 * Shows who made changes, when, and any notes/reasons
 */
const ApplicationHistory = ({ historyBlob }) => {
  const { tPageSync } = useLanguage({ pageName: 'application-history', autoLoad: true })
  const t = (key, params = {}) => tPageSync(key, params)
  if (!historyBlob || historyBlob.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        {t('noHistory')}
      </div>
    )
  }

  /**
   * Format updated_by field for display
   */
  const formatUpdatedBy = (updatedBy) => {
    if (!updatedBy) return t('system')
    
    // Map common values to display names
    const updatedByMap = {
      'system': t('system'),
      'agency': 'agency',
      'admin': 'admin',
      'candidate': t('candidate')
    }
    
    // If it's a known value, use mapped name, otherwise use as-is (for names)
    return updatedByMap[updatedBy.toLowerCase()] || updatedBy
  }

  /**
   * Get badge color based on status
   */
  const getStatusBadgeColor = (status) => {
    const colors = {
      'applied': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      'shortlisted': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'interview_scheduled': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      'interview_rescheduled': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      'interview_passed': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'interview_failed': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      'withdrawn': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
    return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  }

  /**
   * Format status for display
   */
  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('title')}</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>
        
        {/* History entries */}
        <div className="space-y-6">
          {historyBlob.map((entry, index) => (
            <div key={index} className="relative flex items-start space-x-4">
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full">
                <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
              </div>
              
              {/* Entry content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(entry.next_status)}`}>
                    {formatStatus(entry.next_status)}
                  </span>
                  {entry.corrected && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                      {t('corrected')}
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{formatUpdatedBy(entry.updated_by)} द्वारा</span>
                  <span className="mx-1">•</span>
                  <span>{format(new Date(entry.updated_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                
                {entry.note && (
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                    {entry.note}
                  </div>
                )}
                
                {entry.prev_status && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('changedFrom')} {formatStatus(entry.prev_status)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ApplicationHistory
