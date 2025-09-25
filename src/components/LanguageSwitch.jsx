import { useState, useRef, useEffect, useCallback } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'

const LanguageSwitch = ({ 
  variant = 'default', 
  size = 'md', 
  className = '',
  showLabel = true,
  position = 'bottom-right',
  onLanguageChange
}) => {
  const { locale, setLocale, availableLocales, getLocaleDisplayName, isLoading, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
        break
      case 'ArrowDown':
        event.preventDefault()
        focusNextOption()
        break
      case 'ArrowUp':
        event.preventDefault()
        focusPreviousOption()
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        const focusedElement = document.activeElement
        if (focusedElement && focusedElement.dataset.locale) {
          handleLanguageChange(focusedElement.dataset.locale)
        }
        break
    }
  }, [isOpen])

  // Focus management for keyboard navigation
  const focusNextOption = useCallback(() => {
    const options = dropdownRef.current?.querySelectorAll('[data-locale]')
    if (!options) return

    const currentIndex = Array.from(options).findIndex(option => option === document.activeElement)
    const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
    options[nextIndex]?.focus()
  }, [])

  const focusPreviousOption = useCallback(() => {
    const options = dropdownRef.current?.querySelectorAll('[data-locale]')
    if (!options) return

    const currentIndex = Array.from(options).findIndex(option => option === document.activeElement)
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
    options[previousIndex]?.focus()
  }, [])

  const handleLanguageChange = useCallback(async (newLocale) => {
    if (newLocale === locale || isChanging) return

    setIsChanging(true)
    setIsOpen(false)

    try {
      await setLocale(newLocale)
      
      // Call optional callback
      if (onLanguageChange) {
        onLanguageChange(newLocale)
      }
    } catch (error) {
      console.error('Failed to change language:', error)
    } finally {
      setIsChanging(false)
    }
  }, [locale, isChanging, setLocale, onLanguageChange])

  const handleToggleDropdown = useCallback(() => {
    if (isLoading || isChanging) return
    setIsOpen(!isOpen)
  }, [isOpen, isLoading, isChanging])

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  }

  // Icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  // Variant styles
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
    primary: 'bg-brand-navy text-white hover:bg-brand-navy/90',
    ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
    minimal: 'bg-transparent border-none text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
  }

  // Dropdown position classes
  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-1',
    'bottom-right': 'top-full right-0 mt-1',
    'top-left': 'bottom-full left-0 mb-1',
    'top-right': 'bottom-full right-0 mb-1'
  }

  const currentLanguage = getLocaleDisplayName(locale)
  const isDisabled = isLoading || isChanging

  return (
    <div 
      className={`relative inline-block ${className}`} 
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        disabled={isDisabled}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:ring-offset-2
          dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]} ${variantClasses[variant]}
        `}
        aria-label={t('common.changeLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-describedby={isChanging ? 'language-loading' : undefined}
        type="button"
      >
        <Globe className={`${iconSizes[size]} ${(isLoading || isChanging) ? 'animate-spin' : ''}`} />
        {showLabel && (
          <>
            <span className="hidden sm:inline">{currentLanguage}</span>
            <span className="sm:hidden">{locale.toUpperCase()}</span>
          </>
        )}
        <ChevronDown className={`${iconSizes[size]} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Loading indicator */}
      {isChanging && (
        <div 
          id="language-loading"
          className="absolute top-full left-0 mt-1 px-3 py-2 bg-gray-900 text-white text-sm rounded shadow-lg z-50"
          role="status"
          aria-live="polite"
        >
          {t('common.loading')}...
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={`
            absolute z-50 min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 
            dark:border-gray-700 rounded-lg shadow-lg py-1 ${positionClasses[position]}
          `}
          role="listbox"
          aria-label={t('common.changeLanguage')}
        >
          {availableLocales.map((localeCode, index) => {
            const displayName = getLocaleDisplayName(localeCode)
            const isSelected = localeCode === locale
            
            return (
              <button
                key={localeCode}
                data-locale={localeCode}
                onClick={() => handleLanguageChange(localeCode)}
                className={`
                  w-full px-3 py-2 text-left text-sm transition-colors duration-150
                  hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700
                  focus:outline-none flex items-center justify-between
                  ${isSelected 
                    ? 'bg-brand-blue-bright/10 text-brand-blue-bright dark:bg-brand-blue-bright/20' 
                    : 'text-gray-700 dark:text-gray-300'
                  }
                `}
                disabled={isDisabled}
                role="option"
                aria-selected={isSelected}
                aria-describedby={`locale-${localeCode}-description`}
                tabIndex={isOpen ? 0 : -1}
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{displayName}</span>
                  <span 
                    id={`locale-${localeCode}-description`}
                    className="text-sm text-gray-500 dark:text-gray-400 uppercase"
                  >
                    {localeCode}
                  </span>
                </span>
                {isSelected && (
                  <Check 
                    className="w-4 h-4 text-brand-blue-bright" 
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitch