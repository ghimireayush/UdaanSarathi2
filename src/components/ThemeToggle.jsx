import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle = ({ className = '' }) => {
  const { isDarkMode, toggleTheme } = useTheme()

  const handleThemeToggle = () => {
    toggleTheme()
  }

  return (
    <button
      onClick={handleThemeToggle}
      className={`p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  )
}

export default ThemeToggle