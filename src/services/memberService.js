import { handleServiceError } from '../utils/errorHandler';
import auditService from './auditService';

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
    if (!memberData.name || !memberData.role || !memberData.mobileNumber) {
      throw new Error('Invalid member data - all fields are required');
    }

    // Check if mobile number already exists
    const existingMobile = mockMembers.find(m => m.mobileNumber === memberData.mobileNumber);
    if (existingMobile) {
      throw new Error('A member with this mobile number already exists');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newMember = {
      id: `member_${Date.now()}`,
      ...memberData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // In a real app, this would be an API call
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
          member_name: newMember.name,
          member_role: newMember.role,
          member_mobile: newMember.mobileNumber
        }
      });
    } catch (e) {
      console.warn('Audit logging (INVITE MEMBER) failed:', e);
    }

    return {
      success: true,
      message: `Invitation sent to ${memberData.name}`,
      data: newMember
    };
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