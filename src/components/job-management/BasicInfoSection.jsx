import React, { useState, useEffect } from 'react';
import { FileText, Save, Loader2, AlertCircle, Check, ChevronDown } from 'lucide-react';
import countryService from '../../services/countryService';

const BasicInfoSection = ({ data, onSave, isFromExtraction = false }) => {
  const [formData, setFormData] = useState({
    posting_title: '',
    country: '',
    city: '',
    lt_number: '',
    chalani_number: '',
    approval_date_ad: '',
    posting_date_ad: '',
    announcement_type: 'full_ad',
    notes: ''
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Countries from backend
  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

  const announcementTypes = [
    { value: 'full_ad', label: 'Full Advertisement' },
    { value: 'short_ad', label: 'Short Advertisement' },
    { value: 'update', label: 'Update' }
  ];

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const data = await countryService.getCountries();
        setCountries(data || []);
      } catch (err) {
        console.error('Failed to fetch countries:', err);
        setCountries([]);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // Initialize form data when data changes
  useEffect(() => {
    if (data) {
      setFormData({
        posting_title: data.posting_title || '',
        country: data.country || '',
        city: data.city || '',
        lt_number: data.lt_number || '',
        chalani_number: data.chalani_number || '',
        approval_date_ad: data.approval_date_ad ? data.approval_date_ad.split('T')[0] : '',
        posting_date_ad: data.posting_date_ad ? data.posting_date_ad.split('T')[0] : '',
        announcement_type: data.announcement_type || 'full_ad',
        notes: data.notes || ''
      });
    }
  }, [data]);

  // When extraction flag is set, mark form as dirty so save button is enabled
  useEffect(() => {
    if (isFromExtraction) {
      setIsDirty(true);
    }
  }, [isFromExtraction]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Send all fields (backend will handle PATCH semantics)
      const updates = {
        posting_title: formData.posting_title,
        country: formData.country,
        city: formData.city || null,
        lt_number: formData.lt_number || null,
        chalani_number: formData.chalani_number || null,
        approval_date_ad: formData.approval_date_ad || null,
        posting_date_ad: formData.posting_date_ad || null,
        announcement_type: formData.announcement_type,
        notes: formData.notes || null
      };

      await onSave(updates);
      setIsDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors ${
            isDirty
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          ) : success ? (
            <><Check className="w-4 h-4 mr-2" />Saved</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />Save</>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />{error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job Title *
          </label>
          <input
            type="text"
            value={formData.posting_title}
            onChange={(e) => handleChange('posting_title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Country *
          </label>
          <div className="relative">
            <select
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              disabled={countriesLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none pr-10"
            >
              <option value="">Select a country</option>
              {countries.map(country => (
                <option key={country.country_code} value={country.country_name}>
                  {country.country_name} ({country.currency_code})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            {countriesLoading && (
              <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          {formData.country && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Currency: {countries.find(c => c.country_name === formData.country)?.currency_code || 'N/A'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            City
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            LT Number
          </label>
          <input
            type="text"
            value={formData.lt_number}
            onChange={(e) => handleChange('lt_number', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chalani Number
          </label>
          <input
            type="text"
            value={formData.chalani_number}
            onChange={(e) => handleChange('chalani_number', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Approval Date
          </label>
          <input
            type="date"
            value={formData.approval_date_ad}
            onChange={(e) => handleChange('approval_date_ad', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Posting Date
          </label>
          <input
            type="date"
            value={formData.posting_date_ad}
            onChange={(e) => handleChange('posting_date_ad', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Announcement Type
          </label>
          <select
            value={formData.announcement_type}
            onChange={(e) => handleChange('announcement_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {announcementTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection;
