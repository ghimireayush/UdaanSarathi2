import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'

const ThemeTransitionDemo = () => {
  const { isDarkMode, isTransitioning } = useTheme()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Theme Transition Demo</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted">
            {isTransitioning ? 'Transitioning...' : `Current: ${isDarkMode ? 'Dark' : 'Light'} Mode`}
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample Cards */}
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Sample Card {index}</h3>
            <p className="text-muted mb-4">
              This card demonstrates the smooth theme transition effects.
            </p>
            <div className="flex space-x-2">
              <button className="btn-primary">Primary</button>
              <button className="btn-secondary">Secondary</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Interactive Elements</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="chip chip-blue">Blue Chip</span>
            <span className="chip chip-green">Green Chip</span>
            <span className="chip chip-yellow">Yellow Chip</span>
            <span className="chip chip-red">Red Chip</span>
            <span className="chip chip-purple">Purple Chip</span>
          </div>
          
          <div className="flex space-x-4">
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <button className="btn-outline">Outline Button</button>
            <button className="btn-danger">Danger Button</button>
          </div>
          
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Sample input field" 
              className="form-input"
            />
            <select className="form-select">
              <option>Sample select option</option>
              <option>Another option</option>
            </select>
            <textarea 
              placeholder="Sample textarea" 
              className="form-textarea"
            />
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted">
        <p>Toggle the theme using the button above to see the smooth transition effects!</p>
        <p>Notice how all elements transition smoothly with staggered animations.</p>
      </div>
    </div>
  )
}

export default ThemeTransitionDemo