import { handleServiceError } from '../utils/errorHandler';
import auditService from './auditService';

// API Configuration
const API_BASE_URL = 'https://dev.kaha.com.np';
const MEMBERS_INVITE_ENDPOINT = '/job-portal/agencies/owner/members/invite';

// Mock data for development
const mockMembers = [
  {
    id: 'IC_001',
    name: 'John Doe',
    role: 'interview-coordinator',
    mobileNumber: '9876543210',
    status: 'active',
    createdAt: '2025-09-16T10:30:00Z'
  },
  {
    id: 'REC_001',
    name: 'Jane Smith',
    role: 'recipient',
    mobileNumber: '9876543211',
    status: 'pending',
    createdAt: '2025-09-16T09:00:00Z'
  },
  {
    id: 'IC_002',
    name: 'Mike Johnson',
    role: 'interview-coordinator',
    mobileNumber: '9876543212',
    status: 'active',
    createdAt: '2025-09-14T14:30:00Z'
  },
  {
    id: 'REC_002',
    name: 'Sarah Wilson',
    role: 'recipient',
    mobileNumber: '9876543213',
    status: 'inactive',
    createdAt: '2025-09-13T11:15:00Z'
  },
  {
    id: 'IC_003',
    name: 'David Brown',
    role: 'interview-coordinator',
    mobileNumber: '9876543214',
    status: 'active',
    createdAt: '2025-09-12T16:45:00Z'
  },
  {
    id: 'IC_004',
    name: 'Lisa Garcia',
    role: 'interview-coordinator',
    mobileNumber: '9876543215',
    status: 'pending',
    createdAt: '2025-09-11T13:20:00Z'
  },
  {
    id: 'REC_003',
    name: 'Robert Taylor',
    role: 'recipient',
    mobileNumber: '9876543216',
    status: 'active',
    createdAt: '2025-09-10T08:10:00Z'
  },
  {
    id: 'IC_005',
    name: 'Emily Davis',
    role: 'interview-coordinator',
    mobileNumber: '9876543217',
    status: 'inactive',
    createdAt: '2025-09-09T15:55:00Z'
  },
  {
    id: 'REC_004',
    name: 'Michael Anderson',
    role: 'recipient',
    mobileNumber: '9876543218',
    status: 'active',
    createdAt: '2025-09-08T12:40:00Z'
  },
  {
    id: 'IC_006',
    name: 'Jennifer Martinez',
    role: 'interview-coordinator',
    mobileNumber: '9876543219',
    status: 'pending',
    createdAt: '2025-09-07T17:25:00Z'
  },
  {
    id: 'REC_005',
    name: 'Kevin Anderson',
    role: 'recipient',
    mobileNumber: '9876543220',
    status: 'pending',
    createdAt: '2025-09-06T09:30:00Z'
  },
  {
    id: 'REC_006',
    name: 'Amanda Thompson',
    role: 'recipient',
    mobileNumber: '9876543221',
    status: 'active',
    createdAt: '2025-09-05T14:15:00Z'
  }
];

