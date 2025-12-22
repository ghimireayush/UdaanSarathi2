import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw, Loader2, Upload, ImageIcon, FileText } from 'lucide-react';
import JobDataSource from '../api/datasources/JobDataSource.js';
import SectionNavigation from '../components/job-management/SectionNavigation.jsx';
import BasicInfoSection from '../components/job-management/BasicInfoSection.jsx';
import EmployerSection from '../components/job-management/EmployerSection.jsx';
import ContractSection from '../components/job-management/ContractSection.jsx';
import PositionsSection from '../components/job-management/PositionsSection.jsx';
import TagsSection from '../components/job-management/TagsSection.jsx';
import ExpensesSection from '../components/job-management/ExpensesSection.jsx';
import ImageUploadSection from '../components/job-management/ImageUploadSection.jsx';
import mockExtractedJobData from '../data/mockExtractedJobData.json';
import enhancedExtractedJobData from '../data/enhancedExtractedJobData.json';
import { useLanguage } from '../hooks/useLanguage.js';

const JobManagementEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tPageSync } = useLanguage({ pageName: 'job-management', autoLoad: true });
  
  const tPage = (key, params = {}) => {
    return tPageSync(key, params);
  };
  
  // State
  const [jobData, setJobData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [isExtractingFromImage, setIsExtractingFromImage] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);
  const [isExtractingEnhanced, setIsExtractingEnhanced] = useState(false);
  const [enhancedExtractionSuccess, setEnhancedExtractionSuccess] = useState(false);
  const [dataFromExtraction, setDataFromExtraction] = useState(false); // Flag to mark data as needing save
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(null);
  const [isTogglingDraft, setIsTogglingDraft] = useState(false);
  
  // Section refs for scroll tracking
  const sectionRefs = {
    image: useRef(null),
    basic: useRef(null),
    employer: useRef(null),
    contract: useRef(null),
    positions: useRef(null),
    tags: useRef(null),
    expenses: useRef(null)
  };

  // Get license from localStorage
  const license = localStorage.getItem('udaan_agency_license');
  
  // Check if running in dev mode (localhost)
  const isDevMode = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  // Fetch job details
  const fetchJobDetails = useCallback(async () => {
    if (!license || !id) {
      setError('Missing license or job ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await JobDataSource.getEditableJobDetails(license, id);
      setJobData(data);
    } catch (err) {
      console.error('Failed to fetch job details:', err);
      if (err.response?.status === 404) {
        setError('Job posting not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to load job details');
      }
    } finally {
      setIsLoading(false);
    }
  }, [license, id]);

  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  // Scroll tracking with IntersectionObserver
  useEffect(() => {
    const observers = [];
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveSection(key);
            }
          });
        }, options);
        observer.observe(ref.current);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [jobData]);

  // Section update handlers
  const handleBasicInfoSave = async (data) => {
    const result = await JobDataSource.updateBasicInfo(license, id, data);
    setJobData(prev => ({ ...prev, ...data, updated_at: result.updated_at }));
    return result;
  };

  const handleEmployerSave = async (data) => {
    const result = await JobDataSource.updateEmployer(license, id, data);
    setJobData(prev => ({ ...prev, employer: { ...prev.employer, ...data } }));
    return result;
  };

  const handleContractSave = async (data) => {
    const result = await JobDataSource.updateContract(license, id, data);
    setJobData(prev => ({ ...prev, contract: { ...prev.contract, ...data } }));
    return result;
  };

  const handleTagsSave = async (data) => {
    const result = await JobDataSource.updateTags(license, id, data);
    setJobData(prev => ({ ...prev, tags: { ...prev.tags, ...data } }));
    return result;
  };

  const handleExpensesSave = async (data) => {
    const result = await JobDataSource.updateExpenses(license, id, data);
    setJobData(prev => ({ ...prev, expenses: { ...prev.expenses, ...data } }));
    return result;
  };

  // Position handlers
  const handleAddPosition = async (data) => {
    const result = await JobDataSource.addPosition(license, id, data);
    setJobData(prev => ({
      ...prev,
      positions: [...(prev.positions || []), result]
    }));
    return result;
  };

  const handleUpdatePosition = async (positionId, data) => {
    const result = await JobDataSource.updatePosition(license, id, positionId, data);
    setJobData(prev => ({
      ...prev,
      positions: prev.positions.map(p => p.id === positionId ? { ...p, ...result } : p)
    }));
    return result;
  };

  const handleRemovePosition = async (positionId) => {
    await JobDataSource.removePosition(license, id, positionId);
    setJobData(prev => ({
      ...prev,
      positions: prev.positions.filter(p => p.id !== positionId)
    }));
  };

  // Scroll to section
  const scrollToSection = (sectionKey) => {
    sectionRefs[sectionKey]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handle draft toggle
  const handleToggleDraft = async () => {
    setIsTogglingDraft(true);
    try {
      const newDraftStatus = !jobData.is_draft;
      await JobDataSource.toggleJobPostingDraft(license, id, newDraftStatus);
      setJobData(prev => ({ ...prev, is_draft: newDraftStatus }));
    } catch (err) {
      console.error('Failed to toggle draft status:', err);
      alert(tPage('messages.draftToggleFailed'));
    } finally {
      setIsTogglingDraft(false);
    }
  };

  // Handle image upload - extract data and patch form
  const handleImageUpload = async () => {
    setIsExtractingFromImage(true);
    setExtractionSuccess(false);
    
    try {
      // Simulate processing delay (in real implementation, this would call LLM API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Load mock extracted data and merge with existing jobData
      const extracted = mockExtractedJobData;
      
      setJobData(prev => ({
        ...prev,
        // Basic info fields
        posting_title: extracted.basicInfo.posting_title,
        country: extracted.basicInfo.country,
        city: extracted.basicInfo.city,
        lt_number: extracted.basicInfo.lt_number,
        chalani_number: extracted.basicInfo.chalani_number,
        approval_date_ad: extracted.basicInfo.approval_date_ad,
        posting_date_ad: extracted.basicInfo.posting_date_ad,
        announcement_type: extracted.basicInfo.announcement_type,
        notes: extracted.basicInfo.notes,
        // Employer
        employer: {
          ...prev?.employer,
          ...extracted.employer
        },
        // Contract
        contract: {
          ...prev?.contract,
          ...extracted.contract
        },
        // Positions - replace with extracted positions
        positions: extracted.positions.map((pos, idx) => ({
          id: `extracted_${idx}`,
          title: pos.title,
          male_vacancies: pos.male_vacancies,
          female_vacancies: pos.female_vacancies,
          monthly_salary_amount: pos.monthly_salary_amount,
          salary_currency: pos.salary_currency,
          position_notes: pos.position_notes
        })),
        // Tags
        tags: {
          ...prev?.tags,
          skills: extracted.tags.skills,
          education_requirements: extracted.tags.education_requirements,
          experience_requirements: extracted.tags.experience_requirements
        },
        // Expenses
        expenses: {
          ...prev?.expenses,
          ...extracted.expenses
        }
      }));
      
      setDataFromExtraction(true); // Mark that data needs saving
      setExtractionSuccess(true);
      setTimeout(() => setExtractionSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to extract data from image:', err);
    } finally {
      setIsExtractingFromImage(false);
    }
  };

  // Handle enhanced image upload - extract ALL data and patch form
  const handleEnhancedImageUpload = async () => {
    setIsExtractingEnhanced(true);
    setEnhancedExtractionSuccess(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const extracted = enhancedExtractedJobData;
      
      setJobData(prev => ({
        ...prev,
        posting_title: extracted.basicInfo.posting_title,
        country: extracted.basicInfo.country,
        city: extracted.basicInfo.city,
        lt_number: extracted.basicInfo.lt_number,
        chalani_number: extracted.basicInfo.chalani_number,
        approval_date_ad: extracted.basicInfo.approval_date_ad,
        posting_date_ad: extracted.basicInfo.posting_date_ad,
        announcement_type: extracted.basicInfo.announcement_type,
        notes: extracted.basicInfo.notes,
        employer: {
          ...prev?.employer,
          ...extracted.employer
        },
        contract: {
          ...prev?.contract,
          ...extracted.contract
        },
        positions: extracted.positions.map((pos, idx) => ({
          id: `enhanced_${idx}`,
          title: pos.title,
          male_vacancies: pos.male_vacancies,
          female_vacancies: pos.female_vacancies,
          monthly_salary_amount: pos.monthly_salary_amount,
          salary_currency: pos.salary_currency,
          position_notes: pos.position_notes
        })),
        tags: {
          ...prev?.tags,
          skills: extracted.tags.skills,
          education_requirements: extracted.tags.education_requirements,
          experience_requirements: extracted.tags.experience_requirements
        },
        expenses: {
          ...prev?.expenses,
          ...extracted.expenses
        }
      }));
      
      setDataFromExtraction(true);
      setEnhancedExtractionSuccess(true);
      setTimeout(() => setEnhancedExtractionSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to extract enhanced data from image:', err);
    } finally {
      setIsExtractingEnhanced(false);
    }
  };

  // Reset extraction flag when any section saves
  const handleSaveComplete = () => {
    setDataFromExtraction(false);
  };

  // Image upload handlers
  const handleImageUploadSuccess = (imageUrl) => {
    setJobData(prev => ({
      ...prev,
      cutout_url: imageUrl
    }));
    setImageUploadError(null);
  };

  const handleImageDeleteSuccess = () => {
    setJobData(prev => ({
      ...prev,
      cutout_url: null
    }));
    setImageUploadError(null);
  };

  // Construct full image URL from relative path
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/${url}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{error}</h2>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => navigate('/job-management')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to List
            </button>
            <button
              onClick={fetchJobDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/job-management')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tPage('buttons.backToJobManagement')}
          </button>
          
          {/* Draft Toggle and Upload Buttons */}
          <div className="flex gap-2">
            {/* Draft Toggle Button */}
            <button
              onClick={handleToggleDraft}
              disabled={isTogglingDraft}
              className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                jobData?.is_draft
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isTogglingDraft ? '...' : (jobData?.is_draft ? tPage('buttons.publishFromDraft') || 'Publish' : tPage('buttons.markAsDraft') || 'Mark as Draft')}
            </button>
            
            {/* Basic Upload Button - Dev Mode Only */}
            {isDevMode && (
              <button
                onClick={handleImageUpload}
                disabled={isExtractingFromImage || isExtractingEnhanced}
                className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-all ${
                  extractionSuccess
                    ? 'bg-green-600 text-white'
                    : isExtractingFromImage
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isExtractingFromImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {tPage('buttons.extracting')}
                  </>
                ) : extractionSuccess ? (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {tPage('buttons.filled')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {tPage('buttons.basicExtract')}
                  </>
                )}
              </button>
            )}

            {/* Enhanced Upload Button - Dev Mode Only */}
            {isDevMode && (
              <button
                onClick={handleEnhancedImageUpload}
                disabled={isExtractingFromImage || isExtractingEnhanced}
                className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-all ${
                  enhancedExtractionSuccess
                    ? 'bg-green-600 text-white'
                    : isExtractingEnhanced
                    ? 'bg-orange-400 text-white cursor-wait'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-md hover:shadow-lg'
                }`}
              >
                {isExtractingEnhanced ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {tPage('buttons.extracting')}
                  </>
                ) : enhancedExtractionSuccess ? (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {tPage('buttons.filled')}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {tPage('buttons.basicExtract')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {jobData?.posting_title || 'Edit Job Posting'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {jobData?.country}{jobData?.city ? `, ${jobData.city}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              jobData?.is_draft
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {jobData?.is_draft ? tPage('status.draft') : tPage('status.published')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          <SectionNavigation
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <div ref={sectionRefs.image} id="section-image">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Job Image</h2>
              <ImageUploadSection
                jobId={id}
                currentImageUrl={getFullImageUrl(jobData?.cutout_url)}
                onImageUpload={handleImageUploadSuccess}
                onImageDelete={handleImageDeleteSuccess}
                isLoading={isUploadingImage}
                error={imageUploadError}
              />
            </div>
          </div>

          <div ref={sectionRefs.basic} id="section-basic">
            <BasicInfoSection
              data={jobData}
              onSave={handleBasicInfoSave}
              isFromExtraction={dataFromExtraction}
            />
          </div>

          <div ref={sectionRefs.employer} id="section-employer">
            <EmployerSection
              data={jobData?.employer}
              onSave={handleEmployerSave}
              isFromExtraction={dataFromExtraction}
            />
          </div>

          <div ref={sectionRefs.contract} id="section-contract">
            <ContractSection
              data={jobData?.contract}
              onSave={handleContractSave}
              isFromExtraction={dataFromExtraction}
            />
          </div>

          <div ref={sectionRefs.positions} id="section-positions">
            <PositionsSection
              positions={jobData?.positions || []}
              onAdd={handleAddPosition}
              onUpdate={handleUpdatePosition}
              onRemove={handleRemovePosition}
            />
          </div>

          <div ref={sectionRefs.tags} id="section-tags">
            <TagsSection
              data={jobData?.tags}
              onSave={handleTagsSave}
              isFromExtraction={dataFromExtraction}
            />
          </div>

          <div ref={sectionRefs.expenses} id="section-expenses">
            <ExpensesSection
              data={jobData?.expenses}
              onSave={handleExpensesSave}
              isFromExtraction={dataFromExtraction}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobManagementEdit;
