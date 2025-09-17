import { inviteMember, getMembersList, deleteMember, updateMemberStatus } from './memberService';
import auditService from './auditService';

// Mock the audit service
jest.mock('./auditService', () => ({
  logEvent: jest.fn()
}));

// Mock the error handler
jest.mock('../utils/errorHandler', () => ({
  handleServiceError: jest.fn((operation) => operation()),
  ServiceError: class ServiceError extends Error {
    constructor(message, code, status) {
      super(message);
      this.code = code;
      this.status = status;
    }
  }
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('memberService', () => {
  beforeEach(() => {
    fetch.mockClear();
    auditService.logEvent.mockClear();
  });

  describe('inviteMember', () => {
    const validMemberData = {
      full_name: 'John Doe',
      phone: '9876543210',
      role: 'staff'
    };

    const mockApiResponse = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      phone: '9876543210',
      role: 'staff',
      dev_password: 'temp123'
    };

    it('should successfully invite a member via API', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const result = await inviteMember(validMemberData);

      expect(fetch).toHaveBeenCalledWith(
        'https://dev.kaha.com.np/job-portal/agencies/owner/members/invite',
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

      expect(result.success).toBe(true);
      expect(result.message).toBe('Invitation sent to John Doe');
      expect(result.data.id).toBe(mockApiResponse.id);
      expect(result.data.dev_password).toBe('temp123');
      expect(auditService.logEvent).toHaveBeenCalled();
    });

    it('should fallback to mock implementation when API fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      console.warn = jest.fn(); // Mock console.warn

      const result = await inviteMember(validMemberData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('(Mock)');
      expect(result.data.full_name).toBe('John Doe');
      expect(result.data.phone).toBe('9876543210');
      expect(result.data.role).toBe('staff');
      expect(console.warn).toHaveBeenCalledWith(
        'API call failed, using mock implementation:',
        'Network error'
      );
    });

    it('should validate required fields', async () => {
      const invalidData = { full_name: 'John Doe' }; // Missing phone and role

      await expect(inviteMember(invalidData)).rejects.toThrow(
        'Invalid member data - full_name, phone, and role are required'
      );
    });

    it('should validate role values', async () => {
      const invalidRoleData = {
        full_name: 'John Doe',
        phone: '9876543210',
        role: 'invalid-role'
      };

      await expect(inviteMember(invalidRoleData)).rejects.toThrow(
        'Invalid role. Must be one of: staff, admin, manager'
      );
    });

    it('should handle API error responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Phone number already exists' })
      });

      console.warn = jest.fn();

      const result = await inviteMember(validMemberData);

      // Should fallback to mock implementation
      expect(result.success).toBe(true);
      expect(result.message).toContain('(Mock)');
      expect(console.warn).toHaveBeenCalled();
    });

    it('should check for duplicate phone numbers in mock data', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const duplicatePhoneData = {
        full_name: 'Jane Doe',
        phone: '9876543210', // This phone might already exist in mock data
        role: 'admin'
      };

      // First invitation should work
      const result1 = await inviteMember(validMemberData);
      expect(result1.success).toBe(true);

      // Second invitation with same phone should fail
      await expect(inviteMember(duplicatePhoneData)).rejects.toThrow(
        'A member with this phone number already exists'
      );
    });

    it('should log audit events for successful invitations', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      await inviteMember(validMemberData);

      expect(auditService.logEvent).toHaveBeenCalledWith({
        user_id: 'current_user',
        user_name: 'Current User',
        action: 'INVITE',
        resource_type: 'MEMBER',
        resource_id: mockApiResponse.id,
        metadata: {
          member_name: 'John Doe',
          member_role: 'staff',
          member_phone: '9876543210',
          dev_password_provided: true
        }
      });
    });

    it('should handle all valid roles', async () => {
      const roles = ['staff', 'admin', 'manager'];
      
      for (const role of roles) {
        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockApiResponse, role })
        });

        const memberData = { ...validMemberData, role, phone: `987654321${role.length}` };
        const result = await inviteMember(memberData);

        expect(result.success).toBe(true);
        expect(result.data.role).toBe(role);
      }
    });
  });

  describe('getMembersList', () => {
    it('should return members list', async () => {
      const result = await getMembersList();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      await getMembersList();
      const endTime = Date.now();

      // Should take at least 500ms (simulated delay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(450);
    });
  });

  describe('deleteMember', () => {
    it('should delete a member successfully', async () => {
      // First get the list to find a member to delete
      const membersList = await getMembersList();
      const memberToDelete = membersList.data[0];

      const result = await deleteMember(memberToDelete.id);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Member deleted successfully');
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          resource_type: 'MEMBER',
          resource_id: memberToDelete.id
        })
      );
    });

    it('should handle non-existent member deletion', async () => {
      await expect(deleteMember('non-existent-id')).rejects.toThrow(
        'Member not found'
      );
    });
  });

  describe('updateMemberStatus', () => {
    it('should update member status successfully', async () => {
      const membersList = await getMembersList();
      const memberToUpdate = membersList.data[0];
      const newStatus = 'inactive';

      const result = await updateMemberStatus(memberToUpdate.id, newStatus);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Member status updated successfully');
      expect(result.data.status).toBe(newStatus);
      expect(auditService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          resource_type: 'MEMBER',
          resource_id: memberToUpdate.id,
          changes: { status: newStatus }
        })
      );
    });

    it('should handle non-existent member status update', async () => {
      await expect(updateMemberStatus('non-existent-id', 'active')).rejects.toThrow(
        'Member not found'
      );
    });
  });

  describe('API Integration', () => {
    it('should use correct API endpoint and headers', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      await inviteMember(validMemberData);

      expect(fetch).toHaveBeenCalledWith(
        'https://dev.kaha.com.np/job-portal/agencies/owner/members/invite',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
      );
    });

    it('should transform API response to internal format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const result = await inviteMember(validMemberData);

      // Check that response is transformed to include both formats
      expect(result.data).toMatchObject({
        id: mockApiResponse.id,
        name: validMemberData.full_name,           // Internal format
        full_name: validMemberData.full_name,      // API format
        phone: mockApiResponse.phone,              // API format
        mobileNumber: mockApiResponse.phone,       // Internal format
        role: mockApiResponse.role,
        status: 'pending',
        dev_password: mockApiResponse.dev_password
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      fetch.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      console.warn = jest.fn();

      const result = await inviteMember(validMemberData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('(Mock)');
      expect(console.warn).toHaveBeenCalledWith(
        'API call failed, using mock implementation:',
        'Timeout'
      );
    });

    it('should handle malformed API responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      console.warn = jest.fn();

      const result = await inviteMember(validMemberData);

      expect(result.success).toBe(true);
      expect(result.message).toContain('(Mock)');
    });

    it('should handle audit logging failures gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      auditService.logEvent.mockRejectedValueOnce(new Error('Audit failed'));
      console.warn = jest.fn();

      const result = await inviteMember(validMemberData);

      expect(result.success).toBe(true);
      expect(console.warn).toHaveBeenCalledWith(
        'Audit logging (INVITE MEMBER) failed:',
        expect.any(Error)
      );
    });
  });
});
