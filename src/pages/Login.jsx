import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { User, Lock, ArrowLeft, Moon, Sun } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import OTPInput from '../components/ui/OTPInput'
import LanguageSwitch from '../components/LanguageSwitch'
import { useLanguage } from '../hooks/useLanguage'
import LoadingScreen from '../components/LoadingScreen'
import logo from '../assets/logo.svg'

const Login = () => {
  const [username, setUsername] = useState('')
  const [otp, setOtp] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [devOtp, setDevOtp] = useState('')
  const { ownerLoginStart, ownerLoginVerify, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { tPageSync, isLoading: languageLoading } = useLanguage({ 
    pageName: 'login', 
    autoLoad: true 
  })

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
      const result = await ownerLoginStart({ phone: username })
      setOtpSent(true)
      setResendTimer(30)
      setDevOtp(result?.dev_otp || '')
      setError('')
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please try again.')
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
      const result = await ownerLoginVerify({ phone: username, otp })
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.message || tPage('messages.unexpectedError')
      if (msg.includes('Access Denied') || msg.toLowerCase().includes('administrator')) {
        window.alert(tPage('messages.accessDenied'))
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
              className="w-40 h-40 object-contain mb-2 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent dark:text-brand-blue-bright dark:bg-none">{tPage('branding.appName')}</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">{tPage('title')}</CardTitle>
            
            {/* Login Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mt-4">
              <button
                type="button"
                className="flex-1 py-2 px-4 rounded-md font-medium transition-all bg-white dark:bg-gray-800 text-brand-navy dark:text-brand-blue-bright shadow-sm"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => navigate('/login/member')}
                className="flex-1 py-2 px-4 rounded-md font-medium transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
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
                          setOtpSent(false) // Reset OTP sent status when phone changes
                        }
                      }}
                      className="block w-full pl-10 pr-3 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      placeholder="9801234567"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || username.length !== 10 || resendTimer > 0}
                    className="px-4 py-3 bg-brand-blue-bright hover:bg-brand-navy text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {sendingOtp ? 'Sending...' : resendTimer > 0 ? `${resendTimer}s` : otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </div>
                {otpSent && (
                  <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                    <p>✓ OTP sent successfully! Check your phone.</p>
                    {devOtp && (
                      <p className="mt-1 text-gray-500 dark:text-gray-300">
                        Dev OTP: <span className="font-mono font-semibold">{devOtp}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  Enter 6 Digit OTP
                </label>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                  autoFocus={otpSent}
                  disabled={loading}
                  className="mb-3"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
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
                    tPage('form.submit')
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

            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            {tPage('footer.noAccount')}{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-brand-blue-bright hover:text-brand-navy dark:hover:text-brand-blue-bright/80 transition-colors underline-offset-2 hover:underline"
            >
              {tPage('footer.signUp')}
            </button>
          </p>
          <p className="mt-2">{tPage('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </div>
  )
}

export default Login