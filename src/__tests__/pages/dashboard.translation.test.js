import i18nService from '../../services/i18nService'

// Mock the Dashboard translation files
const mockDashboardTranslationsEn = {
  meta: {
    version: '1.0.0',
    lastUpdated: '2024-09-25',
    page: 'dashboard'
  },
  header: {
    welcomeBack: 'Welcome back, {{name}}',
    roleDescriptions: {
      admin: 'Full system access - Manage all recruitment operations',
      recipient: 'Manage jobs, applications, interviews, and workflow',
      coordinator: 'Handle scheduling, notifications, and document management'
    },
    searchPlaceholder: 'Search jobs, candidates...',
    notifications: 'Notifications',
    newApplicants: '{{count}} new applicants today'
  },
  status: {
    access: '{{role}} Access',
    updated: 'Updated: {{time}}',
    customRange: 'Custom Range: {{startDate}} - {{endDate}}',
    liveData: 'Live Data',
    updatesEvery: 'Updates every 5 mins',
    lastRefresh: 'Last refresh: {{time}}'
  },
  filters: {
    timeWindow: {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      custom: 'Custom Range'
    },
    allJobs: 'All Jobs',
    allCountries: 'All Countries',
    filterByJob: 'Filter by Job',
    filterByCountry: 'Filter by Country'
  },
  metrics: {
    jobs: {
      title: 'Jobs',
      total: 'Total jobs',
      open: 'Open jobs',
      recent: 'Recent jobs (28 days)',
      drafts: 'Drafts'
    },
    applications: {
      title: 'Applications',
      applicants: 'Applicants',
      appliedToJobs: 'Applied to jobs',
      shortlisted: 'Shortlisted',
      selected: 'Selected'
    },
    interviews: {
      title: 'Interviews',
      pendingWeek: 'Pending interviews this week',
      completedToday: 'Completed Today',
      interviewedMonth: 'Interviewed This Month',
      passRate: 'Pass Rate',
      candidate: 'candidate',
      candidates: 'candidates',
      passed: 'passed',
      failed: 'failed'
    }
  },
  quickActions: {
    title: 'Quick Actions',
    createJob: {
      title: 'Create Job',
      drafts: 'Drafts'
    },
    applications: {
      title: 'Applications',
      applicants: 'Applicants'
    },
    interviews: {
      title: 'Interviews',
      pending: 'Pending'
    },
    workflow: {
      title: 'Workflow',
      inProcess: 'In Process'
    }
  },
  loading: {
    dashboard: 'Loading dashboard analytics...'
  },
  error: {
    failedToLoad: 'Failed to load dashboard',
    retry: 'Retry'
  },
  success: {
    dashboardUpdated: 'Dashboard Updated',
    dataRefreshed: 'Analytics data has been refreshed successfully.'
  }
}