export const inviteMember = async (memberData) => {
  return handleServiceError(async () => {
    // Validate required fields according to API spec
    if (!memberData.full_name || !memberData.role || !memberData.phone) {
      throw new Error('Invalid member data - full_name, phone, and role are required');
    }

    // Validate role according to API spec
    const validRoles = ['staff', 'admin', 'manager'];
    if (!validRoles.includes(memberData.role)) {
      throw new Error('Invalid role. Must be one of: staff, admin, manager');
    }

    // Check if phone number already exists
    const existingPhone = mockMembers.find(m => m.phone === memberData.phone);
    if (existingPhone) {
      throw new Error('A member with this phone number already exists');
    }

    try {
      // Real API call implementation
      const response = await fetch(`${API_BASE_URL}${MEMBERS_INVITE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add authorization header when auth is implemented
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          full_name: memberData.full_name,
          phone: memberData.phone,
          role: memberData.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const apiResult = await response.json();
      
      // Transform API response to match internal format
      const newMember = {
        id: apiResult.id,
        name: memberData.full_name, // Keep internal name field for compatibility
        full_name: memberData.full_name,
        phone: apiResult.phone,
        mobileNumber: apiResult.phone, // Keep internal mobileNumber for compatibility
        role: apiResult.role,
        status: 'pending',
        dev_password: apiResult.dev_password,
        createdAt: new Date().toISOString()
      };

      // Add to mock data for development
      mockMembers.push(newMember);

      // Audit: member invitation
      try {
        await auditService.logEvent({
          user_id: 'current_user', // In real app, get from auth context
          user_name: 'Current User',
          action: 'INVITE',
          resource_type: 'MEMBER',
          resource_id: newMember.id,
          metadata: {
            member_name: newMember.full_name,
            member_role: newMember.role,
            member_phone: newMember.phone,
            dev_password_provided: !!apiResult.dev_password
          }
        });
      } catch (e) {
        console.warn('Audit logging (INVITE MEMBER) failed:', e);
      }

      return {
        success: true,
        message: `Invitation sent to ${memberData.full_name}`,
        data: newMember
      };

    } catch (error) {
      // Fallback to mock implementation for development
      console.warn('API call failed, using mock implementation:', error.message);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newMember = {
        id: `member_${Date.now()}`,
        name: memberData.full_name,
        full_name: memberData.full_name,
        phone: memberData.phone,
        mobileNumber: memberData.phone,
        role: memberData.role,
        status: 'pending',
        dev_password: `temp_${Math.random().toString(36).substring(2, 8)}`,
        createdAt: new Date().toISOString()
      };

      // Add to mock data
      mockMembers.push(newMember);

      // Audit: member invitation (mock)
      try {
        await auditService.logEvent({
          user_id: 'current_user',
          user_name: 'Current User',
          action: 'INVITE',
          resource_type: 'MEMBER',
          resource_id: newMember.id,
          metadata: {
            member_name: newMember.full_name,
            member_role: newMember.role,
            member_phone: newMember.phone,
            mock_implementation: true
          }
        });
      } catch (e) {
        console.warn('Audit logging (INVITE MEMBER) failed:', e);
      }

      return {
        success: true,
        message: `Invitation sent to ${memberData.full_name} (Mock)`,
        data: newMember
      };
    }
  });
};

export const getMembersList = async () => {
  return handleServiceError(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      data: mockMembers
    };
  });
};

export const deleteMember = async (memberId) => {
  return handleServiceError(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const index = mockMembers.findIndex(m => m.id === memberId);
    if (index === -1) {
      throw new Error('Member not found');
    }

    const deletedMember = mockMembers[index];
    mockMembers.splice(index, 1);

    // Audit: member deletion
    try {
      await auditService.logEvent({
        user_id: 'current_user', // In real app, get from auth context
        user_name: 'Current User',
        action: 'DELETE',
        resource_type: 'MEMBER',
        resource_id: memberId,
        old_values: deletedMember,
        metadata: {
          member_name: deletedMember.name,
          member_role: deletedMember.role
        }
      });
    } catch (e) {
      console.warn('Audit logging (DELETE MEMBER) failed:', e);
    }

    return {
      success: true,
      message: 'Member deleted successfully'
    };
  });
};

export const updateMemberStatus = async (memberId, status) => {
  return handleServiceError(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));

    const member = mockMembers.find(m => m.id === memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const oldStatus = member.status;
    member.status = status;

    // Audit: member status update
    try {
      await auditService.logEvent({
        user_id: 'current_user', // In real app, get from auth context
        user_name: 'Current User',
        action: 'UPDATE',
        resource_type: 'MEMBER',
        resource_id: memberId,
        changes: { status: status },
        old_values: { status: oldStatus },
        new_values: { status: status },
        metadata: {
          member_name: member.name,
          old_status: oldStatus,
          new_status: status
        }
      });
    } catch (e) {
      console.warn('Audit logging (UPDATE MEMBER STATUS) failed:', e);
    }

    return {
      success: true,
      message: 'Member status updated successfully',
      data: member
    };
  });
};