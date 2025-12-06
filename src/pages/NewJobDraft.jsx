import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Send, 
  ArrowLeft, 
  Plus, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Building2,
  FileText,
  Users,
  Briefcase,
  GraduationCap,
  X
} from 'lucide-react';
import countryService from '../services/countryService';
import JobDataSource from '../api/datasources/JobDataSource.js';

// Helper function for input error styling
const getInputClassName = (hasError) => {
  return `w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
    hasError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
  }`;
};

// Helper to check if expense has meaningful data
const hasExpenseData = (expense) => {
  if (!expense) return false;
  
  // For nested expenses (medical, welfare_service)
  if (expense.domestic || expense.foreign || expense.welfare || expense.service) {
    const checkNested = (obj) => {
      if (!obj) return false;
      return obj.amount || obj.notes || (obj.is_free === true);
    };
    return checkNested(expense.domestic) || checkNested(expense.foreign) || 
           checkNested(expense.welfare) || checkNested(expense.service);
  }
  
  // For simple expenses
  return expense.amount || expense.notes || (expense.is_free === true);
};

// Helper to clean expense data (convert empty strings to undefined)
const cleanExpenseData = (expense) => {
  const clean = (obj) => {
    if (!obj) return undefined;
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] === '' || obj[key] === null) {
        // Skip empty values
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        const nested = clean(obj[key]);
        if (nested && Object.keys(nested).length > 0) {
          cleaned[key] = nested;
        }
      } else {
        cleaned[key] = obj[key];
      }
    });
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  };
  return clean(expense);
};

