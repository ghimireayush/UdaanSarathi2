import { useState } from 'react'
import CandidateSummaryS2 from './CandidateSummaryS2'

/**
 * S2 Test Harness Component
 * 
 * Quick testing component for S2 refactor
 * Uses hardcoded test data from database
 * 
 * Test IDs:
 * - Candidate ID: 584fd48a-a861-44a1-ad68-3c0638c0b860
 * - Application (Applied): e149daf5-474b-4065-aac2-0589d4b611db
 * - Application (Shortlisted): bdd72fa1-f288-4ab5-8749-65f93318af51
 */
const S2TestHarness = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState('applied')

  // Test data from database
  const testApplications = {
    applied: {
      applicationId: 'e149daf5-474b-4065-aac2-0589d4b611db',
      candidateId: '584fd48a-a861-44a1-ad68-3c0638c0b860',
      status: 'applied',
      name: 'Ajay Dahal'
    },
    shortlisted: {
      applicationId: 'bdd72fa1-f288-4ab5-8749-65f93318af51',
      candidateId: '584fd48a-a861-44a1-ad68-3c0638c0b860',
      status: 'shortlisted',
      name: 'Ajay Dahal'
    }
  }

  const currentApp = testApplications[selectedApplication]

  // Debug logging
  console.log('S2TestHarness - currentApp:', currentApp)
  console.log('S2TestHarness - isSidebarOpen:', isSidebarOpen)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          S2 Component Test Harness
        </h1>

        {/* Test Controls */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Test Application
            </label>
            <div className="flex gap-4">
              {Object.entries(testApplications).map(([key, app]) => (
                <button
                  key={key}
                  onClick={() => setSelectedApplication(key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedApplication === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Test Data Display */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Test Data</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                <span className="font-medium">Candidate:</span> {currentApp.name}
              </p>
              <p>
                <span className="font-medium">Candidate ID:</span>{' '}
                <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                  {currentApp.candidateId}
                </code>
              </p>
              <p>
                <span className="font-medium">Application ID:</span>{' '}
                <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                  {currentApp.applicationId}
                </code>
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                  {currentApp.status}
                </span>
              </p>
            </div>
          </div>

          {/* Open S2 Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Open S2 Component
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Test Instructions</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Select a test application (Applied or Shortlisted)</li>
            <li>Click "Open S2 Component" to open the sidebar</li>
            <li>Verify candidate data loads correctly</li>
            <li>Test stage transitions (Shortlist, Schedule Interview, etc.)</li>
            <li>Test document upload and verification</li>
            <li>Test notes management</li>
            <li>Check browser console for any errors</li>
          </ul>
        </div>

        {/* Test Results */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Test Checklist</h3>
          <div className="space-y-2 text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-700 dark:text-gray-300">S2 opens successfully</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-700 dark:text-gray-300">Candidate data loads</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-700 dark:text-gray-300">Documents section loads</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-700 dark:text-gray-300">Notes section loads</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-700 dark:text-gray-300">Stage transition buttons appear</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-gray-700 dark:text-gray-300">No console errors</span>
            </label>
          </div>
        </div>
      </div>

      {/* S2 Component */}
      {currentApp && (
        <CandidateSummaryS2
          applicationId={currentApp.applicationId}
          candidateId={currentApp.candidateId}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default S2TestHarness
