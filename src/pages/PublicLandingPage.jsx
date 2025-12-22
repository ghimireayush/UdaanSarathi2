import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { isOwnerRole, needsAgencySetup } from "../utils/roleHelpers.js";
import Navbar from "../components/public/Navbar";
import HeroSection from "../components/public/HeroSection";
import StatsSection from "../components/public/StatsSection";
import AgencySearch from "../components/public/AgencySearchNew";
import HowItWorks from "../components/public/HowItWorks";
import Features from "../components/public/Features";
import Footer from "../components/public/Footer";
import LoadingScreen from "../components/LoadingScreen";

const PublicLandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("landing-language") || "ne";
  });
  const [translations, setTranslations] = useState({});
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [stats, setStats] = useState(null);

  // Redirect logged-in users to their appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user is an owner
      if (isOwnerRole(user)) {
        // Check if they have an agency
        if (needsAgencySetup(user)) {
          navigate('/setup-company', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Member or other user types go to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Load translations and stats
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [translationsRes, statsRes] = await Promise.all([
          fetch(`/translations/${language}/pages/landing.json`),
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/analytics/landing-stats`)
        ]);
        
        if (translationsRes.ok) {
          const data = await translationsRes.json();
          setTranslations(data);
        }
        
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [language]);

  // Minimum loading screen display time
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300); // 0.3 second minimum display time
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Handle hash scrolling after content is loaded
  useEffect(() => {
    if (showContent && window.location.hash) {
      // Wait a bit for the page to fully render
      const timer = setTimeout(() => {
        const hash = window.location.hash.substring(1);
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [showContent]);

  const toggleLanguage = () => {
    const newLang = language === "ne" ? "en" : "ne";
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

  const scrollToSearch = () => {
    document
      .getElementById("agency-search")
      ?.scrollIntoView({ behavior: "smooth" });
  };



  // Show loading screen while translations are loading or minimum time hasn't passed
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

      {/* Page Sections */}
      <HeroSection onSearchClick={scrollToSearch} t={t} stats={stats} />
      <StatsSection t={t} stats={stats} />
      <AgencySearch t={t} />
      <HowItWorks t={t} />
      <Features t={t} />
      <Footer t={t} />

      {/* Download Modal */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Download Udaan Sarathi
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get the Udaan Sarathi app to access all features and find your
                  perfect job
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <a
                  href="#"
                  className="flex items-center justify-center space-x-3 bg-black hover:bg-gray-800 rounded-xl px-6 py-3 transition-all transform hover:scale-105 w-full"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-300">Download on the</div>
                    <div className="text-base font-semibold text-white">
                      App Store
                    </div>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center justify-center space-x-3 bg-black hover:bg-gray-800 rounded-xl px-6 py-3 transition-all transform hover:scale-105 w-full"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-300">Get it on</div>
                    <div className="text-base font-semibold text-white">
                      Google Play
                    </div>
                  </div>
                </a>
              </div>

              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicLandingPage;
