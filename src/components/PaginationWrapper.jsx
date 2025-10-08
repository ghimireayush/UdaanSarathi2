import React from 'react'
import { InteractivePagination, PaginationInfo, ItemsPerPageSelector } from './InteractiveUI'

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
  size = 'md'
}) => {
  // Don't render if no pagination needed
  if (totalPages <= 1 && !showItemsPerPageSelector) {
    return null
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      {/* Left side - Pagination info and items per page selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {showInfo && (
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
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
  )
}

export default PaginationWrapper