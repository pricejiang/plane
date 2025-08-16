// Simple widget detection test (no WebWorker)
// Run with: node tests/unit/test-widget-simple.js

console.log('🧪 Testing Widget Detection Logic\n');

// Simulate the widget detection patterns
function detectWidgetFromText(text) {
  const patterns = [
    // Bracket patterns (highest confidence)
    { regex: /\[MAP[^\]]*\]/i, type: 'MAP', confidence: 0.95 },
    { regex: /\[VIDEO[^\]]*\]/i, type: 'VIDEO', confidence: 0.95 },
    { regex: /\[IFRAME[^\]]*\]/i, type: 'IFRAME', confidence: 0.9 },
    { regex: /\[CHART[^\]]*\]/i, type: 'CHART', confidence: 0.9 },
    { regex: /\[CALENDAR[^\]]*\]/i, type: 'CALENDAR', confidence: 0.9 },
    
    // Non-bracket patterns (like user's test case)
    { regex: /^CHART\s*:\s*(.+)/i, type: 'CHART', confidence: 0.8 },
    { regex: /^MAP\s*:\s*(.+)/i, type: 'MAP', confidence: 0.8 },
    { regex: /^VIDEO\s*:\s*(.+)/i, type: 'VIDEO', confidence: 0.8 },
    { regex: /^IFRAME\s*:\s*(.+)/i, type: 'IFRAME', confidence: 0.8 },
    { regex: /^CALENDAR\s*:\s*(.+)/i, type: 'CALENDAR', confidence: 0.8 },
    
    // General keyword patterns (lower confidence)
    { regex: /(?:map|google\s*maps?|location)/i, type: 'MAP', confidence: 0.7 },
    { regex: /(?:youtube|vimeo|video)/i, type: 'VIDEO', confidence: 0.8 },
    { regex: /(?:embed|iframe|website)/i, type: 'IFRAME', confidence: 0.7 },
    { regex: /(?:chart|graph|plot|analytics)/i, type: 'CHART', confidence: 0.75 },
    { regex: /(?:calendar|schedule|events?)/i, type: 'CALENDAR', confidence: 0.75 }
  ];
  
  for (const { regex, type, confidence } of patterns) {
    if (regex.test(text)) {
      return {
        isWidget: true,
        type,
        confidence,
        reasoning: [`Matched pattern for ${type}`, `Confidence: ${(confidence * 100).toFixed(1)}%`]
      };
    }
  }
  
  return {
    isWidget: false,
    confidence: 0,
    reasoning: ['No widget patterns matched']
  };
}

// Test cases that should work in your app
const testCases = [
  { text: '[MAP: San Francisco]', expect: 'MAP widget detected' },
  { text: '[VIDEO: https://youtube.com/watch?v=abc123]', expect: 'VIDEO widget detected' },
  { text: '[IFRAME: https://example.com]', expect: 'IFRAME widget detected' },
  { text: '[CHART: sales data]', expect: 'CHART widget detected' },
  { text: '[CALENDAR: monthly view]', expect: 'CALENDAR widget detected' },
  // User's exact test cases
  { text: 'CHART: sales data', expect: 'CHART widget detected' },
  { text: 'MAP: San Francisco', expect: 'MAP widget detected' },
  { text: 'Google Maps location', expect: 'MAP widget detected (pattern)' },
  { text: 'YouTube video embed', expect: 'VIDEO widget detected (pattern)' },
  { text: 'Regular button text', expect: 'No widget detected' },
  { text: 'Submit Button', expect: 'No widget detected' }
];

console.log('📋 Testing Widget Pattern Detection:\n');

let passedTests = 0;
testCases.forEach((testCase, index) => {
  const result = detectWidgetFromText(testCase.text);
  const passed = result.isWidget === testCase.expect.includes('detected');
  
  if (passed) {
    passedTests++;
    console.log(`✅ Test ${index + 1}: "${testCase.text}"`);
    if (result.isWidget) {
      console.log(`   → ${result.type} widget (${(result.confidence * 100).toFixed(0)}% confidence)`);
    } else {
      console.log(`   → No widget detected`);
    }
  } else {
    console.log(`❌ Test ${index + 1}: "${testCase.text}"`);
    console.log(`   Expected: ${testCase.expect}`);
    console.log(`   Got: ${result.isWidget ? `${result.type} widget` : 'No widget'}`);
  }
  console.log('');
});

console.log(`📊 Results: ${passedTests}/${testCases.length} tests passed\n`);

if (passedTests === testCases.length) {
  console.log('🎉 Widget detection logic is working correctly!');
  console.log('\n📝 To see widgets in your app:');
  console.log('1. Draw rectangles in Excalidraw');
  console.log('2. Add text like "[MAP]" or "[VIDEO]" to the rectangles');
  console.log('3. Click "Scan Canvas"');
  console.log('4. Look for colored overlays instead of blue ones');
  console.log('\n🎨 Expected overlay colors:');
  console.log('   🗺️  MAP widgets: Green background');
  console.log('   🎥 VIDEO widgets: Red background');
  console.log('   📊 CHART widgets: Amber background');
  console.log('   📅 CALENDAR widgets: Cyan background');
  console.log('   🌐 IFRAME widgets: Purple background');
} else {
  console.log('❌ Some widget detection tests failed. Check the implementation.');
}

// Simulate the overlay generation
console.log('\n🎭 Simulating Overlay Generation:');

const sampleWidgets = [
  { text: '[MAP: Central Park]', x: 100, y: 100, width: 300, height: 200 },
  { text: '[VIDEO: https://youtube.com/watch?v=demo]', x: 450, y: 100, width: 400, height: 225 },
  { text: '[CHART: Q4 Sales]', x: 100, y: 350, width: 300, height: 180 }
];

sampleWidgets.forEach((widget, index) => {
  const detection = detectWidgetFromText(widget.text);
  if (detection.isWidget) {
    const colors = {
      MAP: 'Green 🗺️',
      VIDEO: 'Red 🎥', 
      CHART: 'Amber 📊',
      CALENDAR: 'Cyan 📅',
      IFRAME: 'Purple 🌐'
    };
    
    console.log(`  Widget ${index + 1}: ${colors[detection.type]} overlay`);
    console.log(`    Label: "${detection.type.toLowerCase()} widget (${(detection.confidence * 100).toFixed(0)}%)"`);
    console.log(`    Position: (${widget.x}, ${widget.y}) ${widget.width}x${widget.height}`);
    console.log('');
  }
});

console.log('✨ If you see colored overlays like this in your app, widgets are working!');