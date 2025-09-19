import applicationService from '../applicationService'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock data
const mockApplications = [
  {
    id: 'app_1',
    job_id: 'job_1',
    candidate_name: 'John Doe',
    candidate_email: 'john@example.com',
    status: 'pending',
    applied_date: '2023-01-01T10:00:00Z',
    resume_url: 'https://example.com/resume1.pdf'
  },
  {
    id: 'app_2',
    job_id: 'job_1',
    candidate_name: 'Jane Smith',
    candidate_email: 'jane@example.com',
    status: 'reviewed',
    applied_date: '2023-01-02T10:00:00Z',
    resume_url: 'https://example.com/resume2.pdf'
  }
]

describe('ApplicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getApplications', () => {
    it('should return all applications', async () => {
      const result = await applicationService.getApplications()
      
      expect(result).toBeDefined()
      expect(result.applications).toBeDefined()
      expect(Array.isArray(result.applications)).toBe(true)
    })

    it('should filter applications by job_id', async () => {
      const result = await applicationService.getApplications({ job_id: 'job_1' })
      
      expect(result).toBeDefined()
      expect(result.applications).toBeDefined()
      
      // All returned applications should have the specified job_id
      result.applications.forEach(app => {
        expect(app.job_id).toBe('job_1')
      })
    })

    it('should filter applications by status', async () => {
      const result = await applicationService.getApplications({ status: 'pending' })
      
      expect(result).toBeDefined()
      expect(result.applications).toBeDefined()
      
      // All returned applications should have the specified status
      result.applications.forEach(app => {
        expect(app.status).toBe('pending')
      })
    })
  })

  describe('getApplicationById', () => {
    it('should return specific application', async () => {
      const result = await applicationService.getApplicationById('app_1')
      
      expect(result).toBeDefined()
      expect(result.application).toBeDefined()
      expect(result.application.id).toBe('app_1')
    })

    it('should handle non-existent application', async () => {
      await expect(applicationService.getApplicationById('non_existent'))
        .rejects
        .toThrow()
    })
  })

  describe('updateApplicationStatus', () => {
    it('should update application status successfully', async () => {
      const result = await applicationService.updateApplicationStatus('app_1', 'reviewed')
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.application.status).toBe('reviewed')
    })

    it('should validate status values', async () => {
      await expect(applicationService.updateApplicationStatus('app_1', 'invalid_status'))
        .rejects
        .toThrow('Invalid status')
    })
  })

  describe('bulkUpdateApplications', () => {
    it('should update multiple applications', async () => {
      const applicationIds = ['app_1', 'app_2']
      const newStatus = 'reviewed'
      
      const result = await applicationService.bulkUpdateApplications(applicationIds, newStatus)
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.updated_count).toBe(2)
    })

    it('should handle empty application list', async () => {
      const result = await applicationService.bulkUpdateApplications([], 'reviewed')
      
      expect(result.success).toBe(true)
      expect(result.updated_count).toBe(0)
    })
  })

  describe('searchApplications', () => {
    it('should search applications by candidate name', async () => {
      const result = await applicationService.searchApplications('John')
      
      expect(result).toBeDefined()
      expect(result.applications).toBeDefined()
      expect(Array.isArray(result.applications)).toBe(true)
    })

    it('should search applications by email', async () => {
      const result = await applicationService.searchApplications('john@example.com')
      
      expect(result).toBeDefined()
      expect(result.applications).toBeDefined()
    })

    it('should return empty results for no matches', async () => {
      const result = await applicationService.searchApplications('nonexistent')
      
      expect(result).toBeDefined()
      expect(result.applications).toBeDefined()
      expect(result.applications.length).toBe(0)
    })
  })

  describe('getApplicationStats', () => {
    it('should return application statistics', async () => {
      const result = await applicationService.getApplicationStats()
      
      expect(result).toBeDefined()
      expect(result.total).toBeDefined()
      expect(result.by_status).toBeDefined()
      expect(typeof result.total).toBe('number')
      expect(typeof result.by_status).toBe('object')
    })

    it('should return stats for specific job', async () => {
      const result = await applicationService.getApplicationStats('job_1')
      
      expect(result).toBeDefined()
      expect(result.total).toBeDefined()
      expect(result.by_status).toBeDefined()
    })
  })
})