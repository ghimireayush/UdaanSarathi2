/**
 * Integration tests for Member Service API
 * These tests verify the integration with the auth API specification
 */

import { inviteMember } from './memberService';

// Mock fetch for integration testing
global.fetch = jest.fn();

describe('Member Service API Integration', () => {
  const API_BASE_URL = 'https://dev.kaha.com.np';
  const MEMBERS_INVITE_ENDPOINT = '/job-portal/agencies/owner/members/invite';

  beforeEach(() => {
    fetch.mockClear();
    console.warn = jest.fn();
  });

  describe('API Specification Compliance', () => {
    it('should match the exact API specification from auth docs', async () => {
      const mockApiResponse = {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        phone: '9876543210',
        role: 'staff',
        dev_password: 'temp_abc123'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const memberData = {
        full_name: 'John Doe',
        phone: '9876543210',
        role: 'staff'
      };

      const result = await inviteMember(memberData);

      // Verify API call matches specification
      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}${MEMBERS_INVITE_ENDPOINT}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            full_name: 'John Doe',
            phone: '9876543210',
            role: 'staff'
          })
        }
      );

      // Verify response handling matches specification
      expect(result.data).toMatchObject({
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        phone: '9876543210',
        role: 'staff',
        dev_password: 'temp_abc123'
      });
    });

    it('should handle all API-specified roles', async () => {
      const roles = ['staff', 'admin', 'manager'];
      
      for (const role of roles) {
        const mockResponse = {
          id: `uuid-${role}`,
          phone: '9876543210',
          role: role,
          dev_password: `temp_${role}`
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

        const memberData = {
          full_name: `Test ${role}`,
          phone: `987654321${roles.indexOf(role)}`,
          role: role
        };

        const result = await inviteMember(memberData);

        expect(result.success).toBe(true);
        expect(result.data.role).toBe(role);
        expect(result.data.dev_password).toBe(`temp_${role}`);
      }
    });

    it('should reject invalid roles not in API specification', async () => {
      const invalidRoles = ['user', 'guest', 'coordinator', 'recipient'];
      
      for (const invalidRole of invalidRoles) {
        const memberData = {
          full_name: 'Test User',
          phone: '9876543210',
          role: invalidRole
        };

        await expect(inviteMember(memberData)).rejects.toThrow(
          'Invalid role. Must be one of: staff, admin, manager'
        );
      }
    });
  });

  describe('Request Format Validation', () => {
    it('should send request with exact field names from API spec', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          phone: '9876543210',
          role: 'staff',
          dev_password: 'temp123'
        })
      });

      await inviteMember({
        full_name: 'API Test User',
        phone: '9876543210',
        role: 'staff'
      });

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      
      // Verify exact field names match API specification
      expect(requestBody).toEqual({
        full_name: 'API Test User',
        phone: '9876543210',
        role: 'staff'
      });

      // Ensure no extra fields are sent
      expect(Object.keys(requestBody)).toEqual(['full_name', 'phone', 'role']);
    });

    it('should validate required fields according to API spec', async () => {
      const testCases = [
        { full_name: 'Test' }, // Missing phone and role
        { phone: '9876543210' }, // Missing full_name and role
        { role: 'staff' }, // Missing full_name and phone
        { full_name: 'Test', phone: '9876543210' }, // Missing role
        { full_name: 'Test', role: 'staff' }, // Missing phone
        { phone: '9876543210', role: 'staff' } // Missing full_name
      ];

      for (const testCase of testCases) {
        await expect(inviteMember(testCase)).rejects.toThrow(
          'Invalid member data - full_name, phone, and role are required'
        );
      }
    });
  });

  describe('Response Format Handling', () => {
    it('should handle successful API response format', async () => {
      const apiResponse = {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        phone: '9876543210',
        role: 'admin',
        dev_password: 'secure_temp_password'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse
      });

      const result = await inviteMember({
        full_name: 'Response Test User',
        phone: '9876543210',
        role: 'admin'
      });

      // Verify response transformation
      expect(result.data).toMatchObject({
        // API format fields
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        phone: '9876543210',
        role: 'admin',
        dev_password: 'secure_temp_password',
        
        // Internal format fields for compatibility
        name: 'Response Test User',
        full_name: 'Response Test User',
        mobileNumber: '9876543210',
        status: 'pending'
      });
    });

    it('should handle API error responses correctly', async () => {
      const errorResponse = {
        message: 'Phone number already exists',
        code: 'DUPLICATE_PHONE'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse
      });

      // Should fallback to mock implementation
      const result = await inviteMember({
        full_name: 'Error Test User',
        phone: '9876543210',
        role: 'staff'
      });

      expect(console.warn).toHaveBeenCalledWith(
        'API call failed, using mock implementation:',
        'Phone number already exists'
      );
      
      // Should still return success with mock data
      expect(result.success).toBe(true);
      expect(result.message).toContain('(Mock)');
    });

    it('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await inviteMember({
        full_name: 'Network Test User',
        phone: '9876543210',
        role: 'manager'
      });

      expect(console.warn).toHaveBeenCalledWith(
        'API call failed, using mock implementation:',
        'Network error'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('(Mock)');
    });
  });

  describe('HTTP Status Code Handling', () => {
    const statusTestCases = [
      { status: 400, description: 'Bad Request' },
      { status: 401, description: 'Unauthorized' },
      { status: 403, description: 'Forbidden' },
      { status: 404, description: 'Not Found' },
      { status: 409, description: 'Conflict' },
      { status: 422, description: 'Unprocessable Entity' },
      { status: 500, description: 'Internal Server Error' },
      { status: 502, description: 'Bad Gateway' },
      { status: 503, description: 'Service Unavailable' }
    ];

    statusTestCases.forEach(({ status, description }) => {
      it(`should handle ${status} ${description} responses`, async () => {
        fetch.mockResolvedValueOnce({
          ok: false,
          status: status,
          json: async () => ({ message: `${description} error` })
        });

        const result = await inviteMember({
          full_name: `Test User ${status}`,
          phone: '9876543210',
          role: 'staff'
        });

        // Should fallback to mock implementation
        expect(result.success).toBe(true);
        expect(result.message).toContain('(Mock)');
        expect(console.warn).toHaveBeenCalledWith(
          'API call failed, using mock implementation:',
          `${description} error`
        );
      });
    });
  });

  describe('Content Type and Headers', () => {
    it('should send correct Content-Type header', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          phone: '9876543210',
          role: 'staff',
          dev_password: 'temp123'
        })
      });

      await inviteMember({
        full_name: 'Header Test User',
        phone: '9876543210',
        role: 'staff'
      });

      const [url, options] = fetch.mock.calls[0];
      
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.headers['Accept']).toBe('application/json');
    });

    it('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Unexpected token in JSON');
        }
      });

      const result = await inviteMember({
        full_name: 'JSON Error Test',
        phone: '9876543210',
        role: 'staff'
      });

      // Should fallback to mock implementation
      expect(result.success).toBe(true);
      expect(result.message).toContain('(Mock)');
    });
  });

  describe('Phone Number Validation', () => {
    it('should handle various phone number formats', async () => {
      const phoneNumbers = [
        '9876543210',
        '9801234567',
        '9841234567',
        '9851234567'
      ];

      for (const phone of phoneNumbers) {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: `id-${phone}`,
            phone: phone,
            role: 'staff',
            dev_password: 'temp123'
          })
        });

        const result = await inviteMember({
          full_name: `User ${phone}`,
          phone: phone,
          role: 'staff'
        });

        expect(result.success).toBe(true);
        expect(result.data.phone).toBe(phone);
      }
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous invitations', async () => {
      const invitations = [
        { full_name: 'User 1', phone: '9876543211', role: 'staff' },
        { full_name: 'User 2', phone: '9876543212', role: 'admin' },
        { full_name: 'User 3', phone: '9876543213', role: 'manager' }
      ];

      // Mock responses for each invitation
      invitations.forEach((invitation, index) => {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: `concurrent-${index}`,
            phone: invitation.phone,
            role: invitation.role,
            dev_password: `temp${index}`
          })
        });
      });

      // Send all invitations concurrently
      const promises = invitations.map(invitation => inviteMember(invitation));
      const results = await Promise.all(promises);

      // Verify all succeeded
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data.phone).toBe(invitations[index].phone);
        expect(result.data.role).toBe(invitations[index].role);
      });

      // Verify correct number of API calls
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });
});
