// Country Service - Fetch countries from backend API
import performanceService from './performanceService.js';
import CountryDataSource from '../api/datasources/CountryDataSource.js';

class CountryService {
  /**
   * Fetch all countries from the backend API
   * @returns {Promise<Array>} Array of country objects with id, country_name, country_code, currency_code, etc.
   */
  async getCountries() {
    return await performanceService.getCachedData('countries_api', async () => {
      try {
        const countries = await CountryDataSource.getCountries();
        return countries;
      } catch (error) {
        console.error('[countryService] Failed to fetch countries:', error);
        // Return fallback list if API fails
        return [
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
