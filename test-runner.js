#!/usr/bin/env node

/**
 * Test Runner Script
 * Runs all test suites and generates a comprehensive report
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Starting Udaan Sarathi Test Suite...\n')

// Test configuration
const testConfig = {
  verbose: true,
  coverage: true,
  watchAll: false,
  passWithNoTests: false
}

// Build Jest command
const jestCommand = [
  'npx jest',
  testConfig.verbose ? '--verbose' : '',
  testConfig.coverage ? '--coverage' : '',
  testConfig.watchAll ? '--watchAll' : '',
  testConfig.passWithNoTests ? '--passWithNoTests' : '',
  '--colors',
  '--detectOpenHandles',
  '--forceExit'
].filter(Boolean).join(' ')

try {
  console.log('📋 Running Jest with command:', jestCommand)
  console.log('=' .repeat(60))
  
  // Run tests
  const output = execSync(jestCommand, { 
    encoding: 'utf8',
    stdio: 'inherit',
    cwd: process.cwd()
  })
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests completed successfully!')
  
  // Generate test summary
  generateTestSummary()
  
} catch (error) {
  console.error('\n' + '='.repeat(60))
  console.error('❌ Tests failed with exit code:', error.status)
  
  if (error.stdout) {
    console.log('\nSTDOUT:', error.stdout.toString())
  }
  
  if (error.stderr) {
    console.error('\nSTDERR:', error.stderr.toString())
  }
  
  process.exit(error.status || 1)
}

function generateTestSummary() {
  console.log('\n📊 Test Summary Report')
  console.log('=' .repeat(40))
  
  const testFiles = findTestFiles('src')
  
  console.log(`📁 Test Files Found: ${testFiles.length}`)
  
  testFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`)
  })
  
  console.log('\n🎯 Test Categories:')
  console.log('  • Unit Tests: Components, Services, Utilities')
  console.log('  • Integration Tests: Authentication Flow')
  console.log('  • UI Tests: User Interactions, Form Validation')
  
  console.log('\n📈 Coverage Report:')
  console.log('  • Check coverage/ directory for detailed HTML report')
  console.log('  • Coverage thresholds defined in jest.config.js')
  
  console.log('\n🚀 Next Steps:')
  console.log('  • Review any failing tests')
  console.log('  • Check coverage gaps')
  console.log('  • Add tests for new features')
  console.log('  • Run tests before deployment')
}

function findTestFiles(dir) {
  const testFiles = []
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath)
      } else if (item.match(/\.(test|spec)\.(js|jsx)$/)) {
        testFiles.push(fullPath.replace(process.cwd() + path.sep, ''))
      }
    })
  }
  
  if (fs.existsSync(dir)) {
    scanDirectory(dir)
  }
  
  return testFiles
}