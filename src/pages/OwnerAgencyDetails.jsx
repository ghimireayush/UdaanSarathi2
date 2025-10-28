import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { agencyService } from "../services";
import {
  Briefcase,
  Users,
  FileText,
  Star,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Pagination from "../components/analytics/Pagination";

// ============================================================================
// CONSTANTS
// ============================================================================

const PIPELINE_STAGES = {
  APPLIED: "applied",
  SHORTLISTED: "shortlisted",
  INTERVIEW_SCHEDULED: "interview_scheduled",
  INTERVIEW_PASSED: "interview_passed",
  REJECTED: "rejected",
};

const STAGE_COLORS = {
  [PIPELINE_STAGES.APPLIED]: "blue",
  [PIPELINE_STAGES.SHORTLISTED]: "yellow",
  [PIPELINE_STAGES.INTERVIEW_SCHEDULED]: "purple",
  [PIPELINE_STAGES.INTERVIEW_PASSED]: "green",
  [PIPELINE_STAGES.REJECTED]: "red",
};

const STAGE_ICONS = {
  [PIPELINE_STAGES.APPLIED]: FileText,
  [PIPELINE_STAGES.SHORTLISTED]: Star,
  [PIPELINE_STAGES.INTERVIEW_SCHEDULED]: Calendar,
  [PIPELINE_STAGES.INTERVIEW_PASSED]: CheckCircle,
  [PIPELINE_STAGES.REJECTED]: XCircle,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const OwnerAgencyDetails = () => {
  const { tPageSync } = useLanguage({
    pageName: "owner-details",
    autoLoad: true,
  });
  const { agencyId } = useParams();
  const navigate = useNavigate();

  const tPage = useCallback((key, params = {}) => tPageSync(key, params), [tPageSync]);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [state, setState] = useState({
    agencies: [],
    selectedAgencyId: null,
    agencyDetails: null,
    analytics: null,
    jobs: [],
    selectedJobId: null,
    viewMode: "all", // "all", "agency", "job"
    loading: true,
    error: null,
    lastUpdated: new Date(),
  });

  // Pagination state for agency list
  const [agencyPagination, setAgencyPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });

  // Pagination state for jobs table
  const [jobPagination, setJobPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const pipelineData = useMemo(() => {
    if (!state.analytics) return [];

    const total = state.analytics.total_applications || 0;
    
    return [
      {
        stage: PIPELINE_STAGES.APPLIED,
        label: tPage("pipeline.applied"),
        count: total,
        percentage: 100,
        icon: STAGE_ICONS[PIPELINE_STAGES.APPLIED],
        color: STAGE_COLORS[PIPELINE_STAGES.APPLIED],
      },
      {
        stage: PIPELINE_STAGES.SHORTLISTED,
        label: tPage("pipeline.shortlisted"),
        count: Math.round(total * 0.35),
        percentage: 35,
        icon: STAGE_ICONS[PIPELINE_STAGES.SHORTLISTED],
        color: STAGE_COLORS[PIPELINE_STAGES.SHORTLISTED],
      },
      {
        stage: PIPELINE_STAGES.INTERVIEW_SCHEDULED,
        label: tPage("pipeline.interviewScheduled"),
        count: Math.round(total * 0.20),
        percentage: 20,
        icon: STAGE_ICONS[PIPELINE_STAGES.INTERVIEW_SCHEDULED],
        color: STAGE_COLORS[PIPELINE_STAGES.INTERVIEW_SCHEDULED],
      },
      {
        stage: PIPELINE_STAGES.INTERVIEW_PASSED,
        label: tPage("pipeline.interviewPassed"),
        count: Math.round(total * 0.12),
        percentage: 12,
        icon: STAGE_ICONS[PIPELINE_STAGES.INTERVIEW_PASSED],
        color: STAGE_COLORS[PIPELINE_STAGES.INTERVIEW_PASSED],
      },
      {
        stage: PIPELINE_STAGES.REJECTED,
        label: tPage("pipeline.rejected"),
        count: Math.round(total * 0.08),
        percentage: 8,
        icon: STAGE_ICONS[PIPELINE_STAGES.REJECTED],
        color: STAGE_COLORS[PIPELINE_STAGES.REJECTED],
      },
    ];
  }, [state.analytics, tPage]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const loadAgencies = useCallback(async () => {
    try {
      const data = await agencyService.getAllAgencies();
      setState(prev => ({ ...prev, agencies: data }));
    } catch (err) {
      console.error("Failed to load agencies:", err);
    }
  }, []);

  const loadAgencyDetails = useCallback(async (agencyId) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [details, analyticsData] = await Promise.all([
        agencyService.getAgencyById(agencyId),
        agencyService.getAgencyAnalytics(agencyId),
      ]);
      
      // Mock jobs data - in production, fetch from API
      const mockJobs = [
        { id: "job_1", title: "Construction Worker", applicants: 145, status: "active" },
        { id: "job_2", title: "Hotel Staff", applicants: 89, status: "active" },
        { id: "job_3", title: "Security Guard", applicants: 67, status: "active" },
        { id: "job_4", title: "Domestic Helper", applicants: 234, status: "active" },
        { id: "job_5", title: "Factory Worker", applicants: 123, status: "closed" },
      ];
      
      setState(prev => ({
        ...prev,
        agencyDetails: details,
        analytics: analyticsData,
        jobs: mockJobs,
        loading: false,
        viewMode: "agency",
        lastUpdated: new Date(),
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message,
        loading: false,
      }));
    }
  }, []);

  const loadAllAgenciesAnalytics = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const platformStats = await agencyService.getPlatformStatistics();
      
      setState(prev => ({
        ...prev,
        analytics: {
          total_jobs: platformStats.total_jobs,
          total_applications: platformStats.total_applications,
        },
        agencyDetails: null,
        selectedAgencyId: null,
        selectedJobId: null,
        viewMode: "all",
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.message,
        loading: false,
      }));
    }
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleBackToList = useCallback(() => {
    navigate("/owner/analytics");
  }, [navigate]);

  const handleJobSelect = useCallback((jobId) => {
    setState(prev => ({ 
      ...prev, 
      selectedJobId: jobId,
      viewMode: "job"
    }));
  }, []);

  const handleBackToAgency = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      selectedJobId: null,
      viewMode: "agency"
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    if (state.viewMode === "all") {
      loadAllAgenciesAnalytics();
    } else if (state.selectedAgencyId) {
      loadAgencyDetails(state.selectedAgencyId);
    }
  }, [state.viewMode, state.selectedAgencyId, loadAgencyDetails, loadAllAgenciesAnalytics]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  useEffect(() => {
    if (agencyId) {
      setState(prev => ({ ...prev, selectedAgencyId: agencyId }));
      loadAgencyDetails(agencyId);
    } else {
      navigate("/owner/analytics");
    }
  }, [agencyId, loadAgencyDetails, navigate]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const formatLastUpdated = useCallback(() => {
    const now = new Date();
    const diff = Math.floor((now - state.lastUpdated) / 1000);
    
    if (diff < 60) return tPage("lastUpdated.justNow");
    if (diff < 3600) return tPage("lastUpdated.minutesAgo", { count: Math.floor(diff / 60) });
    return tPage("lastUpdated.hoursAgo", { count: Math.floor(diff / 3600) });
  }, [state.lastUpdated, tPage]);

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (state.loading) {
    return <LoadingDetailState tPage={tPage} />;
  }

  if (state.error) {
    return <ErrorDetailState error={state.error} onRetry={handleRefresh} tPage={tPage} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-2"
          >
            <ArrowLeft className="h-5 w-5" />
            {tPage("backToList")}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {state.agencyDetails?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {state.agencyDetails?.license_number}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              state.agencyDetails?.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {state.agencyDetails?.status}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatLastUpdated()}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label={tPage("refresh")}
          >
            <RefreshCw className="h-4 w-4" />
            {tPage("refresh")}
          </button>
        </div>
      </div>

      {/* Content */}
      {state.viewMode === "job" ? (
        <JobDetailView
          job={state.jobs.find((j) => j.id === state.selectedJobId)}
          onBack={handleBackToAgency}
          tPage={tPage}
        />
      ) : (
        <div className="space-y-6">
          {/* Main Statistics */}
          <StatisticsGrid 
            analytics={state.analytics} 
            agencyDetails={state.agencyDetails}
            tPage={tPage} 
          />

          {/* Pipeline Breakdown */}
          <PipelineSection pipelineData={pipelineData} tPage={tPage} />

          {/* Job Breakdown */}
          <JobBreakdownSection
            jobs={state.jobs}
            onJobSelect={handleJobSelect}
            tPage={tPage}
            pagination={jobPagination}
            onPaginationChange={setJobPagination}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const AgencyList = ({ agencies, selectedId, onSelect, tPage, pagination, onPaginationChange }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAgencies = useMemo(() => {
    if (!searchTerm) return agencies;
    const search = searchTerm.toLowerCase();
    return agencies.filter(
      (agency) =>
        agency.name.toLowerCase().includes(search) ||
        agency.license_number.toLowerCase().includes(search)
    );
  }, [agencies, searchTerm]);

  // Paginated agencies
  const paginatedAgencies = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredAgencies.slice(startIndex, endIndex);
  }, [filteredAgencies, pagination]);

  const totalPages = Math.ceil(filteredAgencies.length / pagination.itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    onPaginationChange({ ...pagination, currentPage: 1 });
  }, [searchTerm]);

  return (
    <Card className="sticky top-6 flex flex-col" style={{ maxHeight: "calc(100vh - 120px)" }}>
      <CardHeader>
        <CardTitle className="text-lg">{tPage("agencyList.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={tPage("agencyList.search")}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Agency List */}
        <div className="flex-1 overflow-y-auto">
          {filteredAgencies.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {tPage("agencyList.noResults")}
            </div>
          ) : (
            <div className="space-y-1 px-2 pb-2">
              {paginatedAgencies.map((agency) => (
                <button
                  key={agency.id}
                  onClick={() => onSelect(agency.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    selectedId === agency.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold flex-shrink-0">
                      {agency.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          selectedId === agency.id
                            ? "text-blue-900 dark:text-blue-300"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        {agency.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {agency.license_number}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            agency.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {agency.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {agency.statistics?.total_jobs || 0} jobs
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredAgencies.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={totalPages}
              totalItems={filteredAgencies.length}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={(page) => onPaginationChange({ ...pagination, currentPage: page })}
              onItemsPerPageChange={(size) =>
                onPaginationChange({ currentPage: 1, itemsPerPage: size })
              }
              pageSizeOptions={[5, 10, 20]}
              showPageJumper={false}
              showItemCount={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatisticsGrid = ({ analytics, agencyDetails, tPage }) => {
  const teamMembers = agencyDetails?.team_members;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <JobsStatCard analytics={analytics} tPage={tPage} />
      <ApplicantsStatCard analytics={analytics} tPage={tPage} />
      {teamMembers && (
        <TeamMembersCard teamMembers={teamMembers} tPage={tPage} />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, subtitle, color, bgColor }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </p>
          <p className={`text-4xl font-bold ${color} mb-1`}>
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const JobsStatCard = ({ analytics, tPage }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {tPage("stats.totalJobs")}
          </p>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {(analytics?.total_jobs || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tPage("stats.totalJobsSubtitle")}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      {/* Jobs Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.totalJobsLifetime")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.total_jobs || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.activeJobs")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.active_jobs || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.draftJobs")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.draft_jobs || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ApplicantsStatCard = ({ analytics, tPage }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {tPage("stats.totalApplicants")}
          </p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
            {(analytics?.total_applications || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tPage("stats.totalApplicantsSubtitle")}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      </div>
      
      {/* Applicants Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.lifetimeApplicants")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.total_applications || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.activeApplicants")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.active_applicants || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const TeamMembersCard = ({ teamMembers, tPage }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {tPage("stats.totalMembers")}
          </p>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {teamMembers.total}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tPage("stats.totalMembersSubtitle")}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
      
      {/* Role Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.adminRole")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {teamMembers.admin}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.recipientRole")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {teamMembers.recipient}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.coordinatorRole")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {teamMembers.interview_coordinator}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

const PipelineSection = ({ pipelineData, tPage }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-brand-blue-bright" />
        {tPage("pipeline.title")}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {pipelineData.map((stage) => (
          <PipelineStageCard key={stage.stage} stage={stage} />
        ))}
      </div>

      {/* Funnel Visualization */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          {tPage("pipeline.funnelView")}
        </h3>
        <div className="space-y-2">
          {pipelineData.slice(0, 4).map((stage, index) => (
            <FunnelBar
              key={stage.stage}
              stage={stage}
              isFirst={index === 0}
            />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const PipelineStageCard = ({ stage }) => {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-300",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300",
    green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-300",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300",
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[stage.color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <stage.icon className="h-5 w-5" />
        <p className="text-sm font-medium">{stage.label}</p>
      </div>
      <p className="text-3xl font-bold mb-1">{stage.count.toLocaleString()}</p>
    </div>
  );
};

const FunnelBar = ({ stage, isFirst }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-32 text-sm text-gray-700 dark:text-gray-300 truncate">
        {stage.label}
      </div>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
        <div
          className={`h-full ${colorClasses[stage.color]} flex items-center justify-end pr-3 text-white text-sm font-medium transition-all duration-500`}
          style={{ width: `${isFirst ? 100 : stage.percentage}%` }}
        >
          {stage.count.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

const JobBreakdownSection = ({ jobs, onJobSelect, tPage, pagination, onPaginationChange }) => {
  const paginatedJobs = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return jobs.slice(startIndex, endIndex);
  }, [jobs, pagination]);

  const totalPages = Math.ceil(jobs.length / pagination.itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tPage("jobs.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tPage("jobs.jobTitle")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tPage("jobs.applicants")}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tPage("jobs.status")}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tPage("jobs.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No jobs found
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {job.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {job.applicants}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          job.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onJobSelect(job.id)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {tPage("jobs.viewDetails")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {jobs.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            totalItems={jobs.length}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={(page) => onPaginationChange({ ...pagination, currentPage: page })}
            onItemsPerPageChange={(size) =>
              onPaginationChange({ currentPage: 1, itemsPerPage: size })
            }
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </CardContent>
    </Card>
  );
};

const AllAgenciesView = ({ analytics, tPage, pipelineData }) => (
  <div className="space-y-6">
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {tPage("allAgencies.title")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {tPage("allAgencies.description")}
        </p>
      </CardContent>
    </Card>

    <StatisticsGrid analytics={analytics} tPage={tPage} />
    <PipelineSection pipelineData={pipelineData} tPage={tPage} />
  </div>
);

const JobDetailView = ({ job, onBack, tPage }) => {
  if (!job) return null;

  // Mock job-specific pipeline data
  const jobPipelineData = [
    { stage: "applied", label: tPage("pipeline.applied"), count: job.applicants, percentage: 100, icon: FileText, color: "blue" },
    { stage: "shortlisted", label: tPage("pipeline.shortlisted"), count: Math.round(job.applicants * 0.4), percentage: 40, icon: Star, color: "yellow" },
    { stage: "interview_scheduled", label: tPage("pipeline.interviewScheduled"), count: Math.round(job.applicants * 0.25), percentage: 25, icon: Calendar, color: "purple" },
    { stage: "interview_passed", label: tPage("pipeline.interviewPassed"), count: Math.round(job.applicants * 0.15), percentage: 15, icon: CheckCircle, color: "green" },
    { stage: "rejected", label: tPage("pipeline.rejected"), count: Math.round(job.applicants * 0.10), percentage: 10, icon: XCircle, color: "red" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {tPage("jobs.backToAgency")}
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {job.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {job.applicants} {tPage("jobs.totalApplicants")}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              job.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
            }`}>
              {job.status}
            </span>
          </div>
        </CardContent>
      </Card>

      <PipelineSection pipelineData={jobPipelineData} tPage={tPage} />
    </div>
  );
};

// ============================================================================
// DETAIL PANEL STATES
// ============================================================================

const EmptyDetailState = ({ tPage }) => (
  <Card>
    <CardContent className="p-12 text-center">
      <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {tPage("selectAgency.title")}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {tPage("selectAgency.description")}
      </p>
    </CardContent>
  </Card>
);

const LoadingDetailState = ({ tPage }) => (
  <Card>
    <CardContent className="p-12">
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {tPage("loading")}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ErrorDetailState = ({ error, onRetry, tPage }) => (
  <Card>
    <CardContent className="p-12">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
        <p className="text-red-800 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {tPage("retry")}
        </button>
      </div>
    </CardContent>
  </Card>
);

export default OwnerAgencyDetails;
