import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Loader2, AlertCircle } from 'lucide-react';
import countryService from '../../services/countryService';
import jobTitleService from '../../services/jobTitleService';
import dialogService from '../../services/dialogService.js';

const PositionsSection = ({ positions, onAdd, onUpdate, onRemove }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [currencies, setCurrencies] = useState([]);

  // Fetch currencies from countries on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const countries = await countryService.getCountries();
        // Extract unique currencies from countries
        const uniqueCurrencies = [...new Set(countries.map(c => c.currency_code).filter(Boolean))].sort();
        setCurrencies(uniqueCurrencies);
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
        // Fallback to common currencies
        setCurrencies(['USD', 'AED', 'SAR', 'QAR', 'KWD', 'MYR', 'NPR']);
      }
    };
    fetchCurrencies();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Positions</h2>
          <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {positions.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-xs sm:text-sm font-medium disabled:opacity-50 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-1 sm:mr-2" />
          Add Position
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span>
          </p>
        </div>
      )}

      {/* Add Position Form */}
      {showAddForm && (
        <PositionForm
          currencies={currencies}
          onSave={async (data) => {
            try {
              setError(null);
              await onAdd(data);
              setShowAddForm(false);
            } catch (err) {
              setError(err.message || 'Failed to add position');
            }
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Positions List */}
      <div className="space-y-3 sm:space-y-4">
        {positions.length === 0 && !showAddForm ? (
          <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            No positions added yet. Click "Add Position" to create one.
          </div>
        ) : (
          positions.map(position => (
            <div key={position.id}>
              {editingId === position.id ? (
                <PositionForm
                  initialData={position}
                  currencies={currencies}
                  onSave={async (data) => {
                    try {
                      setError(null);
                      await onUpdate(position.id, data);
                      setEditingId(null);
                    } catch (err) {
                      setError(err.message || 'Failed to update position');
                    }
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <PositionCard
                  position={position}
                  onEdit={() => setEditingId(position.id)}
                  onDelete={async () => {
                    const confirmed = await dialogService.confirm(
                      'पद हटाउनुहोस्',
                      'के तपाईं यो पद हटाउन चाहनुहुन्छ? यो कार्य पूर्ववत गर्न सकिँदैन।',
                      {
                        type: 'danger',
                        confirmText: 'हटाउनुहोस्',
                        cancelText: 'रद्द गर्नुहोस्'
                      }
                    );
                    if (confirmed) {
                      try {
                        setError(null);
                        await onRemove(position.id);
                      } catch (err) {
                        setError(err.message || 'Failed to remove position');
                      }
                    }
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PositionCard = ({ position, onEdit, onDelete }) => {
  const totalVacancies = (position.male_vacancies || 0) + (position.female_vacancies || 0);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">{position.title}</h3>
          <div className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p className="truncate">
              Vacancies: {totalVacancies} total 
              ({position.male_vacancies || 0} male, {position.female_vacancies || 0} female)
            </p>
            <p className="truncate">
              Salary: {position.salary_currency || 'USD'} {position.monthly_salary_amount?.toLocaleString() || 0}/month
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PositionForm = ({ initialData, currencies = [], onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    male_vacancies: initialData?.male_vacancies ?? 0,
    female_vacancies: initialData?.female_vacancies ?? 0,
    monthly_salary_amount: initialData?.monthly_salary_amount ?? 0,
    salary_currency: initialData?.salary_currency || 'AED',
    position_notes: initialData?.position_notes || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Job title autocomplete state
  const [titleSuggestions, setTitleSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const titleInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Fallback currencies if none provided
  const currencyOptions = currencies.length > 0 ? currencies : ['USD', 'AED', 'SAR', 'QAR', 'KWD', 'MYR', 'NPR'];

  // Search job titles with debounce
  const handleTitleChange = (value) => {
    setFormData({ ...formData, title: value });
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await jobTitleService.searchJobTitles(value, 8);
          setTitleSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch (err) {
          console.error('Failed to search job titles:', err);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setTitleSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
    }
  };

  const selectSuggestion = (title) => {
    setFormData({ ...formData, title: title.title });
    setShowSuggestions(false);
    setTitleSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          titleInputRef.current && !titleInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        title: formData.title,
        vacancies: {
          male: Number(formData.male_vacancies) || 0,
          female: Number(formData.female_vacancies) || 0
        },
        salary: {
          monthly_amount: Number(formData.monthly_salary_amount) || 0,
          currency: formData.salary_currency
        },
        position_notes: formData.position_notes || undefined
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Position Title *
          </label>
          <div className="relative">
            <input
              ref={titleInputRef}
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => titleSuggestions.length > 0 && setShowSuggestions(true)}
              required
              placeholder="Start typing to search job titles..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
          {/* Autocomplete suggestions dropdown */}
          {showSuggestions && titleSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {titleSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id || index}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="font-medium">{suggestion.title}</span>
                  {suggestion.difficulty && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      ({suggestion.difficulty})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Male Vacancies
          </label>
          <input
            type="number"
            min="0"
            value={formData.male_vacancies}
            onChange={(e) => setFormData({ ...formData, male_vacancies: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Female Vacancies
          </label>
          <input
            type="number"
            min="0"
            value={formData.female_vacancies}
            onChange={(e) => setFormData({ ...formData, female_vacancies: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monthly Salary
          </label>
          <input
            type="number"
            min="0"
            value={formData.monthly_salary_amount}
            onChange={(e) => setFormData({ ...formData, monthly_salary_amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
          </label>
          <select
            value={formData.salary_currency}
            onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {currencyOptions.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={formData.position_notes}
            onChange={(e) => setFormData({ ...formData, position_notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <X className="w-4 h-4 inline mr-1" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving || !formData.title}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />{initialData ? 'Update' : 'Add'}</>
          )}
        </button>
      </div>
    </form>
  );
};

export default PositionsSection;
