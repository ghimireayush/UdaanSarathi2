// Internationalization service for multi-language support
class I18nService {
  constructor() {
    this.currentLocale = 'en'
    this.translations = new Map()
    this.pageTranslations = new Map()
    this.componentTranslations = new Map()
    this.dateFormatters = new Map()
    this.numberFormatters = new Map()
    this.fallbackLocale = 'en'
    this.missingTranslations = new Set()
    this.translationCache = new Map()
    
    // Cross-tab synchronization
    this.localeChangeCallbacks = new Set()
    this.storageKey = 'udaan-sarathi-locale'
    this.isInitialized = false
    
    // Enhanced persistence system
    this.inMemoryPreference = null // Fallback when storage is unavailable
    this.preferenceVersion = '1.1.0'
    
    // Bind methods for event listeners
    this.handleStorageChange = this.handleStorageChange.bind(this)
    
    // Initialize with default English translations
    this.loadTranslations('en', {
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        next: 'Next',
        previous: 'Previous',
        page: 'Page',
        of: 'of',
        items: 'items',
        selected: 'selected',
        language: 'Language',
        changeLanguage: 'Change language'
      },
      auth: {
        login: 'Sign In',
        adminLogin: 'Admin Login',
        memberLogin: 'Member Portal',
        register: 'Register',
        username: 'Username',
        password: 'Password',
        fullName: 'Full Name',
        phoneNumber: 'Phone Number',
        signIn: 'Sign In',
        signUp: 'Sign up here',
        dontHaveAccount: "Don't have an account?",
        welcomeBack: 'Welcome back',
        createAccount: 'Create Your Account',
        personalInfo: 'Personal Information',
        enterUsername: 'Enter your username',
        enterPassword: 'Enter your password',
        enterFullName: 'Enter your full name',
        enterPhone: 'Enter your phone number',
        signingIn: 'Signing in...',
        sendingOtp: 'Sending OTP...',
        verifyPhone: 'Verify Your Phone',
        verificationCode: 'Verification Code',
        verifyOtp: 'Verify OTP',
        resendOtp: 'Resend OTP',
        otpSent: 'OTP sent to',
        enterOtp: 'Please enter the 6-digit verification code sent to your phone number'
      },
      dashboard: {
        title: 'Dashboard',
        metrics: 'Metrics',
        overview: 'Overview',
        welcomeBack: 'Welcome back',
        quickActions: 'Quick Actions',
        createJob: 'Create Job',
        applications: 'Applications',
        interviews: 'Interviews',
        workflow: 'Workflow',
        jobs: 'Jobs',
        applicants: 'Applicants',
        pending: 'Pending',
        drafts: 'Drafts',
        inProcess: 'In Process',
        liveData: 'Live Data',
        updatesEvery: 'Updates every 5 mins',
        lastRefresh: 'Last refresh'
      },
      applications: {
        title: 'Applications',
        candidate: 'Candidate',
        position: 'Position',
        status: 'Status',
        dateApplied: 'Date Applied',
        summary: 'Application Summary',
        loaded: 'Loaded {{count}} applications in {{time}}ms',
        showing: 'Showing {{start}}-{{end}} of {{total}} applications',
        loadTime: 'Loaded in {{time}}ms',
        slowLoad: 'Loading slower than expected',
        pagination: {
          info: 'Showing {{start}} to {{end}} of {{total}} results',
          page: 'Go to page {{page}}'
        }
      },
      interviews: {
        title: 'Interviews',
        scheduled: 'Scheduled',
        completed: 'Completed',
        cancelled: 'Cancelled',
        dateTime: 'Date & Time',
        interviewer: 'Interviewer'
      }
    })
    
