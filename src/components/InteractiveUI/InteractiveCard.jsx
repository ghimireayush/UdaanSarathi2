import { useState, forwardRef } from 'react'

const InteractiveCard = forwardRef((props, ref) => {
  const { 
    children, 
    onClick,
    hoverable = true,
    clickable = false,
    className = '',
    variant = 'default',
    ...otherProps 
  } = props
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200'
  
  const variants = {
    default: 'border-gray-200 dark:border-gray-700 shadow-sm',
    elevated: 'border-gray-200 dark:border-gray-700 shadow-lg',
    outlined: 'border-2 border-gray-300 dark:border-gray-600',
    primary: 'border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20',
    success: 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20',
    warning: 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',
    danger: 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
  }

  const hoverClasses = hoverable ? 'hover:shadow-lg hover:-translate-y-1' : ''
  const clickableClasses = clickable ? 'cursor-pointer active:scale-98' : ''

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => {
    setIsHovered(false)
    setIsPressed(false)
  }
  const handleMouseDown = () => clickable && setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)

  const handleClick = (e) => {
    // Don't trigger card click if clicking on form elements
    if (e.target.matches('select, input, button, textarea, [role="button"]')) {
      return
    }
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <div
      ref={ref}
      className={`
        relative
        ${baseClasses}
        ${variants[variant]}
        ${hoverClasses}
        ${clickableClasses}
        ${isPressed ? 'scale-98' : 'scale-100'}
        ${className}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...otherProps}
    >
      {/* Animated border on hover */}
      {isHovered && hoverable && (
        <div className="absolute inset-0 rounded-lg border-2 border-primary-300 dark:border-primary-500 opacity-50 pointer-events-none" />
      )}
      
      {children}
    </div>
  )
})

InteractiveCard.displayName = 'InteractiveCard'

export default InteractiveCard