import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  FileText,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo.svg";

const CompanySetup = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    website: "",
    registrationNumber: "",
    description: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { createCompany, user, isAuthenticated, logout } = useAuth();

  // Use userId from location state (for registration flow) or from authenticated user
  const userId = location.state?.userId || user?.id;

  // Redirect to login if not authenticated
  if (!isAuthenticated || !userId) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createCompany({
        ...formData,
        userId,
      });
      // After successful company creation, redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-navy/10 via-brand-blue-bright/5 to-brand-green-vibrant/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 text-gray-600 hover:text-brand-navy transition-colors dark:text-gray-400 dark:hover:text-brand-blue-bright"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>

          {/* Logout button - Top Right */}
          <button
            onClick={handleLogout}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors dark:text-gray-400 dark:hover:text-red-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Logout</span>
          </button>

          <div className="flex flex-col items-center mb-4">
            <img
              src={logo}
              alt="Udaan Sarathi Logo"
              className="w-24 h-24 object-contain mb-2"
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Setup Your Company
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tell us about your manpower agency
            </p>
            {user && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Logged in as: <span className="font-medium">{user.name || user.phone}</span>
              </p>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                >
                  Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                >
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Enter company address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                  >
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                  >
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Enter country"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                      placeholder="Company phone"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                  >
                    Website
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                      placeholder="Company website (optional)"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="registrationNumber"
                  className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                >
                  Company Registration Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="registrationNumber"
                    name="registrationNumber"
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                    placeholder="Enter registration number"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"
                >
                  Company Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-bright focus:border-brand-blue-bright dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 dark:placeholder-gray-400"
                  placeholder="Tell us about your company (optional)"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-navy hover:bg-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-bright dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Setting Up Company...
                    </span>
                  ) : (
                    "Complete Setup"
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default CompanySetup;
