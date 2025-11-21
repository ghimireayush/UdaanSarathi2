import React from 'react'
import { render, screen } from '@testing-library/react'
import AISchedulingAssistant from '../AISchedulingAssistant'

// Mock date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => '2024-01-15 10:00 AM'),
  parseISO: jest.fn((date) => new Date(date)),
  isToday: jest.fn(() => false),
  isTomorrow: jest.fn(() => false),
  isPast: jest.fn(() => false),
  addMinutes: jest.fn((date, minutes) => new Date(date.getTime() + minutes * 60000)),
  startOfDay: jest.fn((date) => new Date(date)),
  endOfDay: jest.fn((date) => new Date(date)),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000))
}))

// Mock nepali date utility
jest.mock('../../utils/nepaliDate', () => ({
  formatInNepalTz: jest.fn((date) => '2081-01-15')
}))

describe('AISchedulingAssistant Component', () => {
  const mockProps = {
    existingMeetings: [],
    participants: [
      { id: '1', name: 'John Doe', email: 'john@example.com', availability: [] }
    ],
    onScheduleSelect: jest.fn(),
    constraints: {
      duration: 60,
      priority: 'high',
      meetingType: 'interview',
      dateRange: {
        start: new Date('2024-01-15'),
        end: new Date('2024-01-22')
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders without crashing with valid constraints', () => {
    expect(() => {
      render(<AISchedulingAssistant {...mockProps} />)
    }).not.toThrow()
  })

  test('handles invalid date constraints gracefully', () => {
    const invalidProps = {
      ...mockProps,
      constraints: {
        ...mockProps.constraints,
        dateRange: {
          start: 'invalid-date',
          end: null
        }
      }
    }

    expect(() => {
      render(<AISchedulingAssistant {...invalidProps} />)
    }).not.toThrow()
  })

  test('handles missing constraints gracefully', () => {
    const propsWithoutConstraints = {
      ...mockProps,
      constraints: undefined
    }

    expect(() => {
      render(<AISchedulingAssistant {...propsWithoutConstraints} />)
    }).not.toThrow()
  })

  test('handles null dateRange gracefully', () => {
    const propsWithNullDateRange = {
      ...mockProps,
      constraints: {
        ...mockProps.constraints,
        dateRange: null
      }
    }

    expect(() => {
      render(<AISchedulingAssistant {...propsWithNullDateRange} />)
    }).not.toThrow()
  })

  test('renders scheduling preferences section', () => {
    render(<AISchedulingAssistant {...mockProps} />)
    
    expect(screen.getByText('Scheduling Preferences')).toBeInTheDocument()
  })

  test('renders meeting duration options', () => {
    render(<AISchedulingAssistant {...mockProps} />)
    
    expect(screen.getByText('Meeting Duration')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1 hour')).toBeInTheDocument()
  })

  test('renders priority options', () => {
    render(<AISchedulingAssistant {...mockProps} />)
    
    expect(screen.getByText('Priority')).toBeInTheDocument()
  })

  test('renders meeting type options', () => {
    render(<AISchedulingAssistant {...mockProps} />)
    
    expect(screen.getByText('Meeting Type')).toBeInTheDocument()
  })

  test('renders date range inputs', () => {
    render(<AISchedulingAssistant {...mockProps} />)
    
    expect(screen.getByText('Date Range')).toBeInTheDocument()
    const dateInputs = screen.getAllByDisplayValue('2024-01-15')
    expect(dateInputs.length).toBeGreaterThan(0)
  })

  test('handles empty participants array', () => {
    const propsWithNoParticipants = {
      ...mockProps,
      participants: []
    }

    expect(() => {
      render(<AISchedulingAssistant {...propsWithNoParticipants} />)
    }).not.toThrow()
  })
})