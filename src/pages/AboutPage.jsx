import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Briefcase, Shield, Smartphone, CheckCircle, Target } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import Navbar from "../components/public/Navbar";
import Footer from "../components/public/Footer";
import LoadingScreen from "../components/LoadingScreen";
import TranslationDataSource from "../api/datasources/TranslationDataSource.js";

const AboutPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("landing-language") || "en";
  });
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        const data = await TranslationDataSource.getPageTranslations(language, 'about');
        setTranslations(data);
      } catch (error) {
        console.error("Failed to load translations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTranslations();
  }, [language]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ne" : "en";
    setLanguage(newLang);
    localStorage.setItem("landing-language", newLang);
  };

  const t = (key) => {
    const keys = key.split(".");
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  if (isLoading || !showContent) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navbar */}
      <Navbar 
        isDarkMode={theme === 'dark'}
        toggleDarkMode={toggleTheme}
        language={language}
        toggleLanguage={toggleLanguage}
        t={t}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background with Nepal map */}
        <div className="absolute inset-0">
          <img 
            src="/nplc.png" 
            alt="Nepal Map Background" 
            className="absolute inset-0 w-full h-full object-cover scale-125 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#006BA3]/70 via-[#003E76]/60 to-[#56AF12]/50"></div>
          
          {/* Animated Blobs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
              {t("hero.title")}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              {t("hero.subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6">
              <Target className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t("mission.title")}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {t("mission.description")}
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t("problem.title")}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t("problem.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="group relative bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border-2 border-red-100/50 dark:border-gray-700 rounded-2xl p-8 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              <div className="absolute inset-0.5 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl -z-10"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {t("problem.workforce.title")}
                  </h3>
                </div>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-0.5">•</span>
                    <span>{t("problem.workforce.point1")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-0.5">•</span>
                    <span>{t("problem.workforce.point2")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl mt-0.5">•</span>
                    <span>{t("problem.workforce.point3")}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="group relative bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border-2 border-orange-100/50 dark:border-gray-700 rounded-2xl p-8 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              <div className="absolute inset-0.5 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl -z-10"></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-orange-50 dark:bg-orange-900/20 w-16 h-16 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {t("problem.agencies.title")}
                  </h3>
                </div>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-orange-500 text-xl mt-0.5">•</span>
                    <span>{t("problem.agencies.point1")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-500 text-xl mt-0.5">•</span>
                    <span>{t("problem.agencies.point2")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-500 text-xl mt-0.5">•</span>
                    <span>{t("problem.agencies.point3")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t("solution.title")}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t("solution.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border-2 border-blue-100/50 dark:border-gray-700 rounded-2xl p-8 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              <div className="absolute inset-0.5 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl -z-10"></div>
              
              <div className="relative">
                <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t("solution.mobile.title")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t("solution.mobile.description")}
                </p>
              </div>
            </div>

            <div className="group relative bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border-2 border-green-100/50 dark:border-gray-700 rounded-2xl p-8 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              <div className="absolute inset-0.5 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl -z-10"></div>
              
              <div className="relative">
                <div className="bg-green-50 dark:bg-green-900/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {t("solution.verified.title")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t("solution.verified.description")}
                </p>
              </div>
            </div>

            <div className="group relative bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border-2 border-purple-100/50 dark:border-gray-700 rounded-2xl p-8 hover:border-transparent hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              <div className="absolute inset-0.5 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl -z-10"></div>
              
              <div className="relative">
                <div className="bg-purple-50 dark:bg-purple-900/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {t("solution.transparent.title")}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t("solution.transparent.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-blue-50/20 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t("howItWorks.title")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Job Seekers */}
            <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-blue-100/50 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t("howItWorks.jobSeekers.title")}
                </h3>
              </div>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                      {num}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {t(`howItWorks.jobSeekers.step${num}.title`)}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {t(`howItWorks.jobSeekers.step${num}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Agencies */}
            <div className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-2xl p-8 shadow-lg border border-green-100/50 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-green-50 dark:bg-green-900/20 w-16 h-16 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t("howItWorks.agencies.title")}
                </h3>
              </div>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                      {num}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {t(`howItWorks.agencies.step${num}.title`)}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {t(`howItWorks.agencies.step${num}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#006BA3] via-[#003E76] to-[#56AF12]"></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in-up">
              {t("cta.title")}
            </h2>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              {t("cta.subtitle")}
            </p>
          </div>
          
          <div className="flex justify-center items-center animate-fade-in-up animation-delay-400">
            <Link
              to="/register"
              className="group relative px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all transform hover:scale-110 active:scale-95 shadow-2xl hover:shadow-[0_20px_60px_rgba(59,130,246,0.5)] flex items-center space-x-3 overflow-hidden animate-bounce-subtle hover:animate-none"
            >
              {/* Animated gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              
              <span className="relative group-hover:tracking-wide transition-all duration-300 group-hover:text-blue-700">
                {t("cta.getStarted")}
              </span>
              <ArrowLeft className="relative w-6 h-6 rotate-180 group-hover:translate-x-2 transition-transform duration-300 group-hover:scale-110" />
            </Link>
          </div>
        </div>
      </section>

      <Footer t={t} hideAboutLink={true} />
    </div>
  );
};

export default AboutPage;
