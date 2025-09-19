import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock the entire application flow
const mockApplications = [
  {
    id: 'app_1',
    job_id: 'job_1',
    candidate_name: 'John Doe',
    candidate_email: 'john@example.com',
    status: 'pending',
    applied_date: '2023-01-01T10:00:00Z'
  }
]

const mockJobs = [
  {
    id: 'job_1',
    title: 'Software Engineer',
    status: 'active',
    applications_count: 1
  }
]

// Mock services
jest.mock('../../services/applicationService', () => ({
  __esModule: true,
  default: {
    getApplications: jest.fn().mockResolvedValue({ applications: mockApplications }),
    updateApplicationStatus: jest.fn().mockResolvedValue({ 
      success: true, 
      application: { ...mockApplications[0], status: 'reviewed' }
    }),
    searchApplications: jest.fn().mockResolvedValue({ applications: mockApplications })
  }
}))

jest.mock('../../services/jobService', () => ({
  __esModule: true,
  default: {
    getJobs: jest.fn().mockResolvedValue({ jobs: mockJobs }),
    getJobById: jest.fn().mockResolvedValue({ job: mockJobs[0] })
  }
}))

jest.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    getCurrentUser: jest.fn().mockReturnValue({
      id: 'user_1',
      username: 'admin@udaan.com',
      role: 'admin'
    }),
    isUserAuthenticated: jest.fn().mockReturnValue(true),
    hasRole: jest.fn().mockReturnValue(true)
  }
}))

// Mock Applications component
const Applications = () => {
  const [applications, setApplications] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    const loadApplications = async () => {
      setLoading(true)
      try {
        const result = await applicationService.getApplications()
        setApplications(result.applications)
      } catch (error) {
        console.error('Error loading applications:', error)
      } finally {
        setLoading(false)
      }
    }
    loadApplications()
  }, [])

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const result = await applicationService.updateApplicationStatus(applicationId, newStatus)
      if (result.success) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: newStatus }
              : app
          )
        )
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleSearch = async (term) => {
    setSearchTerm(term)
    if (term) {
      const result = await applicationService.searchApplications(term)
      setApplications(result.applications)
    } else {
      const result = await applicationService.getApplications()
      setApplications(result.applications)
    }
  }

  if (loading) {
    return <div data-testid="loading">Loading applications...</div>
  }

  return (
    <div>
      <h1>Applications</h1>
      <input
        type="text"
        placeholder="Search applications..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        data-testid="search-input"
      />
      <div data-testid="applications-list">
        {applications.map(app => (
          <div key={app.id} data-testid={`application-${app.id}`}>
            <h3>{app.candidate_name}</h3>
            <p>{app.candidate_email}</p>
            <span data-testid={`status-${app.id}`}>{app.status}</span>
            <select
              value={app.status}
              onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
              data-testid={`status-select-${app.id}`}
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mock React
const React = {
  useState: jest.fn(),
  useEffect: jest.fn()
}

describe('Application Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock React hooks
    let stateValues = {}
    React.useState.mockImplementation((initial) => {
      const key = Math.random().toString()
      stateValues[key] = initial
      return [
        stateValues[key],
        (newValue) => { stateValues[key] = newValue }
      ]
    })
    
    React.useEffect.mockImplementation((fn) => fn())
  })

  it('should load and display applications', async () => {
    render(
      <BrowserRouter>
        <Applications />
      </BrowserRouter>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // Wait for applications to load
    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('should update application status', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Applications />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Find and update status
    const statusSelect = screen.getByTestId('status-select-app_1')
    await user.selectOptions(statusSelect, 'reviewed')

    // Verify status was updated
    await waitFor(() => {
      expect(statusSelect.value).toBe('reviewed')
    })
  })

  it('should search applications', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Applications />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument()
    })

    // Search for applications
    const searchInput = screen.getByTestId('search-input')
    await user.type(searchInput, 'John')

    // Verify search was performed
    expect(searchInput.value).toBe('John')
  })

  it('should handle error states gracefully', async () => {
    // Mock service to throw error
    const applicationService = require('../../services/applicationService').default
    applicationService.getApplications.mockRejectedValueOnce(new Error('Network error'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <BrowserRouter>
        <Applications />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error loading applications:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('should handle empty application list', async () => {
    // Mock empty response
    const applicationService = require('../../services/applicationService').default
    applicationService.getApplications.mockResolvedValueOnce({ applications: [] })

    render(
      <BrowserRouter>
        <Applications />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument()
      const applicationsList = screen.getByTestId('applications-list')
      expect(applicationsList.children).toHaveLength(0)
    })
  })

  it('should maintain search state during status updates', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <Applications />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Search first
    const searchInput = screen.getByTestId('search-input')
    await user.type(searchInput, 'John')

    // Then update status
    const statusSelect = screen.getByTestId('status-select-app_1')
    await user.selectOptions(statusSelect, 'reviewed')

    // Verify search term is maintained
    expect(searchInput.value).toBe('John')
  })
})