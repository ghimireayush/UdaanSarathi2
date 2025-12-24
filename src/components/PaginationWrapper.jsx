import React from 'react'
import { InteractivePagination, PaginationInfo, ItemsPerPageSelector } from './InteractiveUI'
import i18nService from '../services/i18nService'

/**
 * Reusable pagination wrapper component
 * @param {Object} props - Component props
 */
const PaginationWrapper = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemsPerPageOptions = [10, 25, 50, 100],
  onPageChange,
  onItemsPerPageChange,
  showInfo = true,
  showItemsPerPageSelector = true,
  className = '',
  size = 'md',
  pageName = 'common' // Optional page name for translations
}) => {
  // Use global i18nService for pagination translations
  // Pagination is a shared component, not page-specific
  const tPage = (key, params = {}) => {
    // Try to get from global common translations first
    const result = i18nService.t(key, params)
    return result !== key ? result : key
  }
  // Don't render if no pagination needed
  if (totalPages <= 1 && !showItemsPerPageSelector) {
    return null
  }

  return (
    <div className={`flex flex-col gap-3 sm:gap-4 ${className}`}>
      {/* Mobile: Stacked layout */}
      <div className="flex flex-col sm:hidden gap-3">
        {/* Top row: Info + Items per page */}
        <div className="flex items-center justify-between">
          {showInfo && (
            <PaginationInfo
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              t={tPage}
            />
          )}
          
          {showItemsPerPageSelector && totalItems > Math.min(...itemsPerPageOptions) && (
            <ItemsPerPageSelector
              value={itemsPerPage}
              onChange={onItemsPerPageChange}
              options={itemsPerPageOptions}
            />
          )}
        </div>
        
        {/* Bottom row: Pagination controls centered */}
        {totalPages > 1 && (
          <InteractivePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            size="sm"
            showFirstLast={totalPages > 5}
            maxVisiblePages={3}
          />
        )}
      </div>
      
      {/* Desktop: Horizontal layout */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        {/* Left side - Pagination info and items per page selector */}
        <div className="flex items-center gap-4">
          {showInfo && (
            <PaginationInfo
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              t={tPage}
            />
          )}
          
          {showItemsPerPageSelector && totalItems > Math.min(...itemsPerPageOptions) && (
            <ItemsPerPageSelector
              value={itemsPerPage}
              onChange={onItemsPerPageChange}
              options={itemsPerPageOptions}
            />
          )}
        </div>

        {/* Right side - Pagination controls */}
        {totalPages > 1 && (
          <InteractivePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            size={size}
            showFirstLast={totalPages > 5}
            maxVisiblePages={5}
          />
        )}
      </div>
    </div>
  )
}

export default PaginationWrapper