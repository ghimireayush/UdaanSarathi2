import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, ArrowLeft, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitch from '../components/LanguageSwitch'
import { useLanguage } from '../hooks/useLanguage'
import logo from '../assets/logo.svg'

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOtpField, setShowOtpField] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [registrationData, setRegistrationData] = useState(null)
  
  const navigate = useNavigate()
  const { register } = useAuth()
  const { locale, tPageSync, loadPageTranslations, isLoading: languageLoading } = useLanguage({ 
    pageName: 'register', 
    autoLoad: true 
  })

  // Helper function to get page translations
  const tPage = (key, params = {}) => {
    return tPageSync(key, params)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate form
    if (!/^\d{10}$/.test(formData.phone)) {
      setError(tPage('messages.invalidPhone'))
      return
    }

    setLoading(true)
    
    try {
      // Simulate sending OTP to phone number
      // In real implementation, this would call an API to send OTP
      console.log(`Sending OTP to ${formData.phone}`)
      
      // Store registration data for later use
      setRegistrationData(formData)
      
      // Show OTP field
      setShowOtpField(true)
      setError('')
      
      // Simulate OTP sent success message
      setTimeout(() => {
        setError('')
      }, 100)
      
    } catch (err) {
      setError(err.message || tPage('messages.failedToSendOtp'))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!otp || otp.length !== 6) {
      setError(tPage('messages.invalidOtp'))
      return
    }

    setOtpLoading(true)
    
    try {
      // Simulate OTP verification
      // In real implementation, this would verify OTP with backend
      if (otp === '123456') { // Mock OTP for demo
        const result = await register(registrationData)
        // After successful OTP verification, redirect to company setup
        navigate('/setup-company', { 
          state: { userId: result.user.id }
        })
      } else {
        setError(tPage('messages.incorrectOtp'))
      }
    } catch (err) {
      setError(err.message || tPage('messages.failedToVerifyOtp'))
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOtp = () => {
    setError('')
    console.log(`Resending OTP to ${registrationData.phone}`)
    // In real implementation, this would call API to resend OTP
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy/10 via-brand-blue-bright/5 to-brand-green-vibrant/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Language Switch - Top Right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitch variant="ghost" size="md" />
      </div>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/login')}
            className="absolute top-4 left-4 p-2 text-gray-600 hover:text-brand-navy dark:text-gray-400 dark:hover:text-brand-blue-bright transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <div className="flex flex-col items-center mb-4">
            <img 
              src={logo} 
              alt={tPage('branding.logoAlt')} 
              className="w-24 h-24 object-contain mb-2"
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tPage('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{tPage('subtitle')}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {showOtpField ? tPage('steps.verifyPhone') : tPage('steps.personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showOtpField ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                    {tPage('form.fullName.label')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                      placeholder={tPage('form.fullName.placeholder')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                    {tPage('form.phone.label')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                      placeholder={tPage('form.phone.placeholder')}
                      pattern="[0-9]{10}"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright dark:focus:ring-offset-gray-800 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {tPage('form.registering')}
                      </span>
                    ) : (
                      tPage('form.register')
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4 dark:text-gray-400">
                  {tPage('legal.terms')}
                </p>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200">
                    {error}
                  </div>
                )}

                <div className="text-center mb-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 mb-4 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200">
                    {tPage('messages.otpSent', { phone: registrationData?.phone })}
                  </div>
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    {tPage('messages.enterOtp')}
                  </p>
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                    {tPage('form.otp.label')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright text-center text-lg tracking-widest dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                      placeholder={tPage('form.otp.placeholder')}
                      maxLength={6}
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowOtpField(false)}
                    className="flex-1 py-3 px-5 border border-gray-300 rounded-lg shadow-sm text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
                  >
                    {tPage('form.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading || otp.length !== 6}
                    className="flex-1 flex justify-center py-3 px-5 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright dark:focus:ring-offset-gray-800 disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {tPage('form.verifying')}
                      </span>
                    ) : (
                      tPage('form.verifyOtp')
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-base text-brand-navy hover:text-brand-navy/80 font-semibold dark:text-brand-blue-bright dark:hover:text-brand-blue-bright/80"
                  >
                    {tPage('actions.resendOtp')}
                  </button>
                </div>

              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Register