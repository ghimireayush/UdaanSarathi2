import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Check, 
  Trash2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Eye, 
  Edit, 
  X, 
  FileText,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  Upload,
  Link,
  Volume2,
  Tag,
  Settings,
  Image,
  Camera,
  Globe,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square
} from 'lucide-react'
import { format } from 'date-fns'
import { jobService } from '../services/index.js'
import DraftListManagement from '../components/DraftListManagement'
import JobDraftWizard from '../components/JobDraftWizard'
import { InteractiveFilter, InteractiveButton, InteractiveCard, InteractivePagination, PaginationInfo } from '../components/InteractiveUI'

const Drafts = () => {
  const [viewMode, setViewMode] = useState('list')
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    company: '',
    category: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20, // 20 items per page for list view
    total: 0,
    totalPages: 0
  })
  const [selectedDrafts, setSelectedDrafts] = useState(new Set())
  const [showWizard, setShowWizard] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [publishingDrafts, setPublishingDrafts] = useState(new Set()) // Track individual publishing states
  const [deletingDrafts, setDeletingDrafts] = useState(new Set()) // Track individual deleting states
  const [editingDraft, setEditingDraft] = useState(null) // Track draft being edited
  const [editingStep, setEditingStep] = useState(0) // Track which step to open in wizard
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success') // 'success', 'error', 'info'
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDraft, setPreviewDraft] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmData, setConfirmData] = useState(null)
  const [showForcePublishModal, setShowForcePublishModal] = useState(false)
  const [forcePublishDraft, setForcePublishDraft] = useState(null)


  
  // Mock mutation object for compatibility
  const publishMutation = {
    isLoading: publishingDrafts.size > 0
  }

  // Debounced search to reduce API calls
  const debouncedSearch = useMemo(
    () => {
      const debounce = (func, delay) => {
        let timeoutId
        return (...args) => {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => func.apply(null, args), delay)
        }
      }
      return debounce((searchTerm) => {
        setFilters(prev => ({ ...prev, search: searchTerm }))
        setPagination(prev => ({ ...prev, page: 1 }))
      }, 300)
    },
    []
  )

  const handleFilterChange = useCallback((key, value) => {
    if (key === 'search') {
      debouncedSearch(value)
    } else {
      setFilters(prev => ({ ...prev, [key]: value }))
      setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
    }
  }, [debouncedSearch])

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Header checkbox ref to support indeterminate state
  const headerCheckboxRef = useRef(null)
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = selectedDrafts.size > 0 && selectedDrafts.size < drafts.length
    }
  }, [selectedDrafts, drafts])







  // Toast notification function
  const showToast = (message, type = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowSuccessToast(true)
    
    // Auto-hide after 4 seconds for success, 5 seconds for error
    const delay = type === 'error' ? 5000 : 4000
    setTimeout(() => {
      setShowSuccessToast(false)
    }, delay)
  }











  // Function to expand bulk draft into individual drafts
  const handleExpandBulkDraft = async (bulkDraft) => {
    try {
      // Close preview modal
      setShowPreviewModal(false)
      setPreviewDraft(null)
      
      // Prepare the bulk draft data for the wizard
      const wizardData = {
        // Basic information from bulk draft
        title: bulkDraft.title || '',
        company: bulkDraft.company || '',
        employer: bulkDraft.employer || '',
        posting_agency: bulkDraft.posting_agency || '',
        description: bulkDraft.description || '',
        
        // Contract details if available
        period_years: bulkDraft.period_years || '',
        employment_type: bulkDraft.employment_type || 'Full-time',
        renewable: bulkDraft.renewable || false,
        
        // Working conditions if available
        hours_per_day: bulkDraft.hours_per_day || '',
        days_per_week: bulkDraft.days_per_week || '',
        overtime_policy: bulkDraft.overtime_policy || '',
        weekly_off_days: bulkDraft.weekly_off_days || '',
        annual_leave_days: bulkDraft.annual_leave_days || '',
        food: bulkDraft.food || '',
        accommodation: bulkDraft.accommodation || '',
        transport: bulkDraft.transport || '',
        
        // Bulk entries data for reference
        bulk_entries: bulkDraft.bulk_entries || [],
        
        // Mark as expansion from bulk draft
        is_expanding_bulk: true,
        original_bulk_id: bulkDraft.id
      }
      
      // Set the editing draft with pre-filled data
      setEditingDraft(wizardData)
      
      // Open the wizard
      setShowWizard(true)
      
      showToast('ℹ️ Opening draft creation wizard with bulk draft details pre-filled.', 'info')
      
    } catch (error) {
      console.error('Error preparing bulk expansion:', error)
      showToast('❌ Failed to prepare bulk expansion. Please try again.', 'error')
    }
  }

  // Force publish bulk draft with N/A values for missing fields
  const handleForcePublishBulkDraft = async (bulkDraft) => {
    try {
      if (!bulkDraft.bulk_entries || bulkDraft.bulk_entries.length === 0) {
        showToast('⚠️ No entries found in bulk draft to publish.', 'error')
        return
      }

      // Create published jobs for each bulk entry with N/A values
      const publishPromises = []
      
      for (const entry of bulkDraft.bulk_entries) {
        const jobCount = parseInt(entry.job_count || 1)
        
        // Create multiple published jobs based on job count for this entry
        for (let i = 0; i < jobCount; i++) {
          const publishedJob = {
            // Required fields from bulk draft or default N/A values
            title: entry.position || 'General Worker',
            company: bulkDraft.company || 'N/A',
            country: entry.country || 'N/A',
            city: 'N/A',
            published_at: new Date().toISOString(),
            
            // Default N/A values for missing fields
            salary: 'N/A',
            currency: 'AED',
            salary_amount: 0,
            requirements: ['Requirements not specified'],
            description: `Position: ${entry.position || 'General Worker'} in ${entry.country || 'Location TBD'}. Additional details not provided (Force Published from Bulk Draft).`,
            tags: ['Bulk Published', 'Details TBD'],
            category: entry.position || 'General Worker',
            employment_type: 'Full-time',
            working_hours: 'N/A',
            accommodation: 'N/A',
            food: 'N/A',
            visa_status: 'N/A',
            contract_duration: 'N/A',
            contact_person: 'N/A',
            contact_phone: 'N/A',
            contact_email: 'N/A',
            expenses: [],
            notes: `Force published from bulk draft: ${bulkDraft.title}. Job ${i + 1}/${jobCount} for ${entry.country}.`,
            
            // Metadata
            created_at: new Date().toISOString(),
            is_force_published: true,
            original_bulk_id: bulkDraft.id,
            bulk_entry_index: bulkDraft.bulk_entries.indexOf(entry),
            job_sequence: i + 1,
            status: 'published'
          }
          
          publishPromises.push(jobService.publishJob(publishedJob))
        }
      }
      
      // Execute all job publications
      await Promise.all(publishPromises)
      
      // Delete the original bulk draft
      await jobService.deleteJob(bulkDraft.id)
      
      // Refresh drafts data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      
      // Close modals
      setShowPreviewModal(false)
      setPreviewDraft(null)
      setShowForcePublishModal(false)
      setForcePublishDraft(null)
      
      // Show success message
      const totalPublished = publishPromises.length
      showToast(`✅ Successfully force published ${totalPublished} jobs from bulk draft! Missing details marked as N/A.`, 'success')
      
      // Reset pagination
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
      
    } catch (error) {
      console.error('Failed to force publish bulk draft:', error)
      showToast('❌ Failed to force publish bulk draft. Please try again.', 'error')
    }
  }

  // Show force publish confirmation modal
  const showForcePublishConfirmation = (bulkDraft) => {
    setForcePublishDraft(bulkDraft)
    setShowForcePublishModal(true)
  }

  const handleWizardSave = async (draftData) => {
    try {
      if (draftData.type === 'bulk') {
        // Handle bulk creation - Create single bulk draft entry
        const totalJobs = draftData.data.entries.reduce((sum, entry) => sum + parseInt(entry.job_count || 0), 0)
        const countries = draftData.data.entries.map(entry => entry.country).filter(Boolean)
        const positions = draftData.data.entries.map(entry => entry.position).filter(Boolean)
        
        const bulkDraft = {
          title: positions.length > 0 ? positions.join(', ') : 'Multiple Positions',
          company: 'Multiple Companies',
          country: countries.length === 1 ? countries[0] : 'Multiple Countries',
          city: '',
          published_at: null,
          salary: '',
          currency: 'AED',
          salary_amount: 0,
          requirements: [],
          description: `Bulk job creation for ${totalJobs} positions across ${countries.length} countries`,
          tags: [],
          category: 'Bulk Creation',
          employment_type: 'Full-time',
          working_hours: '8 hours/day',
          accommodation: 'Provided',
          food: 'Provided',
          visa_status: 'Company will provide',
          contract_duration: '2 years',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          expenses: [],
          notes: `Bulk draft containing ${totalJobs} jobs`,
          created_at: new Date().toISOString(),
          // Mark as bulk draft with detailed entries
          is_bulk_draft: true,
          bulk_entries: draftData.data.entries,
          total_jobs: totalJobs
        }
        
        // Create single bulk draft
        await jobService.createDraftJob(bulkDraft)
        
        showToast(`✅ Successfully created bulk draft with ${totalJobs} jobs!`, 'success')
      } else if (draftData.type === 'bulk_edit') {
        // Handle bulk draft editing - Update existing bulk draft
        const totalJobs = draftData.data.entries.reduce((sum, entry) => sum + parseInt(entry.job_count || 0), 0)
        const countries = draftData.data.entries.map(entry => entry.country).filter(Boolean)
        const positions = draftData.data.entries.map(entry => entry.position).filter(Boolean)
        
        const updatedBulkDraft = {
          title: draftData.data.title || (positions.length > 0 ? positions.join(', ') : 'Multiple Positions'),
          company: draftData.data.company || 'Multiple Companies',
          country: countries.length === 1 ? countries[0] : 'Multiple Countries',
          description: draftData.data.description || `Bulk job creation for ${totalJobs} positions across ${countries.length} ${countries.length === 1 ? 'country' : 'countries'}`,
          // Update bulk entries and total jobs
          bulk_entries: draftData.data.entries,
          total_jobs: totalJobs,
          updated_at: new Date().toISOString()
        }
        
        // Update existing bulk draft
        await jobService.updateJob(draftData.data.id, updatedBulkDraft)
        
        showToast(`✅ Successfully updated bulk draft with ${totalJobs} jobs!`, 'success')
      } else if (draftData.type === 'partial_draft') {
        // Handle partial draft save
        if (editingDraft) {
          // Update existing partial draft
          const updatedDraft = {
            ...draftData.data,
            id: editingDraft.id,
            is_partial: true,
            last_completed_step: draftData.data.last_completed_step,
            updated_at: new Date().toISOString()
          }
          await jobService.updateJob(editingDraft.id, updatedDraft)
          showToast('✅ Progress saved! You can continue editing later.', 'success')
        } else {
          // Create new partial draft
          const partialDraft = {
            ...draftData.data,
            is_partial: true,
            last_completed_step: draftData.data.last_completed_step,
            created_at: new Date().toISOString()
          }
          await jobService.createDraftJob(partialDraft)
          showToast('✅ Progress saved! You can continue editing later.', 'success')
        }
      } else if (editingDraft) {
        // Update existing draft
        await jobService.updateJob(editingDraft.id, draftData)
        showToast('✅ Draft updated successfully!', 'success')
      } else {
        // Create single draft
        await jobService.createDraftJob(draftData)
        showToast('✅ Draft created successfully!', 'success')
      }
      
      // Refresh drafts data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setShowWizard(false)
      setEditingDraft(null)
      setEditingStep(0)
      
      // Reset pagination if needed
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
    } catch (error) {
      console.error('Failed to save draft:', error)
      showToast(`❌ Failed to ${editingDraft ? 'update' : 'create'} draft. Please try again.`, 'error')
    }
  }



  // Fetch drafts data using service with pagination
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get all drafts first (since we don't have paginated API yet)
        const allDrafts = await jobService.getDraftJobs()
        
        // Apply client-side filtering
        let filteredDrafts = allDrafts.filter(draft => {
          const matchesSearch = !filters.search || 
            draft.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            draft.company?.toLowerCase().includes(filters.search.toLowerCase()) ||
            draft.description?.toLowerCase().includes(filters.search.toLowerCase())
          
          const matchesCountry = !filters.country || draft.country === filters.country
          const matchesCompany = !filters.company || draft.company === filters.company
          const matchesCategory = !filters.category || draft.category === filters.category
          
          return matchesSearch && matchesCountry && matchesCompany && matchesCategory
        })
        
        // Apply sorting
        const sortBy = filters.sortBy || 'created_date'
        filteredDrafts.sort((a, b) => {
          switch (sortBy) {
            case 'title':
              return (a.title || '').localeCompare(b.title || '')
            case 'company':
              return (a.company || '').localeCompare(b.company || '')
            case 'country':
              return (a.country || '').localeCompare(b.country || '')
            case 'created_date':
            default:
              return new Date(b.created_at || 0) - new Date(a.created_at || 0)
          }
        })
        
        // Apply pagination
        const total = filteredDrafts.length
        const totalPages = Math.ceil(total / pagination.limit)
        const startIndex = (pagination.page - 1) * pagination.limit
        const endIndex = startIndex + pagination.limit
        const paginatedDrafts = filteredDrafts.slice(startIndex, endIndex)
        
        setDrafts(paginatedDrafts)
        setPagination(prev => ({
          ...prev,
          total,
          totalPages
        }))
        
      } catch (err) {
        console.error('Failed to fetch drafts:', err)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDrafts()
  }, [filters, pagination.page, pagination.limit])

  const handleDraftSelect = (draftId) => {
    const newSelected = new Set(selectedDrafts)
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId)
    } else {
      newSelected.add(draftId)
    }
    setSelectedDrafts(newSelected)
  }

  const handlePublish = async (draftId) => {
    setConfirmAction('publish')
    setConfirmData({ id: draftId, title: drafts.find(d => d.id === draftId)?.title })
    setShowConfirmModal(true)
  }

  const handleDelete = async (draftId) => {
    setConfirmAction('delete')
    setConfirmData({ id: draftId, title: drafts.find(d => d.id === draftId)?.title })
    setShowConfirmModal(true)
  }

  const handleEdit = (draft, targetStep = 0) => {
    if (draft.status === 'published') {
      showToast('⚠️ Cannot edit published jobs. Please create a new draft instead.', 'error')
      return
    }
    
    // Allow bulk draft editing
    if (draft.is_bulk_draft) {
      // Set the draft for editing and open wizard
      setEditingDraft(draft)
      setEditingStep(0) // Start from the beginning for bulk drafts
      setShowWizard(true)
      showToast('📝 Editing bulk draft. You can modify the bulk entries and settings.', 'info')
      return
    }
    
    // For partial drafts, open at the last completed step + 1 (next incomplete step)
    const editStep = draft.is_partial && draft.last_completed_step !== undefined 
      ? Math.min(draft.last_completed_step + 1, 7) // Max step is 7 (0-indexed)
      : targetStep
    
    // Check if there are unsaved changes (this would be enhanced with actual change detection)
    const hasUnsavedChanges = false // This would be determined by comparing current form state
    
    if (hasUnsavedChanges) {
      setConfirmAction('edit')
      setConfirmData({ draft, hasChanges: true, targetStep: editStep })
      setShowConfirmModal(true)
    } else {
      // Set the draft for editing and open wizard at specific step
      setEditingDraft(draft)
      setEditingStep(editStep)
      setShowWizard(true)
      
      // Show helpful toast for partial drafts
      if (draft.is_partial) {
        showToast(`📄 Continuing from step ${editStep + 1}. Your previous progress has been saved.`, 'info')
      }
    }
  }

  const confirmActionHandler = async () => {
    try {
      if (confirmAction === 'publish') {
        await executePublish(confirmData.id)
      } else if (confirmAction === 'delete') {
        await executeDelete(confirmData.id)
      } else if (confirmAction === 'edit') {
        setEditingDraft(confirmData.draft)
        setEditingStep(confirmData.targetStep || 0)
        setShowWizard(true)
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setShowConfirmModal(false)
      setConfirmAction(null)
      setConfirmData(null)
    }
  }

  const executePublish = async (draftId) => {
    try {
      // Find the draft to check if it's partial
      const draft = drafts.find(d => d.id === draftId)
      
      // Check if draft is partial/incomplete
      if (draft && draft.is_partial) {
        showToast('⚠️ Cannot publish incomplete draft. Please complete all required fields first.', 'error')
        return
      }
      
      // Additional validation for incomplete data
      if (draft && (!draft.title || !draft.country || !draft.company)) {
        showToast('⚠️ Cannot publish incomplete draft. Please fill in all required information.', 'error')
        return
      }
      
      setPublishingDrafts(prev => new Set([...prev, draftId]))
      await jobService.publishJob(draftId)
      
      // Show success toast
      showToast('✅ Draft published successfully! Job is now live.', 'success')
      
      // Refresh drafts data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      
      // Reset pagination if needed
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
    } catch (error) {
      console.error('Failed to publish draft:', error)
      showToast('❌ Failed to publish draft. Please try again.', 'error')
    } finally {
      setPublishingDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    }
  }

  const executeDelete = async (draftId) => {
    try {
      setDeletingDrafts(prev => new Set([...prev, draftId]))
      await jobService.deleteJob(draftId)
      
      // Show success toast
      showToast('✅ Draft deleted successfully!', 'success')
      
      // Refresh data
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      
      // Reset pagination if needed
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
      
      // Remove from selected if it was selected
      setSelectedDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    } catch (error) {
      console.error('Failed to delete draft:', error)
      showToast('❌ Failed to delete draft. Please try again.', 'error')
    } finally {
      setDeletingDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    }
  }

  // Get unique values for filter options
  const countries = [...new Set(drafts.map(draft => draft.country).filter(Boolean))]
  const companyOptions = [...new Set(drafts.map(draft => draft.company).filter(Boolean))]
  const categories = [...new Set(drafts.map(draft => draft.category || draft.title).filter(Boolean))]

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded w-28"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>

          {/* Search and Controls Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 bg-gray-200 rounded w-80"></div>
            <div className="flex space-x-2">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Status bar */}
                <div className="h-1 bg-gray-200"></div>
                
                <div className="p-6 pt-12">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg mr-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-28"></div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded-md w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-md w-20"></div>
                    <div className="h-6 bg-gray-200 rounded-md w-12"></div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <div className="h-7 bg-gray-200 rounded w-16"></div>
                      <div className="h-7 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Failed to load drafts</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              We encountered an issue while loading your drafts. Please try again or contact support if the problem persists.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Try Again
              </button>
              <button 
                onClick={() => {
                  setEditingDraft(null)
                  setShowWizard(true)
                }}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Draft
              </button>
            </div>
            {error.message && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-mono">{error.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Handle select all drafts
  const handleSelectAll = () => {
    if (selectedDrafts.size === drafts.length) {
      setSelectedDrafts(new Set())
    } else {
      setSelectedDrafts(new Set(drafts.map(draft => draft.id)))
    }
  }

  // Render grid view
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {drafts.length > 0 ? (
        drafts.map(draft => (
          <InteractiveCard key={draft.id} hoverable clickable className="p-4 border-l-4 border-orange-500 shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  draft.is_bulk_draft 
                    ? 'bg-purple-100 text-purple-800'
                    : draft.is_partial 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${
                    draft.is_bulk_draft ? 'bg-purple-400' : draft.is_partial ? 'bg-yellow-400' : 'bg-orange-400'
                  }`}></div>
                  {draft.is_bulk_draft ? 'Bulk Draft' : draft.is_partial ? 'Partial' : 'Draft'}
                </span>
                {draft.is_bulk_draft && (
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded font-medium">
                    {draft.total_jobs} Jobs
                  </span>
                )}
                {draft.is_partial && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Step {(draft.last_completed_step || 0) + 1}/8
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-4 mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm ${
                draft.is_bulk_draft 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                  : 'bg-gradient-to-br from-primary-500 to-primary-600'
              }`}>
                <span className="text-white text-lg font-medium">
                  {draft.is_bulk_draft 
                    ? 'B' 
                    : (draft.company?.charAt(0) || draft.title?.charAt(0) || 'D')
                  }
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {draft.title || 'Untitled Draft'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {draft.is_bulk_draft 
                    ? (() => {
                        const countries = [...new Set(draft.bulk_entries?.map(e => e.country).filter(Boolean))] || []
                        const positions = [...new Set(draft.bulk_entries?.map(e => e.position).filter(Boolean))] || []
                        
                        let description = `${draft.bulk_entries?.length || 0} entries across `
                        
                        if (countries.length > 0) {
                          const countryText = countries.length === 1 ? 'country' : 'countries'
                          description += `${countries.length} ${countryText} (${countries.slice(0, 2).join(', ')}${countries.length > 2 ? ` +${countries.length - 2} more` : ''})`
                        } else {
                          description += `${new Set(draft.bulk_entries?.map(e => e.country)).size || 0} countries`
                        }
                        
                        if (positions.length > 0) {
                          description += ` for ${positions.slice(0, 2).join(', ')}${positions.length > 2 ? ` +${positions.length - 2} more` : ''} roles`
                        }
                        
                        return description
                      })()
                    : (draft.company || 'No Company')
                  }
                </p>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1.5 text-primary-400" />
                    <span>
                      {draft.is_bulk_draft 
                        ? (() => {
                            const countries = [...new Set(draft.bulk_entries?.map(e => e.country).filter(Boolean))] || []
                            const countryText = countries.length === 1 ? 'Country' : 'Countries'
                            return countries.length > 0 
                              ? `${countries.length} ${countryText} (${countries.slice(0, 2).join(', ')}${countries.length > 2 ? ` +${countries.length - 2} more` : ''})`
                              : `${new Set(draft.bulk_entries?.map(e => e.country)).size || 0} Countries`
                          })()
                        : (draft.city || draft.country || 'Location TBD')
                      }
                    </span>
                  </div>
                  {draft.is_bulk_draft ? (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-1.5 text-primary-400" />
                      <span>{draft.total_jobs} Total Jobs</span>
                    </div>
                  ) : (
                    draft.salary && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-1.5 text-primary-400" />
                        <span>{draft.salary} {draft.currency || 'AED'}</span>
                      </div>
                    )
                  )}
                  <div className="flex items-center text-base text-gray-600">
                    <Calendar className="w-5 h-5 mr-2 text-primary-400" />
                    <span>Created {draft.created_at ? format(new Date(draft.created_at), 'MMM dd, yyyy') : 'Recently'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {draft.tags && draft.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {draft.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full border border-gray-200">
                      {tag}
                    </span>
                  ))}
                  {draft.tags.length > 3 && (
                    <span className="text-sm text-primary-500 font-medium">+{draft.tags.length - 3} more</span>
                  )}
                </div>
              </div>
            )}

            {/* Description Preview */}
            {draft.description && (
              <div className="mb-4">
                <p className="text-base text-gray-600 line-clamp-2">
                  {draft.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setPreviewDraft(draft)
                    setShowPreviewModal(true)
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </InteractiveButton>
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleEdit(draft)
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </InteractiveButton>
              </div>
              <div className="flex space-x-3">
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handlePublish(draft.id)
                  }}
                  disabled={publishingDrafts.has(draft.id)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Publish
                </InteractiveButton>
                <InteractiveButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDelete(draft.id)
                  }}
                  disabled={deletingDrafts.has(draft.id)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </InteractiveButton>
              </div>
            </div>
          </InteractiveCard>
        ))
      ) : (
        <div className="col-span-3 text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
          <p className="text-gray-600 mb-4">
            {Object.values(filters).some(v => v) ? 'No drafts match your current filters.' : 'Create your first draft to get started.'}
          </p>
          <InteractiveButton
            onClick={() => {
              setEditingDraft(null)
              setShowWizard(true)
            }}
            variant="primary"
            icon={Plus}
          >
            Create Draft
          </InteractiveButton>
        </div>
      )}
    </div>
  )

  // Render list view
  const renderListView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                onChange={handleSelectAll}
                checked={drafts.length > 0 && selectedDrafts.size === drafts.length}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </th>
            <th scope="col" className="w-[26%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Job Title
            </th>
            <th scope="col" className="w-[14%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th scope="col" className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th scope="col" className="w-[8%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Salary
            </th>
            <th scope="col" className="w-[8%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th scope="col" className="w-[8%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="w-[24%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {drafts.length > 0 ? (
            drafts.map(draft => (
              <tr key={draft.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedDrafts.has(draft.id)}
                    onChange={() => handleDraftSelect(draft.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        draft.is_bulk_draft 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                          : 'bg-gradient-to-br from-primary-500 to-primary-600'
                      }`}>
                        <span className="text-white text-sm font-semibold">
                          {draft.is_bulk_draft ? 'B' : (draft.title?.charAt(0) || 'D')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {draft.title || 'Untitled Draft'}
                        {draft.is_bulk_draft && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {draft.total_jobs} Jobs
                          </span>
                        )}
                      </div>
                      {draft.is_bulk_draft ? (
                        <div className="text-sm text-gray-500">
                          {draft.bulk_entries?.length || 0} entries · {(() => {
                            const countries = [...new Set(draft.bulk_entries?.map(e => e.country).filter(Boolean))] || []
                            const countryText = countries.length === 1 ? 'country' : 'countries'
                            return countries.length > 0 
                              ? `${countries.length} ${countryText} (${countries.slice(0, 2).join(', ')}${countries.length > 2 ? ` +${countries.length - 2} more` : ''})`
                              : '0 countries'
                          })()}
                        </div>
                      ) : (
                        draft.tags && draft.tags.length > 0 && (
                          <div className="text-sm text-gray-500">
                            {draft.tags.slice(0, 2).join(', ')}
                            {draft.tags.length > 2 && ` +${draft.tags.length - 2} more`}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {draft.is_bulk_draft 
                      ? `${draft.bulk_entries?.length || 0} Companies` 
                      : (draft.company || 'No Company')
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {draft.is_bulk_draft 
                      ? (() => {
                          const countries = [...new Set(draft.bulk_entries?.map(e => e.country).filter(Boolean))] || []
                          const countryText = countries.length === 1 ? 'Country' : 'Countries'
                          return countries.length > 0 
                            ? `${countries.length} ${countryText} (${countries.slice(0, 2).join(', ')}${countries.length > 2 ? ` +${countries.length - 2} more` : ''})`
                            : `${new Set(draft.bulk_entries?.map(e => e.country)).size || 0} Countries`
                        })()
                      : (draft.city || draft.country || 'Location TBD')
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {draft.is_bulk_draft 
                      ? 'Varies by entry' 
                      : draft.salary 
                      ? `${draft.salary} ${draft.currency || 'AED'}` 
                      : 'Not specified'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {draft.created_at ? format(new Date(draft.created_at), 'MMM dd, yyyy') : 'Recently'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      draft.is_bulk_draft 
                        ? 'bg-purple-100 text-purple-800'
                        : draft.is_partial 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        draft.is_bulk_draft ? 'bg-purple-400' : draft.is_partial ? 'bg-yellow-400' : 'bg-orange-400'
                      }`}></div>
                      {draft.is_bulk_draft ? 'Bulk Draft' : draft.is_partial ? 'Partial' : 'Draft'}
                    </span>
                    {draft.is_partial && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Step {(draft.last_completed_step || 0) + 1}/8
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <InteractiveButton
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewDraft(draft)
                        setShowPreviewModal(true)
                      }}
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                      className="shadow-sm hover:shadow-md transition-shadow duration-200"
                      title="Preview"
                    >
                      Preview
                    </InteractiveButton>
                    <InteractiveButton
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(draft)
                      }}
                      variant="secondary"
                      size="sm"
                      icon={Edit}
                      className="shadow-sm hover:shadow-md transition-shadow duration-200"
                      title="Edit"
                    >
                      Edit
                    </InteractiveButton>
                    <InteractiveButton
                      onClick={(e) => {
                        e.stopPropagation()
                        if (draft.is_bulk_draft) {
                          showForcePublishConfirmation(draft)
                          return
                        }
                        if (draft.is_partial) {
                          showToast('⚠️ Cannot publish incomplete draft. Please complete all steps first.', 'error')
                          return
                        }
                        handlePublish(draft.id)
                      }}
                      variant={draft.is_partial ? "outline" : "primary"}
                      size="sm"
                      disabled={publishingDrafts.has(draft.id) || draft.is_partial}
                      loading={publishingDrafts.has(draft.id)}
                      icon={Check}
                      className={`shadow-sm hover:shadow-md transition-shadow duration-200 ${
                        draft.is_partial ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={
                        draft.is_bulk_draft 
                          ? 'Bulk publish with options for completing details or force publishing'
                          : draft.is_partial 
                          ? 'Complete the draft before publishing' 
                          : 'Publish this draft'
                      }
                    >
                      {publishingDrafts.has(draft.id) 
                        ? 'Publishing...' 
                        : draft.is_bulk_draft 
                        ? 'Bulk Publish' 
                        : draft.is_partial 
                        ? 'Incomplete' 
                        : 'Publish'
                      }
                    </InteractiveButton>
                    <InteractiveButton
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(draft.id)
                      }}
                      variant="ghost"
                      size="sm"
                      disabled={deletingDrafts.has(draft.id)}
                      loading={deletingDrafts.has(draft.id)}
                      icon={Trash2}
                      className="text-red-600 hover:text-red-800 shadow-sm hover:shadow-md transition-shadow duration-200 border border-red-200 hover:border-red-300"
                      title={deletingDrafts.has(draft.id) ? 'Deleting...' : 'Delete'}
                    >
                      {deletingDrafts.has(draft.id) ? 'Deleting...' : 'Delete'}
                    </InteractiveButton>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
                <p className="text-gray-600 mb-4">
                  {Object.values(filters).some(v => v) ? 'No drafts match your current filters.' : 'Create your first draft to get started.'}
                </p>
                <InteractiveButton
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  icon={Plus}
                >
                  Create Draft
                </InteractiveButton>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage job draft postings before publishing
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-2">
          
          {selectedDrafts.size > 0 && (
            <>
              <InteractiveButton
                onClick={(e) => {
                  e.preventDefault()
                  selectedDrafts.forEach(draftId => handlePublish(draftId))
                  setSelectedDrafts(new Set())
                }}
                variant="primary"
                size="sm"
                disabled={publishingDrafts.size > 0}
                loading={publishingDrafts.size > 0}
                icon={Check}
              >
                Publish ({selectedDrafts.size})
              </InteractiveButton>
              <InteractiveButton
                onClick={async (e) => {
                  e.preventDefault()
                  try {
                    const deletePromises = Array.from(selectedDrafts).map(draftId => 
                      jobService.deleteJob(draftId)
                    )
                    await Promise.all(deletePromises)
                    
                    // Refresh drafts data
                    const updatedDrafts = await jobService.getDraftJobs()
                    setDrafts(updatedDrafts)
                    setSelectedDrafts(new Set())
                  } catch (error) {
                    console.error('Failed to delete drafts:', error)
                  }
                }}
                variant="danger"
                size="sm"
                icon={Trash2}
              >
                Delete ({selectedDrafts.size})
              </InteractiveButton>
            </>
          )}


          
          <InteractiveButton
            onClick={(e) => {
              e.preventDefault()
              setEditingDraft(null)
              setShowWizard(true)
            }}
            variant="primary"
            icon={Plus}
          >
            Create Draft
          </InteractiveButton>

          {/* View Toggle */}
          <div className="flex rounded-md shadow-sm">
            <InteractiveButton
              onClick={(e) => {
                e.preventDefault()
                setViewMode('grid')
              }}
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              icon={Grid3X3}
              className="rounded-r-none border-r-0"
            />
            <InteractiveButton
              onClick={(e) => {
                e.preventDefault()
                setViewMode('list')
              }}
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="sm"
              icon={List}
              className="rounded-l-none"
            />
          </div>
        </div>
      </div>

      {/* Minimal Filters (like Jobs page) */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search drafts by title, company..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select
              value={filters.company}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Companies</option>
              {companyOptions.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={filters.sortBy || 'created_date'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="created_date">Sort by Created Date</option>
              <option value="title">Sort by Title</option>
              <option value="company">Sort by Company</option>
              <option value="country">Sort by Country</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
        <span>
          Showing {drafts.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
        </span>
      </div>

      {/* Drafts View */}
      <div className="grid grid-cols-1 gap-6">
        {viewMode === 'grid' ? renderGridView() : renderListView()}
      </div>

      {/* Interactive Pagination */}
      {drafts.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 bg-white p-4 rounded-lg border border-gray-200">
          <PaginationInfo
            currentPage={pagination.page}
            totalPages={Math.max(1, pagination.totalPages)}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />

          <InteractivePagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            size="md"
          />
        </div>
      )}

      {/* Job Draft Wizard */}
      <JobDraftWizard
        isOpen={showWizard}
        onClose={() => {
          setShowWizard(false)
          setEditingDraft(null)
          setEditingStep(0)
        }}
        onSave={handleWizardSave}
        editingDraft={editingDraft}
        initialStep={editingStep}
      />

      {/* Enhanced Preview Modal with Draft Flow */}
      {showPreviewModal && previewDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Draft Preview</h2>
                <p className="text-sm text-gray-600 mt-1">Review your draft completion status and details</p>
                {/* Progress indicator for partial drafts */}
                {previewDraft.is_partial && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      📝 Partial Draft
                    </span>
                    <span className="text-xs text-gray-600">
                      Last saved at step {(previewDraft.last_completed_step || 0) + 1} of 8
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowPreviewModal(false)
                  setPreviewDraft(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Draft Type Section */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Draft Type: {previewDraft.is_bulk_draft ? 'Bulk Draft Creation' : 'Single Draft Creation'}
                </h3>
                <p className="text-blue-700 text-sm">
                  {previewDraft.is_bulk_draft 
                    ? `This bulk draft contains ${previewDraft.total_jobs} jobs across ${previewDraft.bulk_entries?.length || 0} entries and ${new Set(previewDraft.bulk_entries?.map(e => e.country)).size || 0} countries.` 
                    : 'This is a single job draft following the standard 8-step creation process.'}
                </p>
                
                {/* Progress indicator for bulk drafts vs single drafts */}
                {previewDraft.is_bulk_draft ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-blue-700 mb-1">
                      <span>Bulk Draft Summary</span>
                      <span>{previewDraft.total_jobs} jobs · {(() => {
                        const countries = [...new Set(previewDraft.bulk_entries?.map(e => e.country).filter(Boolean))] || []
                        const countryText = countries.length === 1 ? 'country' : 'countries'
                        return countries.length > 0 
                          ? `${countries.length} ${countryText} (${countries.slice(0, 2).join(', ')}${countries.length > 2 ? ` +${countries.length - 2} more` : ''})`
                          : `${new Set(previewDraft.bulk_entries?.map(e => e.country)).size || 0} countries`
                      })()}</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  /* Completion Progress Bar for regular drafts */
                  (() => {
                    const completedSteps = [
                      previewDraft.title && previewDraft.company && previewDraft.country, // Step 1
                      previewDraft.period_years && previewDraft.employment_type, // Step 2
                      previewDraft.positions && previewDraft.positions.length > 0, // Step 3
                      (previewDraft.skills && previewDraft.skills.length > 0) || (previewDraft.tags && previewDraft.tags.length > 0), // Step 4
                      previewDraft.expenses && previewDraft.expenses.length > 0, // Step 5
                      previewDraft.cutout && (previewDraft.cutout.has_file || previewDraft.cutout.is_uploaded || previewDraft.cutout.file_name || previewDraft.cutout.file_url), // Step 6
                      previewDraft.interview && previewDraft.interview.date_ad, // Step 7
                      true // Step 8 (Review) - always available
                    ].filter(Boolean).length
                    
                    const progressPercentage = (completedSteps / 8) * 100
                    
                    return (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm text-blue-700 mb-1">
                          <span>Completion Progress</span>
                          <span>{completedSteps}/8 steps ({Math.round(progressPercentage)}%)</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>

              {/* Draft Details List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {previewDraft.is_bulk_draft ? 'Bulk Draft Details' : 'Draft Details'}
                </h3>
                
                {/* Bulk Draft Specific Preview */}
                {previewDraft.is_bulk_draft ? (
                  <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50">
                      <div className="p-4 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-purple-900 flex items-center">
                            <Check className="w-5 h-5 text-purple-600 mr-2" />
                            Bulk Draft Summary
                          </h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                            {previewDraft.bulk_entries?.length || 0} Entries
                          </span>
                        </div>
                        <div className="text-sm space-y-2">
                          <div className="text-purple-800">
                            <strong>Total Jobs:</strong> {previewDraft.total_jobs}
                          </div>
                          <div className="text-purple-800">
                            <strong>Countries:</strong> {(() => {
                              const countries = [...new Set(previewDraft.bulk_entries?.map(e => e.country).filter(Boolean))] || []
                              return countries.length > 0 
                                ? `${countries.length} (${countries.join(', ')})`
                                : '0 (Not specified)'
                            })()}
                          </div>
                          <div className="text-purple-800">
                            <strong>Positions:</strong> {(() => {
                              const positions = [...new Set(previewDraft.bulk_entries?.map(e => e.position).filter(Boolean))] || []
                              return positions.length > 0 
                                ? `${positions.length} types (${positions.join(', ')})`
                                : '0 types (Not specified)'
                            })()}
                          </div>
                          <div className="text-purple-800">
                            <strong>Description:</strong> {(() => {
                              const countries = [...new Set(previewDraft.bulk_entries?.map(e => e.country).filter(Boolean))] || []
                              const positions = [...new Set(previewDraft.bulk_entries?.map(e => e.position).filter(Boolean))] || []
                              
                              if (countries.length > 0 && positions.length > 0) {
                                const countryText = countries.length === 1 ? 'country' : 'countries'
                                return `Bulk job creation for ${previewDraft.total_jobs} positions across ${countries.length} ${countryText} (${countries.join(', ')}) for ${positions.join(', ')} roles`
                              } else if (countries.length > 0) {
                                const countryText = countries.length === 1 ? 'country' : 'countries'
                                return `Bulk job creation for ${previewDraft.total_jobs} positions across ${countries.length} ${countryText} (${countries.join(', ')})`
                              } else if (positions.length > 0) {
                                return `Bulk job creation for ${previewDraft.total_jobs} positions for ${positions.join(', ')} roles`
                              } else {
                                return previewDraft.description || `Bulk job creation for ${previewDraft.total_jobs} positions`
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bulk Draft Actions Note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-medium text-amber-800 mb-1">Bulk Draft Publishing Options</h5>
                          <p className="text-sm text-amber-700 mb-4">
                            Choose how you want to handle this bulk draft with {previewDraft.total_jobs} jobs.
                          </p>
                          
                          <div className="space-y-3">
                            {/* Recommended Option */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h6 className="text-sm font-medium text-blue-900 mb-1 flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                ⭐ Recommended: Complete Individual Details
                              </h6>
                              <p className="text-xs text-blue-700 mb-2">
                                Expand into individual drafts where you can fill in all job details properly.
                              </p>
                              <button
                                onClick={() => handleExpandBulkDraft(previewDraft)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <Edit className="w-3 h-3 mr-1.5" />
                                Expand & Complete
                              </button>
                            </div>
                            
                            {/* Quick Option */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <h6 className="text-sm font-medium text-orange-900 mb-1 flex items-center">
                                <Check className="w-4 h-4 mr-2" />
                                ⚡ Quick Publish with Basic Details
                              </h6>
                              <p className="text-xs text-orange-700 mb-2">
                                Publish immediately with available details. Missing fields will be marked as "N/A".
                              </p>
                              <button
                                onClick={() => showForcePublishConfirmation(previewDraft)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-md shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <AlertCircle className="w-3 h-3 mr-1.5" />
                                Force Publish
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Regular Draft Details (existing sections) */
                  <div className="space-y-4">
                
                {/* 1. Posting Details */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 border-l-4 ${
                    previewDraft.title && previewDraft.company && previewDraft.country 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {previewDraft.title && previewDraft.company && previewDraft.country 
                          ? <Check className="w-5 h-5 text-green-600 mr-2" /> 
                          : <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        }
                        1. Posting Details
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowPreviewModal(false)
                            setPreviewDraft(null)
                            handleEdit(previewDraft, 0) // Go to Posting Details step (step 0)
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Posting Details"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          previewDraft.title && previewDraft.company && previewDraft.country 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {previewDraft.title && previewDraft.company && previewDraft.country ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {previewDraft.title ? (
                        <div className="text-gray-700"><strong>Job Title:</strong> {previewDraft.title}</div>
                      ) : (
                        <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                          ⚠️ <strong>Missing:</strong> Job Title - Please add a clear job title
                        </div>
                      )}
                      {previewDraft.company ? (
                        <div className="text-gray-700"><strong>Company:</strong> {previewDraft.company}</div>
                      ) : (
                        <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                          ⚠️ <strong>Missing:</strong> Company Name - Please specify the hiring company
                        </div>
                      )}
                      {previewDraft.employer && previewDraft.employer !== previewDraft.company && (
                        <div className="text-gray-700"><strong>Employer:</strong> {previewDraft.employer}</div>
                      )}
                      {previewDraft.country ? (
                        <div className="text-gray-700"><strong>Country:</strong> {previewDraft.country}</div>
                      ) : (
                        <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                          ⚠️ <strong>Missing:</strong> Country - Please select the job location country
                        </div>
                      )}
                      {previewDraft.city && (
                        <div className="text-gray-700"><strong>City:</strong> {previewDraft.city}</div>
                      )}
                      {previewDraft.posting_agency && (
                        <div className="text-gray-700"><strong>Posting Agency:</strong> {previewDraft.posting_agency}</div>
                      )}
                      {previewDraft.lt_number ? (
                        <div className="text-gray-700"><strong>LT Number:</strong> {previewDraft.lt_number}</div>
                      ) : (
                        <div className="text-gray-500 text-xs italic">LT Number: Not provided (will be added later)</div>
                      )}
                      {previewDraft.chalani_number ? (
                        <div className="text-gray-700"><strong>Chalani Number:</strong> {previewDraft.chalani_number}</div>
                      ) : (
                        <div className="text-gray-500 text-xs italic">Chalani Number: Not provided (will be added later)</div>
                      )}
                      {previewDraft.approval_date_ad && (
                        <div className="text-gray-700"><strong>Approval Date:</strong> {previewDraft.approval_date_ad}</div>
                      )}
                      {previewDraft.posting_date_ad && (
                        <div className="text-gray-700"><strong>Posting Date:</strong> {previewDraft.posting_date_ad}</div>
                      )}
                      {previewDraft.announcement_type && (
                        <div className="text-gray-700"><strong>Announcement Type:</strong> {previewDraft.announcement_type}</div>
                      )}
                      {previewDraft.description && (
                        <div className="text-gray-700"><strong>Description:</strong> {previewDraft.description.length > 100 ? previewDraft.description.substring(0, 100) + '...' : previewDraft.description}</div>
                      )}
                      
                      {/* Show completion message for this section */}
                      {!previewDraft.title || !previewDraft.company || !previewDraft.country ? (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          📝 <strong>To complete this section:</strong> Fill in the missing required fields above and continue to save your progress.
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          ✅ <strong>Section Complete:</strong> All required posting details have been filled.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Contract */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 border-l-4 ${
                    previewDraft.period_years && previewDraft.employment_type 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {previewDraft.period_years && previewDraft.employment_type 
                          ? <Check className="w-5 h-5 text-green-600 mr-2" /> 
                          : <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        }
                        2. Contract
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowPreviewModal(false)
                            setPreviewDraft(null)
                            handleEdit(previewDraft, 1) // Go to Contract step (step 1)
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Contract Details"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          previewDraft.period_years && previewDraft.employment_type 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {previewDraft.period_years && previewDraft.employment_type ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {previewDraft.period_years ? (
                        <div className="text-gray-700"><strong>Contract Duration:</strong> {previewDraft.period_years} year(s)</div>
                      ) : (
                        <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                          ⚠️ <strong>Missing:</strong> Contract Duration - Please specify contract period in years
                        </div>
                      )}
                      {previewDraft.employment_type ? (
                        <div className="text-gray-700"><strong>Employment Type:</strong> {previewDraft.employment_type}</div>
                      ) : (
                        <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                          ⚠️ <strong>Missing:</strong> Employment Type - Please specify if Full-time, Part-time, etc.
                        </div>
                      )}
                      {previewDraft.renewable !== undefined && (
                        <div className="text-gray-700"><strong>Renewable:</strong> {previewDraft.renewable ? 'Yes' : 'No'}</div>
                      )}
                      {previewDraft.hours_per_day && (
                        <div className="text-gray-700"><strong>Working Hours:</strong> {previewDraft.hours_per_day} hours/day</div>
                      )}
                      {previewDraft.days_per_week && (
                        <div className="text-gray-700"><strong>Working Days:</strong> {previewDraft.days_per_week} days/week</div>
                      )}
                      {previewDraft.overtime_policy && (
                        <div className="text-gray-700"><strong>Overtime Policy:</strong> {previewDraft.overtime_policy.replace('_', ' ')}</div>
                      )}
                      {previewDraft.weekly_off_days !== undefined && (
                        <div className="text-gray-700"><strong>Weekly Off Days:</strong> {previewDraft.weekly_off_days}</div>
                      )}
                      {previewDraft.annual_leave_days && (
                        <div className="text-gray-700"><strong>Annual Leave:</strong> {previewDraft.annual_leave_days} days</div>
                      )}
                      {previewDraft.food && (
                        <div className="text-gray-700"><strong>Food:</strong> {previewDraft.food}</div>
                      )}
                      {previewDraft.accommodation && (
                        <div className="text-gray-700"><strong>Accommodation:</strong> {previewDraft.accommodation}</div>
                      )}
                      {previewDraft.transport && (
                        <div className="text-gray-700"><strong>Transport:</strong> {previewDraft.transport}</div>
                      )}
                      
                      {/* Show completion message for this section */}
                      {!previewDraft.period_years || !previewDraft.employment_type ? (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          📝 <strong>To complete this section:</strong> Add contract duration and employment type to define the employment terms.
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          ✅ <strong>Section Complete:</strong> Employment contract terms are defined.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Positions */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 border-l-4 ${
                    previewDraft.positions && previewDraft.positions.length > 0 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {previewDraft.positions && previewDraft.positions.length > 0 
                          ? <Check className="w-5 h-5 text-green-600 mr-2" /> 
                          : <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        }
                        3. Positions
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowPreviewModal(false)
                            setPreviewDraft(null)
                            handleEdit(previewDraft, 2) // Go to Positions step (step 2)
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Positions"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          previewDraft.positions && previewDraft.positions.length > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {previewDraft.positions && previewDraft.positions.length > 0 ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {previewDraft.positions && previewDraft.positions.length > 0 ? (
                        <div>
                          {previewDraft.positions.map((pos, idx) => (
                            <div key={idx} className="text-gray-700 border-b border-gray-200 pb-2 last:border-b-0 mb-2">
                              <div><strong>Position {idx + 1}:</strong> {pos.title}</div>
                              <div className="ml-4 text-xs space-y-1">
                                <div>Male Vacancies: {pos.vacancies_male || 0}</div>
                                <div>Female Vacancies: {pos.vacancies_female || 0}</div>
                                <div>Total Vacancies: {(pos.vacancies_male || 0) + (pos.vacancies_female || 0)}</div>
                                {pos.monthly_salary && (
                                  <div>Salary: {pos.monthly_salary} {pos.currency || 'AED'}/month</div>
                                )}
                              </div>
                            </div>
                          ))}
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                            ✅ <strong>Section Complete:</strong> {previewDraft.positions.length} position(s) defined with salary details.
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                            ⚠️ <strong>Missing:</strong> No positions defined
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            📝 <strong>To complete this section:</strong> Add at least one job position with title, vacancy count, and salary information.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Tags & Canonical Titles */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 border-l-4 ${
                    (previewDraft.skills && previewDraft.skills.length > 0) || (previewDraft.tags && previewDraft.tags.length > 0) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {(previewDraft.skills && previewDraft.skills.length > 0) || (previewDraft.tags && previewDraft.tags.length > 0) 
                          ? <Check className="w-5 h-5 text-green-600 mr-2" /> 
                          : <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        }
                        4. Tags & Canonical Titles
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowPreviewModal(false)
                            setPreviewDraft(null)
                            handleEdit(previewDraft, 3) // Go to Tags & Canonical Titles step (step 3)
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Tags & Canonical Titles"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          (previewDraft.skills && previewDraft.skills.length > 0) || (previewDraft.tags && previewDraft.tags.length > 0) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {(previewDraft.skills && previewDraft.skills.length > 0) || (previewDraft.tags && previewDraft.tags.length > 0) ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {previewDraft.skills && previewDraft.skills.length > 0 ? (
                        <div className="text-gray-700"><strong>Skills:</strong> {previewDraft.skills.join(', ')}</div>
                      ) : (
                        <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                          ⚠️ <strong>Missing:</strong> Skills - Please add required job skills
                        </div>
                      )}
                      {previewDraft.tags && previewDraft.tags.length > 0 ? (
                        <div className="text-gray-700"><strong>Tags:</strong> {previewDraft.tags.join(', ')}</div>
                      ) : previewDraft.skills && previewDraft.skills.length === 0 ? (
                        <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                          ⚠️ <strong>Missing:</strong> Tags - Please add relevant job tags
                        </div>
                      ) : null}
                      {previewDraft.education_requirements && previewDraft.education_requirements.length > 0 ? (
                        <div className="text-gray-700"><strong>Education:</strong> {previewDraft.education_requirements.join(', ')}</div>
                      ) : (
                        <div className="text-gray-500 text-xs italic">Education Requirements: Not specified (optional)</div>
                      )}
                      {previewDraft.experience_requirements ? (
                        <div className="text-gray-700">
                          <strong>Experience:</strong> {previewDraft.experience_requirements.min_years} years minimum
                          {previewDraft.experience_requirements.domains && (
                            <span> in {previewDraft.experience_requirements.domains.join(', ')}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 text-xs italic">Experience Requirements: Not specified (optional)</div>
                      )}
                      
                      {/* Show completion message for this section */}
                      {!((previewDraft.skills && previewDraft.skills.length > 0) || (previewDraft.tags && previewDraft.tags.length > 0)) ? (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                          📝 <strong>To complete this section:</strong> Add skills or tags to help candidates understand job requirements.
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          ✅ <strong>Section Complete:</strong> Job requirements and skills are defined.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Expenses */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 border-l-4 ${
                    previewDraft.expenses && previewDraft.expenses.length > 0 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {previewDraft.expenses && previewDraft.expenses.length > 0 
                          ? <Check className="w-5 h-5 text-green-600 mr-2" /> 
                          : <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        }
                        5. Expenses
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowPreviewModal(false)
                            setPreviewDraft(null)
                            handleEdit(previewDraft, 4) // Go to Expenses step (step 4)
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Expenses"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          previewDraft.expenses && previewDraft.expenses.length > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {previewDraft.expenses && previewDraft.expenses.length > 0 ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {previewDraft.expenses && previewDraft.expenses.length > 0 ? (
                        <div>
                          {previewDraft.expenses.map((expense, idx) => (
                            <div key={idx} className="text-gray-700 border-b border-gray-200 pb-2 last:border-b-0">
                              <div><strong>{expense.type}:</strong> {expense.who_pays} pays 
                              {expense.is_free ? ' (Free)' : expense.amount ? ` ${expense.amount} ${expense.currency} (Paid)` : ' (Paid)'}</div>
                              {expense.notes && <div className="text-gray-500 text-xs ml-2">Note: {expense.notes}</div>}
                            </div>
                          ))}
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                            ✅ <strong>Section Complete:</strong> {previewDraft.expenses.length} expense item(s) detailed.
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                            ⚠️ <strong>Missing:</strong> No expense details provided
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            📝 <strong>To complete this section:</strong> Add expense details (medical, visa, travel, etc.) to clarify cost responsibilities.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Cutout */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 border-l-4 ${
                    previewDraft.cutout && (previewDraft.cutout.has_file || previewDraft.cutout.is_uploaded || previewDraft.cutout.file_name || previewDraft.cutout.file_url) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {previewDraft.cutout && (previewDraft.cutout.has_file || previewDraft.cutout.is_uploaded || previewDraft.cutout.file_name || previewDraft.cutout.file_url) 
                          ? <Check className="w-5 h-5 text-green-600 mr-2" /> 
                          : <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        }
                        6. Cutout
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowPreviewModal(false)
                            setPreviewDraft(null)
                            handleEdit(previewDraft, 5) // Go to Cutout step (step 5)
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Cutout"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          previewDraft.cutout && (previewDraft.cutout.has_file || previewDraft.cutout.is_uploaded || previewDraft.cutout.file_name || previewDraft.cutout.file_url) 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {previewDraft.cutout && (previewDraft.cutout.has_file || previewDraft.cutout.is_uploaded || previewDraft.cutout.file_name || previewDraft.cutout.file_url) ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm space-y-3">
                      {previewDraft.cutout && (previewDraft.cutout.file_url || previewDraft.cutout.preview_url) ? (
                        <div className="space-y-3">
                          {/* Image Preview - Enhanced */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-blue-800 text-sm font-semibold mb-3 flex items-center">
                              <Camera className="w-4 h-4 mr-2" />
                              Job Advertisement Cutout:
                            </div>
                            <div className="flex justify-center">
                              <div className="relative">
                                <img 
                                  src={previewDraft.cutout.file_url || previewDraft.cutout.preview_url} 
                                  alt="Job Advertisement Cutout"
                                  className="max-w-full max-h-64 w-auto h-auto rounded-lg border-2 border-white shadow-lg"
                                  style={{ maxWidth: '400px' }}
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNTAgMTEwSDI1MFYxMzBIMTUwVjExMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+aCBkPSJNMTUwIDE0MEgyNTBWMTUwSDE1MFYxNDBaIiBmaWxsPSIjOUNBNEFGIi8+CjxwYXRoIGQ9Ik0xNTAgMTYwSDIxMFYxNzBIMTUwVjE2MFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHA+aCBkPSJNMTcwIDIwMEMxNzAgMTk0LjQ3NyAxNzQuNDc3IDE5MCAxODAgMTkwQzE4NS41MjMgMTkwIDE5MCAyMDAgMTcwIDIwMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTE2MCAyMjBIMjQwVjIzMEgxNjBWMjIwWiIgZmlsbD0iIzlDQTRBRiIvPgo8dGV4dCB4PSIyMDAiIHk9IjI2MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNkI3MzgwIj5Kb2IgQWR2ZXJ0aXNlbWVudDwvdGV4dD4KPC9zdmc+'
                                    e.target.className = 'max-w-full max-h-64 w-auto h-auto rounded-lg border-2 border-dashed border-gray-300 bg-gray-100'
                                  }}
                                />
                                <div className="absolute top-2 right-2">
                                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                    <Check className="w-3 h-3 mr-1" />
                                    Uploaded
                                  </span>
                                </div>
                              </div>
                            </div>
                        
                            {/* Simple Full Screen Button */}
                            <div className="mt-3 text-center">
                              <button 
                                onClick={() => {
                                  const imageUrl = previewDraft.cutout.file_url || previewDraft.cutout.preview_url
                                  const fullscreenDiv = document.createElement('div')
                                  fullscreenDiv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer'
                                  const img = document.createElement('img')
                                  img.src = imageUrl
                                  img.style.cssText = 'max-width:95%;max-height:95%;object-fit:contain'
                                  fullscreenDiv.appendChild(img)
                                  fullscreenDiv.onclick = () => document.body.removeChild(fullscreenDiv)
                                  document.body.appendChild(fullscreenDiv)
                                }}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Full Screen
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                            ✅ <strong>Section Complete:</strong> Job advertisement image uploaded successfully.
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                            ⚠️ <strong>Missing:</strong> No job advertisement image provided
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            📝 <strong>To complete this section:</strong> Upload a job advertisement image (cutout) for better visibility and engagement.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. Review */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 border-l-4 ${
                    previewDraft.review && previewDraft.review.is_complete 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {previewDraft.review && previewDraft.review.is_complete 
                          ? <Check className="w-5 h-5 text-green-600 mr-2" /> 
                          : <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        }
                        7. Review
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowPreviewModal(false)
                            setPreviewDraft(null)
                            handleEdit(previewDraft, 6) // Go to Review step (step 6)
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Review"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          previewDraft.review && previewDraft.review.is_complete 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {previewDraft.review && previewDraft.review.is_complete ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm space-y-3">
                      {previewDraft.review && previewDraft.review.is_complete ? (
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            ✅ <strong>Section Complete:</strong> Review completed.
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                            ⚠️ <strong>Missing:</strong> No review provided
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            📝 <strong>To complete this section:</strong> Review the draft and confirm all details are correct.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 8. Submit */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className={`p-4 border-l-4 ${
                    previewDraft.submit && previewDraft.submit.is_complete 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-orange-400 bg-orange-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        {previewDraft.submit && previewDraft.submit.is_complete 
                          ? <Check className="w-5 h-5 text-green-600 mr-2" /> 
                          : <Clock className="w-5 h-5 text-orange-500 mr-2" />
                        }
                        8. Submit
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowPreviewModal(false)
                            setPreviewDraft(null)
                            handleEdit(previewDraft, 7) // Go to Submit step (step 7)
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Submit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          previewDraft.submit && previewDraft.submit.is_complete 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {previewDraft.submit && previewDraft.submit.is_complete ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm space-y-3">
                      {previewDraft.submit && previewDraft.submit.is_complete ? (
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            ✅ <strong>Section Complete:</strong> Submission completed.
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded border-l-2 border-orange-400">
                            ⚠️ <strong>Missing:</strong> No submission provided
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            📝 <strong>To complete this section:</strong> Submit the draft for final approval.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* End of sections */}
              </div>
            )
            }
          </div>
        </div>

        <div className="flex justify-between items-center space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewDraft(null)
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Selection
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewDraft(null)
                    handleEdit(previewDraft, previewDraft.is_bulk_draft ? 0 : 3) // Start from beginning for bulk drafts, step 3 for regular drafts
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  title={previewDraft.is_bulk_draft ? 'Edit bulk draft settings and entries' : 'Continue editing this draft'}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {previewDraft.is_bulk_draft ? 'Edit Bulk Draft' : 'Continue Editing'}
                </button>
              </div>
              <button
                onClick={async () => {
                  try {
                    // Check if draft is bulk - show force publish option
                    if (previewDraft.is_bulk_draft) {
                      showForcePublishConfirmation(previewDraft)
                      return
                    }
                    // Check if draft is partial
                    if (previewDraft.is_partial) {
                      showToast('⚠️ Cannot publish incomplete draft. Please complete all required fields first.', 'error')
                      return
                    }
                    await handlePublish(previewDraft.id)
                    setShowPreviewModal(false)
                    setPreviewDraft(null)
                    showToast('🚀 Job published successfully from preview!', 'success')
                  } catch (error) {
                    showToast('❌ Failed to publish job. Please try again.', 'error')
                  }
                }}
                className={`inline-flex items-center px-6 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                  previewDraft.is_partial
                    ? 'bg-gray-400 cursor-not-allowed'
                    : previewDraft.is_bulk_draft
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:ring-orange-500'
                    : [
                        previewDraft.title && previewDraft.company && previewDraft.country,
                        previewDraft.period_years && previewDraft.employment_type,
                        previewDraft.positions && previewDraft.positions.length > 0,
                        (previewDraft.skills && previewDraft.skills.length > 0) || (previewDraft.tags && previewDraft.tags.length > 0),
                        previewDraft.expenses && previewDraft.expenses.length > 0,
                        previewDraft.cutout && (previewDraft.cutout.has_file || previewDraft.cutout.is_uploaded),
                        previewDraft.interview && previewDraft.interview.date_ad
                      ].filter(Boolean).length >= 5 
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                        : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                }`}
                disabled={publishingDrafts.has(previewDraft.id) || previewDraft.is_partial}
                title={
                  previewDraft.is_bulk_draft 
                    ? 'Publish bulk draft with current details (missing fields will be marked N/A)'
                    : previewDraft.is_partial 
                    ? 'Complete the draft before publishing' 
                    : 'Publish this job'
                }
              >
                {publishingDrafts.has(previewDraft.id) ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    {previewDraft.is_bulk_draft ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Publish Options
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {previewDraft.is_partial 
                          ? 'Complete Draft First' 
                          : [
                              previewDraft.title && previewDraft.company && previewDraft.country,
                              previewDraft.period_years && previewDraft.employment_type,
                              previewDraft.positions && previewDraft.positions.length > 0,
                              (previewDraft.skills && previewDraft.skills.length > 0) || (previewDraft.tags && previewDraft.tags.length > 0),
                              previewDraft.expenses && previewDraft.expenses.length > 0,
                              previewDraft.cutout && (previewDraft.cutout.has_file || previewDraft.cutout.is_uploaded),
                              previewDraft.interview && previewDraft.interview.date_ad
                            ].filter(Boolean).length >= 5 
                            ? 'Publish Now' 
                            : 'Publish (Incomplete)'
                        }
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  confirmAction === 'delete' 
                    ? 'bg-red-100' 
                    : confirmAction === 'publish'
                    ? 'bg-green-100'
                    : 'bg-blue-100'
                }`}>
                  {confirmAction === 'delete' && <Trash2 className="w-5 h-5 text-red-600" />}
                  {confirmAction === 'publish' && <Check className="w-5 h-5 text-green-600" />}
                  {confirmAction === 'edit' && <Edit className="w-5 h-5 text-blue-600" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {confirmAction === 'delete' && 'Delete Draft'}
                  {confirmAction === 'publish' && 'Publish Draft'}
                  {confirmAction === 'edit' && 'Edit Draft'}
                </h3>
              </div>
              
              <div className="mb-6">
                {confirmAction === 'delete' && (
                  <div>
                    <p className="text-gray-700 mb-2">
                      Are you sure you want to delete <strong>"{confirmData?.title}"</strong>?
                    </p>
                    <p className="text-red-600 text-sm font-medium">
                      ⚠️ This action cannot be undone. All draft data will be permanently lost.
                    </p>
                  </div>
                )}
                
                {confirmAction === 'publish' && (
                  <div>
                    <p className="text-gray-700 mb-2">
                      Are you sure you want to publish <strong>"{confirmData?.title}"</strong>?
                    </p>
                    <p className="text-green-600 text-sm font-medium">
                      ✅ This will make the job posting live and visible to candidates.
                    </p>
                  </div>
                )}

                {confirmAction === 'edit' && confirmData?.hasChanges && (
                  <div>
                    <p className="text-gray-700 mb-2">
                      You have unsaved changes in the current draft.
                    </p>
                    <p className="text-orange-600 text-sm font-medium">
                      ⚠️ Opening the editor will discard any unsaved changes.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setConfirmAction(null)
                    setConfirmData(null)
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmActionHandler}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    confirmAction === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmAction === 'publish'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmAction === 'delete' && 'Delete Draft'}
                  {confirmAction === 'publish' && 'Publish Now'}
                  {confirmAction === 'edit' && 'Continue Editing'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force Publish Confirmation Modal */}
      {showForcePublishModal && forcePublishDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-orange-100">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Publish Bulk Draft
                </h3>
              </div>
              
              <div className="mb-6">
                <div className="mb-4">
                  <p className="text-gray-700 mb-3">
                    You're about to publish <strong>{forcePublishDraft.total_jobs} jobs</strong> from this bulk draft.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      ℹ️ We Recommend: Complete Individual Details
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      For best results, expand this bulk draft into individual drafts where you can fill in all job details properly.
                    </p>
                    <button
                      onClick={async () => {
                        setShowForcePublishModal(false)
                        await handleExpandBulkDraft(forcePublishDraft)
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Expand & Complete Details
                    </button>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-900 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      ⚠️ Force Publish Option
                    </h4>
                    <p className="text-sm text-amber-700 mb-3">
                      If you proceed with force publish, missing job details will be marked as <strong>"N/A"</strong>. This includes:
                    </p>
                    <ul className="text-sm text-amber-700 list-disc list-inside mb-3 space-y-1">
                      <li>Salary information</li>
                      <li>Detailed job requirements</li>
                      <li>Contact information</li>
                      <li>Accommodation & benefits details</li>
                      <li>Contract specifics</li>
                    </ul>
                    <p className="text-sm text-amber-700">
                      Only basic information from your bulk draft (Position, Country, Job Count) will be used.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowForcePublishModal(false)
                    setForcePublishDraft(null)
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleForcePublishBulkDraft(forcePublishDraft)
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-md transition-colors"
                >
                  ⚡ Force Publish with N/A
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-full">
          <div className={`flex items-center p-4 rounded-lg shadow-xl border-l-4 min-w-[300px] max-w-[500px] ${
            toastType === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : toastType === 'error'
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-blue-50 border-blue-500 text-blue-800'
          }`}>
            <div className="flex items-center">
              {toastType === 'success' && (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {toastType === 'error' && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <X className="w-3 h-3 text-white" />
                </div>
              )}
              {toastType === 'info' && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="font-medium text-sm">{toastMessage}</span>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className={`ml-3 p-1 rounded-full hover:bg-opacity-20 ${
                toastType === 'success' 
                  ? 'hover:bg-green-600' 
                  : toastType === 'error'
                  ? 'hover:bg-red-600'
                  : 'hover:bg-blue-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Drafts