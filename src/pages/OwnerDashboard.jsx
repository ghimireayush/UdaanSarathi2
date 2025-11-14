import { useState, useEffect } from "react";
import {
  Building2,
  CheckCircle,
  PauseCircle,
  Users,
  Briefcase,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { useLanguage } from "../hooks/useLanguage";
import LoadingScreen from "../components/LoadingScreen";

const OwnerDashboard = () => {
  const { tPageSync, isLoading: languageLoading } = useLanguage({
    pageName: "owner-dashboard",
    autoLoad: true,
  });

  const tPage = (key, params = {}) => {
    return tPageSync(key, params);
  };

  // Mock data - In production, fetch from API
  const [stats, setStats] = useState({
    totalAgencies: 0,
    activeAgencies: 0,
    inactiveAgencies: 0,
    totalAgencyUsers: 0,
    totalAppUsers: 0,
    totalActiveJobs: 0,
    totalListedJobs: 0,
    loading: true,
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [showContent, setShowContent] = useState(false);

  // Minimum loading screen display time
  useEffect(() => {
    if (!languageLoading && !stats.loading) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [languageLoading, stats.loading]);

  // Function to load dashboard data
  const loadDashboardData = () => {
    setStats(prev => ({ ...prev, loading: true }));
    
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalAgencies: 45,
        activeAgencies: 38,
        inactiveAgencies: 7,
        totalAgencyUsers: 152,
        totalAppUsers: 1847,
        totalActiveJobs: 156,
        totalListedJobs: 234,
        loading: false,
      });

      setRecentActivity([
        {
          id: 1,
          agency: "Tech Solutions Pvt Ltd",
          action: "new_agency",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: 2,
          agency: "Global Recruiters",
          action: "job_posted",
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          id: 3,
          agency: "HR Consultancy Nepal",
          action: "status_changed",
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        },
        {
          id: 4,
          agency: "Manpower Services",
          action: "job_posted",
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
        {
          id: 5,
          agency: "Career Builders",
          action: "new_agency",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          id: 6,
          agency: "Talent Hub",
          action: "job_posted",
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
        },
        {
          id: 7,
          agency: "Employment Solutions",
          action: "status_changed",
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      ]);
    }, 500);
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Listen for auto-refresh events from OwnerLayout
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[OwnerDashboard] Auto-refreshing data...');
      loadDashboardData();
    };

    window.addEventListener('ownerPageRefresh', handleRefresh);

    return () => {
      window.removeEventListener('ownerPageRefresh', handleRefresh);
    };
  }, []);

  const activePercentage =
    stats.totalAgencies > 0
      ? Math.round((stats.activeAgencies / stats.totalAgencies) * 100)
      : 0;

  const inactivePercentage =
    stats.totalAgencies > 0
      ? Math.round((stats.inactiveAgencies / stats.totalAgencies) * 100)
      : 0;



  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return tPage("timeAgo.justNow");
    if (seconds < 3600)
      return tPage("timeAgo.minutesAgo", { count: Math.floor(seconds / 60) });
    if (seconds < 86400)
      return tPage("timeAgo.hoursAgo", { count: Math.floor(seconds / 3600) });
    return tPage("timeAgo.daysAgo", { count: Math.floor(seconds / 86400) });
  };

  const getActionText = (action) => {
    const actions = {
      new_agency: tPage("activity.newAgency"),
      job_posted: tPage("activity.jobPosted"),
      status_changed: tPage("activity.statusChanged"),
    };
    return actions[action] || action;
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
    loading,
    breakdown,
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              {title}
            </p>
            {loading ? (
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ) : (
              <p className={`text-4xl font-bold ${color} mb-1`}>
                {value.toLocaleString()}
              </p>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={`p-3 rounded-lg ${color
              .replace("text-", "bg-")
              .replace(/-(500|600|700)/, "-100")} dark:bg-opacity-20`}
          >
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
        </div>
        {breakdown && breakdown.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
            {breakdown.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </span>
                <span
                  className={`font-semibold ${
                    item.color || "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {item.value.toLocaleString()}
                  {item.percentage && (
                    <span className="text-xs ml-1 text-gray-500 dark:text-gray-400">
                      ({item.percentage}%)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Show loading screen while translations or data are loading or minimum time hasn't passed
  if (languageLoading || stats.loading || !showContent) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {tPage("title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {tPage("subtitle")}
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Agencies Card with Breakdown */}
        <StatCard
          icon={Building2}
          title={tPage("metrics.totalAgencies")}
          value={stats.totalAgencies}
          color="text-blue-600 dark:text-blue-400"
          loading={stats.loading}
          breakdown={[
            {
              icon: CheckCircle,
              label: tPage("metrics.active"),
              value: stats.activeAgencies,
              percentage: activePercentage,
              color: "text-green-600 dark:text-green-400",
            },
            {
              icon: PauseCircle,
              label: tPage("metrics.inactive"),
              value: stats.inactiveAgencies,
              percentage: inactivePercentage,
              color: "text-orange-600 dark:text-orange-400",
            },
          ]}
        />

        {/* Total Active Users Card with Breakdown */}
        <StatCard
          icon={Users}
          title={tPage("metrics.totalActiveUsers")}
          value={stats.totalAgencyUsers + stats.totalAppUsers}
          color="text-purple-600 dark:text-purple-400"
          loading={stats.loading}
          breakdown={[
            {
              label: tPage("metrics.agencyUsers"),
              value: stats.totalAgencyUsers,
              color: "text-indigo-600 dark:text-indigo-400",
            },
            {
              label: tPage("metrics.appUsers"),
              value: stats.totalAppUsers,
              color: "text-violet-600 dark:text-violet-400",
            },
          ]}
        />

        {/* Total Active Jobs Card with Breakdown */}
        <StatCard
          icon={Briefcase}
          title={tPage("metrics.totalActiveJobs")}
          value={stats.totalActiveJobs}
          color="text-amber-600 dark:text-amber-400"
          loading={stats.loading}
          breakdown={[
            {
              label: tPage("metrics.totalListedJobs"),
              value: stats.totalListedJobs,
              color: "text-blue-600 dark:text-blue-400",
            },
            {
              label: tPage("metrics.activeJobs"),
              value: stats.totalActiveJobs,
              color: "text-green-600 dark:text-green-400",
            },
          ]}
        />
      </div>

      {/* Recent Activity */}
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-blue-bright" />
              {tPage("recentActivity.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {tPage("recentActivity.noActivity")}
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-brand-blue-bright" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activity.agency}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getActionText(activity.action)}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default OwnerDashboard;
