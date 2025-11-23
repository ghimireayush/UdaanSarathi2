import React, { createContext, useContext, useState, useEffect } from 'react'
import { agencyService } from '../services/index.js'

const AgencyContext = createContext()

export const useAgency = () => {
  const context = useContext(AgencyContext)
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider')
  }
  return context
}

export const AgencyProvider = ({ children }) => {
  const [agencyData, setAgencyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch agency data on initial load
  const fetchAgencyData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await agencyService.getAgencyProfile()
      if (data) {
        setAgencyData(data)
      } else {
        throw new Error('No data returned from server')
      }
    } catch (err) {
      console.error('Failed to fetch agency data:', err)
      const errorMessage = err.message || 'Failed to load agency data'
      setError(errorMessage)
      // Don't set agencyData to null, keep it as is to show error state
      setAgencyData(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Update agency data (called from settings page)
  const updateAgencyData = (newData) => {
    setAgencyData(prevData => ({
      ...(prevData || {}),
      ...newData,
      updated_at: new Date().toISOString()
    }))
  }

  // Update specific agency field (for real-time updates)
  const updateAgencyField = (field, value) => {
    setAgencyData(prevData => ({
      ...(prevData || {}),
      [field]: value,
      updated_at: new Date().toISOString()
    }))
  }

  // Update logo specifically
  const updateAgencyLogo = (logoUrl) => {
    setAgencyData(prevData => ({
      ...(prevData || {}),
      logo_url: logoUrl,
      updated_at: new Date().toISOString()
    }))
  }

  // Update agency name specifically
  const updateAgencyName = (name) => {
    setAgencyData(prevData => ({
      ...(prevData || {}),
      name: name,
      updated_at: new Date().toISOString()
    }))
  }

  // Refresh agency data
  const refreshAgencyData = () => {
    fetchAgencyData()
  }

  useEffect(() => {
    fetchAgencyData()
  }, [])

  const value = {
    // State
    agencyData,
    isLoading,
    error,
    
    // Actions
    updateAgencyData,
    updateAgencyField,
    updateAgencyLogo,
    updateAgencyName,
    refreshAgencyData,
    fetchAgencyData,
    
    // Helpers
    agencyName: agencyData?.name || 'Inspire International Employment Pvt. Ltd',
    agencyLogo: agencyData?.logo_url || null,
    agencyAddress: agencyData?.address || '',
    agencyPhone: agencyData?.phone || '',
    agencyEmail: agencyData?.email || '',
    agencyWebsite: agencyData?.website || '',
  }

  return (
    <AgencyContext.Provider value={value}>
      {children}
    </AgencyContext.Provider>
  )
}

export default AgencyContext