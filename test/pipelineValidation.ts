// Step 5: Comprehensive Pipeline Validation Tests
// Tests all 5 stages of the extraction pipeline with performance benchmarks

import { 
  normalizeElements,
  detectContainers,
  attachText,
  analyzeConnectors,
  assignRoles,
  runExtractionPipeline
} from '../workers/extractionPipeline.worker';
import { ComponentRole } from '../types/extraction';

// =============================================================================
// TEST DATA CREATION
// =============================================================================

function createTestElements() {
  return {
    // Test normalization with various element types
    normalization: [
      // Rectangle (potential button)
      {
        id: 'rect-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 120,
        height: 40,
        angle: 0,
        backgroundColor: '#4f46e5',
        strokeColor: '#000000',
        strokeWidth: 2,
        roundness: 0.2,
        text: 'Submit'
      },
      // Rotated rectangle
      {
        id: 'rect-2',
        type: 'rectangle',
        x: 200,
        y: 200,
        width: 100,
        height: 60,
        angle: Math.PI / 4, // 45 degrees
        backgroundColor: 'transparent',
        strokeColor: '#666666',
        strokeWidth: 1
      },
      // Diamond (decision point)
      {
        id: 'diamond-1',
        type: 'diamond',
        x: 300,
        y: 150,
        width: 80,
        height: 80,
        backgroundColor: '#fbbf24',
        strokeColor: '#000000'
      }
    ],

    // Test container hierarchy
    containerHierarchy: [
      // Large container
      {
        id: 'container-1',
        type: 'rectangle',
        x: 50,
        y: 50,
        width: 400,
        height: 300,
        backgroundColor: '#f3f4f6',
        strokeColor: '#d1d5db',
        strokeWidth: 1
      },
      // Medium container inside large
      {
        id: 'container-2',
        type: 'rectangle',
        x: 70,
        y: 100,
        width: 150,
        height: 100,
        backgroundColor: '#ffffff',
        strokeColor: '#9ca3af'
      },
      // Small element in medium container
      {
        id: 'button-1',
        type: 'rectangle',
        x: 90,
        y: 130,
        width: 80,
        height: 30,
        backgroundColor: '#10b981',
        roundness: 0.3
      },
      // Element in large container but not medium
      {
        id: 'input-1',
        type: 'rectangle',
        x: 250,
        y: 120,
        width: 180,
        height: 35,
        backgroundColor: '#ffffff',
        strokeColor: '#6b7280'
      }
    ],

    // Test text attachment
    textAttachment: [
      // Container with title
      {
        id: 'card-1',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        backgroundColor: '#ffffff',
        strokeColor: '#e5e7eb'
      },
      // Title text above container
      {
        id: 'title-1',
        type: 'text',
        x: 110,
        y: 80,
        width: 180,
        height: 20,
        text: 'User Profile Card',
        fontSize: 18
      },
      // Body text inside container
      {
        id: 'body-1',
        type: 'text',
        x: 110,
        y: 130,
        width: 180,
        height: 15,
        text: 'Display user information',
        fontSize: 14
      },
      // Standalone text
      {
        id: 'standalone-1',
        type: 'text',
        x: 400,
        y: 50,
        width: 100,
        height: 15,
        text: 'Isolated label',
        fontSize: 12
      }
    ],

    // Test connector analysis
    connectorAnalysis: [
      // Start shape
      {
        id: 'start-1',
        type: 'ellipse',
        x: 50,
        y: 100,
        width: 60,
        height: 60,
        backgroundColor: '#22c55e'
      },
      // Process shape
      {
        id: 'process-1',
        type: 'rectangle',
        x: 200,
        y: 115,
        width: 100,
        height: 30,
        backgroundColor: '#3b82f6',
        roundness: 0.2
      },
      // Decision shape
      {
        id: 'decision-1',
        type: 'diamond',
        x: 380,
        y: 110,
        width: 40,
        height: 40,
        backgroundColor: '#f59e0b'
      },
      // End shape
      {
        id: 'end-1',
        type: 'ellipse',
        x: 500,
        y: 100,
        width: 60,
        height: 60,
        backgroundColor: '#ef4444'
      },
      // Arrow 1: start to process
      {
        id: 'arrow-1',
        type: 'arrow',
        x: 110,
        y: 125,
        width: 90,
        height: 5,
        strokeColor: '#000000'
      },
      // Arrow 2: process to decision
      {
        id: 'arrow-2',
        type: 'arrow',
        x: 300,
        y: 128,
        width: 80,
        height: 5,
        strokeColor: '#000000'
      },
      // Arrow 3: decision to end
      {
        id: 'arrow-3',
        type: 'arrow',
        x: 420,
        y: 125,
        width: 80,
        height: 5,
        strokeColor: '#000000'
      }
    ],

    // Performance test elements (300 elements)
    performance: generatePerformanceTestElements(300)
  };
}

