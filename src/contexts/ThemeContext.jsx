import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      return savedTheme === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  
  const [isTransitioning, setIsTransitioning] = useState(false)

  const applyThemeWithTransition = (newTheme) => {
    setIsTransitioning(true)
    
    // Create enhanced transition overlay with gradient effect
    const overlay = document.createElement('div')
    overlay.className = 'theme-transition-overlay active'
    document.body.appendChild(overlay)
    
    // Add transitioning class to body for global effects
    document.body.classList.add('theme-transitioning')
    
    // Create ripple effect from toggle button if it exists
    const themeToggle = document.querySelector('.theme-toggle-enhanced')
    if (themeToggle) {
      const ripple = document.createElement('div')
      ripple.className = 'theme-ripple-effect'
      const rect = themeToggle.getBoundingClientRect()
      ripple.style.left = `${rect.left + rect.width / 2}px`
      ripple.style.top = `${rect.top + rect.height / 2}px`
      document.body.appendChild(ripple)
      
      // Remove ripple after animation
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.remove()
        }
      }, 1000)
    }
    
    // Apply theme with smooth transition timing
    setTimeout(() => {
      if (newTheme) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      
      // Add enhanced staggered animations to different element types
      const cards = document.querySelectorAll('.card, .interactive-card')
      const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-outline')
      const chips = document.querySelectorAll('.chip')
      const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea')
      
      // Animate cards with wave effect
      cards.forEach((card, index) => {
        card.classList.add('theme-transitioning', 'theme-card-wave', `theme-stagger-${Math.min(index % 6 + 1, 6)}`)
      })
      
      // Animate buttons with pulse effect
      buttons.forEach((button, index) => {
        button.classList.add('theme-transitioning', 'theme-button-pulse', `theme-stagger-${Math.min(index % 4 + 1, 4)}`)
      })
      
      // Animate chips with color transition
      chips.forEach((chip, index) => {
        chip.classList.add('theme-transitioning', 'theme-chip-glow', `theme-stagger-${Math.min(index % 3 + 1, 3)}`)
      })
      
      // Animate form inputs
      inputs.forEach((input, index) => {
        input.classList.add('theme-transitioning', 'theme-input-fade', `theme-stagger-${Math.min(index % 5 + 1, 5)}`)
      })
      
    }, 80) // Reduced delay for faster response
    
    // Clean up transition effects with proper timing
    setTimeout(() => {
      // Fade out overlay
      overlay.classList.add('fade-out')
      
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove()
        }
      }, 200)
      
      document.body.classList.remove('theme-transitioning')
      
      // Remove all transition classes
      const elements = document.querySelectorAll('.theme-transitioning')
      elements.forEach(el => {
        el.classList.remove(
          'theme-transitioning', 
          'theme-card-wave', 
          'theme-button-pulse', 
          'theme-chip-glow', 
          'theme-input-fade',
          'theme-stagger-1', 
          'theme-stagger-2', 
          'theme-stagger-3', 
          'theme-stagger-4', 
          'theme-stagger-5',
          'theme-stagger-6'
        )
      })
      
      setIsTransitioning(false)
    }, 900) // Extended for smoother completion
  }

  useEffect(() => {
    // Apply theme to document on initial load without transition
    // Use requestAnimationFrame for smoother initial render
    requestAnimationFrame(() => {
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      
      // Add a class to indicate theme is ready
      document.documentElement.classList.add('theme-ready')
    })
  }, [])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('theme')
      if (!savedTheme) {
        setIsDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    if (isTransitioning) return // Prevent multiple transitions
    
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    applyThemeWithTransition(newTheme)
  }

  const setTheme = (theme) => {
    if (isTransitioning) return // Prevent multiple transitions
    
    const newTheme = theme === 'dark'
    if (newTheme !== isDarkMode) {
      setIsDarkMode(newTheme)
      applyThemeWithTransition(newTheme)
    }
  }

  const value = {
    isDarkMode,
    toggleTheme,
    setTheme,
    theme: isDarkMode ? 'dark' : 'light',
    isTransitioning
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}