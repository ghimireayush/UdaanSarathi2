import React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from 'lucide-react'
import InteractiveButton from './InteractiveButton'

const InteractivePagination = ({ 
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  // Reduce visible pages on mobile
  const getMobileMaxPages = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 3
    }
    return maxVisiblePages
  }

  const getVisiblePages = () => {
    const effectiveMaxPages = getMobileMaxPages()
    
    if (totalPages <= effectiveMaxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(effectiveMaxPages / 2)
    let start = Math.max(currentPage - half, 1)
    let end = Math.min(start + effectiveMaxPages - 1, totalPages)

    if (end - start + 1 < effectiveMaxPages) {
      start = Math.max(end - effectiveMaxPages + 1, 1)
    }

    const pages = []
    
    // Add first page if not in range
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('...')
      }
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add last page if not in range
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...')
      }
      pages.push(totalPages)
    }

    return pages
  }

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange?.(page)
    }
  }

  const visiblePages = getVisiblePages()

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-1.5 ${className}`}>
      {/* First Page - Icon only on mobile */}
      {showFirstLast && currentPage > 2 && (
        <InteractiveButton
          variant="outline"
          size={size}
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          className="hidden sm:inline-flex min-h-[36px] sm:min-h-[40px]"
        >
          First
        </InteractiveButton>
      )}
      {showFirstLast && currentPage > 2 && (
        <InteractiveButton
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          className="sm:hidden min-w-[36px] min-h-[36px] flex items-center justify-center p-0"
        >
          <ChevronsLeft className="w-4 h-4" />
        </InteractiveButton>
      )}

      {/* Previous Page */}
      {showPrevNext && (
        <InteractiveButton
          variant="outline"
          size={size}
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className="min-w-[36px] sm:min-w-auto min-h-[36px] sm:min-h-[40px] flex items-center justify-center p-1.5 sm:px-3 sm:py-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Prev</span>
        </InteractiveButton>
      )}

      {/* Page Numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-0.5 sm:gap-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-1.5 sm:px-2 py-1 text-gray-400 dark:text-gray-500">
                  <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                </span>
              )
            }

            return (
              <InteractiveButton
                key={page}
                variant={page === currentPage ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePageClick(page)}
                className={`
                  min-w-[32px] sm:min-w-[40px] min-h-[32px] sm:min-h-[40px] justify-center text-xs sm:text-sm p-1 sm:p-2
                  ${page === currentPage ? 'font-bold shadow-sm' : ''}
                `}
              >
                {page}
              </InteractiveButton>
            )
          })}
        </div>
      )}

      {/* Next Page */}
      {showPrevNext && (
        <InteractiveButton
          variant="outline"
          size={size}
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="min-w-[36px] sm:min-w-auto min-h-[36px] sm:min-h-[40px] flex items-center justify-center p-1.5 sm:px-3 sm:py-2"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="w-4 h-4" />
        </InteractiveButton>
      )}

      {/* Last Page - Icon only on mobile */}
      {showFirstLast && currentPage < totalPages - 1 && (
        <InteractiveButton
          variant="outline"
          size={size}
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:inline-flex min-h-[36px] sm:min-h-[40px]"
        >
          Last
        </InteractiveButton>
      )}
      {showFirstLast && currentPage < totalPages - 1 && (
        <InteractiveButton
          variant="outline"
          size="sm"
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          className="sm:hidden min-w-[36px] min-h-[36px] flex items-center justify-center p-0"
        >
          <ChevronsRight className="w-4 h-4" />
        </InteractiveButton>
      )}
    </div>
  )
}

// Pagination Info Component
export const PaginationInfo = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage,
  className = '',
  t = null // Optional translation function
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Helper function for translations with fallback and template substitution
  const translate = (key, defaultText, params = {}) => {
    let text = defaultText
    
    if (t && typeof t === 'function') {
      const result = t(key)
      // Check if translation was found (result will be different from key)
      if (result && result !== key) {
        text = result
      }
    }
    
    // Replace template variables
    return text
      .replace(/{{start}}/g, params.start || startItem)
      .replace(/{{end}}/g, params.end || endItem)
      .replace(/{{total}}/g, params.total || totalItems)
      .replace(/{{current}}/g, params.current || currentPage)
  }

  return (
    <div className={`text-xs sm:text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {/* Mobile: Compact view */}
      <span className="sm:hidden">
        <span className="font-medium text-gray-900 dark:text-gray-100">{startItem}-{endItem}</span>
        <span className="text-gray-400 dark:text-gray-500"> / </span>
        <span>{totalItems}</span>
      </span>
      {/* Desktop: Full view */}
      <span className="hidden sm:inline">
        {translate('pagination.showing', `Showing {{start}} to {{end}} of {{total}} results`, {
          start: startItem,
          end: endItem,
          total: totalItems
        })}
      </span>
      {totalPages > 1 && (
        <span className="hidden sm:inline ml-2 text-gray-400 dark:text-gray-500">
          ({translate('pagination.page', `Page {{current}} of {{total}}`, {
            current: currentPage,
            total: totalPages
          })})
        </span>
      )}
    </div>
  )
}

// Items Per Page Selector
export const ItemsPerPageSelector = ({ 
  value, 
  onChange, 
  options = [10, 25, 50, 100],
  className = '' 
}) => {
  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">Show:</span>
      <select
        value={value}
        onChange={(e) => onChange?.(parseInt(e.target.value))}
        className="px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[32px] sm:min-h-[36px]"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        <span className="sm:hidden">rows</span>
        <span className="hidden sm:inline">per page</span>
      </span>
    </div>
  )
}

export default InteractivePagination