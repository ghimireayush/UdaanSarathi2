import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Moon, Sun, Globe } from 'lucide-react'
import logo from '../../assets/logo.svg'

const Navbar = ({ isDarkMode, toggleDarkMode, language, toggleLanguage, t }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogoClick = () => {
    navigate('/public')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-lg' 
          : 'bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm'
      } py-3`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div
            onClick={handleLogoClick}
            className="cursor-pointer hover:opacity-80 transition-opacity flex items-center space-x-3"
          >
            <img
              src={logo}
              alt="UDAAN Logo"
              className="h-12 w-auto object-cover"
            />
            <span
              className={`text-xl font-bold ${
                isScrolled
                  ? 'text-gray-800 dark:text-gray-200'
                  : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              Udaan Sarathi
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/about"
              className={`transition-colors ${
                isActive('/about')
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : isScrolled
                  ? 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  : 'text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {t('nav.about')}
            </Link>
            <a
              href="/public#how-it-works"
              className={`transition-colors ${
                isScrolled
                  ? 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  : 'text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {t('nav.howItWorks')}
            </a>
            <a
              href="/public#features"
              className={`transition-colors ${
                isScrolled
                  ? 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  : 'text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {t('nav.features')}
            </a>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : 'bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-600/50'
              }`}
              aria-label="Toggle language"
            >
              <Globe
                className={`w-4 h-4 ${
                  isScrolled
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  isScrolled
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
              >
                {language === 'en' ? 'नेपाली' : 'English'}
              </span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : 'bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-600/50'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun
                  className={`w-5 h-5 ${
                    isScrolled
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                />
              ) : (
                <Moon
                  className={`w-5 h-5 ${
                    isScrolled
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                />
              )}
            </button>

            <Link
              to="/login"
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
            >
              {t('nav.login')}
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Language Toggle - Mobile */}
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : 'bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-600/50'
              }`}
              aria-label="Toggle language"
            >
              <Globe
                className={`w-5 h-5 ${
                  isScrolled
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
              />
            </button>

            {/* Dark Mode Toggle - Mobile */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${
                isScrolled
                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : 'bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-600/50'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun
                  className={`w-5 h-5 ${
                    isScrolled
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                />
              ) : (
                <Moon
                  className={`w-5 h-5 ${
                    isScrolled
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg
                className={`w-6 h-6 ${
                  isScrolled
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 space-y-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 mx-4">
          <Link
            to="/about"
            className={`block ${
              isActive('/about')
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('nav.about')}
          </Link>
          <a
            href="/public#how-it-works"
            className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('nav.howItWorks')}
          </a>
          <a
            href="/public#features"
            className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('nav.features')}
          </a>
          <Link
            to="/login"
            className="block px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('nav.login')}
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar