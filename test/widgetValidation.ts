// Step 6: Widget Placeholder System Validation
// Comprehensive test suite for widget detection, storage, and integration

import { WidgetStorageManager } from '../lib/widgetStorage';
import { widgetFactory } from '../lib/widgetFactory';
import { 
  WidgetType, 
  WidgetMetadata, 
  MapWidgetMetadata,
  VideoWidgetMetadata,
  BoundingBox 
} from '../types/widgets';

// =============================================================================
// TEST DATA CREATION
// =============================================================================

function createTestWidgetElements() {
  return {
    // Widget pattern detection test elements
    patternDetection: [
      {
        id: 'map-widget-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        text: '[MAP: San Francisco, CA]',
        backgroundColor: '#e5f3ff'
      },
      {
        id: 'video-widget-1',
        type: 'rectangle',
        x: 450,
        y: 100,
        width: 400,
        height: 225,
        text: '[VIDEO: https://youtube.com/watch?v=dQw4w9WgXcQ]',
        backgroundColor: '#ffe5f3'
      },
      {
        id: 'iframe-widget-1',
        type: 'rectangle',
        x: 100,
        y: 350,
        width: 350,
        height: 200,
        text: '[IFRAME: https://example.com]',
        backgroundColor: '#f0fff0'
      },
      {
        id: 'chart-widget-1',
        type: 'rectangle',
        x: 500,
        y: 350,
        width: 300,
        height: 180,
        text: '[CHART: line chart data]',
        backgroundColor: '#fff5ee'
      },
      {
        id: 'calendar-widget-1',
        type: 'rectangle',
        x: 100,
        y: 600,
        width: 400,
        height: 300,
        text: '[CALENDAR: monthly view]',
        backgroundColor: '#f5f5ff'
      },
      // Pattern-based detection (without brackets)
      {
        id: 'map-pattern-1',
        type: 'rectangle',
        x: 550,
        y: 600,
        width: 250,
        height: 150,
        text: 'Google Maps location viewer',
        backgroundColor: '#f0f8ff'
      },
      {
        id: 'video-pattern-1',
        type: 'rectangle',
        x: 100,
        y: 950,
        width: 350,
        height: 200,
        text: 'YouTube video player embed',
        backgroundColor: '#fff0f8'
      },
      // Non-widget rectangles for negative testing
      {
        id: 'normal-rect-1',
        type: 'rectangle',
        x: 500,
        y: 950,
        width: 200,
        height: 100,
        text: 'Regular button',
        backgroundColor: '#f0f0f0'
      }
    ],

    // Performance test (50+ widget placeholders)
    performance: generatePerformanceWidgets(50)
  };
}

function generatePerformanceWidgets(count: number): any[] {
  const widgets = [];
  const widgetTypes = ['[MAP]', '[VIDEO]', '[IFRAME]', '[CHART]', '[CALENDAR]'];
  
  for (let i = 0; i < count; i++) {
    const widgetType = widgetTypes[i % widgetTypes.length];
    const row = Math.floor(i / 10);
    const col = i % 10;
    
    widgets.push({
      id: `perf-widget-${i}`,
      type: 'rectangle',
      x: col * 150,
      y: row * 120,
      width: 140,
      height: 100,
      text: `${widgetType} ${i}`,
      backgroundColor: '#f0f8ff'
    });
  }
  
  return widgets;
}

// =============================================================================
// WIDGET DETECTION TESTS
// =============================================================================

