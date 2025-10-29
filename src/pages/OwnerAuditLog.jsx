import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../hooks/useLanguage";
import {
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "../components/ui/Card";

const OwnerAuditLog = () => {
  const { tPageSync } = useLanguage({
    pageName: "owner-auditlog",
    autoLoad: true,
  });

  const tPage = (key, params = {}) => {
    return tPageSync(key, params);
  };

  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    actionType: "all",
    dateRange: "all",
    sortOrder: "desc",
  });
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  // Load audit logs
  useEffect(() => {
    loadAuditLogs();
  }, []);

  // Listen for auto-refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log("[OwnerAuditLog] Auto-refreshing data...");
      loadAuditLogs();
    };

    window.addEventListener("ownerPageRefresh", handleRefresh);

    return () => {
      window.removeEventListener("ownerPageRefresh", handleRefresh);
    };
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // Mock data - In production, fetch from API
      const mockLogs = [
        {
          id: 1,
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          action: "owner_login",
          performedBy: "Owner Admin",
          performedByEmail: "owner@udaansarathi.com",
          details: {
            ipAddress: "192.168.1.100",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            loginMethod: "email_password",
          },
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          action: "delete_agency",
          performedBy: "Owner Admin",
          performedByEmail: "owner@udaansarathi.com",
          targetAgency: "Tech Solutions Pvt Ltd",
          targetAgencyId: "agency_001",
          reason: "Company closed operations and requested account deletion",
          details: {
            agencyName: "Tech Solutions Pvt Ltd",
            licenseNumber: "REG-2024-001",
          },
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          action: "deactivate_agency",
          performedBy: "Owner Admin",
          performedByEmail: "owner@udaansarathi.com",
          targetAgency: "Global Recruiters",
          targetAgencyId: "agency_002",
          reason: "License expired, pending renewal documentation",
          details: {
            agencyName: "Global Recruiters",
            licenseNumber: "REG-2024-002",
            previousStatus: "active",
            newStatus: "inactive",
          },
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          action: "activate_agency",
          performedBy: "Owner Admin",
          performedByEmail: "owner@udaansarathi.com",
          targetAgency: "HR Consultancy Nepal",
          targetAgencyId: "agency_003",
          reason: "License renewed and all documentation verified",
          details: {
            agencyName: "HR Consultancy Nepal",
            licenseNumber: "REG-2024-003",
            previousStatus: "inactive",
            newStatus: "active",
          },
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          action: "delete_agency",
          performedBy: "Owner Admin",
          performedByEmail: "owner@udaansarathi.com",
          targetAgency: "Manpower Services",
          targetAgencyId: "agency_004",
          reason:
            "Multiple policy violations and fraudulent activities reported",
          details: {
            agencyName: "Manpower Services",
            licenseNumber: "REG-2024-004",
          },
        },
        {
          id: 6,
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          action: "deactivate_agency",
          performedBy: "Owner Admin",
          performedByEmail: "owner@udaansarathi.com",
          targetAgency: "Career Builders",
          targetAgencyId: "agency_005",
          reason: "Temporary suspension due to pending investigation",
          details: {
            agencyName: "Career Builders",
            licenseNumber: "REG-2024-005",
            previousStatus: "active",
            newStatus: "inactive",
          },
        },
      ];

      setLogs(mockLogs);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted logs
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.targetAgency?.toLowerCase().includes(search) ||
          log.performedBy.toLowerCase().includes(search) ||
          log.reason?.toLowerCase().includes(search) ||
          log.action.toLowerCase().includes(search) ||
          log.details?.ipAddress?.toLowerCase().includes(search)
      );
    }

    // Action type filter
    if (filters.actionType !== "all") {
      result = result.filter((log) => log.action === filters.actionType);
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      if (filters.dateRange === "custom") {
        // Custom date range
        if (customDateRange.startDate || customDateRange.endDate) {
          result = result.filter((log) => {
            const logDate = log.timestamp.getTime();
            const startDate = customDateRange.startDate
              ? new Date(customDateRange.startDate).setHours(0, 0, 0, 0)
              : 0;
            const endDate = customDateRange.endDate
              ? new Date(customDateRange.endDate).setHours(23, 59, 59, 999)
              : Date.now();
            return logDate >= startDate && logDate <= endDate;
          });
        }
      } else {
        // Predefined ranges
        const now = Date.now();
        const ranges = {
          today: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
        };
        const range = ranges[filters.dateRange];
        if (range) {
          result = result.filter((log) => now - log.timestamp.getTime() <= range);
        }
      }
    }

    // Sort by timestamp
    result.sort((a, b) => {
      return filters.sortOrder === "desc"
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime();
    });

    return result;
  }, [logs, searchTerm, filters, customDateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, customDateRange]);

  const getActionIcon = (action) => {
    switch (action) {
      case "delete_agency":
        return <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case "deactivate_agency":
        return (
          <ToggleLeft className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        );
      case "activate_agency":
        return (
          <ToggleRight className="h-5 w-5 text-green-600 dark:text-green-400" />
        );
      case "owner_login":
        return <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default:
        return (
          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "delete_agency":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "deactivate_agency":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      case "activate_agency":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "owner_login":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {tPage("title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {tPage("subtitle")}
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {tPage("loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {tPage("title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {tPage("subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            filters.actionType === "all"
              ? "ring-2 ring-blue-500 dark:ring-blue-400"
              : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600"
          }`}
          onClick={() => {
            setFilters((prev) => ({ ...prev, actionType: "all" }));
            setShowFilters(false);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tPage("stats.totalActions")}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {logs.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            filters.actionType === "delete_agency"
              ? "ring-2 ring-red-500 dark:ring-red-400"
              : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600"
          }`}
          onClick={() => {
            setFilters((prev) => ({ ...prev, actionType: "delete_agency" }));
            setShowFilters(false);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tPage("stats.deletions")}
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {logs.filter((l) => l.action === "delete_agency").length}
                </p>
              </div>
              <Trash2 className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            filters.actionType === "deactivate_agency"
              ? "ring-2 ring-orange-500 dark:ring-orange-400"
              : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600"
          }`}
          onClick={() => {
            setFilters((prev) => ({
              ...prev,
              actionType: "deactivate_agency",
            }));
            setShowFilters(false);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tPage("stats.deactivations")}
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {logs.filter((l) => l.action === "deactivate_agency").length}
                </p>
              </div>
              <ToggleLeft className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            filters.actionType === "activate_agency"
              ? "ring-2 ring-green-500 dark:ring-green-400"
              : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600"
          }`}
          onClick={() => {
            setFilters((prev) => ({ ...prev, actionType: "activate_agency" }));
            setShowFilters(false);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tPage("stats.activations")}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {logs.filter((l) => l.action === "activate_agency").length}
                </p>
              </div>
              <ToggleRight className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            filters.actionType === "owner_login"
              ? "ring-2 ring-blue-500 dark:ring-blue-400"
              : "hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600"
          }`}
          onClick={() => {
            setFilters((prev) => ({ ...prev, actionType: "owner_login" }));
            setShowFilters(false);
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tPage("stats.logins")}
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {logs.filter((l) => l.action === "owner_login").length}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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
                placeholder={tPage("search.placeholder")}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <Filter className="h-5 w-5" />
              {tPage("filters.toggle")}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("filters.actionType")}
                </label>
                <select
                  value={filters.actionType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      actionType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">{tPage("filters.all")}</option>
                  <option value="owner_login">{tPage("filters.logins")}</option>
                  <option value="delete_agency">
                    {tPage("filters.deletions")}
                  </option>
                  <option value="deactivate_agency">
                    {tPage("filters.deactivations")}
                  </option>
                  <option value="activate_agency">
                    {tPage("filters.activations")}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("filters.dateRange")}
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: e.target.value,
                    }));
                    // Reset custom dates when switching away from custom
                    if (e.target.value !== "custom") {
                      setCustomDateRange({ startDate: "", endDate: "" });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">{tPage("filters.allTime")}</option>
                  <option value="today">{tPage("filters.today")}</option>
                  <option value="week">{tPage("filters.thisWeek")}</option>
                  <option value="month">{tPage("filters.thisMonth")}</option>
                  <option value="custom">{tPage("filters.custom")}</option>
                </select>

                {/* Custom Date Range Inputs */}
                {filters.dateRange === "custom" && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {tPage("filters.startDate")}
                      </label>
                      <input
                        type="date"
                        value={customDateRange.startDate}
                        onChange={(e) =>
                          setCustomDateRange((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        max={customDateRange.endDate || undefined}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {tPage("filters.endDate")}
                      </label>
                      <input
                        type="date"
                        value={customDateRange.endDate}
                        onChange={(e) =>
                          setCustomDateRange((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        min={customDateRange.startDate || undefined}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tPage("filters.sortOrder")}
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sortOrder: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="desc">{tPage("filters.newest")}</option>
                  <option value="asc">{tPage("filters.oldest")}</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {tPage("results.showing", {
          count: paginatedLogs.length,
          total: filteredLogs.length,
        })}
      </div>

      {/* Audit Logs List */}
      <div className="space-y-4">
        {paginatedLogs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filters.actionType !== "all"
                  ? tPage("noResults.filtered")
                  : tPage("noResults.empty")}
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedLogs.map((log) => (
            <Card
              key={log.id}
              className={`border-l-4 ${getActionColor(log.action)}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {tPage(`actions.${log.action}`)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(log.timestamp)}
                        </p>
                      </div>
                    </div>

                    {/* Agency Info or Login Info */}
                    {log.action === "owner_login" ? (
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <strong>{tPage("log.ipAddress")}:</strong>{" "}
                          {log.details.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <strong>{tPage("log.loginMethod")}:</strong>{" "}
                          {log.details.loginMethod}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {log.targetAgency}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({log.details.licenseNumber})
                        </span>
                      </div>
                    )}

                    {/* Reason */}
                    {log.reason && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {tPage("log.reason")}:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {log.reason}
                        </p>
                      </div>
                    )}

                    {/* Performed By */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="h-4 w-4" />
                      <span>
                        {tPage("log.performedBy")}: {log.performedBy} (
                        {log.performedByEmail})
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                per page
              </span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredLogs.length)} of{" "}
              {filteredLogs.length} logs
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 text-sm"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerAuditLog;
