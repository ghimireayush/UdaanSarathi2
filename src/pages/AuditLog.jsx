import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "../components/ui/Card";
import LoadingScreen from "../components/LoadingScreen";
import { useLanguage } from "../hooks/useLanguage";
import LanguageSwitch from "../components/LanguageSwitch";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    dateRange: "all",
    sortOrder: "desc",
    role: "all",
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

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Load audit logs from localStorage (in production, fetch from API)
      const storedLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]').map(log => ({
        ...log,
        loginTime: new Date(log.loginTime), // Convert string timestamp to Date object
        logoutTime: log.logoutTime ? new Date(log.logoutTime) : null
      }))
      
      // Mock data - In production, fetch from API
      const mockLogs = [
        {
          id: 1,
          name: "Ram Sharma",
          phoneNumber: "+977-9841234567",
          role: "Recipient",
          loginTime: new Date(Date.now() - 30 * 60 * 1000),
          logoutTime: new Date(Date.now() - 15 * 60 * 1000),
        },
        {
          id: 2,
          name: "Sita Poudel",
          phoneNumber: "+977-9851234568",
          role: "Admin",
          loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          logoutTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        },
        {
          id: 3,
          name: "Hari Thapa",
          phoneNumber: "+977-9861234569",
          role: "Coordinator",
          loginTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
          logoutTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
        {
          id: 4,
          name: "Ram Sharma",
          phoneNumber: "+977-9841234567",
          role: "Recipient",
          loginTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
          logoutTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          id: 5,
          name: "Maya Gurung",
          phoneNumber: "+977-9871234570",
          role: "Coordinator",
          loginTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
          logoutTime: new Date(Date.now() - 7 * 60 * 60 * 1000),
        },
        {
          id: 6,
          name: "Krishna Tamang",
          phoneNumber: "+977-9881234571",
          role: "Admin",
          loginTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
          logoutTime: new Date(Date.now() - 10 * 60 * 60 * 1000),
        },
      ];

      // Merge stored logs with mock logs
      const allLogs = [...storedLogs, ...mockLogs].sort((a, b) => 
        new Date(b.loginTime) - new Date(a.loginTime)
      )

      setLogs(allLogs);
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
          log.name?.toLowerCase().includes(search) ||
          log.phoneNumber?.toLowerCase().includes(search) ||
          log.role?.toLowerCase().includes(search)
      );
    }

    // Role filter
    if (filters.role !== "all") {
      result = result.filter((log) => log.role === filters.role);
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      if (filters.dateRange === "custom") {
        // Custom date range
        if (customDateRange.startDate || customDateRange.endDate) {
          result = result.filter((log) => {
            const logDate = log.loginTime.getTime();
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
          result = result.filter((log) => now - log.loginTime.getTime() <= range);
        }
      }
    }

    // Sort by login time
    result.sort((a, b) => {
      return filters.sortOrder === "desc"
        ? b.loginTime.getTime() - a.loginTime.getTime()
        : a.loginTime.getTime() - b.loginTime.getTime();
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

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case "recipient":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "admin":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "coordinator":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
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
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6 pt-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {tPage("title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {tPage("subtitle")}
          </p>
        </div>
        <div className="flex-shrink-0">
          <LanguageSwitch />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tPage("stats.totalLogs")}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {logs.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tPage("stats.uniqueUsers")}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {new Set(logs.map(l => l.phoneNumber)).size}
                </p>
              </div>
              <User className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tPage("stats.todayAccess")}
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {logs.filter(l => {
                    const today = new Date();
                    const logDate = new Date(l.loginTime);
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
                  {tPage("filters.role")}
                </label>
                <select
                  value={filters.role}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">{tPage("filters.allRoles")}</option>
                  <option value="Recipient">{tPage("roles.recipient")}</option>
                  <option value="Admin">{tPage("roles.admin")}</option>
                  <option value="Coordinator">{tPage("roles.coordinator")}</option>
                </select>
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
        {tPage("messages.results.showing", {
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
                {searchTerm || filters.dateRange !== "all" || filters.role !== "all"
                  ? tPage("messages.noResults.filtered")
                  : tPage("messages.noResults.empty")}
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedLogs.map((log) => (
            <Card
              key={log.id}
              className={`border-l-4 ${getRoleColor(log.role)}`}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {log.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.phoneNumber}
                      </p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="text-center md:text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tPage("table.headers.role")}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{log.role}</p>
                  </div>

                  {/* Login Time */}
                  <div className="text-center md:text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tPage("table.headers.loginTime")}</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(log.loginTime)}
                    </p>
                  </div>

                  {/* Logout Time */}
                  <div className="text-center md:text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tPage("table.headers.logoutTime")}</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {log.logoutTime ? formatDate(log.logoutTime) : tPage("table.stillLoggedIn")}
                    </p>
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
                {tPage("pagination.show")}
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
                {tPage("pagination.perPage")}
              </span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {tPage("pagination.showing", {
                start: startIndex + 1,
                end: Math.min(endIndex, filteredLogs.length),
                total: filteredLogs.length,
              })}
            </div>

            {/* Page navigation */}
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