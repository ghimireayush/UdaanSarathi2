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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Pagination from "../components/analytics/Pagination";

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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
  });

  // Load agencies
  useEffect(() => {
    loadAgencies();
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

  // Paginated agencies
  const paginatedAgencies = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredAgencies.slice(startIndex, endIndex);
  }, [filteredAgencies, pagination]);

  const totalPages = Math.ceil(filteredAgencies.length / pagination.itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
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
                    <option value="jobs">{tPage("filters.jobs")}</option>
                    <option value="applicants">{tPage("filters.applicants")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tPage("filters.order")}
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, sortOrder: e.target.value }))
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

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {tPage("results.showing", {
            count: filteredAgencies.length,
            total: agencies.length,
          })}
        </p>
      </div>

      {/* Agency Grid */}
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

          {/* Pagination */}
          {filteredAgencies.length > pagination.itemsPerPage && (
            <Card>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={totalPages}
                totalItems={filteredAgencies.length}
                itemsPerPage={pagination.itemsPerPage}
                onPageChange={(page) =>
                  setPagination((prev) => ({ ...prev, currentPage: page }))
                }
                onItemsPerPageChange={(size) =>
                  setPagination({ currentPage: 1, itemsPerPage: size })
                }
                pageSizeOptions={[12, 24, 48, 96]}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Agency Card Component
const AgencyCard = ({ agency, onViewDetails, tPage }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
            {agency.name.charAt(0)}
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

        <button
          onClick={() => onViewDetails(agency.id)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="h-4 w-4" />
          {tPage("card.viewDetails")}
        </button>
      </CardContent>
    </Card>
  );
};

export default OwnerAnalytics;
