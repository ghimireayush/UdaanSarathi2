// API Service for UdaanSarathi Backend Integration
// Use proxy in development, direct URL in production
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api'  // This will be proxied to https://dev.kaha.com.np/job-portal
  : 'https://dev.kaha.com.np/job-portal';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to make HTTP requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // Handle non-JSON responses or empty responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data.message || data || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      
      // Handle network errors (CORS, connection issues)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }
      
      throw error;
    }
  }

  // Register agency owner - matches OpenAPI spec
  async registerOwner(ownerData) {
    const { fullName, phone } = ownerData;
    
    // Validate input according to OpenAPI spec
    if (!phone || !fullName) {
      throw new Error('Phone number and full name are required');
    }

    const requestBody = {
      phone: phone,
      full_name: fullName
    };

    try {
      const response = await this.makeRequest('/agency/register-owner', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      return response;
    } catch (error) {
      // Handle specific API errors based on status code in message
      const errorMessage = error.message || '';
      if (errorMessage.includes('status: 400')) {
        throw new Error('Invalid input data. Please check your phone number and name.');
      } else if (errorMessage.includes('status: 409')) {
        throw new Error('This phone number is already registered.');
      } else if (errorMessage.includes('status: 500')) {
        throw new Error('Server error. Please try again later.');
      }
      throw error;
    }
  }

  // Future API methods can be added here
  // async verifyOtp(phone, otp) { ... }
  // async setupCompany(companyData) { ... }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
