import { useState, useEffect } from 'react';
import { X, Briefcase, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import JobDataSource from '../api/datasources/JobDataSource.js';
import countryService from '../services/countryService';
import { useLanguage } from '../hooks/useLanguage';

/**
 * Create Template Modal
 * 
 * Minimal form for creating a template job posting:
 * - posting_title (required)
 * - country (required, dropdown)
 * - city (optional)
 */
const CreateTemplateModal = ({ license, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    posting_title: '',
    country: '',
    city: ''
  });
  
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { tPageSync } = useLanguage({ pageName: 'dialogs', autoLoad: true });

  // Load countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoadingCountries(true);
    try {
      const countryNames = await countryService.getCountryNames();
      setCountries(countryNames);
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoadingCountries(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.posting_title || formData.posting_title.trim() === '') {
      newErrors.posting_title = tPageSync('createJob.jobTitleError');
    }

    if (!formData.country) {
      newErrors.country = tPageSync('createJob.countryError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
    try {
      const result = await JobDataSource.createTemplateJob(license, {
        posting_title: formData.posting_title.trim(),
        country: formData.country,
        city: formData.city?.trim() || undefined
      });
      
      onSuccess(result);
    } catch (error) {
      console.error('Failed to create template job:', error);
      setErrors({ submit: error.message || tPageSync('createJob.submitError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {tPageSync('createJob.title')}
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tPageSync('createJob.jobTitleLabel')}
              </label>
              <input
                type="text"
                value={formData.posting_title}
                onChange={(e) => setFormData({ ...formData, posting_title: e.target.value })}
                placeholder={tPageSync('createJob.jobTitlePlaceholder')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                  errors.posting_title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                autoFocus
              />
              {errors.posting_title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.posting_title}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                {tPageSync('createJob.countryLabel')}
              </label>
              {loadingCountries ? (
                <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {tPageSync('createJob.loadingCountries')}
                </div>
              ) : (
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">{tPageSync('createJob.countryPlaceholder')}</option>
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              )}
              {errors.country && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.country}
                </p>
              )}
            </div>

            {/* City (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tPageSync('createJob.cityLabel')} <span className="text-gray-400 font-normal">{tPageSync('createJob.cityOptional')}</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={tPageSync('createJob.cityPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                {tPageSync('createJob.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isSubmitting || loadingCountries}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {tPageSync('createJob.creating')}
                  </>
                ) : (
                  tPageSync('createJob.createButton')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
