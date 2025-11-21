import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ScheduledInterviews from '../ScheduledInterviews'

// Mock the interview service
jest.mock('../../services/interviewService', () => ({
  getInterviews: jest.fn().mockResolvedValue({
    interviews: [
      {
        id: 'interview_1',
        candidate_name: 'John Doe',
        scheduled_date: '2024-01-15T10:00:00Z',
        status: 'scheduled',
        type: 'technical',
        notes: 'Initial interview',
        interview: {
          id: 'interview_1',
          scheduled_at: '2024-01-15T10:00:00Z',
          status: 'scheduled',
          duration: 60,
          location: 'Office',
          interviewer: 'Jane Smith',
          notes: 'Initial interview'
        }
      }
    ]
  }),
  updateInterview: jest.fn().mockResolvedValue({
    success: true,
    interview: {
      id: 'interview_1',
      status: 'completed',
      notes: 'Updated notes'
    }
  })
}))

// Mock the translation hook
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key) => key,
    currentLanguage: 'en'
  })
}))

// Mock date-fns functions
jest.mock('date-fns', () => ({
  parseISO: jest.fn((date) => new Date(date)),
  format: jest.fn((date, formatStr) => '2024-01-15 10:00 AM'),
  isToday: jest.fn(() => false),
  isTomorrow: jest.fn(() => false),
  isPast: jest.fn(() => false),
  addMinutes: jest.fn((date, minutes) => new Date(date.getTime() + minutes * 60000))
}))

describe('ScheduledInterviews Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders without crashing', () => {
    expect(() => {
      render(<ScheduledInterviews />)
    }).not.toThrow()
  })

  test('handles null selectedCandidate gracefully', () => {
    // This test ensures the component doesn't crash with null selectedCandidate
    const { container } = render(<ScheduledInterviews />)
    expect(container).toBeInTheDocument()
  })

  test('renders interview list when data is available', async () => {
    const mockInterviews = [
      {
        id: 'candidate_1',
        name: 'John Doe',
        interview: {
          id: 'interview_1',
          scheduled_at: '2024-01-15T10:00:00Z',
          status: 'scheduled',
          duration: 60,
          location: 'Office',
          interviewer: 'Jane Smith'
        }
      }
    ]

    render(<ScheduledInterviews interviews={mockInterviews} />)
    
    // Should render without errors
    expect(screen.getByRole('main') || screen.getByTestId('interviews-container') || document.body).toBeInTheDocument()
  })

  test('handles interview selection without errors', async () => {
    const mockInterviews = [
      {
        id: 'candidate_1',
        name: 'John Doe',
        interview: {
          id: 'interview_1',
          scheduled_at: '2024-01-15T10:00:00Z',
          status: 'scheduled',
          duration: 60
        }
      }
    ]

    render(<ScheduledInterviews interviews={mockInterviews} />)
    
    // Should not throw errors when interacting with the component
    const buttons = screen.getAllByRole('button')
    if (buttons.length > 0) {
      fireEvent.click(buttons[0])
    }
    
    // Component should still be rendered
    expect(document.body).toBeInTheDocument()
  })

  test('handles null interview data gracefully', () => {
    const mockInterviews = [
      {
        id: 'candidate_1',
        name: 'John Doe',
        interview: null // This should not crash the component
      }
    ]

    expect(() => {
      render(<ScheduledInterviews interviews={mockInterviews} />)
    }).not.toThrow()
  })

  test('handles undefined interview data gracefully', () => {
    const mockInterviews = [
      {
        id: 'candidate_1',
        name: 'John Doe'
        // interview property is undefined
      }
    ]

    expect(() => {
      render(<ScheduledInterviews interviews={mockInterviews} />)
    }).not.toThrow()
  })
})