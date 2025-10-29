import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../hooks/useLanguage";
import { agencyService } from "../services";
import {
  Search,
  Filter,
  X,
  TrendingUp,
  Briefcase,
  Users,
  Eye,
  Grid3x3,
  List,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";

const OwnerAnalytics = () => {
  const { tPageSync } = useLanguage({
    pageName: "owner-analytics",
    autoLoad: true,
  });
  const navigate = useNavigate();

  const tPage = (key, params = {}) => tPageSync(key, params);

  // State
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    sortBy: "name",
    sortOrder: "asc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Load agencies
  useEffect(() => {
    loadAgencies();
  }, []);

  // Listen for auto-refresh events from OwnerLayout
  useEffect(() => {
    const handleRefresh = () => {
      console.log("[OwnerAnalytics] Auto-refreshing data...");
      loadAgencies();
    };

    window.addEventListener("ownerPageRefresh", handleRefresh);

    return () => {
      window.removeEventListener("ownerPageRefresh", handleRefresh);
    };
  }, []);

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
          a.email?.toLowerCase().includes(search)
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
        case "jobs":
          aVal = a.statistics?.total_jobs || 0;
          bVal = b.statistics?.total_jobs || 0;
          break;
        case "applicants":
          aVal = a.statistics?.active_applicants || 0;
          bVal = b.statistics?.active_applicants || 0;
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

  const handleViewDetails = (agencyId) => {
    navigate(`/owner/analytics/${agencyId}`);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilters({
      status: "all",
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {tPage("title")}
        </h1>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {tPage("title")}
        </h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-800 dark:text-red-400">{error}</p>
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={tPage("search.placeholder")}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                  showFilters
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Filter className="h-5 w-5" />
                {tPage("filters.title")}
              </button>
              {(searchTerm || filters.status !== "all") && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <X className="h-5 w-5" />
                  {tPage("filters.clear")}
                </button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tPage("filters.status")}
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">{tPage("filters.all")}</option>
                    <option value="active">{tPage("filters.active")}</option>
                    <option value="inactive">
                      {tPage("filters.inactive")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tPage("filters.sortBy")}
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        sortBy: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="name">{tPage("filters.name")}</option>
                    <option value="jobs">{tPage("filters.jobs")}</option>
                    <option value="applicants">
                      {tPage("filters.applicants")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tPage("filters.order")}
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
                    <option value="asc">
                      {filters.sortBy === "name"
                        ? tPage("filters.aToZ")
                        : tPage("filters.lowestFirst")}
                    </option>
                    <option value="desc">
                      {filters.sortBy === "name"
                        ? tPage("filters.zToA")
                        : tPage("filters.highestFirst")}
                    </option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Summary and View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {tPage("results.showing", {
            count: filteredAgencies.length,
            total: agencies.length,
          })}
        </p>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
            title="Grid View"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="text-sm font-medium">Grid</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
            title="List View"
          >
            <List className="h-4 w-4" />
            <span className="text-sm font-medium">List</span>
          </button>
        </div>
      </div>

      {/* Agency Grid/List */}
      {filteredAgencies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {tPage("noResults.title")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {tPage("noResults.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedAgencies.map((agency) => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  onViewDetails={handleViewDetails}
                  tPage={tPage}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedAgencies.map((agency) => (
                <AgencyListItem
                  key={agency.id}
                  agency={agency}
                  onViewDetails={handleViewDetails}
                  tPage={tPage}
                />
              ))}
            </div>
          )}

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
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                    <option value={96}>96</option>
                  </select>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    per page
                  </span>
                </div>

                {/* Page info */}
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredAgencies.length)} of{" "}
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
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
        </>
      )}
    </div>
  );
};

// Agency Card Component (Grid View)
const AgencyCard = ({ agency, onViewDetails, tPage }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden border-t-4 border-t-transparent hover:border-t-blue-500">
      {/* Top Accent Bar */}
      <div
        className={`h-1 ${
          agency.status === "active" ? "bg-green-500" : "bg-gray-400"
        }`}
      />

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              {agency.name.charAt(0)}
            </div>
            {/* Status Indicator Dot */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                agency.status === "active" ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              agency.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {agency.status}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {agency.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {agency.license_number}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              {tPage("card.activeJobs")}
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {agency.statistics?.active_jobs || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Users className="h-4 w-4" />
              {tPage("card.activeApplicants")}
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {agency.statistics?.active_applicants || 0}
            </span>
          </div>
          {agency.team_members && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Users className="h-4 w-4" />
                {tPage("card.teamMembers")}
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {agency.team_members.total}
              </span>
            </div>
          )}
        </div>

        {/* View Details Button with Border Separator */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onViewDetails(agency.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            <Eye className="h-4 w-4" />
            {tPage("card.viewDetails")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

// Agency List Item Component (List View)
const AgencyListItem = ({ agency, onViewDetails, tPage }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-blue-500">
      <CardContent className="p-0">
        <div className="flex items-center">
          {/* Left Accent Bar */}
          <div
            className={`w-1 self-stretch ${
              agency.status === "active" ? "bg-green-500" : "bg-gray-400"
            }`}
          />

          {/* Main Content */}
          <div className="flex-1 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left Section: Avatar + Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Agency Avatar with Status */}
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                    {agency.name.charAt(0)}
                  </div>
                  {/* Status Indicator Dot */}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
                      agency.status === "active"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>

                {/* Agency Name & License */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {agency.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {agency.license_number}
                  </p>
                </div>
              </div>

              {/* Middle Section: Statistics */}
              <div className="flex items-center gap-6">
                {/* Active Jobs */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-0.5">
                      Jobs
                    </p>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 leading-none">
                      {agency.statistics?.active_jobs || 0}
                    </p>
                  </div>
                </div>

                {/* Active Applicants */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-0.5">
                      Applicants
                    </p>
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 leading-none">
                      {agency.statistics?.active_applicants || 0}
                    </p>
                  </div>
                </div>

                {/* Team Members */}
                {agency.team_members && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mb-0.5">
                        Team
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-gray-100 leading-none">
                        {agency.team_members.total}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Section: Action Button with Border Separator */}
              <div className="flex items-center pl-4 border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => onViewDetails(agency.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex-shrink-0 shadow-sm hover:shadow-md"
                >
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerAnalytics;
