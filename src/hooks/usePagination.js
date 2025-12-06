import { useState, useMemo } from 'react'

/**
 * Custom hook for pagination logic
 * @param {Array} data - The data array to paginate
 * @param {Object} options - Pagination options
 * @returns {Object} Pagination state and methods
 */
export const usePagination = (data = [], options = {}) => {
  const {
    initialPage = 1,
    initialItemsPerPage = 10,
    itemsPerPageOptions = [10, 25, 50, 100]
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : []

  // Calculate pagination values
  const totalItems = safeData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = safeData.slice(startIndex, endIndex)

  // Pagination methods
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToFirstPage = () => {
    setCurrentPage(1)
  }

  const goToLastPage = () => {
    setCurrentPage(totalPages)
  }

  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    // Reset to first page when changing items per page
    setCurrentPage(1)
  }

  // Reset pagination when data changes
  const resetPagination = () => {
    setCurrentPage(1)
  }

  // Pagination info
  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex: startIndex + 1,
    endIndex: Math.min(endIndex, totalItems),
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  }), [currentPage, totalPages, totalItems, itemsPerPage, startIndex, endIndex])

  return {
    // Data
    currentData,
    
    // State
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    itemsPerPageOptions,
    
    // Info
    paginationInfo,
    
    // Methods
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changeItemsPerPage,
    resetPagination
  }
}

/**
 * Hook for server-side pagination
 * @param {Object} options - Pagination options
 * @returns {Object} Pagination state and methods for server-side pagination
 */
export const useServerPagination = (options = {}) => {
  const {
    initialPage = 1,
    initialItemsPerPage = 10,
    itemsPerPageOptions = [10, 25, 50, 100]
  } = options

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  // Methods for server-side pagination
  const goToPage = (page) => {
    setCurrentPage(page)
  }

  const changeItemsPerPage = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const resetPagination = () => {
    setCurrentPage(1)
  }

  return {
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,
    goToPage,
    changeItemsPerPage,
    resetPagination
  }
}

export default usePagination