import i18nService from '../../services/i18nService'

// Mock the translation files
const mockLoginTranslationsEn = {
  meta: {
    version: '1.0.0',
    lastUpdated: '2024-09-25',
    page: 'login'
  },
  title: 'Admin Login',
  branding: {
    appName: 'Udaan Sarathi',
    logoAlt: 'Udaan Sarathi Logo'
  },
  form: {
    username: {
      label: 'Username',
      placeholder: 'Enter your username'
    },
    password: {
      label: 'Password',
      placeholder: 'Enter your password'
    },
    submit: 'Sign In',
    submitting: 'Signing in...'
  },
  messages: {
    accessDenied: 'This portal is for administrators only. Please use the member login if you are a Recipient or Interview Coordinator.',
    unexpectedError: 'An unexpected error occurred. Please try again.'
  },
  footer: {
    noAccount: "Don't have an account?",
    signUp: 'Sign up here',
    copyright: '© {{year}} Udaan Sarathi. All rights reserved.'
  }
}

const mockLoginTranslationsNe = {
  meta: {
    version: '1.0.0',
    lastUpdated: '2024-09-25',
    page: 'login'
  },
  title: 'प्रशासक लगइन',
  branding: {
    appName: 'उडान सारथी',
    logoAlt: 'उडान सारथी लोगो'
  },
  form: {
    username: {
      label: 'प्रयोगकर्ता नाम',
      placeholder: 'आफ्नो प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्'
    },
    password: {
      label: 'पासवर्ड',
      placeholder: 'आफ्नो पासवर्ड प्रविष्ट गर्नुहोस्'
    },
    submit: 'साइन इन गर्नुहोस्',
    submitting: 'साइन इन गर्दै...'
  },
  messages: {
    accessDenied: 'यो पोर्टल केवल प्रशासकहरूको लागि हो। यदि तपाईं प्राप्तकर्ता वा अन्तर्वार्ता संयोजक हुनुहुन्छ भने कृपया सदस्य लगइन प्रयोग गर्नुहोस्।',
    unexpectedError: 'अप्रत्याशित त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।'
  },
  footer: {
    noAccount: 'खाता छैन?',
    signUp: 'यहाँ साइन अप गर्नुहोस्',
    copyright: '© {{year}} उडान सारथी। सबै अधिकार सुरक्षित।'
  }
}