const NewJobDraft = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  
  // Data states
  const [countries, setCountries] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [cutoutFile, setCutoutFile] = useState(null);
  const [cutoutPreview, setCutoutPreview] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    posting_title: '',
    country: '',
    city: '',
    lt_number: '',
    chalani_number: '',
    approval_date_ad: new Date().toISOString().split('T')[0],
    posting_date_ad: new Date().toISOString().split('T')[0],
    announcement_type: 'full_ad',
    notes: '',
    
    // Step 2: Employer Information
    employer: {
      company_name: '',
      country: '',
      city: ''
    },
    
    // Step 3: Contract Details
    contract: {
      period_years: 2,
      renewable: true,
      hours_per_day: 8,
      days_per_week: 6,
      overtime_policy: 'paid',
      weekly_off_days: 1,
      food: 'free',
      accommodation: 'free',
      transport: 'free',
      annual_leave_days: 30
    },
    
    // Step 4: Positions
    positions: [{
      title: '',
      vacancies: { male: 0, female: 0 },
      salary: { monthly_amount: 0, currency: 'AED' },
      hours_per_day_override: null,
      position_notes: ''
    }],
    
    // Step 5: Skills & Requirements
    skills: [],
    education_requirements: [],
    experience_requirements: {
      min_years: 0,
      max_years: 1,
      level: 'fresher'
    },
    canonical_title_names: [],
    
    // Step 6: Expenses (Optional)
    medical_expense: {
      domestic: { who_pays: 'agency', is_free: false, amount: '', currency: 'NPR', notes: '' },
      foreign: { who_pays: 'company', is_free: false, amount: '', currency: 'AED', notes: '' }
    },
    insurance_expense: {
      who_pays: 'company',
      is_free: false,
      amount: '',
      currency: 'AED',
      coverage_amount: '',
      coverage_currency: 'AED',
      notes: ''
    },
    travel_expense: {
      who_provides: 'company',
      ticket_type: 'round_trip',
      is_free: false,
      amount: '',
      currency: 'AED',
      notes: ''
    },
    visa_permit_expense: {
      who_pays: 'company',
      is_free: false,
      amount: '',
      currency: 'AED',
      refundable: false,
      notes: ''
    },
    training_expense: {
      who_pays: 'company',
      is_free: false,
      amount: '',
      currency: 'AED',
      duration_days: '',
      mandatory: true,
      notes: ''
    },
    welfare_service_expense: {
      welfare: {
        who_pays: 'worker',
        is_free: false,
        amount: '',
        currency: 'NPR',
        fund_purpose: '',
        refundable: false,
        notes: ''
      },
      service: {
        who_pays: 'worker',
        is_free: false,
        amount: '',
        currency: 'NPR',
        service_type: '',
        refundable: false,
        notes: ''
      }
    }
  });

  const steps = [
    { id: 0, name: 'Basic Info', icon: FileText },
    { id: 1, name: 'Employer', icon: Building2 },
    { id: 2, name: 'Contract', icon: Briefcase },
    { id: 3, name: 'Positions', icon: Users },
    { id: 4, name: 'Requirements', icon: GraduationCap },
    { id: 5, name: 'Expenses', icon: Briefcase }
  ];

  // Fetch countries and job titles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch countries using countryService
        const countriesData = await countryService.getCountries();
        console.log('Countries fetched:', countriesData);
        setCountries(countriesData || []);
        
        // Fetch job titles
        try {
          const jobTitlesRes = await JobDataSource.getJobTitles();
          // Handle both nested and direct response formats
          const titlesData = jobTitlesRes.data || jobTitlesRes || [];
          console.log('Job titles fetched:', titlesData);
          setJobTitles(titlesData);
        } catch (err) {
          console.error('Failed to fetch job titles:', err);
          setError('Failed to load job titles. Please check if the API is available.');
          setJobTitles([]);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load required data. Please refresh the page.');
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setCutoutFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCutoutPreview(previewUrl);
      
      setError(null);
    }
  };

  const handleRemoveCutout = () => {
    setCutoutFile(null);
    if (cutoutPreview) {
      URL.revokeObjectURL(cutoutPreview);
      setCutoutPreview(null);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (cutoutPreview) {
        URL.revokeObjectURL(cutoutPreview);
      }
    };
  }, [cutoutPreview]);

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handlePositionChange = (index, field, value) => {
    const newPositions = [...formData.positions];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newPositions[index] = {
        ...newPositions[index],
        [parent]: {
          ...newPositions[index][parent],
          [child]: value
        }
      };
    } else {
      newPositions[index] = {
        ...newPositions[index],
        [field]: value
      };
    }
    setFormData(prev => ({ ...prev, positions: newPositions }));
  };

  const addPosition = () => {
    setFormData(prev => ({
      ...prev,
      positions: [
        ...prev.positions,
        {
          title: '',
          vacancies: { male: 0, female: 0 },
          salary: { monthly_amount: 0, currency: 'AED' },
          hours_per_day_override: null,
          position_notes: ''
        }
      ]
    }));
  };

  const removePosition = (index) => {
    if (formData.positions.length > 1) {
      setFormData(prev => ({
        ...prev,
        positions: prev.positions.filter((_, i) => i !== index)
      }));
    }
  };

  const getStepErrors = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Basic Info
        if (!formData.posting_title) errors.posting_title = true;
        if (!formData.country) errors.country = true;
        if (!formData.city) errors.city = true;
        if (!formData.lt_number) errors.lt_number = true;
        if (!formData.chalani_number) errors.chalani_number = true;
        if (!formData.approval_date_ad) errors.approval_date_ad = true;
        if (!formData.posting_date_ad) errors.posting_date_ad = true;
        break;
      case 1: // Employer
        if (!formData.employer.company_name) errors['employer.company_name'] = true;
        if (!formData.employer.country) errors['employer.country'] = true;
        if (!formData.employer.city) errors['employer.city'] = true;
        break;
      case 2: // Contract
        if (!formData.contract.period_years || formData.contract.period_years <= 0) errors['contract.period_years'] = true;
        if (!formData.contract.hours_per_day || formData.contract.hours_per_day <= 0) errors['contract.hours_per_day'] = true;
        if (!formData.contract.days_per_week || formData.contract.days_per_week <= 0) errors['contract.days_per_week'] = true;
        break;
      case 3: // Positions
        formData.positions.forEach((pos, idx) => {
          if (!pos.title) errors[`positions.${idx}.title`] = true;
          if (pos.vacancies.male <= 0 && pos.vacancies.female <= 0) {
            errors[`positions.${idx}.vacancies.male`] = true;
            errors[`positions.${idx}.vacancies.female`] = true;
          }
          if (!pos.salary.monthly_amount || pos.salary.monthly_amount <= 0) errors[`positions.${idx}.salary.monthly_amount`] = true;
        });
        break;
      case 4: // Requirements
        if (formData.skills.length === 0 && formData.education_requirements.length === 0) {
          errors.skills = true;
          errors.education_requirements = true;
        }
        break;
    }
    
    return errors;
  };

  const validateStep = (step) => {
    const errors = getStepErrors(step);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    const errors = getStepErrors(currentStep);
    
    if (Object.keys(errors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      setError(null);
      setValidationErrors({});
    } else {
      setValidationErrors(errors);
      setError('Please fill in all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setError(null);
  };

  const createJobPosting = async (token, licenseNumber, baseURL, payload) => {
    // Note: File upload functionality needs to be added to JobDataSource
    // For now, using JobDataSource for JSON-only posting
    if (cutoutFile) {
      console.warn('File upload not yet supported through DataSource, skipping cutout file');
    }
    
    return await JobDataSource.createJobPosting(licenseNumber, payload);
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('udaan_token');
      const licenseNumber = localStorage.getItem('udaan_agency_license');
      
      if (!licenseNumber) {
        setError('Agency license not found. Please ensure you have an agency set up.');
        setLoading(false);
        return;
      }
      
      // Build canonical_title_names from positions
      const canonicalTitles = [...new Set(formData.positions.map(p => p.title).filter(Boolean))];
      
      const payload = {
        posting_title: formData.posting_title,
        country: formData.country,
        city: formData.city,
        lt_number: formData.lt_number,
        chalani_number: formData.chalani_number,
        approval_date_ad: formData.approval_date_ad,
        posting_date_ad: formData.posting_date_ad,
        announcement_type: formData.announcement_type,
        notes: formData.notes,
        employer: formData.employer,
        contract: formData.contract,
        positions: formData.positions.map(pos => ({
          title: pos.title,
          vacancies: {
            male: pos.vacancies.male === '' ? 0 : pos.vacancies.male,
            female: pos.vacancies.female === '' ? 0 : pos.vacancies.female
          },
          salary: {
            monthly_amount: pos.salary.monthly_amount === '' ? 0 : pos.salary.monthly_amount,
            currency: pos.salary.currency
          },
          ...(pos.hours_per_day_override && { hours_per_day_override: pos.hours_per_day_override }),
          ...(pos.position_notes && { position_notes: pos.position_notes })
        })),
        skills: formData.skills,
        education_requirements: formData.education_requirements,
        experience_requirements: formData.experience_requirements,
        canonical_title_names: canonicalTitles,
        
        // Add expenses (only if they have meaningful data)
        ...(hasExpenseData(formData.medical_expense) && { medical_expense: cleanExpenseData(formData.medical_expense) }),
        ...(hasExpenseData(formData.insurance_expense) && { insurance_expense: cleanExpenseData(formData.insurance_expense) }),
        ...(hasExpenseData(formData.travel_expense) && { travel_expense: cleanExpenseData(formData.travel_expense) }),
        ...(hasExpenseData(formData.visa_permit_expense) && { visa_permit_expense: cleanExpenseData(formData.visa_permit_expense) }),
        ...(hasExpenseData(formData.training_expense) && { training_expense: cleanExpenseData(formData.training_expense) }),
        ...(hasExpenseData(formData.welfare_service_expense) && { welfare_service_expense: cleanExpenseData(formData.welfare_service_expense) })
      };
      
      await createJobPosting(token, licenseNumber, null, payload);
      
      setSuccess('Draft saved successfully!');
      setTimeout(() => {
        // Force page refresh by using window.location instead of navigate
        window.location.href = '/drafts';
      }, 1500);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setError(err.response?.data?.message || 'Failed to save draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    // Validate all steps
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        const errors = getStepErrors(i);
        setValidationErrors(errors);
        setError(`Please complete step ${i + 1}: ${steps[i].name}`);
        setCurrentStep(i);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('udaan_token');
      const licenseNumber = localStorage.getItem('udaan_agency_license');
      
      if (!licenseNumber) {
        setError('Agency license not found. Please ensure you have an agency set up.');
        setLoading(false);
        return;
      }
      
      // Build canonical_title_names from positions
      const canonicalTitles = [...new Set(formData.positions.map(p => p.title).filter(Boolean))];
      
      const payload = {
        posting_title: formData.posting_title,
        country: formData.country,
        city: formData.city,
        lt_number: formData.lt_number,
        chalani_number: formData.chalani_number,
        approval_date_ad: formData.approval_date_ad,
        posting_date_ad: formData.posting_date_ad,
        announcement_type: formData.announcement_type,
        notes: formData.notes,
        employer: formData.employer,
        contract: formData.contract,
        positions: formData.positions.map(pos => ({
          title: pos.title,
          vacancies: {
            male: pos.vacancies.male === '' ? 0 : pos.vacancies.male,
            female: pos.vacancies.female === '' ? 0 : pos.vacancies.female
          },
          salary: {
            monthly_amount: pos.salary.monthly_amount === '' ? 0 : pos.salary.monthly_amount,
            currency: pos.salary.currency
          },
          ...(pos.hours_per_day_override && { hours_per_day_override: pos.hours_per_day_override }),
          ...(pos.position_notes && { position_notes: pos.position_notes })
        })),
        skills: formData.skills,
        education_requirements: formData.education_requirements,
        experience_requirements: formData.experience_requirements,
        canonical_title_names: canonicalTitles,
        
        // Add expenses (only if they have meaningful data)
        ...(hasExpenseData(formData.medical_expense) && { medical_expense: cleanExpenseData(formData.medical_expense) }),
        ...(hasExpenseData(formData.insurance_expense) && { insurance_expense: cleanExpenseData(formData.insurance_expense) }),
        ...(hasExpenseData(formData.travel_expense) && { travel_expense: cleanExpenseData(formData.travel_expense) }),
        ...(hasExpenseData(formData.visa_permit_expense) && { visa_permit_expense: cleanExpenseData(formData.visa_permit_expense) }),
        ...(hasExpenseData(formData.training_expense) && { training_expense: cleanExpenseData(formData.training_expense) }),
        ...(hasExpenseData(formData.welfare_service_expense) && { welfare_service_expense: cleanExpenseData(formData.welfare_service_expense) })
      };
      
      await createJobPosting(token, licenseNumber, null, payload);
      
      setSuccess('Job posting published successfully!');
      setTimeout(() => {
        // Force page refresh by using window.location instead of navigate
        window.location.href = '/jobs';
      }, 1500);
    } catch (err) {
      console.error('Failed to publish:', err);
      setError(err.response?.data?.message || 'Failed to publish job posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep 
          formData={formData} 
          onChange={handleInputChange}
          countries={countries}
          onFileChange={handleFileChange}
          cutoutFile={cutoutFile}
          errors={validationErrors}
        />;
      case 1:
        return <EmployerStep 
          formData={formData} 
          onChange={handleNestedChange}
          countries={countries}
          errors={validationErrors}
        />;
      case 2:
        return <ContractStep 
          formData={formData} 
          onChange={handleNestedChange}
          errors={validationErrors}
        />;
      case 3:
        return <PositionsStep 
          formData={formData} 
          onChange={handlePositionChange}
          onAdd={addPosition}
          onRemove={removePosition}
          jobTitles={jobTitles}
          errors={validationErrors}
        />;
      case 4:
        return <RequirementsStep 
          formData={formData} 
          onChange={handleInputChange}
          errors={validationErrors}
          jobTitles={jobTitles}
        />;
      case 5:
        return <ExpensesStep 
          formData={formData} 
          onChange={handleNestedChange}
          errors={validationErrors}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/drafts')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Drafts
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create New Job Posting
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Fill in the details to create a new job posting
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = currentStep > index;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-500 text-white' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className={`text-sm mt-2 ${
                      isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' :
                      isCompleted ? 'text-green-600 dark:text-green-400' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Cutout Image Preview - Persistent across all steps */}
        {cutoutPreview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Advertisement Image
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Reference this image while filling the form
                </p>
              </div>
              <button
                onClick={handleRemoveCutout}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <img
                src={cutoutPreview}
                alt="Job advertisement cutout"
                className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-900"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              File: {cutoutFile?.name} ({(cutoutFile?.size / 1024).toFixed(2)} KB)
            </p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 flex items-center"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Draft
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                <Send className="w-5 h-5 mr-2" />
                Publish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const BasicInfoStep = ({ formData, onChange, countries, onFileChange, cutoutFile, errors = {} }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Job Title *
        </label>
        <input
          type="text"
          value={formData.posting_title}
          onChange={(e) => onChange('posting_title', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
            errors.posting_title ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="e.g., Construction Worker - UAE Project"
        />
        {errors.posting_title && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Country *
        </label>
        <select
          value={formData.country}
          onChange={(e) => onChange('country', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
            errors.country ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <option value="">Select Country</option>
          {countries.map(country => (
            <option key={country.country_code || country.country_name} value={country.country_name}>
              {country.country_name}
            </option>
          ))}
        </select>
        {errors.country && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          City *
        </label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => onChange('city', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
            errors.city ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="e.g., Dubai"
        />
        {errors.city && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          LT Number *
        </label>
        <input
          type="text"
          value={formData.lt_number}
          onChange={(e) => onChange('lt_number', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
            errors.lt_number ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="e.g., LT-2025-12345"
        />
        {errors.lt_number && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chalani Number *
        </label>
        <input
          type="text"
          value={formData.chalani_number}
          onChange={(e) => onChange('chalani_number', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
            errors.chalani_number ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder="e.g., CH-2025-98765"
        />
        {errors.chalani_number && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Approval Date *
        </label>
        <input
          type="date"
          value={formData.approval_date_ad}
          onChange={(e) => onChange('approval_date_ad', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
            errors.approval_date_ad ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {errors.approval_date_ad && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Posting Date *
        </label>
        <input
          type="date"
          value={formData.posting_date_ad}
          onChange={(e) => onChange('posting_date_ad', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
            errors.posting_date_ad ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {errors.posting_date_ad && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      {/* Announcement Type hidden - defaults to full_ad */}
      
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes or requirements..."
        />
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Job Advertisement Image (Optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
        {cutoutFile && (
          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              ✓ Image uploaded: {cutoutFile.name}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              The image will be displayed above for easy reference while filling the form
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload the newspaper advertisement image to reference while filling the form (JPG, PNG, max 5MB)
        </p>
      </div>
    </div>
  </div>
);

const EmployerStep = ({ formData, onChange, countries, errors = {} }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Employer Information</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Company Name *
        </label>
        <input
          type="text"
          value={formData.employer.company_name}
          onChange={(e) => onChange('employer', 'company_name', e.target.value)}
          className={getInputClassName(errors['employer.company_name'])}
          placeholder="e.g., Gulf Construction LLC"
        />
        {errors['employer.company_name'] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Country *
        </label>
        <select
          value={formData.employer.country}
          onChange={(e) => onChange('employer', 'country', e.target.value)}
          className={getInputClassName(errors['employer.country'])}
        >
          <option value="">Select Country</option>
          {countries.map(country => (
            <option key={country.country_code || country.country_name} value={country.country_name}>
              {country.country_name}
            </option>
          ))}
        </select>
        {errors['employer.country'] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          City *
        </label>
        <input
          type="text"
          value={formData.employer.city}
          onChange={(e) => onChange('employer', 'city', e.target.value)}
          className={getInputClassName(errors['employer.city'])}
          placeholder="e.g., Dubai"
        />
        {errors['employer.city'] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
      </div>
    </div>
  </div>
);

const ContractStep = ({ formData, onChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contract Details</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Contract Period (Years) *
        </label>
        <input
          type="number"
          min="1"
          value={formData.contract.period_years}
          onChange={(e) => onChange('contract', 'period_years', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Renewable *
        </label>
        <select
          value={formData.contract.renewable}
          onChange={(e) => onChange('contract', 'renewable', e.target.value === 'true')}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hours Per Day *
        </label>
        <input
          type="number"
          min="1"
          max="16"
          value={formData.contract.hours_per_day}
          onChange={(e) => onChange('contract', 'hours_per_day', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Days Per Week *
        </label>
        <input
          type="number"
          min="1"
          max="7"
          value={formData.contract.days_per_week}
          onChange={(e) => onChange('contract', 'days_per_week', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Overtime Policy *
        </label>
        <select
          value={formData.contract.overtime_policy}
          onChange={(e) => onChange('contract', 'overtime_policy', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="as_per_company_policy">As Per Company Policy</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="not_applicable">Not Applicable</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Weekly Off Days *
        </label>
        <input
          type="number"
          min="0"
          max="2"
          value={formData.contract.weekly_off_days}
          onChange={(e) => onChange('contract', 'weekly_off_days', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Food *
        </label>
        <select
          value={formData.contract.food}
          onChange={(e) => onChange('contract', 'food', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="free">Free</option>
          <option value="paid">Paid by Worker</option>
          <option value="not_provided">Not Provided</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Accommodation *
        </label>
        <select
          value={formData.contract.accommodation}
          onChange={(e) => onChange('contract', 'accommodation', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="free">Free</option>
          <option value="paid">Paid by Worker</option>
          <option value="not_provided">Not Provided</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transport *
        </label>
        <select
          value={formData.contract.transport}
          onChange={(e) => onChange('contract', 'transport', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="free">Free</option>
          <option value="paid">Paid by Worker</option>
          <option value="not_provided">Not Provided</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Annual Leave Days *
        </label>
        <input
          type="number"
          min="0"
          value={formData.contract.annual_leave_days}
          onChange={(e) => onChange('contract', 'annual_leave_days', parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>
);

const PositionsStep = ({ formData, onChange, onAdd, onRemove, jobTitles, errors = {} }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Positions</h2>
      <button
        onClick={onAdd}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Position
      </button>
    </div>
    
    {formData.positions.map((position, index) => (
      <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 relative">
        {formData.positions.length > 1 && (
          <button
            onClick={() => onRemove(index)}
            className="absolute top-4 right-4 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Position {index + 1}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position Title *
            </label>
            {jobTitles.length > 0 ? (
              <select
                value={position.title}
                onChange={(e) => onChange(index, 'title', e.target.value)}
                className={getInputClassName(errors[`positions.${index}.title`])}
              >
                <option value="">Select Position</option>
                {jobTitles.map(title => (
                  <option key={title.id || title.title} value={title.title}>
                    {title.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={position.title}
                onChange={(e) => onChange(index, 'title', e.target.value)}
                className={getInputClassName(errors[`positions.${index}.title`])}
                placeholder="e.g., Construction Worker, Electrician, etc."
              />
            )}
            {errors[`positions.${index}.title`] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">This field is required</p>}
            {jobTitles.length === 0 && !errors[`positions.${index}.title`] && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                Job titles API not available. Enter position title manually.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Male Vacancies *
            </label>
            <input
              type="number"
              min="0"
              value={position.vacancies.male}
              onChange={(e) => onChange(index, 'vacancies.male', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={getInputClassName(errors[`positions.${index}.vacancies.male`])}
            />
            {errors[`positions.${index}.vacancies.male`] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">At least one vacancy required</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Female Vacancies *
            </label>
            <input
              type="number"
              min="0"
              value={position.vacancies.female}
              onChange={(e) => onChange(index, 'vacancies.female', e.target.value === '' ? '' : parseInt(e.target.value))}
              className={getInputClassName(errors[`positions.${index}.vacancies.female`])}
            />
            {errors[`positions.${index}.vacancies.female`] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">At least one vacancy required</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monthly Salary *
            </label>
            <input
              type="number"
              min="0"
              value={position.salary.monthly_amount}
              onChange={(e) => onChange(index, 'salary.monthly_amount', e.target.value === '' ? '' : parseFloat(e.target.value))}
              className={getInputClassName(errors[`positions.${index}.salary.monthly_amount`])}
            />
            {errors[`positions.${index}.salary.monthly_amount`] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">Salary is required</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency *
            </label>
            <select
              value={position.salary.currency}
              onChange={(e) => onChange(index, 'salary.currency', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="AED">AED</option>
              <option value="USD">USD</option>
              <option value="SAR">SAR</option>
              <option value="QAR">QAR</option>
              <option value="MYR">MYR</option>
              <option value="KWD">KWD</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hours Per Day Override (Optional)
            </label>
            <input
              type="number"
              min="1"
              max="16"
              value={position.hours_per_day_override || ''}
              onChange={(e) => onChange(index, 'hours_per_day_override', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Leave empty to use contract default"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Override the contract hours for this specific position (e.g., for senior roles)
            </p>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position Notes
            </label>
            <textarea
              value={position.position_notes}
              onChange={(e) => onChange(index, 'position_notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Additional requirements or notes for this position..."
            />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const RequirementsStep = ({ formData, onChange, jobTitles }) => {
  const [newSkill, setNewSkill] = useState('');
  
  const skillOptions = [
    'professional-skills',
    'communication',
    'teamwork',
    'problem-solving',
    'leadership',
    'technical-skills',
    'time-management',
    'adaptability'
  ];
  
  const educationOptions = [
    'high-school',
    'diploma',
    'bachelors',
    'masters',
    'phd',
    'vocational-training'
  ];
  
  // Map experience level to min/max years
  const experienceLevelMap = {
    'fresher': { min: 0, max: 1 },
    'experienced': { min: 2, max: 5 },
    'skilled': { min: 5, max: 10 },
    'expert': { min: 10, max: 30 }
  };
  
  const addSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      onChange('skills', [...formData.skills, skill]);
    }
  };
  
  const removeSkill = (skill) => {
    onChange('skills', formData.skills.filter(s => s !== skill));
  };
  
  const toggleEducation = (edu) => {
    if (formData.education_requirements.includes(edu)) {
      onChange('education_requirements', formData.education_requirements.filter(e => e !== edu));
    } else {
      onChange('education_requirements', [...formData.education_requirements, edu]);
    }
  };
  
  const handleLevelChange = (level) => {
    const years = experienceLevelMap[level];
    onChange('experience_requirements', {
      min_years: years.min,
      max_years: years.max,
      level: level
    });
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Requirements</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Skills *
        </label>
        <div className="flex gap-2 mb-3">
          <select
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className={getInputClassName(errors.skills)}
          >
            <option value="">Select a skill</option>
            {skillOptions.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
          <button
            onClick={() => {
              addSkill(newSkill);
              setNewSkill('');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        {errors.skills && formData.skills.length === 0 && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-2">At least one skill or education requirement is required</p>
        )}
        <div className="flex flex-wrap gap-2">
          {formData.skills.map(skill => (
            <span
              key={skill}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
            >
              {skill}
              <button
                onClick={() => removeSkill(skill)}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Education Requirements *
        </label>
        {errors.education_requirements && formData.education_requirements.length === 0 && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-2">At least one skill or education requirement is required</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {educationOptions.map(edu => (
            <button
              key={edu}
              onClick={() => toggleEducation(edu)}
              className={`px-4 py-2 rounded-lg border ${
                formData.education_requirements.includes(edu)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {edu}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Experience Level *
          </label>
          <select
            value={formData.experience_requirements.level}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="fresher">Fresher (0-1 years)</option>
            <option value="experienced">Experienced (2-5 years)</option>
            <option value="skilled">Skilled (5-10 years)</option>
            <option value="expert">Expert (10+ years)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Min Years (Auto-filled)
          </label>
          <input
            type="number"
            value={formData.experience_requirements.min_years}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Years (Auto-filled)
          </label>
          <input
            type="number"
            value={formData.experience_requirements.max_years}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

const ExpensesStep = ({ formData, onChange, errors = {} }) => {
  const payerOptions = [
    { value: 'company', label: 'Company' },
    { value: 'worker', label: 'Worker' },
    { value: 'agency', label: 'Agency' },
    { value: 'shared', label: 'Shared' },
    { value: 'not_applicable', label: 'Not Applicable' }
  ];

  const ticketTypes = [
    { value: 'one_way', label: 'One Way' },
    { value: 'round_trip', label: 'Round Trip' },
    { value: 'return_only', label: 'Return Only' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Expenses (Optional)</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Add expense details for this job posting. All fields are optional.
        </p>
      </div>

      {/* Medical Expense */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Medical Expenses</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Domestic Medical</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who Pays</label>
              <select
                value={formData.medical_expense.domestic.who_pays}
                onChange={(e) => onChange('medical_expense', 'domestic', { ...formData.medical_expense.domestic, who_pays: e.target.value })}
                className={getInputClassName()}
              >
                {payerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.medical_expense.domestic.is_free}
                onChange={(e) => onChange('medical_expense', 'domestic', { ...formData.medical_expense.domestic, is_free: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Is Free</label>
            </div>
            {!formData.medical_expense.domestic.is_free && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={formData.medical_expense.domestic.amount}
                    onChange={(e) => onChange('medical_expense', 'domestic', { ...formData.medical_expense.domestic, amount: e.target.value })}
                    className={getInputClassName()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <input
                    type="text"
                    value={formData.medical_expense.domestic.currency}
                    onChange={(e) => onChange('medical_expense', 'domestic', { ...formData.medical_expense.domestic, currency: e.target.value })}
                    className={getInputClassName()}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.medical_expense.domestic.notes}
                onChange={(e) => onChange('medical_expense', 'domestic', { ...formData.medical_expense.domestic, notes: e.target.value })}
                rows={2}
                className={getInputClassName()}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Foreign Medical</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who Pays</label>
              <select
                value={formData.medical_expense.foreign.who_pays}
                onChange={(e) => onChange('medical_expense', 'foreign', { ...formData.medical_expense.foreign, who_pays: e.target.value })}
                className={getInputClassName()}
              >
                {payerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.medical_expense.foreign.is_free}
                onChange={(e) => onChange('medical_expense', 'foreign', { ...formData.medical_expense.foreign, is_free: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Is Free</label>
            </div>
            {!formData.medical_expense.foreign.is_free && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={formData.medical_expense.foreign.amount}
                    onChange={(e) => onChange('medical_expense', 'foreign', { ...formData.medical_expense.foreign, amount: e.target.value })}
                    className={getInputClassName()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <input
                    type="text"
                    value={formData.medical_expense.foreign.currency}
                    onChange={(e) => onChange('medical_expense', 'foreign', { ...formData.medical_expense.foreign, currency: e.target.value })}
                    className={getInputClassName()}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.medical_expense.foreign.notes}
                onChange={(e) => onChange('medical_expense', 'foreign', { ...formData.medical_expense.foreign, notes: e.target.value })}
                rows={2}
                className={getInputClassName()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Expense */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insurance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who Pays</label>
            <select
              value={formData.insurance_expense.who_pays}
              onChange={(e) => onChange('insurance_expense', 'who_pays', e.target.value)}
              className={getInputClassName()}
            >
              {payerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.insurance_expense.is_free}
              onChange={(e) => onChange('insurance_expense', 'is_free', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">Is Free</label>
          </div>
          {!formData.insurance_expense.is_free && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.insurance_expense.amount}
                  onChange={(e) => onChange('insurance_expense', 'amount', e.target.value)}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                <input
                  type="text"
                  value={formData.insurance_expense.currency}
                  onChange={(e) => onChange('insurance_expense', 'currency', e.target.value)}
                  className={getInputClassName()}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coverage Amount</label>
            <input
              type="number"
              value={formData.insurance_expense.coverage_amount}
              onChange={(e) => onChange('insurance_expense', 'coverage_amount', e.target.value)}
              className={getInputClassName()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coverage Currency</label>
            <input
              type="text"
              value={formData.insurance_expense.coverage_currency}
              onChange={(e) => onChange('insurance_expense', 'coverage_currency', e.target.value)}
              className={getInputClassName()}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.insurance_expense.notes}
              onChange={(e) => onChange('insurance_expense', 'notes', e.target.value)}
              rows={2}
              className={getInputClassName()}
            />
          </div>
        </div>
      </div>

      {/* Travel Expense */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Travel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who Provides</label>
            <select
              value={formData.travel_expense.who_provides}
              onChange={(e) => onChange('travel_expense', 'who_provides', e.target.value)}
              className={getInputClassName()}
            >
              {payerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ticket Type</label>
            <select
              value={formData.travel_expense.ticket_type}
              onChange={(e) => onChange('travel_expense', 'ticket_type', e.target.value)}
              className={getInputClassName()}
            >
              {ticketTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.travel_expense.is_free}
              onChange={(e) => onChange('travel_expense', 'is_free', e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm text-gray-700 dark:text-gray-300">Is Free</label>
          </div>
          {!formData.travel_expense.is_free && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.travel_expense.amount}
                  onChange={(e) => onChange('travel_expense', 'amount', e.target.value)}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                <input
                  type="text"
                  value={formData.travel_expense.currency}
                  onChange={(e) => onChange('travel_expense', 'currency', e.target.value)}
                  className={getInputClassName()}
                />
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.travel_expense.notes}
              onChange={(e) => onChange('travel_expense', 'notes', e.target.value)}
              rows={2}
              className={getInputClassName()}
            />
          </div>
        </div>
      </div>

      {/* Visa/Permit Expense */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visa & Work Permit</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who Pays</label>
            <select
              value={formData.visa_permit_expense.who_pays}
              onChange={(e) => onChange('visa_permit_expense', 'who_pays', e.target.value)}
              className={getInputClassName()}
            >
              {payerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.visa_permit_expense.is_free}
                onChange={(e) => onChange('visa_permit_expense', 'is_free', e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Is Free</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.visa_permit_expense.refundable}
                onChange={(e) => onChange('visa_permit_expense', 'refundable', e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Refundable</label>
            </div>
          </div>
          {!formData.visa_permit_expense.is_free && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.visa_permit_expense.amount}
                  onChange={(e) => onChange('visa_permit_expense', 'amount', e.target.value)}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                <input
                  type="text"
                  value={formData.visa_permit_expense.currency}
                  onChange={(e) => onChange('visa_permit_expense', 'currency', e.target.value)}
                  className={getInputClassName()}
                />
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.visa_permit_expense.notes}
              onChange={(e) => onChange('visa_permit_expense', 'notes', e.target.value)}
              rows={2}
              className={getInputClassName()}
            />
          </div>
        </div>
      </div>

      {/* Training Expense */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Training & Orientation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who Pays</label>
            <select
              value={formData.training_expense.who_pays}
              onChange={(e) => onChange('training_expense', 'who_pays', e.target.value)}
              className={getInputClassName()}
            >
              {payerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.training_expense.is_free}
                onChange={(e) => onChange('training_expense', 'is_free', e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Is Free</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.training_expense.mandatory}
                onChange={(e) => onChange('training_expense', 'mandatory', e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Mandatory</label>
            </div>
          </div>
          {!formData.training_expense.is_free && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.training_expense.amount}
                  onChange={(e) => onChange('training_expense', 'amount', e.target.value)}
                  className={getInputClassName()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                <input
                  type="text"
                  value={formData.training_expense.currency}
                  onChange={(e) => onChange('training_expense', 'currency', e.target.value)}
                  className={getInputClassName()}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (Days)</label>
            <input
              type="number"
              value={formData.training_expense.duration_days}
              onChange={(e) => onChange('training_expense', 'duration_days', e.target.value)}
              className={getInputClassName()}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.training_expense.notes}
              onChange={(e) => onChange('training_expense', 'notes', e.target.value)}
              rows={2}
              className={getInputClassName()}
            />
          </div>
        </div>
      </div>

      {/* Welfare & Service Charge */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Welfare Fund & Service Charges</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Welfare Fund</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who Pays</label>
              <select
                value={formData.welfare_service_expense.welfare.who_pays}
                onChange={(e) => onChange('welfare_service_expense', 'welfare', { ...formData.welfare_service_expense.welfare, who_pays: e.target.value })}
                className={getInputClassName()}
              >
                {payerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.welfare_service_expense.welfare.is_free}
                  onChange={(e) => onChange('welfare_service_expense', 'welfare', { ...formData.welfare_service_expense.welfare, is_free: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Is Free</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.welfare_service_expense.welfare.refundable}
                  onChange={(e) => onChange('welfare_service_expense', 'welfare', { ...formData.welfare_service_expense.welfare, refundable: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Refundable</label>
              </div>
            </div>
            {!formData.welfare_service_expense.welfare.is_free && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={formData.welfare_service_expense.welfare.amount}
                    onChange={(e) => onChange('welfare_service_expense', 'welfare', { ...formData.welfare_service_expense.welfare, amount: e.target.value })}
                    className={getInputClassName()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <input
                    type="text"
                    value={formData.welfare_service_expense.welfare.currency}
                    onChange={(e) => onChange('welfare_service_expense', 'welfare', { ...formData.welfare_service_expense.welfare, currency: e.target.value })}
                    className={getInputClassName()}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fund Purpose</label>
              <input
                type="text"
                value={formData.welfare_service_expense.welfare.fund_purpose}
                onChange={(e) => onChange('welfare_service_expense', 'welfare', { ...formData.welfare_service_expense.welfare, fund_purpose: e.target.value })}
                className={getInputClassName()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.welfare_service_expense.welfare.notes}
                onChange={(e) => onChange('welfare_service_expense', 'welfare', { ...formData.welfare_service_expense.welfare, notes: e.target.value })}
                rows={2}
                className={getInputClassName()}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Service Charges</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Who Pays</label>
              <select
                value={formData.welfare_service_expense.service.who_pays}
                onChange={(e) => onChange('welfare_service_expense', 'service', { ...formData.welfare_service_expense.service, who_pays: e.target.value })}
                className={getInputClassName()}
              >
                {payerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.welfare_service_expense.service.is_free}
                  onChange={(e) => onChange('welfare_service_expense', 'service', { ...formData.welfare_service_expense.service, is_free: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Is Free</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.welfare_service_expense.service.refundable}
                  onChange={(e) => onChange('welfare_service_expense', 'service', { ...formData.welfare_service_expense.service, refundable: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">Refundable</label>
              </div>
            </div>
            {!formData.welfare_service_expense.service.is_free && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={formData.welfare_service_expense.service.amount}
                    onChange={(e) => onChange('welfare_service_expense', 'service', { ...formData.welfare_service_expense.service, amount: e.target.value })}
                    className={getInputClassName()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <input
                    type="text"
                    value={formData.welfare_service_expense.service.currency}
                    onChange={(e) => onChange('welfare_service_expense', 'service', { ...formData.welfare_service_expense.service, currency: e.target.value })}
                    className={getInputClassName()}
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type</label>
              <input
                type="text"
                value={formData.welfare_service_expense.service.service_type}
                onChange={(e) => onChange('welfare_service_expense', 'service', { ...formData.welfare_service_expense.service, service_type: e.target.value })}
                className={getInputClassName()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea
                value={formData.welfare_service_expense.service.notes}
                onChange={(e) => onChange('welfare_service_expense', 'service', { ...formData.welfare_service_expense.service, notes: e.target.value })}
                rows={2}
                className={getInputClassName()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewJobDraft;
