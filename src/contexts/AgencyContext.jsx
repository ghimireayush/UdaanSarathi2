import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { agencyService } from '../services/index.js'
import { useAuth } from './AuthContext'
import { needsAgencySetup } from '../utils/roleHelpers.js'

const AgencyContext = createContext()

export const useAgency = () => {
  const context = useContext(AgencyContext)
  if (!context) {
    throw new Error('useAgency must be used within an AgencyProvider')
  }
  return context
}

export const AgencyProvider = ({ children }) => {
  const navigate = useNavigate()
  const { logout, user, isAuthenticated } = useAuth()
  const [agencyData, setAgencyData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch agency data on initial load
  const fetchAgencyData = async () => {
    // Don't fetch if user is not authenticated or doesn't have an agency
    if (!isAuthenticated || !user) {
      setIsLoading(false)
      return
    }

    // Don't fetch if user is an owner without an agency
    if (needsAgencySetup(user)) {
      console.log('User is an owner without an agency, skipping agency data fetch')
      setIsLoading(false)
      setAgencyData(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await agencyService.getAgencyProfile()
      if (data) {
        setAgencyData(data)
        // Store license number for API calls
        if (data.license_number) {
          localStorage.setItem('udaan_agency_license', data.license_number)
        }
      } else {
        throw new Error('No data returned from server')
      }
    } catch (err) {
      console.error('Failed to fetch agency data:', err)
      
      // Handle 401 Unauthorized - logout and redirect
      if (err.status === 401 || err.isAuthError) {
        console.log('Unauthorized access detected, logging out...')
        await logout()
        navigate('/', { replace: true })
        return
      }
      
      // Handle 403 Forbidden - user doesn't have an agency yet (this is expected)
      if (err.status === 403) {
        console.log('User does not have an agency yet')
        setError(null) // Don't set error for 403, it's expected
        setAgencyData(null)
        setIsLoading(false)
        return
      }
      
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
  }, [isAuthenticated, user])

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