import i18nService from '../../services/i18nService'

// Mock the MemberLogin translation files
const mockMemberLoginTranslationsEn = {
  meta: {
    version: '1.0.0',
    lastUpdated: '2024-09-25',
    page: 'member-login'
  },
  title: 'Member Portal',
  subtitle: 'Recipients & Interview Coordinators',
  branding: {
    logoAlt: 'Udaan Sarathi Logo'
  },
  welcome: {
    withName: 'Welcome, {{name}}!',
    general: 'Recipients & Interview Coordinators'
  },
  cardTitle: {
    withInvitation: 'Complete Your Setup',
    default: 'Sign in to continue'
  },
  invitationMessage: "You've been invited to join the team. Please sign in to access your dashboard.",
  form: {
    username: {
      label: 'Username or Phone Number',
      placeholder: 'Enter your username or phone'
    },
    password: {
      label: 'Password',
      placeholder: 'Enter your password'
    },
    submit: {
      withInvitation: 'Access Dashboard',
      default: 'Sign In'
    },
    submitting: 'Signing in...'
  },
  invitationDetails: {
    title: 'Invitation Details:',
    description: "You've been invited as a team member. After signing in, you'll have access to the agency management dashboard."
  },
  messages: {
    loginFailed: 'Login failed. Please check your credentials.',
    unauthorizedAccess: 'This portal is for team members only (Recipients & Interview Coordinators). Administrators must use the /login page.',
    unexpectedError: 'An unexpected error occurred. Please try again.'
  },
  footer: {
    needHelp: 'Need help? Contact your agency administrator',
    copyright: '© {{year}} Udaan Sarathi. All rights reserved.'
  }
}

const mockMemberLoginTranslationsNe = {
  meta: {
    version: '1.0.0',
    lastUpdated: '2024-09-25',
    page: 'member-login'
  },
  title: 'सदस्य पोर्टल',
  subtitle: 'प्राप्तकर्ता र अन्तर्वार्ता संयोजकहरू',
  branding: {
    logoAlt: 'उडान सारथी लोगो'
  },
  welcome: {
    withName: 'स्वागत छ, {{name}}!',
    general: 'प्राप्तकर्ता र अन्तर्वार्ता संयोजकहरू'
  },
  cardTitle: {
    withInvitation: 'आफ्नो सेटअप पूरा गर्नुहोस्',
    default: 'जारी राख्न साइन इन गर्नुहोस्'
  },
  invitationMessage: 'तपाईंलाई टोलीमा सामेल हुन निमन्त्रणा दिइएको छ। कृपया आफ्नो ड्यासबोर्ड पहुँच गर्न साइन इन गर्नुहोस्।',
  form: {
    username: {
      label: 'प्रयोगकर्ता नाम वा फोन नम्बर',
      placeholder: 'आफ्नो प्रयोगकर्ता नाम वा फोन प्रविष्ट गर्नुहोस्'
    },
    password: {
      label: 'पासवर्ड',
      placeholder: 'आफ्नो पासवर्ड प्रविष्ट गर्नुहोस्'
    },
    submit: {
      withInvitation: 'ड्यासबोर्ड पहुँच गर्नुहोस्',
      default: 'साइन इन गर्नुहोस्'
    },
    submitting: 'साइन इन गर्दै...'
  },
  invitationDetails: {
    title: 'निमन्त्रणा विवरणहरू:',
    description: 'तपाईंलाई टोली सदस्यको रूपमा निमन्त्रणा दिइएको छ। साइन इन गरेपछि, तपाईंसँग एजेन्सी व्यवस्थापन ड्यासबोर्डमा पहुँच हुनेछ।'
  },
  messages: {
    loginFailed: 'लगइन असफल। कृपया आफ्नो प्रमाणहरू जाँच गर्नुहोस्।',
    unauthorizedAccess: 'यो पोर्टल केवल टोली सदस्यहरूको लागि हो (प्राप्तकर्ता र अन्तर्वार्ता संयोजकहरू)। प्रशासकहरूले /login पृष्ठ प्रयोग गर्नुपर्छ।',
    unexpectedError: 'अप्रत्याशित त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।'
  },
  footer: {
    needHelp: 'मद्दत चाहिन्छ? आफ्नो एजेन्सी प्रशासकलाई सम्पर्क गर्नुहोस्',
    copyright: '© {{year}} उडान सारथी। सबै अधिकार सुरक्षित।'
  }
}