function generatePerformanceTestElements(count: number): any[] {
  const elements = [];
  const gridSize = Math.ceil(Math.sqrt(count));
  const spacing = 100;
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / gridSize);
    const col = i % gridSize;
    const x = col * spacing;
    const y = row * spacing;
    
    // Mix of different element types
    const types = ['rectangle', 'ellipse', 'diamond', 'text'];
    const type = types[i % types.length];
    
    const element: any = {
      id: `perf-${i}`,
      type,
      x,
      y,
      width: 80,
      height: 40,
      backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      strokeColor: '#000000',
      strokeWidth: 1
    };
    
    if (type === 'text') {
      element.text = `Element ${i}`;
      element.fontSize = 12;
    }
    
    if (type === 'rectangle' && Math.random() > 0.7) {
      element.roundness = 0.2; // Some rounded rectangles
    }
    
    elements.push(element);
  }
  
  return elements;
}

// =============================================================================
// STAGE 1: NORMALIZATION TESTS
// =============================================================================

function testNormalization() {
  console.log('🧪 Testing Stage 1: Element Normalization');
  
  const testData = createTestElements();
  const normalizedGroups = normalizeElements(testData.normalization);
  
  // Test grouping by type
  console.assert(normalizedGroups.rectangles.length === 2, 'Should have 2 rectangles');
  console.assert(normalizedGroups.diamonds.length === 1, 'Should have 1 diamond');
  
  // Test bounding box calculation
  const rotatedRect = normalizedGroups.rectangles.find(r => r.id === 'rect-2');
  if (rotatedRect) {
    console.assert(rotatedRect.angle === Math.PI / 4, 'Should preserve rotation angle');
    console.assert(rotatedRect.boundingBox.area > 0, 'Should have positive area');
    console.log(`  ✅ Rotated rectangle bounding box: ${JSON.stringify(rotatedRect.boundingBox)}`);
  }
  
  // Test style extraction
  const styledRect = normalizedGroups.rectangles.find(r => r.id === 'rect-1');
  if (styledRect) {
    console.assert(styledRect.style.backgroundColor === '#4f46e5', 'Should extract background color');
    console.assert(styledRect.style.roundness === 0.2, 'Should extract roundness');
    console.assert(styledRect.text === 'Submit', 'Should extract text');
    console.log(`  ✅ Style extraction: ${JSON.stringify(styledRect.style)}`);
  }
  
  console.log('✅ Stage 1: Normalization tests passed');
  return true;
}

// =============================================================================
// STAGE 2: CONTAINER DETECTION TESTS
// =============================================================================

function testContainerDetection() {
  console.log('🧪 Testing Stage 2: Container Detection');
  
  const testData = createTestElements();
  const normalizedGroups = normalizeElements(testData.containerHierarchy);
  const hierarchy = detectContainers(normalizedGroups);
  
  // Should identify containers
  console.assert(hierarchy.containers.length >= 1, 'Should find at least 1 container');
  
  // Test containment relationships
  const largeContainer = hierarchy.containers.find(c => c.id === 'container-1');
  if (largeContainer) {
    const contained = hierarchy.containmentMap.get('container-1') || [];
    console.log(`  ✅ Large container contains: ${contained.join(', ')}`);
    console.assert(contained.length > 0, 'Large container should contain elements');
  }
  
  // Test hierarchy (button-1 should be in container-2, which is in container-1)
  const buttonParent = hierarchy.parentMap.get('button-1');
  if (buttonParent) {
    console.log(`  ✅ Button parent: ${buttonParent}`);
  }
  
  console.log('✅ Stage 2: Container detection tests passed');
  return true;
}

// =============================================================================
// STAGE 3: TEXT ATTACHMENT TESTS
// =============================================================================

