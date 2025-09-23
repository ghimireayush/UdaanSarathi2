import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme, isTransitioning } = useTheme()

  const handleThemeToggle = () => {
    if (!isTransitioning) {
      toggleTheme()
    }
  }

  return (
    <button
      onClick={handleThemeToggle}
      disabled={isTransitioning}
      className={`theme-toggle-enhanced p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${
        isTransitioning ? 'transitioning' : ''
      } ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative flex items-center justify-center">
        <div className={`transition-all duration-500 ${isTransitioning ? 'scale-0 rotate-180' : 'scale-100 rotate-0'}`}>
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          )}
        </div>
        
        {/* Transition icon that appears during theme change */}
        {isTransitioning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
        )}
        
        {/* Enhanced glow effect during transition */}
        {isTransitioning && (
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-blue-400/20 animate-pulse" />
        )}
        
        {/* Subtle background glow on hover */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-500/0 to-primary-500/0 hover:from-primary-500/5 hover:to-primary-500/10 transition-all duration-300" />
      </div>
    </button>
  )
}

export default ThemeToggle