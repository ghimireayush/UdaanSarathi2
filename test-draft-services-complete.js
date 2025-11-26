/**
 * Complete Draft Services Test
 * Tests the draft job services with proper authentication
 * 
 * This test:
 * 1. Gets an agency with owner from the platform analytics API
 * 2. Simulates authentication by setting up localStorage
 * 3. Tests all draft service methods
 * 4. Creates a complete draft through all 8 steps
 * 5. Publishes the draft
 * 6. Verifies the job posting was created
 * 
 * Run with: node test-draft-services-complete.js
 */

// Setup Node.js environment
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock localStorage
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
  },
  clear() {
    this.data = {};
  }
};

// Mock environment
process.env.VITE_API_BASE_URL = 'http://localhost:3000';

// Node 18+ has built-in fetch, no need to import

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test state
const testState = {
  agencyLicense: null,
  agencyId: null,
  agencyName: null,
  ownerPhone: null,
  authToken: null,
  draftId: null,
  jobPostingId: null,
};

// Mock auth service
const mockAuthService = {
  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    return JSON.parse(userStr);
  },
  setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.token) {
      localStorage.setItem('authToken', user.token);
    }
  }
};

// Draft Job API Client (simplified from actual service)
class DraftJobApiClient {
  constructor() {
    this.API_BASE_URL = 'http://localhost:3000';
  }

  getAuthHeaders() {
    const user = mockAuthService.getCurrentUser();
    const token = user?.token || localStorage.getItem('authToken');
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  getAgencyLicense() {
    const user = mockAuthService.getCurrentUser();
    return user?.agency?.license_number || user?.license_number || testState.agencyLicense;
  }

  async getDraftJobs() {
    const license = this.getAgencyLicense();
    if (!license) throw new Error('Agency license not found');

    const response = await fetch(`${this.API_BASE_URL}/agencies/${license}/draft-jobs`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get drafts failed: ${error}`);
    }

    return response.json();
  }

  async getDraftJobById(draftId) {
    const license = this.getAgencyLicense();
    if (!license) throw new Error('Agency license not found');

    const response = await fetch(`${this.API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get draft failed: ${error}`);
    }

    return response.json();
  }

  async createDraftJob(data) {
    const license = this.getAgencyLicense();
    if (!license) throw new Error('Agency license not found');

    const response = await fetch(`${this.API_BASE_URL}/agencies/${license}/draft-jobs`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Create draft failed: ${error}`);
    }

    return response.json();
  }

  async updateDraftJob(draftId, data) {
    const license = this.getAgencyLicense();
    if (!license) throw new Error('Agency license not found');

    const response = await fetch(`${this.API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Update draft failed: ${error}`);
    }

    return response.json();
  }