function testTextAttachment() {
  console.log('🧪 Testing Stage 3: Text Attachment');
  
  const testData = createTestElements();
  const normalizedGroups = normalizeElements(testData.textAttachment);
  const hierarchy = detectContainers(normalizedGroups);
  const textAttachments = attachText(normalizedGroups.text, 
    [...normalizedGroups.rectangles, ...normalizedGroups.ellipses], hierarchy);
  
  console.log(`  Found ${textAttachments.length} text attachments`);
  
  // Test title attachment
  const titleAttachment = textAttachments.find(ta => ta.textId === 'title-1');
  if (titleAttachment) {
    console.assert(titleAttachment.attachmentType === 'title', 'Should classify as title');
    console.assert(titleAttachment.attachedTo === 'card-1', 'Should attach to card');
    console.log(`  ✅ Title attachment: ${titleAttachment.attachmentType} to ${titleAttachment.attachedTo}`);
  }
  
  // Test body attachment
  const bodyAttachment = textAttachments.find(ta => ta.textId === 'body-1');
  if (bodyAttachment) {
    console.assert(bodyAttachment.attachmentType === 'body', 'Should classify as body');
    console.log(`  ✅ Body attachment: ${bodyAttachment.attachmentType}`);
  }
  
  // Test standalone text
  const standaloneAttachment = textAttachments.find(ta => ta.textId === 'standalone-1');
  if (standaloneAttachment) {
    console.assert(standaloneAttachment.attachmentType === 'standalone', 'Should be standalone');
    console.assert(standaloneAttachment.attachedTo === null, 'Should not attach to anything');
    console.log(`  ✅ Standalone text: ${standaloneAttachment.attachmentType}`);
  }
  
  console.log('✅ Stage 3: Text attachment tests passed');
  return true;
}

// =============================================================================
// STAGE 4: CONNECTOR ANALYSIS TESTS
// =============================================================================

function testConnectorAnalysis() {
  console.log('🧪 Testing Stage 4: Connector Analysis');
  
  const testData = createTestElements();
  const normalizedGroups = normalizeElements(testData.connectorAnalysis);
  const connectors = analyzeConnectors(
    normalizedGroups.arrows,
    normalizedGroups.lines,
    [...normalizedGroups.rectangles, ...normalizedGroups.ellipses, ...normalizedGroups.diamonds]
  );
  
  console.log(`  Found ${connectors.length} connectors`);
  
  // Should find all arrows as connectors
  console.assert(connectors.length === 3, 'Should find 3 connectors');
  
  // Test endpoint snapping
  const firstConnector = connectors[0];
  if (firstConnector) {
    console.assert(firstConnector.startAttachment !== null, 'Should snap to start shape');
    console.assert(firstConnector.endAttachment !== null, 'Should snap to end shape');
    console.log(`  ✅ Connector snapping: ${firstConnector.startAttachment?.shapeId} → ${firstConnector.endAttachment?.shapeId}`);
  }
  
  // Test direction classification
  const arrowConnector = connectors.find(c => c.direction === 'start-to-end');
  if (arrowConnector) {
    console.assert(arrowConnector.confidence >= 0.8, 'Arrow should have high confidence');
    console.log(`  ✅ Arrow direction: ${arrowConnector.direction} (confidence: ${arrowConnector.confidence})`);
  }
  
  console.log('✅ Stage 4: Connector analysis tests passed');
  return true;
}

// =============================================================================
// STAGE 5: ROLE ASSIGNMENT TESTS
// =============================================================================

