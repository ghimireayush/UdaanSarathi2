import httpClient from '../config/httpClient.js'

/**
 * Country Data Source
 * Handles all API calls related to country and reference data
 */
class CountryDataSource {
  /**
   * Fetch all countries from the backend API
   * @returns {Promise<Array>} Array of country objects with id, country_name, country_code, currency_code, etc.
   */
  async getCountries() {
    return httpClient.get('/countries')
  }

  /**
   * Get country names only (for dropdowns)
   * @returns {Promise<Array<string>>} Array of country names
   */
  async getCountryNames() {
    const countries = await this.getCountries()
    return countries.map(c => c.country_name).sort()
  }

  /**
   * Find country by name
   * @param {string} name - Country name
   * @returns {Promise<Object|null>} Country object or null
   */
  async findByName(name) {
    const countries = await this.getCountries()
    return countries.find(c => c.country_name === name) || null
  }

  /**
   * Get currency code for a country
   * @param {string} countryName - Country name
   * @returns {Promise<string|null>} Currency code or null
   */
  async getCurrencyCode(countryName) {
    const country = await this.findByName(countryName)
    return country?.currency_code || null
  }
}

export default new CountryDataSource()
