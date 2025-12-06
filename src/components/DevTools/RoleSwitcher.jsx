import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllRoleValues, getRoleLabel, getRoleColor } from '../../config/roles';
import { RefreshCw, X, Code } from 'lucide-react';

/**
 * Developer Tool: Role Switcher
 * Only visible in development (localhost)
 * Allows quick switching between roles for testing RBAC
 */
const RoleSwitcher = () => {
  const { user, updateUserRole } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [originalRole, setOriginalRole] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);

  // Only show in development
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';

  useEffect(() => {
    if (user?.role || user?.specificRole) {
      const userRole = user.specificRole || user.role;
      setCurrentRole(userRole);
      
      // Store original role on first load
      if (!originalRole) {
        setOriginalRole(userRole);
      }
    }
  }, [user]);

  if (!isDevelopment || !user) {
    return null;
  }

  const allRoles = getAllRoleValues();

  const handleRoleSwitch = (newRole) => {
    if (updateUserRole) {
      updateUserRole(newRole);
      setCurrentRole(newRole);
      // Force page reload to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Fallback: Update localStorage directly
      const updatedUser = {
        ...user,
        role: newRole,
        specificRole: newRole,
      };
      localStorage.setItem('udaan_user', JSON.stringify(updatedUser));
      setCurrentRole(newRole);
      // Force page reload to apply changes
      window.location.reload();
    }
  };

  const handleReset = () => {
    if (originalRole) {
      handleRoleSwitch(originalRole);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999]">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-lg shadow-2xl border-2 border-purple-500 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-black bg-opacity-30 border-b border-purple-500">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Dev Tools - Role Switcher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMinimize}
              className="text-white hover:text-purple-300 transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <span className="text-sm">{isMinimized ? '▲' : '▼'}</span>
            </button>
            <button
              onClick={handleClose}
              className="text-white hover:text-red-400 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-semibold text-purple-200">Current Role:</span>
              <span className="text-sm font-bold text-white bg-purple-700 px-3 py-1 rounded-full">
                {getRoleLabel(currentRole)}
              </span>
              {currentRole !== originalRole && (
                <span className="text-xs text-yellow-300 italic">
                  (Original: {getRoleLabel(originalRole)})
                </span>
              )}
            </div>

            {/* Role Selection - Horizontal Scroll */}
            <div className="flex items-center gap-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-purple-900 max-w-[600px]">
                {allRoles.map((role) => {
                  const isActive = role === currentRole;
                  const colorClasses = getRoleColor(role);
                  
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={`
                        flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${isActive 
                          ? 'bg-white text-purple-900 shadow-lg scale-105 ring-2 ring-yellow-400' 
                          : 'bg-purple-800 text-white hover:bg-purple-700 hover:scale-105'
                        }
                      `}
                      title={`Switch to ${getRoleLabel(role)}`}
                    >
                      {getRoleLabel(role)}
                    </button>
                  );
                })}
              </div>

              {/* Reset Button */}
              {currentRole !== originalRole && (
                <button
                  onClick={handleReset}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-sm font-medium transition-all hover:scale-105"
                  title="Reset to original role"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>

            {/* Info */}
            <div className="mt-3 text-xs text-purple-300 border-t border-purple-700 pt-2">
              💡 Switch roles instantly to test RBAC permissions. Page will reload to apply changes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSwitcher;
