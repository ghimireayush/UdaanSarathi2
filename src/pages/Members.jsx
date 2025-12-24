import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../components/ConfirmProvider';
import { useLanguage } from '../hooks/useLanguage';
import LanguageSwitch from '../components/LanguageSwitch';
import { inviteMember, getMembersList, deleteMember, updateMemberStatus } from '../services/memberService';
import { Trash2, Mail, Phone, Calendar, Search, Filter, MoreVertical, Edit, UserCheck, UserX, Users, Plus, ChevronRight } from 'lucide-react';
import { usePagination } from '../hooks/usePagination.js';
import PaginationWrapper from '../components/PaginationWrapper.jsx';
import { getRoleLabel } from '../config/roles';
import { useAvailableRoles } from '../hooks/useAvailableRoles';
import rolesStorageService from '../services/rolesStorageService';

const Members = () => {
  const { roles: availableRoles, loading: rolesLoading, error: rolesError } = useAvailableRoles();
  const { t, tPageSync } = useLanguage({ pageName: 'common', autoLoad: true });
  
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'recruiter',
    phone: ''
  });

  // Update form role when roles are loaded
  useEffect(() => {
    if (availableRoles.length > 0) {
      setFormData(prev => ({
        ...prev,
        role: prev.role || availableRoles[0].value
      }));
    }
  }, [availableRoles]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);

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
  const { tPageSync: tPageSync_teamMembers } = useLanguage({ 
    pageName: 'team-members', 
    autoLoad: true 
  });

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync_teamMembers(key, params);
  };

  // Helper to get translated role label
  const getTranslatedRoleLabel = (roleValue) => {
    const translationKey = `roles.${roleValue}.label`;
    // Use tPageSync to get from page translations (common.json)
    const translated = tPageSync(translationKey);
    // If translation exists and is different from the key, use it
    if (translated && translated !== translationKey) {
      return translated;
    }
    // Otherwise use the label from role configuration
    return getRoleLabel(roleValue);
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
    setError(null);
    
    const confirmed = await confirm({
      title: tPage('modals.confirmInvitation.title'),
      message: tPage('modals.confirmInvitation.message', { name: formData.full_name, role: getRoleDisplayName(formData.role) }),
      confirmText: tPage('modals.confirmInvitation.confirm'),
      cancelText: tPage('modals.confirmInvitation.cancel')
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await inviteMember(formData);
      if (!result.success) {
        setError(result.message || 'Failed to send invitation');
        return;
      }
      await loadMembers();
      setFormData({
        full_name: '',
        role: 'staff',
        phone: ''
      });
    } catch (error) {
      console.error('Error inviting member:', error);
      setError(error.message || 'Failed to send invitation. Please try again.');
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

  // Update form default role when available roles change
  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.find(r => r.value === formData.role)) {
      setFormData(prev => ({
        ...prev,
        role: availableRoles[0]?.value || 'recruiter'
      }));
    }
  }, [availableRoles]);

  const getRoleDisplayName = (role) => {
    // Try to get translation first, fallback to role label from config
    const translationKey = `roles.${role}`;
    const translated = tPage(translationKey);
    
    // If translation exists and is different from the key, use it
    if (translated && translated !== translationKey) {
      return translated;
    }
    
    // Otherwise use the label from role configuration
    return getRoleLabel(role);
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
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{tPage('title')}</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{tPage('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{members.length}</span>
            </div>
            <LanguageSwitch />
          </div>
        </div>
      </div>

      {/* Invite Team Member Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              {tPage('sections.invite.title')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 ml-7">{tPage('sections.invite.subtitle')}</p>
        </div>
        
        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label htmlFor="full_name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {tPage('form.fullName.label')}
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder={tPage('form.fullName.placeholder')}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {tPage('form.role.label')}
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="form-select text-sm py-2.5"
                >
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {getTranslatedRoleLabel(role.value)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder={tPage('form.phone.placeholder')}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-h-[44px] bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {tPage('form.actions.sending')}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {tPage('form.actions.sendInvitation')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{tPage('sections.members.title', { count: totalItems })}</h2>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {filteredMembers.length} members
              </span>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Search className="text-gray-500 dark:text-gray-400 w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={tPage('search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 pr-4 py-2.5 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="form-select-sm text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg"
                >
                  <option value="all">{tPage('search.filters.allRoles')}</option>
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {getTranslatedRoleLabel(role.value)}
                    </option>
                  ))}
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select-sm text-xs sm:text-sm py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg"
                >
                  <option value="all">{tPage('search.filters.allStatus')}</option>
                  <option value="pending">{tPage('status.pending')}</option>
                  <option value="active">{tPage('status.active')}</option>
                  <option value="suspended">{tPage('status.suspended')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden">
          {loadingMembers ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{tPage('loading.members')}</span>
              </div>
            </div>
          ) : paginatedMembers.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {filteredMembers.length === 0 && members.length > 0 ? 
                  tPage('empty.noSearchResults') : 
                  tPage('empty.noMembers')
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedMembers.map((member) => (
                <div key={member.id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {/* Header: Avatar, Name, Status */}
                  <div className="flex items-start gap-2 sm:gap-3 mb-3">
                    <div className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-semibold text-xs sm:text-sm shadow-sm">
                      {(member.name || member.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {member.name || member.full_name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusBadgeClass(member.status)}`}>
                          {member.status}
                        </span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 mt-1">
                        {getRoleDisplayName(member.role)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Info Row */}
                  <div className="flex flex-col gap-1.5 sm:gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 pl-11 sm:pl-13">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{member.mobileNumber || member.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{new Date(member.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Dev Password (if exists) */}
                  {member.dev_password && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-3 pl-11 sm:pl-13 truncate">
                      {tPage('table.memberInfo.tempPassword', { password: member.dev_password })}
                    </div>
                  )}
                  
                  {/* Actions - Disabled for Agency Owner */}
                  <div className="flex items-center gap-2 pl-11 sm:pl-13">
                    {member.role === 'agency_owner' || member.role === 'owner' ? (
                      <span className="flex-1 min-h-[32px] sm:min-h-[36px] flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        {tPage('actions.ownerProtected') || 'Owner account protected'}
                      </span>
                    ) : (
                      <>
                        {member.status === 'active' ? (
                          <button
                            onClick={() => handleStatusUpdate(member.id, 'suspended')}
                            className="flex-1 min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1 sm:gap-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                          >
                            <UserX className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            <span className="hidden xs:inline">{tPage('actions.suspend')}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusUpdate(member.id, 'active')}
                            className="flex-1 min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1 sm:gap-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-colors"
                          >
                            <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                            <span className="hidden xs:inline">{tPage('actions.activate')}</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(member.id, member.name)}
                          className="min-h-[32px] sm:min-h-[36px] min-w-[32px] sm:min-w-[36px] flex items-center justify-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800 transition-colors flex-shrink-0"
                          title={tPage('actions.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.member')}
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.role')}
                </th>
                <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.contact')}
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.status')}
                </th>
                <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.joined')}
                </th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {tPage('table.headers.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loadingMembers ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{tPage('loading.members')}</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {filteredMembers.length === 0 && members.length > 0 ? 
                        tPage('empty.noSearchResults') : 
                        tPage('empty.noMembers')
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium text-xs sm:text-sm">
                            {(member.name || member.full_name || '?').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{member.name || member.full_name}</div>
                          {member.dev_password && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 truncate">{tPage('table.memberInfo.tempPassword', { password: member.dev_password })}</div>
                          )}
                          <div className="lg:hidden text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {member.mobileNumber || member.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                        {getRoleDisplayName(member.role)}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {member.mobileNumber || member.phone}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {new Date(member.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      {member.role === 'agency_owner' || member.role === 'owner' ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
                          {tPage('actions.ownerProtected') || 'Protected'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {member.status === 'active' ? (
                            <button
                              onClick={() => handleStatusUpdate(member.id, 'suspended')}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title={tPage('actions.suspend')}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusUpdate(member.id, 'active')}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                              title={tPage('actions.activate')}
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(member.id, member.name)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={tPage('actions.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
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
