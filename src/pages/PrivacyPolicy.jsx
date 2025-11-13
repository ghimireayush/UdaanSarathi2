import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, Lock, Eye, Users, FileText, Globe, Bell, X } from 'lucide-react'

const PrivacyPolicy = () => {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const contentRef = useRef(null)

  const handleScroll = () => {
    const content = contentRef.current
    if (!content) return
    const progress = Math.min(
      1,
      content.scrollTop / (content.scrollHeight - content.clientHeight)
    )
    setScrollProgress(progress)
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const privacySections = [
    {
      icon: FileText,
      title: "Information We Collect",
      items: [
        {
          subtitle: "Personal Information",
          text: "Includes account details, profile information, identity verification, contact details, employment information, and communications."
        },
        {
          subtitle: "Information Collected Automatically",
          text: "Includes device information, usage data, location data, and cookies."
        },
        {
          subtitle: "Information from Third Parties",
          text: "May include data from recruitment agencies, social media, background checks, and references."
        }
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      items: [
        {
          subtitle: "Service Delivery",
          text: "We use the collected data for service delivery, communication, security, compliance, and improvement of user experience."
        }
      ]
    },
    {
      icon: Users,
      title: "Information Sharing and Disclosure",
      items: [
        {
          subtitle: "Sharing",
          text: "We may share your data with recruitment agencies, service providers, or when required by law, with your consent, or in case of business transfers."
        }
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      items: [
        {
          subtitle: "Security Measures",
          text: "We apply encryption, access controls, audits, and security training to safeguard data."
        }
      ]
    },
    {
      icon: Globe,
      title: "Cookies and Tracking Technologies",
      items: [
        {
          subtitle: "Cookie Usage",
          text: "We use cookies for functionality, analytics, preferences, and marketing. You can manage cookies in your browser settings."
        }
      ]
    },
    {
      icon: Shield,
      title: "Your Rights and Choices",
      items: [
        {
          subtitle: "Data Rights",
          text: "You can access, correct, delete, or export your data and manage consent through privacy@udaansarathi.com."
        }
      ]
    },
    {
      icon: Bell,
      title: "Data Retention",
      items: [
        {
          subtitle: "Retention Period",
          text: "Your data is retained as long as necessary for service, compliance, and legal requirements. Inactive accounts may be deleted after 2 years."
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/public"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Privacy Policy
              </h1>
            </div>
          </div>
        </div>
        {/* Scroll Progress Bar */}
        <div
          className="h-1 bg-blue-600 dark:bg-blue-500 transition-all duration-200"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Introduction */}
        <div className="mb-12">
          <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-blue-100/50 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Introduction
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last Updated: November 12, 2025
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Welcome to Udaan Sarathi ("we," "our," or "us"). We are committed to
              protecting your privacy and ensuring the security of your personal
              information. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our recruitment platform and
              services.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
              By using Udaan Sarathi, you agree to the collection and use of information
              in accordance with this policy.
            </p>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {privacySections.map((section, idx) => (
            <div
              key={idx}
              className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-blue-100/50 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
              </div>
              <div className="space-y-4">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx}>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {item.subtitle}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Sections */}
        <div className="mt-8 space-y-8">
          {/* Children's Privacy */}
          <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-blue-100/50 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Children's Privacy
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Our services are not intended for users under 18. We promptly delete any data collected from minors.
            </p>
          </div>

          {/* International Data Transfers */}
          <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-blue-100/50 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              International Data Transfers
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Your data may be processed outside Nepal with appropriate safeguards.
            </p>
          </div>

          {/* Third-Party Links */}
          <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-blue-100/50 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Third-Party Links
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Our platform may include links to third-party sites with independent privacy policies.
            </p>
          </div>

          {/* Changes to Policy */}
          <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-blue-100/50 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Privacy Policy
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We may update this policy periodically and will notify users through our platform or email.
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 shadow-lg border border-blue-200/50 dark:border-blue-700/50">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy
              or our data practices, please contact us:
            </p>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p><strong>Udaan Sarathi</strong></p>
              <p>Email: privacy@udaansarathi.com</p>
              <p>Phone: +977 1800-123-4567</p>
              <p>Address: Kathmandu, Nepal</p>
            </div>
          </div>
        </div>

        {/* Accept Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => setShowAcceptModal(true)}
            disabled={scrollProgress < 0.9}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all transform ${
              scrollProgress >= 0.9
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {scrollProgress >= 0.9 ? 'I Accept the Privacy Policy' : 'Scroll to Accept'}
          </button>
        </div>

        {/* Acknowledgment */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            By using Udaan Sarathi, you acknowledge that you have read and understood
            this Privacy Policy and agree to its terms.
          </p>
        </div>
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Privacy Policy Accepted
                </h3>
              </div>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thank you for reviewing our Privacy Policy. Your privacy and data security
              are important to us.
            </p>
            <div className="flex space-x-3">
              <Link
                to="/public"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-center transition-colors"
              >
                Return to Home
              </Link>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrivacyPolicy
