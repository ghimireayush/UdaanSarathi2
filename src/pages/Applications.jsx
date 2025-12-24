import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Users,
  MapPin,
  Calendar,
  Eye,
  UserCheck,
  X,
  ChevronDown,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  Star,
  MoreVertical,
  ArrowRight,
  Download,
  GraduationCap,
  Briefcase,
  Home,
  Heart,
  List,
  Grid3X3,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  applicationService,
  jobService,
  constantsService,
} from "../services/index.js";
import CandidateDataSource from "../api/datasources/CandidateDataSource.js";
import stageTransitionService from "../services/stageTransitionService.js";
import InterviewScheduleDialog from "../components/InterviewScheduleDialog.jsx";
import { format } from "date-fns";
import performanceService from "../services/performanceService";
import { useAccessibility } from "../hooks/useAccessibility";
import { useLanguage } from "../hooks/useLanguage";
import { useAgency } from "../contexts/AgencyContext.jsx";
import {
  InteractiveButton,
  InteractiveCard,
} from "../components/InteractiveUI";
import { useNotificationContext } from "../contexts/NotificationContext";
import { useConfirm } from "../components/ConfirmProvider.jsx";
import CandidateSummaryS2 from "../components/CandidateSummaryS2.jsx";
import LanguageSwitch from "../components/LanguageSwitch";
import { usePagination } from "../hooks/usePagination.js";
import PaginationWrapper from "../components/PaginationWrapper.jsx";

