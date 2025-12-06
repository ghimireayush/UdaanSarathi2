import React, { useState, useEffect } from 'react';
import { Tags, Save, Loader2, AlertCircle, Check, X, Plus } from 'lucide-react';

const TagsSection = ({ data, onSave, isFromExtraction = false }) => {
  const [formData, setFormData] = useState({
    skills: [],
    education_requirements: [],
    experience_requirements: {
      min_years: '',
      max_years: '',
      level: ''
    }
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Input states for adding new items
  const [newSkill, setNewSkill] = useState('');
  const [newEducation, setNewEducation] = useState('');

  const experienceLevels = ['entry', 'junior', 'mid', 'senior', 'expert'];

  // Initialize form data
  useEffect(() => {
    if (data) {
      setFormData({
        skills: data.skills || [],
        education_requirements: data.education_requirements || [],
        experience_requirements: {
          min_years: data.experience_requirements?.min_years ?? '',
          max_years: data.experience_requirements?.max_years ?? '',
          level: data.experience_requirements?.level ?? ''
        }
      });
      setIsDirty(isFromExtraction);
    }
  }, [data, isFromExtraction]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
      setIsDirty(true);
      setSuccess(false);
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
    setIsDirty(true);
    setSuccess(false);
  };

  const handleAddEducation = () => {
    if (newEducation.trim() && !formData.education_requirements.includes(newEducation.trim())) {
      setFormData(prev => ({
        ...prev,
        education_requirements: [...prev.education_requirements, newEducation.trim()]
      }));
      setNewEducation('');
      setIsDirty(true);
      setSuccess(false);
    }
  };

  const handleRemoveEducation = (edu) => {
    setFormData(prev => ({
      ...prev,
      education_requirements: prev.education_requirements.filter(e => e !== edu)
    }));
    setIsDirty(true);
    setSuccess(false);
  };

  const handleExperienceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      experience_requirements: {
        ...prev.experience_requirements,
        [field]: value
      }
    }));
    setIsDirty(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const updates = {
        skills: formData.skills,
        education_requirements: formData.education_requirements,
        experience_requirements: {
          min_years: formData.experience_requirements.min_years === '' ? null : Number(formData.experience_requirements.min_years),
          max_years: formData.experience_requirements.max_years === '' ? null : Number(formData.experience_requirements.max_years),
          level: formData.experience_requirements.level || null
        }
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
          <Tags className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tags & Requirements</h2>
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

      <div className="space-y-6">
        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Skills
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              disabled={!newSkill.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="ml-2 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {formData.skills.length === 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">No skills added</span>
            )}
          </div>
        </div>

        {/* Education Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Education Requirements
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newEducation}
              onChange={(e) => setNewEducation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEducation())}
              placeholder="Add education requirement..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddEducation}
              disabled={!newEducation.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.education_requirements.map(edu => (
              <span
                key={edu}
                className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm"
              >
                {edu}
                <button
                  onClick={() => handleRemoveEducation(edu)}
                  className="ml-2 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {formData.education_requirements.length === 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">No education requirements added</span>
            )}
          </div>
        </div>

        {/* Experience Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Experience Requirements
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Min Years
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience_requirements.min_years}
                onChange={(e) => handleExperienceChange('min_years', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Max Years
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience_requirements.max_years}
                onChange={(e) => handleExperienceChange('max_years', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Level
              </label>
              <select
                value={formData.experience_requirements.level}
                onChange={(e) => handleExperienceChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                {experienceLevels.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsSection;
