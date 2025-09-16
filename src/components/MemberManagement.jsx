import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../components/ConfirmProvider';
import { inviteMember, getMembersList, deleteMember } from '../services/memberService';
import { Trash2 } from 'lucide-react';

const MemberManagement = () => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'interview-coordinator',
    mobileNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const { isAdmin } = useAuth();
  const { confirm } = useConfirm();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await getMembersList();
      setMembers(response.data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  if (!isAdmin) {
    return <div className="p-4">You don't have permission to access this page.</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show confirmation dialog
    const confirmed = await confirm({
      title: 'Confirm Invitation',
      message: `Are you sure you want to invite ${formData.name} as ${
        formData.role === 'interview-coordinator' ? 'an Interview Coordinator' : 'a Recipient'
      }?`,
      confirmText: 'Yes, Invite',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await inviteMember(formData);
      await loadMembers(); // Refresh the list
      // Reset form
      setFormData({
        name: '',
        role: 'interview-coordinator',
        mobileNumber: ''
      });
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberId, memberName) => {
    const confirmed = await confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete ${memberName}?`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      intent: 'danger'
    });

    if (!confirmed) return;

    try {
      await deleteMember(memberId);
      await loadMembers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <p className="mt-1 text-sm text-gray-600">Invite and manage your agency's team members.</p>
      </div>

      {/* Invite Form */}
      <div className="w-full lg:w-1/3">
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Invite Team Member</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter member name"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="interview-coordinator">Interview Coordinator</option>
                <option value="recipient">Recipient</option>
              </select>
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter 10-digit mobile number"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Inviting...' : 'Invite Member'}
            </button>
          </form>
        </div>
      </div>

      {/* Members Table */}
      <div className="w-2/3">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Team Members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mobile Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingMembers ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading members...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No members found
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {member.role.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {member.mobileNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${getStatusBadgeClass(member.status)}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDelete(member.id, member.name)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Delete member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;