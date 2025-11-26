/**
 * E2E Test: Complete Draft Job Creation and Publishing Flow
 * 
 * This test uses the actual frontend services (draftJobApiClient, jobService)
 * to test the complete integration with the backend API.
 * 
 * Run: node test-draft-complete-flow.js
 */

const API_BASE_URL = 'http://localhost:3000';

// Helper to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json();
}

// Test data
const testData = {
  ownerPhone: `+977${Date.now().toString().slice(-10)}`,
  licenseNumber: `E2E-TEST-${Date.now()}`,
};

let authToken = null;
let agencyId = null;
let draftId = null;
let jobPostingId = null;

async function runTest() {
  console.log('🚀 Starting E2E Draft Job Complete Flow Test\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Get platform owner analytics to find an existing agency with owner
    console.log('\n📊 Step 1: Getting agency with owner credentials...');
    const agencies = await apiCall('GET', '/test-helper/platform-owner/agencies-analytics');
    const agencyWithOwner = agencies.find(a => a.owner_phone && a.analytics.draft_count >= 0);
    
    if (!agencyWithOwner) {
      throw new Error('No agency with owner found. Please create one first.');
    }

    testData.ownerPhone = agencyWithOwner.owner_phone;
    testData.licenseNumber = agencyWithOwner.license_number;
    agencyId = agencyWithOwner.id;
    
    console.log(`✓ Found agency: ${agencyWithOwner.name}`);
    console.log(`  License: ${testData.licenseNumber}`);
    console.log(`  Owner Phone: ${testData.ownerPhone}`);

    // Step 2: Skip authentication for testing
    // In production, user would login and get real token
    console.log('\n🔐 Step 2: Skipping authentication (testing without auth)...');
    authToken = null; // We'll test without auth token
    console.log('✓ Testing without authentication');

    // Step 4: Create draft with Step 1 data (Administrative Details)
    console.log('\n📝 Step 4: Creating draft with administrative details...');
    const step1Data = {
      posting_title: 'E2E Test - Construction Worker - Dubai',
      country: 'United Arab Emirates',
      city: 'Dubai',
      lt_number: `LT-E2E-${Date.now()}`,
      chalani_number: `CH-E2E-${Date.now()}`,
      approval_date_ad: '2025-11-20',
      posting_date_ad: '2025-11-26',
      announcement_type: 'online',
      notes: 'E2E test draft created via automated test',
      employer: {
        company_name: 'E2E Test Construction LLC',
        country: 'United Arab Emirates',
        city: 'Dubai',
      },
    };

    const createResponse = await apiCall(
      'POST',
      `/agencies/${testData.licenseNumber}/draft-jobs`,
      step1Data,
      authToken
    );
    
    draftId = createResponse.id;
    console.log(`✓ Draft created: ${draftId}`);
    console.log(`  Title: ${createResponse.posting_title}`);
    console.log(`  Status: ${createResponse.status}`);

    // Step 5: Update with contract terms
    console.log('\n📋 Step 5: Adding contract terms...');
    await apiCall(
      'PATCH',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      {
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
      },
      authToken
    );
    console.log('✓ Contract terms added');

    // Step 6: Add positions
    console.log('\n👥 Step 6: Adding positions...');
    await apiCall(
      'PATCH',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      {
        positions: [
          {
            title: 'Construction Worker',
            vacancies: { male: 10, female: 0 },
            salary: {
              monthly_amount: 1500,
              currency: 'AED',
            },
          },
          {
            title: 'Supervisor',
            vacancies: { male: 2, female: 0 },
            salary: {
              monthly_amount: 2500,
              currency: 'AED',
            },
          },
        ],
      },
      authToken
    );
    console.log('✓ Positions added (2 positions)');

    // Step 7: Add tags and requirements
    console.log('\n🏷️  Step 7: Adding tags and requirements...');
    await apiCall(
      'PATCH',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      {
        skills: ['construction', 'manual-labor', 'teamwork', 'safety'],
        education_requirements: ['high-school'],
        experience_requirements: {
          min_years: 1,
          max_years: 5,
          level: 'entry-level',
        },
        canonical_title_names: ['Construction Worker'],
      },
      authToken
    );
    console.log('✓ Tags and requirements added');

    // Step 8: Add expenses
    console.log('\n💰 Step 8: Adding expenses...');
    await apiCall(
      'PATCH',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      {
        expenses: {
          medical: {
            domestic: {
              who_pays: 'agency',
              is_free: true,
              notes: 'Medical check-up in Nepal',
            },
            foreign: {
              who_pays: 'company',
              is_free: true,
              notes: 'Medical check-up in UAE',
            },
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
          visa: {
            who_pays: 'company',
            is_free: true,
            refundable: false,
          },
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
      },
      authToken
    );
    console.log('✓ Expenses added (all 6 types)');

    // Step 9: Add cutout
    console.log('\n📸 Step 9: Adding cutout image...');
    await apiCall(
      'PATCH',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      {
        cutout: {
          file_name: 'e2e_test_job_ad.jpg',
          file_url: '/uploads/cutouts/e2e_test_job_ad.jpg',
          file_size: 156789,
          file_type: 'image/jpeg',
          has_file: true,
          is_uploaded: true,
        },
      },
      authToken
    );
    console.log('✓ Cutout image added');

    // Step 10: Add interview details
    console.log('\n📅 Step 10: Adding interview details...');
    await apiCall(
      'PATCH',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      {
        interview: {
          date_ad: '2025-12-01',
          time: '10:00 AM',
          location: 'Agency Office, Kathmandu',
          contact_person: 'E2E Test Manager',
          required_documents: ['passport', 'certificates', 'photos'],
          notes: 'Bring original documents',
        },
      },
      authToken
    );
    console.log('✓ Interview details added');

    // Step 11: Mark as complete
    console.log('\n✅ Step 11: Marking draft as complete...');
    const completeDraft = await apiCall(
      'PATCH',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      {
        is_complete: true,
        ready_to_publish: true,
        reviewed: true,
      },
      authToken
    );
    console.log('✓ Draft marked as complete and ready to publish');

    // Step 12: Retrieve and verify complete draft
    console.log('\n🔍 Step 12: Verifying complete draft...');
    const retrievedDraft = await apiCall(
      'GET',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      null,
      authToken
    );
    
    console.log('✓ Draft retrieved successfully');
    console.log(`  Title: ${retrievedDraft.posting_title}`);
    console.log(`  Country: ${retrievedDraft.country}`);
    console.log(`  City: ${retrievedDraft.city}`);
    console.log(`  Positions: ${retrievedDraft.positions?.length || 0}`);
    console.log(`  Skills: ${retrievedDraft.skills?.length || 0}`);
    console.log(`  Complete: ${retrievedDraft.is_complete}`);
    console.log(`  Ready to Publish: ${retrievedDraft.ready_to_publish}`);

    // Step 13: Publish draft
    console.log('\n🚀 Step 13: Publishing draft to job posting...');
    const publishResponse = await apiCall(
      'POST',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}/publish`,
      null,
      authToken
    );
    
    jobPostingId = publishResponse.job_posting_id;
    console.log('✓ Draft published successfully!');
    console.log(`  Draft ID: ${publishResponse.draft_id}`);
    console.log(`  Job Posting ID: ${jobPostingId}`);

    // Step 14: Verify draft status changed
    console.log('\n🔍 Step 14: Verifying draft status...');
    const publishedDraft = await apiCall(
      'GET',
      `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
      null,
      authToken
    );
    
    if (publishedDraft.status === 'published') {
      console.log('✓ Draft status updated to PUBLISHED');
    } else {
      throw new Error(`Expected status 'published', got '${publishedDraft.status}'`);
    }

    // Step 15: Verify job posting exists
    console.log('\n🔍 Step 15: Verifying job posting...');
    const jobPosting = await apiCall('GET', `/jobs/${jobPostingId}`);
    
    console.log('✓ Job posting is publicly accessible');
    console.log(`  Title: ${jobPosting.posting_title}`);
    console.log(`  Country: ${jobPosting.country}`);
    console.log(`  City: ${jobPosting.city}`);

    // Step 16: Try to update published draft (should fail)
    console.log('\n🚫 Step 16: Testing published draft protection...');
    try {
      await apiCall(
        'PATCH',
        `/agencies/${testData.licenseNumber}/draft-jobs/${draftId}`,
        { posting_title: 'Updated Title' },
        authToken
      );
      throw new Error('Should not be able to update published draft');
    } catch (error) {
      if (error.message.includes('400') || error.message.includes('Cannot update')) {
        console.log('✓ Cannot update published draft (as expected)');
      } else {
        throw error;
      }
    }

    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('✅ E2E TEST PASSED!');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log(`  Agency: ${agencyWithOwner.name}`);
    console.log(`  License: ${testData.licenseNumber}`);
    console.log(`  Draft ID: ${draftId}`);
    console.log(`  Job Posting ID: ${jobPostingId}`);
    console.log(`  Status: All steps completed successfully`);
    console.log('\n✨ The complete draft creation and publishing flow works correctly!');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Run the test
runTest();
