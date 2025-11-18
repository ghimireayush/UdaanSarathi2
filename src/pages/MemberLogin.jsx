import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import { User, Lock, ArrowLeft, UserCheck, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import LanguageSwitch from '../components/LanguageSwitch'
import { useLanguage } from '../hooks/useLanguage'
import LoadingScreen from '../components/LoadingScreen'
import logo from '../assets/logo.svg'

const MemberLogin = () => {
  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const { memberLogin, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { tPageSync, isLoading: languageLoading } = useLanguage({ 
    pageName: 'member-login', 
    autoLoad: true 
  })
  
  // Get invitation token from URL if present
  const invitationToken = searchParams.get('token')
  const memberName = searchParams.get('name')

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  // Minimum loading screen display time
  useEffect(() => {
    if (!languageLoading) {
      const timer = setTimeout(() => {
        setShowContent(true)
      }, 300) // 0.3 second minimum display time
      
      return () => clearTimeout(timer)
    }
  }, [languageLoading])

  // Resend OTP timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Check if user is an owner - redirect to owner portal
      const storedUser = localStorage.getItem('udaan_user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        if (userData.isOwner || userData.id === 'user_owner' || userData.email === 'owner@udaan.com') {
          navigate('/owner/dashboard', { replace: true })
          return
        }
      }
      
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Show loading screen while translations are loading or minimum time hasn't passed
  if (languageLoading || !showContent) {
    return <LoadingScreen />
  }
  
  const handleSendOtp = async () => {
    if (!username || username.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setSendingOtp(true)
    setError('')

    try {
      // Simulate OTP sending (in production, this would call your backend)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setOtpSent(true)
      setResendTimer(30) // 30 seconds cooldown
      setError('')
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Validate phone number
    if (!username || username.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      setLoading(false)
      return
    }

    // Validate OTP format
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP')
      setLoading(false)
      return
    }
    
    try {
      // For now, using OTP as password until backend is updated
      const result = await memberLogin(username, otp, invitationToken)
      if (result.success) {
        // Redirect to agency management dashboard
        navigate('/dashboard', { replace: true })
      } else {
        const msg = result.error || tPage('messages.loginFailed')
        if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('admin')) {
          window.alert(tPage('messages.unauthorizedAccess'))
        }
        setError(msg)
      }
    } catch (err) {
      const msg = err?.message || tPage('messages.unexpectedError')
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('admin')) {
        window.alert(tPage('messages.unauthorizedAccess'))
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy/10 via-brand-blue-bright/5 to-brand-green-vibrant/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Back Button - Top Left */}
      <div className="absolute top-4 left-4">
        <Link
          to="/public"
          className="group flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </Link>
      </div>

      {/* Language Switch and Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 transition-all shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
        <LanguageSwitch variant="ghost" size="md" />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <img 
              src={logo} 
              alt={tPage('branding.logoAlt')} 
              className="w-32 h-32 object-contain mb-2 drop-shadow-lg"
            />
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent dark:text-brand-blue-bright dark:bg-none">
              {tPage('title')}
            </h1>
            {memberName ? (
              <div className="flex items-center gap-2 text-brand-navy dark:text-brand-blue-bright">
                <UserCheck className="w-5 h-5" />
                <p className="text-sm">{tPage('welcome.withName', { name: memberName })}</p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">{tPage('subtitle')}</p>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {invitationToken ? tPage('cardTitle.withInvitation') : tPage('cardTitle.default')}
            </CardTitle>
            {invitationToken && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {tPage('invitationMessage')}
              </p>
            )}
            
            {/* Login Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 py-2 px-4 rounded-md font-medium transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                Admin
              </button>
              <button
                type="button"
                className="flex-1 py-2 px-4 rounded-md font-medium transition-all bg-white dark:bg-gray-800 text-brand-navy dark:text-brand-blue-bright shadow-sm"
              >
                Member
              </button>
            </div>
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
                  Phone Number (10 digits)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="tel"
                      inputMode="numeric"
                      pattern="\d{10}"
                      maxLength={10}
                      required
                      value={username}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setUsername(value)
                        if (value.length === 10) {
                          setOtpSent(false)
                        }
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="9801111111"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || username.length !== 10 || resendTimer > 0}
                    className="px-4 py-2 bg-brand-blue-bright hover:bg-brand-navy text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {sendingOtp ? 'Sending...' : resendTimer > 0 ? `${resendTimer}s` : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </div>
                {otpSent && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                    ✓ OTP sent successfully! Check your phone.
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  6-Digit OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setOtp(value)
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the 6-digit OTP sent to your registered contact
                </p>
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
                      {tPage('form.submitting')}
                    </span>
                  ) : (
                    invitationToken ? tPage('form.submit.withInvitation') : tPage('form.submit.default')
                  )}
                </button>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand-blue-bright focus:ring-brand-blue-bright border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Remember me
                </label>
              </div>

              {invitationToken && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-200">
                  <p className="font-medium">{tPage('invitationDetails.title')}</p>
                  <p>{tPage('invitationDetails.description')}</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            <button
              onClick={() => setShowHelpModal(true)}
              className="text-brand-blue-bright hover:text-brand-navy dark:hover:text-brand-blue-bright/80 transition-colors underline-offset-2 hover:underline"
            >
              Need Help?
            </button>
          </p>
          <p className="mt-2">{tPage('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Need Help?</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400">
                Contact your agency administrator for assistance with login or account issues.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-brand-blue-bright hover:bg-brand-navy text-white rounded-lg transition-colors font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberLogin