// Test to debug why widgets show as 'title' instead of 'widget' category
// This simulates the actual extraction flow

console.log('🔍 Debugging Widget Extraction Flow\n');

// Simulate the roleToCategory function from extractionWorkerManager.ts
function roleToCategory(role) {
  console.log(`[roleToCategory] Input role: "${role}"`);
  
  // Check for explicit widget role first
  if (role === 'widget') {
    console.log(`[roleToCategory] ✅ Explicit widget role → 'widget'`);
    return 'widget';
  }
  if (role.includes('button') || role.includes('input') || role.includes('dropdown')) {
    console.log(`[roleToCategory] ✅ Interactive element → 'widget'`);
    return 'widget';
  }
  if (role.includes('text') || role.includes('title') || role.includes('label')) {
    console.log(`[roleToCategory] ⚠️  Text element → 'text'`);
    return 'text';
  }
  if (role.includes('connector') || role.includes('decision') || role.includes('process')) {
    console.log(`[roleToCategory] ⚠️  Diagram element → 'diagram'`);
    return 'diagram';
  }
  if (role.includes('rectangle') || role.includes('ellipse') || role.includes('shape')) {
    console.log(`[roleToCategory] ⚠️  Shape element → 'shape'`);
    return 'shape';
  }
  
  console.log(`[roleToCategory] ⚠️  Unknown element → 'unknown'`);
  return 'unknown';
}

// Simulate what might happen in the extraction pipeline
console.log('📊 Simulating Role Assignment Process:\n');

// Test case 1: Rectangle with text "CHART: sales data"
console.log('Test 1: Rectangle with "CHART: sales data"');
const textElement = "CHART: sales data";

// First, widget detection would run
console.log(`1. Widget detection checks text: "${textElement}"`);
const isChart = /^CHART\s*:\s*(.+)/i.test(textElement);
console.log(`   Pattern match: ${isChart ? '✅ CHART widget detected' : '❌ No match'}`);

// If widget detected, role should be set to 'widget'
const detectedRole = isChart ? 'widget' : 'title'; // This might be the issue!
console.log(`2. Role assignment: "${detectedRole}"`);

// Then roleToCategory converts it
const category = roleToCategory(detectedRole);
console.log(`3. Final category: "${category}"`);

console.log('');

// Test case 2: What if the role assignment is wrong?
console.log('Test 2: If role assignment goes wrong...');
console.log('Widget detected but role assigned as "title" instead of "widget":');
const wrongRole = 'title';
const wrongCategory = roleToCategory(wrongRole);
console.log(`Final result: category="${wrongCategory}" (This would show blue overlay!)\n`);

// Test the correct flow
console.log('Test 3: Correct flow');
console.log('Widget detected AND role correctly assigned as "widget":');
const correctRole = 'widget';
const correctCategory = roleToCategory(correctRole);
console.log(`Final result: category="${correctCategory}" (This would show colored overlay!)\n`);

console.log('🎯 Conclusion:');
console.log('The issue is likely in the semantic role assignment stage.');
console.log('Even if widget detection works, if the role isn\'t set to "widget",');
console.log('the overlay will be blue instead of colored.\n');

console.log('💡 Next Steps:');
console.log('1. Check if ComponentRole.WIDGET is being set correctly');
console.log('2. Verify the role override logic: finalRole = widgetDetection?.isWidget ? ComponentRole.WIDGET : assignment.role');
console.log('3. Check that ComponentRole enum includes WIDGET');