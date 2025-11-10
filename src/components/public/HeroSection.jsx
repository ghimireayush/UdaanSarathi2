import React from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import AnimatedCounter from './AnimatedCounter'

const HeroSection = ({ onSearchClick, t }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up">
          {t('hero.title')}
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
          {t('hero.subtitle')}
        </p>

        {/* Key Metric Display */}
        <div className="mb-12 animate-fade-in-up animation-delay-400">
          <div className="inline-block bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl px-8 py-6 border border-white border-opacity-20">
            <div className="text-blue-100 text-sm md:text-base mb-2 uppercase tracking-wide">
              {t('hero.metricLabel')}
            </div>
            <AnimatedCounter end={12547} duration={2500} suffix="+" className="text-5xl md:text-6xl font-bold text-white" />
            <div className="text-blue-200 text-sm md:text-base mt-2">
              {t('hero.livesTransformed')}
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center items-center animate-fade-in-up animation-delay-600">
          <button
            onClick={onSearchClick}
            className="group px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all transform hover:scale-110 active:scale-95 shadow-xl hover:shadow-2xl flex items-center space-x-2 animate-bounce-subtle hover:animate-none"
          >
            <Search className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span className="group-hover:tracking-wide transition-all duration-300">{t('hero.ctaPrimary')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
