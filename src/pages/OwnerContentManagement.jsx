import { useState, useEffect } from 'react'
import { Save, RefreshCw, Globe, Languages, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import LoadingScreen from '../components/LoadingScreen'

const OwnerContentManagement = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [translations, setTranslations] = useState({ en: {}, ne: {} })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    loadTranslations()
  }, [])

  const loadTranslations = async () => {
    setLoading(true)
    try {
      const [enResponse, neResponse] = await Promise.all([
        fetch('/translations/en/pages/landing.json'),
        fetch('/translations/ne/pages/landing.json')
      ])
      
      const enData = await enResponse.json()
      const neData = await neResponse.json()
      
      setTranslations({ en: enData, ne: neData })
    } catch (error) {
      console.error('Failed to load translations:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updateTranslation = (path, value) => {
    setHasChanges(true)
    const keys = path.split('.')
    setTranslations(prev => {
      const newTranslations = { ...prev }
      let current = newTranslations[selectedLanguage]
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newTranslations
    })
  }

  const handleSaveClick = () => {
    setShowConfirmModal(true)
  }

  const logAuditActivity = (action, details) => {
    // In a real implementation, this would send to the backend API
    const auditLog = {
      id: Date.now(),
      timestamp: new Date(),
      action: action,
      performedBy: "Owner Admin", // This should come from auth context
      performedByEmail: "owner@udaansarathi.com", // This should come from auth context
      details: details,
    }
    
    // Store in localStorage for now (in production, send to backend)
    const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]')
    existingLogs.unshift(auditLog)
    localStorage.setItem('audit_logs', JSON.stringify(existingLogs))
    
    console.log('[Audit Log] Content Management Activity:', auditLog)
  }

  const handleConfirmSave = async () => {
    setShowConfirmModal(false)
    setSaving(true)
    setSuccessMessage('')
    
    try {
      // In a real implementation, this would save to the backend
      // For now, we'll simulate saving to localStorage
      localStorage.setItem('translations_en', JSON.stringify(translations.en))
      localStorage.setItem('translations_ne', JSON.stringify(translations.ne))
      
      // Log the audit activity
      logAuditActivity('update_content', {
        contentType: 'landing_page_translations',
        languages: ['en', 'ne'],
        sectionsModified: Object.keys(expandedSections).filter(key => expandedSections[key]),
        timestamp: new Date().toISOString(),
      })
      
      setHasChanges(false)
      setSuccessMessage('Content updated successfully! Changes are now live on the landing page.')
      
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (error) {
      console.error('Failed to save translations:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSave = () => {
    setShowConfirmModal(false)
  }

  const renderInput = (label, path, value) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateTranslation(path, e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
      </div>
    )
  }

  const renderTextarea = (label, path, value) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <textarea
          value={value || ''}
          onChange={(e) => updateTranslation(path, e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
    )
  }

  const renderSection = (title, sectionKey, content) => {
    const isExpanded = expandedSections[sectionKey]
    
    return (
      <Card key={sectionKey} className="mb-4">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            {content}
          </CardContent>
        )}
      </Card>
    )
  }

  if (loading) {
    return <LoadingScreen />
  }

  const currentTranslations = translations[selectedLanguage]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Content Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage landing page content for both English and Nepali languages
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300">{successMessage}</span>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Language:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedLanguage('en')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedLanguage === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLanguage('ne')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedLanguage === 'ne'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              नेपाली (Nepali)
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadTranslations}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">

        {/* Navigation Section */}
        {renderSection('Navigation', 'nav', (
          <>
            {renderInput('How It Works', 'nav.howItWorks', currentTranslations.nav?.howItWorks)}
            {renderInput('Features', 'nav.features', currentTranslations.nav?.features)}
            {renderInput('For Agencies', 'nav.forAgencies', currentTranslations.nav?.forAgencies)}
            {renderInput('Login', 'nav.login', currentTranslations.nav?.login)}
          </>
        ))}

        {/* Hero Section */}
        {renderSection('Hero Section', 'hero', (
          <>
            {renderInput('Title', 'hero.title', currentTranslations.hero?.title)}
            {renderTextarea('Subtitle', 'hero.subtitle', currentTranslations.hero?.subtitle)}
            {renderInput('Metric Label', 'hero.metricLabel', currentTranslations.hero?.metricLabel)}
            {renderInput('Lives Transformed', 'hero.livesTransformed', currentTranslations.hero?.livesTransformed)}
            {renderInput('Primary CTA', 'hero.ctaPrimary', currentTranslations.hero?.ctaPrimary)}
            {renderInput('Secondary CTA', 'hero.ctaSecondary', currentTranslations.hero?.ctaSecondary)}
          </>
        ))}

        {/* Stats Section */}
        {renderSection('Statistics Section', 'stats', (
          <>
            {renderInput('Title', 'stats.title', currentTranslations.stats?.title)}
            {renderTextarea('Subtitle', 'stats.subtitle', currentTranslations.stats?.subtitle)}
            {renderInput('Placements', 'stats.placements', currentTranslations.stats?.placements)}
            {renderInput('Agencies', 'stats.agencies', currentTranslations.stats?.agencies)}
            {renderInput('Jobs', 'stats.jobs', currentTranslations.stats?.jobs)}
            {renderInput('Cities', 'stats.cities', currentTranslations.stats?.cities)}
          </>
        ))}

        {/* Search Section */}
        {renderSection('Search Section', 'search', (
          <>
            {renderInput('Title', 'search.title', currentTranslations.search?.title)}
            {renderTextarea('Subtitle', 'search.subtitle', currentTranslations.search?.subtitle)}
            {renderInput('Placeholder', 'search.placeholder', currentTranslations.search?.placeholder)}
            {renderInput('Active Jobs', 'search.activeJobs', currentTranslations.search?.activeJobs)}
            {renderInput('View Details', 'search.viewDetails', currentTranslations.search?.viewDetails)}
            {renderInput('No Results', 'search.noResults', currentTranslations.search?.noResults)}
            {renderInput('Try Again', 'search.tryAgain', currentTranslations.search?.tryAgain)}
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Modal</h4>
              {renderInput('Modal Title', 'search.modal.title', currentTranslations.search?.modal?.title)}
              {renderTextarea('Modal Subtitle', 'search.modal.subtitle', currentTranslations.search?.modal?.subtitle)}
              {renderInput('Download On', 'search.modal.downloadOn', currentTranslations.search?.modal?.downloadOn)}
              {renderInput('Get It On', 'search.modal.getItOn', currentTranslations.search?.modal?.getItOn)}
              {renderInput('App Store', 'search.modal.appStore', currentTranslations.search?.modal?.appStore)}
              {renderInput('Play Store', 'search.modal.playStore', currentTranslations.search?.modal?.playStore)}
              {renderInput('Maybe Later', 'search.modal.maybeLater', currentTranslations.search?.modal?.maybeLater)}
            </div>
          </>
        ))}

        {/* How It Works Section */}
        {renderSection('How It Works', 'howItWorks', (
          <>
            {renderInput('Title', 'howItWorks.title', currentTranslations.howItWorks?.title)}
            {renderTextarea('Subtitle', 'howItWorks.subtitle', currentTranslations.howItWorks?.subtitle)}
            {renderInput('Job Seekers Tab', 'howItWorks.jobSeekers', currentTranslations.howItWorks?.jobSeekers)}
            {renderInput('Agencies Tab', 'howItWorks.agencies', currentTranslations.howItWorks?.agencies)}
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Steps</h4>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Search & Discover</h5>
                {renderInput('Title', 'howItWorks.steps.search.title', currentTranslations.howItWorks?.steps?.search?.title)}
                {renderTextarea('Description', 'howItWorks.steps.search.description', currentTranslations.howItWorks?.steps?.search?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Apply to Opportunities</h5>
                {renderInput('Title', 'howItWorks.steps.apply.title', currentTranslations.howItWorks?.steps?.apply?.title)}
                {renderTextarea('Description', 'howItWorks.steps.apply.description', currentTranslations.howItWorks?.steps?.apply?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Get Matched</h5>
                {renderInput('Title', 'howItWorks.steps.matched.title', currentTranslations.howItWorks?.steps?.matched?.title)}
                {renderTextarea('Description', 'howItWorks.steps.matched.description', currentTranslations.howItWorks?.steps?.matched?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Register Your Agency</h5>
                {renderInput('Title', 'howItWorks.steps.register.title', currentTranslations.howItWorks?.steps?.register?.title)}
                {renderTextarea('Description', 'howItWorks.steps.register.description', currentTranslations.howItWorks?.steps?.register?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Post Job Openings</h5>
                {renderInput('Title', 'howItWorks.steps.post.title', currentTranslations.howItWorks?.steps?.post?.title)}
                {renderTextarea('Description', 'howItWorks.steps.post.description', currentTranslations.howItWorks?.steps?.post?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Manage Candidates</h5>
                {renderInput('Title', 'howItWorks.steps.manage.title', currentTranslations.howItWorks?.steps?.manage?.title)}
                {renderTextarea('Description', 'howItWorks.steps.manage.description', currentTranslations.howItWorks?.steps?.manage?.description)}
              </div>
            </div>
          </>
        ))}

        {/* Features Section */}
        {renderSection('Features', 'features', (
          <>
            {renderInput('Title', 'features.title', currentTranslations.features?.title)}
            {renderTextarea('Subtitle', 'features.subtitle', currentTranslations.features?.subtitle)}
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Feature Items</h4>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Interview Scheduling</h5>
                {renderInput('Title', 'features.items.scheduling.title', currentTranslations.features?.items?.scheduling?.title)}
                {renderTextarea('Description', 'features.items.scheduling.description', currentTranslations.features?.items?.scheduling?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Candidate Management</h5>
                {renderInput('Title', 'features.items.management.title', currentTranslations.features?.items?.management?.title)}
                {renderTextarea('Description', 'features.items.management.description', currentTranslations.features?.items?.management?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Interview Feedback</h5>
                {renderInput('Title', 'features.items.feedback.title', currentTranslations.features?.items?.feedback?.title)}
                {renderTextarea('Description', 'features.items.feedback.description', currentTranslations.features?.items?.feedback?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Analytics</h5>
                {renderInput('Title', 'features.items.analytics.title', currentTranslations.features?.items?.analytics?.title)}
                {renderTextarea('Description', 'features.items.analytics.description', currentTranslations.features?.items?.analytics?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Mobile Interface</h5>
                {renderInput('Title', 'features.items.mobile.title', currentTranslations.features?.items?.mobile?.title)}
                {renderTextarea('Description', 'features.items.mobile.description', currentTranslations.features?.items?.mobile?.description)}
              </div>
              
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Security</h5>
                {renderInput('Title', 'features.items.secure.title', currentTranslations.features?.items?.secure?.title)}
                {renderTextarea('Description', 'features.items.secure.description', currentTranslations.features?.items?.secure?.description)}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Call to Action</h4>
              {renderInput('CTA Title', 'features.cta.title', currentTranslations.features?.cta?.title)}
              {renderTextarea('CTA Subtitle', 'features.cta.subtitle', currentTranslations.features?.cta?.subtitle)}
              {renderInput('Primary Button', 'features.cta.primary', currentTranslations.features?.cta?.primary)}
              {renderInput('Secondary Button', 'features.cta.secondary', currentTranslations.features?.cta?.secondary)}
            </div>
          </>
        ))}

        {/* Contact Information */}
        {renderSection('Contact Information', 'contact', (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>Note:</strong> These contact details will be displayed in the footer and throughout the website.
              </p>
            </div>
            {renderInput('Email Address', 'contact.email', currentTranslations.contact?.email)}
            {renderInput('Phone Number', 'contact.phone', currentTranslations.contact?.phone)}
            {renderInput('Physical Address', 'contact.address', currentTranslations.contact?.address)}
          </>
        ))}

        {/* Social Media Links */}
        {renderSection('Social Media Links', 'social', (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>Note:</strong> Enter the full URL for each social media profile (e.g., https://twitter.com/yourprofile)
              </p>
            </div>
            {renderInput('Twitter URL', 'social.twitter', currentTranslations.social?.twitter)}
            {renderInput('Facebook URL', 'social.facebook', currentTranslations.social?.facebook)}
            {renderInput('Instagram URL', 'social.instagram', currentTranslations.social?.instagram)}
          </>
        ))}

        {/* Footer Section */}
        {renderSection('Footer', 'footer', (
          <>
            {renderTextarea('Tagline', 'footer.tagline', currentTranslations.footer?.tagline)}
            {renderInput('Quick Links', 'footer.quickLinks', currentTranslations.footer?.quickLinks)}
            {renderInput('Legal', 'footer.legal', currentTranslations.footer?.legal)}
            {renderInput('Download App', 'footer.downloadApp', currentTranslations.footer?.downloadApp)}
            {renderTextarea('Download Subtitle', 'footer.downloadSubtitle', currentTranslations.footer?.downloadSubtitle)}
            {renderInput('App Store', 'footer.appStore', currentTranslations.footer?.appStore)}
            {renderInput('Play Store', 'footer.playStore', currentTranslations.footer?.playStore)}
            {renderInput('Download On', 'footer.downloadOn', currentTranslations.footer?.downloadOn)}
            {renderInput('Get It On', 'footer.getItOn', currentTranslations.footer?.getItOn)}
            {renderInput('Copyright', 'footer.copyright', currentTranslations.footer?.copyright)}
          </>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Confirm Content Update
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Are you sure you want to save these changes? The updated content will be immediately visible on the landing page for all users.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelSave}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Yes, Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OwnerContentManagement
