/**
 * ActionButton Component
 * 
 * Wraps buttons with permission checks
 * Shows/hides button based on user role
 * Displays tooltip on hover if permission denied
 * 
 * Usage:
 * <ActionButton
 *   actionKey="SHORTLIST_CANDIDATE"
 *   onClick={handleShortlist}
 *   className="..."
 * >
 *   Shortlist
 * </ActionButton>
 */

import { useActionPermission } from '../hooks/useActionPermission'
import { Lock } from 'lucide-react'

const ActionButton = ({
  actionKey,
  onClick,
  children,
  className = '',
  disabled = false,
  title = '',
  showIfDenied = false,
  onPermissionDenied = null,
  ...props
}) => {
  const { canPerform, getErrorMessage } = useActionPermission()
  
  const hasPermission = canPerform(actionKey)
  const errorMessage = getErrorMessage(actionKey)
  
  // If no permission and showIfDenied is false, don't render
  if (!hasPermission && !showIfDenied) {
    return null
  }
  
  // If no permission and showIfDenied is true, show disabled button with tooltip
  if (!hasPermission && showIfDenied) {
    return (
      <div className="relative group">
        <button
          disabled={true}
          className={`${className} opacity-50 cursor-not-allowed`}
          title={errorMessage}
          {...props}
        >
          <span className="flex items-center gap-1">
            {children}
            <Lock size={14} className="inline" />
          </span>
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {errorMessage}
        </div>
      </div>
    )
  }
  
  // Has permission - render normal button
  const handleClick = (e) => {
    if (!hasPermission) {
      e.preventDefault()
      if (onPermissionDenied) {
        onPermissionDenied(errorMessage)
      }
      return
    }
    onClick?.(e)
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      title={title || ''}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

export default ActionButton
