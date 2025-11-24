import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../components/ConfirmProvider';
import { useLanguage } from '../hooks/useLanguage';
import LanguageSwitch from '../components/LanguageSwitch';
import { inviteMember, getMembersList, deleteMember, updateMemberStatus } from '../services/memberService';
import { Trash2, Mail, Phone, Calendar, Search, Filter, MoreVertical, Edit, UserCheck, UserX } from 'lucide-react';
import { usePagination } from '../hooks/usePagination.js';
import PaginationWrapper from '../components/PaginationWrapper.jsx';

const Members = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'staff',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter and search logic
  const filteredMembers = members.filter(member => {
    const memberName = member.name || member.full_name || '';
    const memberPhone = member.mobileNumber || member.phone || '';
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memberPhone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination hook
  const {
    currentData: paginatedMembers,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    itemsPerPageOptions,
    goToPage,
    changeItemsPerPage,
    resetPagination
  } = usePagination(filteredMembers, {
    initialItemsPerPage: 10,
    itemsPerPageOptions: [5, 10, 25, 50]
  });
  
  const { isAdmin, hasPermission, PERMISSIONS } = useAuth();
  const { confirm } = useConfirm();
  const { tPageSync } = useLanguage({ 
    pageName: 'team-members', 
    autoLoad: true 
  });

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params);
  };

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

  if (!hasPermission(PERMISSIONS.MANAGE_MEMBERS)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{tPage('permissions.accessDenied')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{tPage('permissions.noPermission')}</p>
        </div>
      </div>
    );
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
    
    const confirmed = await confirm({
      title: tPage('modals.confirmInvitation.title'),
      message: tPage('modals.confirmInvitation.message', { name: formData.full_name, role: getRoleDisplayName(formData.role) }),
      confirmText: tPage('modals.confirmInvitation.confirm'),
      cancelText: tPage('modals.confirmInvitation.cancel')
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await inviteMember(formData);
      await loadMembers();
      setFormData({
        full_name: '',
        role: 'staff',
        phone: ''
      });
    } catch (error) {
      console.error('Error inviting member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberId, memberName) => {
    const confirmed = await confirm({
      title: tPage('modals.confirmDeletion.title'),
      message: tPage('modals.confirmDeletion.message', { name: memberName }),
      confirmText: tPage('modals.confirmDeletion.confirm'),
      cancelText: tPage('modals.confirmDeletion.cancel'),
      intent: 'danger'
    });

    if (!confirmed) return;

    try {
      await deleteMember(memberId);
      await loadMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const handleStatusUpdate = async (memberId, newStatus) => {
    try {
      await updateMemberStatus(memberId, newStatus);
      await loadMembers();
    } catch (error) {
      console.error('Error updating member status:', error);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'staff': tPage('roles.staff'),
      'admin': tPage('roles.admin'),
      'manager': tPage('roles.manager'),
      // Legacy roles for backward compatibility
      'recruiter': tPage('roles.recruiter'),
      'coordinator': tPage('roles.coordinator'),
      'interview-coordinator': tPage('roles.interviewCoordinator'),
      'recipient': tPage('roles.recipient')
    };
    return roleNames[role] || role;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'suspended':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [searchTerm, roleFilter, statusFilter, resetPagination]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{tPage('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{tPage('subtitle')}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <LanguageSwitch />
          </div>
        </div>
      </div>

      {/* Invite Team Member Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {tPage('sections.invite.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tPage('sections.invite.subtitle')}</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tPage('form.fullName.label')}
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={tPage('form.fullName.placeholder')}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tPage('form.role.label')}
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              >
                <option value="staff">{tPage('form.role.options.staff')}</option>
                <option value="admin">{tPage('form.role.options.admin')}</option>
                <option value="manager">{tPage('form.role.options.manager')}</option>
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tPage('form.phone.label')}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={tPage('form.phone.placeholder')}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-blue-bright text-white px-6 py-2 rounded-lg hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {tPage('form.actions.sending')}
                  </>
                ) : (
                  <>
                    {tPage('form.actions.sendInvitation')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{tPage('sections.members.title', { count: totalItems })}</h2>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder={tPage('search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">{tPage('search.filters.allRoles')}</option>
                <option value="staff">{tPage('roles.staff')}</option>
                <option value="admin">{tPage('roles.admin')}</option>
                <option value="manager">{tPage('roles.manager')}</option>
                {/* Legacy roles for backward compatibility */}
                <option value="recruiter">{tPage('roles.recruiter')}</option>
                <option value="coordinator">{tPage('roles.coordinator')}</option>
                <option value="interview-coordinator">{tPage('roles.interviewCoordinator')}</option>
                <option value="recipient">{tPage('roles.recipient')}</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright focus:ring-offset-2 dark:focus:ring-offset-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">{tPage('search.filters.allStatus')}</option>
                <option value="pending">{tPage('status.pending')}</option>
                <option value="active">{tPage('status.active')}</option>
                <option value="suspended">{tPage('status.suspended')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.member')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.joined')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loadingMembers ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-bright"></div>
                      <span className="ml-3 text-gray-500 dark:text-gray-400">{tPage('loading.members')}</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {filteredMembers.length === 0 && members.length > 0 ? 
                      tPage('empty.noSearchResults') : 
                      tPage('empty.noMembers')
                    }
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-brand-blue-bright text-white flex items-center justify-center font-medium">
                            {(member.name || member.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.name || member.full_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{tPage('table.memberInfo.id', { id: member.id })}</div>
                          {member.dev_password && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">{tPage('table.memberInfo.tempPassword', { password: member.dev_password })}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {getRoleDisplayName(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {member.mobileNumber || member.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(member.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {member.status === 'active' ? (
                          <button
                            onClick={() => handleStatusUpdate(member.id, 'suspended')}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={tPage('actions.suspend')}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusUpdate(member.id, 'active')}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title={tPage('actions.activate')}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(member.id, member.name)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={tPage('actions.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <PaginationWrapper
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              itemsPerPageOptions={itemsPerPageOptions}
              onPageChange={goToPage}
              onItemsPerPageChange={changeItemsPerPage}
              showInfo={true}
              showItemsPerPageSelector={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