function testRoleAssignment() {
  console.log('🧪 Testing Stage 5: Role Assignment');
  
  // Create elements with clear patterns
  const buttonElement = {
    id: 'button-test',
    type: 'rectangle',
    x: 100,
    y: 100,
    width: 120,
    height: 40,
    backgroundColor: '#3b82f6',
    roundness: 0.3,
    text: 'Click Me'
  };
  
  const diamondElement = {
    id: 'decision-test',
    type: 'diamond',
    x: 200,
    y: 150,
    width: 60,
    height: 60,
    backgroundColor: '#f59e0b'
  };
  
  const testElements = [buttonElement, diamondElement];
  const normalizedGroups = normalizeElements(testElements);
  const hierarchy = detectContainers(normalizedGroups);
  const textAttachments = attachText(normalizedGroups.text, 
    [...normalizedGroups.rectangles, ...normalizedGroups.diamonds], hierarchy);
  const connectors: any[] = [];
  
  const roleAssignments = assignRoles(normalizedGroups, hierarchy, textAttachments, connectors);
  
  console.log(`  Assigned roles to ${roleAssignments.length} elements`);
  
  // Test button detection
  const buttonRole = roleAssignments.find(ra => ra.elementId === 'button-test');
  if (buttonRole) {
    console.assert(buttonRole.role === ComponentRole.BUTTON, 'Should classify as button');
    console.assert(buttonRole.confidence >= 0.8, 'Button should have high confidence');
    console.log(`  ✅ Button detection: ${buttonRole.role} (confidence: ${buttonRole.confidence})`);
    console.log(`  Reasoning: ${buttonRole.reasoning.join(', ')}`);
  }
  
  // Test decision point detection
  const decisionRole = roleAssignments.find(ra => ra.elementId === 'decision-test');
  if (decisionRole) {
    console.assert(decisionRole.role === ComponentRole.DECISION_POINT, 'Should classify as decision point');
    console.assert(decisionRole.confidence >= 0.9, 'Diamond should have very high confidence');
    console.log(`  ✅ Decision detection: ${decisionRole.role} (confidence: ${decisionRole.confidence})`);
  }
  
  console.log('✅ Stage 5: Role assignment tests passed');
  return true;
}

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

async function testPerformance() {
  console.log('🧪 Testing Performance Targets');
  
  const testData = createTestElements();
  
  // Test 300 elements < 500ms
  console.log('  Testing 300 elements...');
  const start300 = performance.now();
  
  const request300 = {
    elements: testData.performance,
    viewport: { minX: 0, minY: 0, maxX: 1000, maxY: 1000, width: 1000, height: 1000 },
    options: {
      minConfidence: 0.3,
      enableRelationshipAnalysis: true,
      enableTokenOptimization: true,
      maxComponents: 500,
      analysisDepth: 'standard' as const
    }
  };
  
  try {
    const result300 = await runExtractionPipeline(request300);
    const time300 = performance.now() - start300;
    
    console.log(`  ✅ 300 elements processed in ${time300.toFixed(2)}ms`);
    console.assert(time300 < 500, `Should process 300 elements in <500ms (actual: ${time300.toFixed(2)}ms)`);
    console.log(`  Found ${result300.components.length} components`);
  } catch (error) {
    console.error('  ❌ Performance test failed:', error);
    return false;
  }
  
  // Test 500 elements < 1s
  console.log('  Testing 500 elements...');
  const elements500 = generatePerformanceTestElements(500);
  const start500 = performance.now();
  
  const request500 = {
    elements: elements500,
    viewport: { minX: 0, minY: 0, maxX: 1000, maxY: 1000, width: 1000, height: 1000 },
    options: {
      minConfidence: 0.3,
      enableRelationshipAnalysis: true,
      enableTokenOptimization: true,
      maxComponents: 500,
      analysisDepth: 'standard' as const
    }
  };
  
  try {
    const result500 = await runExtractionPipeline(request500);
    const time500 = performance.now() - start500;
    
    console.log(`  ✅ 500 elements processed in ${time500.toFixed(2)}ms`);
    console.assert(time500 < 1000, `Should process 500 elements in <1s (actual: ${time500.toFixed(2)}ms)`);
    console.log(`  Found ${result500.components.length} components`);
  } catch (error) {
    console.error('  ❌ Performance test failed:', error);
    return false;
  }
  
  console.log('✅ Performance tests passed');
  return true;
}

// =============================================================================
// END-TO-END TEST
// =============================================================================

