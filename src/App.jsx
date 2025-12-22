import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import OwnerLayout from "./components/OwnerLayout";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import JobShortlist from "./pages/JobShortlist";
import Register from "./pages/Register";
import CompanySetup from "./pages/CompanySetup";
import MemberManagement from "./pages/MemberManagement";

import Applications from "./pages/Applications";
import Interviews from "./pages/Interviews";
import WorkflowV2 from "./pages/WorkflowV2";
import Drafts from "./pages/Drafts";
import DraftWizard from "./pages/DraftWizard";
import AgencySettings from "./pages/AgencySettings";
import Login from "./pages/Login";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerAgencies from "./pages/OwnerAgencies";
import OwnerAnalytics from "./pages/OwnerAnalytics";
import OwnerAgencyDetails from "./pages/OwnerAgencyDetails";
import OwnerAuditLog from "./pages/OwnerAuditLog";
import OwnerContentManagement from "./pages/OwnerContentManagement";

import AuditLogPage from "./pages/AuditLog";
import Members from "./pages/Members";
import JobManagement from "./pages/JobManagement";
import JobManagementEdit from "./pages/JobManagementEdit";
import MemberLogin from "./pages/MemberLogin";
import PublicLandingPage from "./pages/PublicLandingPage";
import AboutPage from "./pages/AboutPage";
import PolicyPage from "./pages/PolicyPage";
import TermsPage from "./pages/TermsPage";

import MVPTestingDashboard from "./components/MVPTestingDashboard.jsx";
import S2TestHarness from "./components/S2TestHarness.jsx";
import PrivateRoute from "./components/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastProvider from "./components/ToastProvider";
import ConfirmProvider from "./components/ConfirmProvider";
import DialogProvider from "./components/DialogProvider";
import LoadingScreen from "./components/LoadingScreen";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AgencyProvider } from "./contexts/AgencyContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { WorkflowStagesProvider } from "./contexts/WorkflowStagesContext";
import { useAuth } from "./contexts/AuthContext";
import { PERMISSIONS } from "./services/authService.js";
import i18nService from "./services/i18nService";
import accessibilityService from "./services/accessibilityService";
import { setUnauthorizedHandler } from "./utils/errorHandler";
import { Suspense } from "react";

function App() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Set up global 401 unauthorized handler
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      console.log('Global 401 handler: Logging out user...');
      await logout();
      navigate('/', { replace: true });
    });
  }, [logout, navigate]);

  // Initialize i18n service
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      accessibilityService.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <AgencyProvider>
              <WorkflowStagesProvider>
                <ToastProvider>
                  <ConfirmProvider>
                    <DialogProvider>
                      <Suspense fallback={<LoadingScreen />}>
                        <Routes>
                    {/* Public Routes */}
                    <Route path="/public" element={<PublicLandingPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/privacy-policy" element={<PolicyPage />} />
                    <Route path="/terms-and-conditions" element={<TermsPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/login/member" element={<MemberLogin />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/setup-company" element={<CompanySetup />} />

                    {/* Owner Portal Routes */}
                    <Route path="/owner/login" element={<OwnerLogin />} />
                    <Route
                      path="/owner/dashboard"
                      element={
                        <OwnerLayout>
                          <PrivateRoute>
                            <OwnerDashboard />
                          </PrivateRoute>
                        </OwnerLayout>
                      }
                    />
                    <Route
                      path="/owner/agencies"
                      element={
                        <OwnerLayout>
                          <PrivateRoute>
                            <OwnerAgencies />
                          </PrivateRoute>
                        </OwnerLayout>
                      }
                    />
                    <Route
                      path="/owner/analytics"
                      element={
                        <OwnerLayout>
                          <PrivateRoute>
                            <OwnerAnalytics />
                          </PrivateRoute>
                        </OwnerLayout>
                      }
                    />
                    <Route
                      path="/owner/analytics/:agencyId"
                      element={
                        <OwnerLayout>
                          <PrivateRoute>
                            <OwnerAgencyDetails />
                          </PrivateRoute>
                        </OwnerLayout>
                      }
                    />
                    <Route
                      path="/owner/auditlog"
                      element={
                        <OwnerLayout>
                          <PrivateRoute>
                            <OwnerAuditLog />
                          </PrivateRoute>
                        </OwnerLayout>
                      }
                    />
                    <Route
                      path="/owner/content"
                      element={
                        <OwnerLayout>
                          <PrivateRoute>
                            <OwnerContentManagement />
                          </PrivateRoute>
                        </OwnerLayout>
                      }
                    />

                    {/* Agency Portal Routes */}
                    <Route
                      path="/"
                      element={<PublicLandingPage />}
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <Layout>
                          <PrivateRoute>
                            <Dashboard />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/jobs"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.VIEW_JOBS}
                          >
                            <Jobs />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/jobs/:id"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.VIEW_JOBS}
                          >
                            <JobDetails />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/jobs/:jobId/shortlist"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.VIEW_APPLICATIONS}
                          >
                            <JobShortlist />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/applications"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.VIEW_APPLICATIONS}
                          >
                            <Applications />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/interviews"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermissions={[
                              PERMISSIONS.VIEW_INTERVIEWS,
                              PERMISSIONS.SCHEDULE_INTERVIEW,
                            ]}
                          >
                            <Interviews />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/workflow"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.VIEW_WORKFLOW}
                          >
                            <WorkflowV2 />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/drafts"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermissions={[
                              PERMISSIONS.CREATE_JOB,
                              PERMISSIONS.EDIT_JOB,
                            ]}
                          >
                            <Drafts />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/draftwizard"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermissions={[
                              PERMISSIONS.CREATE_JOB,
                              PERMISSIONS.EDIT_JOB,
                            ]}
                          >
                            <DraftWizard />
                          </PrivateRoute>
                        </Layout>
                      }
                    />

                    <Route
                      path="/settings"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.MANAGE_SETTINGS}
                          >
                            <AgencySettings />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/auditlog"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.VIEW_AUDIT_LOGS}
                          >
                            <AuditLogPage />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/teammembers"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.MANAGE_MEMBERS}
                          >
                            <Members />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/mvp-testing"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermission={PERMISSIONS.MANAGE_SETTINGS}
                          >
                            <MVPTestingDashboard />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/s2-test"
                      element={
                        <Layout>
                          <PrivateRoute>
                            <S2TestHarness />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/job-management"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermissions={[
                              PERMISSIONS.CREATE_JOB,
                              PERMISSIONS.EDIT_JOB,
                            ]}
                          >
                            <JobManagement />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                    <Route
                      path="/job-management/:id/edit"
                      element={
                        <Layout>
                          <PrivateRoute
                            requiredPermissions={[
                              PERMISSIONS.CREATE_JOB,
                              PERMISSIONS.EDIT_JOB,
                            ]}
                          >
                            <JobManagementEdit />
                          </PrivateRoute>
                        </Layout>
                      }
                    />
                  </Routes>
                      </Suspense>
                    </DialogProvider>
                  </ConfirmProvider>
                </ToastProvider>
              </WorkflowStagesProvider>
            </AgencyProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
