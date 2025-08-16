// Phase 2: Local Extraction WebWorker
// Runs semantic analysis in background thread for optimal performance

import { 
  ExtractionWorkerMessage, 
  ExtractionWorkerResponse, 
  ExtractionResult,
  SemanticComponent,
  ComponentRole,
  ComponentRelationship,
  RelationshipType,
  ExtractionRequest,
  ComponentMetadata,
  ExtractionSummary,
  TokenOptimization
} from '../types/extraction';

// Main worker message handler
self.addEventListener('message', (event: MessageEvent<ExtractionWorkerMessage>) => {
  const { type, payload, id } = event.data;
  
  if (type === 'EXTRACT_COMPONENTS') {
    handleExtraction(payload, id);
  }
});

async function handleExtraction(request: ExtractionRequest, messageId: string) {
  const startTime = performance.now();
  
  try {
    const result = await extractSemanticComponents(request);
    const processingTime = performance.now() - startTime;
    
    const response: ExtractionWorkerResponse = {
      type: 'EXTRACTION_COMPLETE',
      payload: {
        ...result,
        processingTime
      },
      id: messageId
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: ExtractionWorkerResponse = {
      type: 'EXTRACTION_ERROR',
      payload: { error: error instanceof Error ? error.message : 'Unknown extraction error' },
      id: messageId
    };
    
    self.postMessage(response);
  }
}

async function extractSemanticComponents(request: ExtractionRequest): Promise<ExtractionResult> {
  const { elements, viewport, options } = request;
  
  // Step 1: Pre-process elements
  const processedElements = preprocessElements(elements);
  
  // Step 2: Classify individual elements
  const classifiedElements = await classifyElements(processedElements, options);
  
  // Step 3: Group elements into semantic components
  const components = await groupIntoComponents(classifiedElements, options);
  
  // Step 4: Analyze relationships between components
  const componentsWithRelationships = options.enableRelationshipAnalysis 
    ? await analyzeRelationships(components, viewport)
    : components;
  
  // Step 5: Filter by confidence
  const filteredComponents = componentsWithRelationships.filter(
    comp => comp.confidence >= options.minConfidence
  );
  
  // Step 6: Generate summary and token optimization metrics
  const summary = generateSummary(filteredComponents);
  const tokenOptimization = options.enableTokenOptimization 
    ? calculateTokenOptimization(elements, filteredComponents)
    : { originalTokenCount: 0, optimizedTokenCount: 0, reductionPercentage: 0, compressionRatio: 1 };
  
  return {
    components: filteredComponents,
    summary,
    tokenOptimization,
    timestamp: Date.now(),
    processingTime: 0 // Will be set in caller
  };
}

function preprocessElements(elements: any[]) {
  return elements.map(element => ({
    ...element,
    // Add computed properties for analysis
    area: element.width * element.height,
    aspectRatio: element.width / element.height,
    hasText: Boolean(element.text && element.text.length > 0),
    textLength: element.text ? element.text.length : 0,
    center: {
      x: element.x + element.width / 2,
      y: element.y + element.height / 2
    }
  }));
}

async function classifyElements(elements: any[], options: any) {
  return elements.map(element => {
    const role = classifyElementRole(element);
    const confidence = calculateElementConfidence(element, role);
    
    return {
      ...element,
      role,
      confidence,
      isInteractive: isInteractiveElement(element, role),
      semanticHints: extractSemanticHints(element)
    };
  });
}

function classifyElementRole(element: any): ComponentRole {
  // Rule-based classification system
  
  // Text-based classification
  if (element.type === 'text') {
    const text = element.text?.toLowerCase() || '';
    
    if (text.includes('button') || text.includes('click') || text.includes('submit')) {
      return ComponentRole.BUTTON;
    }
    if (text.includes('title') || text.includes('heading')) {
      return ComponentRole.TITLE;
    }
    if (text.includes('input') || text.includes('enter') || text.includes('type')) {
      return ComponentRole.INPUT_FIELD;
    }
    if (text.includes('menu') || text.includes('navigation')) {
      return ComponentRole.MENU;
    }
    
    return ComponentRole.TEXT_BLOCK;
  }
  
  // Shape-based classification
  if (element.type === 'rectangle') {
    const aspectRatio = element.width / element.height;
    
    // Button-like rectangles (wide and short)
    if (aspectRatio > 2 && element.height < 50) {
      return ComponentRole.BUTTON;
    }
    
    // Input field-like rectangles
    if (aspectRatio > 3 && element.height < 40) {
      return ComponentRole.INPUT_FIELD;
    }
    
    // Card-like rectangles (more square, larger)
    if (aspectRatio > 0.7 && aspectRatio < 1.5 && element.area > 10000) {
      return ComponentRole.CARD;
    }
    
    // Modal-like rectangles (centered, large)
    if (element.area > 50000) {
      return ComponentRole.MODAL;
    }
    
    return ComponentRole.CONTAINER;
  }
  
  // Arrow/line classification
  if (element.type === 'arrow' || element.type === 'line') {
    return ComponentRole.CONNECTOR;
  }
  
  // Ellipse/circle classification
  if (element.type === 'ellipse') {
    const aspectRatio = element.width / element.height;
    
    // Nearly circular
    if (aspectRatio > 0.8 && aspectRatio < 1.2) {
      if (element.area < 2000) {
        return ComponentRole.RADIO_BUTTON;
      }
      return ComponentRole.ICON;
    }
    
    return ComponentRole.UNKNOWN;
  }
  
  // Diamond shapes for decision points
  if (element.type === 'diamond') {
    return ComponentRole.DECISION_POINT;
  }
  
  return ComponentRole.UNKNOWN;
}

function calculateElementConfidence(element: any, role: ComponentRole): number {
  let confidence = 0.5; // Base confidence
  
  // Text content boosts confidence
  if (element.hasText) {
    confidence += 0.2;
    
    // Relevant text content
    const text = element.text?.toLowerCase() || '';
    if (role === ComponentRole.BUTTON && (text.includes('button') || text.includes('click'))) {
      confidence += 0.2;
    }
    if (role === ComponentRole.INPUT_FIELD && (text.includes('input') || text.includes('enter'))) {
      confidence += 0.2;
    }
  }
  
  // Size and shape appropriateness
  if (role === ComponentRole.BUTTON) {
    const aspectRatio = element.width / element.height;
    if (aspectRatio > 1.5 && aspectRatio < 4 && element.height > 20 && element.height < 60) {
      confidence += 0.15;
    }
  }
  
  // Visual styling hints
  if (element.strokeWidth > 1) {
    confidence += 0.05; // Deliberate styling
  }
  
  if (element.backgroundColor && element.backgroundColor !== 'transparent') {
    confidence += 0.05; // Filled elements are often interactive
  }
  
  return Math.min(confidence, 1.0);
}

function isInteractiveElement(element: any, role: ComponentRole): boolean {
  const interactiveRoles = [
    ComponentRole.BUTTON,
    ComponentRole.INPUT_FIELD,
    ComponentRole.DROPDOWN,
    ComponentRole.CHECKBOX,
    ComponentRole.RADIO_BUTTON,
    ComponentRole.TOGGLE,
    ComponentRole.SLIDER
  ];
  
  return interactiveRoles.includes(role);
}

function extractSemanticHints(element: any): string[] {
  const hints: string[] = [];
  
  if (element.hasText) {
    hints.push('has_text');
    
    const text = element.text?.toLowerCase() || '';
    if (text.includes('required') || text.includes('*')) hints.push('required_field');
    if (text.includes('optional')) hints.push('optional_field');
    if (text.includes('password')) hints.push('password_field');
    if (text.includes('email')) hints.push('email_field');
    if (text.includes('search')) hints.push('search_field');
  }
  
  if (element.strokeWidth > 2) hints.push('emphasized_border');
  if (element.backgroundColor && element.backgroundColor !== 'transparent') hints.push('filled_shape');
  if (element.opacity < 1) hints.push('semi_transparent');
  
  return hints;
}

async function groupIntoComponents(classifiedElements: any[], options: any): Promise<SemanticComponent[]> {
  const components: SemanticComponent[] = [];
  const processed = new Set<string>();
  
  for (const element of classifiedElements) {
    if (processed.has(element.id)) continue;
    
    // Find related elements that should be grouped
    const relatedElements = findRelatedElements(element, classifiedElements);
    const allElements = [element, ...relatedElements];
    
    // Mark as processed
    allElements.forEach(el => processed.add(el.id));
    
    // Create semantic component
    const component = createSemanticComponent(allElements, options);
    components.push(component);
  }
  
  return components;
}

function findRelatedElements(primaryElement: any, allElements: any[]): any[] {
  const related: any[] = [];
  const threshold = 20; // pixels
  
  for (const element of allElements) {
    if (element.id === primaryElement.id) continue;
    
    // Spatial proximity grouping
    const distance = Math.sqrt(
      Math.pow(element.center.x - primaryElement.center.x, 2) +
      Math.pow(element.center.y - primaryElement.center.y, 2)
    );
    
    if (distance < threshold) {
      // Additional logic for meaningful grouping
      if (shouldGroupElements(primaryElement, element)) {
        related.push(element);
      }
    }
  }
  
  return related;
}

function shouldGroupElements(element1: any, element2: any): boolean {
  // Label + input field pattern
  if (element1.role === ComponentRole.TEXT_BLOCK && element2.role === ComponentRole.INPUT_FIELD) {
    return true;
  }
  
  // Icon + button pattern
  if (element1.role === ComponentRole.ICON && element2.role === ComponentRole.BUTTON) {
    return true;
  }
  
  // Multiple text elements forming a title/subtitle
  if (element1.role === ComponentRole.TEXT_BLOCK && element2.role === ComponentRole.TEXT_BLOCK) {
    return true;
  }
  
  return false;
}

function createSemanticComponent(elements: any[], options: any): SemanticComponent {
  const primaryElement = elements[0];
  const boundingBox = calculateBoundingBox(elements);
  
  // Determine component role (primary element's role or inferred from group)
  const role = inferComponentRole(elements);
  
  // Calculate overall confidence
  const confidence = calculateComponentConfidence(elements, role);
  
  // Generate metadata
  const metadata = generateComponentMetadata(elements, role);
  
  return {
    id: generateComponentId(elements),
    elementIds: elements.map(el => el.id),
    role,
    relationships: [], // Will be populated in relationship analysis
    confidence,
    boundingBox,
    metadata
  };
}

function calculateBoundingBox(elements: any[]) {
  const minX = Math.min(...elements.map(el => el.x));
  const minY = Math.min(...elements.map(el => el.y));
  const maxX = Math.max(...elements.map(el => el.x + el.width));
  const maxY = Math.max(...elements.map(el => el.y + el.height));
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function inferComponentRole(elements: any[]): ComponentRole {
  // Use the highest confidence role among elements
  const roles = elements.map(el => ({ role: el.role, confidence: el.confidence }));
  roles.sort((a, b) => b.confidence - a.confidence);
  
  return roles[0]?.role || ComponentRole.UNKNOWN;
}

function calculateComponentConfidence(elements: any[], role: ComponentRole): number {
  // Weighted average of element confidences
  const totalConfidence = elements.reduce((sum, el) => sum + el.confidence, 0);
  const averageConfidence = totalConfidence / elements.length;
  
  // Bonus for multi-element components (more context)
  const groupBonus = elements.length > 1 ? 0.1 : 0;
  
  return Math.min(averageConfidence + groupBonus, 1.0);
}

function generateComponentMetadata(elements: any[], role: ComponentRole): ComponentMetadata {
  const hasText = elements.some(el => el.hasText);
  const textContent = elements
    .filter(el => el.hasText)
    .map(el => el.text)
    .join(' ');
  
  const totalArea = elements.reduce((sum, el) => sum + el.area, 0);
  const size = totalArea > 50000 ? 'large' : totalArea > 10000 ? 'medium' : 'small';
  
  return {
    visualProperties: {
      hasText,
      textContent: textContent || undefined,
      hasShape: elements.some(el => el.type !== 'text'),
      shapeType: elements.find(el => el.type !== 'text')?.type,
      size
    },
    interactionPattern: {
      isClickable: isInteractiveComponentRole(role),
      isInputField: role === ComponentRole.INPUT_FIELD,
      hasStates: role === ComponentRole.CHECKBOX || role === ComponentRole.TOGGLE,
      stateCount: role === ComponentRole.CHECKBOX || role === ComponentRole.TOGGLE ? 2 : undefined
    },
    layoutContext: {
      position: elements.length > 1 ? 'grouped' : 'isolated',
      alignment: 'left', // Could be enhanced with actual alignment detection
      spacing: 'normal'
    },
    semanticHints: elements.flatMap(el => el.semanticHints || []),
    analysisMetadata: {
      extractionMethod: 'rule_based',
      processingTime: 0, // Will be updated
      version: '1.0.0'
    }
  };
}

function isInteractiveComponentRole(role: ComponentRole): boolean {
  const interactiveRoles = [
    ComponentRole.BUTTON,
    ComponentRole.INPUT_FIELD,
    ComponentRole.DROPDOWN,
    ComponentRole.CHECKBOX,
    ComponentRole.RADIO_BUTTON,
    ComponentRole.TOGGLE,
    ComponentRole.SLIDER
  ];
  
  return interactiveRoles.includes(role);
}

function generateComponentId(elements: any[]): string {
  // Generate deterministic ID based on element positions and types
  const signature = elements
    .map(el => `${el.type}-${Math.round(el.x)}-${Math.round(el.y)}`)
    .sort()
    .join('|');
  
  // Simple hash for shorter IDs
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `component-${Math.abs(hash).toString(36)}`;
}

async function analyzeRelationships(components: SemanticComponent[], viewport: any): Promise<SemanticComponent[]> {
  const componentsWithRelations = components.map(component => ({
    ...component,
    relationships: [] as ComponentRelationship[]
  }));
  
  // Analyze relationships between each pair of components
  for (let i = 0; i < componentsWithRelations.length; i++) {
    for (let j = i + 1; j < componentsWithRelations.length; j++) {
      const comp1 = componentsWithRelations[i];
      const comp2 = componentsWithRelations[j];
      
      const relationships = analyzeComponentPair(comp1, comp2);
      
      // Add relationships to both components
      comp1.relationships.push(...relationships.comp1Relations);
      comp2.relationships.push(...relationships.comp2Relations);
    }
  }
  
  return componentsWithRelations;
}

function analyzeComponentPair(comp1: SemanticComponent, comp2: SemanticComponent) {
  const relationships = {
    comp1Relations: [] as ComponentRelationship[],
    comp2Relations: [] as ComponentRelationship[]
  };
  
  // Spatial relationships
  const spatialRel = analyzeSpatialRelationship(comp1.boundingBox, comp2.boundingBox);
  if (spatialRel) {
    relationships.comp1Relations.push({
      type: spatialRel.rel1,
      targetComponentId: comp2.id,
      confidence: spatialRel.confidence
    });
    relationships.comp2Relations.push({
      type: spatialRel.rel2,
      targetComponentId: comp1.id,
      confidence: spatialRel.confidence
    });
  }
  
  // Containment relationships
  const containmentRel = analyzeContainment(comp1.boundingBox, comp2.boundingBox);
  if (containmentRel) {
    relationships.comp1Relations.push({
      type: containmentRel.rel1,
      targetComponentId: comp2.id,
      confidence: containmentRel.confidence
    });
    relationships.comp2Relations.push({
      type: containmentRel.rel2,
      targetComponentId: comp1.id,
      confidence: containmentRel.confidence
    });
  }
  
  // Functional relationships
  const functionalRel = analyzeFunctionalRelationship(comp1, comp2);
  if (functionalRel) {
    relationships.comp1Relations.push(...functionalRel.comp1Relations);
    relationships.comp2Relations.push(...functionalRel.comp2Relations);
  }
  
  return relationships;
}

function analyzeSpatialRelationship(box1: any, box2: any) {
  const threshold = 50; // pixels
  
  const center1 = { x: box1.x + box1.width / 2, y: box1.y + box1.height / 2 };
  const center2 = { x: box2.x + box2.width / 2, y: box2.y + box2.height / 2 };
  
  const dx = center2.x - center1.x;
  const dy = center2.y - center1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > threshold * 3) return null; // Too far apart
  
  // Determine primary direction
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal relationship
    if (dx > 0) {
      return {
        rel1: RelationshipType.LEFT_OF,
        rel2: RelationshipType.RIGHT_OF,
        confidence: Math.max(0.5, 1 - distance / (threshold * 3))
      };
    } else {
      return {
        rel1: RelationshipType.RIGHT_OF,
        rel2: RelationshipType.LEFT_OF,
        confidence: Math.max(0.5, 1 - distance / (threshold * 3))
      };
    }
  } else {
    // Vertical relationship
    if (dy > 0) {
      return {
        rel1: RelationshipType.ABOVE,
        rel2: RelationshipType.BELOW,
        confidence: Math.max(0.5, 1 - distance / (threshold * 3))
      };
    } else {
      return {
        rel1: RelationshipType.BELOW,
        rel2: RelationshipType.ABOVE,
        confidence: Math.max(0.5, 1 - distance / (threshold * 3))
      };
    }
  }
}

