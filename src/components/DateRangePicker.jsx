import React, { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onDateRangeChange, 
  onClose,
  isOpen = false 
}) => {
  const [localStartDate, setLocalStartDate] = useState(startDate || '')
  const [localEndDate, setLocalEndDate] = useState(endDate || '')
  const modalRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose?.()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleApply = () => {
    if (localStartDate && localEndDate) {
      onDateRangeChange?.(localStartDate, localEndDate)
      onClose?.()
    }
  }

  const handleReset = () => {
    setLocalStartDate('')
    setLocalEndDate('')
    onDateRangeChange?.('', '')
    onClose?.()
  }

  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const today = new Date().toISOString().split('T')[0]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Date Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formatDateForInput(localStartDate)}
              onChange={(e) => setLocalStartDate(e.target.value)}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formatDateForInput(localEndDate)}
              onChange={(e) => setLocalEndDate(e.target.value)}
              min={localStartDate}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick Select Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Select
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const end = new Date()
                const start = new Date()
                start.setDate(start.getDate() - 7)
                setLocalStartDate(start.toISOString().split('T')[0])
                setLocalEndDate(end.toISOString().split('T')[0])
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                const end = new Date()
                const start = new Date()
                start.setDate(start.getDate() - 30)
                setLocalStartDate(start.toISOString().split('T')[0])
                setLocalEndDate(end.toISOString().split('T')[0])
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => {
                const end = new Date()
                const start = new Date()
                start.setMonth(start.getMonth() - 3)
                setLocalStartDate(start.toISOString().split('T')[0])
                setLocalEndDate(end.toISOString().split('T')[0])
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Last 3 Months
            </button>
            <button
              onClick={() => {
                const end = new Date()
                const start = new Date()
                start.setFullYear(start.getFullYear() - 1)
                setLocalStartDate(start.toISOString().split('T')[0])
                setLocalEndDate(end.toISOString().split('T')[0])
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Last Year
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!localStartDate || !localEndDate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default DateRangePicker