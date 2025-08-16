// Phase 2: Local Extraction Pipeline Types

export interface SemanticComponent {
  id: string;
  elementIds: string[]; // Multiple elements can form one component
  role: ComponentRole;
  relationships: ComponentRelationship[];
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: ComponentMetadata;
}

export enum ComponentRole {
  // UI Elements
  BUTTON = 'button',
  INPUT_FIELD = 'input_field',
  DROPDOWN = 'dropdown',
  CHECKBOX = 'checkbox',
  RADIO_BUTTON = 'radio_button',
  TOGGLE = 'toggle',
  SLIDER = 'slider',
  
  // Layout & Containers
  CARD = 'card',
  MODAL = 'modal',
  SIDEBAR = 'sidebar',
  HEADER = 'header',
  FOOTER = 'footer',
  PANEL = 'panel',
  TAB_CONTAINER = 'tab_container',
  
  // Content
  TEXT_BLOCK = 'text_block',
  TITLE = 'title',
  LABEL = 'label',
  ICON = 'icon',
  IMAGE_PLACEHOLDER = 'image_placeholder',
  
  // Navigation
  MENU = 'menu',
  BREADCRUMB = 'breadcrumb',
  PAGINATION = 'pagination',
  NAVIGATION_BAR = 'navigation_bar',
  
  // Data Display
  TABLE = 'table',
  LIST = 'list',
  CHART = 'chart',
  GRAPH = 'graph',
  
  // Flow Elements
  PROCESS_STEP = 'process_step',
  DECISION_POINT = 'decision_point',
  CONNECTOR = 'connector',
  START_END = 'start_end',
  
  // Unknown/Generic
  CONTAINER = 'container',
  COMPONENT = 'component',
  UNKNOWN = 'unknown'
}

export interface ComponentRelationship {
  type: RelationshipType;
  targetComponentId: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export enum RelationshipType {
  // Hierarchical
  CONTAINS = 'contains',
  CONTAINED_BY = 'contained_by',
  PARENT_OF = 'parent_of',
  CHILD_OF = 'child_of',
  
  // Functional
  TRIGGERS = 'triggers',
  TRIGGERED_BY = 'triggered_by',
  LINKS_TO = 'links_to',
  LINKED_FROM = 'linked_from',
  VALIDATES = 'validates',
  VALIDATED_BY = 'validated_by',
  
  // Layout
  ADJACENT_TO = 'adjacent_to',
  ABOVE = 'above',
  BELOW = 'below',
  LEFT_OF = 'left_of',
  RIGHT_OF = 'right_of',
  ALIGNED_WITH = 'aligned_with',
  
  // Flow
  FLOWS_TO = 'flows_to',
  FLOWS_FROM = 'flows_from',
  BRANCHES_TO = 'branches_to',
  MERGES_WITH = 'merges_with',
  
  // Data
  POPULATES = 'populates',
  POPULATED_BY = 'populated_by',
  FILTERS = 'filters',
  FILTERED_BY = 'filtered_by'
}

export interface ComponentMetadata {
  // Visual properties
  visualProperties: {
    hasText: boolean;
    textContent?: string;
    hasShape: boolean;
    shapeType?: string;
    colorScheme?: string;
    size: 'small' | 'medium' | 'large';
  };
  
  // Interaction patterns
  interactionPattern?: {
    isClickable: boolean;
    isInputField: boolean;
    hasStates: boolean;
    stateCount?: number;
  };
  
  // Layout context
  layoutContext: {
    position: 'isolated' | 'grouped' | 'nested';
    alignment: 'left' | 'center' | 'right' | 'justified';
    spacing: 'tight' | 'normal' | 'loose';
  };
  
  // Semantic hints
  semanticHints: string[];
  
  // Analysis metadata
  analysisMetadata: {
    extractionMethod: 'pattern_matching' | 'ml_classification' | 'rule_based';
    processingTime: number;
    version: string;
  };
}

export interface ExtractionResult {
  components: SemanticComponent[];
  summary: ExtractionSummary;
  tokenOptimization: TokenOptimization;
  timestamp: number;
  processingTime: number;
}

export interface ExtractionSummary {
  totalComponents: number;
  componentBreakdown: Record<ComponentRole, number>;
  relationshipBreakdown: Record<RelationshipType, number>;
  averageConfidence: number;
  highConfidenceComponents: number; // confidence > 0.8
  mediumConfidenceComponents: number; // confidence 0.5-0.8
  lowConfidenceComponents: number; // confidence < 0.5
}

export interface TokenOptimization {
  originalTokenCount: number; // Estimated tokens for raw elements
  optimizedTokenCount: number; // Tokens for semantic representation
  reductionPercentage: number;
  compressionRatio: number;
}

// WebWorker Communication Types
export interface ExtractionWorkerMessage {
  type: 'EXTRACT_COMPONENTS';
  payload: ExtractionRequest;
  id: string;
}

export interface ExtractionWorkerResponse {
  type: 'EXTRACTION_COMPLETE' | 'EXTRACTION_ERROR';
  payload: ExtractionResult | { error: string };
  id: string;
}

export interface ExtractionRequest {
  elements: any[]; // ExcalidrawElement[] - keeping as any to avoid circular deps
  viewport: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  options: ExtractionOptions;
}

export interface ExtractionOptions {
  minConfidence: number; // Filter components below this confidence
  enableRelationshipAnalysis: boolean;
  enableTokenOptimization: boolean;
  maxComponents: number; // Limit for performance
  analysisDepth: 'fast' | 'standard' | 'thorough';
}

// Integration with existing types
export interface EnhancedSemanticLabel {
  // Extends existing SemanticLabel
  id: string;
  elementId: string;
  label: string;
  confidence: number;
  category: 'widget' | 'text' | 'shape' | 'diagram' | 'unknown';
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Phase 2 enhancements
  component?: SemanticComponent;
  extractionMetadata?: {
    processingTime: number;
    method: string;
    version: string;
  };
}