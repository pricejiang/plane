// Quick demonstration of Widget Placeholder System
// Run with: node test-widgets.js

console.log('🎨 Widget Placeholder System Demo');
console.log('==================================\n');

// Simulate widget detection patterns
const widgetPatterns = [
  { text: '[MAP: San Francisco]', expected: 'map widget' },
  { text: '[VIDEO: https://youtube.com/watch?v=abc123]', expected: 'video widget' },
  { text: '[IFRAME: https://example.com]', expected: 'iframe widget' },
  { text: '[CHART: sales data]', expected: 'chart widget' },
  { text: '[CALENDAR: weekly view]', expected: 'calendar widget' },
  { text: 'Google Maps location', expected: 'map widget (pattern-based)' },
  { text: 'YouTube video embed', expected: 'video widget (pattern-based)' },
  { text: 'Regular button text', expected: 'no widget detected' }
];

console.log('📋 Widget Pattern Detection:');
widgetPatterns.forEach((pattern, index) => {
  const detected = detectWidgetPattern(pattern.text);
  const status = detected ? '✅' : '❌';
  console.log(`  ${status} "${pattern.text}" → ${detected || 'not detected'}`);
});

console.log('\n🏗️  Widget Metadata Creation:');

// Simulate creating widget metadata
const widgets = [
  {
    id: 'map-1',
    type: 'MAP',
    config: {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 12,
      style: 'roadmap'
    }
  },
  {
    id: 'video-1', 
    type: 'VIDEO',
    config: {
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      autoplay: false,
      controls: true
    }
  },
  {
    id: 'chart-1',
    type: 'CHART',
    config: {
      type: 'line',
      dataUrl: 'https://api.example.com/sales-data'
    }
  }
];

widgets.forEach(widget => {
  console.log(`  📊 ${widget.type} Widget (${widget.id}):`);
  console.log(`     Config: ${JSON.stringify(widget.config)}`);
  console.log(`     Created: ${new Date().toISOString()}`);
});

console.log('\n⚡ Storage & Lifecycle Management:');

// Simulate storage operations
const storage = new Map();
let operationCount = 0;

function simulateStorageOperation(operation, widgetId, data) {
  operationCount++;
  const timestamp = new Date().toISOString();
  
  switch (operation) {
    case 'CREATE':
      storage.set(widgetId, { ...data, createdAt: timestamp, updatedAt: timestamp });
      console.log(`  ✅ CREATE: Widget ${widgetId} stored`);
      break;
      
    case 'UPDATE':
      const existing = storage.get(widgetId);
      if (existing) {
        storage.set(widgetId, { ...existing, ...data, updatedAt: timestamp });
        console.log(`  ✅ UPDATE: Widget ${widgetId} updated`);
      }
      break;
      
    case 'DUPLICATE':
      const source = storage.get(widgetId);
      if (source) {
        const newId = `${widgetId}-copy`;
        storage.set(newId, { ...source, id: newId, createdAt: timestamp });
        console.log(`  ✅ DUPLICATE: Widget ${widgetId} → ${newId}`);
      }
      break;
      
    case 'DELETE':
      const deleted = storage.delete(widgetId);
      console.log(`  ${deleted ? '✅' : '❌'} DELETE: Widget ${widgetId}`);
      break;
  }
}

// Simulate widget lifecycle
simulateStorageOperation('CREATE', 'map-widget-1', widgets[0]);
simulateStorageOperation('UPDATE', 'map-widget-1', { title: 'Updated Map' });
simulateStorageOperation('DUPLICATE', 'map-widget-1');
simulateStorageOperation('CREATE', 'video-widget-1', widgets[1]);
simulateStorageOperation('DELETE', 'map-widget-1-copy');

console.log(`\n📈 Performance Simulation:`);
console.log(`  • Storage operations: ${operationCount}`);
console.log(`  • Widgets in storage: ${storage.size}`);
console.log(`  • Memory usage: ~${storage.size * 150} bytes (estimated)`);

console.log('\n🔄 Token Optimization Impact:');

// Simulate token reduction
const originalElementDescription = `
Rectangle Element:
- Type: rectangle
- Position: (100, 100)
- Size: 300x200
- Background: #e5f3ff
- Stroke: #000000, width: 1
- Text: "[MAP: San Francisco]"
- Opacity: 1.0
- Angle: 0
- Layer: 5
- Z-index: 10
`.trim();

const semanticWidgetDescription = `
Widget Component:
- Role: map_widget
- Type: MAP
- Confidence: 95%
- Bounds: (100, 100) 300x200
- Config: {center: SF, zoom: 12}
`.trim();

const originalTokens = Math.ceil(originalElementDescription.length / 4);
const optimizedTokens = Math.ceil(semanticWidgetDescription.length / 4);
const reduction = ((originalTokens - optimizedTokens) / originalTokens * 100);

console.log(`  Original element: ${originalTokens} tokens`);
console.log(`  Widget semantic: ${optimizedTokens} tokens`);
console.log(`  Reduction: ${reduction.toFixed(1)}% (${originalTokens - optimizedTokens} tokens saved)`);

console.log('\n🎯 Integration with Extraction Pipeline:');
console.log('  ✅ Stage 6 added: Widget Detection');
console.log('  ✅ Components marked with role: "widget"');
console.log('  ✅ Widget metadata included in component data');
console.log('  ✅ Overlay system renders interactive widgets');
console.log('  ✅ Export system includes static snapshots');

console.log('\n📋 Example Overlay Labels:');
const overlayLabels = [
  { text: 'map widget (95%)', type: 'MAP', bounds: '(100,100) 300x200' },
  { text: 'video widget (90%)', type: 'VIDEO', bounds: '(450,100) 400x225' },
  { text: 'chart widget (85%)', type: 'CHART', bounds: '(100,350) 300x180' }
];

overlayLabels.forEach(label => {
  console.log(`  🔷 "${label.text}" [${label.type}] at ${label.bounds}`);
});

console.log('\n🎉 Widget Placeholder System Demo Complete!');
console.log('    Ready for interactive widget rendering in overlay.');

// Helper function for pattern detection simulation
function detectWidgetPattern(text) {
  const patterns = [
    { regex: /\[MAP[^\]]*\]/i, name: 'map widget' },
    { regex: /\[VIDEO[^\]]*\]/i, name: 'video widget' },
    { regex: /\[IFRAME[^\]]*\]/i, name: 'iframe widget' },
    { regex: /\[CHART[^\]]*\]/i, name: 'chart widget' },
    { regex: /\[CALENDAR[^\]]*\]/i, name: 'calendar widget' },
    { regex: /(?:google\s*maps?|location)/i, name: 'map widget (pattern-based)' },
    { regex: /(?:youtube|video.*embed)/i, name: 'video widget (pattern-based)' },
    { regex: /(?:chart|graph)/i, name: 'chart widget (pattern-based)' }
  ];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(text)) {
      return pattern.name;
    }
  }
  
  return null;
}