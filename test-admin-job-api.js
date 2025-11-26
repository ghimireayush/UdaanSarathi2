/**
 * Admin Job API Integration Test
 * Tests the admin job API using the actual frontend services
 * 
 * Run with: node test-admin-job-api.js
 */

// Mock environment
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  }
};

// Mock import.meta.env
process.env.VITE_API_BASE_URL = 'http://localhost:3000';

// Simple fetch polyfill for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
global.fetch = fetch;

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, message = '') {
  const status = passed ? '✓ PASSED' : '✗ FAILED';
  const color = passed ? 'green' : 'red';
  log(`  ${status}: ${name}`, color);
  if (message) {
    log(`    ${message}`, 'yellow');
  }
  
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

// Import the actual service (we'll create a simplified version)
class AdminJobApiClient {
  constructor() {
    this.API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  getAuthHeaders() {
    const token = global.localStorage.getItem('udaan_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async getAdminJobs(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.country && filters.country !== 'All Countries') {
        params.append('country', filters.country);
      }
      if (filters.sortBy) {
        params.append('sort_by', this.mapSortBy(filters.sortBy));
        params.append('order', 'desc');
      }
      
      params.append('page', '1');
      params.append('limit', '1000');

      const url = `${this.API_BASE_URL}/admin/jobs?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw new Error(`Get admin jobs failed: ${error.message}`);
    }
  }

  async getCountryDistribution() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/jobs/statistics/countries`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Get country distribution failed: ${error.message}`);
    }
  }

  async getJobStatistics() {
    const distribution = await this.getCountryDistribution();
    return {
      byCountry: distribution
    };
  }

  mapSortBy(frontendSort) {
    const mapping = {
      'published_date': 'published_date',
      'applications': 'applications',
      'shortlisted': 'shortlisted',
      'interviews': 'interviews'
    };
    return mapping[frontendSort] || 'published_date';
  }
}

// Run tests
async function runTests() {
  log('\n🧪 Testing Admin Job API with Frontend Services', 'blue');
  log('='.repeat(60), 'blue');
  log('');

  const client = new AdminJobApiClient();

  // Test 1: Get all jobs
  log('Test 1: Get all jobs', 'yellow');
  try {
    const jobs = await client.getAdminJobs();
    logTest('getAdminJobs()', Array.isArray(jobs), `Returned ${jobs.length} jobs`);
  } catch (error) {
    logTest('getAdminJobs()', false, error.message);
  }

  // Test 2: Search for jobs
  log('\nTest 2: Search for "cook"', 'yellow');
  try {
    const jobs = await client.getAdminJobs({ search: 'cook' });
    logTest('getAdminJobs({ search: "cook" })', Array.isArray(jobs), `Found ${jobs.length} jobs`);
  } catch (error) {
    logTest('getAdminJobs({ search: "cook" })', false, error.message);
  }

  // Test 3: Filter by country
  log('\nTest 3: Filter by country (UAE)', 'yellow');
  try {
    const jobs = await client.getAdminJobs({ country: 'UAE' });
    logTest('getAdminJobs({ country: "UAE" })', Array.isArray(jobs), `Found ${jobs.length} UAE jobs`);
    
    // Verify all jobs are from UAE
    if (jobs.length > 0) {
      const allUAE = jobs.every(job => job.country === 'UAE');
      logTest('All jobs are from UAE', allUAE, allUAE ? 'Correct' : 'Some jobs are not from UAE');
    }
  } catch (error) {
    logTest('getAdminJobs({ country: "UAE" })', false, error.message);
  }

  // Test 4: Sort by published date
  log('\nTest 4: Sort by published date', 'yellow');
  try {
    const jobs = await client.getAdminJobs({ sortBy: 'published_date' });
    logTest('getAdminJobs({ sortBy: "published_date" })', Array.isArray(jobs), `Returned ${jobs.length} jobs`);
    
    // Verify sorting (if we have jobs)
    if (jobs.length > 1) {
      const firstDate = new Date(jobs[0].published_at || jobs[0].created_at);
      const secondDate = new Date(jobs[1].published_at || jobs[1].created_at);
      const correctOrder = firstDate >= secondDate;
      logTest('Jobs sorted correctly (newest first)', correctOrder, 
        correctOrder ? 'Correct order' : 'Incorrect order');
    }
  } catch (error) {
    logTest('getAdminJobs({ sortBy: "published_date" })', false, error.message);
  }

  // Test 5: Sort by applications
  log('\nTest 5: Sort by applications', 'yellow');
  try {
    const jobs = await client.getAdminJobs({ sortBy: 'applications' });
    logTest('getAdminJobs({ sortBy: "applications" })', Array.isArray(jobs), `Returned ${jobs.length} jobs`);
    
    // Verify sorting (if we have jobs)
    if (jobs.length > 1) {
      const correctOrder = jobs[0].applications_count >= jobs[1].applications_count;
      logTest('Jobs sorted by applications (highest first)', correctOrder,
        `First: ${jobs[0].applications_count}, Second: ${jobs[1].applications_count}`);
    }
  } catch (error) {
    logTest('getAdminJobs({ sortBy: "applications" })', false, error.message);
  }

  // Test 6: Sort by shortlisted
  log('\nTest 6: Sort by shortlisted', 'yellow');
  try {
    const jobs = await client.getAdminJobs({ sortBy: 'shortlisted' });
    logTest('getAdminJobs({ sortBy: "shortlisted" })', Array.isArray(jobs), `Returned ${jobs.length} jobs`);
    
    // Verify sorting (if we have jobs)
    if (jobs.length > 1) {
      const correctOrder = jobs[0].shortlisted_count >= jobs[1].shortlisted_count;
      logTest('Jobs sorted by shortlisted (highest first)', correctOrder,
        `First: ${jobs[0].shortlisted_count}, Second: ${jobs[1].shortlisted_count}`);
    }
  } catch (error) {
    logTest('getAdminJobs({ sortBy: "shortlisted" })', false, error.message);
  }

  // Test 7: Sort by interviews
  log('\nTest 7: Sort by interviews', 'yellow');
  try {
    const jobs = await client.getAdminJobs({ sortBy: 'interviews' });
    logTest('getAdminJobs({ sortBy: "interviews" })', Array.isArray(jobs), `Returned ${jobs.length} jobs`);
    
    // Verify sorting (if we have jobs)
    if (jobs.length > 1) {
      const correctOrder = jobs[0].interviews_today >= jobs[1].interviews_today;
      logTest('Jobs sorted by interviews today (highest first)', correctOrder,
        `First: ${jobs[0].interviews_today}, Second: ${jobs[1].interviews_today}`);
    }
  } catch (error) {
    logTest('getAdminJobs({ sortBy: "interviews" })', false, error.message);
  }

  // Test 8: Get country distribution
  log('\nTest 8: Get country distribution', 'yellow');
  try {
    const distribution = await client.getCountryDistribution();
    const isObject = typeof distribution === 'object' && !Array.isArray(distribution);
    logTest('getCountryDistribution()', isObject, 
      `Countries: ${Object.keys(distribution).join(', ')}`);
    
    // Verify structure
    if (isObject) {
      const hasValidCounts = Object.values(distribution).every(count => typeof count === 'number' && count >= 0);
      logTest('All country counts are valid numbers', hasValidCounts);
    }
  } catch (error) {
    logTest('getCountryDistribution()', false, error.message);
  }

  // Test 9: Get job statistics
  log('\nTest 9: Get job statistics', 'yellow');
  try {
    const stats = await client.getJobStatistics();
    const hasCountries = stats.byCountry && typeof stats.byCountry === 'object';
    logTest('getJobStatistics()', hasCountries, 
      hasCountries ? `Found ${Object.keys(stats.byCountry).length} countries` : 'Invalid structure');
  } catch (error) {
    logTest('getJobStatistics()', false, error.message);
  }

  // Test 10: Combined filters
  log('\nTest 10: Combined filters (search + country + sort)', 'yellow');
  try {
    const jobs = await client.getAdminJobs({ 
      search: 'cook', 
      country: 'UAE',
      sortBy: 'applications'
    });
    logTest('getAdminJobs({ search, country, sortBy })', Array.isArray(jobs), 
      `Found ${jobs.length} jobs matching all filters`);
  } catch (error) {
    logTest('getAdminJobs({ search, country, sortBy })', false, error.message);
  }

  // Test 11: Verify job data structure
  log('\nTest 11: Verify job data structure', 'yellow');
  try {
    const jobs = await client.getAdminJobs({ limit: 1 });
    if (jobs.length > 0) {
      const job = jobs[0];
      const requiredFields = [
        'id', 'title', 'company', 'country', 
        'applications_count', 'shortlisted_count', 
        'interviews_today', 'total_interviews'
      ];
      
      const hasAllFields = requiredFields.every(field => field in job);
      logTest('Job has all required fields', hasAllFields,
        hasAllFields ? 'All fields present' : `Missing: ${requiredFields.filter(f => !(f in job)).join(', ')}`);
      
      // Check field types
      const correctTypes = 
        typeof job.id === 'string' &&
        typeof job.title === 'string' &&
        typeof job.company === 'string' &&
        typeof job.country === 'string' &&
        typeof job.applications_count === 'number' &&
        typeof job.shortlisted_count === 'number' &&
        typeof job.interviews_today === 'number' &&
        typeof job.total_interviews === 'number';
      
      logTest('Job fields have correct types', correctTypes);
    } else {
      logTest('Job data structure', false, 'No jobs to verify');
    }
  } catch (error) {
    logTest('Verify job data structure', false, error.message);
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('Test Summary:', 'blue');
  log(`  Total Tests: ${results.tests.length}`, 'blue');
  log(`  Passed: ${results.passed}`, 'green');
  log(`  Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'blue');

  if (results.failed === 0) {
    log('\n✓ All tests passed! 🎉', 'green');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed!', 'red');
    log('\nFailed tests:', 'red');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => log(`  - ${t.name}: ${t.message}`, 'red'));
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
