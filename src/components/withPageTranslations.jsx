import React, { useEffect, useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import usePageTranslations from '../hooks/usePageTranslations'

/**
 * Higher-Order Component for automatic page translation loading
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Configuration options
 * @returns {React.Component} Enhanced component with translations
 */
export const withPageTranslations = (WrappedComponent, options = {}) => {
  const {
    pageName,
    preloadPages = [],
    showLoadingSpinner = true,
    showErrorBoundary = true,
    retryOnError = true
  } = options

  const EnhancedComponent = (props) => {
    const { locale, preloadPages: contextPreloadPages } = useLanguage()
    const [hasPreloaded, setHasPreloaded] = useState(false)
    
    // Determine page name from props or options
    const currentPageName = props.pageName || pageName || 'unknown'
    
    // Use the page translations hook
    const {
      translations,
      isLoading,
      error,
      tPage,
      hasTranslation,
      retry
    } = usePageTranslations(currentPageName, {
      retryOnError,
      fallbackToCommon: true
    })

    // Preload additional pages when component mounts
    useEffect(() => {
      if (preloadPages.length > 0 && !hasPreloaded) {
        contextPreloadPages(preloadPages, { background: true })
        setHasPreloaded(true)
      }
    }, [contextPreloadPages, hasPreloaded])

    // Show loading spinner if enabled
    if (showLoadingSpinner && isLoading && Object.keys(translations).length === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading translations...</span>
        </div>
      )
    }

    // Show error boundary if enabled
    if (showErrorBoundary && error && Object.keys(translations).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-800 text-center mb-4">
            Failed to load translations for this page
          </p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )
    }

    // Pass translation functions and data to wrapped component
    const enhancedProps = {
      ...props,
      // Translation functions
      tPage,
      hasTranslation,
      translations,
      // Loading state
      isTranslationsLoading: isLoading,
      translationsError: error,
      // Page info
      pageName: currentPageName,
      locale
    }

    return <WrappedComponent {...enhancedProps} />
  }

  // Set display name for debugging
  EnhancedComponent.displayName = `withPageTranslations(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`

  return EnhancedComponent
}

/**
 * Loading component for translation loading states
 */
export const TranslationLoadingSpinner = ({ message = 'Loading translations...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">{message}</span>
  </div>
)

/**
 * Error component for translation loading errors
 */
export const TranslationErrorBoundary = ({ error, onRetry, pageName }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-red-600 mb-2">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <p className="text-red-800 text-center mb-2">
      Failed to load translations
    </p>
    {pageName && (
      <p className="text-red-600 text-sm text-center mb-4">
        Page: {pageName}
      </p>
    )}
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Retry
    </button>
  </div>
)

export default withPageTranslations