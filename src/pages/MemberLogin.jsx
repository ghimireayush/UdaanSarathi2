import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, UserCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import LanguageSwitch from '../components/LanguageSwitch'
import logo from '../assets/logo.svg'

const MemberLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { memberLogin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  
  // Get invitation token from URL if present
  const invitationToken = searchParams.get('token')
  const memberName = searchParams.get('name')
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const result = await memberLogin(username, password, invitationToken)
      if (result.success) {
        // Redirect to agency management dashboard
        navigate('/dashboard', { replace: true })
      } else {
        const msg = result.error || 'Login failed. Please check your credentials.'
        if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('admin')) {
          window.alert('This portal is for team members only (Recipients & Interview Coordinators). Administrators must use the /login page.')
        }
        setError(msg)
      }
    } catch (err) {
      const msg = err?.message || 'An unexpected error occurred. Please try again.'
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('admin')) {
        window.alert('This portal is for team members only (Recipients & Interview Coordinators). Administrators must use the /login page.')
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy/10 via-brand-blue-bright/5 to-brand-green-vibrant/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Language Switch - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitch variant="ghost" size="md" />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <img 
              src={logo} 
              alt="Udaan Sarathi Logo" 
              className="w-32 h-32 object-contain mb-2 drop-shadow-lg"
            />
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent dark:text-brand-blue-bright dark:bg-none">
              Member Portal
            </h1>
            {memberName ? (
              <div className="flex items-center gap-2 text-brand-navy dark:text-brand-blue-bright">
                <UserCheck className="w-5 h-5" />
                <p className="text-sm">Welcome, {memberName}!</p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">Recipients & Interview Coordinators</p>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {invitationToken ? 'Complete Your Setup' : 'Sign in to continue'}
            </CardTitle>
            {invitationToken && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                You've been invited to join the team. Please sign in to access your dashboard.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-700 dark:text-red-200 shadow-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username or Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter your username or phone"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-brand-navy dark:text-gray-400 dark:hover:text-brand-blue-bright transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    invitationToken ? 'Access Dashboard' : 'Sign In'
                  )}
                </button>
              </div>

              {invitationToken && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-200">
                  <p className="font-medium">Invitation Details:</p>
                  <p>You've been invited as a team member. After signing in, you'll have access to the agency management dashboard.</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Need help? Contact your agency administrator</p>
          <p className="mt-2">© {new Date().getFullYear()} Udaan Sarathi. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default MemberLogin