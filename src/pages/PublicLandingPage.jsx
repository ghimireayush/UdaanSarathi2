import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Globe } from "lucide-react";
import HeroSection from "../components/public/HeroSection";
import StatsSection from "../components/public/StatsSection";
import AgencySearch from "../components/public/AgencySearch";
import HowItWorks from "../components/public/HowItWorks";
import Features from "../components/public/Features";
import Footer from "../components/public/Footer";
import logo from "../assets/logo.svg";

const PublicLandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem("landing-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("landing-language") || "en";
  });
  const [translations, setTranslations] = useState({});
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("landing-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("landing-theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Load translations
    const loadTranslations = async () => {
      try {
        const response = await fetch(
          `/translations/${language}/pages/landing.json`
        );
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
        }
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
    };
    loadTranslations();
  }, [language]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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

  const scrollToSearch = () => {
    document
      .getElementById("agency-search")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Sticky Navbar with Liquid Glassmorphism */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "glass-navbar shadow-lg py-4" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={logo}
                alt="Udaan Sarathi Logo"
                className="h-12 w-12 md:h-16 md:w-16 object-contain"
              />
              <div
                className={`text-xl md:text-2xl font-bold transition-colors ${
                  isScrolled ? "text-blue-600 dark:text-blue-400" : "text-white"
                }`}
              >
                Udaan Sarathi
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#how-it-works"
                className={`transition-colors ${
                  isScrolled
                    ? "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    : "text-white hover:text-blue-200"
                }`}
              >
                {t("nav.howItWorks")}
              </a>
              <a
                href="#features"
                className={`transition-colors ${
                  isScrolled
                    ? "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    : "text-white hover:text-blue-200"
                }`}
              >
                {t("nav.features")}
              </a>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isScrolled
                    ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                aria-label="Toggle language"
              >
                <Globe
                  className={`w-4 h-4 ${
                    isScrolled
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-white"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isScrolled
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-white"
                  }`}
                >
                  {language === "en" ? "नेपाली" : "English"}
                </span>
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled
                    ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun
                    className={`w-5 h-5 ${
                      isScrolled
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-white"
                    }`}
                  />
                ) : (
                  <Moon
                    className={`w-5 h-5 ${
                      isScrolled
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-white"
                    }`}
                  />
                )}
              </button>

              <Link
                to="/login"
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
              >
                {t("nav.login")}
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Language Toggle - Mobile */}
              <button
                onClick={toggleLanguage}
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled
                    ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                aria-label="Toggle language"
              >
                <Globe
                  className={`w-5 h-5 ${
                    isScrolled
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-white"
                  }`}
                />
              </button>

              {/* Dark Mode Toggle - Mobile */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  isScrolled
                    ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    : "bg-white/10 hover:bg-white/20"
                }`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun
                    className={`w-5 h-5 ${
                      isScrolled
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-white"
                    }`}
                  />
                ) : (
                  <Moon
                    className={`w-5 h-5 ${
                      isScrolled
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-white"
                    }`}
                  />
                )}
              </button>

              {/* Mobile Menu Button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <svg
                  className={`w-6 h-6 ${
                    isScrolled
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-white"
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4 bg-white dark:bg-gray-800 rounded-lg p-4">
              <a
                href="#how-it-works"
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {t("nav.howItWorks")}
              </a>
              <a
                href="#features"
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {t("nav.features")}
              </a>
              <Link
                to="/login"
                className="block px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-center"
              >
                {t("nav.login")}
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Page Sections */}
      <HeroSection onSearchClick={scrollToSearch} t={t} />
      <StatsSection t={t} />
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
