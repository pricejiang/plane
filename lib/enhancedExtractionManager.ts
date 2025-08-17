// Enhanced Extraction Manager with GPT-4o Integration
// Combines local extraction with GPT semantic enhancement for maximum compression

import { ExtractionWorkerManager } from './extractionWorkerManager';
import { enhanceWithGPT, createDefaultGPTOptions, createFastGPTOptions, GPTEnhancementOptions } from './gptSemanticEnhancer';
import { analyzeTokenUsage, TokenAnalysis } from './tokenAnalyzer';
import { ExtractionResult, SemanticComponent, ExtractionOptions } from '@/types/extraction';
import { SemanticLabel, ViewportBounds } from '@/types';

export interface EnhancedExtractionResult {
  // Original extraction data
  localComponents: SemanticComponent[];
  
  // GPT-enhanced data
  enhancedComponents: SemanticComponent[];
  gptRelationships: any[];
  humanReadableNames: Map<string, string>;
  
  // Performance metrics
  tokenAnalysis: TokenAnalysis;
  processingTime: number;
  compressionAchieved: number;
  
  // Legacy compatibility
  labels: SemanticLabel[];
  confidence: number;
}

export class EnhancedExtractionManager {
  private localManager: ExtractionWorkerManager;
  private gptOptions: GPTEnhancementOptions;
  
  constructor(gptOptions?: Partial<GPTEnhancementOptions>) {
    this.localManager = new ExtractionWorkerManager();
    this.gptOptions = {
      ...createFastGPTOptions(), // Use fast mode by default
      ...gptOptions
    };
  }
  
  /**
   * Full enhanced extraction pipeline with GPT enhancement
   */
  async extractWithGPTEnhancement(
    elements: any[],
    viewport: ViewportBounds,
    options?: Partial<ExtractionOptions>
  ): Promise<EnhancedExtractionResult> {
    const startTime = performance.now();
    
    console.log('🚀 Enhanced Extraction: Starting pipeline');
    
    // Step 1: Local extraction for base components
    console.log('📊 Step 1: Local extraction...');
    const localResult = await this.localManager.extractThorough(elements, viewport, {
      minConfidence: 0.3, // Lower threshold for GPT enhancement
      enableRelationshipAnalysis: true,
      enableTokenOptimization: true,
      enableWidgetDetection: true,
      maxComponents: 50,
      analysisDepth: 'standard',
      ...options
    });
    
    console.log(`✅ Local extraction: ${localResult.components.length} components`);
    
    // Step 2: GPT-4o semantic enhancement
    console.log('🧠 Step 2: GPT-4o enhancement...');
    let gptResult;
    try {
      gptResult = await enhanceWithGPT(localResult.components, this.gptOptions);
      console.log(`✅ GPT enhancement: ${gptResult.compressionAchieved.toFixed(1)}% compression`);
    } catch (error) {
      console.error('❌ GPT enhancement failed, using local results:', error);
      gptResult = {
        enhancedComponents: localResult.components,
        relationships: [],
        compressionAchieved: 0,
        humanReadableNames: new Map(),
        processingTime: 0,
        tokensSaved: 0
      };
    }
    
    // Step 3: Token analysis and optimization
    console.log('📈 Step 3: Token analysis...');
    const tokenAnalysis = analyzeTokenUsage(elements, {
      components: gptResult.enhancedComponents,
      summary: localResult.summary,
      tokenOptimization: localResult.tokenOptimization,
      timestamp: Date.now(),
      processingTime: 0
    });
    
    // Step 4: Convert to legacy format for compatibility
    console.log('🔄 Step 4: Legacy conversion...');
    const labels = this.convertToSemanticLabels(
      gptResult.enhancedComponents,
      gptResult.humanReadableNames
    );
    
    const averageConfidence = gptResult.enhancedComponents.length > 0
      ? gptResult.enhancedComponents.reduce((sum, c) => sum + c.confidence, 0) / gptResult.enhancedComponents.length
      : 0;
    
    const totalProcessingTime = performance.now() - startTime;
    
    console.log(`✅ Enhanced extraction complete: ${tokenAnalysis.reduction.percentage.toFixed(1)}% token reduction in ${totalProcessingTime.toFixed(0)}ms`);
    
    return {
      localComponents: localResult.components,
      enhancedComponents: gptResult.enhancedComponents,
      gptRelationships: gptResult.relationships,
      humanReadableNames: gptResult.humanReadableNames,
      tokenAnalysis,
      processingTime: totalProcessingTime,
      compressionAchieved: gptResult.compressionAchieved,
      labels,
      confidence: averageConfidence
    };
  }
  
  /**
   * Quick extraction without GPT (fallback mode)
   */
  async extractLocal(
    elements: any[],
    viewport: ViewportBounds,
    options?: Partial<ExtractionOptions>
  ): Promise<EnhancedExtractionResult> {
    const startTime = performance.now();
    
    const localResult = await this.localManager.extractThorough(elements, viewport, options);
    
    const tokenAnalysis = analyzeTokenUsage(elements, localResult);
    const labels = this.convertToSemanticLabels(localResult.components, new Map());
    
    const averageConfidence = localResult.components.length > 0
      ? localResult.components.reduce((sum, c) => sum + c.confidence, 0) / localResult.components.length
      : 0;
    
    return {
      localComponents: localResult.components,
      enhancedComponents: localResult.components,
      gptRelationships: [],
      humanReadableNames: new Map(),
      tokenAnalysis,
      processingTime: performance.now() - startTime,
      compressionAchieved: tokenAnalysis.reduction.percentage,
      labels,
      confidence: averageConfidence
    };
  }
  
