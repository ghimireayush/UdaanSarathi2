import React from 'react'
import { Calendar, Users, FileText, BarChart3, Smartphone, Shield } from 'lucide-react'

const Features = ({ t }) => {
  const features = [
    {
      icon: Calendar,
      titleKey: 'features.items.scheduling.title',
      descKey: 'features.items.scheduling.description',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Users,
      titleKey: 'features.items.management.title',
      descKey: 'features.items.management.description',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: FileText,
      titleKey: 'features.items.feedback.title',
      descKey: 'features.items.feedback.description',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: BarChart3,
      titleKey: 'features.items.analytics.title',
      descKey: 'features.items.analytics.description',
      color: 'from-pink-500 to-pink-600',
      iconBg: 'bg-pink-50',
      iconColor: 'text-pink-600'
    },
    {
      icon: Smartphone,
      titleKey: 'features.items.mobile.title',
      descKey: 'features.items.mobile.description',
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      icon: Shield,
      titleKey: 'features.items.secure.title',
      descKey: 'features.items.secure.description',
      color: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600'
    }
  ]

  return (
    <section id="features" className="py-16 md:py-24 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border-2 border-blue-100/50 dark:border-gray-700 rounded-2xl p-8 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Gradient Border on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10`}></div>
              <div className="absolute inset-0.5 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl -z-10"></div>

              <div className="relative">
                <div className={`${feature.iconBg} dark:bg-opacity-20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t(feature.titleKey)}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