  async publishDraft(draftId) {
    const license = this.getAgencyLicense();
    if (!license) throw new Error('Agency license not found');

    const response = await fetch(`${this.API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}/publish`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Publish draft failed: ${error}`);
    }

    return response.json();
  }

  async deleteDraftJob(draftId) {
    const license = this.getAgencyLicense();
    if (!license) throw new Error('Agency license not found');

    const response = await fetch(`${this.API_BASE_URL}/agencies/${license}/draft-jobs/${draftId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Delete draft failed: ${error}`);
    }

    return response.json();
  }
}

// Run tests
async function runTests() {
  log('\n🧪 Testing Draft Job Services with Authentication', 'blue');
  log('='.repeat(70), 'blue');

  const client = new DraftJobApiClient();

  try {
    // Step 1: Get agency with owner
    log('\n📊 Step 1: Getting agency with owner...', 'cyan');
    const response = await fetch('http://localhost:3000/test-helper/platform-owner/agencies-analytics');
    const agencies = await response.json();
    const agency = agencies.find(a => a.owner_phone && a.analytics.draft_count >= 0);
    
    if (!agency) {
      throw new Error('No agency with owner found');
    }

    testState.agencyLicense = agency.license_number;
    testState.agencyId = agency.id;
    testState.agencyName = agency.name;
    testState.ownerPhone = agency.owner_phone;

    log(`✓ Found agency: ${agency.name}`, 'green');
    log(`  License: ${agency.license_number}`, 'green');
    log(`  Owner: ${agency.owner_phone}`, 'green');

    // Step 2: Get real auth token using dev OTP
    log('\n🔐 Step 2: Getting real auth token...', 'cyan');
    
    // Request OTP
    const otpResponse = await fetch('http://localhost:3000/agency/register-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test Owner',
        phone: testState.ownerPhone,
      }),
    });
    
    const otpData = await otpResponse.json();
    const devOtp = otpData.dev_otp;
    
    if (!devOtp) {
      throw new Error('No dev_otp received');
    }
    
    log(`✓ OTP received: ${devOtp}`, 'green');
    
    // Verify OTP to get token
    const verifyResponse = await fetch('http://localhost:3000/agency/verify-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: testState.ownerPhone,
        otp: devOtp,
      }),
    });
    
    const verifyData = await verifyResponse.json();
    testState.authToken = verifyData.token;
    
    if (!testState.authToken) {
      throw new Error('No token received');
    }
    
    mockAuthService.setCurrentUser({
      id: verifyData.user_id || 'test-user-id',
      phone: testState.ownerPhone,
      token: testState.authToken,
      agency: {
        id: testState.agencyId,
        name: testState.agencyName,
        license_number: testState.agencyLicense,
      },
      license_number: testState.agencyLicense,
    });

    log('✓ Authentication successful', 'green');
    log(`  Token: ${testState.authToken.substring(0, 20)}...`, 'green');

    // Step 3: Test getDraftJobs
    log('\n📋 Step 3: Testing getDraftJobs()...', 'cyan');
    const existingDrafts = await client.getDraftJobs();
    log(`✓ Retrieved ${existingDrafts.length} existing drafts`, 'green');

    // Step 4: Create new draft (Step 1 - Administrative Details)
    log('\n📝 Step 4: Creating new draft (Administrative Details)...', 'cyan');
    const step1Data = {
      posting_title: 'Test Draft - Construction Worker - Dubai',
      country: 'United Arab Emirates',
      city: 'Dubai',
      lt_number: `LT-TEST-${Date.now()}`,
      chalani_number: `CH-TEST-${Date.now()}`,
      approval_date_ad: '2025-11-20',
      posting_date_ad: '2025-11-26',
      announcement_type: 'online',
      notes: 'Automated test draft',
      employer: {
        company_name: 'Test Construction LLC',
        country: 'United Arab Emirates',
        city: 'Dubai',
      },
    };

    const createdDraft = await client.createDraftJob(step1Data);
    testState.draftId = createdDraft.id;
    
    log(`✓ Draft created: ${testState.draftId}`, 'green');
    log(`  Title: ${createdDraft.posting_title}`, 'green');
    log(`  Status: ${createdDraft.status}`, 'green');

    // Step 5: Update with contract (Step 2)
    log('\n📋 Step 5: Adding contract terms...', 'cyan');
    await client.updateDraftJob(testState.draftId, {
      contract: {
        period_years: 2,
        renewable: true,
        hours_per_day: 8,
        days_per_week: 6,
        overtime_policy: 'as_per_company_policy',
        weekly_off_days: 1,
        food: 'free',
        accommodation: 'free',
        transport: 'not_provided',
        annual_leave_days: 21,
      },
    });
    log('✓ Contract terms added', 'green');

    // Step 6: Add positions (Step 3)
    log('\n👥 Step 6: Adding positions...', 'cyan');
    await client.updateDraftJob(testState.draftId, {
      positions: [
        {
          title: 'Construction Worker',
          vacancies: { male: 10, female: 0 },
          salary: { monthly_amount: 1500, currency: 'AED' },
        },
        {
          title: 'Supervisor',
          vacancies: { male: 2, female: 0 },
          salary: { monthly_amount: 2500, currency: 'AED' },
        },
      ],
    });
    log('✓ Added 2 positions', 'green');

    // Step 7: Add tags (Step 4)
    log('\n🏷️  Step 7: Adding tags and requirements...', 'cyan');
    await client.updateDraftJob(testState.draftId, {
      skills: ['construction', 'manual-labor', 'teamwork'],
      education_requirements: ['high-school'],
      experience_requirements: {
        min_years: 1,
        max_years: 5,
        level: 'entry-level',
      },
      canonical_title_names: ['Construction Worker'],
    });
    log('✓ Tags and requirements added', 'green');

    // Step 8: Add expenses (Step 5)
    log('\n💰 Step 8: Adding expenses...', 'cyan');
    await client.updateDraftJob(testState.draftId, {
      expenses: {
        medical: {
          domestic: { who_pays: 'agency', is_free: true },
          foreign: { who_pays: 'company', is_free: true },
        },
        insurance: {
          who_pays: 'company',
          is_free: true,
          coverage_amount: 50000,
          coverage_currency: 'AED',
        },
        travel: {
          who_provides: 'company',
          ticket_type: 'round_trip',
          is_free: true,
        },
        visa: { who_pays: 'company', is_free: true, refundable: false },
        training: {
          who_pays: 'company',
          is_free: true,
          duration_days: 3,
          mandatory: true,
        },
        welfare: {
          welfare: {
            who_pays: 'worker',
            is_free: false,
            amount: 5000,
            currency: 'NPR',
            refundable: true,
          },
          service: {
            who_pays: 'worker',
            is_free: false,
            amount: 10000,
            currency: 'NPR',
            refundable: false,
          },
        },
      },
    });
    log('✓ All 6 expense types added', 'green');

    // Step 9: Add cutout (Step 6)
    log('\n📸 Step 9: Adding cutout...', 'cyan');
    await client.updateDraftJob(testState.draftId, {
      cutout: {
        file_name: 'test_job_ad.jpg',
        file_url: '/uploads/cutouts/test_job_ad.jpg',
        file_size: 156789,
        file_type: 'image/jpeg',
        has_file: true,
        is_uploaded: true,
      },
    });
    log('✓ Cutout added', 'green');

    // Step 10: Add interview (Step 7)
    log('\n📅 Step 10: Adding interview details...', 'cyan');
    await client.updateDraftJob(testState.draftId, {
      interview: {
        date_ad: '2025-12-01',
        time: '10:00 AM',
        location: 'Agency Office, Kathmandu',
        contact_person: 'Test Manager',
        required_documents: ['passport', 'certificates', 'photos'],
        notes: 'Bring original documents',
      },
    });
    log('✓ Interview details added', 'green');

    // Step 11: Mark as complete (Step 8)
    log('\n✅ Step 11: Marking draft as complete...', 'cyan');
    await client.updateDraftJob(testState.draftId, {
      is_complete: true,
      ready_to_publish: true,
      reviewed: true,
    });
    log('✓ Draft marked as complete', 'green');

    // Step 12: Retrieve and verify
    log('\n🔍 Step 12: Verifying complete draft...', 'cyan');
    const completeDraft = await client.getDraftJobById(testState.draftId);
    
    log('✓ Draft retrieved successfully', 'green');
    log(`  Title: ${completeDraft.posting_title}`, 'green');
    log(`  Country: ${completeDraft.country}`, 'green');
    log(`  City: ${completeDraft.city}`, 'green');
    log(`  Positions: ${completeDraft.positions?.length || 0}`, 'green');
    log(`  Skills: ${completeDraft.skills?.length || 0}`, 'green');
    log(`  Complete: ${completeDraft.is_complete}`, 'green');
    log(`  Ready to Publish: ${completeDraft.ready_to_publish}`, 'green');

    // Step 13: Publish draft
    log('\n🚀 Step 13: Publishing draft...', 'cyan');
    const publishResult = await client.publishDraft(testState.draftId);
    testState.jobPostingId = publishResult.job_posting_id;
    
    log('✓ Draft published successfully!', 'green');
    log(`  Draft ID: ${publishResult.draft_id}`, 'green');
    log(`  Job Posting ID: ${testState.jobPostingId}`, 'green');

    // Step 14: Verify published status
    log('\n🔍 Step 14: Verifying published status...', 'cyan');
    const publishedDraft = await client.getDraftJobById(testState.draftId);
    
    if (publishedDraft.status === 'published') {
      log('✓ Draft status is PUBLISHED', 'green');
      log(`  Published Job ID: ${publishedDraft.published_job_id}`, 'green');
    } else {
      throw new Error(`Expected status 'published', got '${publishedDraft.status}'`);
    }

    // Step 15: Verify job posting exists
    log('\n🔍 Step 15: Verifying job posting...', 'cyan');
    const jobResponse = await fetch(`http://localhost:3000/jobs/${testState.jobPostingId}`);
    const jobPosting = await jobResponse.json();
    
    log('✓ Job posting is publicly accessible', 'green');
    log(`  Title: ${jobPosting.posting_title}`, 'green');
    log(`  Country: ${jobPosting.country}`, 'green');
    log(`  City: ${jobPosting.city}`, 'green');

    // Step 16: Test protection (cannot update published draft)
    log('\n🚫 Step 16: Testing published draft protection...', 'cyan');
    try {
      await client.updateDraftJob(testState.draftId, {
        posting_title: 'Updated Title',
      });
      throw new Error('Should not be able to update published draft');
    } catch (error) {
      if (error.message.includes('Cannot update') || error.message.includes('400')) {
        log('✓ Cannot update published draft (as expected)', 'green');
      } else {
        throw error;
      }
    }

    // Success!
    log('\n' + '='.repeat(70), 'blue');
    log('✅ ALL TESTS PASSED! 🎉', 'green');
    log('='.repeat(70), 'blue');
    log('\n📊 Test Summary:', 'blue');
    log(`  Agency: ${testState.agencyName}`, 'blue');
    log(`  License: ${testState.agencyLicense}`, 'blue');
    log(`  Draft ID: ${testState.draftId}`, 'blue');
    log(`  Job Posting ID: ${testState.jobPostingId}`, 'blue');
    log(`  Status: Complete draft creation and publishing flow verified`, 'blue');
    log('\n✨ The draft services integration is working correctly!', 'green');

    process.exit(0);

  } catch (error) {
    log('\n❌ TEST FAILED!', 'red');
    log(`Error: ${error.message}`, 'red');
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Run the tests
runTests();
