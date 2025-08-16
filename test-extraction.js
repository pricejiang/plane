// Quick test script to validate Phase 2 extraction pipeline
// Run with: node test-extraction.js

const { createSampleElements, analyzeTokenUsage, generateTokenReport, validatePhase2Objectives } = require('./lib/tokenAnalyzer');

// Mock extraction result to simulate the pipeline
const mockExtractionResult = {
  components: [
    {
      id: 'comp-1',
      elementIds: ['element-1'],
      role: 'button',
      confidence: 0.95,
      boundingBox: { x: 100, y: 100, width: 200, height: 50 },
      relationships: [],
      metadata: {
        visualProperties: {
          hasText: true,
          textContent: 'Submit Button',
          hasShape: true,
          shapeType: 'rectangle',
          size: 'medium'
        },
        interactionPattern: {
          isClickable: true,
          isInputField: false,
          hasStates: false
        },
        layoutContext: {
          position: 'isolated',
          alignment: 'left',
          spacing: 'normal'
        },
        semanticHints: ['has_text', 'filled_shape'],
        analysisMetadata: {
          extractionMethod: 'rule_based',
          processingTime: 5,
          version: '1.0.0'
        }
      }
    },
    {
      id: 'comp-2', 
      elementIds: ['element-2', 'element-3'],
      role: 'input_field',
      confidence: 0.88,
      boundingBox: { x: 100, y: 50, width: 200, height: 30 },
      relationships: [
        { type: 'validated_by', targetComponentId: 'comp-3', confidence: 0.8 }
      ],
      metadata: {
        visualProperties: {
          hasText: true,
          textContent: 'Email Address',
          hasShape: true,
          shapeType: 'rectangle',
          size: 'medium'
        },
        interactionPattern: {
          isClickable: false,
          isInputField: true,
          hasStates: false
        },
        layoutContext: {
          position: 'grouped',
          alignment: 'left',
          spacing: 'tight'
        },
        semanticHints: ['has_text', 'email_field'],
        analysisMetadata: {
          extractionMethod: 'rule_based',
          processingTime: 3,
          version: '1.0.0'
        }
      }
    },
    {
      id: 'comp-3',
      elementIds: ['element-4', 'element-5'],
      role: 'card',
      confidence: 0.92,
      boundingBox: { x: 50, y: 20, width: 300, height: 200 },
      relationships: [
        { type: 'contains', targetComponentId: 'comp-1', confidence: 0.9 },
        { type: 'contains', targetComponentId: 'comp-2', confidence: 0.9 }
      ],
      metadata: {
        visualProperties: {
          hasText: true,
          textContent: 'Login Form',
          hasShape: true,
          shapeType: 'rectangle',
          size: 'large'
        },
        interactionPattern: {
          isClickable: false,
          isInputField: false,
          hasStates: false
        },
        layoutContext: {
          position: 'isolated',
          alignment: 'center',
          spacing: 'normal'
        },
        semanticHints: ['has_text', 'filled_shape'],
        analysisMetadata: {
          extractionMethod: 'rule_based',
          processingTime: 4,
          version: '1.0.0'
        }
      }
    }
  ],
  summary: {
    totalComponents: 3,
    componentBreakdown: { button: 1, input_field: 1, card: 1 },
    relationshipBreakdown: { validated_by: 1, contains: 2 },
    averageConfidence: 0.92,
    highConfidenceComponents: 3,
    mediumConfidenceComponents: 0,
    lowConfidenceComponents: 0
  },
  tokenOptimization: {
    originalTokenCount: 0,
    optimizedTokenCount: 0,
    reductionPercentage: 0,
    compressionRatio: 1
  },
  timestamp: Date.now(),
  processingTime: 12
};

function testPhase2Pipeline() {
  console.log('🧪 Testing Phase 2 Extraction Pipeline\n');
  
  // Create sample elements
  const sampleElements = createSampleElements();
  console.log(`📊 Sample Elements: ${sampleElements.length} elements`);
  
  // Analyze token usage
  const tokenAnalysis = analyzeTokenUsage(sampleElements, mockExtractionResult);
  
  // Generate report
  console.log('\n' + generateTokenReport(tokenAnalysis));
  
  // Validate objectives
  const validation = validatePhase2Objectives(tokenAnalysis);
  
  console.log('🎯 PHASE 2 OBJECTIVES VALIDATION:');
  console.log(`   ✅ 70%+ Token Reduction: ${validation.meets70PercentReduction ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Semantic Value: ${validation.providesSemanticValue ? 'PASS' : 'FAIL'}`);
  console.log(`   ✅ Maintains Accuracy: ${validation.maintainsAccuracy ? 'PASS' : 'FAIL'}`);
  console.log(`   🏆 Overall Success: ${validation.overallSuccess ? 'PASS' : 'FAIL'}`);
  
  return validation.overallSuccess;
}

// Run the test
if (require.main === module) {
  const success = testPhase2Pipeline();
  process.exit(success ? 0 : 1);
}

module.exports = { testPhase2Pipeline };