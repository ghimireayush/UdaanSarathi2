import { useTheme as useThemeContext } from '../contexts/ThemeContext'

// Re-export the theme hook for easier imports
export const useTheme = useThemeContext

// Additional theme utilities
export const getThemeClasses = (lightClass, darkClass) => {
  return `${lightClass} dark:${darkClass}`
}

export const getConditionalThemeClass = (isDark, lightClass, darkClass) => {
  return isDark ? darkClass : lightClass
}