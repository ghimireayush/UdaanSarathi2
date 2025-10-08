import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  CheckSquare,
  Square
} from 'lucide-react'
import { format } from 'date-fns'
import { jobService } from '../services/index.js'
import DraftListManagement from '../components/DraftListManagement'
import JobDraftWizard from '../components/JobDraftWizard'
import { InteractiveFilter, InteractiveButton, InteractiveCard } from '../components/InteractiveUI'
import { useLanguage } from '../hooks/useLanguage'
import LanguageSwitch from '../components/LanguageSwitch'
import { usePagination } from '../hooks/usePagination.js'
import PaginationWrapper from '../components/PaginationWrapper.jsx'

const Drafts = () => {
  const navigate = useNavigate()
  const { tPageSync } = useLanguage({ 
    pageName: 'drafts', 
    autoLoad: true 
  })

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  // State management
  const [viewMode, setViewMode] = useState('list')
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    company: '',
    category: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Client-side pagination for drafts
  const {
    currentData: paginatedDrafts,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    itemsPerPageOptions,
    goToPage,
    changeItemsPerPage,
    resetPagination
  } = usePagination(drafts, {
    initialItemsPerPage: 12,
    itemsPerPageOptions: [6, 12, 24, 48]
  })
  const [selectedDrafts, setSelectedDrafts] = useState(new Set())
  const [showWizard, setShowWizard] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingDrafts, setDeletingDrafts] = useState(new Set())
  const [editingDraft, setEditingDraft] = useState(null)
  const [editingStep, setEditingStep] = useState(0)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDraft, setPreviewDraft] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmData, setConfirmData] = useState(null)

  // Header checkbox ref to support indeterminate state
  const headerCheckboxRef = useRef(null)

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
        resetPagination()
      }, 300)
    },
    []
  )

  // Update header checkbox indeterminate state
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
    
    const delay = type === 'error' ? 5000 : 4000
    setTimeout(() => {
      setShowSuccessToast(false)
    }, delay)
  }

  // Event handlers
  const handleFilterChange = useCallback((key, value) => {
    if (key === 'search') {
      debouncedSearch(value)
    } else {
      setFilters(prev => ({ ...prev, [key]: value }))
      setPagination(prev => ({ ...prev, page: 1 }))
      resetPagination()
    }
  }, [debouncedSearch])

  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleDraftSelect = (draftId) => {
    const newSelected = new Set(selectedDrafts)
    if (newSelected.has(draftId)) {
      newSelected.delete(draftId)
    } else {
      newSelected.add(draftId)
    }
    setSelectedDrafts(newSelected)
  }

  // Function to expand bulk draft into individual drafts
  const handleExpandBulkDraft = async (bulkDraft) => {
    try {
      setShowPreviewModal(false)
      setPreviewDraft(null)
      
      const firstEntry = bulkDraft.bulk_entries && bulkDraft.bulk_entries.length > 0 
        ? bulkDraft.bulk_entries[0] 
        : {}
      
      const convertedDraft = {
        ...bulkDraft,
        title: firstEntry.position || bulkDraft.title || '',
        country: firstEntry.country || bulkDraft.country || '',
        salary: firstEntry.salary || bulkDraft.salary || '',
        currency: firstEntry.currency || bulkDraft.currency || 'AED',
        positions: bulkDraft.bulk_entries ? bulkDraft.bulk_entries.map(entry => ({
          position: entry.position || '',
          job_count: entry.job_count || 1,
          country: entry.country || bulkDraft.country || '',
          salary: entry.salary || bulkDraft.salary || '',
          currency: entry.currency || bulkDraft.currency || 'AED'
        })) : [],
        is_bulk_draft: false,
        bulk_entries: undefined,
        total_jobs: undefined,
        converted_from_bulk: true,
        updated_at: new Date().toISOString()
      }
      
      await jobService.updateJob(bulkDraft.id, convertedDraft)
      
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
      
      setEditingDraft(convertedDraft)
      setEditingStep(0)
      setShowWizard(true)
      
      showToast(tPage('toast.bulkExpanded'), 'success')
      
    } catch (error) {
      console.error('Error converting bulk draft:', error)
      showToast(tPage('toast.bulkExpandFailed'), 'error')
    }
  }

  // Handle wizard save
  const handleWizardSave = async (draftData) => {
    try {
      if (draftData.type === 'bulk') {
        const totalJobs = draftData.data.entries.reduce((sum, entry) => sum + parseInt(entry.job_count || 0), 0)
        const countries = draftData.data.entries.map(entry => entry.country).filter(Boolean)
        const positions = draftData.data.entries.map(entry => entry.position).filter(Boolean)
        
        const bulkDraft = {
          title: positions.length > 0 ? positions.join(', ') : tPage('bulkDraft.multiplePositions'),
          company: tPage('table.values.multipleCompanies', { count: 1 }),
          country: countries.length === 1 ? countries[0] : tPage('bulkDraft.multipleCountries'),
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
          is_bulk_draft: true,
          bulk_entries: draftData.data.entries,
          total_jobs: totalJobs
        }
        
        await jobService.createDraftJob(bulkDraft)
        showToast(tPage('messages.bulkDraftCreated', { count: totalJobs }), 'success')
      } else if (draftData.type === 'bulk_edit') {
        const totalJobs = draftData.data.entries.reduce((sum, entry) => sum + parseInt(entry.job_count || 0), 0)
        const countries = draftData.data.entries.map(entry => entry.country).filter(Boolean)
        const positions = draftData.data.entries.map(entry => entry.position).filter(Boolean)
        
        const updatedBulkDraft = {
          title: draftData.data.title || (positions.length > 0 ? positions.join(', ') : tPage('bulkDraft.multiplePositions')),
          company: draftData.data.company || tPage('table.values.multipleCompanies', { count: 1 }),
          country: countries.length === 1 ? countries[0] : tPage('bulkDraft.multipleCountries'),
          description: draftData.data.description || `Bulk job creation for ${totalJobs} positions across ${countries.length} ${countries.length === 1 ? 'country' : 'countries'}`,
          bulk_entries: draftData.data.entries,
          total_jobs: totalJobs,
          updated_at: new Date().toISOString()
        }
        
        await jobService.updateJob(draftData.data.id, updatedBulkDraft)
        showToast(tPage('messages.bulkDraftCreated', { count: totalJobs }), 'success')
      } else if (draftData.type === 'partial_draft') {
        if (editingDraft) {
          const updatedDraft = {
            ...draftData.data,
            id: editingDraft.id,
            is_partial: true,
            last_completed_step: draftData.data.last_completed_step,
            updated_at: new Date().toISOString()
          }
          await jobService.updateJob(editingDraft.id, updatedDraft)
          showToast(tPage('messages.progressSaved'), 'success')
        } else {
          const partialDraft = {
            ...draftData.data,
            is_partial: true,
            last_completed_step: draftData.data.last_completed_step,
            created_at: new Date().toISOString()
          }
          await jobService.createDraftJob(partialDraft)
          showToast(tPage('messages.progressSaved'), 'success')
        }
      } else if (editingDraft) {
        await jobService.updateJob(editingDraft.id, draftData)
        showToast(tPage('messages.draftUpdated'), 'success')
      } else {
        await jobService.createDraftJob(draftData)
        showToast(tPage('messages.draftCreated'), 'success')
      }
      
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      setShowWizard(false)
      setEditingDraft(null)
      setEditingStep(0)
      
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
    } catch (error) {
      console.error('Failed to save draft:', error)
      showToast(tPage('error.failedToSave'), 'error')
    }
  }

  // Fetch drafts data
  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const allDrafts = await jobService.getDraftJobs()
        
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

  // Function to calculate draft step progress
  const getDraftStepProgress = (draft) => {
    if (draft.is_bulk_draft) {
      return { currentStep: 1, totalSteps: 8, completedSteps: 1 }
    }
    
    const stepCompletionStatus = [
      !!(draft.city && draft.lt_number && draft.chalani_number && draft.country && 
         draft.announcement_type && 
         ((draft.approval_date_ad && draft.posting_date_ad) || (draft.approval_date_bs && draft.posting_date_bs))),
      
      !!(draft.period_years && draft.period_years >= 1 && 
         draft.renewable !== undefined && 
         draft.hours_per_day && draft.hours_per_day >= 1 && draft.hours_per_day <= 16 &&
         draft.days_per_week && draft.days_per_week >= 1 && draft.days_per_week <= 7 &&
         draft.overtime_policy && draft.food && draft.accommodation && draft.transport &&
         draft.annual_leave_days !== undefined && draft.annual_leave_days >= 0),
      
      !!(draft.positions && draft.positions.length > 0 && 
         draft.positions.every(pos => 
           pos.position_title && 
           ((pos.vacancies_male && pos.vacancies_male > 0) || (pos.vacancies_female && pos.vacancies_female > 0)) &&
           pos.monthly_salary && pos.monthly_salary > 0 && 
           pos.currency
         )),
      
      !!(draft.skills && draft.skills.length > 0) ||
      !!(draft.tags && draft.tags.length > 0) ||
      !!(draft.requirements && draft.requirements.length > 0),
      
      !!(draft.expenses && draft.expenses.length > 0),
      
      !!(draft.cutout && 
         (draft.cutout.has_file === true || 
          draft.cutout.is_uploaded === true || 
          (draft.cutout.file_name && draft.cutout.file_name.trim() !== '') ||
          (draft.cutout.file_url && draft.cutout.file_url.trim() !== ''))),
      
      !!(draft.review && draft.review.is_complete),
      
      !!(draft.submit && draft.submit.is_complete) || 
      !!(draft.is_complete || draft.ready_to_publish || draft.status === 'ready_to_publish')
    ]
    
    const completedSteps = stepCompletionStatus.filter(Boolean).length
    let currentStep = stepCompletionStatus.findIndex(step => !step) + 1
    if (currentStep === 0) currentStep = 8
    
    return {
      currentStep,
      totalSteps: 8,
      completedSteps,
      progressPercentage: Math.round((completedSteps / 8) * 100)
    }
  }

  // Function to check if a draft is complete
  const isDraftComplete = (draft) => {
    if (draft.is_bulk_draft) {
      return draft.title && draft.company && draft.bulk_entries && draft.bulk_entries.length > 0
    }
    
    if (draft.status === 'published' || draft.status === 'ready_to_publish') {
      return true
    }
    
    return draft.is_complete === true || 
           draft.ready_to_publish === true ||
           (draft.last_completed_step === 7 && draft.reviewed === true)
  }

  // Handle publish
  const handlePublish = async (draft) => {
    try {
      if (!isDraftComplete(draft)) {
        showToast(tPage('messages.completeDraftBeforePublish'), 'error')
        return
      }

      await jobService.publishJob(draft.id)
      showToast(tPage('messages.draftPublished'), 'success')
      
      setShowPreviewModal(false)
      setPreviewDraft(null)
      
      setTimeout(() => {
        navigate('/jobs')
      }, 1500)
      
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
      
    } catch (error) {
      console.error('Failed to publish draft:', error)
      showToast(tPage('error.failedToPublish'), 'error')
    }
  }

  // Handle delete
  const handleDelete = async (draftId) => {
    setConfirmAction('delete')
    setConfirmData({ id: draftId, title: drafts.find(d => d.id === draftId)?.title })
    setShowConfirmModal(true)
  }

  // Handle edit
  const handleEdit = (draft, targetStep = 0) => {
    if (draft.status === 'published') {
      showToast(tPage('messages.cannotEditPublished'), 'error')
      return
    }
    
    if (draft.is_bulk_draft) {
      setEditingDraft(draft)
      setEditingStep(0)
      setShowWizard(true)
      showToast(tPage('toast.editingBulk'), 'info')
      return
    }
    
    const progress = getDraftStepProgress(draft)
    const editStep = !isDraftComplete(draft) && draft.last_completed_step !== undefined 
      ? Math.min(progress.currentStep - 1, 7)
      : targetStep
    
    const hasUnsavedChanges = false
    
    if (hasUnsavedChanges) {
      setConfirmAction('edit')
      setConfirmData({ draft, hasChanges: true, targetStep: editStep })
      setShowConfirmModal(true)
    } else {
      setEditingDraft(draft)
      setEditingStep(editStep)
      setShowWizard(true)
      
      if (!isDraftComplete(draft)) {
        const progress = getDraftStepProgress(draft)
        showToast(tPage('toast.continuingDraft', { step: progress.currentStep }), 'info')
      }
    }
  }

  // Confirm action handler
  const confirmActionHandler = async () => {
    try {
      if (confirmAction === 'delete') {
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

  // Execute delete
  const executeDelete = async (draftId) => {
    try {
      setDeletingDrafts(prev => new Set([...prev, draftId]))
      await jobService.deleteJob(draftId)
      
      showToast(tPage('messages.draftDeleted'), 'success')
      
      const updatedDrafts = await jobService.getDraftJobs()
      setDrafts(updatedDrafts)
      
      setPagination(prev => ({
        ...prev,
        total: updatedDrafts.length
      }))
      
      setSelectedDrafts(prev => {
        const newSet = new Set(prev)
        newSet.delete(draftId)
        return newSet
      })
    } catch (error) {
      console.error('Failed to delete draft:', error)
      showToast(tPage('error.failedToDelete'), 'error')
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
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-80"></div>
            <div className="flex space-x-2">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="h-1 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-6 pt-12">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded mr-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-20"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-12"></div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
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
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">{tPage('error.failedToLoad')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {tPage('error.tryAgain')}
            </p>
            <InteractiveButton
              onClick={() => window.location.reload()}
              variant="primary"
              className="mx-auto"
            >
              {tPage('error.retry')}
            </InteractiveButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {tPage('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {tPage('subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <LanguageSwitch />
          <InteractiveButton
            onClick={() => setShowWizard(true)}
            variant="primary"
            icon={Plus}
          >
            {tPage('pageActions.createDraft')}
          </InteractiveButton>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={tPage('filters.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-blue-bright focus:border-transparent"
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-brand-blue-bright text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={tPage('viewModes.list')}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-brand-blue-bright text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={tPage('viewModes.grid')}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drafts Content */}
      {drafts.length === 0 ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {tPage('messages.noDraftsFound')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {tPage('messages.noDraftsMessage')}
            </p>
            <InteractiveButton
              onClick={() => setShowWizard(true)}
              variant="primary"
              icon={Plus}
              className="mx-auto"
            >
              {tPage('pageActions.createDraft')}
            </InteractiveButton>
          </div>
        </div>
      ) : (
        <>
          {/* Draft Cards/List */}
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {paginatedDrafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                viewMode={viewMode}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onPreview={(draft) => {
                  setPreviewDraft(draft)
                  setShowPreviewModal(true)
                }}
                onExpandBulk={handleExpandBulkDraft}
                isDeleting={deletingDrafts.has(draft.id)}
                getDraftStepProgress={getDraftStepProgress}
                isDraftComplete={isDraftComplete}
                tPage={tPage}
              />
            ))}
          </div>

          {/* Pagination */}
          {drafts.length > 0 && (
            <div className="mt-8 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <PaginationWrapper
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                itemsPerPageOptions={itemsPerPageOptions}
                onPageChange={goToPage}
                onItemsPerPageChange={changeItemsPerPage}
                showInfo={true}
                showItemsPerPageSelector={true}
              />
            </div>
          )}

          {/* Results Info */}
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {tPage('resultsInfo.showing', {
              start: (pagination.page - 1) * pagination.limit + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </div>
        </>
      )}

      {/* Modals and Overlays */}
      {showWizard && (
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
      )}

      {showConfirmModal && (
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmActionHandler}
          action={confirmAction}
          data={confirmData}
          tPage={tPage}
        />
      )}

      {showPreviewModal && previewDraft && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false)
            setPreviewDraft(null)
          }}
          draft={previewDraft}
          onEdit={handleEdit}
          onPublish={handlePublish}
          onExpandBulk={handleExpandBulkDraft}
          getDraftStepProgress={getDraftStepProgress}
          isDraftComplete={isDraftComplete}
          tPage={tPage}
        />
      )}

      {/* Toast Notification */}
      {showSuccessToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  )
}

// Draft Card Component
const DraftCard = ({ 
  draft, 
  viewMode, 
  onEdit, 
  onDelete, 
  onPublish, 
  onPreview, 
  onExpandBulk,
  isDeleting, 
  getDraftStepProgress, 
  isDraftComplete,
  tPage 
}) => {
  const progress = getDraftStepProgress(draft)
  const isComplete = isDraftComplete(draft)
  
  const getStatusColor = () => {
    if (draft.is_bulk_draft) return 'bg-purple-500'
    if (isComplete) return 'bg-green-500'
    return 'bg-yellow-500'
  }

  const getStatusText = () => {
    if (draft.is_bulk_draft) return tPage('draftStatus.bulk')
    if (isComplete) return tPage('draftStatus.complete')
    return tPage('draftStatus.partial')
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {draft.title || tPage('table.values.untitledDraft')}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {draft.company || tPage('table.values.noCompany')}
              </span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {draft.country || tPage('table.values.locationTBD')}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {draft.created_at ? format(new Date(draft.created_at), 'MMM dd, yyyy') : tPage('table.values.recently')}
              </span>
            </div>
            {!draft.is_bulk_draft && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {tPage('progress.stepsCompleted', { completed: progress.completedSteps, total: progress.totalSteps })}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {progress.progressPercentage}%
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-brand-blue-bright h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <InteractiveButton
              onClick={() => onPreview(draft)}
              variant="ghost"
              size="sm"
              icon={Eye}
            >
              {tPage('draftActions.preview')}
            </InteractiveButton>
            <InteractiveButton
              onClick={() => onEdit(draft)}
              variant="ghost"
              size="sm"
              icon={Edit}
            >
              {tPage('draftActions.edit')}
            </InteractiveButton>
            <InteractiveButton
              onClick={() => onDelete(draft.id)}
              variant="ghost"
              size="sm"
              icon={Trash2}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isDeleting ? tPage('table.values.deleting') : tPage('draftActions.delete')}
            </InteractiveButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <InteractiveCard className="overflow-hidden">
      <div className={`h-1 ${getStatusColor()}`} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
              {draft.title || tPage('table.values.untitledDraft')}
            </h3>
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {draft.company || tPage('table.values.noCompany')}
              </span>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium text-white rounded-full ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{draft.country || tPage('table.values.locationTBD')}</span>
          </div>
          {draft.salary && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>{draft.salary} {draft.currency || 'AED'}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              {draft.created_at ? format(new Date(draft.created_at), 'MMM dd, yyyy') : tPage('table.values.recently')}
            </span>
          </div>
        </div>

        {draft.is_bulk_draft ? (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                {tPage('bulkDraft.totalJobs', { count: draft.total_jobs || 0 })}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                {tPage('progress.step', { current: progress.currentStep, total: progress.totalSteps })}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {progress.progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-brand-blue-bright h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {draft.tags && draft.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {draft.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md"
              >
                {tag}
              </span>
            ))}
            {draft.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
                +{draft.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {draft.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {draft.description}
          </p>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex space-x-2">
            <InteractiveButton
              onClick={() => onPreview(draft)}
              variant="ghost"
              size="sm"
              icon={Eye}
            >
              {tPage('draftActions.preview')}
            </InteractiveButton>
            <InteractiveButton
              onClick={() => onEdit(draft)}
              variant="ghost"
              size="sm"
              icon={Edit}
            >
              {tPage('draftActions.edit')}
            </InteractiveButton>
          </div>
          <InteractiveButton
            onClick={() => onDelete(draft.id)}
            variant="ghost"
            size="sm"
            icon={Trash2}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {isDeleting ? '...' : tPage('draftActions.delete')}
          </InteractiveButton>
        </div>
      </div>
    </InteractiveCard>
  )
}

// Confirm Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, action, data, tPage }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {action === 'delete' ? tPage('confirmModal.deleteDraft') : tPage('confirmModal.editDraft')}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          {action === 'delete' 
            ? `${tPage('confirmModal.deleteMessage')} "${data?.title}"?`
            : tPage('confirmModal.editMessage')
          }
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {action === 'delete' 
            ? tPage('confirmModal.deleteWarning')
            : tPage('confirmModal.editWarning')
          }
        </p>
        <div className="flex justify-end space-x-3">
          <InteractiveButton
            onClick={onClose}
            variant="ghost"
          >
            {tPage('confirmModal.cancel')}
          </InteractiveButton>
          <InteractiveButton
            onClick={onConfirm}
            variant={action === 'delete' ? 'danger' : 'primary'}
          >
            {action === 'delete' 
              ? tPage('confirmModal.deleteDraftAction')
              : tPage('confirmModal.continueEditing')
            }
          </InteractiveButton>
        </div>
      </div>
    </div>
  )
}

// Enhanced Preview Modal Component with Proper Workflow
const PreviewModal = ({ isOpen, onClose, draft, onEdit, onPublish, onExpandBulk, getDraftStepProgress, isDraftComplete, tPage }) => {
  if (!isOpen) return null

  const progress = getDraftStepProgress(draft)
  const isComplete = isDraftComplete(draft)

  // Define sections following the proper workflow: Posting Details → Contract → Positions → Tags & Canonical Titles → Expenses → Cutout → Interview → Review and Publish
  const sections = [
    {
      id: 'posting_details',
      title: 'Posting Details',
      step: 0,
      icon: FileText,
      fields: [
        { label: 'Job Title', value: draft.title, required: true },
        { label: 'Company', value: draft.company, required: true },
        { label: 'City', value: draft.city, required: true },
        { label: 'Country', value: draft.country, required: true },
        { label: 'LT Number', value: draft.lt_number, required: true },
        { label: 'Chalani Number', value: draft.chalani_number, required: true },
        { label: 'Announcement Type', value: draft.announcement_type, required: true },
        { label: 'Approval Date (AD)', value: draft.approval_date_ad ? new Date(draft.approval_date_ad).toLocaleDateString() : null, required: true },
        { label: 'Posting Date (AD)', value: draft.posting_date_ad ? new Date(draft.posting_date_ad).toLocaleDateString() : null, required: true },
        { label: 'Approval Date (BS)', value: draft.approval_date_bs, required: false },
        { label: 'Posting Date (BS)', value: draft.posting_date_bs, required: false },
        { label: 'Job Description', value: draft.description, required: false, fullWidth: true }
      ]
    },
    {
      id: 'contract',
      title: 'Contract Terms',
      step: 1,
      icon: Clock,
      fields: [
        { label: 'Contract Period (Years)', value: draft.period_years ? `${draft.period_years} years` : null, required: true },
        { label: 'Renewable Contract', value: draft.renewable !== undefined ? (draft.renewable ? 'Yes' : 'No') : null, required: true },
        { label: 'Working Hours per Day', value: draft.hours_per_day ? `${draft.hours_per_day} hours` : null, required: true },
        { label: 'Working Days per Week', value: draft.days_per_week ? `${draft.days_per_week} days` : null, required: true },
        { label: 'Overtime Policy', value: draft.overtime_policy, required: true },
        { label: 'Food Provision', value: draft.food, required: true },
        { label: 'Accommodation', value: draft.accommodation, required: true },
        { label: 'Transportation', value: draft.transport, required: true },
        { label: 'Annual Leave Days', value: draft.annual_leave_days ? `${draft.annual_leave_days} days` : null, required: true },
        { label: 'Visa Status', value: draft.visa_status, required: false },
        { label: 'Contract Duration Details', value: draft.contract_duration, required: false }
      ]
    },
    {
      id: 'positions',
      title: 'Positions & Salary',
      step: 2,
      icon: User,
      fields: [
        { 
          label: 'Total Positions', 
          value: draft.positions?.length > 0 ? `${draft.positions.length} position(s) defined` : null, 
          required: true,
          fullWidth: true
        }
      ],
      customContent: draft.positions?.length > 0 && (
        <div className="mt-4">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Position Details:</h5>
          <div className="space-y-3">
            {draft.positions.map((pos, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Position:</span>
                    <p className="text-gray-900 dark:text-gray-100">{pos.position_title || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Male Vacancies:</span>
                    <p className="text-gray-900 dark:text-gray-100">{pos.vacancies_male || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Female Vacancies:</span>
                    <p className="text-gray-900 dark:text-gray-100">{pos.vacancies_female || 0}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Monthly Salary:</span>
                    <p className="text-gray-900 dark:text-gray-100">{pos.monthly_salary || 'N/A'} {pos.currency || 'AED'}</p>
                  </div>
                  {pos.job_description && (
                    <div className="md:col-span-2 lg:col-span-4">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Job Description:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">{pos.job_description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'tags_canonical',
      title: 'Tags & Canonical Titles',
      step: 3,
      icon: Tag,
      fields: [
        { 
          label: 'Skills Required', 
          value: draft.skills?.length > 0 ? draft.skills.join(', ') : null, 
          required: false,
          fullWidth: true
        },
        { 
          label: 'Job Tags', 
          value: draft.tags?.length > 0 ? draft.tags.join(', ') : null, 
          required: false,
          fullWidth: true
        },
        { 
          label: 'Requirements', 
          value: draft.requirements?.length > 0 ? draft.requirements.join(', ') : null, 
          required: false,
          fullWidth: true
        },
        { label: 'Employment Type', value: draft.employment_type, required: false },
        { label: 'Category', value: draft.category, required: false }
      ]
    },
    {
      id: 'expenses',
      title: 'Expenses',
      step: 4,
      icon: DollarSign,
      fields: [
        { 
          label: 'Total Expense Items', 
          value: draft.expenses?.length > 0 ? `${draft.expenses.length} expense item(s)` : null, 
          required: true,
          fullWidth: true
        }
      ],
      customContent: draft.expenses?.length > 0 && (
        <div className="mt-4">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Expense Breakdown:</h5>
          <div className="space-y-2">
            {draft.expenses.map((expense, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                    <p className="text-gray-900 dark:text-gray-100">{expense.description || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                    <p className="text-gray-900 dark:text-gray-100">{expense.amount || 'N/A'} {expense.currency || 'AED'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                    <p className="text-gray-900 dark:text-gray-100">{expense.type || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'cutout',
      title: 'Cutout/Advertisement',
      step: 5,
      icon: Image,
      fields: [
        { 
          label: 'Advertisement File', 
          value: draft.cutout?.file_name || (draft.cutout?.has_file ? 'File uploaded' : null), 
          required: true 
        },
        { 
          label: 'File URL', 
          value: draft.cutout?.file_url ? 'Available' : null, 
          required: false 
        },
        { 
          label: 'Upload Status', 
          value: draft.cutout?.is_uploaded ? 'Uploaded' : 'Pending', 
          required: false 
        }
      ],
      customContent: draft.cutout && (draft.cutout.file_url || draft.cutout.file_name) && (
        <div className="mt-4">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
            <Image className="w-4 h-4 mr-2" />
            Advertisement Preview
          </h5>
          {draft.cutout.file_url ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <img 
                src={draft.cutout.file_url} 
                alt="Draft Advertisement Cutout" 
                className="max-w-full h-auto max-h-96 mx-auto rounded border border-gray-300 dark:border-gray-600 shadow-sm"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div className="hidden text-center text-gray-500 dark:text-gray-400 py-8">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Image could not be loaded</p>
                <p className="text-sm">File: {draft.cutout.file_name || 'Unknown'}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {draft.cutout.file_name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                File uploaded - Preview not available
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'interview',
      title: 'Interview Process',
      step: 6,
      icon: Phone,
      fields: [
        { label: 'Contact Person', value: draft.contact_person, required: false },
        { label: 'Contact Phone', value: draft.contact_phone, required: false },
        { label: 'Contact Email', value: draft.contact_email, required: false },
        { label: 'Interview Location', value: draft.interview_location, required: false },
        { label: 'Interview Date', value: draft.interview_date ? new Date(draft.interview_date).toLocaleDateString() : null, required: false },
        { label: 'Interview Notes', value: draft.interview_notes, required: false, fullWidth: true }
      ]
    },
    {
      id: 'review_publish',
      title: 'Review and Publish',
      step: 7,
      icon: CheckSquare,
      fields: [
        { 
          label: 'Review Status', 
          value: draft.review?.is_complete ? 'Review Completed' : 'Pending Review', 
          required: true 
        },
        { 
          label: 'Ready to Publish', 
          value: draft.submit?.is_complete || draft.is_complete || draft.ready_to_publish ? 'Yes' : 'No', 
          required: true 
        },
        { label: 'Final Notes', value: draft.notes, required: false, fullWidth: true },
        { label: 'Status', value: draft.status || 'Draft', required: false }
      ]
    }
  ]

  // Calculate completion status for each section
  const getSectionStatus = (section) => {
    const requiredFields = section.fields.filter(field => field.required)
    const completedFields = requiredFields.filter(field => field.value)
    const isComplete = completedFields.length === requiredFields.length
    const hasAnyData = section.fields.some(field => field.value)
    
    return {
      isComplete,
      hasAnyData,
      completedFields: completedFields.length,
      totalRequired: requiredFields.length,
      percentage: requiredFields.length > 0 ? Math.round((completedFields.length / requiredFields.length) * 100) : 100
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {draft.title || 'Untitled Draft'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Draft Preview • {draft.company || 'No Company'} • {draft.country || 'Location TBD'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Overview */}
        {!draft.is_bulk_draft && (
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Progress: {progress.completedSteps}/{progress.totalSteps} steps completed
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progress.progressPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-brand-blue-bright h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {draft.is_bulk_draft ? (
            // Bulk Draft Preview
            <div className="p-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6 border border-purple-200 dark:border-purple-800">
                <h4 className="text-lg font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center">
                  <Volume2 className="w-5 h-5 mr-2" />
                  Bulk Draft - {draft.total_jobs || 0} Jobs
                </h4>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  This is a bulk draft containing multiple job positions. Use "Expand Bulk" to convert to individual drafts for detailed editing.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-900 dark:text-gray-100">
                      {draft.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {draft.bulk_entries && draft.bulk_entries.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Bulk Entries ({draft.bulk_entries.length} positions)
                    </label>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {draft.bulk_entries.map((entry, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Position:</span>
                              <p className="text-gray-900 dark:text-gray-100">{entry.position || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Job Count:</span>
                              <p className="text-gray-900 dark:text-gray-100">{entry.job_count || 1}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Country:</span>
                              <p className="text-gray-900 dark:text-gray-100">{entry.country || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Salary:</span>
                              <p className="text-gray-900 dark:text-gray-100">{entry.salary || 'N/A'} {entry.currency || 'AED'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Regular Draft Preview with Proper Workflow Sections
            <div className="p-6">
              <div className="space-y-6">
                {sections.map((section) => {
                  const status = getSectionStatus(section)
                  const IconComponent = section.icon
                  
                  return (
                    <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                      {/* Section Header */}
                      <div className={`p-4 flex items-center justify-between ${
                        status.isComplete 
                          ? 'bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800' 
                          : status.hasAnyData 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            status.isComplete 
                              ? 'bg-green-500 text-white' 
                              : status.hasAnyData 
                                ? 'bg-yellow-500 text-white'
                                : 'bg-red-500 text-white'
                          }`}>
                            {status.isComplete ? <Check className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                              {section.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Step {section.step + 1} • {status.completedFields}/{status.totalRequired} required fields completed ({status.percentage}%)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!status.isComplete && (
                            <span className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-medium">
                              Incomplete
                            </span>
                          )}
                          <InteractiveButton
                            onClick={() => {
                              onClose()
                              onEdit(draft, section.step)
                            }}
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                          >
                            Edit Section
                          </InteractiveButton>
                        </div>
                      </div>

                      {/* Section Content */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {section.fields.map((field, index) => (
                            <div key={index} className={`${field.fullWidth ? 'md:col-span-2' : ''}`}>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {field.value ? (
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <p className="text-gray-900 dark:text-gray-100">
                                    {field.value}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                  <p className="text-red-600 dark:text-red-400 italic text-sm">
                                    {field.required ? '⚠️ Required field - Not filled' : 'Optional - Not filled'}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Custom Content */}
                        {section.customContent && section.customContent}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {draft.is_bulk_draft ? (
                `Bulk draft with ${draft.total_jobs || 0} jobs`
              ) : (
                `${progress.completedSteps}/${progress.totalSteps} sections completed • ${progress.progressPercentage}% complete`
              )}
            </div>
            <div className="flex space-x-3">
              {draft.is_bulk_draft && (
                <InteractiveButton
                  onClick={() => {
                    onClose()
                    onExpandBulk(draft)
                  }}
                  variant="secondary"
                  icon={Volume2}
                >
                  Expand Bulk Draft
                </InteractiveButton>
              )}
              <InteractiveButton
                onClick={() => {
                  onClose()
                  onEdit(draft)
                }}
                variant="secondary"
                icon={Edit}
              >
                Edit Draft
              </InteractiveButton>
              {isComplete && (
                <InteractiveButton
                  onClick={() => onPublish(draft)}
                  variant="primary"
                  icon={CheckSquare}
                >
                  Publish Job
                </InteractiveButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'error' ? 'bg-red-500' : type === 'info' ? 'bg-blue-500' : 'bg-green-500'

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3`}>
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Drafts
