import { handleServiceError } from '../utils/errorHandler';
import auditService from './auditService';
import MemberDataSource from '../api/datasources/MemberDataSource.js';
import { getAssignableRoles } from '../config/roles.js';

// Mock data for development
let mockMembers = [];


export const inviteMember = async (memberData) => {
  return handleServiceError(async () => {
    // Validate required fields according to API spec
    if (!memberData.full_name || !memberData.role || !memberData.phone) {
      throw new Error('Invalid member data - full_name, phone, and role are required');
    }

    // Validate role according to RBAC configuration
    const assignableRoles = getAssignableRoles();
    const validRoles = assignableRoles.map(role => role.value);
    if (!validRoles.includes(memberData.role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Check if phone number already exists
    const existingPhone = mockMembers.find(m => m.phone === memberData.phone);
    if (existingPhone) {
      throw new Error('A member with this phone number already exists');
    }

    // Get JWT token from localStorage
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('udaan_token') : null
    if (!token) {
      throw new Error('Not authenticated. Please log in first.')
    }

    // Real API call implementation
    console.log('[memberService] Calling API to invite member:', memberData);
    const apiResult = await MemberDataSource.inviteMember(memberData);
    console.log('[memberService] API response:', apiResult);
    
    // Transform API response to match internal format
    const newMember = {
      id: apiResult.id,
      name: memberData.full_name, // Keep internal name field for compatibility
      full_name: memberData.full_name,
      phone: apiResult.phone,
      mobileNumber: apiResult.phone, // Keep internal mobileNumber for compatibility
      role: apiResult.role,
      status: apiResult.status || 'pending',
      dev_password: apiResult.dev_password,
      createdAt: apiResult.created_at || new Date().toISOString()
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
  });
};

export const getMembersList = async (filters = {}) => {
  return handleServiceError(async () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('udaan_token') : null
    if (!token) {
      throw new Error('Not authenticated. Please log in first.')
    }

    try {
      const data = await MemberDataSource.getMembersList(filters)
      
      // Transform API response to match internal format
      const transformedData = Array.isArray(data) ? data.map(member => ({
        id: member.id,
        name: member.full_name,
        full_name: member.full_name,
        phone: member.phone,
        mobileNumber: member.phone,
        role: member.role,
        status: member.status || 'active',
        createdAt: member.created_at
      })) : [];
      
      return {
        success: true,
        data: transformedData
      }
    } catch (error) {
      console.warn('API call failed, using mock implementation:', error.message)
      // Fallback to mock data for development
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        success: true,
        data: mockMembers
      }
    }
  });
};

export const deleteMember = async (memberId) => {
  return handleServiceError(async () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('udaan_token') : null
    if (!token) {
      throw new Error('Not authenticated. Please log in first.')
    }

    try {
      await MemberDataSource.deleteMember(memberId)

      // Remove from mock data as well
      const index = mockMembers.findIndex(m => m.id === memberId)
      if (index !== -1) {
        mockMembers.splice(index, 1)
      }

      return {
        success: true,
        message: 'Member deleted successfully'
      }
    } catch (error) {
      console.warn('API call failed, using mock implementation:', error.message)
      // Fallback to mock deletion
      const index = mockMembers.findIndex(m => m.id === memberId)
      if (index === -1) {
        throw new Error('Member not found')
      }
      mockMembers.splice(index, 1)
      return {
        success: true,
        message: 'Member deleted successfully (Mock)'
      }
    }
  });
};

export const updateMemberStatus = async (memberId, status) => {
  return handleServiceError(async () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('udaan_token') : null
    if (!token) {
      throw new Error('Not authenticated. Please log in first.')
    }

    try {
      const data = await MemberDataSource.updateMemberStatus(memberId, status)

      // Update mock data as well
      const member = mockMembers.find(m => m.id === memberId)
      if (member) {
        member.status = status
      }

      return {
        success: true,
        message: 'Member status updated successfully',
        data: data
      }
    } catch (error) {
      console.warn('API call failed, using mock implementation:', error.message)
      // Fallback to mock update
      const member = mockMembers.find(m => m.id === memberId)
      if (!member) {
        throw new Error('Member not found')
      }
      member.status = status
      return {
        success: true,
        message: 'Member status updated successfully (Mock)',
        data: member
      }
    }
  });
};