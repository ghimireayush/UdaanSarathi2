import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Shield,
  Briefcase,
  Building2,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "../components/ui/Card";
import LoadingScreen from "../components/LoadingScreen";
import { useLanguage } from "../hooks/useLanguage";
import LanguageSwitch from "../components/LanguageSwitch";
import auditService, { AUDIT_CATEGORIES, AUDIT_ACTIONS } from "../services/auditService";

const AuditLogPage = () => {
  const { tPageSync } = useLanguage({
    pageName: "audit-log",
    autoLoad: true,
  });

  const tPage = (key, params = {}) => {
    return tPageSync(key, params);
  };

  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    dateRange: "all",
    sortOrder: "desc",
    category: "all",
    outcome: "all",
  });
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [summary, setSummary] = useState({});

  // Load audit logs from backend
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is logged in
      const token = localStorage.getItem('udaan_token');
      if (!token) {
        setError('Please log in to view audit logs');
        setLoading(false);
        return;
      }

      // Build filter params
      const filterParams = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filters.category !== "all") {
        filterParams.category = filters.category;
      }

      if (filters.outcome !== "all") {
        filterParams.outcome = filters.outcome;
      }

      // Date range
      if (filters.dateRange === "custom") {
        if (customDateRange.startDate) {
          filterParams.startDate = new Date(customDateRange.startDate).toISOString();
        }
        if (customDateRange.endDate) {
          filterParams.endDate = new Date(customDateRange.endDate + "T23:59:59").toISOString();
        }
      } else if (filters.dateRange !== "all") {
        const now = new Date();
        const ranges = {
          today: 1,
          week: 7,
          month: 30,
        };
        const days = ranges[filters.dateRange];
        if (days) {
          const startDate = new Date(now);
          startDate.setDate(startDate.getDate() - days);
          filterParams.startDate = startDate.toISOString();
        }
      }

      const result = await auditService.getAuditLogs(filterParams);
      
      setLogs(result.items || []);
      setTotalItems(result.total || 0);

      // Also load summary
      const summaryResult = await auditService.getCategorySummary(
        filterParams.startDate,
        filterParams.endDate
      );
      setSummary(summaryResult || {});

    } catch (err) {
      console.error("Failed to load audit logs:", err);
      // Handle specific error cases
      if (err.message?.includes('Invalid token') || err.message?.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
        // Optionally clear invalid token
        localStorage.removeItem('udaan_token');
      } else {
        setError(err.message || "Failed to load audit logs");
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and when filters change
  useEffect(() => {
    loadAuditLogs();
  }, [currentPage, itemsPerPage, filters, customDateRange]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, customDateRange]);

  // Filter logs by search term (client-side)
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    
    const search = searchTerm.toLowerCase();
    return logs.filter(
      (log) =>
        log.action?.toLowerCase().includes(search) ||
        log.category?.toLowerCase().includes(search) ||
        log.user_role?.toLowerCase().includes(search) ||
        log.path?.toLowerCase().includes(search) ||
        log.resource_type?.toLowerCase().includes(search)
    );
  }, [logs, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getCategoryIcon = (category) => {
    const icons = {
      auth: Shield,
      application: FileText,
      job_posting: Briefcase,
      agency: Building2,
      candidate: User,
      interview: Calendar,
      admin: Settings,
      system: Activity,
    };
    const Icon = icons[category] || Activity;
    return <Icon className="h-5 w-5" />;
  };

  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failure":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "denied":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      auth: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
      application: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
      job_posting: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
      agency: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300",
      candidate: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300",
      interview: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300",
      admin: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    };
    return colors[category] || "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && logs.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6 pt-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {tPage("title") || "Audit Logs"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {tPage("subtitle") || "Track all system activities and changes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAuditLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <LanguageSwitch />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tPage("stats.totalEvents")}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {totalItems}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tPage("stats.applications")}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.application || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tPage("stats.interviews")}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {summary.interview || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tPage("stats.authEvents")}</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {summary.auth || 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by action, category, path..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Filter className="h-5 w-5" />
              {tPage("filters.title")}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("filters.labels.category")}
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="form-select"
                >
                  <option value="all">{tPage("filters.category.all")}</option>
                  <option value="auth">{tPage("filters.category.auth")}</option>
                  <option value="application">{tPage("filters.category.application")}</option>
                  <option value="job_posting">{tPage("filters.category.job_posting")}</option>
                  <option value="agency">{tPage("filters.category.agency")}</option>
                  <option value="candidate">{tPage("filters.category.candidate")}</option>
                  <option value="interview">{tPage("filters.category.interview")}</option>
                  <option value="admin">{tPage("filters.category.admin")}</option>
                  <option value="system">{tPage("filters.category.system")}</option>
                </select>
              </div>

              {/* Outcome Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("filters.labels.outcome")}
                </label>
                <select
                  value={filters.outcome}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, outcome: e.target.value }))
                  }
                  className="form-select"
                >
                  <option value="all">{tPage("filters.outcome.all")}</option>
                  <option value="success">{tPage("filters.outcome.success")}</option>
                  <option value="failure">{tPage("filters.outcome.failure")}</option>
                  <option value="denied">{tPage("filters.outcome.denied")}</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("filters.labels.dateRange")}
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, dateRange: e.target.value }));
                    if (e.target.value !== "custom") {
                      setCustomDateRange({ startDate: "", endDate: "" });
                    }
                  }}
                  className="form-select"
                >
                  <option value="all">{tPage("filters.dateRange.all")}</option>
                  <option value="today">{tPage("filters.dateRange.today")}</option>
                  <option value="week">{tPage("filters.dateRange.week")}</option>
                  <option value="month">{tPage("filters.dateRange.month")}</option>
                  <option value="custom">{tPage("filters.dateRange.custom")}</option>
                </select>

                {filters.dateRange === "custom" && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) =>
                        setCustomDateRange((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) =>
                        setCustomDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Items per page */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("filters.labels.perPage")}
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="form-select"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {tPage("pagination.showing", { count: filteredLogs.length, total: totalItems })}
      </div>

      {/* Audit Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {error ? tPage("error.failedToLoad") : tPage("messages.noLogsFound")}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card
              key={log.id}
              className={`border-l-4 ${getCategoryColor(log.category)}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Category Icon & Action Description */}
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${getCategoryColor(log.category)}`}>
                      {getCategoryIcon(log.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {log.description || auditService.getActionLabel(log.action, log)}
                        </h3>
                        {/* Resource Badge */}
                        {log.resource_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {log.resource_type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {log.category_label || auditService.getCategoryLabel(log.category, log)}
                      </p>
                    </div>
                  </div>

                  {/* Actor - More prominent */}
                  <div className="min-w-[180px]">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Performed by</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {log.user_role || "System"}
                    </p>
                    {log.user_id && (
                      <p className="text-xs text-gray-400 font-mono" title={log.user_id}>
                        ID: {log.user_id.substring(0, 8)}...
                      </p>
                    )}
                  </div>

                  {/* Outcome Badge & Time */}
                  <div className="flex items-center gap-4">
                    {/* Outcome as Badge */}
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      log.outcome === 'success' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                        : log.outcome === 'failure'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {getOutcomeIcon(log.outcome)}
                      <span className="capitalize">{log.outcome}</span>
                    </div>
                    
                    {/* Time */}
                    <div className="text-right min-w-[130px]">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(log.created_at)}
                      </p>
                      {log.duration_ms && (
                        <p className="text-xs text-gray-400">{log.duration_ms}ms</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {tPage("pagination.page", { current: currentPage, total: totalPages })} ({tPage("pagination.total", { count: totalItems })})
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
              >
                {tPage("pagination.first")}
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
              >
                {tPage("pagination.previous")}
              </button>

              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                {currentPage}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
              >
                {tPage("pagination.next")}
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
              >
                {tPage("pagination.last")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