function analyzeContainment(box1: any, box2: any) {
  // Check if box1 contains box2
  const box1ContainsBox2 = 
    box1.x <= box2.x &&
    box1.y <= box2.y &&
    box1.x + box1.width >= box2.x + box2.width &&
    box1.y + box1.height >= box2.y + box2.height;
  
  // Check if box2 contains box1
  const box2ContainsBox1 =
    box2.x <= box1.x &&
    box2.y <= box1.y &&
    box2.x + box2.width >= box1.x + box1.width &&
    box2.y + box2.height >= box1.y + box1.height;
  
  if (box1ContainsBox2) {
    return {
      rel1: RelationshipType.CONTAINS,
      rel2: RelationshipType.CONTAINED_BY,
      confidence: 0.9
    };
  }
  
  if (box2ContainsBox1) {
    return {
      rel1: RelationshipType.CONTAINED_BY,
      rel2: RelationshipType.CONTAINS,
      confidence: 0.9
    };
  }
  
  return null;
}

function analyzeFunctionalRelationship(comp1: SemanticComponent, comp2: SemanticComponent) {
  const relationships = {
    comp1Relations: [] as ComponentRelationship[],
    comp2Relations: [] as ComponentRelationship[]
  };
  
  // Label + Input field relationship
  if (comp1.role === ComponentRole.LABEL && comp2.role === ComponentRole.INPUT_FIELD) {
    const distance = calculateDistance(comp1.boundingBox, comp2.boundingBox);
    if (distance < 100) {
      relationships.comp1Relations.push({
        type: RelationshipType.VALIDATES,
        targetComponentId: comp2.id,
        confidence: 0.8
      });
      relationships.comp2Relations.push({
        type: RelationshipType.VALIDATED_BY,
        targetComponentId: comp1.id,
        confidence: 0.8
      });
    }
  }
  
  // Button + Form relationship
  if (comp1.role === ComponentRole.BUTTON && comp2.role === ComponentRole.INPUT_FIELD) {
    relationships.comp1Relations.push({
      type: RelationshipType.TRIGGERS,
      targetComponentId: comp2.id,
      confidence: 0.7
    });
  }
  
  return relationships.comp1Relations.length > 0 || relationships.comp2Relations.length > 0 
    ? relationships 
    : null;
}

