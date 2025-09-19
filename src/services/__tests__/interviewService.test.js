import interviewService from '../interviewService'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock data
const mockInterviews = [
  {
    id: 'interview_1',
    job_id: 'job_1',
    application_id: 'app_1',
    candidate_name: 'John Doe',
    interviewer_name: 'Jane Smith',
    scheduled_date: '2023-12-01T10:00:00Z',
    status: 'scheduled',
    type: 'technical',
    duration: 60,
    location: 'Conference Room A'
  },
  {
    id: 'interview_2',
    job_id: 'job_1',
    application_id: 'app_2',
    candidate_name: 'Alice Johnson',
    interviewer_name: 'Bob Wilson',
    scheduled_date: '2023-12-02T14:00:00Z',
    status: 'completed',
    type: 'behavioral',
    duration: 45,
    location: 'Video Call'
  }
]

describe('InterviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getInterviews', () => {
    it('should return all interviews', async () => {
      const result = await interviewService.getInterviews()
      
      expect(result).toBeDefined()
      expect(result.interviews).toBeDefined()
      expect(Array.isArray(result.interviews)).toBe(true)
    })

    it('should filter interviews by status', async () => {
      const result = await interviewService.getInterviews({ status: 'scheduled' })
      
      expect(result).toBeDefined()
      expect(result.interviews).toBeDefined()
      
      result.interviews.forEach(interview => {
        expect(interview.status).toBe('scheduled')
      })
    })

    it('should filter interviews by date range', async () => {
      const startDate = '2023-12-01'
      const endDate = '2023-12-31'
      
      const result = await interviewService.getInterviews({ 
        start_date: startDate, 
        end_date: endDate 
      })
      
      expect(result).toBeDefined()
      expect(result.interviews).toBeDefined()
    })
  })

  describe('scheduleInterview', () => {
    it('should schedule a new interview', async () => {
      const interviewData = {
        job_id: 'job_1',
        application_id: 'app_3',
        interviewer_id: 'user_1',
        scheduled_date: '2023-12-03T10:00:00Z',
        type: 'technical',
        duration: 60
      }

      const result = await interviewService.scheduleInterview(interviewData)
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.interview).toBeDefined()
      expect(result.interview.id).toBeDefined()
    })

    it('should validate required fields', async () => {
      const incompleteData = {
        job_id: 'job_1'
        // missing required fields
      }

      await expect(interviewService.scheduleInterview(incompleteData))
        .rejects
        .toThrow('Missing required fields')
    })

    it('should prevent double booking', async () => {
      const conflictingData = {
        job_id: 'job_1',
        application_id: 'app_1',
        interviewer_id: 'user_1',
        scheduled_date: '2023-12-01T10:00:00Z', // Same time as existing
        type: 'technical',
        duration: 60
      }

      await expect(interviewService.scheduleInterview(conflictingData))
        .rejects
        .toThrow('Time slot conflict')
    })
  })

  describe('updateInterview', () => {
    it('should update interview details', async () => {
      const updateData = {
        scheduled_date: '2023-12-01T11:00:00Z',
        location: 'Conference Room B'
      }

      const result = await interviewService.updateInterview('interview_1', updateData)
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.interview.scheduled_date).toBe(updateData.scheduled_date)
      expect(result.interview.location).toBe(updateData.location)
    })

    it('should handle non-existent interview', async () => {
      await expect(interviewService.updateInterview('non_existent', {}))
        .rejects
        .toThrow('Interview not found')
    })
  })

  describe('cancelInterview', () => {
    it('should cancel an interview', async () => {
      const result = await interviewService.cancelInterview('interview_1', 'Candidate unavailable')
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.interview.status).toBe('cancelled')
    })

    it('should require cancellation reason', async () => {
      await expect(interviewService.cancelInterview('interview_1'))
        .rejects
        .toThrow('Cancellation reason required')
    })
  })

  describe('getInterviewerAvailability', () => {
    it('should return interviewer availability', async () => {
      const result = await interviewService.getInterviewerAvailability('user_1', '2023-12-01')
      
      expect(result).toBeDefined()
      expect(result.available_slots).toBeDefined()
      expect(Array.isArray(result.available_slots)).toBe(true)
    })

    it('should handle invalid date format', async () => {
      await expect(interviewService.getInterviewerAvailability('user_1', 'invalid-date'))
        .rejects
        .toThrow('Invalid date format')
    })
  })

  describe('getInterviewStats', () => {
    it('should return interview statistics', async () => {
      const result = await interviewService.getInterviewStats()
      
      expect(result).toBeDefined()
      expect(result.total).toBeDefined()
      expect(result.by_status).toBeDefined()
      expect(result.by_type).toBeDefined()
      expect(typeof result.total).toBe('number')
    })

    it('should return stats for specific date range', async () => {
      const result = await interviewService.getInterviewStats({
        start_date: '2023-12-01',
        end_date: '2023-12-31'
      })
      
      expect(result).toBeDefined()
      expect(result.total).toBeDefined()
    })
  })

  describe('sendInterviewReminder', () => {
    it('should send reminder successfully', async () => {
      const result = await interviewService.sendInterviewReminder('interview_1')
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.message).toContain('Reminder sent')
    })

    it('should handle already sent reminders', async () => {
      // First reminder
      await interviewService.sendInterviewReminder('interview_1')
      
      // Second reminder (should handle gracefully)
      const result = await interviewService.sendInterviewReminder('interview_1')
      expect(result.success).toBe(true)
    })
  })
})