import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  Info,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  Tag,
  BarChart3,
  Filter,
  FileText,
  CheckCircle
} from 'lucide-react'
import CandidateShortlist from '../components/CandidateShortlist'
import { formatInNepalTz, getCurrentNepalTime } from '../utils/nepaliDate'
import { rankCandidates, getRankingInsights } from '../services/candidateRankingService'
import { useLanguage } from '../hooks/useLanguage'
import LanguageSwitch from '../components/LanguageSwitch'

// Mock data - replace with actual API calls
import jobsData from '../data/jobs.json'
import candidatesData from '../data/candidates.json'

const JobShortlist = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { tPageSync } = useLanguage({ 
    pageName: 'shortlist', // Using shortlist-specific translation file
    autoLoad: true 
  })

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }
  
  const [job, setJob] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [rankedCandidates, setRankedCandidates] = useState([])
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInsights, setShowInsights] = useState(false)

  // Workflow stages configuration - using shortlist translations
  const workflowStages = [
    { id: 'applied', label: tPage('workflowStages.applied'), icon: FileText, description: 'Initial application submitted', color: 'blue' },
    { id: 'shortlisted', label: tPage('workflowStages.shortlisted'), icon: CheckCircle, description: 'Selected for interview', color: 'yellow' },
    { id: 'interview-scheduled', label: tPage('workflowStages.interviewScheduled'), icon: Calendar, description: 'Interview appointment set', color: 'purple' },
    { id: 'interview-passed', label: tPage('workflowStages.interviewPassed'), icon: Users, description: 'Successfully completed interview', color: 'green' }
  ]

  // Load job and candidates data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Find job
        const foundJob = jobsData.find(j => j.id === jobId)
        if (!foundJob) {
          navigate('/jobs')
          return
        }
        setJob(foundJob)

        // Find candidates who applied to this job
        const jobCandidates = candidatesData.filter(candidate => 
          candidate.applied_jobs?.includes(jobId)
        )

        // Transform candidates to match expected structure for CandidateSummaryS2
        const validStages = ['applied', 'shortlisted', 'interview-scheduled', 'interview-passed']
        const transformedCandidates = jobCandidates.map(candidate => {
          // Ensure stage is valid, default to 'applied' if invalid
          const validStage = validStages.includes(candidate.stage) ? candidate.stage : 'applied'
          
          // Add rich interview data for candidates who have been interviewed
          let interviewData = {}
          if (validStage === 'interview-scheduled') {
            interviewData = {
              interviewed_at: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random future date within a week
              interview_remarks: null,
              interview_type: 'Video Call'
            }
          } else if (validStage === 'interview-passed') {
            interviewData = {
              interviewed_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random past date within a week
              interview_remarks: `Interview conducted successfully. Candidate demonstrated strong skills in ${candidate.skills?.slice(0, 2).join(' and ')}. Good communication skills and relevant experience. Recommended for next stage.`,
              interview_type: 'Video Call'
            }
          }
          
          // Debug logging for interview candidates
          if (validStage === 'interview-scheduled' || validStage === 'interview-passed') {
            console.log(`Candidate ${candidate.name} (${validStage}):`, {
              interviewed_at: interviewData.interviewed_at,
              interview_remarks: interviewData.interview_remarks,
              interview_type: interviewData.interview_type
            })
          }

          // Generate comprehensive stage-wise documents for all candidates
          const generateDocuments = (candidateName, stage, appliedAt, interviewedAt) => {
            const baseName = candidateName.replace(/\s+/g, '_')
            const documents = []

            // General Documents (always present)
            documents.push(
              {
                name: `${baseName}_profile_photo.jpg`,
                size: 1024 * 300, // 300KB
                type: 'image/jpeg',
                stage: 'general',
                uploaded_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
                uploaded_by: 'candidate',
                file_extension: 'jpg'
              },
              {
                name: `${baseName}_id_card.jpg`,
                size: 1024 * 250, // 250KB
                type: 'image/jpeg',
                stage: 'general',
                uploaded_at: new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000).toISOString(),
                uploaded_by: 'candidate',
                file_extension: 'jpg'
              }
            )

            // Applied Stage Documents
            documents.push(
              {
                name: `${baseName}_CV.pdf`,
                size: 1024 * 1024 * 2, // 2MB
                type: 'application/pdf',
                stage: 'applied',
                uploaded_at: appliedAt,
                uploaded_by: 'candidate',
                file_extension: 'pdf'
              },
              {
                name: `${baseName}_cover_letter.pdf`,
                size: 1024 * 512, // 512KB
                type: 'application/pdf',
                stage: 'applied',
                uploaded_at: appliedAt,
                uploaded_by: 'candidate',
                file_extension: 'pdf'
              },
              {
                name: `${baseName}_application_form.docx`,
                size: 1024 * 320, // 320KB
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                stage: 'applied',
                uploaded_at: appliedAt,
                uploaded_by: 'candidate',
                file_extension: 'docx'
              }
            )

            // Shortlisted Stage Documents (if candidate reached this stage)
            if (['shortlisted', 'interview-scheduled', 'interview-passed'].includes(stage)) {
              documents.push(
                {
                  name: `${baseName}_passport.jpg`,
                  size: 1024 * 800, // 800KB
                  type: 'image/jpeg',
                  stage: 'shortlisted',
                  uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                  uploaded_by: 'hr_team',
                  file_extension: 'jpg'
                },
                {
                  name: `${baseName}_certificates.pdf`,
                  size: 1024 * 1024 * 3, // 3MB
                  type: 'application/pdf',
                  stage: 'shortlisted',
                  uploaded_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                  uploaded_by: 'candidate',
                  file_extension: 'pdf'
                }
              )
            }

            // Interview Scheduled Stage Documents (if candidate reached this stage)
            if (['interview-scheduled', 'interview-passed'].includes(stage)) {
              documents.push(
                {
                  name: `${baseName}_interview_confirmation.pdf`,
                  size: 1024 * 128, // 128KB
                  type: 'application/pdf',
                  stage: 'interview-scheduled',
                  uploaded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                  uploaded_by: 'hr_team',
                  file_extension: 'pdf'
                },
                {
                  name: `${baseName}_pre_interview_form.docx`,
                  size: 1024 * 256, // 256KB
                  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  stage: 'interview-scheduled',
                  uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                  uploaded_by: 'candidate',
                  file_extension: 'docx'
                }
              )
            }

            // Interview Passed Stage Documents (if candidate reached this stage)
            if (stage === 'interview-passed') {
              documents.push(
                {
                  name: `${baseName}_interview_notes.pdf`,
                  size: 1024 * 400, // 400KB
                  type: 'application/pdf',
                  stage: 'interview-passed',
                  uploaded_at: interviewedAt || new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  uploaded_by: 'interviewer',
                  file_extension: 'pdf'
                },
                {
                  name: `${baseName}_skill_assessment.xlsx`,
                  size: 1024 * 180, // 180KB
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  stage: 'interview-passed',
                  uploaded_at: interviewedAt || new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                  uploaded_by: 'interviewer',
                  file_extension: 'xlsx'
                },
                {
                  name: `${baseName}_reference_check.pdf`,
                  size: 1024 * 220, // 220KB
                  type: 'application/pdf',
                  stage: 'interview-passed',
                  uploaded_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                  uploaded_by: 'hr_team',
                  file_extension: 'pdf'
                }
              )
            }

            return documents
          }

          const documents = generateDocuments(candidate.name, validStage, candidate.applied_at, interviewData.interviewed_at)
          
          return {
            ...candidate,
            stage: validStage, // Update the candidate's stage to be valid
            application: {
              id: `app_${candidate.id}`,
              stage: validStage,
              created_at: candidate.applied_at,
              job_id: jobId,
              interview_type: interviewData.interview_type || null,
              interviewed_at: interviewData.interviewed_at || null
            },
            documents: documents,
            job_title: foundJob?.title || 'Unknown Position',
            interviewed_at: interviewData.interviewed_at || null,
            interview_remarks: interviewData.interview_remarks || null
          }
        })

        // Rank candidates based on job requirements
        const ranked = rankCandidates(transformedCandidates, foundJob, { includeAnalysis: true })
        setRankedCandidates(ranked)
        setCandidates(ranked)

        // Generate insights
        const jobInsights = getRankingInsights(jobCandidates, foundJob)
        setInsights(jobInsights)

      } catch (error) {
        console.error('Error loading job shortlist data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (jobId) {
      loadData()
    }
  }, [jobId, navigate])

  const handleUpdateCandidateStatus = async (candidateId, newStage) => {
    try {
      // Update candidate status - this would be an API call
      const updatedCandidates = candidates.map(candidate => 
        candidate.id === candidateId 
          ? { 
              ...candidate, 
              stage: newStage,
              application: {
                ...candidate.application,
                stage: newStage
              }
            }
          : candidate
      )
      setCandidates(updatedCandidates)
      
      // Re-rank if needed
      const reranked = rankCandidates(updatedCandidates, job, { includeAnalysis: true })
      setRankedCandidates(reranked)
      
      console.log(`Updated candidate ${candidateId} to stage: ${newStage}`)
    } catch (error) {
      console.error('Error updating candidate status:', error)
    }
  }

  const handleScheduleInterview = async (candidateId) => {
    try {
      // Redirect to JobDetails page with shortlisted tab active
      navigate(`/jobs/${jobId}?tab=shortlisted`)
    } catch (error) {
      console.error('Error navigating to schedule interview:', error)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      
      // Find candidates who applied to this job
      const jobCandidates = candidatesData.filter(candidate => 
        candidate.applied_jobs?.includes(jobId)
      )

      // Rank candidates based on job requirements
      const ranked = rankCandidates(jobCandidates, job, { includeAnalysis: true })
      setRankedCandidates(ranked)
      setCandidates(ranked)

      // Generate insights
      const jobInsights = getRankingInsights(jobCandidates, job)
      setInsights(jobInsights)

    } catch (error) {
      console.error('Error refreshing candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{tPage('loading.shortlist')}</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{tPage('error.jobNotFound')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{tPage('error.jobNotFoundDescription')}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="btn-primary"
          >
            {tPage('error.backToJobs')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/jobs')}
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  {tPage('navigation.backToJobs')}
                </button>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-gray-600 dark:text-gray-400">{tPage('navigation.shortlist')}</span>
              </div>
              
              {/* Language Switch */}
              <LanguageSwitch 
                variant="ghost" 
                size="sm" 
                showLabel={true}
                position="bottom-right"
              />
            </div>

            {/* Job Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{job.title}</h1>
                  <span className={`chip chip-${job.status === 'published' ? 'green' : 'yellow'}`}>
                    {tPage(`jobHeader.status.${job.status}`)}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.city}, {job.country}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{tPage('jobHeader.details.postedOn', { date: formatInNepalTz(job.published_at || job.created_at, 'MMM dd, yyyy') })}</span>
                  </div>
                </div>

                {/* Job Tags */}
                {job.tags && job.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{tPage('jobHeader.details.requiredSkills')}:</span>
                    <div className="flex flex-wrap gap-1">
                      {job.tags.map((tag, index) => (
                        <span key={index} className="chip chip-primary text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center space-x-6 ml-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{candidates.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{tPage('jobHeader.stats.totalCandidates')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {insights?.topCandidates?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{tPage('jobHeader.stats.topCandidates')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {insights?.averageScore || 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{tPage('jobHeader.stats.avgScore')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      {insights && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">{tPage('insights.title')}</span>
                  <Filter className={`w-4 h-4 transition-transform ${showInsights ? 'rotate-180' : ''}`} />
                </button>
                
                {insights.recommendations.length > 0 && (
                  <div className="flex flex-wrap items-start gap-3 lg:ml-8">
                    {insights.recommendations.map((rec, index) => (
                      <div key={index} className={`flex items-start space-x-2 text-xs px-3 py-2 rounded-lg border ${
                        rec.type === 'warning' 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' 
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}>
                        <div className="flex-shrink-0 mt-0.5">
                          {rec.type === 'warning' ? <AlertCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                        </div>
                        <span className="leading-tight">{rec.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showInsights && (
                <div className="mt-4 flex flex-col lg:flex-row gap-4">
                  {/* Score Distribution */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                      {tPage('insights.scoreDistribution.title')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{tPage('insights.scoreDistribution.excellent')}:</span>
                        <span className="font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs">
                          {insights.scoreDistribution.excellent}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{tPage('insights.scoreDistribution.good')}:</span>
                        <span className="font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs">
                          {insights.scoreDistribution.good}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{tPage('insights.scoreDistribution.average')}:</span>
                        <span className="font-semibold text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-xs">
                          {insights.scoreDistribution.average}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{tPage('insights.scoreDistribution.belowAverage')}:</span>
                        <span className="font-semibold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-xs">
                          {insights.scoreDistribution.below}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Candidates */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Award className="w-4 h-4 mr-2 text-yellow-500" />
                      {tPage('insights.topCandidates.title')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {insights.topCandidates.slice(0, 3).map((candidate, index) => (
                        <div key={candidate.id} className="flex items-center space-x-2 bg-white dark:bg-gray-600 px-2 py-1 rounded border">
                          <span className="text-xs text-gray-900 dark:text-gray-100">{candidate.name}</span>
                          <span className="font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs">
                            {candidate.priority_score}%
                          </span>
                        </div>
                      ))}
                      {insights.topCandidates.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tPage('insights.topCandidates.noTopCandidates')}</p>
                      )}
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-500" />
                      {tPage('insights.skillCoverage.title')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {insights.skillGaps.slice(0, 3).map((gap, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white dark:bg-gray-600 px-2 py-1 rounded border">
                          <span className="text-xs text-gray-900 dark:text-gray-100">{gap.skill}</span>
                          <span className="font-semibold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-xs">
                            {gap.coverage}%
                          </span>
                        </div>
                      ))}
                      {insights.skillGaps.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tPage('insights.skillCoverage.goodCoverage')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CandidateShortlist
          jobId={jobId}
          candidates={rankedCandidates}
          job={job}
          onUpdateCandidateStatus={handleUpdateCandidateStatus}
          onScheduleInterview={handleScheduleInterview}
          onRefresh={handleRefresh}
          workflowStages={workflowStages}
        />
      </div>
    </div>
  )
}

export default JobShortlist