const Applications = () => {
  const { confirm } = useConfirm();
  const { agencyData } = useAgency();

  const [filters, setFilters] = useState({
    search: "",
    stage: "",
    country: "",
    jobId: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50, // Optimized for 10k+ records
    total: 0,
    totalPages: 0,
  });

  // Data state - declare first to avoid temporal dead zone
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applicationStages, setApplicationStages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStage, setNewStage] = useState("");
  
  // Interview scheduling dialog
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [selectedForInterview, setSelectedForInterview] = useState(null);

  // Client-side pagination for better UX (can be switched to server-side if needed)
  const {
    currentData: paginatedApplications,
    currentPage,
    totalPages: clientTotalPages,
    totalItems,
    itemsPerPage,
    itemsPerPageOptions,
    goToPage,
    changeItemsPerPage,
    resetPagination,
  } = usePagination(applications, {
    initialItemsPerPage: 25,
    itemsPerPageOptions: [10, 25, 50, 100],
  });
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const [loadTime, setLoadTime] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'grid' or 'list'
  const headerCheckboxRef = useRef(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      const selectable = applications.filter(
        (app) => app.stage !== applicationStages.REJECTED
      );
      headerCheckboxRef.current.indeterminate =
        selectedApplications.size > 0 &&
        selectedApplications.size < selectable.length;
    }
  }, [selectedApplications, applications, applicationStages]);

  // Toast notification states
  const [showToast, setShowToast] = useState(false);

  // Workflow stages configuration - updated to use only 4 stages
  const workflowStages = [
    { id: "applied", label: "Applied" },
    { id: "shortlisted", label: "Shortlisted" },
    { id: "interview-scheduled", label: "Interview Scheduled" },
    { id: "interview-passed", label: "Interview Passed" },
  ];
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // 'success', 'error', 'info'

  // Additional state for bulk rejection modal
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");

  // Individual action loading states
  const [shortlistingApps, setShortlistingApps] = useState(new Set());
  const [rejectingApps, setRejectingApps] = useState(new Set());
  const [movingStageApps, setMovingStageApps] = useState(new Set());

  // Accessibility and i18n hooks
  const { containerRef, setupRightPaneNavigation, announce } =
    useAccessibility();
  const { t, tPageSync, formatDate, formatNumber, locale } = useLanguage({
    pageName: "applications",
    autoLoad: true,
  });
  const { success, error: notifyError, info } = useNotificationContext();

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params);
  };

  // Toast notification function
  const showToastNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    // Auto-hide after 4 seconds for success, 5 seconds for error
    const delay = type === "error" ? 5000 : 4000;
    setTimeout(() => {
      setShowToast(false);
    }, delay);
  };

  // Debounced search to reduce API calls
  const debouncedSearch = useMemo(
    () =>
      performanceService.debounce((searchTerm) => {
        setFilters((prev) => ({ ...prev, search: searchTerm }));
        setPagination((prev) => ({ ...prev, page: 1 }));
      }, 300),
    []
  );

  // Fetch applications data using service with performance optimization
  const fetchApplicationsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const startTime = performance.now();

      const paginationParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        stage: filters.stage,
        country: filters.country,
        jobId: filters.jobId,
        sortBy: "applied_at",
        sortOrder: "desc",
      };

      console.log("Fetching applications with filters:", paginationParams);

      const applicationsResult =
        await applicationService.getApplicationsPaginated(paginationParams);
      console.log("Applications result:", applicationsResult);
      const [jobsData, stagesData] = await Promise.all([
        jobService.getJobs({ status: "published" }),
        constantsService.getApplicationStages(),
      ]);

      const applications = applicationsResult.data || applicationsResult;
      const total = applicationsResult.total || applications.length;

      // Ensure arrays are always arrays
      const safeApplications = Array.isArray(applications) ? applications : [];
      const safeJobsData = Array.isArray(jobsData) ? jobsData : [];

      setApplications(safeApplications);
      setPagination((prevPagination) => ({
        ...prevPagination,
        total: total,
        totalPages: Math.ceil(total / prevPagination.limit),
      }));

      console.log("Pagination updated:", {
        total,
        totalPages: Math.ceil(total / pagination.limit),
        limit: pagination.limit,
      });
      setJobs(safeJobsData);
      setApplicationStages(stagesData);

      const endTime = performance.now();
      const loadTime = endTime - startTime;
      setLoadTime(loadTime);

      announce(
        t("applications.loaded", {
          count: applicationsResult.data?.length || applicationsResult.length,
          time: Math.round(loadTime),
        })
      );
    } catch (err) {
      console.error("Failed to fetch applications data:", err);
      setError(err);
      // Set empty arrays on error to prevent crashes
      setApplications([]);
      setJobs([]);
      announce(t("common.error"), "assertive");
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filters.search,
    filters.stage,
    filters.country,
    filters.jobId,
    t,
    announce,
  ]);

  useEffect(() => {
    fetchApplicationsData();
  }, [fetchApplicationsData]);

  // Track online/offline to improve UX and auto-retry when back online
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error) {
        // Auto-retry after coming back online
        fetchApplicationsData();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [error, fetchApplicationsData]);

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isSidebarOpen) {
        handleCloseSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  const handleFilterChange = useCallback(
    (key, value) => {
      if (key === "search") {
        debouncedSearch(value);
      } else {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
        resetPagination(); // Reset client-side pagination
      }
    },
    [debouncedSearch]
  );

  const handlePageChange = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleApplicationSelect = (applicationId) => {
    // Find the application to check if it's rejected
    const application = applications.find((app) => app.id === applicationId);
    if (application && application.stage === applicationStages.REJECTED) {
      // Don't allow selection of rejected applications
      return;
    }

    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const handleUpdateStage = async (
    applicationId,
    targetStage,
    reason = null
  ) => {
    try {
      // Set the appropriate loading state
      if (targetStage === applicationStages.REJECTED) {
        setRejectingApps((prev) => new Set([...prev, applicationId]));
      } else {
        setMovingStageApps((prev) => new Set([...prev, applicationId]));
      }

      // Perform the actual API call first
      if (targetStage === applicationStages.REJECTED && reason) {
        await applicationService.rejectApplication(applicationId, reason);
        showToastNotification(
          tPage("toastMessages.applicationRejectedSuccess"),
          "success"
        );
      } else {
        await applicationService.updateApplicationStage(
          applicationId,
          targetStage
        );
        const stageLabel = getStageLabel(targetStage);
        showToastNotification(
          tPage("toastMessages.applicationMovedSuccess", { stage: stageLabel }),
          "success"
        );
      }

      // Only update UI after successful API call
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                stage: targetStage,
                updated_at: new Date().toISOString(),
              }
            : app
        )
      );

      // Close modals
      setShowStageModal(false);
      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectionReason("");
      setNewStage("");
    } catch (err) {
      console.error("Failed to update application stage:", err);
      showToastNotification(
        " Failed to update application stage. Please try again.",
        "error"
      );
    } finally {
      // Clear the appropriate loading state
      if (targetStage === applicationStages.REJECTED) {
        setRejectingApps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(applicationId);
          return newSet;
        });
      } else {
        setMovingStageApps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(applicationId);
          return newSet;
        });
      }
    }
  };

  const handleOpenStageModal = (application, stage) => {
    setSelectedApplication(application);
    setNewStage(stage);
    if (stage === applicationStages.REJECTED) {
      setShowRejectModal(true);
    } else {
      setShowStageModal(true);
    }
  };

  const handleToggleShortlist = async (application) => {
    try {
      setShortlistingApps((prev) => new Set([...prev, application.id]));

      const isCurrentlyShortlisted =
        application.stage === applicationStages.SHORTLISTED;
      const targetStage = isCurrentlyShortlisted
        ? applicationStages.APPLIED
        : applicationStages.SHORTLISTED;

      // Perform the actual API call first
      await applicationService.updateApplicationStage(
        application.id,
        targetStage
      );

      // Update UI after successful API call
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          app.id === application.id
            ? {
                ...app,
                stage: targetStage,
                updated_at: new Date().toISOString(),
              }
            : app
        )
      );

      // Show success notification
      if (isCurrentlyShortlisted) {
        showToastNotification(
          tPage("toastMessages.candidateRemovedFromShortlist"),
          "success"
        );
      } else {
        showToastNotification(
          tPage("toastMessages.candidateShortlistedSuccess"),
          "success"
        );
      }
    } catch (err) {
      console.error("Failed to toggle shortlist:", err);
      showToastNotification(
        tPage("toastMessages.toggleShortlistError"),
        "error"
      );
    } finally {
      setShortlistingApps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(application.id);
        return newSet;
      });
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedApplications.size === 0) return;

    // For bulk rejection, show modal to get reason
    if (action === "reject") {
      setShowBulkRejectModal(true);
      return;
    }

    try {
      setIsUpdating(true);
      const applicationIds = Array.from(selectedApplications);

      if (action === "shortlist") {
        // Process each application individually for better tracking
        for (const appId of applicationIds) {
          await applicationService.updateApplicationStage(
            appId,
            applicationStages.SHORTLISTED
          );
        }

        // Update UI after successful API calls
        setApplications((prevApplications) =>
          prevApplications.map((app) =>
            applicationIds.includes(app.id)
              ? {
                  ...app,
                  stage: applicationStages.SHORTLISTED,
                  updated_at: new Date().toISOString(),
                }
              : app
          )
        );

        showToastNotification(
          tPage("toastMessages.bulkShortlistSuccess", {
            count: applicationIds.length,
          }),
          "success"
        );
      }

      setSelectedApplications(new Set());
    } catch (err) {
      console.error("Failed to perform bulk action:", err);
      showToastNotification(tPage("toastMessages.bulkActionError"), "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCandidateClick = (candidateOrApplication) => {
    // Just pass the candidate object - CandidateSummaryS2 will fetch enriched data if it has application.id
    let candidate = candidateOrApplication;
    
    // If it's an application object, extract the candidate
    if (candidateOrApplication.candidate) {
      candidate = candidateOrApplication.candidate;
      // Ensure application ID is attached to candidate
      if (!candidate.application) {
        candidate.application = { id: candidateOrApplication.id };
      }
    }
    
    setSelectedCandidate(candidate);
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedCandidate(null);
  };

  // Define strict stage progression rules - updated for 4 stages
  const getNextAllowedStage = (currentStage) => {
    const stageOrder = {
      applied: "shortlisted",
      shortlisted: "interview-scheduled",
      "interview-scheduled": "interview-passed",
      "interview-passed": null, // Final stage
    };
    return stageOrder[currentStage];
  };

  const validateStageTransition = (currentStage, targetStage) => {
    // Only allow progression to the immediate next stage
    const nextAllowed = getNextAllowedStage(currentStage);
    return targetStage === nextAllowed;
  };

  const handleUpdateStatus = async (candidateId, newStage) => {
    try {
      const candidate = applications.find(
        (app) => app.candidate.id === candidateId
      )?.candidate;
      if (!candidate) return;

      const currentStage = candidate.application?.stage;

      // Prevent any backward flow or skipping stages
      if (!validateStageTransition(currentStage, newStage)) {
        await confirm({
          title: "Invalid Stage Transition",
          message: `You cannot move directly from "${
            workflowStages.find((s) => s.id === currentStage)?.label
          }" to "${
            workflowStages.find((s) => s.id === newStage)?.label
          }". Please follow the proper workflow sequence.`,
          confirmText: "Okay",
          type: "warning",
        });
        return;
      }

      // Show confirmation dialog for valid transitions
      const currentStageLabel = workflowStages.find(
        (s) => s.id === currentStage
      )?.label;
      const newStageLabel = workflowStages.find(
        (s) => s.id === newStage
      )?.label;

      const confirmed = await confirm({
        title: "Confirm Stage Update",
        message: `Are you sure you want to move this candidate from "${currentStageLabel}" to "${newStageLabel}"? This action cannot be undone.`,
        confirmText: "Yes, Update Stage",
        cancelText: "Cancel",
        type: "warning",
      });

      if (confirmed) {
        await applicationService.updateApplicationStage(
          candidate.application.id,
          newStage
        );
        await fetchApplicationsData(); // Reload data
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      await confirm({
        title: "Error",
        message: "Failed to update candidate status. Please try again.",
        confirmText: "Okay",
        type: "danger",
      });
    }
  };

  const handleAttachDocument = async (candidateId, document) => {
    try {
      const confirmed = await confirm({
        title: "Confirm Document Attachment",
        message: `Are you sure you want to attach the document "${document.name}" to this candidate?`,
        confirmText: "Yes, Attach",
        cancelText: "Cancel",
        type: "info",
      });

      if (confirmed) {
        await applicationService.attachDocument(candidateId, document);
        await fetchApplicationsData(); // Reload data

        // Update the selected candidate to reflect the new document
        if (selectedCandidate && selectedCandidate.id === candidateId) {
          // Get the updated application data for this candidate
          const updatedApplications =
            await applicationService.getApplicationsByCandidateId(candidateId);
          if (updatedApplications && updatedApplications.length > 0) {
            const updatedApplication = updatedApplications[0]; // Get the first (and likely only) application
            setSelectedCandidate({
              ...selectedCandidate,
              application: updatedApplication,
              documents: updatedApplication.documents,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to attach document:", error);
      await confirm({
        title: "Error",
        message: "Failed to attach document. Please try again.",
        confirmText: "Okay",
        type: "danger",
      });
    }
  };

  const handleRemoveDocument = async (candidateId, docIndex) => {
    try {
      // Pass only the candidateId and docIndex (stage parameter is no longer needed)
      await applicationService.removeDocument(candidateId, docIndex);
      await fetchApplicationsData(); // Reload data

      // Update the selected candidate to reflect the removed document
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        // Get the updated application data for this candidate
        const updatedApplications =
          await applicationService.getApplicationsByCandidateId(candidateId);
        if (updatedApplications && updatedApplications.length > 0) {
          const updatedApplication = updatedApplications[0]; // Get the first (and likely only) application
          setSelectedCandidate({
            ...selectedCandidate,
            application: updatedApplication,
            documents: updatedApplication.documents,
          });
        }
      }
    } catch (error) {
      console.error("Failed to remove document:", error);
      await confirm({
        title: "Error",
        message: "Failed to remove document. Please try again.",
        confirmText: "Okay",
        type: "danger",
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedApplications.size === 0 || !bulkRejectionReason.trim()) return;

    try {
      setIsUpdating(true);
      const applicationIds = Array.from(selectedApplications);

      // Process each rejection individually with the reason
      for (const appId of applicationIds) {
        await applicationService.rejectApplication(appId, bulkRejectionReason);
      }

      // Update UI after successful API calls
      setApplications((prevApplications) =>
        prevApplications.map((app) =>
          applicationIds.includes(app.id)
            ? {
                ...app,
                stage: applicationStages.REJECTED,
                updated_at: new Date().toISOString(),
              }
            : app
        )
      );

      showToastNotification(
        tPage("toastMessages.bulkRejectSuccess", {
          count: applicationIds.length,
        }),
        "success"
      );
      setSelectedApplications(new Set());

      // Close modal and reset
      setShowBulkRejectModal(false);
      setBulkRejectionReason("");
    } catch (err) {
      console.error("Failed to perform bulk rejection:", err);
      showToastNotification(tPage("toastMessages.bulkRejectError"), "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStageColor = (stage) => {
    const stageColors = {
      [applicationStages.APPLIED]: "chip-blue",
      [applicationStages.SHORTLISTED]: "chip-yellow",
      [applicationStages.INTERVIEW_SCHEDULED]: "chip-purple",
      [applicationStages.INTERVIEW_PASSED]: "chip-green",
    };
    return stageColors[stage] || "chip-blue";
  };

  const getStageLabel = (stage) => {
    return constantsService.getApplicationStageLabel(stage);
  };

  const safeJobs = Array.isArray(jobs) ? jobs : []
  const countries = [...new Set(safeJobs.map((job) => job.country))];

  // Loading state
  if (isLoading && applications.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6 sm:mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-3 sm:p-4 md:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="card p-4 sm:p-6 md:p-8 text-center">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {tPage("error.failedToLoad")}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            {!isOnline
              ? tPage("error.networkError")
              : error.message || tPage("error.failedToLoad")}
          </p>
          <button onClick={fetchApplicationsData} className="btn-primary text-sm">
            {tPage("error.retry")}
          </button>
        </div>
      </div>
    );
  }

  // Handle select all applications (excluding rejected ones)
  const handleSelectAll = () => {
    const selectableApplications = applications.filter(
      (app) => app.stage !== applicationStages.REJECTED
    );

    if (selectedApplications.size === selectableApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(
        new Set(selectableApplications.map((application) => application.id))
      );
    }
  };

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {paginatedApplications.length > 0 ? (
        paginatedApplications.map((application) => (
          <InteractiveCard
            key={application.id}
            hoverable
            clickable
            className="p-3 sm:p-4 md:p-6 border-l-4 border-primary-500"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <span
                className={`chip ${getStageColor(application.stage)} text-xs`}
              >
                {getStageLabel(application.stage)}
              </span>
            </div>

            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm sm:text-lg font-medium text-primary-600 dark:text-primary-400">
                  {application.candidate?.name?.charAt(0) || "U"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                  {application.candidate?.name ||
                    tPage("gridView.unknownCandidate")}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {tPage("gridView.appliedFor")}{" "}
                  <Link
                    to={`/jobs/${application.job?.id}`}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                  >
                    {application.job?.title || tPage("gridView.unknownJob")}
                  </Link>
                </p>

                <div className="space-y-1 sm:space-y-2">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-2 truncate">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-primary-400 dark:text-primary-500 flex-shrink-0" />
                    <span className="truncate">
                      {application.candidate?.phone ||
                        tPage("gridView.notAvailable")}
                    </span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-2 truncate">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-primary-400 dark:text-primary-500 flex-shrink-0" />
                    <span className="truncate">
                      {application.candidate?.email ||
                        tPage("gridView.notAvailable")}
                    </span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-2 truncate">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary-400 dark:text-primary-500 flex-shrink-0" />
                    <span className="truncate">
                      {application.job?.country ||
                        tPage("gridView.notAvailable")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs font-medium mb-3 sm:mb-4 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 dark:text-gray-400 truncate">
                {application.applied_at
                  ? tPage("gridView.appliedDate", {
                      date: format(
                        new Date(application.applied_at),
                        "MMM dd, yyyy"
                      ),
                    })
                  : tPage("gridView.unknownDate")}
              </span>
            </div>

            {/* Skills */}
            {application.candidate?.skills && (
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {application.candidate.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600 truncate"
                    >
                      {skill}
                    </span>
                  ))}
                  {application.candidate.skills.length > 3 && (
                    <span className="text-xs text-primary-500 font-medium">
                      {tPage("gridView.moreSkills", {
                        count: application.candidate.skills.length - 3,
                      })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-2">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-primary-400 dark:text-primary-500 flex-shrink-0" />
                  <span className="truncate">
                    {tPage("gridView.documentsAttached", {
                      count: application.documents.length,
                      plural: application.documents.length !== 1 ? "s" : "",
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 sm:pt-4">
              {application.stage === applicationStages.REJECTED ? (
                // Show disabled state for rejected applications
                <div className="flex flex-col gap-2">
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-center font-medium">
                    {tPage("gridView.applicationRejected")}
                  </div>
                  <InteractiveButton
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCandidateClick(application);
                    }}
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-600 text-xs sm:text-sm"
                  >
                    {tPage("actions.viewSummary")}
                  </InteractiveButton>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <InteractiveButton
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCandidateClick(application);
                    }}
                    variant="ghost"
                    size="sm"
                    icon={Eye}
                    className="w-full shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 dark:border-gray-600 text-xs sm:text-sm"
                  >
                    {tPage("actions.summary")}
                  </InteractiveButton>

                  {/* Move and Reject buttons removed - use CandidateSummaryS2 for stage transitions */}
                </div>
              )}
            </div>
          </InteractiveCard>
        ))
      ) : (
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-8 sm:py-12">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
            {tPage("messages.noApplicationsFound")}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {tPage("messages.noApplicationsMessage")}
          </p>
        </div>
      )}
    </div>
  );

  // Render list view - with mobile card view
  const renderListView = () => (
    <>
      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {paginatedApplications.length > 0 ? (
          paginatedApplications.map((application) => (
            <div
              key={application.id}
              className="card p-4 hover:shadow-md transition-all active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer"
              onClick={() => handleCandidateClick(application)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCandidateClick(application)
                }
              }}
            >
              {/* Header: Avatar, Name, Stage */}
              <div className="flex items-start gap-3 mb-3">
                {/* Checkbox - stop propagation */}
                <div onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedApplications.has(application.id)}
                    onChange={() => handleApplicationSelect(application.id)}
                    disabled={application.stage === applicationStages.REJECTED}
                    className={`rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1 ${
                      application.stage === applicationStages.REJECTED
                        ? "opacity-30 cursor-not-allowed"
                        : ""
                    }`}
                  />
                </div>
                
                {/* Avatar */}
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-semibold text-white">
                    {application.candidate?.name?.charAt(0) || "U"}
                  </span>
                </div>
                
                {/* Name & Job */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {application.candidate?.name || tPage("gridView.unknownCandidate")}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {application.job?.title || tPage("gridView.unknownJob")}
                  </p>
                </div>
                
                {/* Stage Badge */}
                <span className={`chip ${getStageColor(application.stage)} text-xs px-2 py-0.5 flex-shrink-0`}>
                  {getStageLabel(application.stage)}
                </span>
              </div>
              
              {/* Info Row: Contact & Date */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3 pl-[52px]">
                {application.candidate?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span className="truncate max-w-[100px]">{application.candidate.phone}</span>
                  </div>
                )}
                {application.job?.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{application.job.country}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>
                    {application.applied_at
                      ? format(new Date(application.applied_at), "MMM dd")
                      : tPage("gridView.notAvailable")}
                  </span>
                </div>
              </div>
              
              {/* Skills & Documents */}
              {(application.candidate?.skills?.length > 0 || application.documents?.length > 0) && (
                <div className="flex items-center gap-2 pl-[52px] mb-3">
                  {application.candidate?.skills?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Briefcase className="w-3 h-3" />
                      <span>{application.candidate.skills.slice(0, 2).join(", ")}</span>
                      {application.candidate.skills.length > 2 && (
                        <span className="text-primary-500">+{application.candidate.skills.length - 2}</span>
                      )}
                    </div>
                  )}
                  {application.documents?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <FileText className="w-3 h-3" />
                      <span>{application.documents.length}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action hint */}
              <div className="flex items-center justify-end text-xs text-gray-400 dark:text-gray-500">
                <span>Tap to view details</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
              {tPage("messages.noApplicationsFound")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {tPage("messages.noApplicationsMessage")}
            </p>
          </div>
        )}
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="w-12 px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      applications.filter(
                        (app) => app.stage !== applicationStages.REJECTED
                      ).length > 0 &&
                      selectedApplications.size ===
                        applications.filter(
                          (app) => app.stage !== applicationStages.REJECTED
                        ).length
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {tPage("table.headers.candidate")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {tPage("table.headers.job")}
                </th>
                <th
                  scope="col"
                  className="hidden lg:table-cell px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {tPage("table.headers.contact")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {tPage("table.headers.date")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {tPage("table.headers.stage")}
                </th>
                <th
                  scope="col"
                  className="px-3 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {tPage("table.headers.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedApplications.length > 0 ? (
                paginatedApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleCandidateClick(application)}
                  >
                    <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedApplications.has(application.id)}
                        onChange={() => handleApplicationSelect(application.id)}
                        disabled={
                          application.stage === applicationStages.REJECTED
                        }
                        className={`rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                          application.stage === applicationStages.REJECTED
                            ? "opacity-30 cursor-not-allowed"
                            : ""
                        }`}
                        title={
                          application.stage === applicationStages.REJECTED
                            ? "Rejected applications cannot be selected"
                            : ""
                        }
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9">
                          <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {application.candidate?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {application.candidate?.name ||
                              tPage("gridView.unknownCandidate")}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {application.candidate?.skills && (
                              <div className="text-gray-500 dark:text-gray-400 truncate">
                                {application.candidate.skills
                                  .slice(0, 1)
                                  .join(", ")}
                                {application.candidate.skills.length > 1 &&
                                  ` +${application.candidate.skills.length - 1}`}
                              </div>
                            )}
                            {application.documents &&
                              application.documents.length > 0 && (
                                <div className="flex items-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                  <FileText className="w-3 h-3 mr-0.5" />
                                  <span>{application.documents.length}</span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        <Link
                          to={`/jobs/${application.job?.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        >
                          {application.job?.title || tPage("gridView.unknownJob")}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {application.job?.company ||
                          tPage("listView.unknownCompany")}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3">
                      <div className="text-xs text-gray-900 dark:text-gray-100 truncate">
                        {application.candidate?.phone ||
                          tPage("gridView.notAvailable")}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {application.candidate?.email ||
                          tPage("gridView.notAvailable")}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {application.applied_at
                        ? format(new Date(application.applied_at), "MMM dd, yyyy")
                        : tPage("gridView.notAvailable")}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`chip ${getStageColor(
                          application.stage
                        )} text-xs px-2 py-1 inline-block`}
                      >
                        {getStageLabel(application.stage)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium" onClick={(e) => e.stopPropagation()}>
                      {application.stage === applicationStages.REJECTED ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 whitespace-nowrap">
                            {tPage("applicationStatus.rejected")}
                          </span>
                          <button
                            onClick={() => {
                              handleCandidateClick(application);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded border border-primary-200 dark:border-primary-700 whitespace-nowrap"
                            title={tPage("actions.viewSummary")}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              handleCandidateClick(application);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 whitespace-nowrap"
                            title={tPage("actions.viewSummary")}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {tPage("messages.noApplicationsFound")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tPage("messages.noApplicationsMessage")}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {tPage("pageHeader.title")}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {tPage("pageHeader.subtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Total count badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pagination.total}</span>
            </div>
            <LanguageSwitch />
          </div>
        </div>

        {/* Bulk Actions - Show when items selected */}
        {selectedApplications.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-700">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {selectedApplications.size} selected
            </span>
            <div className="flex-1" />
            <InteractiveButton
              onClick={(e) => {
                e.preventDefault();
                handleBulkAction("shortlist");
              }}
              variant="primary"
              size="sm"
              disabled={isUpdating}
              loading={isUpdating}
              icon={UserCheck}
              className="text-xs whitespace-nowrap"
            >
              <span className="hidden sm:inline">Shortlist</span>
              <span className="sm:hidden">Shortlist</span>
            </InteractiveButton>
            <InteractiveButton
              onClick={(e) => {
                e.preventDefault();
                handleBulkAction("reject");
              }}
              variant="danger"
              size="sm"
              disabled={isUpdating}
              loading={isUpdating}
              icon={X}
              className="text-xs whitespace-nowrap"
            >
              <span className="hidden sm:inline">Reject</span>
              <span className="sm:hidden">Reject</span>
            </InteractiveButton>
          </div>
        )}
      </div>

      {/* Minimal Filters (like Jobs/Drafts) */}
      <div className="card p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Search className="text-gray-500 dark:text-gray-400 w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={tPage("filters.searchPlaceholder")}
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-14 pr-4 py-3 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
            />
            {filters.search && (
              <button 
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 sm:flex gap-2 flex-1">
              <select
                value={filters.stage || ""}
                onChange={(e) => handleFilterChange("stage", e.target.value)}
                className="form-select-sm text-xs sm:text-sm py-2.5 rounded-lg"
              >
                <option value="">{tPage("filters.allStages")}</option>
                <option value="applied">
                  {tPage("applicationStatus.applied")}
                </option>
                <option value="shortlisted">
                  {tPage("applicationStatus.shortlisted")}
                </option>
                <option value="interview_scheduled">
                  {tPage("filterOptions.scheduled")}
                </option>
                <option value="interview_passed">
                  {tPage("filterOptions.interviewed")}
                </option>
                <option value="withdrawn">
                  {tPage("filterOptions.withdrawn") || "Withdrawn"}
                </option>
              </select>

              <select
                value={filters.country || ""}
                onChange={(e) => handleFilterChange("country", e.target.value)}
                className="form-select-sm text-xs sm:text-sm py-2.5 rounded-lg"
              >
                <option value="">{tPage("filters.allCountries")}</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>

              <select
                value={filters.jobId || ""}
                onChange={(e) => handleFilterChange("jobId", e.target.value)}
                className="form-select-sm text-xs sm:text-sm py-2.5 rounded-lg col-span-2 sm:col-span-1 sm:max-w-[200px]"
              >
                <option value="">{tPage("filters.allJobs")}</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title.length > 25 ? `${job.title.substring(0, 25)}...` : job.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* View Toggle - Desktop */}
            <div className="hidden sm:flex rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <InteractiveButton
                onClick={(e) => {
                  e.preventDefault();
                  setViewMode("grid");
                }}
                variant={viewMode === "grid" ? "primary" : "outline"}
                size="sm"
                icon={Grid3X3}
                className="rounded-r-none border-r-0 px-3"
                title="Grid view"
              />
              <InteractiveButton
                onClick={(e) => {
                  e.preventDefault();
                  setViewMode("list");
                }}
                variant={viewMode === "list" ? "primary" : "outline"}
                size="sm"
                icon={List}
                className="rounded-l-none px-3"
                title="List view"
              />
            </div>
          </div>
          
          {/* Active Filters Summary */}
          {(filters.search || filters.stage || filters.country || filters.jobId) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">Filters:</span>
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs">
                  "{filters.search}"
                  <button onClick={() => handleFilterChange('search', '')} className="hover:text-primary-900 dark:hover:text-primary-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.stage && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                  {getStageLabel(filters.stage)}
                  <button onClick={() => handleFilterChange('stage', '')} className="hover:text-blue-900 dark:hover:text-blue-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.country && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                  {filters.country}
                  <button onClick={() => handleFilterChange('country', '')} className="hover:text-green-900 dark:hover:text-green-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.jobId && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                  {jobs.find(j => j.id === filters.jobId)?.title || 'Job'}
                  <button onClick={() => handleFilterChange('jobId', '')} className="hover:text-purple-900 dark:hover:text-purple-100">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button 
                onClick={() => {
                  handleFilterChange('search', '')
                  handleFilterChange('stage', '')
                  handleFilterChange('country', '')
                  handleFilterChange('jobId', '')
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Info & Mobile View Toggle */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span className="hidden sm:inline">
            {tPage("resultsInfo.showing", {
              start:
                applications.length > 0
                  ? (pagination.page - 1) * pagination.limit + 1
                  : 0,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </span>
          <span className="sm:hidden">
            {applications.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)}` : '0'} of {totalItems}
          </span>
        </div>
        
        {/* Mobile View Toggle */}
        <div className="flex sm:hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${viewMode === "grid" ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"} rounded-l-lg transition-colors`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 ${viewMode === "list" ? "bg-primary-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"} rounded-r-lg transition-colors`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Applications View */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6" ref={containerRef}>
        {viewMode === "grid" ? renderGridView() : renderListView()}
      </div>

      {/* Pagination */}
      {applications.length > 0 && (
        <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <PaginationWrapper
            currentPage={currentPage}
            totalPages={clientTotalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={itemsPerPageOptions}
            onPageChange={goToPage}
            onItemsPerPageChange={changeItemsPerPage}
            showInfo={true}
            showItemsPerPageSelector={true}
          />
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-50 max-w-md">
          <div
            className={`
            ${
              toastType === "success"
                ? "bg-green-500"
                : toastType === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            } 
            text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-fade-in
          `}
          >
            <span className="flex-1">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="text-white hover:text-gray-200 ml-2 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Candidate Summary Sidebar */}
      <CandidateSummaryS2
        applicationId={selectedCandidate?.application?.id}
        candidateId={selectedCandidate?.id || selectedCandidate?.candidate?.id}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* Stage Selection Modal */}
      {showStageModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {tPage("modals.stageModal.title")}
              </h3>
              <button
                onClick={() => {
                  setShowStageModal(false);
                  setSelectedApplication(null);
                  setNewStage("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("modals.stageModal.selectStage")}
                </label>
                <select
                  value={newStage || ""}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="form-select"
                >
                  <option value="">
                    {tPage("modals.stageModal.chooseStage")}
                  </option>
                  <option value="applied">
                    {tPage("stageOptions.applied")}
                  </option>
                  <option value="shortlisted">
                    {tPage("stageOptions.shortlisted")}
                  </option>
                  <option value="interview-scheduled">
                    {tPage("stageOptions.interviewScheduled")}
                  </option>
                  <option value="interview-passed">
                    {tPage("stageOptions.interviewPassed")}
                  </option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowStageModal(false);
                    setSelectedApplication(null);
                    setNewStage("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {tPage("modals.stageModal.cancel")}
                </button>
                <button
                  onClick={() => {
                    if (newStage && selectedApplication) {
                      handleUpdateStage(selectedApplication.id, newStage);
                    }
                  }}
                  disabled={
                    !newStage || movingStageApps.has(selectedApplication.id)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {movingStageApps.has(selectedApplication.id)
                    ? tPage("modals.stageModal.updating")
                    : tPage("modals.stageModal.updateStage")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {tPage("modals.rejectModal.title")}
              </h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedApplication(null);
                  setRejectionReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("modals.rejectModal.rejectionReason")}
                </label>
                <textarea
                  value={rejectionReason || ""}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder={tPage("modals.rejectModal.placeholder")}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedApplication(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedApplication) {
                      handleUpdateStage(
                        selectedApplication.id,
                        applicationStages.REJECTED,
                        rejectionReason
                      );
                    }
                  }}
                  disabled={rejectingApps.has(selectedApplication.id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rejectingApps.has(selectedApplication.id)
                    ? tPage("modals.rejectModal.rejecting")
                    : tPage("modals.rejectModal.rejectApplication")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Modal */}
      {showBulkRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {tPage("modals.bulkRejectModal.title", {
                  count: selectedApplications.size,
                })}
              </h3>
              <button
                onClick={() => {
                  setShowBulkRejectModal(false);
                  setBulkRejectionReason("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("modals.bulkRejectModal.rejectionReason")}
                </label>
                <textarea
                  value={bulkRejectionReason || ""}
                  onChange={(e) => setBulkRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={3}
                  placeholder={tPage("modals.bulkRejectModal.placeholder")}
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {tPage("modals.bulkRejectModal.warning", {
                    count: selectedApplications.size,
                  })}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBulkRejectModal(false);
                    setBulkRejectionReason("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={!bulkRejectionReason.trim() || isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating
                    ? tPage("modals.bulkRejectModal.rejecting")
                    : tPage("modals.bulkRejectModal.rejectApplications", {
                        count: selectedApplications.size,
                      })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
