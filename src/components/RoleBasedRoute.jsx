/**
 * Role-Based Route Guard Component
 * Restricts access to routes based on user role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleBasedAccess } from '../hooks/useRoleBasedAccess';
import { AlertCircle } from 'lucide-react';

/**
 * RoleBasedRoute Component
 * @param {React.ReactNode} children - Component to render if access is granted
 * @param {string|Array} allowedRoles - Role(s) that can access this route
 * @param {React.ReactNode} fallback - Component to render if access is denied (default: access denied page)
 */
export const RoleBasedRoute = ({ children, allowedRoles, fallback = null }) => {
  const { userRole } = useRoleBasedAccess();

  // Normalize allowedRoles to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // Check if user has access
  const hasAccess = roles.includes(userRole);

  if (!hasAccess) {
    // Return fallback component if provided
    if (fallback) {
      return fallback;
    }

    // Default access denied page
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You don't have permission to access this page. Your role ({userRole}) is not authorized.
            </p>
            <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 mb-6 text-left">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Required roles:</strong> {roles.join(', ')}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                <strong>Your role:</strong> {userRole}
              </p>
            </div>
            <a
              href="/dashboard"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleBasedRoute;
