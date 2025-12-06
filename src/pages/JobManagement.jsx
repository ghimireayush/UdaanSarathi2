import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Briefcase,
  MapPin,
  Users,
  Calendar,
  Edit,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import JobDataSource from '../api/datasources/JobDataSource.js';
import CreateTemplateModal from '../components/CreateTemplateModal.jsx';
import { useLanguage } from '../hooks/useLanguage';

const JobManagement = () => {
  const navigate = useNavigate();
  const { tPageSync } = useLanguage({ pageName: 'jobManagement', autoLoad: true });
  const tPage = (key, params = {}) => tPageSync(key, params) || key;

  // State
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get license from localStorage
  const license = localStorage.getItem('udaan_agency_license');

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!license) {
      setError('Agency license not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await JobDataSource.getAdminJobs({ limit: 100 });
      setJobs(Array.isArray(response.data) ? response.data : response || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load job postings');
    } finally {
      setIsLoading(false);
    }
  }, [license]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Filter jobs by search term
  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const jobTitle = job.title || job.posting_title || '';
    return (
      jobTitle.toLowerCase().includes(term) ||
      job.country?.toLowerCase().includes(term) ||
      job.city?.toLowerCase().includes(term)
    );
  });

  // Handle job click - navigate to edit page
  const handleJobClick = (jobId) => {
    navigate(`/job-management/${jobId}/edit`);
  };

  // Handle create success
  const handleCreateSuccess = (newJob) => {
    setShowCreateModal(false);
    navigate(`/job-management/${newJob.id}/edit`);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-80 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
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
          <button
            onClick={fetchJobs}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Create and edit job postings</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Job
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search jobs by title, country, or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Empty state */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No jobs match your search' : 'No job postings yet'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm ? 'Try a different search term' : 'Create your first job posting to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Job
            </button>
          )}
        </div>
      ) : (
        /* Job cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} onClick={() => handleJobClick(job.id)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          license={license}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

// Job Card Component
const JobCard = ({ job, onClick }) => {
  const totalPositions = job.positions?.length || 1;
  const totalVacancies = job.positions?.reduce((sum, p) => sum + (p.total_vacancies || 0), 0) || 0;
  // API returns 'title' but template jobs use 'posting_title'
  const jobTitle = job.title || job.posting_title || 'Untitled Job';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
          {jobTitle}
        </h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          job.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {job.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          {job.country}{job.city ? `, ${job.city}` : ''}
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2" />
          {totalPositions} position{totalPositions !== 1 ? 's' : ''} • {totalVacancies} vacancies
        </div>
        {job.created_at && (
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(job.created_at).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center text-sm font-medium">
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </button>
      </div>
    </div>
  );
};


export default JobManagement;
