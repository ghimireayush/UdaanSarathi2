/**
 * Simple test for member invite functionality
 * Testing the API integration with auth documentation
 */

import { getAssignableRoles } from '../config/roles';

describe('Member Invite API Integration', () => {
  // Mock fetch
  global.fetch = jest.fn();

  beforeEach(() => {
    fetch.mockClear();
  });

  test('API endpoint and request format matches auth documentation', async () => {
    // Mock successful API response matching auth docs
    const mockApiResponse = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      phone: '9876543210',
      role: 'staff',
      dev_password: 'temp123'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    // Import the function after mocking
    const { inviteMember } = await import('./memberService');

    const memberData = {
      full_name: 'John Doe',
      phone: '9876543210',
      role: 'staff'
    };

    try {
      const result = await inviteMember(memberData);

      // Verify API call was made with correct parameters
      expect(fetch).toHaveBeenCalledWith(
        'https://dev.kaha.com.np/job-portal/agencies/owner/members/invite',
        expect.objectContaining({
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
        })
      );

      // Verify response handling
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
      expect(result.data.dev_password).toBe('temp123');

    } catch (error) {
      // If API call fails, should fallback to mock
      console.log('API call failed, using fallback:', error.message);
      expect(error.message).toContain('Mock');
    }
  });

  test('validates required fields according to API spec', async () => {
    const { inviteMember } = await import('./memberService');

    // Test missing fields
    const invalidCases = [
      { full_name: 'Test' }, // Missing phone and role
      { phone: '9876543210' }, // Missing full_name and role
      { role: 'staff' }, // Missing full_name and phone
    ];

    for (const invalidData of invalidCases) {
      try {
        await inviteMember(invalidData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('full_name, phone, and role are required');
      }
    }
  });

  test('validates role values according to API spec', async () => {
    const { inviteMember } = await import('./memberService');

    const assignableRoles = getAssignableRoles();
    const validRolesList = assignableRoles.map(role => role.value).join(', ');
    
    // Use roles that are NOT in the assignable list
    const invalidRoles = ['user', 'guest', 'owner'];
    
    for (const invalidRole of invalidRoles) {
      try {
        await inviteMember({
          full_name: 'Test User',
          phone: '9876543210',
          role: invalidRole
        });
        fail('Should have thrown role validation error');
      } catch (error) {
        expect(error.message).toContain(`Must be one of: ${validRolesList}`);
      }
    }
  });

  test('handles API fallback gracefully', async () => {
    // Mock API failure
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { inviteMember } = await import('./memberService');

    const result = await inviteMember({
      full_name: 'Fallback Test',
      phone: '9876543210',
      role: 'staff'
    });

    // Should succeed with mock implementation
    expect(result.success).toBe(true);
    expect(result.message).toContain('(Mock)');
    expect(result.data.full_name).toBe('Fallback Test');
  });

  test('transforms response to support both old and new formats', async () => {
    const mockApiResponse = {
      id: 'test-id',
      phone: '9876543210',
      role: 'admin',
      dev_password: 'temp456'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    const { inviteMember } = await import('./memberService');

    const result = await inviteMember({
      full_name: 'Transform Test',
      phone: '9876543210',
      role: 'admin'
    });

    // Should have both old and new format fields
    expect(result.data).toMatchObject({
      // New API format
      id: 'test-id',
      full_name: 'Transform Test',
      phone: '9876543210',
      role: 'admin',
      dev_password: 'temp456',
      
      // Old format for compatibility
      name: 'Transform Test',
      mobileNumber: '9876543210',
      status: 'pending'
    });
  });
});