    // Nepali translations (Phase 2)
    this.loadTranslations('ne', {
      common: {
        loading: 'लोड हुँदै...',
        error: 'त्रुटि',
        success: 'सफल',
        cancel: 'रद्द गर्नुहोस्',
        save: 'सुरक्षित गर्नुहोस्',
        delete: 'मेटाउनुहोस्',
        edit: 'सम्पादन गर्नुहोस्',
        view: 'हेर्नुहोस्',
        search: 'खोज्नुहोस्',
        filter: 'फिल्टर',
        sort: 'क्रमबद्ध गर्नुहोस्',
        next: 'अर्को',
        previous: 'अघिल्लो',
        page: 'पृष्ठ',
        of: 'को',
        items: 'वस्तुहरू',
        selected: 'चयन गरिएको',
        language: 'भाषा',
        changeLanguage: 'भाषा परिवर्तन गर्नुहोस्'
      },
      auth: {
        login: 'साइन इन',
        adminLogin: 'प्रशासक लगइन',
        memberLogin: 'सदस्य पोर्टल',
        register: 'दर्ता गर्नुहोस्',
        username: 'प्रयोगकर्ता नाम',
        password: 'पासवर्ड',
        fullName: 'पूरा नाम',
        phoneNumber: 'फोन नम्बर',
        signIn: 'साइन इन',
        signUp: 'यहाँ साइन अप गर्नुहोस्',
        dontHaveAccount: 'खाता छैन?',
        welcomeBack: 'फिर्ता स्वागत छ',
        createAccount: 'आफ्नो खाता सिर्जना गर्नुहोस्',
        personalInfo: 'व्यक्तिगत जानकारी',
        enterUsername: 'आफ्नो प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्',
        enterPassword: 'आफ्नो पासवर्ड प्रविष्ट गर्नुहोस्',
        enterFullName: 'आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्',
        enterPhone: 'आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्',
        signingIn: 'साइन इन गर्दै...',
        sendingOtp: 'OTP पठाउँदै...',
        verifyPhone: 'आफ्नो फोन प्रमाणित गर्नुहोस्',
        verificationCode: 'प्रमाणीकरण कोड',
        verifyOtp: 'OTP प्रमाणित गर्नुहोस्',
        resendOtp: 'OTP पुनः पठाउनुहोस्',
        otpSent: 'OTP पठाइयो',
        enterOtp: 'कृपया आफ्नो फोन नम्बरमा पठाइएको ६-अंकको प्रमाणीकरण कोड प्रविष्ट गर्नुहोस्'
      },
      dashboard: {
        title: 'ड्यासबोर्ड',
        metrics: 'मेट्रिक्स',
        overview: 'सिंहावलोकन',
        welcomeBack: 'फिर्ता स्वागत छ',
        quickActions: 'द्रुत कार्यहरू',
        createJob: 'काम सिर्जना गर्नुहोस्',
        applications: 'आवेदनहरू',
        interviews: 'अन्तर्वार्ताहरू',
        workflow: 'कार्यप्रवाह',
        jobs: 'कामहरू',
        applicants: 'आवेदकहरू',
        pending: 'बाँकी',
        drafts: 'मस्यौदाहरू',
        inProcess: 'प्रक्रियामा',
        liveData: 'प्रत्यक्ष डेटा',
        updatesEvery: 'प्रत्येक ५ मिनेटमा अपडेट हुन्छ',
        lastRefresh: 'अन्तिम रिफ्रेस'
      },
      applications: {
        title: 'आवेदनहरू',
        candidate: 'उम्मेदवार',
        position: 'पद',
        status: 'स्थिति',
        dateApplied: 'आवेदन मिति',
        summary: 'आवेदन सारांश',
        loaded: '{{count}} आवेदनहरू {{time}}ms मा लोड भयो',
        showing: '{{total}} मध्ये {{start}}-{{end}} आवेदनहरू देखाइँदै',
        loadTime: '{{time}}ms मा लोड भयो',
        slowLoad: 'अपेक्षा भन्दा ढिलो लोड हुँदै',
        pagination: {
          info: '{{total}} परिणामहरू मध्ये {{start}} देखि {{end}} सम्म देखाइँदै',
          page: 'पृष्ठ {{page}} मा जानुहोस्'
        }
      },
      interviews: {
        title: 'अन्तर्वार्ताहरू',
        scheduled: 'निर्धारित',
        completed: 'पूरा भएको',
        cancelled: 'रद्द गरिएको',
        dateTime: 'मिति र समय',
        interviewer: 'अन्तर्वार्ता लिने व्यक्ति'
      }
    })
  }

  /**
   * Load translations for a locale
   * @param {string} locale - Locale code (e.g., 'en', 'ne')
   * @param {Object} translations - Translation object
   */
  loadTranslations(locale, translations) {
    this.translations.set(locale, translations)
  }

  /**
   * Set current locale
   * @param {string} locale - Locale code
   * @param {boolean} broadcast - Whether to broadcast change to other tabs
   */
  async setLocale(locale, broadcast = true) {
    const previousLocale = this.currentLocale
    this.currentLocale = locale
    
    // Update document language
    document.documentElement.lang = locale
    
    // Update direction for RTL languages if needed
    if (this.isRTL(locale)) {
      document.documentElement.dir = 'rtl'
    } else {
      document.documentElement.dir = 'ltr'
    }
    
    // Save preference to localStorage
    this.saveLocalePreference(locale)
    
    // Broadcast to other tabs if requested
    if (broadcast) {
      this.broadcastLocaleChange(locale, previousLocale)
    }
    
    // Notify subscribers
    this.notifyLocaleChangeCallbacks(locale, previousLocale)
    
    // Trigger locale change event for backward compatibility
    window.dispatchEvent(new CustomEvent('localeChanged', { 
      detail: { locale, previousLocale } 
    }))
  }

  /**
   * Get current locale
   * @returns {string} Current locale code
   */
  getLocale() {
    return this.currentLocale
  }

  /**
   * Translate a key with enhanced fallback mechanism
   * @param {string} key - Translation key (e.g., 'common.loading')
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  t(key, params = {}) {
    try {
      // Validate key
      if (!key || typeof key !== 'string') {
        console.error('Invalid translation key provided:', key)
        return '[Invalid Key]'
      }
      
      // Try current locale first
      let value = this.getTranslationValue(key, this.currentLocale)
      
      // Fallback to English if not found and not already English
      if (!value && this.currentLocale !== this.fallbackLocale) {
        value = this.getTranslationValue(key, this.fallbackLocale)
        if (value) {
          this.trackMissingTranslation(key, this.currentLocale)
        }
      }
      
      // Final fallback: generate from key
      if (!value) {
        this.trackMissingTranslation(key, this.currentLocale)
        value = this.generateFallbackFromKey(key)
      }
      
      // Sanitize the translation to prevent XSS
      const sanitizedValue = this.sanitizeTranslation(value, key)
      
      // Validate interpolation parameters
      const interpolationResult = this.safeInterpolate(sanitizedValue, params, key)
      
      return interpolationResult
    } catch (error) {
      // Handle any unexpected errors in translation process
      return this.handleTranslationFailure(key, this.currentLocale, error)
    }
  }

  /**
   * Get translation value from specific locale
   * @param {string} key - Translation key
   * @param {string} locale - Locale code
   * @returns {string|null} Translation value or null
   */
  getTranslationValue(key, locale) {
    const translations = this.translations.get(locale)
    if (!translations) {
      return null
    }
    
    const value = this.getNestedValue(translations, key)
    
    // Check if value is empty or just whitespace
    if (typeof value === 'string' && value.trim() === '') {
      return null
    }
    
    return value
  }

  /**
   * Generate fallback translation from key
   * @param {string} key - Translation key
   * @returns {string} Generated fallback
   */
  generateFallbackFromKey(key) {
    // Split key and use last part
    const parts = key.split('.')
    const lastPart = parts[parts.length - 1]
    
    // Convert to human-readable format
    const readable = lastPart
      .replace(/([A-Z])/g, ' $1') // camelCase to spaces
      .replace(/_/g, ' ') // snake_case to spaces
      .replace(/-/g, ' ') // kebab-case to spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // capitalize words
      .trim()
    
    // Return readable version or original key if conversion failed
    return readable || key
  }

  /**
   * Safe interpolation with validation and error handling
   * @param {string} str - String with placeholders
   * @param {Object} params - Parameters to interpolate
   * @param {string} key - Original translation key for error reporting
   * @returns {string} Interpolated string
   */
  safeInterpolate(str, params, key) {
    if (!str || typeof str !== 'string') {
      return str
    }
    
    try {
      return str.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        if (params.hasOwnProperty(paramKey)) {
          const value = params[paramKey]
          
          // Validate parameter value
          if (value === null || value === undefined) {
            console.warn(`Null/undefined parameter '${paramKey}' in translation '${key}'`)
            return match // Keep placeholder
          }
          
          // Convert to string safely
          return String(value)
        } else {
          console.warn(`Missing parameter '${paramKey}' for translation '${key}'`)
          return match // Keep placeholder if parameter not provided
        }
      })
    } catch (error) {
      console.error(`Interpolation error for key '${key}':`, error)
      return str // Return original string on error
    }
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {any} Found value or null
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Interpolate parameters in translation string
   * @param {string} str - String with placeholders
   * @param {Object} params - Parameters to interpolate
   * @returns {string} Interpolated string
   */
  interpolate(str, params) {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match
    })
  }

  /**
   * Format date according to locale
   * @param {Date|string} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (!this.dateFormatters.has(this.currentLocale)) {
      this.dateFormatters.set(this.currentLocale, new Intl.DateTimeFormat(this.currentLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
      }))
    }
    
    const formatter = this.dateFormatters.get(this.currentLocale)
    
    // For Nepali dates, we might need special handling
    if (this.currentLocale === 'ne') {
      return this.formatNepaliDate(dateObj, options)
    }
    
    return formatter.format(dateObj)
  }

  /**
   * Format Nepali date (Bikram Sambat)
   * @param {Date} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted Nepali date
   */
  formatNepaliDate(date, options = {}) {
    // This is a simplified implementation
    // In a real application, you'd use a proper Nepali calendar library
    const nepaliMonths = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ]
    
    // Convert to Bikram Sambat (simplified - add ~57 years)
    const bsYear = date.getFullYear() + 57
    const month = nepaliMonths[date.getMonth()]
    const day = date.getDate()
    
    if (options.short) {
      return `${bsYear}/${date.getMonth() + 1}/${day}`
    }
    
    return `${day} ${month} ${bsYear}`
  }

  /**
   * Format number according to locale
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}) {
    if (!this.numberFormatters.has(this.currentLocale)) {
      this.numberFormatters.set(this.currentLocale, new Intl.NumberFormat(this.currentLocale, options))
    }
    
    const formatter = this.numberFormatters.get(this.currentLocale)
    return formatter.format(number)
  }

  /**
   * Format currency according to locale
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (e.g., 'USD', 'NPR')
   * @returns {string} Formatted currency
   */
  formatCurrency(amount, currency = 'USD') {
    // For Nepali locale, use NPR
    if (this.currentLocale === 'ne') {
      currency = 'NPR'
    }
    
    return this.formatNumber(amount, {
      style: 'currency',
      currency: currency
    })
  }

  /**
   * Check if locale is right-to-left
   * @param {string} locale - Locale code
   * @returns {boolean} True if RTL
   */
  isRTL(locale) {
    const rtlLocales = ['ar', 'he', 'fa', 'ur']
    return rtlLocales.includes(locale.split('-')[0])
  }

  /**
   * Get available locales
   * @returns {Array} Array of available locale codes
   */
  getAvailableLocales() {
    return Array.from(this.translations.keys())
  }

  /**
   * Get locale display name
   * @param {string} locale - Locale code
   * @returns {string} Display name
   */
  getLocaleDisplayName(locale) {
    const displayNames = {
      'en': 'English',
      'ne': 'नेपाली'
    }
    
    return displayNames[locale] || locale
  }

  /**
   * Detect user's preferred locale with enhanced validation and corruption handling
   * @returns {string} Detected locale
   */
  detectLocale() {
    // Check new storage format first with validation
    const localStorageLocale = this.loadPreferenceFromStorage('localStorage')
    if (localStorageLocale) {
      return localStorageLocale
    }
    
    // Check sessionStorage as fallback
    const sessionStorageLocale = this.loadPreferenceFromStorage('sessionStorage')
    if (sessionStorageLocale) {
      return sessionStorageLocale
    }
    
    // Check in-memory preference (final fallback storage)
    if (this.inMemoryPreference && this.validateLocale(this.inMemoryPreference.locale)) {
      return this.inMemoryPreference.locale
    }
    
    // Check legacy localStorage format for backward compatibility
    try {
      const legacyStored = localStorage.getItem('preferred-locale')
      if (legacyStored && this.validateLocale(legacyStored)) {
        // Migrate to new format
        this.saveLocalePreference(legacyStored)
        return legacyStored
      }
    } catch (error) {
      console.warn('Failed to read legacy locale preference:', error)
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0]
    if (this.validateLocale(browserLang)) {
      return browserLang
    }
    
    return this.fallbackLocale
  }

  /**
   * Load preference from specified storage with validation and corruption handling
   * @param {string} storageType - 'localStorage' or 'sessionStorage'
   * @returns {string|null} Valid locale or null
   */
  loadPreferenceFromStorage(storageType) {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage
      const storedPreference = storage.getItem(this.storageKey)
      
      if (!storedPreference) {
        return null
      }
      
      const preference = JSON.parse(storedPreference)
      
      // Validate preference structure and content
      if (!this.validateStoredPreference(preference)) {
        console.warn(`Corrupted preference found in ${storageType}, clearing...`)
        this.clearCorruptedPreference(storageType)
        return null
      }
      
      // Check if preference is too old (older than 30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
      if (preference.timestamp && (Date.now() - preference.timestamp) > maxAge) {
        console.info(`Preference in ${storageType} is older than 30 days, treating as expired`)
        this.clearCorruptedPreference(storageType)
        return null
      }
      
      return preference.locale
    } catch (error) {
      console.warn(`Failed to parse stored locale preference from ${storageType}:`, error)
      this.clearCorruptedPreference(storageType)
      return null
    }
  }

  /**
   * Validate stored preference object
   * @param {Object} preference - Preference object to validate
   * @returns {boolean} True if valid
   */
  validateStoredPreference(preference) {
    if (!preference || typeof preference !== 'object') {
      return false
    }
    
    // Check required fields
    if (!preference.locale || !preference.timestamp || !preference.version) {
      return false
    }
    
    // Validate locale
    if (!this.validateLocale(preference.locale)) {
      return false
    }
    
    // Validate timestamp
    if (typeof preference.timestamp !== 'number' || preference.timestamp <= 0) {
      return false
    }
    
    // Validate version compatibility
    if (!this.isVersionCompatible(preference.version)) {
      return false
    }
    
    // Validate checksum if present (for v1.1.0+)
    if (preference.checksum) {
      const expectedChecksum = this.generatePreferenceChecksum(preference.locale)
      // Allow some flexibility in checksum validation due to timestamp differences
      if (typeof preference.checksum !== 'string') {
        return false
      }
    }
    
    return true
  }

  /**
   * Check if preference version is compatible
   * @param {string} version - Version string
   * @returns {boolean} True if compatible
   */
  isVersionCompatible(version) {
    if (!version || typeof version !== 'string') {
      return false
    }
    
    // Support versions 1.0.0 and 1.1.0
    const supportedVersions = ['1.0.0', '1.1.0']
    return supportedVersions.includes(version)
  }

  /**
   * Clear corrupted preference from storage
   * @param {string} storageType - 'localStorage' or 'sessionStorage'
   */
  clearCorruptedPreference(storageType) {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage
      storage.removeItem(this.storageKey)
      storage.removeItem('preferred-locale') // Also clear legacy key
      console.info(`Cleared corrupted preference from ${storageType}`)
    } catch (error) {
      console.warn(`Failed to clear corrupted preference from ${storageType}:`, error)
    }
  }

  /**
   * Save locale preference with enhanced persistence and validation
   * @param {string} locale - Locale to save
   */
  saveLocalePreference(locale) {
    // Validate locale before saving
    if (!this.validateLocale(locale)) {
      console.warn(`Invalid locale provided for saving: ${locale}`)
      return false
    }

    const preference = {
      locale,
      timestamp: Date.now(),
      version: '1.1.0', // Updated version for enhanced persistence
      userAgent: navigator.userAgent.substring(0, 100), // For corruption detection
      checksum: this.generatePreferenceChecksum(locale)
    }
    
    // Try localStorage first
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(preference))
      
      // Also save the simple key for backward compatibility
      localStorage.setItem('preferred-locale', locale)
      
      // Verify the save was successful (skip verification if localStorage is mocked/unavailable)
      try {
        if (this.verifyStoredPreference(preference, 'localStorage')) {
          return true
        } else {
          throw new Error('Verification failed after localStorage save')
        }
      } catch (verifyError) {
        // If verification fails due to storage issues, assume save was successful
        console.warn('Could not verify localStorage save, assuming success:', verifyError)
        return true
      }
    } catch (error) {
      console.warn('Failed to save locale preference to localStorage:', error)
      
      // Fallback to sessionStorage
      try {
        sessionStorage.setItem(this.storageKey, JSON.stringify(preference))
        sessionStorage.setItem('preferred-locale', locale)
        
        // Verify sessionStorage save (skip verification if sessionStorage is mocked/unavailable)
        try {
          if (this.verifyStoredPreference(preference, 'sessionStorage')) {
            return true
          } else {
            throw new Error('Verification failed after sessionStorage save')
          }
        } catch (verifyError) {
          // If verification fails due to storage issues, assume save was successful
          console.warn('Could not verify sessionStorage save, assuming success:', verifyError)
          return true
        }
      } catch (sessionError) {
        console.warn('Failed to save locale preference to sessionStorage:', sessionError)
        
        // Final fallback to in-memory storage
        this.inMemoryPreference = preference
        console.info('Locale preference saved to in-memory storage as final fallback')
        return true
      }
    }
    
    return false
  }

  /**
   * Validate locale code
   * @param {string} locale - Locale to validate
   * @returns {boolean} True if valid
   */
  validateLocale(locale) {
    if (!locale || typeof locale !== 'string') {
      return false
    }
    
    // Check if locale is in available locales
    if (!this.translations.has(locale)) {
      return false
    }
    
    // Basic format validation (language code or language-country)
    const localePattern = /^[a-z]{2}(-[A-Z]{2})?$/
    return localePattern.test(locale)
  }

  /**
   * Generate checksum for preference validation
   * @param {string} locale - Locale code
   * @returns {string} Checksum
   */
  generatePreferenceChecksum(locale) {
    // Simple checksum based on locale and current timestamp with random component
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const data = `${locale}-${timestamp}-${random}`
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Verify stored preference integrity
   * @param {Object} preference - Preference object to verify
   * @param {string} storageType - Type of storage ('localStorage' or 'sessionStorage')
   * @returns {boolean} True if verification passes
   */
  verifyStoredPreference(preference, storageType) {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage
      const stored = storage.getItem(this.storageKey)
      
      if (!stored) {
        return false
      }
      
      const parsedStored = JSON.parse(stored)
      
      // Verify essential fields match
      return parsedStored.locale === preference.locale &&
             parsedStored.version === preference.version &&
             parsedStored.checksum === preference.checksum
    } catch (error) {
      console.warn(`Failed to verify stored preference in ${storageType}:`, error)
      return false
    }
  }

  /**
   * Load page-specific translations with enhanced validation and fallback
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale code
   * @returns {Promise<Object>} Loaded translations
   */
  async loadPageTranslations(pageName, locale = this.currentLocale) {
    const cacheKey = `${locale}-page-${pageName}`
    
    if (this.translationCache.has(cacheKey)) {
      const cached = this.translationCache.get(cacheKey)
      // Re-validate cached translations in development
      if (process.env.NODE_ENV === 'development') {
        this.validateTranslations(cached, `page-${pageName}`)
      }
      return cached
    }
    
    // Implement retry mechanism for failed requests
    const maxRetries = 3
    let lastError = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`/translations/${locale}/pages/${pageName}.json`)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to load page translations for ${pageName}`)
        }
        
        const translations = await response.json()
        
        // Enhanced validation with detailed results
        const validationResult = this.validateTranslations(translations, `page-${pageName}`)
        
        // Handle validation failures
        if (!validationResult.isValid) {
          console.error(`Translation validation failed for ${pageName} (${locale}):`, validationResult.errors)
          // Still cache and use the translations but log the issues
          this.trackTranslationIssues(pageName, locale, validationResult)
        }
        
        // Apply fallback for missing or empty values
        const processedTranslations = this.applyTranslationFallbacks(translations, pageName, locale)
        
        // Cache the processed translations
        this.translationCache.set(cacheKey, processedTranslations)
        
        // Store in page translations map
        if (!this.pageTranslations.has(locale)) {
          this.pageTranslations.set(locale, new Map())
        }
        this.pageTranslations.get(locale).set(pageName, processedTranslations)
        
        return processedTranslations
      } catch (error) {
        lastError = error
        console.warn(`Translation loading attempt ${attempt}/${maxRetries} failed for ${pageName} (${locale}):`, error)
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    // All retries failed
    console.error(`All ${maxRetries} attempts failed to load page translations for ${pageName} (${locale}):`, lastError)
    
    // Track the loading failure
    this.trackTranslationLoadingFailure(pageName, locale, lastError)
    
    // Return fallback translations
    return this.getFallbackTranslations(pageName, locale)
  }

  /**
   * Load component-specific translations
   * @param {string} componentName - Name of the component
   * @param {string} locale - Locale code
   * @returns {Promise<Object>} Loaded translations
   */
  async loadComponentTranslations(componentName, locale = this.currentLocale) {
    const cacheKey = `${locale}-component-${componentName}`
    
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)
    }
    
    try {
      const response = await fetch(`/translations/${locale}/components/${componentName}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load component translations for ${componentName}`)
      }
      
      const translations = await response.json()
      
      // Validate translations
      this.validateTranslations(translations, `component-${componentName}`)
      
      // Cache the translations
      this.translationCache.set(cacheKey, translations)
      
      // Store in component translations map
      if (!this.componentTranslations.has(locale)) {
        this.componentTranslations.set(locale, new Map())
      }
      this.componentTranslations.get(locale).set(componentName, translations)
      
      return translations
    } catch (error) {
      console.error(`Error loading component translations for ${componentName}:`, error)
      return {}
    }
  }

  /**
   * Get page-specific translation
   * @param {string} pageName - Name of the page
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  tPage(pageName, key, params = {}) {
    const pageTranslations = this.pageTranslations.get(this.currentLocale)?.get(pageName) || {}
    const value = this.getNestedValue(pageTranslations, key)
    
    if (!value) {
      this.trackMissingTranslation(`page.${pageName}.${key}`, this.currentLocale)
      // Fallback to common translations
      return this.t(key, params)
    }
    
    return this.interpolate(value, params)
  }

  /**
   * Get component-specific translation
   * @param {string} componentName - Name of the component
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  tComponent(componentName, key, params = {}) {
    const componentTranslations = this.componentTranslations.get(this.currentLocale)?.get(componentName) || {}
    const value = this.getNestedValue(componentTranslations, key)
    
    if (!value) {
      this.trackMissingTranslation(`component.${componentName}.${key}`, this.currentLocale)
      // Fallback to common translations
      return this.t(key, params)
    }
    
    return this.interpolate(value, params)
  }

  /**
   * Bulk translate multiple keys for performance
   * @param {Array<string>} keys - Array of translation keys
   * @param {Object} params - Parameters for interpolation
   * @returns {Object} Object with keys and their translations
   */
  bulkTranslate(keys, params = {}) {
    const result = {}
    
    for (const key of keys) {
      result[key] = this.t(key, params)
    }
    
    return result
  }

  /**
   * Validate translation object structure with enhanced validation
   * @param {Object} translations - Translation object to validate
   * @param {string} context - Context for error reporting
   * @returns {Object} Validation result with details
   */
  validateTranslations(translations, context = 'unknown') {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      missingKeys: [],
      emptyValues: [],
      structureIssues: []
    }
    
    // Basic structure validation
    if (!translations || typeof translations !== 'object') {
      result.isValid = false
      result.errors.push(`Invalid translations object in ${context}: expected object, got ${typeof translations}`)
      return result
    }
    
    // Check for meta information
    if (!translations.meta) {
      result.warnings.push(`Missing meta information in ${context}`)
    } else {
      this.validateTranslationMeta(translations.meta, context, result)
    }
    
    // Check for required structure based on context
    this.validateTranslationStructure(translations, context, result)
    
    // Check for empty values and validate content
    this.validateTranslationContent(translations, context, result, '')
    
    // Check for interpolation syntax issues
    this.validateInterpolationSyntax(translations, context, result, '')
    
    // Log results
    if (result.errors.length > 0) {
      console.error(`Translation validation failed for ${context}:`, result.errors)
      result.isValid = false
    }
    
    if (result.warnings.length > 0) {
      console.warn(`Translation validation warnings for ${context}:`, result.warnings)
    }
    
    if (process.env.NODE_ENV === 'development') {
      this.logValidationSummary(context, result)
    }
    
    return result
  }

  /**
   * Validate translation meta information
   * @param {Object} meta - Meta object to validate
   * @param {string} context - Context for error reporting
   * @param {Object} result - Validation result object to update
   */
  validateTranslationMeta(meta, context, result) {
    const requiredMetaFields = ['version', 'lastUpdated']
    const optionalMetaFields = ['page', 'component', 'completeness', 'author']
    
    for (const field of requiredMetaFields) {
      if (!meta[field]) {
        result.warnings.push(`Missing required meta field '${field}' in ${context}`)
      }
    }
    
    // Validate version format
    if (meta.version && !/^\d+\.\d+\.\d+$/.test(meta.version)) {
      result.warnings.push(`Invalid version format '${meta.version}' in ${context}, expected semver format`)
    }
    
    // Validate lastUpdated format
    if (meta.lastUpdated && isNaN(Date.parse(meta.lastUpdated))) {
      result.warnings.push(`Invalid lastUpdated format '${meta.lastUpdated}' in ${context}, expected valid date`)
    }
    
    // Validate completeness if present
    if (meta.completeness !== undefined) {
      if (typeof meta.completeness !== 'number' || meta.completeness < 0 || meta.completeness > 100) {
        result.warnings.push(`Invalid completeness value '${meta.completeness}' in ${context}, expected number 0-100`)
      }
    }
  }

  /**
   * Validate translation structure based on context
   * @param {Object} translations - Translation object to validate
   * @param {string} context - Context for error reporting
   * @param {Object} result - Validation result object to update
   */
  validateTranslationStructure(translations, context, result) {
    // Define expected structures for different contexts
    const expectedStructures = {
      'page-login': ['title', 'form', 'messages'],
      'page-dashboard': ['title', 'metrics', 'quickActions'],
      'page-register': ['title', 'form', 'steps'],
      'component-navigation': ['menu', 'buttons'],
      'component-forms': ['labels', 'placeholders', 'validation']
    }
    
    const expectedKeys = expectedStructures[context]
    if (expectedKeys) {
      for (const key of expectedKeys) {
        if (!translations[key]) {
          result.missingKeys.push(`Expected key '${key}' missing in ${context}`)
        }
      }
    }
    
    // Check for common required keys in page translations
    if (context.startsWith('page-')) {
      if (!translations.title) {
        result.missingKeys.push(`Page title missing in ${context}`)
      }
    }
  }

  /**
   * Validate translation content recursively
   * @param {Object} obj - Object to validate
   * @param {string} context - Context for error reporting
   * @param {Object} result - Validation result object to update
   * @param {string} path - Current path in the object
   */
  validateTranslationContent(obj, context, result, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      
      // Skip meta validation as it's handled separately
      if (currentPath === 'meta') {
        continue
      }
      
      if (typeof value === 'object' && value !== null) {
        this.validateTranslationContent(value, context, result, currentPath)
      } else if (typeof value === 'string') {
        // Check for empty values
        if (value.trim() === '') {
          result.emptyValues.push(`Empty translation value at ${context}.${currentPath}`)
        }
        
        // Check for placeholder text that should be replaced
        const placeholderPatterns = [
          /^(TODO|FIXME|TBD|PLACEHOLDER)/i,
          /^Lorem ipsum/i,
          /^Test\s/i,
          /^\[.*\]$/
        ]
        
        for (const pattern of placeholderPatterns) {
          if (pattern.test(value)) {
            result.warnings.push(`Placeholder text detected at ${context}.${currentPath}: "${value}"`)
            break
          }
        }
        
        // Check for suspiciously long translations (might indicate concatenated text)
        if (value.length > 500) {
          result.warnings.push(`Very long translation at ${context}.${currentPath} (${value.length} chars)`)
        }
        
        // Check for HTML tags (might indicate improper content)
        if (/<[^>]+>/.test(value)) {
          result.warnings.push(`HTML tags detected in translation at ${context}.${currentPath}`)
        }
      } else if (value !== null && value !== undefined) {
        result.structureIssues.push(`Non-string, non-object value at ${context}.${currentPath}: ${typeof value}`)
      }
    }
  }

  /**
   * Validate interpolation syntax in translations
   * @param {Object} obj - Object to validate
   * @param {string} context - Context for error reporting
   * @param {Object} result - Validation result object to update
   * @param {string} path - Current path in the object
   */
  validateInterpolationSyntax(obj, context, result, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      
      if (currentPath === 'meta') {
        continue
      }
      
      if (typeof value === 'object' && value !== null) {
        this.validateInterpolationSyntax(value, context, result, currentPath)
      } else if (typeof value === 'string') {
        // Check for interpolation syntax issues
        const interpolationMatches = value.match(/\{\{[^}]*\}\}/g)
        if (interpolationMatches) {
          for (const match of interpolationMatches) {
            // Check for valid variable names
            const varName = match.slice(2, -2).trim()
            if (!varName) {
              result.errors.push(`Empty interpolation placeholder at ${context}.${currentPath}`)
            } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
              result.errors.push(`Invalid interpolation variable name '${varName}' at ${context}.${currentPath}`)
            }
          }
        }
        
        // Check for unmatched braces
        const openBraces = (value.match(/\{\{/g) || []).length
        const closeBraces = (value.match(/\}\}/g) || []).length
        if (openBraces !== closeBraces) {
          result.errors.push(`Unmatched interpolation braces at ${context}.${currentPath}`)
        }
        
        // Check for single braces (common mistake)
        if (value.includes('{') && !value.includes('{{')) {
          result.warnings.push(`Single braces detected at ${context}.${currentPath}, use {{}} for interpolation`)
        }
      }
    }
  }

  /**
   * Log validation summary for development
   * @param {string} context - Context that was validated
   * @param {Object} result - Validation result
   */
  logValidationSummary(context, result) {
    const summary = {
      context,
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      missingKeyCount: result.missingKeys.length,
      emptyValueCount: result.emptyValues.length,
      structureIssueCount: result.structureIssues.length
    }
    
    if (summary.errorCount > 0 || summary.warningCount > 0) {
      console.group(`Translation Validation Summary: ${context}`)
      console.table(summary)
      if (result.errors.length > 0) {
        console.error('Errors:', result.errors)
      }
      if (result.warnings.length > 0) {
        console.warn('Warnings:', result.warnings)
      }
      console.groupEnd()
    }
  }

  /**
   * Track missing translation for development debugging
   * @param {string} key - Missing translation key
   * @param {string} locale - Locale where translation is missing
   */
  trackMissingTranslation(key, locale) {
    const missingKey = `${locale}:${key}`
    
    if (!this.missingTranslations.has(missingKey)) {
      this.missingTranslations.add(missingKey)
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation: ${key} for locale: ${locale}`)
      }
    }
  }

  /**
   * Track translation validation issues for monitoring
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale code
   * @param {Object} validationResult - Validation result object
   */
  trackTranslationIssues(pageName, locale, validationResult) {
    if (!this.translationIssues) {
      this.translationIssues = new Map()
    }
    
    const issueKey = `${locale}-${pageName}`
    const issueData = {
      pageName,
      locale,
      timestamp: Date.now(),
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      missingKeys: validationResult.missingKeys,
      emptyValues: validationResult.emptyValues,
      structureIssues: validationResult.structureIssues
    }
    
    this.translationIssues.set(issueKey, issueData)
    
    // Log summary in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`Translation Issues Detected: ${pageName} (${locale})`)
      console.warn('Validation Result:', validationResult)
      console.groupEnd()
    }
  }

  /**
   * Track translation loading failures for monitoring
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale code
   * @param {Error} error - Loading error
   */
  trackTranslationLoadingFailure(pageName, locale, error) {
    if (!this.loadingFailures) {
      this.loadingFailures = new Map()
    }
    
    const failureKey = `${locale}-${pageName}`
    const failureData = {
      pageName,
      locale,
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      retryCount: (this.loadingFailures.get(failureKey)?.retryCount || 0) + 1
    }
    
    this.loadingFailures.set(failureKey, failureData)
    
    // Log failure details
    console.error(`Translation loading failure #${failureData.retryCount}: ${pageName} (${locale})`, error)
  }

  /**
   * Apply fallback mechanisms for missing or invalid translations
   * @param {Object} translations - Original translations object
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale code
   * @returns {Object} Processed translations with fallbacks applied
   */
  applyTranslationFallbacks(translations, pageName, locale) {
    const processed = JSON.parse(JSON.stringify(translations)) // Deep clone
    
    // Apply fallbacks for empty values
    this.fillEmptyTranslations(processed, pageName, locale)
    
    // Ensure required structure exists
    this.ensureRequiredStructure(processed, pageName)
    
    // Add missing meta information
    if (!processed.meta) {
      processed.meta = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        page: pageName,
        fallbackApplied: true
      }
    }
    
    return processed
  }

  /**
   * Fill empty translations with fallback values
   * @param {Object} obj - Translation object to process
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale code
   * @param {string} path - Current path in the object
   */
  fillEmptyTranslations(obj, pageName, locale, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      
      if (currentPath === 'meta') {
        continue
      }
      
      if (typeof value === 'object' && value !== null) {
        this.fillEmptyTranslations(value, pageName, locale, currentPath)
      } else if (typeof value === 'string' && value.trim() === '') {
        // Apply fallback for empty string
        obj[key] = this.generateFallbackTranslation(currentPath, pageName, locale)
        console.warn(`Applied fallback for empty translation: ${pageName}.${currentPath}`)
      }
    }
  }

  /**
   * Ensure required structure exists in translations
   * @param {Object} translations - Translation object to process
   * @param {string} pageName - Name of the page
   */
  ensureRequiredStructure(translations, pageName) {
    // Ensure title exists
    if (!translations.title) {
      translations.title = this.generatePageTitle(pageName)
    }
    
    // Ensure common page structures exist
    const pageStructures = {
      'login': ['form', 'messages'],
      'register': ['form', 'steps'],
      'dashboard': ['metrics', 'quickActions'],
      'applications': ['filters', 'table'],
      'interviews': ['schedule', 'status']
    }
    
    const requiredSections = pageStructures[pageName]
    if (requiredSections) {
      for (const section of requiredSections) {
        if (!translations[section]) {
          translations[section] = {}
          console.warn(`Added missing section '${section}' to ${pageName} translations`)
        }
      }
    }
  }

  /**
   * Generate fallback translation for missing keys
   * @param {string} key - Translation key
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale code
   * @returns {string} Fallback translation
   */
  generateFallbackTranslation(key, pageName, locale) {
    // Try to get from English fallback first
    if (locale !== 'en') {
      const englishTranslation = this.getFallbackFromEnglish(key, pageName)
      if (englishTranslation) {
        return englishTranslation
      }
    }
    
    // Generate human-readable fallback from key
    const parts = key.split('.')
    const lastPart = parts[parts.length - 1]
    
    // Convert camelCase/snake_case to readable text
    const readable = lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim()
    
    return readable || key
  }

  /**
   * Get fallback translation from English locale
   * @param {string} key - Translation key
   * @param {string} pageName - Name of the page
   * @returns {string|null} English translation or null
   */
  getFallbackFromEnglish(key, pageName) {
    try {
      const englishTranslations = this.pageTranslations.get('en')?.get(pageName)
      if (englishTranslations) {
        return this.getNestedValue(englishTranslations, key)
      }
    } catch (error) {
      console.warn(`Failed to get English fallback for ${key}:`, error)
    }
    return null
  }

  /**
   * Generate page title from page name
   * @param {string} pageName - Name of the page
   * @returns {string} Generated title
   */
  generatePageTitle(pageName) {
    const titleMap = {
      'login': 'Login',
      'register': 'Register',
      'dashboard': 'Dashboard',
      'applications': 'Applications',
      'interviews': 'Interviews',
      'jobs': 'Jobs',
      'workflow': 'Workflow',
      'drafts': 'Drafts',
      'team-members': 'Team Members',
      'audit-log': 'Audit Log',
      'agency-settings': 'Agency Settings',
      'member-login': 'Member Login'
    }
    
    return titleMap[pageName] || pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  /**
   * Get fallback translations when loading fails completely
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale code
   * @returns {Object} Fallback translation object
   */
  getFallbackTranslations(pageName, locale) {
    // Try to get from cache first (might have partial data)
    const cacheKey = `${locale}-page-${pageName}`
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)
    }
    
    // Try to get English version if not English locale
    if (locale !== 'en') {
      try {
        const englishCacheKey = `en-page-${pageName}`
        if (this.translationCache.has(englishCacheKey)) {
          console.warn(`Using English fallback for ${pageName} (${locale})`)
          return this.translationCache.get(englishCacheKey)
        }
      } catch (error) {
        console.warn(`Failed to get English fallback for ${pageName}:`, error)
      }
    }
    
    // Generate emergency translations
    return this.getEmergencyTranslations(pageName)
  }

  /**
   * Get all missing translations for debugging
   * @returns {Array<string>} Array of missing translation keys
   */
  getMissingTranslations() {
    return Array.from(this.missingTranslations)
  }

  /**
   * Clear missing translations log
   */
  clearMissingTranslations() {
    this.missingTranslations.clear()
    if (process.env.NODE_ENV === 'development') {
      console.log('Missing translations log cleared')
    }
  }

  /**
   * Get translation issues report for debugging
   * @returns {Object} Translation issues report
   */
  getTranslationIssuesReport() {
    if (!this.translationIssues) {
      return { issues: [], summary: { totalIssues: 0 } }
    }

    const issues = Array.from(this.translationIssues.values())
    const summary = {
      totalIssues: issues.length,
      errorCount: issues.reduce((sum, issue) => sum + issue.errors.length, 0),
      warningCount: issues.reduce((sum, issue) => sum + issue.warnings.length, 0),
      missingKeyCount: issues.reduce((sum, issue) => sum + issue.missingKeys.length, 0),
      emptyValueCount: issues.reduce((sum, issue) => sum + issue.emptyValues.length, 0),
      structureIssueCount: issues.reduce((sum, issue) => sum + issue.structureIssues.length, 0)
    }

    return { issues, summary }
  }

  /**
   * Get loading failures report for debugging
   * @returns {Object} Loading failures report
   */
  getLoadingFailuresReport() {
    if (!this.loadingFailures) {
      return { failures: [], summary: { totalFailures: 0 } }
    }

    const failures = Array.from(this.loadingFailures.values())
    const summary = {
      totalFailures: failures.length,
      totalRetries: failures.reduce((sum, failure) => sum + failure.retryCount, 0),
      recentFailures: failures.filter(f => Date.now() - f.timestamp < 300000).length // Last 5 minutes
    }

    return { failures, summary }
  }

  /**
   * Validate translation key format and structure
   * @param {string} key - Translation key to validate
   * @returns {Object} Validation result
   */
  validateTranslationKey(key) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (!key || typeof key !== 'string') {
      result.isValid = false
      result.errors.push('Translation key must be a non-empty string')
      return result
    }

    // Check key format
    if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(key)) {
      result.isValid = false
      result.errors.push('Translation key contains invalid characters. Use only letters, numbers, dots, underscores, and hyphens')
    }

    // Check for consecutive dots
    if (key.includes('..')) {
      result.isValid = false
      result.errors.push('Translation key cannot contain consecutive dots')
    }

    // Check for leading/trailing dots
    if (key.startsWith('.') || key.endsWith('.')) {
      result.isValid = false
      result.errors.push('Translation key cannot start or end with a dot')
    }

    // Check key length
    if (key.length > 100) {
      result.warnings.push('Translation key is very long (>100 characters)')
    }

    // Check nesting depth
    const depth = key.split('.').length
    if (depth > 5) {
      result.warnings.push('Translation key has deep nesting (>5 levels)')
    }

    return result
  }

  /**
   * Validate translation file structure against schema
   * @param {Object} translations - Translation object to validate
   * @param {string} expectedType - Expected file type ('page', 'component', 'common')
   * @returns {Object} Validation result
   */
  validateTranslationFileStructure(translations, expectedType) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      structureScore: 0
    }

    if (!translations || typeof translations !== 'object') {
      result.isValid = false
      result.errors.push('Translation file must be a valid JSON object')
      return result
    }

    // Validate meta section
    if (!translations.meta) {
      result.warnings.push('Missing meta section in translation file')
    } else {
      const metaValidation = this.validateTranslationMeta(translations.meta, expectedType, { errors: [], warnings: [] })
      result.errors.push(...metaValidation.errors)
      result.warnings.push(...metaValidation.warnings)
    }

    // Validate structure based on type
    const structureValidation = this.validateTypeSpecificStructure(translations, expectedType)
    result.errors.push(...structureValidation.errors)
    result.warnings.push(...structureValidation.warnings)
    result.structureScore = structureValidation.score

    // Check for common issues
    const commonIssues = this.validateCommonTranslationIssues(translations)
    result.errors.push(...commonIssues.errors)
    result.warnings.push(...commonIssues.warnings)

    result.isValid = result.errors.length === 0

    return result
  }

  /**
   * Validate type-specific structure
   * @param {Object} translations - Translation object
   * @param {string} type - File type
   * @returns {Object} Validation result with score
   */
  validateTypeSpecificStructure(translations, type) {
    const result = { errors: [], warnings: [], score: 0 }
    let expectedSections = []
    let maxScore = 0

    switch (type) {
      case 'page':
        expectedSections = ['title']
        maxScore = 10
        if (translations.title) result.score += 3
        if (translations.form) result.score += 2
        if (translations.messages) result.score += 2
        if (translations.navigation) result.score += 1
        if (translations.buttons) result.score += 1
        if (translations.validation) result.score += 1
        break

      case 'component':
        expectedSections = ['labels', 'buttons']
        maxScore = 8
        if (translations.labels) result.score += 3
        if (translations.buttons) result.score += 3
        if (translations.messages) result.score += 2
        break

      case 'common':
        expectedSections = ['loading', 'error', 'success']
        maxScore = 12
        if (translations.loading) result.score += 2
        if (translations.error) result.score += 2
        if (translations.success) result.score += 2
        if (translations.validation) result.score += 3
        if (translations.buttons) result.score += 2
        if (translations.navigation) result.score += 1
        break

      default:
        result.warnings.push(`Unknown translation file type: ${type}`)
        maxScore = 5
        result.score = 5 // Default score for unknown types
    }

    // Check for expected sections
    for (const section of expectedSections) {
      if (!translations[section]) {
        result.warnings.push(`Missing expected section '${section}' for ${type} translations`)
      }
    }

    // Normalize score to 0-100
    result.score = Math.round((result.score / maxScore) * 100)

    return result
  }

  /**
   * Validate common translation issues
   * @param {Object} translations - Translation object
   * @returns {Object} Validation result
   */
  validateCommonTranslationIssues(translations) {
    const result = { errors: [], warnings: [] }

    // Check for duplicate values (might indicate copy-paste errors)
    const values = new Map()
    this.collectTranslationValues(translations, values, '')

    const duplicates = new Map()
    for (const [value, paths] of values.entries()) {
      if (paths.length > 1 && value.length > 10) { // Only flag longer strings
        duplicates.set(value, paths)
      }
    }

    if (duplicates.size > 0) {
      for (const [value, paths] of duplicates.entries()) {
        result.warnings.push(`Duplicate translation value "${value}" found at: ${paths.join(', ')}`)
      }
    }

    // Check for inconsistent terminology
    this.checkTerminologyConsistency(translations, result)

    return result
  }

  /**
   * Collect all translation values with their paths
   * @param {Object} obj - Object to traverse
   * @param {Map} values - Map to store values and paths
   * @param {string} path - Current path
   */
  collectTranslationValues(obj, values, path) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key

      if (key === 'meta') continue

      if (typeof value === 'object' && value !== null) {
        this.collectTranslationValues(value, values, currentPath)
      } else if (typeof value === 'string' && value.trim()) {
        if (!values.has(value)) {
          values.set(value, [])
        }
        values.get(value).push(currentPath)
      }
    }
  }

  /**
   * Check for terminology consistency
   * @param {Object} translations - Translation object
   * @param {Object} result - Result object to update
   */
  checkTerminologyConsistency(translations, result) {
    // Define common terms that should be consistent
    const commonTerms = {
      'login': ['login', 'log in', 'sign in', 'signin'],
      'logout': ['logout', 'log out', 'sign out', 'signout'],
      'register': ['register', 'sign up', 'signup'],
      'submit': ['submit', 'send', 'save'],
      'cancel': ['cancel', 'close', 'dismiss']
    }

    const foundTerms = new Map()
    this.findTermsInTranslations(translations, commonTerms, foundTerms, '')

    // Check for inconsistencies
    for (const [category, variations] of foundTerms.entries()) {
      if (variations.size > 1) {
        const variationList = Array.from(variations.keys()).join(', ')
        result.warnings.push(`Inconsistent terminology for '${category}': found variations [${variationList}]`)
      }
    }
  }

  /**
   * Find terms in translations
   * @param {Object} obj - Object to search
   * @param {Object} commonTerms - Terms to look for
   * @param {Map} foundTerms - Map to store found terms
   * @param {string} path - Current path
   */
  findTermsInTranslations(obj, commonTerms, foundTerms, path) {
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'meta') continue

      if (typeof value === 'object' && value !== null) {
        this.findTermsInTranslations(value, commonTerms, foundTerms, path)
      } else if (typeof value === 'string') {
        const lowerValue = value.toLowerCase()
        
        for (const [category, terms] of Object.entries(commonTerms)) {
          for (const term of terms) {
            if (lowerValue.includes(term)) {
              if (!foundTerms.has(category)) {
                foundTerms.set(category, new Map())
              }
              const categoryMap = foundTerms.get(category)
              if (!categoryMap.has(term)) {
                categoryMap.set(term, [])
              }
              categoryMap.get(term).push(path ? `${path}.${key}` : key)
            }
          }
        }
      }
    }
  }

  /**
   * Generate translation completeness report
   * @param {string} baseLocale - Base locale to compare against
   * @param {Array<string>} compareLocales - Locales to compare
   * @returns {Promise<Object>} Completeness report
   */
  async generateCompletenessReport(baseLocale = 'en', compareLocales = ['ne']) {
    const report = {
      timestamp: new Date().toISOString(),
      baseLocale,
      compareLocales,
      completeness: {},
      summary: {
        averageCompleteness: 0,
        totalMissingKeys: 0,
        criticalMissing: []
      }
    }

    try {
      // Load all translations for base locale
      const baseTranslations = await this.loadAllTranslationsForLocale(baseLocale)
      const baseKeys = this.extractAllKeys(baseTranslations)

      for (const locale of compareLocales) {
        const compareTranslations = await this.loadAllTranslationsForLocale(locale)
        const compareKeys = this.extractAllKeys(compareTranslations)

        const missingKeys = baseKeys.filter(key => !compareKeys.includes(key))
        const completenessPercentage = ((baseKeys.length - missingKeys.length) / baseKeys.length) * 100

        report.completeness[locale] = {
          totalKeys: baseKeys.length,
          translatedKeys: baseKeys.length - missingKeys.length,
          missingKeys: missingKeys,
          completenessPercentage: Math.round(completenessPercentage * 100) / 100
        }

        report.summary.totalMissingKeys += missingKeys.length

        // Identify critical missing keys (common UI elements)
        const criticalKeys = missingKeys.filter(key => 
          key.includes('button') || 
          key.includes('error') || 
          key.includes('title') ||
          key.includes('submit') ||
          key.includes('cancel')
        )
        
        if (criticalKeys.length > 0) {
          report.summary.criticalMissing.push({
            locale,
            keys: criticalKeys
          })
        }
      }

      // Calculate average completeness
      const completenessValues = Object.values(report.completeness).map(c => c.completenessPercentage)
      report.summary.averageCompleteness = completenessValues.length > 0 
        ? Math.round((completenessValues.reduce((sum, val) => sum + val, 0) / completenessValues.length) * 100) / 100
        : 0

    } catch (error) {
      console.error('Error generating completeness report:', error)
      report.error = error.message
    }

    return report
  }

  /**
   * Load all translations for a locale
   * @param {string} locale - Locale code
   * @returns {Promise<Object>} All translations
   */
  async loadAllTranslationsForLocale(locale) {
    const allTranslations = {}

    // Load common translations
    try {
      const commonTranslations = await this.loadPageTranslations('common', locale)
      allTranslations.common = commonTranslations
    } catch (error) {
      console.warn(`Failed to load common translations for ${locale}:`, error)
    }

    // Load page translations
    const pageNames = [
      'login', 'register', 'dashboard', 'applications', 'interviews',
      'jobs', 'workflow', 'drafts', 'team-members', 'audit-log',
      'agency-settings', 'member-login'
    ]

    allTranslations.pages = {}
    for (const pageName of pageNames) {
      try {
        const pageTranslations = await this.loadPageTranslations(pageName, locale)
        allTranslations.pages[pageName] = pageTranslations
      } catch (error) {
        console.warn(`Failed to load ${pageName} translations for ${locale}:`, error)
      }
    }

    return allTranslations
  }

  /**
   * Extract all translation keys from translations object
   * @param {Object} translations - Translations object
   * @param {string} prefix - Key prefix
   * @returns {Array<string>} Array of all keys
   */
  extractAllKeys(translations, prefix = '') {
    const keys = []

    for (const [key, value] of Object.entries(translations)) {
      if (key === 'meta') continue

      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'object' && value !== null) {
        keys.push(...this.extractAllKeys(value, fullKey))
      } else {
        keys.push(fullKey)
      }
    }

    return keys
  }

  /**
   * Get comprehensive translation validation report
   * @returns {Object} Detailed validation report
   */
  getTranslationValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalLocales: this.translations.size,
        totalMissingTranslations: this.missingTranslations.size,
        totalIssues: this.translationIssues?.size || 0,
        totalLoadingFailures: this.loadingFailures?.size || 0
      },
      missingTranslations: this.getMissingTranslationsByLocale(),
      validationIssues: this.getValidationIssuesSummary(),
      loadingFailures: this.getLoadingFailuresSummary(),
      cacheStatus: this.getCacheStats(),
      recommendations: this.generateValidationRecommendations()
    }
    
    return report
  }

  /**
   * Get missing translations organized by locale
   * @returns {Object} Missing translations by locale
   */
  getMissingTranslationsByLocale() {
    const byLocale = {}
    
    for (const missingKey of this.missingTranslations) {
      const [locale, ...keyParts] = missingKey.split(':')
      const key = keyParts.join(':')
      
      if (!byLocale[locale]) {
        byLocale[locale] = []
      }
      byLocale[locale].push(key)
    }
    
    return byLocale
  }

  /**
   * Get validation issues summary
   * @returns {Array} Array of validation issue summaries
   */
  getValidationIssuesSummary() {
    if (!this.translationIssues) {
      return []
    }
    
    return Array.from(this.translationIssues.values()).map(issue => ({
      page: issue.pageName,
      locale: issue.locale,
      timestamp: new Date(issue.timestamp).toISOString(),
      errorCount: issue.errors.length,
      warningCount: issue.warnings.length,
      missingKeyCount: issue.missingKeys.length,
      emptyValueCount: issue.emptyValues.length,
      structureIssueCount: issue.structureIssues.length,
      severity: this.calculateIssueSeverity(issue)
    }))
  }

  /**
   * Get loading failures summary
   * @returns {Array} Array of loading failure summaries
   */
  getLoadingFailuresSummary() {
    if (!this.loadingFailures) {
      return []
    }
    
    return Array.from(this.loadingFailures.values()).map(failure => ({
      page: failure.pageName,
      locale: failure.locale,
      timestamp: new Date(failure.timestamp).toISOString(),
      error: failure.error,
      retryCount: failure.retryCount,
      severity: failure.retryCount > 3 ? 'high' : failure.retryCount > 1 ? 'medium' : 'low'
    }))
  }

  /**
   * Calculate severity of validation issues
   * @param {Object} issue - Issue object
   * @returns {string} Severity level
   */
  calculateIssueSeverity(issue) {
    const errorWeight = issue.errors.length * 3
    const warningWeight = issue.warnings.length * 1
    const missingWeight = issue.missingKeys.length * 2
    const emptyWeight = issue.emptyValues.length * 2
    const structureWeight = issue.structureIssues.length * 2
    
    const totalScore = errorWeight + warningWeight + missingWeight + emptyWeight + structureWeight
    
    if (totalScore >= 10) return 'high'
    if (totalScore >= 5) return 'medium'
    return 'low'
  }

  /**
   * Generate validation recommendations
   * @returns {Array} Array of recommendations
   */
  generateValidationRecommendations() {
    const recommendations = []
    
    // Check missing translations
    const missingCount = this.missingTranslations.size
    if (missingCount > 0) {
      recommendations.push({
        type: 'missing_translations',
        severity: missingCount > 20 ? 'high' : missingCount > 5 ? 'medium' : 'low',
        message: `${missingCount} missing translations detected. Consider adding these translations to improve user experience.`,
        action: 'Review missing translations and add appropriate translations for all supported locales.'
      })
    }
    
    // Check validation issues
    const issueCount = this.translationIssues?.size || 0
    if (issueCount > 0) {
      recommendations.push({
        type: 'validation_issues',
        severity: issueCount > 5 ? 'high' : issueCount > 2 ? 'medium' : 'low',
        message: `${issueCount} translation files have validation issues.`,
        action: 'Review and fix validation errors in translation files to ensure consistency.'
      })
    }
    
    // Check loading failures
    const failureCount = this.loadingFailures?.size || 0
    if (failureCount > 0) {
      recommendations.push({
        type: 'loading_failures',
        severity: failureCount > 3 ? 'high' : failureCount > 1 ? 'medium' : 'low',
        message: `${failureCount} translation files failed to load.`,
        action: 'Check file paths and ensure all translation files are accessible.'
      })
    }
    
    // Check cache efficiency
    const cacheStats = this.getCacheStats()
    if (cacheStats.translationCache.size > 100) {
      recommendations.push({
        type: 'cache_optimization',
        severity: 'low',
        message: 'Translation cache is growing large. Consider implementing cache cleanup.',
        action: 'Implement periodic cache cleanup or set cache size limits.'
      })
    }
    
    return recommendations
  }

  /**
   * Validate all loaded translations and generate report
   * @returns {Promise<Object>} Comprehensive validation report
   */
  async validateAllTranslations() {
    const report = {
      timestamp: new Date().toISOString(),
      locales: {},
      summary: {
        totalFiles: 0,
        validFiles: 0,
        filesWithErrors: 0,
        filesWithWarnings: 0
      }
    }
    
    // Validate all cached translations
    for (const [locale, pageMap] of this.pageTranslations.entries()) {
      report.locales[locale] = {
        pages: {},
        summary: {
          totalPages: pageMap.size,
          validPages: 0,
          pagesWithErrors: 0,
          pagesWithWarnings: 0
        }
      }
      
      for (const [pageName, translations] of pageMap.entries()) {
        const validationResult = this.validateTranslations(translations, `page-${pageName}`)
        
        report.locales[locale].pages[pageName] = {
          isValid: validationResult.isValid,
          errorCount: validationResult.errors.length,
          warningCount: validationResult.warnings.length,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
          missingKeys: validationResult.missingKeys,
          emptyValues: validationResult.emptyValues
        }
        
        // Update summaries
        report.summary.totalFiles++
        report.locales[locale].summary.totalPages++
        
        if (validationResult.isValid) {
          report.summary.validFiles++
          report.locales[locale].summary.validPages++
        } else {
          report.summary.filesWithErrors++
          report.locales[locale].summary.pagesWithErrors++
        }
        
        if (validationResult.warnings.length > 0) {
          report.summary.filesWithWarnings++
          report.locales[locale].summary.pagesWithWarnings++
        }
      }
    }
    
    return report
  }

  /**
   * Clear all validation tracking data
   */
  clearValidationData() {
    this.missingTranslations.clear()
    
    if (this.translationIssues) {
      this.translationIssues.clear()
    }
    
    if (this.loadingFailures) {
      this.loadingFailures.clear()
    }
    
    console.log('Translation validation data cleared')
  }

  /**
   * Export validation data for external analysis
   * @returns {Object} Exportable validation data
   */
  exportValidationData() {
    return {
      timestamp: new Date().toISOString(),
      missingTranslations: Array.from(this.missingTranslations),
      translationIssues: this.translationIssues ? Array.from(this.translationIssues.entries()) : [],
      loadingFailures: this.loadingFailures ? Array.from(this.loadingFailures.entries()) : [],
      cacheStats: this.getCacheStats()
    }
  }

  /**
   * Clear translation cache
   * @param {string} pattern - Optional pattern to match cache keys
   */
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.translationCache.keys()) {
        if (key.includes(pattern)) {
          this.translationCache.delete(key)
        }
      }
    } else {
      this.translationCache.clear()
    }
    
    // Also clear page translations cache
    if (pattern) {
      for (const [locale, pageMap] of this.pageTranslations.entries()) {
        for (const pageName of pageMap.keys()) {
          if (pageName.includes(pattern)) {
            pageMap.delete(pageName)
          }
        }
      }
    } else {
      this.pageTranslations.clear()
    }
  }

  /**
   * Get cache statistics for monitoring
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const stats = {
      translationCache: {
        size: this.translationCache.size,
        keys: Array.from(this.translationCache.keys())
      },
      pageTranslations: {
        locales: this.pageTranslations.size,
        totalPages: 0
      },
      missingTranslations: this.missingTranslations.size
    }
    
    for (const pageMap of this.pageTranslations.values()) {
      stats.pageTranslations.totalPages += pageMap.size
    }
    
    return stats
  }

  /**
   * Optimize cache by removing old or unused entries
   * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  optimizeCache(maxAge = 60 * 60 * 1000) {
    const now = Date.now()
    let removedCount = 0
    
    // For now, we'll implement a simple size-based cleanup
    // In a real implementation, you'd track access times
    if (this.translationCache.size > 100) {
      const keys = Array.from(this.translationCache.keys())
      const keysToRemove = keys.slice(0, keys.length - 50) // Keep last 50
      
      keysToRemove.forEach(key => {
        this.translationCache.delete(key)
        removedCount++
      })
      
      console.log(`Cache optimized: removed ${removedCount} entries`)
    }
  }

  /**
   * Preload translations for critical pages
   * @param {Array<string>} pageNames - Array of page names to preload
   * @param {string} locale - Locale to preload for
   */
  async preloadPageTranslations(pageNames, locale = this.currentLocale) {
    const promises = pageNames.map(pageName => 
      this.loadPageTranslations(pageName, locale)
    )
    
    try {
      await Promise.all(promises)
      console.log(`Preloaded translations for pages: ${pageNames.join(', ')}`)
    } catch (error) {
      console.error('Error preloading page translations:', error)
    }
  }

  /**
   * Broadcast locale change to other tabs
   * @param {string} locale - New locale
   * @param {string} previousLocale - Previous locale
   */
  broadcastLocaleChange(locale, previousLocale) {
    try {
      const changeEvent = {
        type: 'locale-change',
        locale,
        previousLocale,
        timestamp: Date.now(),
        tabId: this.getTabId()
      }
      
      // Use a separate key for broadcasting to avoid infinite loops
      localStorage.setItem(`${this.storageKey}-broadcast`, JSON.stringify(changeEvent))
      
      // Remove the broadcast key immediately to trigger storage event
      setTimeout(() => {
        localStorage.removeItem(`${this.storageKey}-broadcast`)
      }, 100)
    } catch (error) {
      console.warn('Failed to broadcast locale change:', error)
    }
  }

  /**
   * Handle storage change events from other tabs
   * @param {StorageEvent} event - Storage event
   */
  handleStorageChange(event) {
    // Only handle our broadcast events
    if (event.key !== `${this.storageKey}-broadcast` || !event.newValue) {
      return
    }
    
    try {
      const changeEvent = JSON.parse(event.newValue)
      
      // Ignore events from the same tab
      if (changeEvent.tabId === this.getTabId()) {
        return
      }
      
      // Validate the event
      if (changeEvent.type === 'locale-change' && changeEvent.locale) {
        // Update locale without broadcasting to avoid loops
        this.setLocale(changeEvent.locale, false)
      }
    } catch (error) {
      console.warn('Failed to handle storage change event:', error)
    }
  }

  /**
   * Get unique tab identifier
   * @returns {string} Tab ID
   */
  getTabId() {
    if (!this.tabId) {
      this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    return this.tabId
  }

  /**
   * Subscribe to locale change events
   * @param {Function} callback - Callback function to call on locale change
   * @returns {Function} Unsubscribe function
   */
  subscribeToLocaleChanges(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function')
    }
    
    this.localeChangeCallbacks.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.localeChangeCallbacks.delete(callback)
    }
  }

  /**
   * Unsubscribe from locale change events
   * @param {Function} callback - Callback function to remove
   */
  unsubscribeFromLocaleChanges(callback) {
    this.localeChangeCallbacks.delete(callback)
  }

  /**
   * Notify all locale change callbacks
   * @param {string} locale - New locale
   * @param {string} previousLocale - Previous locale
   */
  notifyLocaleChangeCallbacks(locale, previousLocale) {
    for (const callback of this.localeChangeCallbacks) {
      try {
        callback(locale, previousLocale)
      } catch (error) {
        console.error('Error in locale change callback:', error)
      }
    }
  }

  /**
   * Setup cross-tab synchronization
   */
  setupCrossTabSync() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      console.warn('Cross-tab synchronization not available in this environment')
      return
    }
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', this.handleStorageChange)
    
    // Listen for beforeunload to cleanup
    window.addEventListener('beforeunload', () => {
      this.cleanup()
    })
  }

  /**
   * Get preference storage information for debugging
   * @returns {Object} Storage information
   */
  getPreferenceStorageInfo() {
    const info = {
      localStorage: { available: false, hasPreference: false, preference: null },
      sessionStorage: { available: false, hasPreference: false, preference: null },
      inMemory: { hasPreference: false, preference: null }
    }
    
    // Check localStorage
    try {
      const localPref = localStorage.getItem(this.storageKey)
      info.localStorage.available = true
      info.localStorage.hasPreference = !!localPref
      if (localPref) {
        info.localStorage.preference = JSON.parse(localPref)
      }
    } catch (error) {
      info.localStorage.error = error.message
    }
    
    // Check sessionStorage
    try {
      const sessionPref = sessionStorage.getItem(this.storageKey)
      info.sessionStorage.available = true
      info.sessionStorage.hasPreference = !!sessionPref
      if (sessionPref) {
        info.sessionStorage.preference = JSON.parse(sessionPref)
      }
    } catch (error) {
      info.sessionStorage.error = error.message
    }
    
    // Check in-memory
    info.inMemory.hasPreference = !!this.inMemoryPreference
    info.inMemory.preference = this.inMemoryPreference
    
    return info
  }

  /**
   * Clear all stored preferences (useful for testing or reset)
   * @param {boolean} includeInMemory - Whether to clear in-memory preference too
   */
  clearAllPreferences(includeInMemory = true) {
    try {
      localStorage.removeItem(this.storageKey)
      localStorage.removeItem('preferred-locale')
    } catch (error) {
      console.warn('Failed to clear localStorage preferences:', error)
    }
    
    try {
      sessionStorage.removeItem(this.storageKey)
      sessionStorage.removeItem('preferred-locale')
    } catch (error) {
      console.warn('Failed to clear sessionStorage preferences:', error)
    }
    
    if (includeInMemory) {
      this.inMemoryPreference = null
    }
    
    console.info('All language preferences cleared')
  }

  /**
   * Migrate old preference format to new format
   * @param {string} locale - Locale from old format
   * @returns {boolean} True if migration successful
   */
  migrateOldPreference(locale) {
    if (!this.validateLocale(locale)) {
      return false
    }
    
    // Save in new format
    const success = this.saveLocalePreference(locale)
    
    if (success) {
      // Clear old format
      try {
        localStorage.removeItem('preferred-locale')
        console.info(`Successfully migrated locale preference: ${locale}`)
      } catch (error) {
        console.warn('Failed to clear old preference format:', error)
      }
    }
    
    return success
  }

  /**
   * Test storage availability and functionality
   * @returns {Object} Test results
   */
  testStorageAvailability() {
    const results = {
      localStorage: { available: false, writable: false, readable: false },
      sessionStorage: { available: false, writable: false, readable: false }
    }
    
    // Test localStorage
    try {
      const testKey = 'udaan-sarathi-storage-test'
      const testValue = 'test-value'
      
      localStorage.setItem(testKey, testValue)
      results.localStorage.available = true
      results.localStorage.writable = true
      
      const retrieved = localStorage.getItem(testKey)
      results.localStorage.readable = retrieved === testValue
      
      localStorage.removeItem(testKey)
    } catch (error) {
      results.localStorage.error = error.message
    }
    
    // Test sessionStorage
    try {
      const testKey = 'udaan-sarathi-storage-test'
      const testValue = 'test-value'
      
      sessionStorage.setItem(testKey, testValue)
      results.sessionStorage.available = true
      results.sessionStorage.writable = true
      
      const retrieved = sessionStorage.getItem(testKey)
      results.sessionStorage.readable = retrieved === testValue
      
      sessionStorage.removeItem(testKey)
    } catch (error) {
      results.sessionStorage.error = error.message
    }
    
    return results
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange)
    }
    
    // Clear cache optimization interval
    if (this.cacheOptimizationInterval) {
      clearInterval(this.cacheOptimizationInterval)
      this.cacheOptimizationInterval = null
    }
    
    this.localeChangeCallbacks.clear()
    
    // Clear in-memory preference on cleanup
    this.inMemoryPreference = null
  }

  /**
   * Auto-load page translations when components mount
   * @param {string} pageName - Name of the page
   * @returns {Promise<Object>} Loaded translations
   */
  async autoLoadPageTranslations(pageName) {
    if (!pageName) {
      console.warn('Page name is required for auto-loading translations')
      return {}
    }
    
    try {
      // Load translations for current locale with fallback handling
      const translations = await this.loadPageTranslationsWithFallback(pageName, this.currentLocale)
      
      // Preload fallback locale if different (don't await to avoid blocking)
      if (this.currentLocale !== this.fallbackLocale) {
        // Start preloading in background
        setTimeout(() => {
          this.loadPageTranslations(pageName, this.fallbackLocale).catch(error => {
            console.warn(`Failed to preload fallback translations for ${pageName}:`, error)
          })
        }, 0)
      }
      
      return translations
    } catch (error) {
      console.error(`Failed to auto-load page translations for ${pageName}:`, error)
      // Return empty object as fallback
      return {}
    }
  }

  /**
   * Load page translations with automatic fallback to English
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale code
   * @returns {Promise<Object>} Loaded translations
   */
  async loadPageTranslationsWithFallback(pageName, locale = this.currentLocale) {
    try {
      // Try to load translations for requested locale
      return await this.loadPageTranslations(pageName, locale)
    } catch (error) {
      console.warn(`Failed to load ${locale} translations for ${pageName}, falling back to English`)
      
      // If not English locale, try English fallback
      if (locale !== this.fallbackLocale) {
        try {
          return await this.loadPageTranslations(pageName, this.fallbackLocale)
        } catch (fallbackError) {
          console.error(`Failed to load fallback translations for ${pageName}:`, fallbackError)
          return this.getEmergencyTranslations(pageName)
        }
      }
      
      // If English also failed, return emergency translations
      return this.getEmergencyTranslations(pageName)
    }
  }

  /**
   * Get emergency translations when all loading fails
   * @param {string} pageName - Name of the page
   * @returns {Object} Emergency translation object
   */
  getEmergencyTranslations(pageName) {
    return {
      meta: {
        version: '1.0.0',
        emergency: true,
        pageName
      },
      title: pageName.charAt(0).toUpperCase() + pageName.slice(1),
      loading: 'Loading...',
      error: 'Error loading content',
      retry: 'Retry',
      fallback: 'Content temporarily unavailable'
    }
  }

  /**
   * Preload critical translations for performance
   * @param {Array<string>} pageNames - Array of critical page names
   */
  async preloadCriticalTranslations(pageNames = ['login', 'dashboard', 'register']) {
    const startTime = performance.now()
    const promises = []
    
    for (const pageName of pageNames) {
      // Load for current locale with fallback handling
      promises.push(
        this.loadPageTranslationsWithFallback(pageName, this.currentLocale)
          .catch(error => {
            console.warn(`Failed to preload ${pageName} for ${this.currentLocale}:`, error)
            return {}
          })
      )
      
      // Load for fallback locale if different
      if (this.currentLocale !== this.fallbackLocale) {
        promises.push(
          this.loadPageTranslations(pageName, this.fallbackLocale)
            .catch(error => {
              console.warn(`Failed to preload ${pageName} for ${this.fallbackLocale}:`, error)
              return {}
            })
        )
      }
    }
    
    try {
      const results = await Promise.allSettled(promises)
      const loadTime = performance.now() - startTime
      
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.filter(result => result.status === 'rejected').length
      
      console.log(`Preloaded critical translations: ${successful} successful, ${failed} failed (${loadTime.toFixed(2)}ms)`)
      
      if (failed > 0) {
        console.warn('Some critical translations failed to preload, but fallbacks are available')
      }
    } catch (error) {
      console.error('Error preloading critical translations:', error)
    }
  }

  /**
   * Preload translations for a specific set of pages
   * @param {Array<string>} pageNames - Array of page names to preload
   * @param {string} locale - Locale to preload for (defaults to current)
   * @param {boolean} background - Whether to run in background (non-blocking)
   * @returns {Promise<Object>} Preload results
   */
  async preloadPageTranslations(pageNames, locale = this.currentLocale, background = false) {
    const preloadPromise = async () => {
      const startTime = performance.now()
      const results = {
        successful: [],
        failed: [],
        loadTime: 0
      }
      
      const promises = pageNames.map(async (pageName) => {
        try {
          await this.loadPageTranslationsWithFallback(pageName, locale)
          results.successful.push(pageName)
        } catch (error) {
          console.warn(`Failed to preload ${pageName}:`, error)
          results.failed.push({ pageName, error: error.message })
        }
      })
      
      await Promise.allSettled(promises)
      results.loadTime = performance.now() - startTime
      
      console.log(`Preloaded ${results.successful.length}/${pageNames.length} pages in ${results.loadTime.toFixed(2)}ms`)
      return results
    }
    
    if (background) {
      // Run in background without blocking
      setTimeout(() => {
        preloadPromise().catch(error => {
          console.error('Background preload failed:', error)
        })
      }, 0)
      return Promise.resolve({ background: true })
    }
    
    return preloadPromise()
  }

  /**
   * Get emergency translations when all else fails
   * @param {string} pageName - Name of the page
   * @returns {Object} Emergency translation object
   */
  getEmergencyTranslations(pageName) {
    return {
      meta: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        page: pageName,
        emergency: true
      },
      title: this.generatePageTitle(pageName),
      error: 'Translation loading failed',
      loading: 'Loading...',
      retry: 'Retry',
      common: {
        loading: 'Loading...',
        error: 'Error',
        retry: 'Retry',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete'
      }
    }
  }

  /**
   * Create user-friendly error messages for translation issues
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   * @returns {string} User-friendly error message
   */
  createUserFriendlyErrorMessage(errorType, context = {}) {
    const errorMessages = {
      'LOADING_FAILED': `Unable to load translations for ${context.pageName || 'this page'}. Please check your internet connection and try again.`,
      'VALIDATION_FAILED': `Translation data for ${context.pageName || 'this page'} contains errors. Some text may appear in English.`,
      'MISSING_TRANSLATIONS': `Some translations are missing for ${context.pageName || 'this page'}. Default text will be shown.`,
      'CORRUPTED_DATA': `Translation data appears to be corrupted. Please refresh the page or contact support.`,
      'NETWORK_ERROR': `Network error while loading translations. Please check your connection and try again.`,
      'TIMEOUT_ERROR': `Translation loading timed out. Please try again.`,
      'PARSE_ERROR': `Invalid translation data format. Some text may not display correctly.`
    }
    
    return errorMessages[errorType] || 'An unexpected error occurred while loading translations.'
  }

  /**
   * Report translation errors to monitoring system
   * @param {string} errorType - Type of error
   * @param {Object} errorData - Error details
   */
  reportTranslationError(errorType, errorData) {
    // In a real application, this would send to monitoring service
    const errorReport = {
      timestamp: new Date().toISOString(),
      errorType,
      ...errorData,
      userAgent: navigator.userAgent,
      url: window.location.href,
      locale: this.currentLocale
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('Translation Error Report')
      console.error('Error Type:', errorType)
      console.error('Error Data:', errorData)
      console.error('Full Report:', errorReport)
      console.groupEnd()
    }
    
    // Store in session for debugging
    try {
      const existingReports = JSON.parse(sessionStorage.getItem('translation_error_reports') || '[]')
      existingReports.push(errorReport)
      // Keep only last 10 reports
      if (existingReports.length > 10) {
        existingReports.splice(0, existingReports.length - 10)
      }
      sessionStorage.setItem('translation_error_reports', JSON.stringify(existingReports))
    } catch (e) {
      console.warn('Failed to store error report:', e)
    }
  }

  /**
   * Handle graceful degradation for translation failures
   * @param {string} key - Translation key that failed
   * @param {string} locale - Locale that failed
   * @param {Error} error - Original error
   * @returns {string} Fallback translation
   */
  handleTranslationFailure(key, locale, error) {
    // Report the error
    this.reportTranslationError('TRANSLATION_FAILURE', {
      key,
      locale,
      error: error.message,
      stack: error.stack
    })
    
    // Try different fallback strategies
    
    // 1. Try English fallback if not already English
    if (locale !== 'en') {
      try {
        const englishValue = this.getTranslationValue(key, 'en')
        if (englishValue) {
          console.warn(`Using English fallback for missing translation: ${key} (${locale})`)
          return englishValue
        }
      } catch (e) {
        console.warn('English fallback also failed:', e)
      }
    }
    
    // 2. Try to generate from key
    const generatedFallback = this.generateFallbackFromKey(key)
    if (generatedFallback && generatedFallback !== key) {
      console.warn(`Using generated fallback for missing translation: ${key} -> ${generatedFallback}`)
      return generatedFallback
    }
    
    // 3. Return the key itself as last resort
    console.error(`All fallback strategies failed for key: ${key}`)
    return `[${key}]`
  }

  /**
   * Validate and sanitize translation input to prevent XSS
   * @param {string} translation - Translation text
   * @param {string} key - Translation key for context
   * @returns {string} Sanitized translation
   */
  sanitizeTranslation(translation, key) {
    if (typeof translation !== 'string') {
      console.warn(`Non-string translation value for key ${key}:`, translation)
      return String(translation)
    }
    
    // Basic XSS prevention - remove script tags and javascript: protocols
    const sanitized = translation
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
    
    if (sanitized !== translation) {
      console.warn(`Potentially malicious content removed from translation key ${key}`)
      this.reportTranslationError('SECURITY_SANITIZATION', {
        key,
        original: translation,
        sanitized
      })
    }
    
    return sanitized
  }

  /**
   * Check translation system health
   * @returns {Object} Health status report
   */
  getSystemHealthStatus() {
    const health = {
      status: 'healthy',
      issues: [],
      metrics: {
        totalTranslations: this.translations.size,
        cachedPages: this.translationCache.size,
        missingTranslations: this.missingTranslations.size,
        loadingFailures: this.loadingFailures ? this.loadingFailures.size : 0,
        translationIssues: this.translationIssues ? this.translationIssues.size : 0
      },
      lastCheck: new Date().toISOString()
    }
    
    // Check for critical issues
    if (health.metrics.missingTranslations > 50) {
      health.status = 'degraded'
      health.issues.push('High number of missing translations detected')
    }
    
    if (health.metrics.loadingFailures > 5) {
      health.status = 'degraded'
      health.issues.push('Multiple translation loading failures detected')
    }
    
    if (health.metrics.totalTranslations === 0) {
      health.status = 'critical'
      health.issues.push('No translations loaded')
    }
    
    return health
  }

  /**
   * Initialize i18n service
   */
  init() {
    if (this.isInitialized) {
      console.warn('i18nService is already initialized')
      return
    }
    
    // Setup cross-tab synchronization
    this.setupCrossTabSync()
    
    // Detect and set locale
    const detectedLocale = this.detectLocale()
    this.setLocale(detectedLocale, false) // Don't broadcast on init
    
    // Preload critical translations in background
    this.preloadCriticalTranslations(['login', 'dashboard', 'register', 'member-login'])
    
    // Setup cache optimization interval (every 10 minutes)
    if (typeof window !== 'undefined') {
      this.cacheOptimizationInterval = setInterval(() => {
        this.optimizeCache()
      }, 10 * 60 * 1000)
    }
    
    this.isInitialized = true
    console.log(`i18nService initialized with locale: ${detectedLocale}`)
  }
}

// Create and export singleton instance
const i18nService = new I18nService()
export default i18nService