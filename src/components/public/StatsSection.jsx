import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Briefcase, MapPin } from 'lucide-react'
import AnimatedCounter from './AnimatedCounter'

const StatsSection = ({ t }) => {
  const [stats, setStats] = useState({
    totalPlacements: 12547,
    totalAgencies: 234,
    activeJobs: 1892,
    citiesCovered: 50
  })

  useEffect(() => {
    // Fetch stats from backend
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/public/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Use default values on error
      }
    }
    
    // Uncomment when API is ready
    // fetchStats()
  }, [])

  const statItems = [
    {
      icon: TrendingUp,
      value: stats.totalPlacements,
      labelKey: 'stats.placements',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: Users,
      value: stats.totalAgencies,
      labelKey: 'stats.agencies',
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: Briefcase,
      value: stats.activeJobs,
      labelKey: 'stats.jobs',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      icon: MapPin,
      value: stats.citiesCovered,
      labelKey: 'stats.cities',
      color: 'from-pink-500 to-pink-600',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('stats.title')}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('stats.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              
              <div className="relative">
                <div className={`${stat.iconBg} dark:bg-opacity-20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-8 h-8 ${stat.iconColor} dark:text-opacity-90`} />
                </div>
                
                <AnimatedCounter
                  end={stat.value}
                  duration={2000}
                  suffix="+"
                  className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2"
                />
                
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  {t(stat.labelKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
