import React, { useState, useEffect } from 'react'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  Upload,
  Save,
  X,
  Edit,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Settings,
  Briefcase
} from 'lucide-react'
import { agencyService } from '../services/index.js'
import { useAgency } from '../contexts/AgencyContext'
import { useLanguage } from '../hooks/useLanguage'
import LanguageSwitch from './LanguageSwitch'


const AgencySettings = () => {
  const { agencyData, updateAgencyData, updateAgencyLogo, updateAgencyName, isLoading: contextLoading } = useAgency()
  const { tPageSync } = useLanguage({ 
    pageName: 'agency-settings', 
    autoLoad: true 
  })

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  const [activeTab, setActiveTab] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingSection, setEditingSection] = useState(null)
  const [formData, setFormData] = useState({})
  const [currentUser] = useState({
    id: 'user_001',
    name: 'Current User',
    email: 'user@agency.com'
  }) // In real app, get from auth context

  // Use context loading state for initial load
  const isInitialLoading = contextLoading || isLoading

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Start editing a section
  const startEditing = (section, initialData = {}) => {
    setEditingSection(section)
    setFormData(initialData)
    setError(null)
    setSuccess(null)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingSection(null)
    setFormData({})
  }

  // Save changes
  const saveChanges = async (section) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null) // Clear any previous success messages

      // Validate form data before saving
      if (!formData || Object.keys(formData).length === 0) {
        throw new Error('No changes to save')
      }

      const auditInfo = { user: currentUser }
      
      let updatedData
      switch (section) {
        case 'basic':
          // Validate required fields for basic info
          if (!formData.name?.trim()) {
            throw new Error('Agency name is required')
          }
          if (!formData.license_number?.trim()) {
            throw new Error('License number is required')
          }
          updatedData = await agencyService.updateBasicInfo(formData, auditInfo)
          break
        case 'contact':
          // Validate required contact fields
          if (!formData.phone?.trim()) {
            throw new Error('Phone number is required')
          }
          if (!formData.mobile?.trim()) {
            throw new Error('Mobile number is required')
          }
          if (!formData.email?.trim()) {
            throw new Error('Email is required')
          }
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(formData.email.trim())) {
            throw new Error('Please enter a valid email address')
          }
          updatedData = await agencyService.updateContactInfo(formData, auditInfo)
          break
        case 'social':
          updatedData = await agencyService.updateSocialMedia(formData, auditInfo)
          break
        case 'settings':
          updatedData = await agencyService.updateSettings(formData, auditInfo)
          break
        case 'hours':
          updatedData = await agencyService.updateOperatingHours(formData, auditInfo)
          break
        case 'services':
          // Handle multiple services updates in one transaction
          if (formData.services && formData.services.length > 0) {
            await agencyService.updateServices(formData.services, auditInfo)
          }
          if (formData.specializations && formData.specializations.length > 0) {
            await agencyService.updateSpecializations(formData.specializations, auditInfo)
          }
          if (formData.countries && formData.countries.length > 0) {
            await agencyService.updateTargetCountries(formData.countries, auditInfo)
          }
          // Get the complete updated profile
          updatedData = await agencyService.getAgencyProfile()
          break
        case 'location':
          if (!formData.address?.trim()) {
            throw new Error('Address is required')
          }
          updatedData = await agencyService.updateAgencyProfile({
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude
          }, auditInfo)
          break
        default:
          updatedData = await agencyService.updateAgencyProfile(formData, auditInfo)
      }

      // Ensure we have valid updated data
      if (!updatedData) {
        throw new Error('Failed to get updated data from server')
      }

      // Update the agency context with new data
      updateAgencyData(updatedData)
      
      // Update specific fields in navigation if they changed
      if (section === 'basic' && formData.name) {
        updateAgencyName(formData.name)
      }
      if (section === 'basic' && updatedData.logo_url) {
        updateAgencyLogo(updatedData.logo_url)
      }
      
      // Reset editing state
      setEditingSection(null)
      setFormData({})
      
      // Show success message with specific details
      const sectionName = {
        'basic': 'Basic Information',
        'contact': 'Contact Information', 
        'social': 'Social Media',
        'settings': 'Settings',
        'hours': 'Operating Hours',
        'services': 'Services & Specializations',
        'location': 'Location'
      }[section] || 'Information'
      
      setSuccess(`${sectionName} updated successfully!`)
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
      
    } catch (err) {
      console.error(`Error saving ${section}:`, err)
      
      // Provide specific error messages
      const errorMessage = err.message || `Failed to save ${section} changes`
      setError(errorMessage)
      
      // Clear error message after 10 seconds
      setTimeout(() => setError(null), 10000)
    } finally {
      setSaving(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file, type) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null) // Clear any previous success messages
      
      // Validate file exists
      if (!file) {
        throw new Error('No file selected')
      }

      // Validate file type once more at the main level
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please select JPEG, PNG, or GIF')
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      const auditInfo = { user: currentUser }
      
      let updatedData
      if (type === 'logo') {
        console.log('Uploading logo:', file.name)
        updatedData = await agencyService.uploadLogo(file, auditInfo)
        console.log('Logo upload successful:', updatedData.logo_url)
        
        // Update logo in both agency data and navigation immediately
        updateAgencyData(updatedData)
        updateAgencyLogo(updatedData.logo_url)
        
        // Verify the logo was updated
        if (!updatedData.logo_url) {
          throw new Error('Logo upload completed but no URL returned')
        }
      } else if (type === 'banner') {
        console.log('Uploading banner:', file.name)
        updatedData = await agencyService.uploadBanner(file, auditInfo)
        console.log('Banner upload successful:', updatedData.banner_url)
        
        // Update agency data
        updateAgencyData(updatedData)
        
        // Verify the banner was updated
        if (!updatedData.banner_url) {
          throw new Error('Banner upload completed but no URL returned')
        }
      } else {
        throw new Error('Invalid upload type')
      }
      
      setSuccess(`${type === 'logo' ? 'Logo' : 'Banner'} updated successfully!`)
      setTimeout(() => setSuccess(null), 5000)
      
      return updatedData
    } catch (err) {
      console.error(`Failed to upload ${type}:`, err)
      const errorMessage = err.message || `Failed to upload ${type}`
      setError(errorMessage)
      setTimeout(() => setError(null), 10000)
      throw err
    } finally {
      setSaving(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i}>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="card p-6">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: tPage('tabs.basicInfo'), icon: Building2 },
    { id: 'contact', label: tPage('tabs.contact'), icon: Phone },
    { id: 'location', label: tPage('tabs.location'), icon: MapPin },
    { id: 'media', label: tPage('tabs.images'), icon: Camera },
    { id: 'social', label: tPage('tabs.socialMedia'), icon: Globe },
    { id: 'services', label: tPage('tabs.services'), icon: Briefcase },
    { id: 'settings', label: tPage('tabs.settings'), icon: Settings }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tPage('title')}</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {tPage('subtitle')}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <LanguageSwitch />
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'basic' && (
            <BasicInfoSection
              data={agencyData}
              isEditing={editingSection === 'basic'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('basic', {
                name: agencyData.name,
                description: agencyData.description,
                established_year: agencyData.established_year,
                license_number: agencyData.license_number
              })}
              onSave={() => saveChanges('basic')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'contact' && (
            <ContactSection
              data={agencyData}
              isEditing={editingSection === 'contact'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('contact', {
                phone: agencyData.phone,
                mobile: agencyData.mobile,
                email: agencyData.email,
                website: agencyData.website
              })}
              onSave={() => saveChanges('contact')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'location' && (
            <LocationSection
              data={agencyData}
              isEditing={editingSection === 'location'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('location', {
                address: agencyData.address
              })}
              onSave={() => saveChanges('location')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'media' && (
            <MediaSection
              data={agencyData}
              onFileUpload={handleFileUpload}
              isSaving={isSaving}
              onLogoUpdate={updateAgencyLogo}
              tPage={tPage}
            />
          )}

          {activeTab === 'social' && (
            <SocialMediaSection
              data={agencyData}
              isEditing={editingSection === 'social'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('social', agencyData.social_media || {})}
              onSave={() => saveChanges('social')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'services' && (
            <ServicesSection
              data={agencyData}
              isEditing={editingSection === 'services'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('services', {
                services: agencyData.services || [],
                specializations: agencyData.specializations || [],
                countries: agencyData.target_countries || []
              })}
              onSave={() => saveChanges('services')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsSection
              data={agencyData}
              isEditing={editingSection === 'settings'}
              formData={formData}
              onFormChange={handleFormChange}
              onStartEdit={() => startEditing('settings', agencyData.settings || {})}
              onSave={() => saveChanges('settings')}
              onCancel={cancelEditing}
              isSaving={isSaving}
            />
          )}


        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <AgencyPreview data={agencyData} />
        </div>
      </div>
    </div>
  )
}

// Basic Information Section
const BasicInfoSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Basic Information</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? tPage('actions.saving') : tPage('actions.save')}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agency Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => {
                onFormChange('name', e.target.value)
                // Show preview of name change in the UI
                if (e.target.value.trim()) {
                  // Could add real-time preview here if needed
                }
              }}
              className="form-input"
              placeholder={tPage('placeholders.enterAgencyName')}
            />
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              💡 This will update the agency name in the navigation menu
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onFormChange('description', e.target.value)}
              rows={4}
              className="form-textarea"
              placeholder={tPage('placeholders.agencyDescription')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Established Year</label>
              <input
                type="number"
                value={formData.established_year || ''}
                onChange={(e) => onFormChange('established_year', parseInt(e.target.value))}
                className="form-input"
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Number *</label>
              <input
                type="text"
                value={formData.license_number || ''}
                onChange={(e) => onFormChange('license_number', e.target.value)}
                className="form-input"
                placeholder="REG-2024-001"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agency Name</label>
          <p className="text-sm text-gray-900 dark:text-gray-100">{data.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <p className="text-sm text-gray-900 dark:text-gray-100">{data.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Established</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{data.established_year}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Number</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{data.license_number}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Contact Information Section
const ContactSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Contact Information</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? tPage('actions.saving') : tPage('actions.save')}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => onFormChange('phone', e.target.value)}
                className="form-input"
                placeholder="+977-1-4567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile *</label>
              <input
                type="tel"
                value={formData.mobile || ''}
                onChange={(e) => onFormChange('mobile', e.target.value)}
                className="form-input"
                placeholder="+977-9841234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => onFormChange('email', e.target.value)}
              className="form-input"
              placeholder="info@agency.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
            <input
              type="url"
              value={formData.website || ''}
              onChange={(e) => onFormChange('website', e.target.value)}
              className="form-input"
              placeholder="www.agency.com"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Information</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
              <p className="text-sm text-gray-900 dark:text-gray-100">{data.phone}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
              <p className="text-sm text-gray-900 dark:text-gray-100">{data.mobile}</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <div className="flex items-center">
            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
            <p className="text-sm text-gray-900 dark:text-gray-100">{data.email}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
          <div className="flex items-center">
            <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
            <a href={`https://${data.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
              {data.website}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Location Section
const LocationSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)

  const handleChooseOnMap = () => {
    setShowMapModal(true)
  }

  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData)
    onFormChange('address', locationData.address)
    onFormChange('latitude', locationData.lat)
    onFormChange('longitude', locationData.lng)
    setShowMapModal(false)
  }

  const handleMapModalClose = () => {
    setShowMapModal(false)
  }

  if (isEditing) {
    return (
      <>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Location</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="btn-primary text-sm flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address *</label>
              <div className="space-y-2">
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => onFormChange('address', e.target.value)}
                  rows={3}
                  className="form-textarea"
                  placeholder={tPage('placeholders.completeAddress')}
                />
                <button
                  type="button"
                  onClick={handleChooseOnMap}
                  className="btn-secondary text-sm flex items-center"
                  disabled={isSaving}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Choose on Map
                </button>
              </div>
              {selectedLocation && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    📍 Location selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Tip:</strong> Use "Choose on Map" for precise location selection, or manually enter the address with landmarks and detailed directions.
              </p>
            </div>
          </div>
        </div>

        {/* Map Modal */}
        {showMapModal && (
          <MapSelectionModal
            isOpen={showMapModal}
            onClose={handleMapModalClose}
            onLocationSelect={handleLocationSelect}
            initialAddress={formData.address || data.address}
          />
        )}
      </>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Location</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
          <div className="flex items-start">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 mt-0.5" />
            <p className="text-sm text-gray-900 dark:text-gray-100">{data.address}</p>
          </div>
          {data.latitude && data.longitude && (
            <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="w-3 h-3 mr-1" />
              <span>Coordinates: {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This address will be displayed on your public profile and used for candidate visits.
          </p>
        </div>
      </div>
    </div>
  )
}

// Media/Images Section
const MediaSection = ({ data, onFileUpload, isSaving, onLogoUpdate, tPage }) => {
  const logoInputRef = React.useRef(null)
  const bannerInputRef = React.useRef(null)
  const [isLogoUploading, setIsLogoUploading] = React.useState(false)
  const [isBannerUploading, setIsBannerUploading] = React.useState(false)
  const [currentLogoPreview, setCurrentLogoPreview] = React.useState(null)

  // Reset preview when data changes externally
  React.useEffect(() => {
    if (data.logo_url !== currentLogoPreview && !isLogoUploading) {
      setCurrentLogoPreview(null)
    }
  }, [data.logo_url, currentLogoPreview, isLogoUploading])

  const handleLogoFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or GIF)')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      setIsLogoUploading(true)
      
      try {
        // Create a data URL for immediate preview
        const reader = new FileReader()
        const previewUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(file)
        })

        // Update logo immediately for preview
        if (onLogoUpdate) {
          onLogoUpdate(previewUrl)
        }
        setCurrentLogoPreview(previewUrl)

        // Upload the file and get the response
        const result = await onFileUpload(file, 'logo')
        
        // If the service returns a valid URL, use it; otherwise keep the preview
        if (result && result.logo_url && result.logo_url !== previewUrl) {
          // Check if the returned URL is accessible
          const img = new Image()
          img.onload = () => {
            // URL is valid, update with server URL
            if (onLogoUpdate) {
              onLogoUpdate(result.logo_url)
            }
            setCurrentLogoPreview(result.logo_url)
          }
          img.onerror = () => {
            // Server URL failed, keep using preview URL
            console.warn('Server logo URL not accessible, keeping preview')
          }
          img.src = result.logo_url
        }
      } catch (error) {
        console.error('Logo upload failed:', error)
        // Reset to original logo on error
        if (data.logo_url && onLogoUpdate) {
          onLogoUpdate(data.logo_url)
        }
      } finally {
        setIsLogoUploading(false)
      }
    }
    // Clear the input to allow uploading the same file again
    event.target.value = ''
  }

  const handleBannerFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, or GIF)')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      setIsBannerUploading(true)
      
      try {
        // Upload the file
        await onFileUpload(file, 'banner')
      } catch (error) {
        console.error('Banner upload failed:', error)
      } finally {
        setIsBannerUploading(false)
      }
    }
    // Clear the input to allow uploading the same file again
    event.target.value = ''
  }

  const handleLogoUploadClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLogoUploading && !isSaving) {
      logoInputRef.current?.click()
    }
  }

  const handleBannerUploadClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isBannerUploading && !isSaving) {
      bannerInputRef.current?.click()
    }
  }

  const isLogoProcessing = isLogoUploading || isSaving
  const isBannerProcessing = isBannerUploading || isSaving
  
  // Determine which logo URL to display
  const displayLogoUrl = currentLogoPreview || data.logo_url

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">{tPage('sections.agencyLogo')}</h2>
        
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative">
              {isLogoProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
              {displayLogoUrl ? (
                <img
                  src={displayLogoUrl}
                  alt="Agency Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload your agency logo. This will be displayed on your profile and job postings.
            </p>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleLogoUploadClick}
                disabled={isLogoProcessing}
                className="btn-secondary text-sm flex items-center"
              >
                <Upload className="w-4 h-4 mr-1" />
                {isLogoProcessing ? 'Uploading...' : 'Upload Logo'}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                className="hidden"
                disabled={isLogoProcessing}
                id="logo-upload-input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Max 5MB, JPEG/PNG/GIF
              </p>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              💡 Changes will appear instantly in the navigation menu
            </p>
            {isLogoProcessing && (
              <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 dark:border-blue-400 mr-2"></div>
                Processing logo upload...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Agency Banner</h2>
        
        <div className="space-y-4">
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative">
            {isBannerProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            {data.banner_url ? (
              <img
                src={data.banner_url}
                alt="Agency Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload a banner image for your agency profile. Recommended size: 1200x300 pixels.
            </p>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleBannerUploadClick}
                disabled={isBannerProcessing}
                className="btn-secondary text-sm flex items-center"
              >
                <Upload className="w-4 h-4 mr-1" />
                {isBannerProcessing ? 'Uploading...' : 'Upload Banner'}
              </button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerFileChange}
                className="hidden"
                disabled={isBannerProcessing}
                id="banner-upload-input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Max 5MB, JPEG/PNG/GIF
              </p>
            </div>
            {isBannerProcessing && (
              <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 dark:border-blue-400 mr-2"></div>
                Processing banner upload...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Social Media Section
const SocialMediaSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourpage' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
    { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/yourhandle' }
  ]

  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Social Media</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? tPage('actions.saving') : tPage('actions.save')}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {socialPlatforms.map(platform => (
            <div key={platform.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {platform.label}
              </label>
              <input
                type="url"
                value={formData[platform.key] || ''}
                onChange={(e) => onFormChange(platform.key, e.target.value)}
                className="form-input"
                placeholder={platform.placeholder}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Social Media</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        {socialPlatforms.map(platform => (
          <div key={platform.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {platform.label}
            </label>
            {data.social_media?.[platform.key] ? (
              <a
                href={data.social_media[platform.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 break-all"
              >
                {data.social_media[platform.key]}
              </a>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Not set</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Services Section
const ServicesSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  const addItem = (field, item) => {
    const currentItems = formData[field] || []
    if (item.trim() && !currentItems.includes(item.trim())) {
      onFormChange(field, [...currentItems, item.trim()])
    }
  }

  const removeItem = (field, index) => {
    const currentItems = formData[field] || []
    onFormChange(field, currentItems.filter((_, i) => i !== index))
  }

  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Services & Specializations</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? tPage('actions.saving') : tPage('actions.save')}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services Offered</label>
            <div className="space-y-2">
              {(formData.services || []).map((service, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                  <span className="text-sm text-gray-900 dark:text-gray-100">{service}</span>
                  <button
                    onClick={() => removeItem('services', index)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add new service"
                  className="form-input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('services', e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling
                    addItem('services', input.value)
                    input.value = ''
                  }}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specializations</label>
            <div className="space-y-2">
              {(formData.specializations || []).map((spec, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                  <span className="text-sm text-gray-900 dark:text-gray-100">{spec}</span>
                  <button
                    onClick={() => removeItem('specializations', index)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add specialization"
                  className="form-input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addItem('specializations', e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling
                    addItem('specializations', input.value)
                    input.value = ''
                  }}
                  className="btn-secondary text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Target Countries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Countries</label>
            <div className="space-y-2">
              {(formData.countries || []).map((country, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                  <span className="text-sm text-gray-900 dark:text-gray-100">{country}</span>
                  <button
                    onClick={() => removeItem('countries', index)}
                    className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <select
                  className="form-select flex-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      addItem('countries', e.target.value)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">Select country to add</option>
                  <option value="UAE">UAE</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="Oman">Oman</option>
                  <option value="Bahrain">Bahrain</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Singapore">Singapore</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Services & Specializations</h2>
          <button
            onClick={onStartEdit}
            className="btn-secondary text-sm flex items-center"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {data.services?.map((service, index) => (
                <span key={index} className="chip chip-blue">
                  {service}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {data.specializations?.map((spec, index) => (
                <span key={index} className="chip chip-green">
                  {spec}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Countries</h3>
            <div className="flex flex-wrap gap-2">
              {data.target_countries?.map((country, index) => (
                <span key={index} className="chip chip-yellow">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Section
const SettingsSection = ({ data, isEditing, formData, onFormChange, onStartEdit, onSave, onCancel, isSaving }) => {
  if (isEditing) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Settings</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="btn-primary text-sm flex items-center"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? tPage('actions.saving') : tPage('actions.save')}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
              <select
                value={formData.currency || ''}
                onChange={(e) => onFormChange('currency', e.target.value)}
                className="form-select"
              >
                <option value="NPR">NPR - Nepali Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="QAR">QAR - Qatari Riyal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
              <select
                value={formData.timezone || ''}
                onChange={(e) => onFormChange('timezone', e.target.value)}
                className="form-select"
              >
                <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                <option value="Asia/Dubai">Asia/Dubai</option>
                <option value="Asia/Riyadh">Asia/Riyadh</option>
                <option value="Asia/Qatar">Asia/Qatar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Format</label>
            <select
              value={formData.date_format || ''}
              onChange={(e) => onFormChange('date_format', e.target.value)}
              className="form-select"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Notifications</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifications?.email_enabled || false}
                  onChange={(e) => onFormChange('notifications', {
                    ...formData.notifications,
                    email_enabled: e.target.checked
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifications?.sms_enabled || false}
                  onChange={(e) => onFormChange('notifications', {
                    ...formData.notifications,
                    sms_enabled: e.target.checked
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">SMS notifications</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifications?.push_enabled || false}
                  onChange={(e) => onFormChange('notifications', {
                    ...formData.notifications,
                    push_enabled: e.target.checked
                  })}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Push notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
        <button
          onClick={onStartEdit}
          className="btn-secondary text-sm flex items-center"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{data.settings?.currency || 'NPR'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timezone</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{data.settings?.timezone || 'Asia/Kathmandu'}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Format</label>
          <p className="text-sm text-gray-900 dark:text-gray-100">{data.settings?.date_format || 'DD/MM/YYYY'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notifications</label>
          <div className="space-y-1">
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${data.settings?.notifications?.email_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${data.settings?.notifications?.sms_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">SMS notifications</span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${data.settings?.notifications?.push_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">Push notifications</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Agency Preview Sidebar
const AgencyPreview = ({ data }) => {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Agency Preview</h3>
      
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden">
          {data.logo_url ? (
            <img
              src={data.logo_url}
              alt="Agency Logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          )}
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{data.name}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{data.address}</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center">
          <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
          <span className="text-gray-900 dark:text-gray-100">{data.phone}</span>
        </div>
        <div className="flex items-center">
          <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
          <span className="text-gray-900 dark:text-gray-100">{data.email}</span>
        </div>
        <div className="flex items-center">
          <Globe className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
          <span className="text-gray-900 dark:text-gray-100">{data.website}</span>
        </div>
      </div>
    </div>
  )
}

// Map Selection Modal Component
const MapSelectionModal = ({ isOpen, onClose, onLocationSelect, initialAddress }) => {
  const [mapUrl, setMapUrl] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Create Google Maps URL for location selection
      const searchQuery = initialAddress ? encodeURIComponent(initialAddress) : ''
      const mapsUrl = `https://www.google.com/maps/search/${searchQuery}/@27.7172,85.3240,15z`
      setMapUrl(mapsUrl)
    }
  }, [isOpen, initialAddress])

  const handleMapClick = () => {
    // Open Google Maps in a new window
    const mapWindow = window.open(mapUrl, 'mapWindow', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    // Listen for messages from the map window (if we implement a custom solution later)
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'LOCATION_SELECTED') {
        setSelectedLocation(event.data.location)
        mapWindow.close()
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // Fallback: Allow manual input after opening map
    setTimeout(() => {
      if (mapWindow && !mapWindow.closed) {
        // Show manual input form
        setIsLoading(false)
      }
    }, 2000)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const location = {
      lat: parseFloat(formData.get('latitude')),
      lng: parseFloat(formData.get('longitude')),
      address: formData.get('address')
    }
    
    if (location.lat && location.lng && location.address) {
      onLocationSelect(location)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Location</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Google Maps Option */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Option 1: Use Google Maps</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Click below to open Google Maps. Find your location, right-click on the exact spot, 
              and copy the coordinates that appear.
            </p>
            <button
              onClick={handleMapClick}
              className="btn-primary w-full flex items-center justify-center"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Open Google Maps
            </button>
          </div>

          {/* Manual Input Option */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Option 2: Enter Manually</h4>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea
                  name="address"
                  rows={2}
                  className="form-textarea text-sm"
                  placeholder="Enter complete address"
                  defaultValue={initialAddress}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    step="any"
                    className="form-input text-sm"
                    placeholder="27.7172"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    step="any"
                    className="form-input text-sm"
                    placeholder="85.3240"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-secondary w-full text-sm">
                Use This Location
              </button>
            </form>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">How to get coordinates from Google Maps:</h5>
            <ol className="text-xs text-blue-800 dark:text-blue-300 list-decimal list-inside space-y-1">
              <li>Click "Open Google Maps" above</li>
              <li>Search for your location or navigate to it</li>
              <li>Right-click on the exact spot</li>
              <li>Copy the coordinates that appear at the top</li>
              <li>Come back and paste them in the manual form</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgencySettings
