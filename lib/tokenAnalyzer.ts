// Phase 2: Token Usage Analysis and Validation
// Utilities to measure and validate the token reduction achieved by semantic extraction

import { SemanticComponent, ExtractionResult } from '@/types/extraction';

/**
 * Analyze token usage for different representation methods
 */
export interface TokenAnalysis {
  rawElements: {
    count: number;
    estimatedTokens: number;
    representation: string;
  };
  semanticComponents: {
    count: number;
    estimatedTokens: number;
    representation: string;
  };
  reduction: {
    absolute: number;
    percentage: number;
    compressionRatio: number;
  };
  efficiency: {
    componentsPerElement: number;
    tokensPerComponent: number;
    confidenceWeightedTokens: number;
  };
}

/**
 * Calculate estimated token count for raw Excalidraw elements
 */
export function calculateRawElementTokens(elements: any[]): { tokens: number; representation: string } {
  const representations = elements.map(element => {
    // Simulate how raw elements would be described to an LLM
    const parts = [
      `Element ${element.id}:`,
      `- Type: ${element.type}`,
      `- Position: (${element.x}, ${element.y})`,
      `- Size: ${element.width}x${element.height}`,
      `- Style: stroke=${element.strokeColor}, fill=${element.backgroundColor}`,
      `- Properties: strokeWidth=${element.strokeWidth}, opacity=${element.opacity}`
    ];
    
    if (element.text) {
      parts.push(`- Text: "${element.text}"`);
    }
    
    if (element.angle && element.angle !== 0) {
      parts.push(`- Rotation: ${element.angle}°`);
    }
    
    return parts.join('\n');
  });
  
  const fullRepresentation = representations.join('\n\n');
  
  // Estimate tokens (rough approximation: 4 characters per token)
  const estimatedTokens = Math.ceil(fullRepresentation.length / 4);
  
  return {
    tokens: estimatedTokens,
    representation: fullRepresentation
  };
}

/**
 * Calculate estimated token count for semantic components
 */
export function calculateSemanticComponentTokens(components: SemanticComponent[]): { tokens: number; representation: string } {
  const representations = components.map(component => {
    const parts = [
      `Component ${component.id}:`,
      `- Role: ${component.role}`,
      `- Confidence: ${(component.confidence * 100).toFixed(1)}%`,
      `- Bounds: (${component.boundingBox.x}, ${component.boundingBox.y}) ${component.boundingBox.width}x${component.boundingBox.height}`,
      `- Elements: [${component.elementIds.join(', ')}]`
    ];
    
    if (component.metadata.visualProperties.textContent) {
      parts.push(`- Text: "${component.metadata.visualProperties.textContent}"`);
    }
    
    if (component.metadata.interactionPattern?.isClickable) {
      parts.push(`- Interactive: clickable`);
    }
    
    if (component.relationships.length > 0) {
      const relationshipSummary = component.relationships
        .map(rel => `${rel.type}→${rel.targetComponentId}`)
        .join(', ');
      parts.push(`- Relations: ${relationshipSummary}`);
    }
    
    if (component.metadata.semanticHints.length > 0) {
      parts.push(`- Hints: ${component.metadata.semanticHints.join(', ')}`);
    }
    
    return parts.join('\n');
  });
  
  const fullRepresentation = representations.join('\n\n');
  
  // Estimate tokens
  const estimatedTokens = Math.ceil(fullRepresentation.length / 4);
  
  return {
    tokens: estimatedTokens,
    representation: fullRepresentation
  };
}

/**
 * Perform comprehensive token analysis
 */
export function analyzeTokenUsage(elements: any[], extractionResult: ExtractionResult): TokenAnalysis {
  const rawAnalysis = calculateRawElementTokens(elements);
  const semanticAnalysis = calculateSemanticComponentTokens(extractionResult.components);
  
  const reduction = {
    absolute: rawAnalysis.tokens - semanticAnalysis.tokens,
    percentage: rawAnalysis.tokens > 0 ? ((rawAnalysis.tokens - semanticAnalysis.tokens) / rawAnalysis.tokens) * 100 : 0,
    compressionRatio: semanticAnalysis.tokens > 0 ? rawAnalysis.tokens / semanticAnalysis.tokens : 1
  };
  
  const efficiency = {
    componentsPerElement: elements.length > 0 ? extractionResult.components.length / elements.length : 0,
    tokensPerComponent: extractionResult.components.length > 0 ? semanticAnalysis.tokens / extractionResult.components.length : 0,
    confidenceWeightedTokens: calculateConfidenceWeightedTokens(extractionResult.components, semanticAnalysis.tokens)
  };
  
  return {
    rawElements: {
      count: elements.length,
      estimatedTokens: rawAnalysis.tokens,
      representation: rawAnalysis.representation
    },
    semanticComponents: {
      count: extractionResult.components.length,
      estimatedTokens: semanticAnalysis.tokens,
      representation: semanticAnalysis.representation
    },
    reduction,
    efficiency
  };
}

/**
 * Calculate confidence-weighted token efficiency
 */
function calculateConfidenceWeightedTokens(components: SemanticComponent[], totalTokens: number): number {
  if (components.length === 0) return 0;
  
  const totalConfidence = components.reduce((sum, comp) => sum + comp.confidence, 0);
  const averageConfidence = totalConfidence / components.length;
  
  // Higher confidence means better token efficiency
  return totalTokens * averageConfidence;
}

/**
 * Generate a human-readable report of token analysis
 */
export function generateTokenReport(analysis: TokenAnalysis): string {
  const lines = [
    "=== TOKEN USAGE ANALYSIS ===",
    "",
    "📊 RAW ELEMENTS:",
    `   • Count: ${analysis.rawElements.count} elements`,
    `   • Estimated tokens: ${analysis.rawElements.estimatedTokens}`,
    "",
    "🧠 SEMANTIC COMPONENTS:",
    `   • Count: ${analysis.semanticComponents.count} components`,
    `   • Estimated tokens: ${analysis.semanticComponents.estimatedTokens}`,
    "",
    "📉 TOKEN REDUCTION:",
    `   • Absolute reduction: ${analysis.reduction.absolute} tokens`,
    `   • Percentage reduction: ${analysis.reduction.percentage.toFixed(1)}%`,
    `   • Compression ratio: ${analysis.reduction.compressionRatio.toFixed(2)}:1`,
    "",
    "⚡ EFFICIENCY METRICS:",
    `   • Components per element: ${analysis.efficiency.componentsPerElement.toFixed(2)}`,
    `   • Tokens per component: ${analysis.efficiency.tokensPerComponent.toFixed(1)}`,
    `   • Confidence-weighted efficiency: ${analysis.efficiency.confidenceWeightedTokens.toFixed(1)}`,
    "",
    "🎯 OPTIMIZATION IMPACT:",
    analysis.reduction.percentage > 70 ? "   ✅ Excellent optimization (>70% reduction)" :
    analysis.reduction.percentage > 50 ? "   ✅ Good optimization (>50% reduction)" :
    analysis.reduction.percentage > 30 ? "   ⚠️  Moderate optimization (>30% reduction)" :
    analysis.reduction.percentage > 0 ? "   ⚠️  Minimal optimization" :
    "   ❌ No optimization achieved",
    ""
  ];
  
  return lines.join('\n');
}

/**
 * Create sample data for testing token reduction
 */
export function createSampleElements(): any[] {
  return [
    {
      id: "element-1",
      type: "rectangle",
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      strokeColor: "#000000",
      backgroundColor: "#ffffff",
      strokeWidth: 2,
      opacity: 1,
      angle: 0,
      text: "Submit Button"
    },
    {
      id: "element-2",
      type: "rectangle",
      x: 100,
      y: 50,
      width: 200,
      height: 30,
      strokeColor: "#666666",
      backgroundColor: "transparent",
      strokeWidth: 1,
      opacity: 1,
      angle: 0,
      text: ""
    },
    {
      id: "element-3",
      type: "text",
      x: 110,
      y: 60,
      width: 180,
      height: 20,
      strokeColor: "#000000",
      backgroundColor: "transparent",
      strokeWidth: 1,
      opacity: 1,
      angle: 0,
      text: "Email Address"
    },
    {
      id: "element-4",
      type: "rectangle",
      x: 50,
      y: 20,
      width: 300,
      height: 200,
      strokeColor: "#cccccc",
      backgroundColor: "#f9f9f9",
      strokeWidth: 1,
      opacity: 1,
      angle: 0,
      text: ""
    },
    {
      id: "element-5",
      type: "text",
      x: 60,
      y: 30,
      width: 280,
      height: 25,
      strokeColor: "#333333",
      backgroundColor: "transparent",
      strokeWidth: 1,
      opacity: 1,
      angle: 0,
      text: "Login Form"
    }
  ];
}

/**
 * Validate that token reduction meets Phase 2 objectives
 */
export function validatePhase2Objectives(analysis: TokenAnalysis): {
  meets70PercentReduction: boolean;
  providesSemanticValue: boolean;
  maintainsAccuracy: boolean;
  overallSuccess: boolean;
} {
  const meets70PercentReduction = analysis.reduction.percentage >= 70;
  
  // Semantic value: should group related elements and identify relationships
  const providesSemanticValue = 
    analysis.efficiency.componentsPerElement < 1 && // Grouping occurred
    analysis.semanticComponents.count > 0; // Components were found
  
  // Accuracy: confidence-weighted efficiency should be reasonable
  const maintainsAccuracy = analysis.efficiency.confidenceWeightedTokens > analysis.semanticComponents.estimatedTokens * 0.7;
  
  const overallSuccess = meets70PercentReduction && providesSemanticValue && maintainsAccuracy;
  
  return {
    meets70PercentReduction,
    providesSemanticValue,
    maintainsAccuracy,
    overallSuccess
  };
}