function calculateDistance(box1: any, box2: any): number {
  const center1 = { x: box1.x + box1.width / 2, y: box1.y + box1.height / 2 };
  const center2 = { x: box2.x + box2.width / 2, y: box2.y + box2.height / 2 };
  
  return Math.sqrt(
    Math.pow(center2.x - center1.x, 2) + 
    Math.pow(center2.y - center1.y, 2)
  );
}

function generateSummary(components: SemanticComponent[]): ExtractionSummary {
  const componentBreakdown: Record<ComponentRole, number> = {} as Record<ComponentRole, number>;
  const relationshipBreakdown: Record<RelationshipType, number> = {} as Record<RelationshipType, number>;
  
  let totalConfidence = 0;
  let highConfidenceCount = 0;
  let mediumConfidenceCount = 0;
  let lowConfidenceCount = 0;
  
  for (const component of components) {
    // Count component roles
    componentBreakdown[component.role] = (componentBreakdown[component.role] || 0) + 1;
    
    // Count relationships
    for (const relationship of component.relationships) {
      relationshipBreakdown[relationship.type] = (relationshipBreakdown[relationship.type] || 0) + 1;
    }
    
    // Confidence analysis
    totalConfidence += component.confidence;
    if (component.confidence > 0.8) highConfidenceCount++;
    else if (component.confidence > 0.5) mediumConfidenceCount++;
    else lowConfidenceCount++;
  }
  
  return {
    totalComponents: components.length,
    componentBreakdown,
    relationshipBreakdown,
    averageConfidence: components.length > 0 ? totalConfidence / components.length : 0,
    highConfidenceComponents: highConfidenceCount,
    mediumConfidenceComponents: mediumConfidenceCount,
    lowConfidenceComponents: lowConfidenceCount
  };
}

