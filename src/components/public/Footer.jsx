import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'
import logo from '../../assets/logo.svg'

const Footer = ({ t }) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 dark:text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Main Footer Content */}
        <div className="text-center mb-12">
          {/* Logo and Tagline */}
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <img 
                src={logo} 
                alt="Udaan Sarathi Logo" 
                className="h-16 w-16 md:h-20 md:w-20"
              />
              <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-gray-100">
                Udaan Sarathi
              </h2>
            </div>
            <p className="text-lg text-gray-400 dark:text-gray-500 max-w-2xl mx-auto">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Social Media Icons */}
          <div className="flex justify-center space-x-4 mb-12">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gray-800 dark:bg-gray-900 rounded-full flex items-center justify-center hover:bg-[#006BA3] dark:hover:bg-[#56AF12] transition-all transform hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="w-6 h-6" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gray-800 dark:bg-gray-900 rounded-full flex items-center justify-center hover:bg-[#006BA3] dark:hover:bg-[#56AF12] transition-all transform hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gray-800 dark:bg-gray-900 rounded-full flex items-center justify-center hover:bg-[#006BA3] dark:hover:bg-[#56AF12] transition-all transform hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6" />
            </a>
          </div>

          {/* Download App Section */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-white dark:text-gray-100 mb-4">
              {t('footer.downloadApp')}
            </h3>
            <p className="text-gray-400 dark:text-gray-500 mb-6 max-w-md mx-auto">
              {t('footer.downloadSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="#"
                className="inline-flex items-center space-x-3 bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 rounded-xl px-6 py-3 transition-all transform hover:scale-105"
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-400">{t('footer.downloadOn')}</div>
                  <div className="text-base font-semibold text-white">{t('footer.appStore')}</div>
                </div>
              </a>
              <a
                href="#"
                className="inline-flex items-center space-x-3 bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 rounded-xl px-6 py-3 transition-all transform hover:scale-105"
              >
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-400 dark:text-gray-500">{t('footer.getItOn')}</div>
                  <div className="text-base font-semibold text-white dark:text-gray-100">{t('footer.playStore')}</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-800 dark:border-gray-900 pt-8 mb-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 text-sm">
            <a href="mailto:contact@udaansarathi.com" className="flex items-center space-x-2 hover:text-[#56AF12] transition-colors">
              <Mail className="w-5 h-5 text-[#006BA3] dark:text-[#56AF12]" />
              <span>info@udaansarathi.com</span>
            </a>
            <a href="tel:+911800123456" className="flex items-center space-x-2 hover:text-[#56AF12] transition-colors">
              <Phone className="w-5 h-5 text-[#006BA3] dark:text-[#56AF12]" />
              <span>+977 9800000000</span>
            </a>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[#006BA3] dark:text-[#56AF12]" />
              <span>Kathmandu,Nepal</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 dark:border-gray-900 pt-8">
          <p className="text-gray-500 dark:text-gray-600 text-sm text-center">
            © {currentYear} {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
