import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Users,
  UsersRound,
  Calendar,
  GitBranch,
  FileEdit,
  Settings,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  History,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useAgency } from "../contexts/AgencyContext.jsx";
import { ROLES } from "../services/authService.js";
import { PERMISSIONS } from "../services/authService.js";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess.js";
import { getAccessibleNavItems } from "../config/roleBasedAccess.js";
import ThemeToggle from "./ThemeToggle.jsx";
import { useLanguage } from "../hooks/useLanguage";
import logo from "../assets/inspire-agency-logo.svg";
import { resolveImageUrl } from "../utils/imageHelpers";
import RoleSwitcher from "./DevTools/RoleSwitcher.jsx";

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission, hasAnyPermission, isAdmin } = useAuth();
  const { agencyName, agencyLogo } = useAgency();
  const { tPageSync } = useLanguage({
    pageName: "navigation",
    autoLoad: true,
  });

  // Helper function to get navigation translations with fallback
  const tNav = (key, params = {}) => {
    try {
      const translation = tPageSync(key, params);
      // If translation is the same as the key, it means it wasn't found
      if (translation === key || translation.includes("Missing translation")) {
        // Provide fallback based on the key
        const fallbacks = {
          "items.dashboard": "Dashboard",
          "items.jobs": "Jobs",
          "items.drafts": "Drafts",
          "items.applications": "Applications",
          "items.interviews": "Interviews",
          "items.workflow": "Workflow",
          "items.teamMembers": "Team Members",
          "items.auditLog": "Audit Log",
          "items.agencySettings": "Agency Settings",
          "userMenu.logout": "Logout",
        };
        return fallbacks[key] || key;
      }
      return translation;
    } catch (error) {
      // Provide fallback based on the key
      const fallbacks = {
        "items.dashboard": "Dashboard",
        "items.jobs": "Jobs",
        "items.drafts": "Drafts",
        "items.applications": "Applications",
        "items.interviews": "Interviews",
        "items.workflow": "Workflow",
        "items.teamMembers": "Team Members",
        "items.auditLog": "Audit Log",
        "items.agencySettings": "Agency Settings",
        "userMenu.logout": "Logout",
      };
      return fallbacks[key] || key;
    }
  };

  const { userRole, hasFeatureAccess } = useRoleBasedAccess();

  const handleLogout = async () => {
    // Get the portal they logged in from
    const loginPortal = localStorage.getItem('login_portal') || 'admin';
    
    // Determine redirect path based on login portal
    const redirectPath = loginPortal === 'member' ? '/login/member' : '/login';
    
    // Call logout first
    await logout();
    
    // Then navigate with replace to prevent back button issues
    navigate(redirectPath, { replace: true });
  };

  // Get accessible navigation items based on user role
  const accessibleNavItems = getAccessibleNavItems(userRole);

  // Map icon names to actual icon components
  const iconMap = {
    BarChart3,
    Briefcase,
    Users,
    UsersRound,
    Calendar,
    GitBranch,
    FileEdit,
    Settings,
    History,
  };

  // Build navigation items from accessible items
  const navItems = accessibleNavItems.map(item => ({
    path: item.path,
    label: tNav(`items.${item.label.toLowerCase().replace(/\s+/g, '')}`),
    icon: iconMap[item.icon] || BarChart3,
    show: true,
  })).filter((item) => item.show);

  const isActive = (path) => {
    if (path === "/dashboard" && location.pathname === "/") return true;
    return location.pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex transition-colors duration-200">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="absolute left-0 top-0 bg-brand-navy text-white px-4 py-2 rounded-br-md transform -translate-y-full focus:translate-y-0 transition-transform z-50"
      >
        Skip to main content
      </a>

      {/* Left Sidebar Navigation */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-r border-gray-200/50 dark:border-gray-700/50 pt-5 pb-4 overflow-y-auto shadow-lg">
          <div className="flex items-center flex-shrink-0 px-4 py-4">
            <Link
              to="/dashboard"
              className="w-full flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-brand-blue-bright rounded p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-300"
            >
              <img
                src={resolveImageUrl(agencyLogo) || logo}
                alt={`${agencyName} Logo`}
                className="w-20 h-20 object-contain drop-shadow-md"
              />
              <h1 className="text-lg font-bold text-brand-navy dark:text-brand-blue-bright mt-3 text-center bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent">
                {agencyName}
              </h1>
            </Link>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isActive(item.path)
                        ? "bg-white dark:bg-gray-700 shadow-md transform scale-105 border border-brand-blue-bright/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-brand-navy dark:hover:text-white hover:shadow-sm border border-transparent"
                    }`}
                    aria-current={isActive(item.path) ? "page" : undefined}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive(item.path)
                          ? "text-brand-blue-bright"
                          : "text-gray-500 group-hover:text-brand-blue-bright"
                      }`}
                      aria-hidden="true"
                    />
                    <span
                      className={
                        isActive(item.path)
                          ? "text-brand-navy dark:text-white font-semibold"
                          : ""
                      }
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex flex-col border-t border-gray-200/50 dark:border-gray-700/50 p-4 space-y-3">
            <div className="flex items-center w-full bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-gray-200/30 dark:border-gray-600/30">
              <div className="flex-shrink-0">
                <div
                  className="w-9 h-9 bg-brand-green-vibrant/10 rounded-full flex items-center justify-center"
                  role="img"
                  aria-label="User avatar"
                >
                  <User
                    className="w-5 h-5 text-brand-green-vibrant"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="ml-3">
                {user && (
                  <>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                      {user.role}
                    </p>
                  </>
                )}
              </div>
              <div className="ml-auto">
                <ThemeToggle className="flex-shrink-0" />
              </div>
            </div>

            {/* Redesigned Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
              aria-label={tNav("userMenu.logout")}
            >
              <LogOut className="w-5 h-5 mr-2" aria-hidden="true" />
              <span className="text-sm font-semibold">
                {tNav("userMenu.logout")}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 shadow-md">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center">
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-gray-700/50 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue-bright"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle main menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
            <Link
              to="/dashboard"
              className="ml-2 flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-brand-blue-bright rounded py-2 px-3"
            >
              <img
                src={resolveImageUrl(agencyLogo) || logo}
                alt={`${agencyName} Logo`}
                className="w-12 h-12 object-contain drop-shadow-md"
              />
              <h1 className="text-sm font-bold text-brand-navy dark:text-brand-blue-bright mt-1 text-center bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent">
                {agencyName}
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-brand-navy dark:hover:text-white hover:bg-gray-50/50 dark:hover:bg-gray-700/50 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue-bright"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <>
          {/* Mobile menu backdrop */}
          <div
            className="mobile-nav-backdrop md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={closeMobileMenu}
            aria-hidden="true"
          ></div>

          {/* Mobile menu */}
          <div
            id="mobile-menu"
            className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-r border-gray-200/50 dark:border-gray-700/50 overflow-y-auto shadow-xl"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="mobile-menu-button"
          >
            <div className="pt-5 pb-4">
              <div className="flex items-center px-4">
                <Link
                  to="/dashboard"
                  className="focus:outline-none focus:ring-2 focus:ring-brand-blue-bright rounded"
                >
                  <h1 className="text-xl font-bold text-brand-navy dark:text-brand-blue-bright bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent">
                    {agencyName}
                  </h1>
                </Link>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`group flex items-center px-2 py-3 text-base font-medium rounded-lg transition-all duration-300 touch-target ${
                        isActive(item.path)
                          ? "bg-white dark:bg-gray-700 shadow-md border border-brand-blue-bright/30 text-brand-navy dark:text-white font-semibold"
                          : "text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-brand-navy dark:hover:text-white border border-transparent"
                      }`}
                      role="menuitem"
                      aria-current={isActive(item.path) ? "page" : undefined}
                    >
                      <Icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive(item.path)
                            ? "text-brand-blue-bright"
                            : "text-gray-500 group-hover:text-brand-blue-bright"
                        }`}
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  );
                })}
                {user && (
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="group flex items-center px-2 py-3 text-base font-medium rounded-lg transition-all duration-300 touch-target text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-brand-navy dark:hover:text-white border border-transparent w-full text-left mt-2"
                    role="menuitem"
                  >
                    <LogOut
                      className="mr-3 flex-shrink-0 h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-brand-blue-bright"
                      aria-hidden="true"
                    />
                    <span>{tNav("userMenu.logout")}</span>
                  </button>
                )}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main id="main-content" className="flex-1 md:pl-64" role="main">
        {/* Check if owner without agency */}
        {(user?.role === 'agency_owner' || user?.role === 'owner' || user?.userType === 'owner') && !user?.agencyId && !user?.agency_id && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Welcome! Let's Set Up Your Agency
              </h2>
              <p className="text-blue-800 dark:text-blue-300 mb-4">
                To access the full dashboard and manage your agency, you need to create an agency first.
              </p>
              <button
                onClick={() => navigate('/setup-company')}
                className="btn-primary"
              >
                Create Agency
              </button>
            </div>
          </div>
        )}
        {/* Render children only if user has agency or is not an owner */}
        {!((user?.role === 'agency_owner' || user?.role === 'owner' || user?.userType === 'owner') && !user?.agencyId && !user?.agency_id) && children}
      </main>

      {/* Dev Tools - Role Switcher (only on localhost) */}
      <RoleSwitcher />
    </div>
  );
};

export default Layout;
