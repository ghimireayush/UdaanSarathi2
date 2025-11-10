import React from 'react'
import { Search, FileText, CheckCircle, Building2, Briefcase, Users } from 'lucide-react'

const HowItWorks = ({ t }) => {
  const jobSeekerSteps = [
    {
      icon: Search,
      titleKey: 'howItWorks.steps.search.title',
      descKey: 'howItWorks.steps.search.description',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: FileText,
      titleKey: 'howItWorks.steps.apply.title',
      descKey: 'howItWorks.steps.apply.description',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: CheckCircle,
      titleKey: 'howItWorks.steps.matched.title',
      descKey: 'howItWorks.steps.matched.description',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ]

  const agencySteps = [
    {
      icon: Building2,
      titleKey: 'howItWorks.steps.register.title',
      descKey: 'howItWorks.steps.register.description',
      color: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
    {
      icon: Briefcase,
      titleKey: 'howItWorks.steps.post.title',
      descKey: 'howItWorks.steps.post.description',
      color: 'from-pink-500 to-pink-600',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      icon: Users,
      titleKey: 'howItWorks.steps.manage.title',
      descKey: 'howItWorks.steps.manage.description',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    }
  ]

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        {/* For Job Seekers */}
        <div className="mb-20">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-12">
            {t('howItWorks.jobSeekers')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Lines (Desktop) */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200"></div>
            
            {jobSeekerSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative z-10">
                  <div className="flex flex-col items-center text-center">
                    <div className={`${step.iconBg} dark:bg-opacity-20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative`}>
                      <step.icon className={`w-10 h-10 ${step.iconColor}`} />
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {t(step.titleKey)}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t(step.descKey)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For Agencies */}
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-12">
            {t('howItWorks.agencies')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Lines (Desktop) */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-200 via-pink-200 to-orange-200"></div>
            
            {agencySteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative z-10">
                  <div className="flex flex-col items-center text-center">
                    <div className={`${step.iconBg} dark:bg-opacity-20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative`}>
                      <step.icon className={`w-10 h-10 ${step.iconColor}`} />
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-indigo-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {t(step.titleKey)}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t(step.descKey)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