function calculateTokenOptimization(originalElements: any[], components: SemanticComponent[]): TokenOptimization {
  // Estimate original token count (rough approximation)
  const originalTokenCount = originalElements.length * 50; // ~50 tokens per element on average
  
  // Estimate optimized token count
  const optimizedTokenCount = components.reduce((total, comp) => {
    // Base component description: ~30 tokens
    let tokens = 30;
    
    // Add tokens for relationships: ~10 tokens per relationship
    tokens += comp.relationships.length * 10;
    
    // Add tokens for text content
    if (comp.metadata.visualProperties.textContent) {
      tokens += Math.ceil(comp.metadata.visualProperties.textContent.length / 4); // ~4 chars per token
    }
    
    return total + tokens;
  }, 0);
  
  const reductionPercentage = originalTokenCount > 0 
    ? ((originalTokenCount - optimizedTokenCount) / originalTokenCount) * 100 
    : 0;
  
  const compressionRatio = optimizedTokenCount > 0 
    ? originalTokenCount / optimizedTokenCount 
    : 1;
  
  return {
    originalTokenCount,
    optimizedTokenCount,
    reductionPercentage: Math.max(0, reductionPercentage), // Ensure non-negative
    compressionRatio
  };
}

// Export for testing
export {
  extractSemanticComponents,
  classifyElementRole,
  calculateElementConfidence,
  analyzeRelationships
};