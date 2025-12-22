import { useState, useEffect } from 'react'
import { AlertTriangle, Check, X, Info, AlertCircle } from 'lucide-react'
import dialogService from '../services/dialogService.js'
import { useLanguage } from '../hooks/useLanguage.js'

/**
 * DialogProvider Component
 * 
 * Provides custom localized dialogs throughout the application
 * Replaces browser default alerts, confirms, and prompts
 * 
 * Usage:
 * Wrap your app with <DialogProvider>
 * Then use dialogService anywhere:
 *   - dialogService.alert(title, message, options)
 *   - dialogService.confirm(title, message, options)
 *   - dialogService.prompt(title, message, options)
 */

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const { tPageSync, locale } = useLanguage({ pageName: 'dialogs', autoLoad: true })

  useEffect(() => {
    const unsubscribe = dialogService.subscribe((dialogConfig) => {
      setDialog(dialogConfig)
      setInputValue(dialogConfig.defaultValue || '')
    })

    return unsubscribe
  }, [])

  const handleConfirm = () => {
    if (dialog.type === 'prompt') {
      dialog.resolve(inputValue)
    } else {
      dialog.resolve(true)
    }
    setDialog(null)
    setInputValue('')
  }

  const handleCancel = () => {
    if (dialog.type === 'prompt') {
      dialog.resolve(null)
    } else {
      dialog.resolve(false)
    }
    setDialog(null)
    setInputValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <>
      {children}
      {dialog && (
        <CustomDialog
          {...dialog}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onKeyDown={handleKeyDown}
          tPageSync={tPageSync}
        />
      )}
    </>
  )
}

const CustomDialog = ({
  type,
  title,
  message,
  dialogType = 'info',
  confirmText,
  cancelText,
  placeholder,
  inputValue,
  onInputChange,
  onConfirm,
  onCancel,
  onKeyDown,
  tPageSync
}) => {
  const getTypeConfig = (dialogType) => {
    const configs = {
      info: {
        icon: Info,
        iconBg: 'bg-blue-100 dark:bg-blue-900',
        iconColor: 'text-blue-600 dark:text-blue-400',
        confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200'
      },
      warning: {
        icon: AlertTriangle,
        iconBg: 'bg-yellow-100 dark:bg-yellow-900',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        confirmBtn: 'bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200'
      },
      danger: {
        icon: AlertCircle,
        iconBg: 'bg-red-100 dark:bg-red-900',
        iconColor: 'text-red-600 dark:text-red-400',
        confirmBtn: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200'
      },
      success: {
        icon: Check,
        iconBg: 'bg-green-100 dark:bg-green-900',
        iconColor: 'text-green-600 dark:text-green-400',
        confirmBtn: 'bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200'
      }
    }
    return configs[dialogType] || configs.info
  }

  const config = getTypeConfig(dialogType)
  const Icon = config.icon

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      role="presentation"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div className="p-6">
          <div className="flex items-start">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} aria-hidden="true" />
            </div>
            <div className="ml-4 flex-1">
              <h3 id="dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {title}
              </h3>
              <p id="dialog-description" className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {message}
              </p>
              
              {type === 'prompt' && (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={placeholder}
                  autoFocus
                  className="mt-4 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          {type !== 'alert' && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-medium rounded-md transition-colors duration-200"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`${config.confirmBtn}`}
            autoFocus={type === 'alert'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DialogProvider
