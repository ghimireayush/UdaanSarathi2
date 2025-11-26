// Country Service - Fetch countries from backend API
import performanceService from './performanceService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class CountryService {
  /**
   * Fetch all countries from the backend API
   * @returns {Promise<Array>} Array of country objects with id, country_name, country_code, currency_code, etc.
   */
  async getCountries() {
    return await performanceService.getCachedData('countries_api', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/countries`);
        if (!response.ok) {
          throw new Error(`Failed to fetch countries: ${response.statusText}`);
        }
        const countries = await response.json();
        return countries;
      } catch (error) {
        console.error('[countryService] Failed to fetch countries:', error);
        // Return fallback list if API fails
        return [
          { country_name: 'United Arab Emirates', country_code: 'UAE', currency_code: 'AED' },
          { country_name: 'Saudi Arabia', country_code: 'SAU', currency_code: 'SAR' },
          { country_name: 'Qatar', country_code: 'QAT', currency_code: 'QAR' },
          { country_name: 'Kuwait', country_code: 'KWT', currency_code: 'KWD' },
          { country_name: 'Oman', country_code: 'OMN', currency_code: 'OMR' },
          { country_name: 'Bahrain', country_code: 'BHR', currency_code: 'BHD' },
          { country_name: 'Malaysia', country_code: 'MYS', currency_code: 'MYR' },
        ];
      }
    }, 'countries', 3600000); // Cache for 1 hour
  }

  /**
   * Get country names only (for dropdowns)
   * @returns {Promise<Array<string>>} Array of country names
   */
  async getCountryNames() {
    const countries = await this.getCountries();
    return countries.map(c => c.country_name).sort();
  }

  /**
   * Find country by name
   * @param {string} name - Country name
   * @returns {Promise<Object|null>} Country object or null
   */
  async findByName(name) {
    const countries = await this.getCountries();
    return countries.find(c => c.country_name === name) || null;
  }

  /**
   * Get currency code for a country
   * @param {string} countryName - Country name
   * @returns {Promise<string|null>} Currency code or null
   */
  async getCurrencyCode(countryName) {
    const country = await this.findByName(countryName);
    return country?.currency_code || null;
  }
}

// Create and export singleton instance
const countryService = new CountryService();
export default countryService;
