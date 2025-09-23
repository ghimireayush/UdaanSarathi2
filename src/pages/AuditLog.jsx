import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  History, 
  User, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  FileText, 
  Settings, 
  Upload, 
  Edit, 
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'
import { auditService } from '../services/index.js'
import { InteractivePagination, PaginationInfo, ItemsPerPageSelector, InteractiveButton, InteractiveCard, InteractiveLoader } from '../components/InteractiveUI'

const AuditLogPage = () => {
  const [auditLogs, setAuditLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    user_id: '',
    resource_type: '',
    action: '',
    date_from: '',
    date_to: '',
    page: 1,
    limit: 20
  })
  const [expandedLogs, setExpandedLogs] = useState(new Set())
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')
  const [filterChangeCount, setFilterChangeCount] = useState(0)

  // Clear corrupted audit logs if needed
  const clearCorruptedLogs = () => {
    try {
      localStorage.removeItem('udaan_audit_logs')
      window.location.reload()
    } catch (e) {
      console.error('Failed to clear corrupted logs:', e)
    }
  }

  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setIsLoading(true)
        
        // Add some sample data if no logs exist
        const existingLogs = await auditService.getAuditLogs({ page: 1, limit: 1 })
        if (existingLogs.total === 0) {
          // Create comprehensive sample audit logs
          await auditService.logEvent({
            user_id: 'user_1',
            user_name: 'System Administrator',
            action: 'LOGIN',
            resource_type: 'AUTH',
            resource_id: 'auth_session_001',
            changes: {},
            ip_address: '192.168.1.100',
            user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            session_id: 'session_admin_001',
            metadata: { 
              role: 'Administrator',
              browser: 'Chrome 120.0',
              login_timestamp: new Date().toISOString()
            }
          })
          
          await auditService.logEvent({
            user_id: 'user_1',
            user_name: 'System Administrator',
            action: 'UPDATE',
            resource_type: 'AGENCY_PROFILE',
            resource_id: 'agency_001',
            changes: {
              name: { from: 'Old Agency Name', to: 'UdaanSarathi Recruitment Agency' },
              email: { from: 'old@agency.com', to: 'contact@udaansarathi.com' },
              phone: { from: '+971-4-1234567', to: '+971-4-7654321' }
            },
            ip_address: '192.168.1.100',
            session_id: 'session_admin_001',
            metadata: { 
              section: 'basic', 
              browser: 'Chrome 120.0',
              change_count: 3
            }
          })
          
          await auditService.logEvent({
            user_id: 'user_2',
            user_name: 'Senior Recruiter',
            action: 'CREATE',
            resource_type: 'JOB_POSTING',
            resource_id: 'job_001',
            changes: {
              title: { from: null, to: 'Senior Software Engineer' },
              status: { from: null, to: 'published' },
              location: { from: null, to: 'Dubai, UAE' }
            },
            ip_address: '192.168.1.101',
            session_id: 'session_recruiter_001',
            metadata: { 
              job_title: 'Senior Software Engineer', 
              job_location: 'Dubai, UAE',
              job_type: 'Full-time',
              creation_timestamp: new Date().toISOString()
            }
          })
          
          await auditService.logEvent({
            user_id: 'user_3',
            user_name: 'Interview Coordinator',
            action: 'FILE_UPLOAD',
            resource_type: 'AGENCY_MEDIA',
            resource_id: 'agency_001',
            changes: {
              logo_url: { from: null, to: '/uploads/agency-logo.png' }
            },
            ip_address: '192.168.1.102',
            session_id: 'session_coordinator_001',
            metadata: { 
              file_name: 'agency-logo.png', 
              file_size: 15420,
              file_type: 'logo'
            }
          })
          
          await auditService.logEvent({
            user_id: 'user_2',
            user_name: 'Senior Recruiter',
            action: 'UPDATE',
            resource_type: 'APPLICATION',
            resource_id: 'app_candidate_001',
            changes: {
              stage: { from: 'Applied', to: 'Shortlisted' },
              shortlisted_at: { from: 'Not set', to: new Date().toISOString() }
            },
            ip_address: '192.168.1.101',
            session_id: 'session_recruiter_001',
            metadata: { 
              candidate_name: 'Ahmed Hassan',
              stage_change: true,
              update_timestamp: new Date().toISOString()
            }
          })
          
          await auditService.logEvent({
            user_id: 'user_3',
            user_name: 'Interview Coordinator',
            action: 'CREATE',
            resource_type: 'INTERVIEW',
            resource_id: 'interview_001',
            changes: {
              status: { from: null, to: 'scheduled' },
              scheduled_date: { from: null, to: new Date(Date.now() + 86400000).toISOString() }
            },
            ip_address: '192.168.1.102',
            session_id: 'session_coordinator_001',
            metadata: { 
              candidate_name: 'Ahmed Hassan',
              interview_type: 'Technical Interview',
              scheduled_date: new Date(Date.now() + 86400000).toISOString()
            }
          })
        }
        
        const logsResponse = await auditService.getAuditLogs(filters)
        
        // Validate and sanitize logs data
        const sanitizedLogs = (logsResponse.logs || []).map(log => {
          try {
            // Ensure log has required fields
            return {
              id: log.id || `log_${Date.now()}_${Math.random()}`,
              timestamp: log.timestamp || new Date().toISOString(),
              user_id: log.user_id || 'unknown',
              user_name: log.user_name || 'Unknown User',
              action: log.action || 'UNKNOWN',
              resource_type: log.resource_type || 'UNKNOWN',
              resource_id: log.resource_id || 'unknown',
              changes: log.changes || {},
              ip_address: log.ip_address || 'N/A',
              session_id: log.session_id || 'unknown',
              metadata: log.metadata || {}
            }
          } catch (e) {
            console.warn('Error sanitizing log:', log, e)
            return {
              id: `error_log_${Date.now()}`,
              timestamp: new Date().toISOString(),
              user_id: 'system',
              user_name: 'System',
              action: 'ERROR',
              resource_type: 'SYSTEM',
              resource_id: 'error',
              changes: {},
              ip_address: 'N/A',
              session_id: 'error',
              metadata: { error: 'Corrupted log data' }
            }
          }
        })
        
        setAuditLogs(sanitizedLogs)
        setTotal(logsResponse.total || 0)
        setTotalPages(logsResponse.total_pages || 0)
      } catch (err) {
        setError('Failed to load audit logs')
        console.error('Audit log fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuditLogs()
  }, [filters])

  // Prepare downloadable PDF with jsPDF + html2canvas via dynamic import
  const logsContainerRef = useRef(null)
  const exportPDF = async () => {
    try {
      const [{ jsPDF }, html2canvas] = await Promise.all([
        import('https://esm.sh/jspdf@2.5.1'),
        import('https://esm.sh/html2canvas@1.4.1')
      ])
      // Make html2canvas available for jsPDF.html
      // @ts-ignore
      window.html2canvas = html2canvas.default || html2canvas

      const now = new Date()
      // Build a lightweight container for export
      const wrapper = document.createElement('div')
      wrapper.style.width = '800px'
      wrapper.style.padding = '24px'
      wrapper.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial'
      wrapper.innerHTML = `
        <h1 style="font-size:20px;margin:0 0 12px;">Audit Log</h1>
        <div style="font-size:12px;color:#4B5563;margin-bottom:16px;">Exported: ${now.toLocaleString()} | Page ${filters.page} | Limit ${filters.limit}</div>
        ${filteredLogs.map(l => `
          <div style="border:1px solid #E5E7EB;border-radius:8px;margin:10px 0;page-break-inside:avoid;">
            <div style="padding:10px 12px;background:#F9FAFB;display:flex;align-items:center;justify-content:space-between;">
              <div style="font-weight:600;">${auditService.getActionLabel(l.action)} <span style="color:#6B7280;font-weight:400;">by ${l.user_name}</span></div>
              <div style="display:inline-block;padding:2px 8px;border-radius:9999px;background:#EEF2FF;color:#3730A3;font-size:10px;">${auditService.getResourceLabel(l.resource_type)}</div>
            </div>
            <div style="padding:12px;font-size:12px;">
              <div style="display:flex;gap:16px;color:#4B5563;"><div><strong>Timestamp:</strong> ${new Date(l.timestamp).toLocaleString()}</div><div><strong>User:</strong> ${l.user_id}</div></div>
              ${l.changes && Object.keys(l.changes).length ? `<div style="margin-top:8px;"><strong>Changes:</strong> ${Object.keys(l.changes).length} field(s)</div>` : ''}
              <div style="margin-top:8px;color:#6B7280;">Session: ${l.session_id || 'unknown_session'} | IP: ${l.ip_address || 'N/A'}</div>
            </div>
          </div>
        `).join('')}
      `
      document.body.appendChild(wrapper)

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      await doc.html(wrapper, {
        margin: [24, 24, 24, 24],
        autoPaging: 'text',
        x: 0,
        y: 0,
        html2canvas: { scale: 0.72, useCORS: true },
        callback: (doc) => {
          const file = `audit_logs_page${filters.page}_limit${filters.limit}.pdf`
          doc.save(file)
          document.body.removeChild(wrapper)
        }
      })
    } catch (e) {
      console.error('PDF export failed', e)
    }
  }

  // Get icon for action type
  const getActionIcon = (action) => {
    const icons = {
      'UPDATE': Edit,
      'CREATE': FileText,
      'DELETE': AlertCircle,
      'FILE_UPLOAD': Upload,
      'LOGIN': User,
      'LOGOUT': User
    }
    return icons[action] || Settings
  }

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return auditLogs
    const q = search.toLowerCase()
    return auditLogs.filter(log => {
      return (
        log.user_name?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.resource_type?.toLowerCase().includes(q) ||
        log.resource_id?.toLowerCase().includes(q) ||
        auditService.getActionLabel(log.action)?.toLowerCase().includes(q) ||
        auditService.getResourceLabel(log.resource_type)?.toLowerCase().includes(q) ||
        log.ip_address?.toLowerCase().includes(q) ||
        log.session_id?.toLowerCase().includes(q)
      )
    })
  }, [auditLogs, search])

  const exportCSV = () => {
    const headers = ['id','timestamp','user_id','user_name','action','resource_type','resource_id','ip_address','session_id']
    const rows = filteredLogs.map(l => headers.map(h => JSON.stringify(l[h] ?? (h==='timestamp'? new Date(l.timestamp).toISOString(): ''))).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_page${filters.page}_limit${filters.limit}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get color for action type
  const getActionColor = (action) => {
    const colors = {
      'UPDATE': 'chip-blue',
      'CREATE': 'chip-green',
      'DELETE': 'chip-red',
      'FILE_UPLOAD': 'chip-purple',
      'LOGIN': 'chip-gray',
      'LOGOUT': 'chip-gray'
    }
    return colors[action] || 'chip-gray'
  }

  // Format changes for display
  const formatChanges = (changes) => {
    if (!changes || typeof changes !== 'object') {
      return []
    }
    
    try {
      return Object.entries(changes).map(([field, change]) => {
        // Handle different change formats
        let fromValue, toValue
        
        try {
          if (change && typeof change === 'object' && ('from' in change || 'to' in change)) {
            fromValue = change.from
            toValue = change.to
          } else {
            // If change is the actual value, treat it as 'to' value
            fromValue = null
            toValue = change
          }
          
          return {
            field: String(field),
            from: fromValue,
            to: toValue
          }
        } catch (e) {
          console.warn('Error processing change for field:', field, e)
          return {
            field: String(field),
            from: '[Error - Cannot display]',
            to: '[Error - Cannot display]'
          }
        }
      })
    } catch (e) {
      console.warn('Error processing changes:', e)
      return []
    }
  }

  // Toggle expanded log details
  const toggleExpanded = (logId) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    console.log('Filter changed:', key, value) // Debug log
    setFilterChangeCount(prev => prev + 1) // Track filter changes
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      user_id: '',
      resource_type: '',
      action: '',
      date_from: '',
      date_to: '',
      page: 1,
      limit: 20
    })
    setSearch('')
  }

  // Refresh logs
  const refreshLogs = () => {
    setFilters(prev => ({ ...prev, _refresh: Date.now() }))
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <History className="w-6 h-6 mr-2" />
              Audit Log
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Track and monitor all system activities and changes
            </p>
          </div>
        </div>
        <InteractiveLoader type="spinner" size="lg" text="Loading audit logs..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <History className="w-6 h-6 mr-2" />
            Audit Log
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track and monitor all system activities and changes
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="form-input w-64"
            aria-label="Search audit logs"
          />
          <InteractiveButton 
            onClick={refreshLogs}
            variant="secondary"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </InteractiveButton>
          <button 
            onClick={exportCSV}
            className="btn-secondary"
            aria-label="Export audit logs as CSV"
          >
            Export CSV
          </button>
          <button 
            onClick={exportPDF}
            className="btn-secondary"
            aria-label="Download audit logs as PDF"
          >
            Download PDF
          </button>
          <button 
            onClick={clearCorruptedLogs}
            className="btn-secondary text-red-600 hover:text-red-800"
            aria-label="Clear corrupted audit logs"
            title="Use this if you're experiencing rendering errors"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <InteractiveCard className="p-6 mb-6" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Filters</h3>
          <div className="flex items-center space-x-2">
            {filterChangeCount > 0 && (
              <span className="chip chip-green text-xs">
                {filterChangeCount} changes
              </span>
            )}
            {(filters.user_id || filters.resource_type || filters.action || filters.date_from || filters.date_to) && (
              <span className="chip chip-blue">
                {[filters.user_id, filters.resource_type, filters.action, filters.date_from, filters.date_to].filter(Boolean).length} active
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User</label>
            <select
              value={filters.user_id}
              onChange={(e) => {
                console.log('User filter clicked:', e.target.value)
                handleFilterChange('user_id', e.target.value)
              }}
              className={`form-select ${filters.user_id ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
              aria-label="Filter by user"
            >
              <option value="">All Users</option>
              <option value="user_1">System Administrator</option>
              <option value="user_2">Senior Recruiter</option>
              <option value="user_3">Interview Coordinator</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Type</label>
            <select
              value={filters.resource_type}
              onChange={(e) => {
                console.log('Resource type filter clicked:', e.target.value)
                handleFilterChange('resource_type', e.target.value)
              }}
              className={`form-select ${filters.resource_type ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
              aria-label="Filter by resource type"
            >
              <option value="">All Types</option>
              <option value="AGENCY_PROFILE">Agency Profile</option>
              <option value="AGENCY_MEDIA">Agency Media</option>
              <option value="JOB_POSTING">Job Posting</option>
              <option value="CANDIDATE">Candidate</option>
              <option value="APPLICATION">Application</option>
              <option value="USER">User</option>
              <option value="AUTH">Auth</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => {
                console.log('Action filter clicked:', e.target.value)
                handleFilterChange('action', e.target.value)
              }}
              className={`form-select ${filters.action ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
              aria-label="Filter by action type"
            >
              <option value="">All Actions</option>
              <option value="UPDATE">Update</option>
              <option value="CREATE">Create</option>
              <option value="DELETE">Delete</option>
              <option value="FILE_UPLOAD">File Upload</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => {
                console.log('Date from filter clicked:', e.target.value)
                handleFilterChange('date_from', e.target.value)
              }}
              className={`form-input ${filters.date_from ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
              aria-label="Filter from date"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => {
                console.log('Date to filter clicked:', e.target.value)
                handleFilterChange('date_to', e.target.value)
              }}
              className={`form-input ${filters.date_to ? 'ring-2 ring-primary-500 border-primary-500' : ''}`}
              style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
              aria-label="Filter to date"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            {filters.user_id && (
              <span className="chip chip-blue">
                User: {filters.user_id === 'user_1' ? 'System Administrator' : 
                       filters.user_id === 'user_2' ? 'Senior Recruiter' : 
                       'Interview Coordinator'}
                <button 
                  onClick={() => handleFilterChange('user_id', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  aria-label="Remove user filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.resource_type && (
              <span className="chip chip-green">
                Type: {auditService.getResourceLabel(filters.resource_type)}
                <button 
                  onClick={() => handleFilterChange('resource_type', '')}
                  className="ml-1 text-green-600 hover:text-green-800"
                  aria-label="Remove resource type filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.action && (
              <span className="chip chip-purple">
                Action: {auditService.getActionLabel(filters.action)}
                <button 
                  onClick={() => handleFilterChange('action', '')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                  aria-label="Remove action filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.date_from && (
              <span className="chip chip-yellow">
                From: {filters.date_from}
                <button 
                  onClick={() => handleFilterChange('date_from', '')}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                  aria-label="Remove date from filter"
                >
                  ×
                </button>
              </span>
            )}
            {filters.date_to && (
              <span className="chip chip-orange">
                To: {filters.date_to}
                <button 
                  onClick={() => handleFilterChange('date_to', '')}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                  aria-label="Remove date to filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          
          <InteractiveButton 
            onClick={resetFilters}
            variant="secondary"
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset All
          </InteractiveButton>
        </div>
      </InteractiveCard>

      {error && (
        <InteractiveCard variant="danger" className="p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </InteractiveCard>
      )}

      {/* Audit Logs */}
      <InteractiveCard className="p-6" ref={logsContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No audit logs found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {search || filters.user_id || filters.resource_type || filters.action || filters.date_from || filters.date_to
                ? 'No logs match your current filters. Try adjusting your search criteria.'
                : 'Activity logs will appear here when changes are made to the system.'
              }
            </p>
            {(search || filters.user_id || filters.resource_type || filters.action || filters.date_from || filters.date_to) && (
              <InteractiveButton 
                onClick={resetFilters}
                variant="secondary"
                className="mt-4"
              >
                Clear All Filters
              </InteractiveButton>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map(log => {
              try {
                const ActionIcon = getActionIcon(log.action)
                const isExpanded = expandedLogs.has(log.id)
                const changes = formatChanges(log.changes)
                
                return (
                <InteractiveCard key={log.id} clickable hoverable>
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => toggleExpanded(log.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${auditService.getActionLabel(log.action)} by ${log.user_name}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleExpanded(log.id)
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                          <ActionIcon className="w-4 h-4" />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {auditService.getActionLabel(log.action)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              by {log.user_name}
                            </span>
                            {log.metadata?.role && (
                              <span className="chip chip-purple text-xs">{log.metadata.role}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              <span className="text-gray-600 dark:text-gray-300">{format(new Date(log.timestamp), 'PPp')}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              <span>ID: {log.user_id || 'Unknown'}</span>
                            </div>
                            
                            {changes.length > 0 && (
                              <div>
                                {changes.length} field{changes.length !== 1 ? 's' : ''} changed
                              </div>
                            )}
                            
                            {log.resource_type && (
                              <div className="chip-blue">
                                {auditService.getResourceLabel(log.resource_type)}
                              </div>
                            )}
                            
                            {log.resource_id && (
                              <div className="text-xs text-gray-400">
                                Resource: {log.resource_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800">
                      {changes.length > 0 ? (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Changes Made:</h4>
                          <div className="space-y-3">
                            {changes.map((change, index) => (
                              <div key={index} className="bg-white dark:bg-gray-700 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                                <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  {change.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-500 dark:text-gray-400 mb-1">From:</div>
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-1 text-red-800 dark:text-red-200 max-h-32 overflow-auto font-mono text-xs">
                                      {(() => {
                                        if (change.from === null || change.from === undefined || change.from === '') {
                                          return '(Not set)'
                                        }
                                        if (typeof change.from === 'object') {
                                          try {
                                            return JSON.stringify(change.from, null, 2)
                                          } catch (e) {
                                            return '[Object - Cannot display]'
                                          }
                                        }
                                        try {
                                          return String(change.from)
                                        } catch (e) {
                                          return '[Value - Cannot display]'
                                        }
                                      })()}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="text-gray-500 dark:text-gray-400 mb-1">To:</div>
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-2 py-1 text-green-800 dark:text-green-200 max-h-32 overflow-auto font-mono text-xs">
                                      {(() => {
                                        if (change.to === null || change.to === undefined || change.to === '') {
                                          return '(Not set)'
                                        }
                                        if (typeof change.to === 'object') {
                                          try {
                                            return JSON.stringify(change.to, null, 2)
                                          } catch (e) {
                                            return '[Object - Cannot display]'
                                          }
                                        }
                                        try {
                                          return String(change.to)
                                        } catch (e) {
                                          return '[Value - Cannot display]'
                                        }
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400">No detailed changes recorded.</p>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">System Information:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="space-y-1">
                            <div><strong>User ID:</strong> {log.user_id || 'Not specified'}</div>
                            <div><strong>User Name:</strong> {log.user_name || 'Not specified'}</div>
                            <div><strong>Action Type:</strong> {log.action || 'Not specified'}</div>
                            <div><strong>Resource Type:</strong> {log.resource_type || 'Not specified'}</div>
                            <div><strong>Resource ID:</strong> {log.resource_id || 'Not specified'}</div>
                          </div>
                          <div className="space-y-1">
                            <div><strong>Session ID:</strong> {log.session_id || 'Not available'}</div>
                            <div><strong>IP Address:</strong> {log.ip_address || 'Not available'}</div>
                            <div><strong>User Agent:</strong> {log.user_agent || 'Not available'}</div>
                            <div><strong>Timestamp:</strong> {log.timestamp ? format(new Date(log.timestamp), 'PPpp') : 'Not available'}</div>
                          </div>
                        </div>
                        
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Additional Metadata:</h5>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              {log.metadata.file_name && (
                                <div><strong>File:</strong> {log.metadata.file_name}</div>
                              )}
                              {log.metadata.file_size && (
                                <div><strong>File Size:</strong> {(log.metadata.file_size / 1024).toFixed(1)} KB</div>
                              )}
                              {log.metadata.browser && (
                                <div><strong>Browser:</strong> {log.metadata.browser}</div>
                              )}
                              {log.metadata.section && (
                                <div><strong>Section:</strong> {log.metadata.section}</div>
                              )}
                              {log.metadata.role && (
                                <div><strong>User Role:</strong> {log.metadata.role}</div>
                              )}
                              {log.metadata.job_title && (
                                <div><strong>Job Title:</strong> {log.metadata.job_title}</div>
                              )}
                              {log.metadata.candidate_name && (
                                <div><strong>Candidate:</strong> {log.metadata.candidate_name}</div>
                              )}
                              {log.metadata.stage_change && (
                                <div><strong>Stage Change:</strong> Yes</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </InteractiveCard>
              )
              } catch (error) {
                console.error('Error rendering audit log:', log.id, error)
                return (
                  <InteractiveCard key={log.id} variant="danger">
                    <div className="p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                          <p className="text-red-800 dark:text-red-200 font-medium">Error displaying audit log</p>
                          <p className="text-red-600 dark:text-red-400 text-sm">Log ID: {log.id}</p>
                        </div>
                      </div>
                    </div>
                  </InteractiveCard>
                )
              }
            })}
          </div>
        )}
      </InteractiveCard>

      {/* Footer controls: Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <PaginationInfo
          currentPage={filters.page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={filters.limit}
        />
        <div className="flex items-center gap-4">
          <ItemsPerPageSelector
            value={filters.limit}
            onChange={(val) => setFilters(prev => ({ ...prev, limit: val, page: 1 }))}
            options={[10,20,50,100]}
          />
          <InteractivePagination
            currentPage={filters.page}
            totalPages={totalPages}
            onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}

export default AuditLogPage