import React, { useState, useEffect } from 'react';
import { ScrollText, Save, Loader2, AlertCircle, Check } from 'lucide-react';

const ContractSection = ({ data, onSave, isFromExtraction = false }) => {
  const [formData, setFormData] = useState({
    period_years: '',
    renewable: false,
    hours_per_day: '',
    days_per_week: '',
    overtime_policy: '',
    weekly_off_days: '',
    food: '',
    accommodation: '',
    transport: '',
    annual_leave_days: ''
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const provisionOptions = ['free', 'paid', 'not_provided'];
  const overtimePolicyOptions = ['as_per_company_policy', 'paid', 'unpaid', 'not_applicable'];

  // Initialize form data when data changes
  useEffect(() => {
    if (data) {
      setFormData({
        period_years: data.period_years ?? '',
        renewable: data.renewable ?? false,
        hours_per_day: data.hours_per_day ?? '',
        days_per_week: data.days_per_week ?? '',
        overtime_policy: data.overtime_policy ?? '',
        weekly_off_days: data.weekly_off_days ?? '',
        food: data.food ?? '',
        accommodation: data.accommodation ?? '',
        transport: data.transport ?? '',
        annual_leave_days: data.annual_leave_days ?? ''
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
      const updates = {
        period_years: formData.period_years === '' ? null : Number(formData.period_years),
        renewable: formData.renewable,
        hours_per_day: formData.hours_per_day === '' ? null : Number(formData.hours_per_day),
        days_per_week: formData.days_per_week === '' ? null : Number(formData.days_per_week),
        overtime_policy: formData.overtime_policy || null,
        weekly_off_days: formData.weekly_off_days === '' ? null : Number(formData.weekly_off_days),
        food: formData.food || null,
        accommodation: formData.accommodation || null,
        transport: formData.transport || null,
        annual_leave_days: formData.annual_leave_days === '' ? null : Number(formData.annual_leave_days)
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
          <ScrollText className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contract Terms</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contract Period (Years)
          </label>
          <input
            type="number"
            min="0"
            value={formData.period_years}
            onChange={(e) => handleChange('period_years', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hours per Day
          </label>
          <input
            type="number"
            min="0"
            max="24"
            value={formData.hours_per_day}
            onChange={(e) => handleChange('hours_per_day', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Days per Week
          </label>
          <input
            type="number"
            min="0"
            max="7"
            value={formData.days_per_week}
            onChange={(e) => handleChange('days_per_week', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Weekly Off Days
          </label>
          <input
            type="number"
            min="0"
            max="7"
            value={formData.weekly_off_days}
            onChange={(e) => handleChange('weekly_off_days', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Annual Leave Days
          </label>
          <input
            type="number"
            min="0"
            value={formData.annual_leave_days}
            onChange={(e) => handleChange('annual_leave_days', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.renewable}
              onChange={(e) => handleChange('renewable', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Renewable Contract
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Overtime Policy
          </label>
          <select
            value={formData.overtime_policy}
            onChange={(e) => handleChange('overtime_policy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {overtimePolicyOptions.map(opt => (
              <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Food
          </label>
          <select
            value={formData.food}
            onChange={(e) => handleChange('food', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {provisionOptions.map(opt => (
              <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Accommodation
          </label>
          <select
            value={formData.accommodation}
            onChange={(e) => handleChange('accommodation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {provisionOptions.map(opt => (
              <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transport
          </label>
          <select
            value={formData.transport}
            onChange={(e) => handleChange('transport', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {provisionOptions.map(opt => (
              <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ContractSection;