  /**
   * Intelligent mode selection based on element count and API availability
   */
  async extractSmart(
    elements: any[],
    viewport: ViewportBounds,
    options?: Partial<ExtractionOptions>
  ): Promise<EnhancedExtractionResult> {
    // Decision logic for when to use GPT enhancement
    const shouldUseGPT = this.shouldUseGPTEnhancement(elements);
    
    if (shouldUseGPT) {
      console.log('🧠 Smart mode: Using GPT enhancement');
      try {
        return await this.extractWithGPTEnhancement(elements, viewport, options);
      } catch (error) {
        console.warn('⚠️ GPT enhancement failed, falling back to local extraction');
        return await this.extractLocal(elements, viewport, options);
      }
    } else {
      console.log('⚡ Smart mode: Using local extraction only');
      return await this.extractLocal(elements, viewport, options);
    }
  }
  
  /**
   * Determine if GPT enhancement should be used
   */
  private shouldUseGPTEnhancement(elements: any[]): boolean {
    // Use GPT when:
    // 1. We have enough elements to benefit from compression (3+)
    // 2. Not too many elements to avoid high API costs (< 30)
    // 3. API key is available
    
    const hasApiKey = !!(process.env.NEXT_PUBLIC_OPENAI_API_KEY);
    const elementCount = elements.length;
    
    const shouldUse = hasApiKey && elementCount >= 3 && elementCount <= 30;
    
    console.log(`GPT Enhancement Decision: ${shouldUse} (elements: ${elementCount}, hasKey: ${hasApiKey})`);
    return shouldUse;
  }
  
  /**
   * Convert enhanced components to legacy SemanticLabel format
   */
  private convertToSemanticLabels(
    components: SemanticComponent[],
    humanNames: Map<string, string>
  ): SemanticLabel[] {
    return components.map((component, index) => {
      const humanName = humanNames.get(component.id);
      const label = humanName || this.generateFallbackLabel(component);
      
      return {
        id: component.id,
        elementId: component.elementIds[0] || component.id,
        label,
        confidence: component.confidence,
        category: this.mapRoleToCategory(component.role),
        x: component.boundingBox.x,
        y: component.boundingBox.y,
        width: component.boundingBox.width,
        height: component.boundingBox.height
      };
    });
  }
  
  private generateFallbackLabel(component: SemanticComponent): string {
    const text = component.metadata.visualProperties.textContent;
    if (text && text.length > 0) {
      return text.length > 20 ? text.substring(0, 17) + '...' : text;
    }
    
    return `${component.role.replace('_', ' ')}`.toLowerCase();
  }
  
  private mapRoleToCategory(role: string): 'widget' | 'text' | 'shape' | 'diagram' | 'unknown' {
    const categoryMap: Record<string, 'widget' | 'text' | 'shape' | 'diagram' | 'unknown'> = {
      'widget': 'widget',
      'button': 'shape',
      'input_field': 'shape',
      'text_block': 'text',
      'title': 'text',
      'label': 'text',
      'process_step': 'diagram',
      'decision_point': 'diagram',
      'connector': 'diagram',
      'chart': 'diagram',
      'container': 'shape',
      'card': 'shape'
    };
    
    return categoryMap[role] || 'unknown';
  }
  
  /**
   * Get compression statistics
   */
  getCompressionStats(result: EnhancedExtractionResult) {
    return {
      tokenReduction: result.tokenAnalysis.reduction.percentage,
      compressionRatio: result.tokenAnalysis.reduction.compressionRatio,
      originalTokens: result.tokenAnalysis.rawElements.estimatedTokens,
      optimizedTokens: result.tokenAnalysis.semanticComponents.estimatedTokens,
      componentsFound: result.enhancedComponents.length,
      relationshipsDetected: result.gptRelationships.length,
      processingTime: result.processingTime,
      gptEnhanced: result.gptRelationships.length > 0
    };
  }
  
  /**
   * Generate human-readable summary
   */
  generateSummary(result: EnhancedExtractionResult): string {
    const stats = this.getCompressionStats(result);
    
    const lines = [
      `Found ${stats.componentsFound} semantic components`,
      `${stats.tokenReduction.toFixed(1)}% token reduction achieved`,
    ];
    
    if (stats.relationshipsDetected > 0) {
      lines.push(`${stats.relationshipsDetected} relationships detected`);
    }
    
    if (stats.gptEnhanced) {
      lines.push('Enhanced with GPT-4o analysis');
    }
    
    lines.push(`Processed in ${stats.processingTime.toFixed(0)}ms`);
    
    return lines.join(' • ');
  }
}

// Singleton instance
let enhancedManager: EnhancedExtractionManager | null = null;

/**
 * Get or create the enhanced extraction manager
 */
export function getEnhancedManager(options?: Partial<GPTEnhancementOptions>): EnhancedExtractionManager {
  if (!enhancedManager) {
    enhancedManager = new EnhancedExtractionManager(options);
  }
  return enhancedManager;
}

/**
 * Quick extraction function for backwards compatibility
 */
export async function extractWithEnhancement(
  elements: any[],
  viewport: ViewportBounds,
  useGPT: boolean = true
): Promise<EnhancedExtractionResult> {
  const manager = getEnhancedManager();
  
  if (useGPT) {
    return await manager.extractSmart(elements, viewport);
  } else {
    return await manager.extractLocal(elements, viewport);
  }
}