function testWidgetDetection(): boolean {
  console.log('🧪 Testing Widget Detection');
  
  const testElements = createTestWidgetElements().patternDetection;
  let passedTests = 0;
  const totalTests = 7;
  
  // Test MAP detection with brackets
  const mapWidget = testElements.find(e => e.id === 'map-widget-1')!;
  const mapBounds: BoundingBox = { x: mapWidget.x, y: mapWidget.y, width: mapWidget.width, height: mapWidget.height };
  const mapDetection = widgetFactory.createFromPattern(mapWidget.text, mapWidget.id, mapBounds);
  
  if (mapDetection && mapDetection.type === WidgetType.MAP) {
    console.log('  ✅ MAP widget detection with brackets');
    passedTests++;
  } else {
    console.log('  ❌ MAP widget detection with brackets failed');
  }
  
  // Test VIDEO detection with URL
  const videoWidget = testElements.find(e => e.id === 'video-widget-1')!;
  const videoBounds: BoundingBox = { x: videoWidget.x, y: videoWidget.y, width: videoWidget.width, height: videoWidget.height };
  const videoDetection = widgetFactory.createFromPattern(videoWidget.text, videoWidget.id, videoBounds);
  
  if (videoDetection && videoDetection.type === WidgetType.VIDEO) {
    const videoMeta = videoDetection as VideoWidgetMetadata;
    if (videoMeta.config.url.includes('youtube.com')) {
      console.log('  ✅ VIDEO widget detection with URL extraction');
      passedTests++;
    } else {
      console.log('  ❌ VIDEO URL extraction failed');
    }
  } else {
    console.log('  ❌ VIDEO widget detection failed');
  }
  
  // Test IFRAME detection
  const iframeWidget = testElements.find(e => e.id === 'iframe-widget-1')!;
  const iframeBounds: BoundingBox = { x: iframeWidget.x, y: iframeWidget.y, width: iframeWidget.width, height: iframeWidget.height };
  const iframeDetection = widgetFactory.createFromPattern(iframeWidget.text, iframeWidget.id, iframeBounds);
  
  if (iframeDetection && iframeDetection.type === WidgetType.IFRAME) {
    console.log('  ✅ IFRAME widget detection');
    passedTests++;
  } else {
    console.log('  ❌ IFRAME widget detection failed');
  }
  
  // Test CHART detection
  const chartWidget = testElements.find(e => e.id === 'chart-widget-1')!;
  const chartBounds: BoundingBox = { x: chartWidget.x, y: chartWidget.y, width: chartWidget.width, height: chartWidget.height };
  const chartDetection = widgetFactory.createFromPattern(chartWidget.text, chartWidget.id, chartBounds);
  
  if (chartDetection && chartDetection.type === WidgetType.CHART) {
    console.log('  ✅ CHART widget detection');
    passedTests++;
  } else {
    console.log('  ❌ CHART widget detection failed');
  }
  
  // Test CALENDAR detection
  const calendarWidget = testElements.find(e => e.id === 'calendar-widget-1')!;
  const calendarBounds: BoundingBox = { x: calendarWidget.x, y: calendarWidget.y, width: calendarWidget.width, height: calendarWidget.height };
  const calendarDetection = widgetFactory.createFromPattern(calendarWidget.text, calendarWidget.id, calendarBounds);
  
  if (calendarDetection && calendarDetection.type === WidgetType.CALENDAR) {
    console.log('  ✅ CALENDAR widget detection');
    passedTests++;
  } else {
    console.log('  ❌ CALENDAR widget detection failed');
  }
  
  // Test pattern-based detection (without brackets)
  const mapPatternWidget = testElements.find(e => e.id === 'map-pattern-1')!;
  const mapPatternBounds: BoundingBox = { x: mapPatternWidget.x, y: mapPatternWidget.y, width: mapPatternWidget.width, height: mapPatternWidget.height };
  const mapPatternDetection = widgetFactory.createFromPattern(mapPatternWidget.text, mapPatternWidget.id, mapPatternBounds);
  
  if (mapPatternDetection && mapPatternDetection.type === WidgetType.MAP) {
    console.log('  ✅ Pattern-based MAP detection (without brackets)');
    passedTests++;
  } else {
    console.log('  ❌ Pattern-based MAP detection failed');
  }
  
  // Test negative case (should not detect widget)
  const normalRect = testElements.find(e => e.id === 'normal-rect-1')!;
  const normalBounds: BoundingBox = { x: normalRect.x, y: normalRect.y, width: normalRect.width, height: normalRect.height };
  const normalDetection = widgetFactory.createFromPattern(normalRect.text, normalRect.id, normalBounds);
  
  if (!normalDetection) {
    console.log('  ✅ Negative test: Non-widget not detected');
    passedTests++;
  } else {
    console.log('  ❌ Negative test failed: Non-widget was detected as widget');
  }
  
  console.log(`Widget Detection: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// =============================================================================
// METADATA PERSISTENCE TESTS
// =============================================================================

function testMetadataPersistence(): boolean {
  console.log('🧪 Testing Metadata Persistence');
  
  const storage = new WidgetStorageManager();
  let passedTests = 0;
  const totalTests = 5;
  
  // Test 1: Basic storage and retrieval
  const mapMetadata: MapWidgetMetadata = {
    type: WidgetType.MAP,
    elementId: 'test-map-1',
    title: 'Test Map',
    description: 'Test map widget',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
    config: {
      center: { latitude: 37.7749, longitude: -122.4194 },
      zoom: 12,
      mapStyle: 'roadmap',
      showControls: true,
      allowZoom: true,
      allowPan: true,
      markers: []
    }
  };
  
  storage.set('test-map-1', mapMetadata);
  const retrieved = storage.get('test-map-1');
  
  if (retrieved && retrieved.type === WidgetType.MAP && retrieved.elementId === 'test-map-1') {
    console.log('  ✅ Basic storage and retrieval');
    passedTests++;
  } else {
    console.log('  ❌ Basic storage and retrieval failed');
  }
  
  // Test 2: Metadata update
  const updated = storage.update('test-map-1', { title: 'Updated Map Title' });
  const updatedMetadata = storage.get('test-map-1');
  
  if (updated && updatedMetadata && updatedMetadata.title === 'Updated Map Title') {
    console.log('  ✅ Metadata update');
    passedTests++;
  } else {
    console.log('  ❌ Metadata update failed');
  }
  
  // Test 3: Duplication
  const duplicated = storage.duplicate('test-map-1', 'test-map-2');
  const duplicateMetadata = storage.get('test-map-2');
  
  if (duplicated && duplicateMetadata && duplicateMetadata.elementId === 'test-map-2') {
    console.log('  ✅ Metadata duplication');
    passedTests++;
  } else {
    console.log('  ❌ Metadata duplication failed');
  }
  
  // Test 4: Serialization
  const serialized = storage.serialize();
  const newStorage = new WidgetStorageManager();
  const deserialized = newStorage.deserialize(serialized);
  const deserializedMetadata = newStorage.get('test-map-1');
  
  if (deserialized && deserializedMetadata && deserializedMetadata.title === 'Updated Map Title') {
    console.log('  ✅ Serialization and deserialization');
    passedTests++;
  } else {
    console.log('  ❌ Serialization and deserialization failed');
  }
  
  // Test 5: Cleanup
  const deleted = storage.delete('test-map-1');
  const deletedCheck = storage.get('test-map-1');
  
  if (deleted && !deletedCheck) {
    console.log('  ✅ Metadata deletion');
    passedTests++;
  } else {
    console.log('  ❌ Metadata deletion failed');
  }
  
  console.log(`Metadata Persistence: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// =============================================================================
// UNDO/REDO TESTS
// =============================================================================

function testUndoRedo(): boolean {
  console.log('🧪 Testing Undo/Redo Functionality');
  
  const storage = new WidgetStorageManager();
  let passedTests = 0;
  const totalTests = 3;
  
  // Create initial state
  const widget1: VideoWidgetMetadata = {
    type: WidgetType.VIDEO,
    elementId: 'video-1',
    title: 'Video 1',
    description: 'Test video',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
    config: {
      url: 'https://youtube.com/watch?v=test',
      provider: 'youtube',
      autoplay: false,
      loop: false,
      muted: false,
      controls: true,
      aspectRatio: 16/9
    }
  };
  
  // Test snapshot creation and restoration
  storage.set('video-1', widget1);
  const snapshot1 = storage.saveSnapshot('create', 'video-1');
  
  // Modify the widget
  storage.update('video-1', { title: 'Modified Video' });
  const snapshot2 = storage.saveSnapshot('update', 'video-1');
  
  // Delete the widget
  storage.delete('video-1');
  
  // Test restore to snapshot2 (after modification)
  const restored2 = storage.restoreSnapshot(snapshot2);
  const restoredWidget2 = storage.get('video-1');
  
  if (restored2 && restoredWidget2 && restoredWidget2.title === 'Modified Video') {
    console.log('  ✅ Restore to modification snapshot');
    passedTests++;
  } else {
    console.log('  ❌ Restore to modification snapshot failed');
  }
  
  // Test restore to snapshot1 (original state)
  const restored1 = storage.restoreSnapshot(snapshot1);
  const restoredWidget1 = storage.get('video-1');
  
  if (restored1 && restoredWidget1 && restoredWidget1.title === 'Video 1') {
    console.log('  ✅ Restore to original snapshot');
    passedTests++;
  } else {
    console.log('  ❌ Restore to original snapshot failed');
  }
  
  // Test history tracking
  const history = storage.getHistory();
  
  if (history.length >= 2) {
    console.log('  ✅ Snapshot history tracking');
    passedTests++;
  } else {
    console.log('  ❌ Snapshot history tracking failed');
  }
  
  console.log(`Undo/Redo: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

function testPerformance(): boolean {
  console.log('🧪 Testing Performance with 50+ Widgets');
  
  const storage = new WidgetStorageManager();
  const testWidgets = createTestWidgetElements().performance;
  let passedTests = 0;
  const totalTests = 3;
  
  // Test 1: Bulk widget creation performance
  const startTime = performance.now();
  
  for (let i = 0; i < testWidgets.length; i++) {
    const widget = testWidgets[i];
    const bounds: BoundingBox = { x: widget.x, y: widget.y, width: widget.width, height: widget.height };
    const metadata = widgetFactory.createFromPattern(widget.text, widget.id, bounds);
    
    if (metadata) {
      storage.set(widget.id, metadata);
    }
  }
  
  const creationTime = performance.now() - startTime;
  
  if (creationTime < 1000) { // Should create 50 widgets in under 1 second
    console.log(`  ✅ Bulk creation: ${testWidgets.length} widgets in ${creationTime.toFixed(2)}ms`);
    passedTests++;
  } else {
    console.log(`  ❌ Bulk creation too slow: ${creationTime.toFixed(2)}ms`);
  }
  
  // Test 2: Lookup performance
  const lookupStart = performance.now();
  
  for (let i = 0; i < 100; i++) {
    const randomId = `perf-widget-${Math.floor(Math.random() * testWidgets.length)}`;
    storage.get(randomId);
  }
  
  const lookupTime = performance.now() - lookupStart;
  
  if (lookupTime < 10) { // 100 lookups should be under 10ms
    console.log(`  ✅ Lookup performance: 100 lookups in ${lookupTime.toFixed(2)}ms`);
    passedTests++;
  } else {
    console.log(`  ❌ Lookup performance too slow: ${lookupTime.toFixed(2)}ms`);
  }
  
  // Test 3: Memory usage estimation
  const stats = storage.getStatistics();
  const memoryUsage = stats.memoryUsage;
  
  if (memoryUsage > 0 && memoryUsage < 1024 * 1024) { // Should be under 1MB
    console.log(`  ✅ Memory usage: ${(memoryUsage / 1024).toFixed(2)} KB for ${stats.totalWidgets} widgets`);
    passedTests++;
  } else {
    console.log(`  ❌ Memory usage too high: ${(memoryUsage / 1024).toFixed(2)} KB`);
  }
  
  console.log(`Performance: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// =============================================================================
// EXPORT PREPARATION TESTS
// =============================================================================

function testExportPreparation(): boolean {
  console.log('🧪 Testing Export Preparation');
  
  const storage = new WidgetStorageManager();
  let passedTests = 0;
  const totalTests = 2;
  
  // Create test widgets
  const mapWidget: MapWidgetMetadata = {
    type: WidgetType.MAP,
    elementId: 'export-map',
    title: 'Export Map',
    description: 'Map for export testing',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0',
    config: {
      center: { latitude: 40.7128, longitude: -74.0060 },
      zoom: 10,
      mapStyle: 'roadmap',
      showControls: true,
      allowZoom: true,
      allowPan: true,
      markers: [
        {
          id: 'marker-1',
          latitude: 40.7128,
          longitude: -74.0060,
          title: 'New York',
          description: 'NYC marker'
        }
      ]
    },
    staticSnapshot: {
      imageUrl: 'https://example.com/map-snapshot.png',
      generatedAt: Date.now(),
      bounds: { x: 100, y: 100, width: 300, height: 200 }
    }
  };
  
  storage.set('export-map', mapWidget);
  
  // Test 1: Widget data structure is export-ready
  const widget = storage.get('export-map');
  
  if (widget && widget.staticSnapshot && widget.config) {
    console.log('  ✅ Widget contains export-ready data (config + snapshot)');
    passedTests++;
  } else {
    console.log('  ❌ Widget missing export-ready data');
  }
  
  // Test 2: Serialization produces valid export format
  const serialized = storage.serialize();
  const parsed = JSON.parse(serialized);
  
  if (parsed.widgets && parsed.widgets['export-map'] && parsed.metadata) {
    console.log('  ✅ Serialization produces valid export format');
    passedTests++;
  } else {
    console.log('  ❌ Serialization format invalid');
  }
  
  console.log(`Export Preparation: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

export async function runWidgetValidationTests(): Promise<boolean> {
  console.log('🚀 Starting Widget Placeholder System Validation\n');
  
  const tests = [
    { name: 'Widget Detection', fn: testWidgetDetection },
    { name: 'Metadata Persistence', fn: testMetadataPersistence },
    { name: 'Undo/Redo Functionality', fn: testUndoRedo },
    { name: 'Performance with 50+ Widgets', fn: testPerformance },
    { name: 'Export Preparation', fn: testExportPreparation }
  ];
  
  const results: boolean[] = [];
  
  for (const test of tests) {
    try {
      const result = test.fn();
      results.push(result);
      console.log('');
    } catch (error) {
      console.error(`❌ ${test.name} failed with error:`, error);
      results.push(false);
      console.log('');
    }
  }
  
  const passedCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  console.log('='.repeat(60));
  console.log(`📊 WIDGET VALIDATION SUMMARY: ${passedCount}/${totalCount} test suites passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All widget validation tests passed! Widget system is ready for production.');
    return true;
  } else {
    console.log('⚠️  Some widget tests failed. Review the implementation.');
    return false;
  }
}

// Export individual test functions
export {
  testWidgetDetection,
  testMetadataPersistence,
  testUndoRedo,
  testPerformance,
  testExportPreparation,
  createTestWidgetElements
};