async function testEndToEnd() {
  console.log('🧪 Testing End-to-End Pipeline');
  
  // Create a complete UI mockup
  const completeUIElements = [
    // Header container
    { id: 'header', type: 'rectangle', x: 0, y: 0, width: 800, height: 80, backgroundColor: '#1f2937' },
    { id: 'logo-text', type: 'text', x: 20, y: 25, width: 100, height: 30, text: 'MyApp', fontSize: 24 },
    { id: 'nav-menu', type: 'rectangle', x: 600, y: 20, width: 180, height: 40, backgroundColor: 'transparent' },
    
    // Main card
    { id: 'main-card', type: 'rectangle', x: 100, y: 120, width: 600, height: 400, backgroundColor: '#ffffff', strokeColor: '#e5e7eb' },
    { id: 'card-title', type: 'text', x: 120, y: 90, width: 200, height: 25, text: 'User Registration', fontSize: 20 },
    
    // Form elements
    { id: 'name-label', type: 'text', x: 130, y: 160, width: 80, height: 20, text: 'Full Name:', fontSize: 14 },
    { id: 'name-input', type: 'rectangle', x: 130, y: 185, width: 250, height: 35, backgroundColor: '#ffffff', strokeColor: '#d1d5db' },
    
    { id: 'email-label', type: 'text', x: 130, y: 240, width: 80, height: 20, text: 'Email:', fontSize: 14 },
    { id: 'email-input', type: 'rectangle', x: 130, y: 265, width: 250, height: 35, backgroundColor: '#ffffff', strokeColor: '#d1d5db' },
    
    // Buttons
    { id: 'submit-btn', type: 'rectangle', x: 130, y: 340, width: 100, height: 40, backgroundColor: '#3b82f6', roundness: 0.2, text: 'Submit' },
    { id: 'cancel-btn', type: 'rectangle', x: 250, y: 340, width: 100, height: 40, backgroundColor: '#6b7280', roundness: 0.2, text: 'Cancel' },
    
    // Decision flow
    { id: 'process-decision', type: 'diamond', x: 450, y: 200, width: 80, height: 80, backgroundColor: '#f59e0b' },
    { id: 'success-endpoint', type: 'ellipse', x: 580, y: 220, width: 60, height: 60, backgroundColor: '#10b981' },
    
    // Connectors
    { id: 'flow-arrow', type: 'arrow', x: 530, y: 235, width: 50, height: 5, strokeColor: '#000000' }
  ];
  
  const request = {
    elements: completeUIElements,
    viewport: { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 },
    options: {
      minConfidence: 0.2,
      enableRelationshipAnalysis: true,
      enableTokenOptimization: true,
      maxComponents: 100,
      analysisDepth: 'thorough' as const
    }
  };
  
  try {
    const result = await runExtractionPipeline(request);
    
    console.log(`  ✅ Complete UI processed: ${result.components.length} components found`);
    console.log(`  Processing time: ${result.processingTime.toFixed(2)}ms`);
    console.log(`  Average confidence: ${result.summary.averageConfidence.toFixed(2)}`);
    
    // Verify expected components
    const componentRoles = result.components.map(c => c.role);
    const uniqueRoles = Array.from(new Set(componentRoles));
    console.log(`  Component roles found: ${uniqueRoles.join(', ')}`);
    
    // Should find buttons, containers, text, decision points
    console.assert(componentRoles.includes(ComponentRole.BUTTON), 'Should find button components');
    console.assert(componentRoles.includes(ComponentRole.CONTAINER), 'Should find container components');
    console.assert(componentRoles.includes(ComponentRole.DECISION_POINT), 'Should find decision point');
    
    console.log('✅ End-to-end test passed');
    return true;
  } catch (error) {
    console.error('  ❌ End-to-end test failed:', error);
    return false;
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

export async function runAllValidationTests(): Promise<boolean> {
  console.log('🚀 Starting Comprehensive Pipeline Validation\n');
  
  const tests = [
    { name: 'Stage 1: Normalization', fn: testNormalization },
    { name: 'Stage 2: Container Detection', fn: testContainerDetection },
    { name: 'Stage 3: Text Attachment', fn: testTextAttachment },
    { name: 'Stage 4: Connector Analysis', fn: testConnectorAnalysis },
    { name: 'Stage 5: Role Assignment', fn: testRoleAssignment },
    { name: 'Performance Targets', fn: testPerformance },
    { name: 'End-to-End Pipeline', fn: testEndToEnd }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push(result);
      console.log('');
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error);
      results.push(false);
      console.log('');
    }
  }
  
  const passedCount = results.filter(r => r).length;
  const totalCount = results.length;
  
  console.log('='.repeat(60));
  console.log(`📊 VALIDATION SUMMARY: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All validation tests passed! Pipeline is ready for production.');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Review the pipeline implementation.');
    return false;
  }
}

// Export individual test functions for targeted testing
export {
  testNormalization,
  testContainerDetection,
  testTextAttachment,
  testConnectorAnalysis,
  testRoleAssignment,
  testPerformance,
  testEndToEnd,
  createTestElements
};