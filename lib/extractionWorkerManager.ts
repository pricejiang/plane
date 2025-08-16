// Phase 2: WebWorker Manager for Semantic Extraction
// Manages communication with extraction worker and provides a clean API

import { 
  ExtractionWorkerMessage, 
  ExtractionWorkerResponse,
  ExtractionRequest,
  ExtractionResult,
  ExtractionOptions
} from '../types/extraction';

export class ExtractionWorkerManager {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string, {
    resolve: (result: ExtractionResult) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      // Create worker from the extraction worker script
      this.worker = new Worker(
        new URL('../workers/extraction.worker.ts', import.meta.url)
      );
      
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
      this.worker.addEventListener('error', this.handleWorkerError.bind(this));
      
      console.log('Extraction worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize extraction worker:', error);
    }
  }

  private handleWorkerMessage(event: MessageEvent<ExtractionWorkerResponse>) {
    const { type, payload, id } = event.data;
    const pendingRequest = this.pendingRequests.get(id);
    
    if (!pendingRequest) {
      console.warn('Received response for unknown request ID:', id);
      return;
    }
    
    // Clear timeout
    clearTimeout(pendingRequest.timeout);
    this.pendingRequests.delete(id);
    
    if (type === 'EXTRACTION_COMPLETE') {
      pendingRequest.resolve(payload as ExtractionResult);
    } else if (type === 'EXTRACTION_ERROR') {
      const errorPayload = payload as { error: string };
      pendingRequest.reject(new Error(errorPayload.error));
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error('Worker error:', error);
    
    // Reject all pending requests
    this.pendingRequests.forEach((request, id) => {
      clearTimeout(request.timeout);
      request.reject(new Error(`Worker error: ${error.message}`));
    });
    
    this.pendingRequests.clear();
    
    // Try to reinitialize worker
    this.terminate();
    setTimeout(() => this.initWorker(), 1000);
  }

  /**
   * Extract semantic components from Excalidraw elements
   */
  async extractComponents(
    elements: any[], 
    viewport: any, 
    options: Partial<ExtractionOptions> = {}
  ): Promise<ExtractionResult> {
    if (!this.worker) {
      throw new Error('Extraction worker not available');
    }

    const messageId = (++this.messageId).toString();
    
    const defaultOptions: ExtractionOptions = {
      minConfidence: 0.3,
      enableRelationshipAnalysis: true,
      enableTokenOptimization: true,
      maxComponents: 100,
      analysisDepth: 'standard'
    };

    const request: ExtractionRequest = {
      elements,
      viewport,
      options: { ...defaultOptions, ...options }
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error('Extraction timeout'));
      }, 30000); // 30 second timeout

      // Store pending request
      this.pendingRequests.set(messageId, {
        resolve,
        reject,
        timeout
      });

      // Send message to worker
      const message: ExtractionWorkerMessage = {
        type: 'EXTRACT_COMPONENTS',
        payload: request,
        id: messageId
      };

      this.worker!.postMessage(message);
    });
  }

  /**
   * Quick extraction with minimal analysis for fast feedback
   */
  async extractFast(elements: any[], viewport: any): Promise<ExtractionResult> {
    return this.extractComponents(elements, viewport, {
      minConfidence: 0.5,
      enableRelationshipAnalysis: false,
      enableTokenOptimization: false,
      maxComponents: 50,
      analysisDepth: 'fast'
    });
  }

  /**
   * Thorough extraction with full analysis
   */
  async extractThorough(elements: any[], viewport: any): Promise<ExtractionResult> {
    return this.extractComponents(elements, viewport, {
      minConfidence: 0.2,
      enableRelationshipAnalysis: true,
      enableTokenOptimization: true,
      maxComponents: 200,
      analysisDepth: 'thorough'
    });
  }

  /**
   * Get worker status
   */
  getStatus() {
    return {
      isAvailable: !!this.worker,
      pendingRequests: this.pendingRequests.size,
      lastMessageId: this.messageId
    };
  }

  /**
   * Terminate the worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Reject all pending requests
    this.pendingRequests.forEach((request, id) => {
      clearTimeout(request.timeout);
      request.reject(new Error('Worker terminated'));
    });
    
    this.pendingRequests.clear();
  }
}

// Singleton instance for easy use across the app
let workerManager: ExtractionWorkerManager | null = null;

export function getExtractionWorkerManager(): ExtractionWorkerManager {
  if (!workerManager) {
    workerManager = new ExtractionWorkerManager();
  }
  return workerManager;
}

// Helper functions for common extraction scenarios

/**
 * Extract components optimized for LLM consumption
 */
export async function extractForLLM(elements: any[], viewport: any): Promise<{
  components: any[];
  tokenSavings: number;
  summary: string;
}> {
  const manager = getExtractionWorkerManager();
  const result = await manager.extractThorough(elements, viewport);
  
  // Format for LLM consumption
  const components = result.components.map(comp => ({
    id: comp.id,
    role: comp.role,
    confidence: comp.confidence,
    bounds: comp.boundingBox,
    text: comp.metadata.visualProperties.textContent,
    relationships: comp.relationships.map(rel => ({
      type: rel.type,
      target: rel.targetComponentId,
      confidence: rel.confidence
    }))
  }));

  const tokenSavings = result.tokenOptimization.reductionPercentage;
  const summary = `Extracted ${result.components.length} semantic components with ${tokenSavings.toFixed(1)}% token reduction`;

  return {
    components,
    tokenSavings,
    summary
  };
}

/**
 * Extract components for real-time overlay display
 */
export async function extractForOverlay(elements: any[], viewport: any): Promise<{
  labels: any[];
  confidence: number;
}> {
  const manager = getExtractionWorkerManager();
  const result = await manager.extractFast(elements, viewport);
  
  // Convert to overlay labels format
  const labels = result.components.map(comp => ({
    id: comp.id,
    elementId: comp.elementIds[0], // Use first element ID for compatibility
    label: `${comp.role.replace('_', ' ')} (${(comp.confidence * 100).toFixed(0)}%)`,
    confidence: comp.confidence,
    category: roleToCategory(comp.role),
    x: comp.boundingBox.x,
    y: comp.boundingBox.y,
    width: comp.boundingBox.width,
    height: comp.boundingBox.height
  }));

  return {
    labels,
    confidence: result.summary.averageConfidence
  };
}

function roleToCategory(role: string): 'widget' | 'text' | 'shape' | 'diagram' | 'unknown' {
  if (role.includes('button') || role.includes('input') || role.includes('dropdown')) {
    return 'widget';
  }
  if (role.includes('text') || role.includes('title') || role.includes('label')) {
    return 'text';
  }
  if (role.includes('connector') || role.includes('decision') || role.includes('process')) {
    return 'diagram';
  }
  if (role.includes('rectangle') || role.includes('ellipse') || role.includes('shape')) {
    return 'shape';
  }
  return 'unknown';
}