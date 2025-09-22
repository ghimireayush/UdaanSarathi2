# Dark Theme Implementation Guide

## Overview

This document outlines the centralized dark theme implementation for the UdaanSarathi application. The dark theme system provides consistent theming across all components and pages.

## Architecture

### Theme Context
- **Location**: `src/contexts/ThemeContext.jsx`
- **Purpose**: Manages global theme state and provides theme utilities
- **Features**:
  - Automatic system preference detection
  - Manual theme switching
  - Local storage persistence
  - System preference change listening

### Theme Hook
- **Location**: `src/hooks/useTheme.js`
- **Purpose**: Provides easy access to theme functionality
- **Usage**: `const { isDarkMode, toggleTheme, setTheme } = useTheme()`

### Theme Toggle Component
- **Location**: `src/components/ThemeToggle.jsx`
- **Purpose**: UI component for switching between light and dark themes
- **Features**: Accessible button with appropriate icons and labels

## Implementation Details

### Tailwind Configuration
```javascript
// tailwind.config.js
export default {
  darkMode: 'class', // Enables class-based dark mode
  // ... rest of config
}
```

### CSS Classes
The implementation uses Tailwind's dark mode classes:
- `dark:bg-gray-800` - Dark background
- `dark:text-gray-100` - Dark text
- `dark:border-gray-700` - Dark borders
- `dark:hover:bg-gray-700` - Dark hover states

### Component Integration
All major UI components have been updated with dark mode support:

#### Cards
```css
.card {
  @apply bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700;
}
```

#### Buttons
```css
.btn-primary {
  @apply bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600;
}
```

#### Form Elements
```css
.form-input {
  @apply bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100;
}
```

#### Chips/Tags
```css
.chip-blue {
  @apply bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200;
}
```

## Usage Guidelines

### Using the Theme Hook
```jsx
import { useTheme } from '../hooks/useTheme'

function MyComponent() {
  const { isDarkMode, toggleTheme, theme } = useTheme()
  
  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <button onClick={toggleTheme}>
        Switch to {isDarkMode ? 'light' : 'dark'} mode
      </button>
    </div>
  )
}
```

### Adding Dark Mode to New Components
When creating new components, follow these patterns:

1. **Use Tailwind dark mode classes**:
   ```jsx
   <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
     Content
   </div>
   ```

2. **Use existing utility classes**:
   ```jsx
   <div className="card"> {/* Already has dark mode support */}
     <div className="text-muted"> {/* Custom utility class */}
       Muted text
     </div>
   </div>
   ```

3. **For complex conditional styling**:
   ```jsx
   import { useTheme } from '../hooks/useTheme'
   
   function Component() {
     const { isDarkMode } = useTheme()
     
     return (
       <div style={{
         backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
         color: isDarkMode ? '#f9fafb' : '#111827'
       }}>
         Content
       </div>
     )
   }
   ```

## Color Palette

### Light Mode
- Background: `bg-gray-50`
- Surface: `bg-white`
- Text Primary: `text-gray-900`
- Text Secondary: `text-gray-600`
- Border: `border-gray-200`

### Dark Mode
- Background: `bg-gray-900`
- Surface: `bg-gray-800`
- Text Primary: `text-gray-100`
- Text Secondary: `text-gray-400`
- Border: `border-gray-700`

## Interactive Components

All interactive UI components in `src/styles/interactive.css` have been updated with dark mode support:

- Interactive cards
- Modal overlays
- Dropdown menus
- Search suggestions
- Notifications
- Loading states

## Accessibility

The theme implementation includes:
- Proper focus states for both themes
- High contrast mode support
- Reduced motion support
- Screen reader compatibility
- Keyboard navigation support

## Testing

To test dark mode implementation:

1. **Manual Testing**:
   - Use the theme toggle in the navigation
   - Test all pages and components
   - Verify system preference detection

2. **Browser DevTools**:
   - Toggle `prefers-color-scheme` in DevTools
   - Inspect element classes for dark mode variants

3. **Accessibility Testing**:
   - Test with screen readers
   - Verify keyboard navigation
   - Check color contrast ratios

## Troubleshooting

### Common Issues

1. **Component not updating**: Ensure the component is wrapped in ThemeProvider
2. **Styles not applying**: Check if Tailwind dark mode classes are used correctly
3. **Flash of wrong theme**: Ensure theme is applied to document root on initialization

### Debug Tips

1. Check if `dark` class is applied to `<html>` element
2. Verify ThemeProvider is at the root of the app
3. Use browser DevTools to inspect computed styles
4. Check localStorage for theme persistence

## Future Enhancements

Potential improvements:
- Multiple theme variants (not just light/dark)
- Theme customization per user
- Automatic theme switching based on time of day
- Theme-aware image variants
- Custom color scheme support