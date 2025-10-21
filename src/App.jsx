import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import OwnerLayout from './components/OwnerLayout'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobDetails from './pages/JobDetails'
import JobShortlist from './pages/JobShortlist'
import Register from './pages/Register'
import CompanySetup from './pages/CompanySetup'
import MemberManagement from './pages/MemberManagement'

import Applications from './pages/Applications'
import Interviews from './pages/Interviews'
import Workflow from './pages/Workflow'
import Drafts from './pages/Drafts'
import DraftWizard from './pages/DraftWizard'
import AgencySettings from './pages/AgencySettings'
import Login from './pages/Login'
import OwnerLogin from './pages/OwnerLogin'
import OwnerDashboard from './pages/OwnerDashboard'
import OwnerAgencies from './pages/OwnerAgencies'
import OwnerUsers from './pages/OwnerUsers'
import OwnerSettings from './pages/OwnerSettings'
import AuditLogPage from './pages/AuditLog'
import Members from './pages/Members'
import MemberLogin from './pages/MemberLogin'

import MVPTestingDashboard from './components/MVPTestingDashboard.jsx'
import PrivateRoute from './components/PrivateRoute'
import ErrorBoundary from './components/ErrorBoundary'
import ToastProvider from './components/ToastProvider'
import ConfirmProvider from './components/ConfirmProvider'
import { NotificationProvider } from './contexts/NotificationContext'
import { AgencyProvider } from './contexts/AgencyContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { PERMISSIONS } from './services/authService.js'
import i18nService from './services/i18nService'
import accessibilityService from './services/accessibilityService'

function App() {
  // Initialize i18n service
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      accessibilityService.cleanup()
    }
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <AgencyProvider>
              <ToastProvider>
                <ConfirmProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/login/member" element={<MemberLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/setup-company" element={<CompanySetup />} />
                
                {/* Owner Portal Routes */}
                <Route path="/owner/login" element={<OwnerLogin />} />
                <Route path="/owner/dashboard" element={<OwnerLayout><PrivateRoute><OwnerDashboard /></PrivateRoute></OwnerLayout>} />
                <Route path="/owner/agencies" element={<OwnerLayout><PrivateRoute><OwnerAgencies /></PrivateRoute></OwnerLayout>} />
                <Route path="/owner/users" element={<OwnerLayout><PrivateRoute><OwnerUsers /></PrivateRoute></OwnerLayout>} />
                <Route path="/owner/settings" element={<OwnerLayout><PrivateRoute><OwnerSettings /></PrivateRoute></OwnerLayout>} />
                
                {/* Agency Portal Routes */}
                <Route path="/" element={<Layout><PrivateRoute><Dashboard /></PrivateRoute></Layout>} />
                <Route path="/dashboard" element={<Layout><PrivateRoute><Dashboard /></PrivateRoute></Layout>} />
                <Route path="/jobs" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.VIEW_JOBS}><Jobs /></PrivateRoute></Layout>} />
                <Route path="/jobs/:id" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.VIEW_JOBS}><JobDetails /></PrivateRoute></Layout>} />
                <Route path="/jobs/:jobId/shortlist" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.VIEW_APPLICATIONS}><JobShortlist /></PrivateRoute></Layout>} />
                <Route path="/applications" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.VIEW_APPLICATIONS}><Applications /></PrivateRoute></Layout>} />
                <Route path="/interviews" element={<Layout><PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_INTERVIEWS, PERMISSIONS.SCHEDULE_INTERVIEW]}><Interviews /></PrivateRoute></Layout>} />
                <Route path="/workflow" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.VIEW_WORKFLOW}><Workflow /></PrivateRoute></Layout>} />
                <Route path="/drafts" element={<Layout><PrivateRoute requiredPermissions={[PERMISSIONS.CREATE_JOB, PERMISSIONS.EDIT_JOB]}><Drafts /></PrivateRoute></Layout>} />
                <Route path="/draftwizard" element={<Layout><PrivateRoute requiredPermissions={[PERMISSIONS.CREATE_JOB, PERMISSIONS.EDIT_JOB]}><DraftWizard /></PrivateRoute></Layout>} />
                <Route path="/settings" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}><AgencySettings /></PrivateRoute></Layout>} />
                <Route path="/auditlog" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.VIEW_AUDIT_LOGS}><AuditLogPage /></PrivateRoute></Layout>} />
                <Route path="/teammembers" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.MANAGE_MEMBERS}><Members /></PrivateRoute></Layout>} />
                <Route path="/mvp-testing" element={<Layout><PrivateRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}><MVPTestingDashboard /></PrivateRoute></Layout>} />
              </Routes>
                </ConfirmProvider>
              </ToastProvider>
            </AgencyProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App