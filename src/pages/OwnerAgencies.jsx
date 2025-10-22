import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { agencyService } from "../services";
import {
  Search,
  Filter,
  X,
  MoreVertical,
  Check,
  Trash2,
  Eye,
} from "lucide-react";

const OwnerAgencies = () => {
  const { tPageSync } = useLanguage({
    pageName: "owner-agencies",
    autoLoad: true,
  });
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  });
  const [selectedAgencies, setSelectedAgencies] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [platformStats, setPlatformStats] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Detail panel state
  const [detailAgency, setDetailAgency] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null,
    data: null,
  });
  const [confirmText, setConfirmText] = useState("");

  const tPage = (key, params = {}) => tPageSync(key, params);

  // Load agencies
  useEffect(() => {
    loadAgencies();
    loadPlatformStats();
  }, []);

  // Handle URL params for detail panel
  useEffect(() => {
    const agencyId = searchParams.get("agencyId");
    if (agencyId && !detailAgency) {
      loadAgencyDetails(agencyId);
    } else if (!agencyId && detailAgency) {
      setDetailAgency(null);
    }
  }, [searchParams]);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agencyService.getAllAgencies();
      setAgencies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPlatformStats = async () => {
    try {
      const stats = await agencyService.getPlatformStatistics();
      setPlatformStats(stats);
    } catch (err) {
      console.error("Failed to load platform stats:", err);
    }
  };

  const loadAgencyDetails = async (agencyId) => {
    try {
      setDetailLoading(true);
      const agency = await agencyService.getAgencyById(agencyId);
      setDetailAgency(agency);
    } catch (err) {
      console.error("Failed to load agency details:", err);
      setSearchParams({});
    } finally {
      setDetailLoading(false);
    }
  };

  // Filtered and sorted agencies
  const filteredAgencies = useMemo(() => {
    let result = [...agencies];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.license_number.toLowerCase().includes(search) ||
          a.email.toLowerCase().includes(search) ||
          a.owner_name.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((a) => a.status === filters.status);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal, bVal;

      switch (filters.sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "created":
          aVal = new Date(a.created_at);
          bVal = new Date(b.created_at);
          break;
        case "jobs":
          aVal = a.statistics.total_jobs;
          bVal = b.statistics.total_jobs;
          break;
        case "applicants":
          aVal = a.statistics.active_applicants;
          bVal = b.statistics.active_applicants;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return filters.sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [agencies, searchTerm, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgencies = filteredAgencies.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Action handlers
  const handleViewDetails = (agencyId) => {
    setSearchParams({ agencyId });
  };

  const handleClosePanel = () => {
    setSearchParams({});
  };

  const handleStatusChange = (agencyId, newStatus) => {
    // Show confirmation dialog for single agency status change
    const agency = agencies.find(a => a.id === agencyId);
    setConfirmDialog({
      isOpen: true,
      type: "singleStatusChange",
      data: { agencyId, newStatus, agencyName: agency?.name },
    });
  };

  const confirmSingleStatusChange = async () => {
    try {
      await agencyService.updateAgencyStatus(
        confirmDialog.data.agencyId,
        confirmDialog.data.newStatus
      );
      setAgencies((prev) =>
        prev.map((a) =>
          a.id === confirmDialog.data.agencyId
            ? { ...a, status: confirmDialog.data.newStatus }
            : a
        )
      );
      if (detailAgency?.id === confirmDialog.data.agencyId) {
        setDetailAgency((prev) => ({ ...prev, status: confirmDialog.data.newStatus }));
      }
      showToast("success", tPage("toast.statusUpdated"));
      setConfirmDialog({ isOpen: false, type: null, data: null });
    } catch (err) {
      showToast("error", tPage("toast.statusUpdateFailed"));
    }
  };

  const handleDelete = (agency) => {
    setConfirmDialog({
      isOpen: true,
      type: "delete",
      data: agency,
    });
    setConfirmText("");
  };

  const confirmDelete = async () => {
    if (confirmText !== confirmDialog.data.name) return;

    try {
      await agencyService.deleteAgency(confirmDialog.data.id);
      setAgencies((prev) => prev.filter((a) => a.id !== confirmDialog.data.id));
      if (detailAgency?.id === confirmDialog.data.id) {
        handleClosePanel();
      }
      showToast("success", tPage("toast.deleted"));
      setConfirmDialog({ isOpen: false, type: null, data: null });
    } catch (err) {
      showToast("error", tPage("toast.deleteFailed"));
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    setConfirmDialog({
      isOpen: true,
      type: "statusChange",
      data: { status: newStatus, ids: selectedAgencies },
    });
  };

  const confirmBulkStatusChange = async () => {
    try {
      const result = await agencyService.bulkUpdateStatus(
        confirmDialog.data.ids,
        confirmDialog.data.status
      );

      setAgencies((prev) =>
        prev.map((a) =>
          result.success.includes(a.id)
            ? { ...a, status: confirmDialog.data.status }
            : a
        )
      );

      setSelectedAgencies([]);
      showToast(
        "success",
        tPage("toast.bulkStatusUpdated", { count: result.success.length })
      );
      setConfirmDialog({ isOpen: false, type: null, data: null });
    } catch (err) {
      showToast(
        "error",
        tPage("toast.bulkStatusFailed", { count: selectedAgencies.length })
      );
    }
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true,
      type: "bulkDelete",
      data: { ids: selectedAgencies },
    });
  };

  const confirmBulkDelete = async () => {
    try {
      const result = await agencyService.bulkDeleteAgencies(
        confirmDialog.data.ids
      );

      setAgencies((prev) => prev.filter((a) => !result.success.includes(a.id)));
      setSelectedAgencies([]);
      showToast(
        "success",
        tPage("toast.bulkDeleted", { count: result.success.length })
      );
      setConfirmDialog({ isOpen: false, type: null, data: null });
    } catch (err) {
      showToast(
        "error",
        tPage("toast.bulkDeleteFailed", { count: selectedAgencies.length })
      );
    }
  };

  const handleSelectAll = () => {
    if (selectedAgencies.length === filteredAgencies.length) {
      setSelectedAgencies([]);
    } else {
      setSelectedAgencies(filteredAgencies.map((a) => a.id));
    }
  };

  const handleSelectAgency = (agencyId) => {
    setSelectedAgencies((prev) =>
      prev.includes(agencyId)
        ? prev.filter((id) => id !== agencyId)
        : [...prev, agencyId]
    );
  };

  const showToast = (type, message) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
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

  if (error) {
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
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-800 dark:text-red-400">{tPage("error")}</p>
          <button
            onClick={loadAgencies}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {tPage("retry")}
          </button>
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

      {/* Platform Stats */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label={tPage("stats.totalAgencies")}
            value={platformStats.total_agencies}
            color="blue"
          />
          <StatCard
            label={tPage("stats.activeAgencies")}
            value={platformStats.active_agencies}
            color="green"
          />
          <StatCard
            label={tPage("stats.inactiveAgencies")}
            value={platformStats.inactive_agencies}
            color="gray"
          />
          <StatCard
            label={tPage("stats.totalJobs")}
            value={platformStats.total_jobs}
            color="purple"
          />
          <StatCard
            label={tPage("stats.activeApplicants")}
            value={platformStats.active_applicants}
            color="yellow"
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
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
            {tPage("filters.status")}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tPage("filters.status")}
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">{tPage("filters.all")}</option>
                <option value="active">{tPage("filters.active")}</option>
                <option value="inactive">{tPage("filters.inactive")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tPage("filters.sortBy")}
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="name">{tPage("filters.name")}</option>
                <option value="created">{tPage("filters.created")}</option>
                <option value="jobs">{tPage("filters.jobs")}</option>
                <option value="applicants">
                  {tPage("filters.applicants")}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {tPage("filters.sortBy")}
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortOrder: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="asc">{tPage("filters.ascending")}</option>
                <option value="desc">{tPage("filters.descending")}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedAgencies.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 dark:text-blue-300 font-medium">
              {tPage("actions.selected", { count: selectedAgencies.length })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange("active")}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                {tPage("actions.activate")}
              </button>
              <button
                onClick={() => handleBulkStatusChange("inactive")}
                className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                {tPage("actions.deactivate")}
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                {tPage("actions.delete")}
              </button>
              <button
                onClick={() => setSelectedAgencies([])}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
              >
                {tPage("actions.deselectAll")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agencies Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredAgencies.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? tPage("search.noResults") : tPage("table.noData")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedAgencies.length === filteredAgencies.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPage("table.agency")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPage("table.license")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPage("table.owner")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPage("table.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPage("table.jobs")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPage("table.activeApplicants")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    {tPage("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedAgencies.map((agency) => (
                  <AgencyRow
                    key={agency.id}
                    agency={agency}
                    selected={selectedAgencies.includes(agency.id)}
                    onSelect={handleSelectAgency}
                    onView={handleViewDetails}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    tPage={tPage}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredAgencies.length > 0 && (
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
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                per page
              </span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAgencies.length)} of{" "}
              {filteredAgencies.length} agencies
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
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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

      {/* Detail Panel */}
      {detailAgency && (
        <DetailPanel
          agency={detailAgency}
          loading={detailLoading}
          onClose={handleClosePanel}
          tPage={tPage}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
          formatRelativeTime={formatRelativeTime}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <ConfirmationDialog
          type={confirmDialog.type}
          data={confirmDialog.data}
          confirmText={confirmText}
          setConfirmText={setConfirmText}
          onConfirm={() => {
            if (confirmDialog.type === "delete") confirmDelete();
            else if (confirmDialog.type === "bulkDelete") confirmBulkDelete();
            else if (confirmDialog.type === "statusChange")
              confirmBulkStatusChange();
            else if (confirmDialog.type === "singleStatusChange")
              confirmSingleStatusChange();
          }}
          onCancel={() => {
            setConfirmDialog({ isOpen: false, type: null, data: null });
            setConfirmText("");
          }}
          tPage={tPage}
        />
      )}
    </div>
  );
};

// StatCard Component
const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300",
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-300",
    gray: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-300",
    yellow:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-300",
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

// AgencyRow Component
const AgencyRow = ({
  agency,
  selected,
  onSelect,
  onView,
  onStatusChange,
  onDelete,
  tPage,
  getStatusColor,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(agency.id)}
          className="rounded border-gray-300 dark:border-gray-600"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold">
            {agency.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {agency.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {agency.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {agency.license_number}
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {agency.owner_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {agency.owner_phone}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
            agency.status
          )}`}
        >
          {tPage(`status.${agency.status}`)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {agency.statistics.total_jobs}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {agency.statistics.active_jobs} active
          </p>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
        {agency.statistics.active_applicants}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
          >
            <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
              <button
                onClick={() => {
                  onView(agency.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {tPage("actions.view")}
              </button>
              {agency.status !== "active" && (
                <button
                  onClick={() => {
                    onStatusChange(agency.id, "active");
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-green-700 dark:text-green-400 flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {tPage("actions.activate")}
                </button>
              )}
              {agency.status !== "inactive" && (
                <button
                  onClick={() => {
                    onStatusChange(agency.id, "inactive");
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-400 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {tPage("actions.deactivate")}
                </button>
              )}
              <button
                onClick={() => {
                  onDelete(agency);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600 text-red-700 dark:text-red-400 flex items-center gap-2 border-t border-gray-200 dark:border-gray-600"
              >
                <Trash2 className="h-4 w-4" />
                {tPage("actions.delete")}
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

// DetailPanel Component
const DetailPanel = ({
  agency,
  loading,
  onClose,
  tPage,
  getStatusColor,
  formatDate,
  formatRelativeTime,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-gray-800 shadow-xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {tPage("detailPanel.title")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <OverviewTab
              agency={agency}
              tPage={tPage}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              formatRelativeTime={formatRelativeTime}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// OverviewTab Component
const OverviewTab = ({
  agency,
  tPage,
  getStatusColor,
  formatDate,
  formatRelativeTime,
}) => (
  <div className="space-y-6">
    {/* Logo */}
    {agency.logo_url && (
      <div className="flex justify-center">
        <div className="h-24 w-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-3xl">
          {agency.name.charAt(0)}
        </div>
      </div>
    )}

    {/* Agency Name & Description */}
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
        {agency.name}
      </h2>
      {agency.description && (
        <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
          {agency.description}
        </p>
      )}
    </div>

    {/* Basic Info */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        Basic Information
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="License Number" value={agency.license_number} />
        <InfoItem label="Established" value={agency.established_year} />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Status
          </p>
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              agency.status
            )}`}
          >
            {tPage(`status.${agency.status}`)}
          </span>
        </div>
      </div>
    </div>

    {/* Contact Information */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        Contact Information
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <InfoItem label="Phone" value={agency.phone} />
        <InfoItem label="Mobile" value={agency.mobile || agency.owner_phone} />
        <InfoItem label="Email" value={agency.email} className="col-span-2" />
        {agency.website && (
          <InfoItem
            label="Website"
            value={agency.website}
            className="col-span-2"
          />
        )}
        <InfoItem
          label="Address"
          value={agency.address}
          className="col-span-2"
        />
      </div>
    </div>

    {/* Services */}
    {agency.services && agency.services.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          Services Offered
        </h3>
        <div className="flex flex-wrap gap-2">
          {agency.services.map((service, index) => (
            <span
              key={index}
              className="inline-flex px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full"
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Target Countries */}
    {agency.target_countries && agency.target_countries.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          Target Countries
        </h3>
        <div className="flex flex-wrap gap-2">
          {agency.target_countries.map((country, index) => (
            <span
              key={index}
              className="inline-flex px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full"
            >
              {country}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Specializations */}
    {agency.specializations && agency.specializations.length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          Specializations
        </h3>
        <div className="flex flex-wrap gap-2">
          {agency.specializations.map((spec, index) => (
            <span
              key={index}
              className="inline-flex px-3 py-1 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Social Media */}
    {agency.social_media && Object.keys(agency.social_media).length > 0 && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          Social Media
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {agency.social_media.facebook && (
            <a
              href={agency.social_media.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <span className="font-medium">Facebook</span>
            </a>
          )}
          {agency.social_media.instagram && (
            <a
              href={agency.social_media.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30"
            >
              <span className="font-medium">Instagram</span>
            </a>
          )}
          {agency.social_media.linkedin && (
            <a
              href={agency.social_media.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <span className="font-medium">LinkedIn</span>
            </a>
          )}
          {agency.social_media.twitter && (
            <a
              href={agency.social_media.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/30"
            >
              <span className="font-medium">Twitter</span>
            </a>
          )}
        </div>
      </div>
    )}

    {/* Statistics */}
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <StatItem
          label="Total Jobs (Lifetime)"
          value={agency.statistics.total_jobs}
          description="All job postings created by this agency"
        />
        <StatItem
          label="Active Jobs"
          value={agency.statistics.active_jobs}
          description="Currently open positions accepting applications"
        />
        <StatItem
          label="Total Applications (Lifetime)"
          value={agency.statistics.total_applications}
          description="All applications received across all jobs"
        />
        <StatItem
          label="Active Applicants"
          value={agency.statistics.active_applicants}
          description="Candidates currently in the hiring process"
        />
        <StatItem
          label="Active Recruiters"
          value={agency.statistics.active_recruiters}
          description="Team members actively managing recruitment"
        />
      </div>
    </div>

    {/* Team Members */}
    {agency.team_members && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          Team Members
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            label="Total Team Members"
            value={agency.team_members.total}
            description="All active team members in this agency"
          />
          <StatItem
            label="Admin"
            value={agency.team_members.admin}
            description="Full system access and management"
          />
          <StatItem
            label="Recipient"
            value={agency.team_members.recipient}
            description="Job and application management"
          />
          <StatItem
            label="Interview Coordinator"
            value={agency.team_members.interview_coordinator}
            description="Interview scheduling and coordination"
          />
        </div>
      </div>
    )}

    {/* Last Activity */}
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <InfoItem
        label="Last Activity"
        value={formatRelativeTime(agency.last_activity)}
      />
    </div>
  </div>
);

const InfoItem = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
      {value}
    </p>
  </div>
);

const StatItem = ({ label, value, description }) => (
  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {value}
    </p>
    {description && (
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 leading-relaxed">
        {description}
      </p>
    )}
  </div>
);

// ConfirmationDialog Component
const ConfirmationDialog = ({
  type,
  data,
  confirmText,
  setConfirmText,
  onConfirm,
  onCancel,
  tPage,
}) => {
  const canConfirm = () => {
    if (type === "delete") {
      return confirmText === data.name;
    }
    return true;
  };

  const getButtonColor = () => {
    if (type === "delete" || type === "bulkDelete") {
      return canConfirm()
        ? "bg-red-600 hover:bg-red-700"
        : "bg-gray-400 cursor-not-allowed";
    }
    return canConfirm()
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-gray-400 cursor-not-allowed";
  };

  const getTitle = () => {
    switch (type) {
      case "delete":
        return tPage("confirmDialog.delete.title") || "Delete Agency";
      case "bulkDelete":
        return tPage("confirmDialog.bulkDelete.title") || "Delete Multiple Agencies";
      case "statusChange":
        return tPage("confirmDialog.statusChange.title") || "Change Status";
      case "singleStatusChange":
        return tPage("confirmDialog.singleStatusChange.title") || "Change Agency Status";
      default:
        return "Confirm Action";
    }
  };

  const getMessage = () => {
    switch (type) {
      case "delete":
        return tPage("confirmDialog.delete.message") || "Are you sure you want to delete this agency?";
      case "bulkDelete":
        return tPage("confirmDialog.bulkDelete.message", { count: data?.ids?.length || 0 }) || 
               `Are you sure you want to delete ${data?.ids?.length || 0} agencies?`;
      case "statusChange":
        return tPage("confirmDialog.statusChange.message", {
          count: data?.ids?.length || 0,
          status: tPage(`status.${data?.status}`) || data?.status,
        }) || `Change status for ${data?.ids?.length || 0} agencies?`;
      case "singleStatusChange":
        return tPage("confirmDialog.singleStatusChange.message", {
          agencyName: data?.agencyName || "this agency",
          status: tPage(`status.${data?.newStatus}`) || data?.newStatus,
        }) || `Change status of ${data?.agencyName || "this agency"}?`;
      default:
        return "Are you sure you want to proceed?";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
          {getTitle()}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {getMessage()}
        </p>

        {type === "delete" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {tPage("confirmDialog.delete.typeToConfirm")}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={tPage("confirmDialog.delete.placeholder")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Type: <span className="font-mono font-semibold">{data.name}</span>
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {type === "delete"
              ? tPage("confirmDialog.delete.cancel") || "Cancel"
              : type === "singleStatusChange"
              ? tPage("confirmDialog.singleStatusChange.cancel") || "Cancel"
              : tPage("confirmDialog.bulkDelete.cancel") || "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm()}
            className={`px-4 py-2 rounded-lg text-white ${getButtonColor()}`}
          >
            {type === "delete" && (tPage("confirmDialog.delete.confirm") || "Delete")}
            {type === "bulkDelete" && (tPage("confirmDialog.bulkDelete.confirm") || "Delete All")}
            {type === "statusChange" && (tPage("confirmDialog.statusChange.confirm") || "Confirm")}
            {type === "singleStatusChange" && (tPage("confirmDialog.singleStatusChange.confirm") || "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerAgencies;