describe('Login Page Translation Loading', () => {
  beforeEach(() => {
    // Clear cache and reset state before each test
    i18nService.clearCache()
    i18nService.missingTranslations.clear()
    
    // Reset to English locale
    i18nService.setLocale('en')
    
    // Mock page translations
    i18nService.pageTranslations.set('en', new Map())
    i18nService.pageTranslations.set('ne', new Map())
    
    // Load mock translations
    i18nService.pageTranslations.get('en').set('login', mockLoginTranslationsEn)
    i18nService.pageTranslations.get('ne').set('login', mockLoginTranslationsNe)
  })

  describe('English Login Page Translations', () => {
    beforeEach(() => {
      i18nService.setLocale('en')
    })

    test('should load login page title correctly', () => {
      const title = i18nService.tPage('login', 'title')
      expect(title).toBe('Admin Login')
    })

    test('should load form labels correctly', () => {
      const usernameLabel = i18nService.tPage('login', 'form.username.label')
      const passwordLabel = i18nService.tPage('login', 'form.password.label')
      
      expect(usernameLabel).toBe('Username')
      expect(passwordLabel).toBe('Password')
    })

    test('should load form placeholders correctly', () => {
      const usernamePlaceholder = i18nService.tPage('login', 'form.username.placeholder')
      const passwordPlaceholder = i18nService.tPage('login', 'form.password.placeholder')
      
      expect(usernamePlaceholder).toBe('Enter your username')
      expect(passwordPlaceholder).toBe('Enter your password')
    })

    test('should load button text correctly', () => {
      const submitText = i18nService.tPage('login', 'form.submit')
      const submittingText = i18nService.tPage('login', 'form.submitting')
      
      expect(submitText).toBe('Sign In')
      expect(submittingText).toBe('Signing in...')
    })

    test('should load error messages correctly', () => {
      const accessDenied = i18nService.tPage('login', 'messages.accessDenied')
      const unexpectedError = i18nService.tPage('login', 'messages.unexpectedError')
      
      expect(accessDenied).toBe('This portal is for administrators only. Please use the member login if you are a Recipient or Interview Coordinator.')
      expect(unexpectedError).toBe('An unexpected error occurred. Please try again.')
    })

    test('should load footer text correctly', () => {
      const noAccount = i18nService.tPage('login', 'footer.noAccount')
      const signUp = i18nService.tPage('login', 'footer.signUp')
      
      expect(noAccount).toBe("Don't have an account?")
      expect(signUp).toBe('Sign up here')
    })

    test('should handle parameter interpolation in copyright', () => {
      const copyright = i18nService.tPage('login', 'footer.copyright', { year: 2024 })
      expect(copyright).toBe('© 2024 Udaan Sarathi. All rights reserved.')
    })

    test('should load branding text correctly', () => {
      const appName = i18nService.tPage('login', 'branding.appName')
      const logoAlt = i18nService.tPage('login', 'branding.logoAlt')
      
      expect(appName).toBe('Udaan Sarathi')
      expect(logoAlt).toBe('Udaan Sarathi Logo')
    })
  })

  describe('Nepali Login Page Translations', () => {
    beforeEach(() => {
      i18nService.setLocale('ne')
    })

    test('should load login page title correctly in Nepali', () => {
      const title = i18nService.tPage('login', 'title')
      expect(title).toBe('प्रशासक लगइन')
    })

    test('should load form labels correctly in Nepali', () => {
      const usernameLabel = i18nService.tPage('login', 'form.username.label')
      const passwordLabel = i18nService.tPage('login', 'form.password.label')
      
      expect(usernameLabel).toBe('प्रयोगकर्ता नाम')
      expect(passwordLabel).toBe('पासवर्ड')
    })

    test('should load form placeholders correctly in Nepali', () => {
      const usernamePlaceholder = i18nService.tPage('login', 'form.username.placeholder')
      const passwordPlaceholder = i18nService.tPage('login', 'form.password.placeholder')
      
      expect(usernamePlaceholder).toBe('आफ्नो प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्')
      expect(passwordPlaceholder).toBe('आफ्नो पासवर्ड प्रविष्ट गर्नुहोस्')
    })

    test('should load button text correctly in Nepali', () => {
      const submitText = i18nService.tPage('login', 'form.submit')
      const submittingText = i18nService.tPage('login', 'form.submitting')
      
      expect(submitText).toBe('साइन इन गर्नुहोस्')
      expect(submittingText).toBe('साइन इन गर्दै...')
    })

    test('should load error messages correctly in Nepali', () => {
      const accessDenied = i18nService.tPage('login', 'messages.accessDenied')
      const unexpectedError = i18nService.tPage('login', 'messages.unexpectedError')
      
      expect(accessDenied).toBe('यो पोर्टल केवल प्रशासकहरूको लागि हो। यदि तपाईं प्राप्तकर्ता वा अन्तर्वार्ता संयोजक हुनुहुन्छ भने कृपया सदस्य लगइन प्रयोग गर्नुहोस्।')
      expect(unexpectedError).toBe('अप्रत्याशित त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।')
    })

    test('should load footer text correctly in Nepali', () => {
      const noAccount = i18nService.tPage('login', 'footer.noAccount')
      const signUp = i18nService.tPage('login', 'footer.signUp')
      
      expect(noAccount).toBe('खाता छैन?')
      expect(signUp).toBe('यहाँ साइन अप गर्नुहोस्')
    })

    test('should handle parameter interpolation in Nepali copyright', () => {
      const copyright = i18nService.tPage('login', 'footer.copyright', { year: 2024 })
      expect(copyright).toBe('© 2024 उडान सारथी। सबै अधिकार सुरक्षित।')
    })

    test('should load branding text correctly in Nepali', () => {
      const appName = i18nService.tPage('login', 'branding.appName')
      const logoAlt = i18nService.tPage('login', 'branding.logoAlt')
      
      expect(appName).toBe('उडान सारथी')
      expect(logoAlt).toBe('उडान सारथी लोगो')
    })
  })

  describe('Translation Validation and Error Handling', () => {
    test('should validate login translation structure', () => {
      const isValidEn = i18nService.validateTranslations(mockLoginTranslationsEn, 'login-en')
      const isValidNe = i18nService.validateTranslations(mockLoginTranslationsNe, 'login-ne')
      
      expect(isValidEn).toBe(true)
      expect(isValidNe).toBe(true)
    })

    test('should handle missing translation keys gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const result = i18nService.tPage('login', 'nonexistent.key')
      expect(result).toBe('nonexistent.key') // Should fallback to key name
      
      consoleSpy.mockRestore()
    })

    test('should track missing translations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      i18nService.tPage('login', 'missing.translation.key')
      
      const missingTranslations = i18nService.getMissingTranslations()
      expect(missingTranslations).toContain('en:page.login.missing.translation.key')
      
      consoleSpy.mockRestore()
    })

    test('should handle bulk translation for login page', () => {
      const keys = [
        'title',
        'form.username.label',
        'form.password.label',
        'form.submit'
      ]
      
      const result = {}
      keys.forEach(key => {
        result[key] = i18nService.tPage('login', key)
      })
      
      expect(result['title']).toBe('Admin Login')
      expect(result['form.username.label']).toBe('Username')
      expect(result['form.password.label']).toBe('Password')
      expect(result['form.submit']).toBe('Sign In')
    })
  })

  describe('Language Switching', () => {
    test('should switch between English and Nepali correctly', () => {
      // Test English
      i18nService.setLocale('en')
      let title = i18nService.tPage('login', 'title')
      expect(title).toBe('Admin Login')
      
      // Switch to Nepali
      i18nService.setLocale('ne')
      title = i18nService.tPage('login', 'title')
      expect(title).toBe('प्रशासक लगइन')
      
      // Switch back to English
      i18nService.setLocale('en')
      title = i18nService.tPage('login', 'title')
      expect(title).toBe('Admin Login')
    })

    test('should maintain translation consistency across language switches', () => {
      const testKey = 'form.username.label'
      
      i18nService.setLocale('en')
      const englishValue = i18nService.tPage('login', testKey)
      
      i18nService.setLocale('ne')
      const nepaliValue = i18nService.tPage('login', testKey)
      
      i18nService.setLocale('en')
      const englishValueAgain = i18nService.tPage('login', testKey)
      
      expect(englishValue).toBe('Username')
      expect(nepaliValue).toBe('प्रयोगकर्ता नाम')
      expect(englishValueAgain).toBe(englishValue)
    })
  })

  describe('Performance and Caching', () => {
    test('should cache login page translations for performance', () => {
      // First call should load and cache
      const firstCall = i18nService.tPage('login', 'title')
      
      // Second call should use cache
      const secondCall = i18nService.tPage('login', 'title')
      
      expect(firstCall).toBe(secondCall)
      expect(firstCall).toBe('Admin Login')
    })

    test('should clear login page cache when requested', () => {
      // Load translation to cache
      i18nService.tPage('login', 'title')
      
      // Clear cache
      i18nService.clearCache('login')
      
      // Should still work after cache clear
      const result = i18nService.tPage('login', 'title')
      expect(result).toBe('Admin Login')
    })
  })
})