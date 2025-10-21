import { useState, useEffect } from 'react'
import { Building2, CheckCircle, PauseCircle, Users, Briefcase, TrendingUp, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { useLanguage } from '../hooks/useLanguage'

const OwnerDashboard = () => {
  const { tPageSync } = useLanguage({ 
    pageName: 'owner-dashboard', 
    autoLoad: true 
  })

  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  // Mock data - In production, fetch from API
  const [stats, setStats] = useState({
    totalAgencies: 0,
    activeAgencies: 0,
    inactiveAgencies: 0,
    totalActiveUsers: 0,
    totalActiveJobs: 0,
    loading: true
  })

  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalAgencies: 45,
        activeAgencies: 38,
        inactiveAgencies: 7,
        totalActiveUsers: 234,
        totalActiveJobs: 156,
        loading: false
      })

      setRecentActivity([
        { id: 1, agency: 'Tech Solutions Pvt Ltd', action: 'new_agency', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { id: 2, agency: 'Global Recruiters', action: 'job_posted', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
        { id: 3, agency: 'HR Consultancy Nepal', action: 'status_changed', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) },
        { id: 4, agency: 'Manpower Services', action: 'job_posted', timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) },
        { id: 5, agency: 'Career Builders', action: 'new_agency', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        { id: 6, agency: 'Talent Hub', action: 'job_posted', timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000) },
        { id: 7, agency: 'Employment Solutions', action: 'status_changed', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      ])
    }, 500)
  }, [])

  const activePercentage = stats.totalAgencies > 0 
    ? Math.round((stats.activeAgencies / stats.totalAgencies) * 100) 
    : 0

  const inactivePercentage = stats.totalAgencies > 0 
    ? Math.round((stats.inactiveAgencies / stats.totalAgencies) * 100) 
    : 0

  const avgJobsPerAgency = stats.activeAgencies > 0 
    ? (stats.totalActiveJobs / stats.activeAgencies).toFixed(1) 
    : 0

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)
    
    if (seconds < 60) return tPage('timeAgo.justNow')
    if (seconds < 3600) return tPage('timeAgo.minutesAgo', { count: Math.floor(seconds / 60) })
    if (seconds < 86400) return tPage('timeAgo.hoursAgo', { count: Math.floor(seconds / 3600) })
    return tPage('timeAgo.daysAgo', { count: Math.floor(seconds / 86400) })
  }

  const getActionText = (action) => {
    const actions = {
      new_agency: tPage('activity.newAgency'),
      job_posted: tPage('activity.jobPosted'),
      status_changed: tPage('activity.statusChanged')
    }
    return actions[action] || action
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color, loading }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
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
          <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace(/-(500|600|700)/, '-100')} dark:bg-opacity-20`}>
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {tPage('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {tPage('subtitle')}
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          icon={Building2}
          title={tPage('metrics.totalAgencies')}
          value={stats.totalAgencies}
          color="text-blue-600 dark:text-blue-400"
          loading={stats.loading}
        />
        
        <StatCard
          icon={CheckCircle}
          title={tPage('metrics.activeAgencies')}
          value={stats.activeAgencies}
          subtitle={`${activePercentage}% ${tPage('metrics.ofTotal')}`}
          color="text-green-600 dark:text-green-400"
          loading={stats.loading}
        />
        
        <StatCard
          icon={PauseCircle}
          title={tPage('metrics.inactiveAgencies')}
          value={stats.inactiveAgencies}
          subtitle={`${inactivePercentage}% ${tPage('metrics.ofTotal')}`}
          color="text-orange-600 dark:text-orange-400"
          loading={stats.loading}
        />
        
        <StatCard
          icon={Users}
          title={tPage('metrics.totalActiveUsers')}
          value={stats.totalActiveUsers}
          color="text-purple-600 dark:text-purple-400"
          loading={stats.loading}
        />
        
        <StatCard
          icon={Briefcase}
          title={tPage('metrics.totalActiveJobs')}
          value={stats.totalActiveJobs}
          color="text-amber-600 dark:text-amber-400"
          loading={stats.loading}
        />
      </div>

      {/* Quick Stats and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-blue-bright" />
              {tPage('quickStats.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {tPage('quickStats.avgJobsPerAgency')}
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {avgJobsPerAgency}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {tPage('quickStats.activationRate')}
              </span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                {activePercentage}%
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {tPage('quickStats.avgUsersPerAgency')}
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stats.activeAgencies > 0 ? (stats.totalActiveUsers / stats.activeAgencies).toFixed(1) : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-blue-bright" />
              {tPage('recentActivity.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {tPage('recentActivity.noActivity')}
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
    </div>
  )
}

export default OwnerDashboard
