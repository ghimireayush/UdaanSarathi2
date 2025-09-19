import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../../pages/Dashboard'
import { AuthProvider } from '../../contexts/AuthContext'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock services
jest.mock('../../services/analyticsService', () => ({
  __esModule: true,
  default: {
    getDashboardMetrics: jest.fn().mockResolvedValue({
      totalJobs: 25,
      activeJobs: 18,
      totalApplications: 150,
      pendingApplications: 45,
      scheduledInterviews: 12,
      completedInterviews: 8
    }),
    getRecentActivity: jest.fn().mockResolvedValue([
      {
        id: 1,
        type: 'application',
        message: 'New application received for Software Engineer',
        timestamp: '2023-01-01T10:00:00Z'
      }
    ])
  }
}))

jest.mock('../../services/jobService', () => ({
  __esModule: true,
  default: {
    getJobs: jest.fn().mockResolvedValue({
      jobs: [
        {
          id: 'job_1',
          title: 'Software Engineer',
          status: 'active',
          applications_count: 25
        }
      ]
    })
  }
}))

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard title', () => {
    renderDashboard()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('displays metrics cards', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('Total Jobs')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('Active Jobs')).toBeInTheDocument()
      expect(screen.getByText('18')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    renderDashboard()
    // Should show loading indicators before data loads
    expect(screen.getByTestId('dashboard-loading') || screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays recent activity section', async () => {
    renderDashboard()
    
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })
  })
})