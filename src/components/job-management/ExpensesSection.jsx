import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Loader2, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import countryService from '../../services/countryService';

const ExpensesSection = ({ data, onSave, isFromExtraction = false }) => {
  const [formData, setFormData] = useState({
    medical: { domestic: {}, foreign: {} },
    insurance: {},
    travel: {},
    visa_permit: {},
    training: {},
    welfare_service: { welfare: {}, service: {} }
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    medical: false,
    insurance: false,
    travel: false,
    visa_permit: false,
    training: false,
    welfare_service: false
  });
  const [currencies, setCurrencies] = useState(['NPR', 'AED', 'USD', 'SAR', 'QAR', 'KWD', 'MYR']);

  // Fetch currencies from countries on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const countries = await countryService.getCountries();
        const uniqueCurrencies = [...new Set(countries.map(c => c.currency_code).filter(Boolean))].sort();
        if (uniqueCurrencies.length > 0) {
          setCurrencies(uniqueCurrencies);
        }
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
      }
    };
    fetchCurrencies();
  }, []);

  const payerOptions = [
    { value: 'company', label: 'Company' },
    { value: 'worker', label: 'Worker' },
    { value: 'agency', label: 'Agency' },
    { value: 'shared', label: 'Shared' },
    { value: 'not_applicable', label: 'N/A' }
  ];

  const ticketTypes = [
    { value: 'one_way', label: 'One Way' },
    { value: 'round_trip', label: 'Round Trip' },
    { value: 'return_only', label: 'Return Only' }
  ];

  // Transform API data to form structure
  const transformApiDataToForm = (apiData) => {
    if (!apiData) return { medical: { domestic: {}, foreign: {} }, insurance: {}, travel: {}, visa_permit: {}, training: {}, welfare_service: { welfare: {}, service: {} } };

    return {
      medical: {
        domestic: {
          who_pays: apiData.medical?.domestic_who_pays,
          is_free: apiData.medical?.domestic_is_free,
          amount: apiData.medical?.domestic_amount,
          currency: apiData.medical?.domestic_currency,
          notes: apiData.medical?.domestic_notes,
        },
        foreign: {
          who_pays: apiData.medical?.foreign_who_pays,
          is_free: apiData.medical?.foreign_is_free,
          amount: apiData.medical?.foreign_amount,
          currency: apiData.medical?.foreign_currency,
          notes: apiData.medical?.foreign_notes,
        }
      },
      insurance: {
        who_pays: apiData.insurance?.who_pays,
        is_free: apiData.insurance?.is_free,
        amount: apiData.insurance?.amount,
        currency: apiData.insurance?.currency,
        coverage_amount: apiData.insurance?.coverage_amount,
        coverage_currency: apiData.insurance?.coverage_currency,
        notes: apiData.insurance?.notes,
      },
      travel: {
        who_provides: apiData.travel?.who_provides,
        ticket_type: apiData.travel?.ticket_type,
        is_free: apiData.travel?.is_free,
        amount: apiData.travel?.amount,
        currency: apiData.travel?.currency,
        notes: apiData.travel?.notes,
      },
      visa_permit: {
        who_pays: apiData.visa_permit?.who_pays,
        is_free: apiData.visa_permit?.is_free,
        amount: apiData.visa_permit?.amount,
        currency: apiData.visa_permit?.currency,
        refundable: apiData.visa_permit?.refundable,
        notes: apiData.visa_permit?.notes,
      },
      training: {
        who_pays: apiData.training?.who_pays,
        is_free: apiData.training?.is_free,
        amount: apiData.training?.amount,
        currency: apiData.training?.currency,
        duration_days: apiData.training?.duration_days,
        mandatory: apiData.training?.mandatory,
        notes: apiData.training?.notes,
      },
      welfare_service: {
        welfare: {
          who_pays: apiData.welfare_service?.welfare_who_pays,
          is_free: apiData.welfare_service?.welfare_is_free,
          amount: apiData.welfare_service?.welfare_amount,
          currency: apiData.welfare_service?.welfare_currency,
          fund_purpose: apiData.welfare_service?.welfare_fund_purpose,
          refundable: apiData.welfare_service?.welfare_refundable,
          notes: apiData.welfare_service?.welfare_notes,
        },
        service: {
          who_pays: apiData.welfare_service?.service_who_pays,
          is_free: apiData.welfare_service?.service_is_free,
          amount: apiData.welfare_service?.service_amount,
          currency: apiData.welfare_service?.service_currency,
          type: apiData.welfare_service?.service_type,
          refundable: apiData.welfare_service?.service_refundable,
          notes: apiData.welfare_service?.service_notes,
        }
      }
    };
  };

  useEffect(() => {
    if (data) {
      setFormData(transformApiDataToForm(data));
    }
  }, [data]);

  // When extraction flag is set, mark form as dirty so save button is enabled
  useEffect(() => {
    if (isFromExtraction) {
      setIsDirty(true);
    }
  }, [isFromExtraction]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
    setIsDirty(true);
    setSuccess(false);
  };

  const handleNestedChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: { ...prev[section]?.[subsection], [field]: value }
      }
    }));
    setIsDirty(true);
    setSuccess(false);
  };

  // Transform form data to match backend DTO structure
  const transformFormDataForApi = (data) => {
    const toNumber = (val) => val === '' || val === null || val === undefined ? undefined : Number(val);
    const toInt = (val) => val === '' || val === null || val === undefined ? undefined : parseInt(val, 10);
    const nonEmpty = (val) => val === '' ? undefined : val;

    const result = {};

    // Medical - flatten nested structure
    if (data.medical?.domestic || data.medical?.foreign) {
      result.medical = {
        domestic_who_pays: nonEmpty(data.medical?.domestic?.who_pays),
        domestic_is_free: data.medical?.domestic?.is_free || false,
        domestic_amount: toNumber(data.medical?.domestic?.amount),
        domestic_currency: nonEmpty(data.medical?.domestic?.currency),
        domestic_notes: nonEmpty(data.medical?.domestic?.notes),
        foreign_who_pays: nonEmpty(data.medical?.foreign?.who_pays),
        foreign_is_free: data.medical?.foreign?.is_free || false,
        foreign_amount: toNumber(data.medical?.foreign?.amount),
        foreign_currency: nonEmpty(data.medical?.foreign?.currency),
        foreign_notes: nonEmpty(data.medical?.foreign?.notes),
      };
    }

    // Insurance
    if (data.insurance && Object.keys(data.insurance).length > 0) {
      result.insurance = {
        who_pays: nonEmpty(data.insurance?.who_pays),
        is_free: data.insurance?.is_free || false,
        amount: toNumber(data.insurance?.amount),
        currency: nonEmpty(data.insurance?.currency),
        coverage_amount: toNumber(data.insurance?.coverage_amount),
        coverage_currency: nonEmpty(data.insurance?.coverage_currency),
        notes: nonEmpty(data.insurance?.notes),
      };
    }

    // Travel
    if (data.travel && Object.keys(data.travel).length > 0) {
      result.travel = {
        who_provides: nonEmpty(data.travel?.who_provides),
        ticket_type: nonEmpty(data.travel?.ticket_type),
        is_free: data.travel?.is_free || false,
        amount: toNumber(data.travel?.amount),
        currency: nonEmpty(data.travel?.currency),
        notes: nonEmpty(data.travel?.notes),
      };
    }

    // Visa/Permit
    if (data.visa_permit && Object.keys(data.visa_permit).length > 0) {
      result.visa_permit = {
        who_pays: nonEmpty(data.visa_permit?.who_pays),
        is_free: data.visa_permit?.is_free || false,
        amount: toNumber(data.visa_permit?.amount),
        currency: nonEmpty(data.visa_permit?.currency),
        refundable: data.visa_permit?.refundable || false,
        notes: nonEmpty(data.visa_permit?.notes),
      };
    }

    // Training
    if (data.training && Object.keys(data.training).length > 0) {
      result.training = {
        who_pays: nonEmpty(data.training?.who_pays),
        is_free: data.training?.is_free || false,
        amount: toNumber(data.training?.amount),
        currency: nonEmpty(data.training?.currency),
        duration_days: toInt(data.training?.duration_days),
        mandatory: data.training?.mandatory || false,
        notes: nonEmpty(data.training?.notes),
      };
    }

    // Welfare/Service - flatten nested structure
    if (data.welfare_service?.welfare || data.welfare_service?.service) {
      result.welfare_service = {
        welfare_who_pays: nonEmpty(data.welfare_service?.welfare?.who_pays),
        welfare_is_free: data.welfare_service?.welfare?.is_free || false,
        welfare_amount: toNumber(data.welfare_service?.welfare?.amount),
        welfare_currency: nonEmpty(data.welfare_service?.welfare?.currency),
        welfare_fund_purpose: nonEmpty(data.welfare_service?.welfare?.fund_purpose),
        welfare_refundable: data.welfare_service?.welfare?.refundable || false,
        welfare_notes: nonEmpty(data.welfare_service?.welfare?.notes),
        service_who_pays: nonEmpty(data.welfare_service?.service?.who_pays),
        service_is_free: data.welfare_service?.service?.is_free || false,
        service_amount: toNumber(data.welfare_service?.service?.amount),
        service_currency: nonEmpty(data.welfare_service?.service?.currency),
        service_type: nonEmpty(data.welfare_service?.service?.type),
        service_refundable: data.welfare_service?.service?.refundable || false,
        service_notes: nonEmpty(data.welfare_service?.service?.notes),
      };
    }

    return result;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const apiData = transformFormDataForApi(formData);
      await onSave(apiData);
      setIsDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm";
  const selectClass = "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm w-24";

  const CurrencySelect = ({ value, onChange, defaultValue = 'AED' }) => (
    <select value={value || defaultValue} onChange={onChange} className={selectClass}>
      {currencies.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );

  const SectionHeader = ({ title, section, hasData }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <div className="flex items-center">
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        {hasData && <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">Has Data</span>}
      </div>
      {expandedSections[section] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expenses</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors ${
            isDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : success ? <><Check className="w-4 h-4 mr-2" />Saved</> : <><Save className="w-4 h-4 mr-2" />Save</>}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center"><AlertCircle className="w-4 h-4 mr-2" />{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Medical */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SectionHeader title="Medical Expenses" section="medical" hasData={formData.medical?.domestic?.amount || formData.medical?.foreign?.amount} />
          {expandedSections.medical && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">Domestic</h4>
                <select value={formData.medical?.domestic?.who_pays || ''} onChange={(e) => handleNestedChange('medical', 'domestic', 'who_pays', e.target.value)} className={inputClass}>
                  <option value="">Who Pays</option>
                  {payerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Amount" value={formData.medical?.domestic?.amount || ''} onChange={(e) => handleNestedChange('medical', 'domestic', 'amount', e.target.value)} className={inputClass} />
                  <CurrencySelect value={formData.medical?.domestic?.currency} defaultValue="NPR" onChange={(e) => handleNestedChange('medical', 'domestic', 'currency', e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">Foreign</h4>
                <select value={formData.medical?.foreign?.who_pays || ''} onChange={(e) => handleNestedChange('medical', 'foreign', 'who_pays', e.target.value)} className={inputClass}>
                  <option value="">Who Pays</option>
                  {payerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Amount" value={formData.medical?.foreign?.amount || ''} onChange={(e) => handleNestedChange('medical', 'foreign', 'amount', e.target.value)} className={inputClass} />
                  <CurrencySelect value={formData.medical?.foreign?.currency} defaultValue="AED" onChange={(e) => handleNestedChange('medical', 'foreign', 'currency', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Insurance */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SectionHeader title="Insurance" section="insurance" hasData={formData.insurance?.amount || formData.insurance?.coverage_amount} />
          {expandedSections.insurance && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.insurance?.who_pays || ''} onChange={(e) => handleChange('insurance', 'who_pays', e.target.value)} className={inputClass}>
                <option value="">Who Pays</option>
                {payerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" placeholder="Amount" value={formData.insurance?.amount || ''} onChange={(e) => handleChange('insurance', 'amount', e.target.value)} className={inputClass} />
                <CurrencySelect value={formData.insurance?.currency} defaultValue="AED" onChange={(e) => handleChange('insurance', 'currency', e.target.value)} />
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Coverage Amount" value={formData.insurance?.coverage_amount || ''} onChange={(e) => handleChange('insurance', 'coverage_amount', e.target.value)} className={inputClass} />
                <CurrencySelect value={formData.insurance?.coverage_currency} defaultValue="AED" onChange={(e) => handleChange('insurance', 'coverage_currency', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Travel */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SectionHeader title="Travel" section="travel" hasData={formData.travel?.amount || formData.travel?.ticket_type} />
          {expandedSections.travel && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.travel?.who_provides || ''} onChange={(e) => handleChange('travel', 'who_provides', e.target.value)} className={inputClass}>
                <option value="">Who Provides</option>
                {payerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={formData.travel?.ticket_type || ''} onChange={(e) => handleChange('travel', 'ticket_type', e.target.value)} className={inputClass}>
                <option value="">Ticket Type</option>
                {ticketTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" placeholder="Amount" value={formData.travel?.amount || ''} onChange={(e) => handleChange('travel', 'amount', e.target.value)} className={inputClass} />
                <CurrencySelect value={formData.travel?.currency} defaultValue="AED" onChange={(e) => handleChange('travel', 'currency', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Visa/Permit */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SectionHeader title="Visa & Work Permit" section="visa_permit" hasData={formData.visa_permit?.amount} />
          {expandedSections.visa_permit && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.visa_permit?.who_pays || ''} onChange={(e) => handleChange('visa_permit', 'who_pays', e.target.value)} className={inputClass}>
                <option value="">Who Pays</option>
                {payerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" placeholder="Amount" value={formData.visa_permit?.amount || ''} onChange={(e) => handleChange('visa_permit', 'amount', e.target.value)} className={inputClass} />
                <CurrencySelect value={formData.visa_permit?.currency} defaultValue="AED" onChange={(e) => handleChange('visa_permit', 'currency', e.target.value)} />
              </div>
              <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={formData.visa_permit?.refundable || false} onChange={(e) => handleChange('visa_permit', 'refundable', e.target.checked)} className="mr-2" />
                Refundable
              </label>
            </div>
          )}
        </div>

        {/* Training */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SectionHeader title="Training & Orientation" section="training" hasData={formData.training?.amount || formData.training?.duration_days} />
          {expandedSections.training && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <select value={formData.training?.who_pays || ''} onChange={(e) => handleChange('training', 'who_pays', e.target.value)} className={inputClass}>
                <option value="">Who Pays</option>
                {payerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" placeholder="Amount" value={formData.training?.amount || ''} onChange={(e) => handleChange('training', 'amount', e.target.value)} className={inputClass} />
                <CurrencySelect value={formData.training?.currency} defaultValue="AED" onChange={(e) => handleChange('training', 'currency', e.target.value)} />
              </div>
              <input type="number" placeholder="Duration (Days)" value={formData.training?.duration_days || ''} onChange={(e) => handleChange('training', 'duration_days', e.target.value)} className={inputClass} />
              <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={formData.training?.mandatory || false} onChange={(e) => handleChange('training', 'mandatory', e.target.checked)} className="mr-2" />
                Mandatory
              </label>
            </div>
          )}
        </div>

        {/* Welfare Service */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <SectionHeader title="Welfare & Service" section="welfare_service" hasData={formData.welfare_service?.welfare?.amount || formData.welfare_service?.service?.amount} />
          {expandedSections.welfare_service && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">Welfare Fund</h4>
                <select value={formData.welfare_service?.welfare?.who_pays || ''} onChange={(e) => handleNestedChange('welfare_service', 'welfare', 'who_pays', e.target.value)} className={inputClass}>
                  <option value="">Who Pays</option>
                  {payerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Amount" value={formData.welfare_service?.welfare?.amount || ''} onChange={(e) => handleNestedChange('welfare_service', 'welfare', 'amount', e.target.value)} className={inputClass} />
                  <CurrencySelect value={formData.welfare_service?.welfare?.currency} defaultValue="NPR" onChange={(e) => handleNestedChange('welfare_service', 'welfare', 'currency', e.target.value)} />
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm">Service Charge</h4>
                <select value={formData.welfare_service?.service?.who_pays || ''} onChange={(e) => handleNestedChange('welfare_service', 'service', 'who_pays', e.target.value)} className={inputClass}>
                  <option value="">Who Pays</option>
                  {payerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" placeholder="Amount" value={formData.welfare_service?.service?.amount || ''} onChange={(e) => handleNestedChange('welfare_service', 'service', 'amount', e.target.value)} className={inputClass} />
                  <CurrencySelect value={formData.welfare_service?.service?.currency} defaultValue="NPR" onChange={(e) => handleNestedChange('welfare_service', 'service', 'currency', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesSection;