describe('MemberLogin Page Translation Loading', () => {
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
    i18nService.pageTranslations.get('en').set('member-login', mockMemberLoginTranslationsEn)
    i18nService.pageTranslations.get('ne').set('member-login', mockMemberLoginTranslationsNe)
  })

  describe('English MemberLogin Page Translations', () => {
    beforeEach(() => {
      i18nService.setLocale('en')
    })

    test('should load page title and subtitle correctly', () => {
      const title = i18nService.tPage('member-login', 'title')
      const subtitle = i18nService.tPage('member-login', 'subtitle')
      
      expect(title).toBe('Member Portal')
      expect(subtitle).toBe('Recipients & Interview Coordinators')
    })

    test('should load welcome messages correctly', () => {
      const welcomeWithName = i18nService.tPage('member-login', 'welcome.withName', { name: 'John' })
      const welcomeGeneral = i18nService.tPage('member-login', 'welcome.general')
      
      expect(welcomeWithName).toBe('Welcome, John!')
      expect(welcomeGeneral).toBe('Recipients & Interview Coordinators')
    })

    test('should load card titles correctly', () => {
      const cardTitleWithInvitation = i18nService.tPage('member-login', 'cardTitle.withInvitation')
      const cardTitleDefault = i18nService.tPage('member-login', 'cardTitle.default')
      
      expect(cardTitleWithInvitation).toBe('Complete Your Setup')
      expect(cardTitleDefault).toBe('Sign in to continue')
    })

    test('should load invitation message correctly', () => {
      const invitationMessage = i18nService.tPage('member-login', 'invitationMessage')
      
      expect(invitationMessage).toBe("You've been invited to join the team. Please sign in to access your dashboard.")
    })

    test('should load form elements correctly', () => {
      const usernameLabel = i18nService.tPage('member-login', 'form.username.label')
      const usernamePlaceholder = i18nService.tPage('member-login', 'form.username.placeholder')
      const passwordLabel = i18nService.tPage('member-login', 'form.password.label')
      const passwordPlaceholder = i18nService.tPage('member-login', 'form.password.placeholder')
      
      expect(usernameLabel).toBe('Username or Phone Number')
      expect(usernamePlaceholder).toBe('Enter your username or phone')
      expect(passwordLabel).toBe('Password')
      expect(passwordPlaceholder).toBe('Enter your password')
    })

    test('should load submit button text correctly', () => {
      const submitWithInvitation = i18nService.tPage('member-login', 'form.submit.withInvitation')
      const submitDefault = i18nService.tPage('member-login', 'form.submit.default')
      const submitting = i18nService.tPage('member-login', 'form.submitting')
      
      expect(submitWithInvitation).toBe('Access Dashboard')
      expect(submitDefault).toBe('Sign In')
      expect(submitting).toBe('Signing in...')
    })

    test('should load invitation details correctly', () => {
      const invitationTitle = i18nService.tPage('member-login', 'invitationDetails.title')
      const invitationDescription = i18nService.tPage('member-login', 'invitationDetails.description')
      
      expect(invitationTitle).toBe('Invitation Details:')
      expect(invitationDescription).toBe("You've been invited as a team member. After signing in, you'll have access to the agency management dashboard.")
    })

    test('should load error messages correctly', () => {
      const loginFailed = i18nService.tPage('member-login', 'messages.loginFailed')
      const unauthorizedAccess = i18nService.tPage('member-login', 'messages.unauthorizedAccess')
      const unexpectedError = i18nService.tPage('member-login', 'messages.unexpectedError')
      
      expect(loginFailed).toBe('Login failed. Please check your credentials.')
      expect(unauthorizedAccess).toBe('This portal is for team members only (Recipients & Interview Coordinators). Administrators must use the /login page.')
      expect(unexpectedError).toBe('An unexpected error occurred. Please try again.')
    })

    test('should load footer text correctly', () => {
      const needHelp = i18nService.tPage('member-login', 'footer.needHelp')
      const copyright = i18nService.tPage('member-login', 'footer.copyright', { year: 2024 })
      
      expect(needHelp).toBe('Need help? Contact your agency administrator')
      expect(copyright).toBe('© 2024 Udaan Sarathi. All rights reserved.')
    })

    test('should load branding elements correctly', () => {
      const logoAlt = i18nService.tPage('member-login', 'branding.logoAlt')
      
      expect(logoAlt).toBe('Udaan Sarathi Logo')
    })
  })

  describe('Nepali MemberLogin Page Translations', () => {
    beforeEach(() => {
      i18nService.setLocale('ne')
    })

    test('should load page title and subtitle correctly in Nepali', () => {
      const title = i18nService.tPage('member-login', 'title')
      const subtitle = i18nService.tPage('member-login', 'subtitle')
      
      expect(title).toBe('सदस्य पोर्टल')
      expect(subtitle).toBe('प्राप्तकर्ता र अन्तर्वार्ता संयोजकहरू')
    })

    test('should load welcome messages correctly in Nepali', () => {
      const welcomeWithName = i18nService.tPage('member-login', 'welcome.withName', { name: 'राम' })
      const welcomeGeneral = i18nService.tPage('member-login', 'welcome.general')
      
      expect(welcomeWithName).toBe('स्वागत छ, राम!')
      expect(welcomeGeneral).toBe('प्राप्तकर्ता र अन्तर्वार्ता संयोजकहरू')
    })

    test('should load card titles correctly in Nepali', () => {
      const cardTitleWithInvitation = i18nService.tPage('member-login', 'cardTitle.withInvitation')
      const cardTitleDefault = i18nService.tPage('member-login', 'cardTitle.default')
      
      expect(cardTitleWithInvitation).toBe('आफ्नो सेटअप पूरा गर्नुहोस्')
      expect(cardTitleDefault).toBe('जारी राख्न साइन इन गर्नुहोस्')
    })

    test('should load invitation message correctly in Nepali', () => {
      const invitationMessage = i18nService.tPage('member-login', 'invitationMessage')
      
      expect(invitationMessage).toBe('तपाईंलाई टोलीमा सामेल हुन निमन्त्रणा दिइएको छ। कृपया आफ्नो ड्यासबोर्ड पहुँच गर्न साइन इन गर्नुहोस्।')
    })

    test('should load form elements correctly in Nepali', () => {
      const usernameLabel = i18nService.tPage('member-login', 'form.username.label')
      const usernamePlaceholder = i18nService.tPage('member-login', 'form.username.placeholder')
      const passwordLabel = i18nService.tPage('member-login', 'form.password.label')
      const passwordPlaceholder = i18nService.tPage('member-login', 'form.password.placeholder')
      
      expect(usernameLabel).toBe('प्रयोगकर्ता नाम वा फोन नम्बर')
      expect(usernamePlaceholder).toBe('आफ्नो प्रयोगकर्ता नाम वा फोन प्रविष्ट गर्नुहोस्')
      expect(passwordLabel).toBe('पासवर्ड')
      expect(passwordPlaceholder).toBe('आफ्नो पासवर्ड प्रविष्ट गर्नुहोस्')
    })

    test('should load submit button text correctly in Nepali', () => {
      const submitWithInvitation = i18nService.tPage('member-login', 'form.submit.withInvitation')
      const submitDefault = i18nService.tPage('member-login', 'form.submit.default')
      const submitting = i18nService.tPage('member-login', 'form.submitting')
      
      expect(submitWithInvitation).toBe('ड्यासबोर्ड पहुँच गर्नुहोस्')
      expect(submitDefault).toBe('साइन इन गर्नुहोस्')
      expect(submitting).toBe('साइन इन गर्दै...')
    })

    test('should load invitation details correctly in Nepali', () => {
      const invitationTitle = i18nService.tPage('member-login', 'invitationDetails.title')
      const invitationDescription = i18nService.tPage('member-login', 'invitationDetails.description')
      
      expect(invitationTitle).toBe('निमन्त्रणा विवरणहरू:')
      expect(invitationDescription).toBe('तपाईंलाई टोली सदस्यको रूपमा निमन्त्रणा दिइएको छ। साइन इन गरेपछि, तपाईंसँग एजेन्सी व्यवस्थापन ड्यासबोर्डमा पहुँच हुनेछ।')
    })

    test('should load error messages correctly in Nepali', () => {
      const loginFailed = i18nService.tPage('member-login', 'messages.loginFailed')
      const unauthorizedAccess = i18nService.tPage('member-login', 'messages.unauthorizedAccess')
      const unexpectedError = i18nService.tPage('member-login', 'messages.unexpectedError')
      
      expect(loginFailed).toBe('लगइन असफल। कृपया आफ्नो प्रमाणहरू जाँच गर्नुहोस्।')
      expect(unauthorizedAccess).toBe('यो पोर्टल केवल टोली सदस्यहरूको लागि हो (प्राप्तकर्ता र अन्तर्वार्ता संयोजकहरू)। प्रशासकहरूले /login पृष्ठ प्रयोग गर्नुपर्छ।')
      expect(unexpectedError).toBe('अप्रत्याशित त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।')
    })

    test('should load footer text correctly in Nepali', () => {
      const needHelp = i18nService.tPage('member-login', 'footer.needHelp')
      const copyright = i18nService.tPage('member-login', 'footer.copyright', { year: 2024 })
      
      expect(needHelp).toBe('मद्दत चाहिन्छ? आफ्नो एजेन्सी प्रशासकलाई सम्पर्क गर्नुहोस्')
      expect(copyright).toBe('© 2024 उडान सारथी। सबै अधिकार सुरक्षित।')
    })

    test('should load branding elements correctly in Nepali', () => {
      const logoAlt = i18nService.tPage('member-login', 'branding.logoAlt')
      
      expect(logoAlt).toBe('उडान सारथी लोगो')
    })
  })

  describe('Translation Validation and Error Handling', () => {
    test('should validate member-login translation structure', () => {
      const isValidEn = i18nService.validateTranslations(mockMemberLoginTranslationsEn, 'member-login-en')
      const isValidNe = i18nService.validateTranslations(mockMemberLoginTranslationsNe, 'member-login-ne')
      
      expect(isValidEn).toBe(true)
      expect(isValidNe).toBe(true)
    })

    test('should handle missing translation keys gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const result = i18nService.tPage('member-login', 'nonexistent.key')
      expect(result).toBe('nonexistent.key') // Should fallback to key name
      
      consoleSpy.mockRestore()
    })

    test('should track missing translations for member-login', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      i18nService.tPage('member-login', 'missing.translation.key')
      
      const missingTranslations = i18nService.getMissingTranslations()
      expect(missingTranslations).toContain('en:page.member-login.missing.translation.key')
      
      consoleSpy.mockRestore()
    })

    test('should handle bulk translation for member-login page', () => {
      const keys = [
        'title',
        'form.username.label',
        'form.password.label',
        'form.submit.default'
      ]
      
      const result = {}
      keys.forEach(key => {
        result[key] = i18nService.tPage('member-login', key)
      })
      
      expect(result['title']).toBe('Member Portal')
      expect(result['form.username.label']).toBe('Username or Phone Number')
      expect(result['form.password.label']).toBe('Password')
      expect(result['form.submit.default']).toBe('Sign In')
    })
  })

  describe('Conditional Content Translation', () => {
    test('should handle conditional submit button text based on invitation', () => {
      i18nService.setLocale('en')
      
      // With invitation
      const submitWithInvitation = i18nService.tPage('member-login', 'form.submit.withInvitation')
      expect(submitWithInvitation).toBe('Access Dashboard')
      
      // Without invitation
      const submitDefault = i18nService.tPage('member-login', 'form.submit.default')
      expect(submitDefault).toBe('Sign In')
    })

    test('should handle conditional card titles based on invitation', () => {
      i18nService.setLocale('ne')
      
      // With invitation
      const cardTitleWithInvitation = i18nService.tPage('member-login', 'cardTitle.withInvitation')
      expect(cardTitleWithInvitation).toBe('आफ्नो सेटअप पूरा गर्नुहोस्')
      
      // Without invitation
      const cardTitleDefault = i18nService.tPage('member-login', 'cardTitle.default')
      expect(cardTitleDefault).toBe('जारी राख्न साइन इन गर्नुहोस्')
    })
  })

  describe('Language Switching', () => {
    test('should switch between English and Nepali correctly for member-login', () => {
      // Test English
      i18nService.setLocale('en')
      let title = i18nService.tPage('member-login', 'title')
      expect(title).toBe('Member Portal')
      
      // Switch to Nepali
      i18nService.setLocale('ne')
      title = i18nService.tPage('member-login', 'title')
      expect(title).toBe('सदस्य पोर्टल')
      
      // Switch back to English
      i18nService.setLocale('en')
      title = i18nService.tPage('member-login', 'title')
      expect(title).toBe('Member Portal')
    })

    test('should maintain translation consistency across language switches', () => {
      const testKey = 'form.username.label'
      
      i18nService.setLocale('en')
      const englishValue = i18nService.tPage('member-login', testKey)
      
      i18nService.setLocale('ne')
      const nepaliValue = i18nService.tPage('member-login', testKey)
      
      i18nService.setLocale('en')
      const englishValueAgain = i18nService.tPage('member-login', testKey)
      
      expect(englishValue).toBe('Username or Phone Number')
      expect(nepaliValue).toBe('प्रयोगकर्ता नाम वा फोन नम्बर')
      expect(englishValueAgain).toBe(englishValue)
    })
  })

  describe('Performance and Caching', () => {
    test('should cache member-login page translations for performance', () => {
      // First call should load and cache
      const firstCall = i18nService.tPage('member-login', 'title')
      
      // Second call should use cache
      const secondCall = i18nService.tPage('member-login', 'title')
      
      expect(firstCall).toBe(secondCall)
      expect(firstCall).toBe('Member Portal')
    })

    test('should clear member-login page cache when requested', () => {
      // Load translation to cache
      i18nService.tPage('member-login', 'title')
      
      // Clear cache
      i18nService.clearCache('member-login')
      
      // Should still work after cache clear
      const result = i18nService.tPage('member-login', 'title')
      expect(result).toBe('Member Portal')
    })
  })

  describe('Parameter Interpolation', () => {
    test('should handle complex parameter interpolation', () => {
      i18nService.setLocale('en')
      
      const welcomeMessage = i18nService.tPage('member-login', 'welcome.withName', { name: 'John Doe' })
      const copyright = i18nService.tPage('member-login', 'footer.copyright', { year: 2024 })
      
      expect(welcomeMessage).toBe('Welcome, John Doe!')
      expect(copyright).toBe('© 2024 Udaan Sarathi. All rights reserved.')
    })

    test('should handle parameter interpolation in Nepali', () => {
      i18nService.setLocale('ne')
      
      const welcomeMessage = i18nService.tPage('member-login', 'welcome.withName', { name: 'राम बहादुर' })
      const copyright = i18nService.tPage('member-login', 'footer.copyright', { year: 2024 })
      
      expect(welcomeMessage).toBe('स्वागत छ, राम बहादुर!')
      expect(copyright).toBe('© 2024 उडान सारथी। सबै अधिकार सुरक्षित।')
    })
  })
})