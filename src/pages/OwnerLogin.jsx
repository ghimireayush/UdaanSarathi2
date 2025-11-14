import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import LanguageSwitch from '../components/LanguageSwitch'
import { useLanguage } from '../hooks/useLanguage'
import LoadingScreen from '../components/LoadingScreen'
import logo from '../assets/logo.svg'

const OwnerLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const { ownerLogin, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { tPageSync, isLoading: languageLoading } = useLanguage({ 
    pageName: 'owner-login', 
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

  // Session timeout (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000

  // Load saved credentials if "Remember Me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem('owner_email')
    const savedRememberMe = localStorage.getItem('owner_remember_me') === 'true'
    
    if (savedRememberMe && savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // If user is owner, redirect to owner dashboard
      if (user.isOwner || user.id === 'user_owner' || user.email === 'owner@udaan.com') {
        const from = location.state?.from?.pathname || '/owner/dashboard'
        navigate(from, { replace: true })
      } else {
        // Non-owner trying to access owner portal - redirect to appropriate portal
        if (user.role === 'admin') {
          navigate('/dashboard', { replace: true })
        } else if (user.role === 'recipient' || user.role === 'interview-coordinator') {
          navigate('/dashboard', { replace: true })
        }
      }
    }
  }, [isAuthenticated, user, navigate, location])

  // Setup session timeout monitoring
  useEffect(() => {
    if (!isAuthenticated) return

    let timeoutId
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)
      
      timeoutId = setTimeout(() => {
        handleSessionTimeout()
      }, SESSION_TIMEOUT)
    }

    const handleSessionTimeout = () => {
      localStorage.removeItem('udaan_user')
      localStorage.removeItem('udaan_token')
      setError(tPage('messages.sessionExpired'))
      window.location.href = '/owner/login'
    }

    // Monitor user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetTimeout)
    })

    resetTimeout()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout)
      })
    }
  }, [isAuthenticated])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!email.trim()) {
      setError(tPage('validation.emailRequired'))
      setLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setError(tPage('validation.emailInvalid'))
      setLoading(false)
      return
    }

    if (!password) {
      setError(tPage('validation.passwordRequired'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(tPage('validation.passwordMinLength'))
      setLoading(false)
      return
    }

    try {
      // Use ownerLogin method specifically for owner portal
      const result = await ownerLogin(email, password)

      // Handle "Remember Me"
      if (rememberMe) {
        localStorage.setItem('owner_email', email)
        localStorage.setItem('owner_remember_me', 'true')
      } else {
        localStorage.removeItem('owner_email')
        localStorage.removeItem('owner_remember_me')
      }

      // Store session start time
      localStorage.setItem('session_start', Date.now().toString())

      // Redirect to owner dashboard
      const from = location.state?.from?.pathname || '/owner/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.message || tPage('messages.unexpectedError')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Show loading screen while translations are loading or minimum time hasn't passed
  if (languageLoading || !showContent) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy/10 via-brand-blue-bright/5 to-brand-green-vibrant/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Language Switch - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitch variant="ghost" size="md" />
      </div>

      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <img
              src={logo}
              alt={tPage('branding.logoAlt')}
              className="w-40 h-40 object-contain mb-2 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-brand-navy to-brand-blue-bright bg-clip-text text-transparent dark:text-brand-blue-bright dark:bg-none">
              {tPage('branding.appName')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{tPage('branding.portalName')}</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">{tPage('title')}</CardTitle>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tPage('subtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div 
                  className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm text-red-700 dark:text-red-200 shadow-sm"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {tPage('form.email.label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder={tPage('form.email.placeholder')}
                    aria-describedby={error ? "email-error" : undefined}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {tPage('form.password.label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright backdrop-blur-sm bg-white/50 dark:bg-gray-700/50 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder={tPage('form.password.placeholder')}
                    aria-describedby={error ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-brand-navy dark:text-gray-400 dark:hover:text-brand-blue-bright transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? tPage('form.hidePassword') : tPage('form.showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand-blue-bright focus:ring-brand-blue-bright focus:ring-offset-2 dark:focus:ring-offset-gray-800 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded cursor-pointer transition-colors"
                />
                <label 
                  htmlFor="remember-me" 
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                >
                  {tPage('form.rememberMe')}
                </label>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg 
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {tPage('form.submitting')}
                    </span>
                  ) : (
                    tPage('form.submit')
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            {tPage('footer.secureConnection')}
          </p>
          <p>{tPage('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </div>
  )
}

export default OwnerLogin