const mockDashboardTranslationsNe = {
  meta: {
    version: '1.0.0',
    lastUpdated: '2024-09-25',
    page: 'dashboard'
  },
  header: {
    welcomeBack: 'फिर्ता स्वागत छ, {{name}}',
    roleDescriptions: {
      admin: 'पूर्ण प्रणाली पहुँच - सबै भर्ना सञ्चालनहरू व्यवस्थापन गर्नुहोस्',
      recipient: 'जागिर, आवेदन, अन्तर्वार्ता, र कार्यप्रवाह व्यवस्थापन गर्नुहोस्',
      coordinator: 'समयतालिका, सूचना, र कागजात व्यवस्थापन ह्यान्डल गर्नुहोस्'
    },
    searchPlaceholder: 'जागिर, उम्मेदवारहरू खोज्नुहोस्...',
    notifications: 'सूचनाहरू',
    newApplicants: 'आज {{count}} नयाँ आवेदकहरू'
  },
  status: {
    access: '{{role}} पहुँच',
    updated: 'अपडेट गरिएको: {{time}}',
    customRange: 'कस्टम दायरा: {{startDate}} - {{endDate}}',
    liveData: 'प्रत्यक्ष डेटा',
    updatesEvery: 'प्रत्येक ५ मिनेटमा अपडेट हुन्छ',
    lastRefresh: 'अन्तिम रिफ्रेस: {{time}}'
  },
  filters: {
    timeWindow: {
      today: 'आज',
      week: 'यो हप्ता',
      month: 'यो महिना',
      custom: 'कस्टम दायरा'
    },
    allJobs: 'सबै जागिरहरू',
    allCountries: 'सबै देशहरू',
    filterByJob: 'जागिरद्वारा फिल्टर गर्नुहोस्',
    filterByCountry: 'देशद्वारा फिल्टर गर्नुहोस्'
  },
  metrics: {
    jobs: {
      title: 'जागिरहरू',
      total: 'कुल जागिरहरू',
      open: 'खुला जागिरहरू',
      recent: 'हालका जागिरहरू (२८ दिन)',
      drafts: 'मस्यौदाहरू'
    },
    applications: {
      title: 'आवेदनहरू',
      applicants: 'आवेदकहरू',
      appliedToJobs: 'जागिरहरूमा आवेदन दिएको',
      shortlisted: 'छनोट सूचीमा',
      selected: 'चयन गरिएको'
    },
    interviews: {
      title: 'अन्तर्वार्ताहरू',
      pendingWeek: 'यो हप्ता बाँकी अन्तर्वार्ताहरू',
      completedToday: 'आज सम्पन्न भएको',
      interviewedMonth: 'यो महिना अन्तर्वार्ता लिइएको',
      passRate: 'उत्तीर्ण दर',
      candidate: 'उम्मेदवार',
      candidates: 'उम्मेदवारहरू',
      passed: 'उत्तीर्ण',
      failed: 'असफल'
    }
  },
  quickActions: {
    title: 'द्रुत कार्यहरू',
    createJob: {
      title: 'जागिर सिर्जना गर्नुहोस्',
      drafts: 'मस्यौदाहरू'
    },
    applications: {
      title: 'आवेदनहरू',
      applicants: 'आवेदकहरू'
    },
    interviews: {
      title: 'अन्तर्वार्ताहरू',
      pending: 'बाँकी'
    },
    workflow: {
      title: 'कार्यप्रवाह',
      inProcess: 'प्रक्रियामा'
    }
  },
  loading: {
    dashboard: 'ड्यासबोर्ड एनालिटिक्स लोड गर्दै...'
  },
  error: {
    failedToLoad: 'ड्यासबोर्ड लोड गर्न असफल',
    retry: 'पुनः प्रयास गर्नुहोस्'
  },
  success: {
    dashboardUpdated: 'ड्यासबोर्ड अपडेट गरियो',
    dataRefreshed: 'एनालिटिक्स डेटा सफलतापूर्वक रिफ्रेस गरियो।'
  }
}

