import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useI18n } from '../hooks/useI18n'

const LanguageSwitch = ({ 
  variant = 'default', 
  size = 'md', 
  className = '',
  showLabel = true,
  position = 'bottom-right'
}) => {
  const { locale, setLocale, availableLocales, getLocaleDisplayName, isLoading, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

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

  const handleLanguageChange = async (newLocale) => {
    if (newLocale !== locale) {
      await setLocale(newLocale)
    }
    setIsOpen(false)
  }

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

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:ring-offset-2
          dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]} ${variantClasses[variant]}
        `}
        aria-label={t('common.changeLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className={`${iconSizes[size]} ${isLoading ? 'animate-spin' : ''}`} />
        {showLabel && (
          <>
            <span className="hidden sm:inline">{currentLanguage}</span>
            <span className="sm:hidden">{locale.toUpperCase()}</span>
          </>
        )}
        <ChevronDown className={`${iconSizes[size]} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`
          absolute z-50 min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 
          dark:border-gray-700 rounded-lg shadow-lg py-1 ${positionClasses[position]}
        `}>
          {availableLocales.map((localeCode) => {
            const displayName = getLocaleDisplayName(localeCode)
            const isSelected = localeCode === locale
            
            return (
              <button
                key={localeCode}
                onClick={() => handleLanguageChange(localeCode)}
                className={`
                  w-full px-3 py-2 text-left text-sm transition-colors duration-150
                  hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between
                  ${isSelected 
                    ? 'bg-brand-blue-bright/10 text-brand-blue-bright dark:bg-brand-blue-bright/20' 
                    : 'text-gray-700 dark:text-gray-300'
                  }
                `}
                disabled={isLoading}
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{displayName}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                    {localeCode}
                  </span>
                </span>
                {isSelected && (
                  <div className="w-2 h-2 bg-brand-blue-bright rounded-full"></div>
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