import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, Users, Lock, AlertCircle, Scale, Globe, ChevronDown, ChevronUp, X } from 'lucide-react'
import logo from '../assets/logo.svg'

const TermsPage = () => {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const contentRef = useRef(null)

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

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

  const termsSections = [
    {
      icon: Users,
      title: "1. Eligibility",
      items: [
        {
          subtitle: "Requirements",
          text: "To use Udaan Sarathi, you must: Be at least 18 years old, provide accurate and truthful information, use the platform only for lawful purposes, and not be suspended or banned from using similar platforms."
        }
      ]
    },
    {
      icon: Lock,
      title: "2. User Accounts",
      items: [
        {
          subtitle: "Account Creation",
          text: "You must create an account to access certain features. You agree to provide accurate, complete, and updated information during registration."
        },
        {
          subtitle: "Account Security",
          text: "You are responsible for maintaining the confidentiality of your account login credentials and all activity that occurs under your account. We are not liable for unauthorized access caused by your failure to secure your credentials."
        },
        {
          subtitle: "Account Termination",
          text: "We may suspend or terminate your account if you violate these Terms, provide false or misleading information, or engage in fraudulent or harmful behavior. You may delete your account at any time."
        }
      ]
    },
    {
      icon: AlertCircle,
      title: "3. Use of the Service",
      items: [
        {
          subtitle: "Acceptable Use",
          text: "You agree to use Udaan Sarathi legally and ethically. You must not upload false or misleading information, impersonate any person or entity, submit fake applications or fraudulent documents, attempt to hack, disrupt, or bypass security measures, use the platform for any unauthorized commercial purpose, or harvest, scrape, or misuse user data. Violation may lead to termination and potential legal action."
        }
      ]
    },
    {
      icon: FileText,
      title: "4. Services Provided",
      items: [
        {
          subtitle: "Platform Features",
          text: "Udaan Sarathi offers job search and application tools, profile creation and resume sharing, communication tools for job seekers and recruitment agencies, and interview coordination and application tracking. We are not responsible for hiring decisions made by recruitment agencies or employers."
        }
      ]
    },
    {
      icon: FileText,
      title: "5. User Content",
      items: [
        {
          subtitle: "What You Provide",
          text: "You may upload content such as resume/CV, professional information, documents, and messages and feedback."
        },
        {
          subtitle: "License You Grant Us",
          text: "By uploading content, you grant Udaan Sarathi a non-exclusive, royalty-free, worldwide license to use your information for providing the service, sharing with recruitment agencies, and improving the platform. We do not sell your data."
        }
      ]
    },
    {
      icon: Users,
      title: "6. Recruitment Agencies & Third Parties",
      items: [
        {
          subtitle: "Information Sharing",
          text: "When you apply for a job, your profile, resume, and relevant information will be shared with the recruitment agency or employer. They may contact you directly and may conduct background checks with your consent."
        },
        {
          subtitle: "Our Responsibility",
          text: "Udaan Sarathi is not responsible for decisions made by recruiters, accuracy of job information posted by agencies, or communication between you and third parties."
        }
      ]
    },
    {
      icon: Globe,
      title: "7. Payments (If Applicable)",
      items: [
        {
          subtitle: "Current Status",
          text: "Udaan Sarathi currently offers free services. If premium features are introduced later, you will be informed before payment is required, all pricing and billing details will be clearly displayed, and payments are non-refundable unless stated otherwise."
        }
      ]
    },
    {
      icon: Shield,
      title: "8. Intellectual Property Rights",
      items: [
        {
          subtitle: "Platform Ownership",
          text: "All content on Udaan Sarathi—including logos, branding, text, design, and technology—is the property of Udaan Sarathi. You agree not to copy, modify, distribute, reverse-engineer, or reproduce any content without permission."
        }
      ]
    },
    {
      icon: Lock,
      title: "9. Privacy",
      items: [
        {
          subtitle: "Privacy Policy",
          text: "Your use of Udaan Sarathi is also governed by our Privacy Policy. By using the Service, you agree to how we collect, store, use, and share your personal information."
        }
      ]
    },
    {
      icon: AlertCircle,
      title: "10. Limitation of Liability",
      items: [
        {
          subtitle: "Disclaimer",
          text: "Udaan Sarathi is not liable for hiring outcomes, decisions made by employers or agencies, loss of data due to external factors, technical issues, outages, or interruptions, or any damages resulting from misuse of the platform. Your use of the platform is at your own risk."
        }
      ]
    },
    {
      icon: Shield,
      title: "11. Indemnification",
      items: [
        {
          subtitle: "Your Responsibility",
          text: "You agree to indemnify and hold harmless Udaan Sarathi and its team from any claims, liabilities, or damages arising from your use of the platform, your violation of these Terms, or your interactions with recruitment agencies or employers."
        }
      ]
    },
    {
      icon: FileText,
      title: "12. Changes to the Service",
      items: [
        {
          subtitle: "Service Updates",
          text: "We may modify, update, improve, add or remove features at any time without prior notice."
        }
      ]
    },
    {
      icon: FileText,
      title: "13. Changes to These Terms",
      items: [
        {
          subtitle: "Terms Updates",
          text: "We may update these Terms. If significant changes occur, we will notify you by email or display a notice on the platform. Continued use of the Service after changes indicates your acceptance."
        }
      ]
    },
    {
      icon: Scale,
      title: "14. Governing Law",
      items: [
        {
          subtitle: "Legal Jurisdiction",
          text: "These Terms are governed by the laws of Nepal. Any disputes shall be resolved in the courts of Kathmandu, Nepal."
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
            <div className="flex items-center space-x-3">
              <img
                src={logo}
                alt="Udaan Sarathi Logo"
                className="h-14 w-14 object-contain"
              />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Terms & Conditions
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
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
              Welcome to Udaan Sarathi ("we," "our," or "us"). These Terms & Conditions ("Terms") govern your access to and use of our recruitment platform, website, and related services ("Service").
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
              By creating an account or using Udaan Sarathi, you agree to comply with and be bound by these Terms. If you do not agree, please do not use our Service.
            </p>
          </div>
        </div>

        {/* Terms Sections - Interactive Tiles */}
        <div className="space-y-4">
          {termsSections.map((section, idx) => (
            <div
              key={idx}
              className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl shadow-lg border border-blue-100/50 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Tile Header - Clickable */}
              <button
                onClick={() => toggleSection(idx)}
                className="w-full flex items-center justify-between p-6 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <section.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white text-left">
                    {section.title}
                  </h3>
                </div>
                <div className="flex-shrink-0">
                  {expandedSections[idx] ? (
                    <ChevronUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
              </button>

              {/* Tile Content - Expandable */}
              {expandedSections[idx] && (
                <div className="px-6 pb-6 space-y-4 animate-fade-in-up">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {item.subtitle}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Acknowledgment */}
        <div className="mt-12 text-center">
          <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-blue-100/50 dark:border-gray-700">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              By using Udaan Sarathi, you acknowledge that you have read and understood these Terms & Conditions and agree to be bound by them.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              By registering and logging into the system, you acknowledge that you have read and understood these Terms & Conditions and agree to comply with them.
            </p>
          </div>
        </div>
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Terms Accepted
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
              Thank you for reviewing our Terms & Conditions. Your compliance helps us maintain a safe and effective platform.
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

export default TermsPage