describe('Dashboard Page Translation Loading', () => {
  beforeEach(() => {
    // Clear cache and reset state before each test
    i18nService.clearCache()
    i18nService.missingTranslations.clear()
    
    // Mock page translations
    i18nService.pageTranslations.set('en', new Map())
    i18nService.pageTranslations.set('ne', new Map())
    
    // Load mock translations
    i18nService.pageTranslations.get('en').set('dashboard', mockDashboardTranslationsEn)
    i18nService.pageTranslations.get('ne').set('dashboard', mockDashboardTranslationsNe)
  })

  describe('English Dashboard Page Translations', () => {
    beforeEach(() => {
      i18nService.setLocale('en')
    })

    test('should load header translations correctly', () => {
      const welcomeBack = i18nService.tPage('dashboard', 'header.welcomeBack', { name: 'John' })
      const searchPlaceholder = i18nService.tPage('dashboard', 'header.searchPlaceholder')
      const notifications = i18nService.tPage('dashboard', 'header.notifications')
      
      expect(welcomeBack).toBe('Welcome back, John')
      expect(searchPlaceholder).toBe('Search jobs, candidates...')
      expect(notifications).toBe('Notifications')
    })

    test('should load role descriptions correctly', () => {
      const adminDesc = i18nService.tPage('dashboard', 'header.roleDescriptions.admin')
      const recipientDesc = i18nService.tPage('dashboard', 'header.roleDescriptions.recipient')
      const coordinatorDesc = i18nService.tPage('dashboard', 'header.roleDescriptions.coordinator')
      
      expect(adminDesc).toBe('Full system access - Manage all recruitment operations')
      expect(recipientDesc).toBe('Manage jobs, applications, interviews, and workflow')
      expect(coordinatorDesc).toBe('Handle scheduling, notifications, and document management')
    })

    test('should load status indicators correctly', () => {
      const access = i18nService.tPage('dashboard', 'status.access', { role: 'Admin' })
      const updated = i18nService.tPage('dashboard', 'status.updated', { time: '10:30 AM' })
      const liveData = i18nService.tPage('dashboard', 'status.liveData')
      
      expect(access).toBe('Admin Access')
      expect(updated).toBe('Updated: 10:30 AM')
      expect(liveData).toBe('Live Data')
    })

    test('should load filter options correctly', () => {
      const today = i18nService.tPage('dashboard', 'filters.timeWindow.today')
      const week = i18nService.tPage('dashboard', 'filters.timeWindow.week')
      const allJobs = i18nService.tPage('dashboard', 'filters.allJobs')
      const allCountries = i18nService.tPage('dashboard', 'filters.allCountries')
      
      expect(today).toBe('Today')
      expect(week).toBe('This Week')
      expect(allJobs).toBe('All Jobs')
      expect(allCountries).toBe('All Countries')
    })

    test('should load metrics titles and labels correctly', () => {
      const jobsTitle = i18nService.tPage('dashboard', 'metrics.jobs.title')
      const totalJobs = i18nService.tPage('dashboard', 'metrics.jobs.total')
      const applicationsTitle = i18nService.tPage('dashboard', 'metrics.applications.title')
      const applicants = i18nService.tPage('dashboard', 'metrics.applications.applicants')
      
      expect(jobsTitle).toBe('Jobs')
      expect(totalJobs).toBe('Total jobs')
      expect(applicationsTitle).toBe('Applications')
      expect(applicants).toBe('Applicants')
    })

    test('should load quick actions correctly', () => {
      const quickActionsTitle = i18nService.tPage('dashboard', 'quickActions.title')
      const createJobTitle = i18nService.tPage('dashboard', 'quickActions.createJob.title')
      const applicationsTitle = i18nService.tPage('dashboard', 'quickActions.applications.title')
      
      expect(quickActionsTitle).toBe('Quick Actions')
      expect(createJobTitle).toBe('Create Job')
      expect(applicationsTitle).toBe('Applications')
    })

    test('should load loading and error messages correctly', () => {
      const loadingDashboard = i18nService.tPage('dashboard', 'loading.dashboard')
      const failedToLoad = i18nService.tPage('dashboard', 'error.failedToLoad')
      const retry = i18nService.tPage('dashboard', 'error.retry')
      
      expect(loadingDashboard).toBe('Loading dashboard analytics...')
      expect(failedToLoad).toBe('Failed to load dashboard')
      expect(retry).toBe('Retry')
    })
  })

  describe('Nepali Dashboard Page Translations', () => {
    beforeEach(() => {
      i18nService.setLocale('ne')
    })

    test('should load header translations correctly in Nepali', () => {
      const welcomeBack = i18nService.tPage('dashboard', 'header.welcomeBack', { name: 'राम' })
      const searchPlaceholder = i18nService.tPage('dashboard', 'header.searchPlaceholder')
      const notifications = i18nService.tPage('dashboard', 'header.notifications')
      
      expect(welcomeBack).toBe('फिर्ता स्वागत छ, राम')
      expect(searchPlaceholder).toBe('जागिर, उम्मेदवारहरू खोज्नुहोस्...')
      expect(notifications).toBe('सूचनाहरू')
    })

    test('should load role descriptions correctly in Nepali', () => {
      const adminDesc = i18nService.tPage('dashboard', 'header.roleDescriptions.admin')
      const recipientDesc = i18nService.tPage('dashboard', 'header.roleDescriptions.recipient')
      const coordinatorDesc = i18nService.tPage('dashboard', 'header.roleDescriptions.coordinator')
      
      expect(adminDesc).toBe('पूर्ण प्रणाली पहुँच - सबै भर्ना सञ्चालनहरू व्यवस्थापन गर्नुहोस्')
      expect(recipientDesc).toBe('जागिर, आवेदन, अन्तर्वार्ता, र कार्यप्रवाह व्यवस्थापन गर्नुहोस्')
      expect(coordinatorDesc).toBe('समयतालिका, सूचना, र कागजात व्यवस्थापन ह्यान्डल गर्नुहोस्')
    })

    test('should load status indicators correctly in Nepali', () => {
      const access = i18nService.tPage('dashboard', 'status.access', { role: 'प्रशासक' })
      const updated = i18nService.tPage('dashboard', 'status.updated', { time: '१०:३० बजे' })
      const liveData = i18nService.tPage('dashboard', 'status.liveData')
      
      expect(access).toBe('प्रशासक पहुँच')
      expect(updated).toBe('अपडेट गरिएको: १०:३० बजे')
      expect(liveData).toBe('प्रत्यक्ष डेटा')
    })

    test('should load filter options correctly in Nepali', () => {
      const today = i18nService.tPage('dashboard', 'filters.timeWindow.today')
      const week = i18nService.tPage('dashboard', 'filters.timeWindow.week')
      const allJobs = i18nService.tPage('dashboard', 'filters.allJobs')
      const allCountries = i18nService.tPage('dashboard', 'filters.allCountries')
      
      expect(today).toBe('आज')
      expect(week).toBe('यो हप्ता')
      expect(allJobs).toBe('सबै जागिरहरू')
      expect(allCountries).toBe('सबै देशहरू')
    })

    test('should load metrics titles and labels correctly in Nepali', () => {
      const jobsTitle = i18nService.tPage('dashboard', 'metrics.jobs.title')
      const totalJobs = i18nService.tPage('dashboard', 'metrics.jobs.total')
      const applicationsTitle = i18nService.tPage('dashboard', 'metrics.applications.title')
      const applicants = i18nService.tPage('dashboard', 'metrics.applications.applicants')
      
      expect(jobsTitle).toBe('जागिरहरू')
      expect(totalJobs).toBe('कुल जागिरहरू')
      expect(applicationsTitle).toBe('आवेदनहरू')
      expect(applicants).toBe('आवेदकहरू')
    })

    test('should load quick actions correctly in Nepali', () => {
      const quickActionsTitle = i18nService.tPage('dashboard', 'quickActions.title')
      const createJobTitle = i18nService.tPage('dashboard', 'quickActions.createJob.title')
      const applicationsTitle = i18nService.tPage('dashboard', 'quickActions.applications.title')
      
      expect(quickActionsTitle).toBe('द्रुत कार्यहरू')
      expect(createJobTitle).toBe('जागिर सिर्जना गर्नुहोस्')
      expect(applicationsTitle).toBe('आवेदनहरू')
    })

    test('should load loading and error messages correctly in Nepali', () => {
      const loadingDashboard = i18nService.tPage('dashboard', 'loading.dashboard')
      const failedToLoad = i18nService.tPage('dashboard', 'error.failedToLoad')
      const retry = i18nService.tPage('dashboard', 'error.retry')
      
      expect(loadingDashboard).toBe('ड्यासबोर्ड एनालिटिक्स लोड गर्दै...')
      expect(failedToLoad).toBe('ड्यासबोर्ड लोड गर्न असफल')
      expect(retry).toBe('पुनः प्रयास गर्नुहोस्')
    })
  })

  describe('Complex Parameter Interpolation', () => {
    test('should handle multiple parameters in English', () => {
      i18nService.setLocale('en')
      
      const customRange = i18nService.tPage('dashboard', 'status.customRange', { 
        startDate: '2024-01-01', 
        endDate: '2024-01-31' 
      })
      const newApplicants = i18nService.tPage('dashboard', 'header.newApplicants', { count: 5 })
      
      expect(customRange).toBe('Custom Range: 2024-01-01 - 2024-01-31')
      expect(newApplicants).toBe('5 new applicants today')
    })

    test('should handle multiple parameters in Nepali', () => {
      i18nService.setLocale('ne')
      
      const customRange = i18nService.tPage('dashboard', 'status.customRange', { 
        startDate: '२०२४-०१-०१', 
        endDate: '२०२४-०१-३१' 
      })
      const newApplicants = i18nService.tPage('dashboard', 'header.newApplicants', { count: 5 })
      
      expect(customRange).toBe('कस्टम दायरा: २०२४-०१-०१ - २०२४-०१-३१')
      expect(newApplicants).toBe('आज 5 नयाँ आवेदकहरू')
    })
  })

  describe('Bulk Translation for Dashboard', () => {
    test('should handle bulk translation for dashboard metrics', () => {
      i18nService.setLocale('en')
      
      const keys = [
        'metrics.jobs.title',
        'metrics.applications.title',
        'metrics.interviews.title',
        'quickActions.title'
      ]
      
      const result = {}
      keys.forEach(key => {
        result[key] = i18nService.tPage('dashboard', key)
      })
      
      expect(result['metrics.jobs.title']).toBe('Jobs')
      expect(result['metrics.applications.title']).toBe('Applications')
      expect(result['metrics.interviews.title']).toBe('Interviews')
      expect(result['quickActions.title']).toBe('Quick Actions')
    })

    test('should handle bulk translation with parameters', () => {
      i18nService.setLocale('en')
      
      const keys = [
        'header.welcomeBack',
        'status.access',
        'status.updated'
      ]
      
      const params = {
        name: 'Admin User',
        role: 'Administrator',
        time: '2:30 PM'
      }
      
      const result = {}
      keys.forEach(key => {
        result[key] = i18nService.tPage('dashboard', key, params)
      })
      
      expect(result['header.welcomeBack']).toBe('Welcome back, Admin User')
      expect(result['status.access']).toBe('Administrator Access')
      expect(result['status.updated']).toBe('Updated: 2:30 PM')
    })
  })

  describe('Translation Validation', () => {
    test('should validate dashboard translation structure', () => {
      const isValidEn = i18nService.validateTranslations(mockDashboardTranslationsEn, 'dashboard-en')
      const isValidNe = i18nService.validateTranslations(mockDashboardTranslationsNe, 'dashboard-ne')
      
      expect(isValidEn).toBe(true)
      expect(isValidNe).toBe(true)
    })

    test('should handle missing nested keys gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const result = i18nService.tPage('dashboard', 'metrics.nonexistent.key')
      expect(result).toBe('metrics.nonexistent.key')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Language Switching Performance', () => {
    test('should maintain performance when switching languages frequently', () => {
      const testKey = 'metrics.jobs.title'
      
      // Test multiple language switches
      for (let i = 0; i < 10; i++) {
        i18nService.setLocale('en')
        const englishValue = i18nService.tPage('dashboard', testKey)
        expect(englishValue).toBe('Jobs')
        
        i18nService.setLocale('ne')
        const nepaliValue = i18nService.tPage('dashboard', testKey)
        expect(nepaliValue).toBe('जागिरहरू')
      }
    })

    test('should cache dashboard translations effectively', () => {
      i18nService.setLocale('en')
      
      // First call should load and cache
      const start = performance.now()
      const firstCall = i18nService.tPage('dashboard', 'metrics.jobs.title')
      const firstCallTime = performance.now() - start
      
      // Second call should use cache (should be faster)
      const start2 = performance.now()
      const secondCall = i18nService.tPage('dashboard', 'metrics.jobs.title')
      const secondCallTime = performance.now() - start2
      
      expect(firstCall).toBe(secondCall)
      expect(firstCall).toBe('Jobs')
      // Second call should generally be faster due to caching
      expect(secondCallTime).toBeLessThanOrEqual(firstCallTime + 1) // Allow for small variance
    })
  })
})