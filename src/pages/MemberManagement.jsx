import { useState, useEffect } from 'react'
import { Plus, User, Phone, UserPlus, Mail, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { useNotificationContext } from '../contexts/NotificationContext'
import { inviteMember, getMembersList, deleteMember, updateMemberStatus } from '../services/memberService'
import { getAssignableRoles, getRoleLabel } from '../config/roles'

const MemberManagement = () => {
  const [members, setMembers] = useState([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [loading, setLoading] = useState(false)
  // Get assignable roles from central configuration
  const assignableRoles = getAssignableRoles();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: assignableRoles[0]?.value || 'staff' // Default to first assignable role
  })

  const { user } = useAuth()
  const { success, error: showError } = useNotificationContext()

  // Fetch members on component mount
  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      // Fetch members from your service
      const response = await getMembersList()
      setMembers(response)
    } catch (err) {
      showError('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await inviteMember({
        ...formData,
        invitedBy: user.id
      })
      success('Invitation sent successfully')
      setShowInviteForm(false)
      setFormData({
        name: '',
        phone: '',
        role: assignableRoles[0]?.value || 'staff'
      })
      fetchMembers()
    } catch (err) {
      showError(err.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return

    try {
      setLoading(true)
      await deleteMember(memberId)
      success('Member removed successfully')
      fetchMembers()
    } catch (err) {
      showError('Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
      </div>

      {showInviteForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright"
                      placeholder="Enter member's name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright"
                      placeholder="Enter member's email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright"
                      placeholder="Enter member's phone"
                      pattern="[0-9]{10}"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    {assignableRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright disabled:opacity-50"
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <UserPlus className="h-5 w-5 mr-2" />
                  )}
                  Send Invitation
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-brand-navy/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-brand-navy" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">ID: {member.id}</div>
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getRoleLabel(member.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.status === 'active' ? (
                    <span className="flex items-center text-green-800">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center text-yellow-600">
                      <XCircle className="h-4 w-4 mr-1" />
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MemberManagement