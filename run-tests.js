#!/usr/bin/env node

// Test Runner Script
// Runs all tests in the organized test directories
// Usage: node run-tests.js [category]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Test Runner - Plane Project');
console.log('================================\n');

// Test categories and their descriptions
const testCategories = {
  unit: 'Unit Tests - Individual component testing',
  integration: 'Integration Tests - Full pipeline testing', 
  performance: 'Performance Tests - Stress and load testing',
  debug: 'Debug Tests - Debugging and diagnostic tests',
  validation: 'Validation Tests - Data validation tests'
};

function findTestFiles(category = null) {
  const testsDir = path.join(__dirname, 'tests');
  const testFiles = [];
  
  const categories = category ? [category] : Object.keys(testCategories);
  
  for (const cat of categories) {
    const categoryPath = path.join(testsDir, cat);
    
    if (!fs.existsSync(categoryPath)) {
      console.log(`⚠️  Category '${cat}' directory not found, skipping...`);
      continue;
    }
    
    try {
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.js'))
        .map(file => ({
          category: cat,
          name: file,
          path: path.join(categoryPath, file),
          relativePath: path.join('tests', cat, file)
        }));
      
      testFiles.push(...files);
    } catch (error) {
      console.log(`❌ Error reading ${cat} directory: ${error.message}`);
    }
  }
  
  return testFiles;
}

function runTest(testFile) {
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Running: ${testFile.relativePath}`);
    
    // Execute the test file
    const output = execSync(`node "${testFile.path}"`, {
      encoding: 'utf8',
      timeout: 30000, // 30 second timeout
      cwd: __dirname
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ PASSED: ${testFile.name} (${duration}ms)`);
    
    // Show last few lines of output for context
    const outputLines = output.trim().split('\n');
    const lastLines = outputLines.slice(-3);
    if (lastLines.length > 0) {
      console.log(`   Output: ${lastLines.join(' | ')}`);
    }
    
    return { success: true, duration, output: output.trim() };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ FAILED: ${testFile.name} (${duration}ms)`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    
    return { success: false, duration, error: error.message };
  }
}

function generateReport(results) {
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  
  // Group results by category
  const byCategory = {};
  results.forEach(result => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = { passed: 0, failed: 0, total: 0 };
    }
    byCategory[result.category].total++;
    if (result.success) {
      byCategory[result.category].passed++;
    } else {
      byCategory[result.category].failed++;
    }
  });
  
  console.log('\n📋 Results by Category:');
  Object.entries(byCategory).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(0);
    console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%) - ${testCategories[category]}`);
  });
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  • ${r.relativePath}: ${r.error.split('\n')[0]}`);
      });
  }
  
  console.log('\n' + (failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed - check output above'));
  
  return failed === 0;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const category = args[0];
  
  // Validate category if provided
  if (category && !testCategories[category]) {
    console.log(`❌ Invalid category: ${category}`);
    console.log(`Valid categories: ${Object.keys(testCategories).join(', ')}`);
    process.exit(1);
  }
  
  // Show available categories
  if (category) {
    console.log(`📂 Running tests in category: ${category}`);
    console.log(`   ${testCategories[category]}\n`);
  } else {
    console.log('📂 Available test categories:');
    Object.entries(testCategories).forEach(([cat, desc]) => {
      console.log(`   ${cat}: ${desc}`);
    });
    console.log('\n🔄 Running all categories...\n');
  }
  
  // Find test files
  const testFiles = findTestFiles(category);
  
  if (testFiles.length === 0) {
    console.log('❌ No test files found!');
    process.exit(1);
  }
  
  console.log(`📊 Found ${testFiles.length} test file(s)\n`);
  
  // Run tests
  const results = [];
  
  for (const testFile of testFiles) {
    const result = runTest(testFile);
    results.push({
      ...result,
      category: testFile.category,
      name: testFile.name,
      relativePath: testFile.relativePath
    });
    
    console.log(''); // Add spacing between tests
  }
  
  // Generate report
  const allPassed = generateReport(results);
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Show usage if --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node run-tests.js [category]');
  console.log('');
  console.log('Categories:');
  Object.entries(testCategories).forEach(([cat, desc]) => {
    console.log(`  ${cat}: ${desc}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  node run-tests.js           # Run all tests');
  console.log('  node run-tests.js unit       # Run only unit tests');
  console.log('  node run-tests.js performance # Run only performance tests');
  process.exit(0);
}

// Run main function
main();