// Step 6: Widget Placeholder System Types
// Comprehensive type definitions for widget placeholders and metadata

export enum WidgetType {
  MAP = 'map',
  VIDEO = 'video',
  IFRAME = 'iframe',
  CHART = 'chart',
  CALENDAR = 'calendar'
}

// =============================================================================
// WIDGET METADATA DEFINITIONS
// =============================================================================

export interface BaseWidgetMetadata {
  type: WidgetType;
  elementId: string;
  title?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  version: string;
}

export interface MapWidgetMetadata extends BaseWidgetMetadata {
  type: WidgetType.MAP;
  config: {
    center: {
      latitude: number;
      longitude: number;
    };
    zoom: number;
    mapStyle: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
    markers?: MapMarker[];
    showControls: boolean;
    allowZoom: boolean;
    allowPan: boolean;
  };
  staticSnapshot?: {
    imageUrl: string;
    generatedAt: number;
    bounds: BoundingBox;
  };
}

export interface VideoWidgetMetadata extends BaseWidgetMetadata {
  type: WidgetType.VIDEO;
  config: {
    url: string;
    provider: 'youtube' | 'vimeo' | 'direct' | 'unknown';
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    controls: boolean;
    startTime?: number; // seconds
    endTime?: number; // seconds
    posterUrl?: string;
    aspectRatio: number; // width/height
  };
  staticSnapshot?: {
    posterUrl: string;
    thumbnailUrl?: string;
    duration?: number;
    title?: string;
  };
}

export interface IframeWidgetMetadata extends BaseWidgetMetadata {
  type: WidgetType.IFRAME;
  config: {
    url: string;
    allowFullscreen: boolean;
    sandbox: string[];
    title?: string;
  };
  staticSnapshot?: {
    screenshotUrl: string;
    generatedAt: number;
  };
}

export interface ChartWidgetMetadata extends BaseWidgetMetadata {
  type: WidgetType.CHART;
  config: {
    chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
    dataUrl?: string;
    data?: any; // Chart data
    options?: any; // Chart options
  };
  staticSnapshot?: {
    imageUrl: string;
    generatedAt: number;
  };
}

export interface CalendarWidgetMetadata extends BaseWidgetMetadata {
  type: WidgetType.CALENDAR;
  config: {
    calendarUrl?: string;
    defaultView: 'month' | 'week' | 'day';
    showWeekends: boolean;
    timeZone: string;
    events?: CalendarEvent[];
  };
  staticSnapshot?: {
    imageUrl: string;
    generatedAt: number;
    currentDate: string;
  };
}

// Union type for all widget metadata
export type WidgetMetadata = 
  | MapWidgetMetadata 
  | VideoWidgetMetadata 
  | IframeWidgetMetadata 
  | ChartWidgetMetadata 
  | CalendarWidgetMetadata;

// =============================================================================
// SUPPORTING TYPES
// =============================================================================

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end: string; // ISO date string
  allDay?: boolean;
  color?: string;
  description?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// WIDGET DETECTION AND PATTERN MATCHING
// =============================================================================

export interface WidgetDetectionPattern {
  pattern: RegExp;
  type: WidgetType;
  defaultConfig: any;
  confidence: number;
}

export interface WidgetDetectionResult {
  isWidget: boolean;
  type?: WidgetType;
  confidence: number;
  extractedConfig?: Partial<any>;
  detectionMethod: 'metadata' | 'pattern' | 'none';
  reasoning: string[];
}

// =============================================================================
// WIDGET STORAGE AND LIFECYCLE
// =============================================================================

export interface WidgetStorage {
  // Core storage operations
  set(elementId: string, metadata: WidgetMetadata): void;
  get(elementId: string): WidgetMetadata | undefined;
  has(elementId: string): boolean;
  delete(elementId: string): boolean;
  clear(): void;
  
  // Lifecycle operations
  duplicate(sourceId: string, targetId: string): boolean;
  update(elementId: string, updates: Partial<WidgetMetadata>): boolean;
  
  // Query operations
  getAll(): Map<string, WidgetMetadata>;
  getByType(type: WidgetType): Map<string, WidgetMetadata>;
  count(): number;
  
  // History and undo/redo
  saveSnapshot(): string; // Returns snapshot ID
  restoreSnapshot(snapshotId: string): boolean;
  getHistory(): WidgetStorageSnapshot[];
}

export interface WidgetStorageSnapshot {
  id: string;
  timestamp: number;
  data: Map<string, WidgetMetadata>;
  operation: 'create' | 'update' | 'delete' | 'duplicate' | 'clear';
  elementId?: string;
}

// =============================================================================
// WIDGET COMPONENT INTEGRATION
// =============================================================================

export interface WidgetComponent {
  id: string;
  elementId: string;
  type: WidgetType;
  metadata: WidgetMetadata;
  bounds: BoundingBox;
  isActive: boolean;
  renderMode: 'static' | 'interactive' | 'placeholder';
  zIndex: number;
}

export interface WidgetRenderContext {
  component: WidgetComponent;
  containerElement: HTMLElement;
  isVisible: boolean;
  scale: number;
  readonly: boolean;
}

// =============================================================================
// WIDGET EXTRACTION PIPELINE INTEGRATION
// =============================================================================

export interface WidgetExtractionOptions {
  enableWidgetDetection: boolean;
  widgetDetectionMethods: ('metadata' | 'pattern')[];
  minWidgetConfidence: number;
  generateStaticSnapshots: boolean;
  maxWidgetsPerElement: number;
}

export interface WidgetExtractionResult {
  widgets: WidgetComponent[];
  detectionStats: {
    totalChecked: number;
    widgetsFound: number;
    metadataBasedDetections: number;
    patternBasedDetections: number;
    averageConfidence: number;
  };
  processingTime: number;
}

// =============================================================================
// EXPORT AND SERIALIZATION
// =============================================================================

export interface WidgetExportData {
  elementId: string;
  type: WidgetType;
  metadata: WidgetMetadata;
  staticSnapshot?: {
    type: 'image' | 'html' | 'data';
    content: string;
    mimeType: string;
    size: number;
  };
  bounds: BoundingBox;
  exportedAt: number;
}

export interface WidgetSerializationFormat {
  version: string;
  widgets: Record<string, WidgetMetadata>;
  snapshots: WidgetStorageSnapshot[];
  metadata: {
    createdAt: number;
    totalWidgets: number;
    supportedTypes: WidgetType[];
  };
}

// =============================================================================
// WIDGET FACTORY AND UTILITIES
// =============================================================================

export interface WidgetFactory {
  createFromPattern(text: string, elementId: string, bounds: BoundingBox): WidgetMetadata | null;
  createFromMetadata(metadata: Partial<WidgetMetadata>, elementId: string): WidgetMetadata;
  validateMetadata(metadata: any): boolean;
  generateDefaultConfig(type: WidgetType): any;
  extractPatternConfig(text: string, type: WidgetType): any;
}

export interface WidgetPatternExtractor {
  extractMapConfig(text: string): Partial<MapWidgetMetadata['config']> | null;
  extractVideoConfig(text: string): Partial<VideoWidgetMetadata['config']> | null;
  extractIframeConfig(text: string): Partial<IframeWidgetMetadata['config']> | null;
  extractChartConfig(text: string): Partial<ChartWidgetMetadata['config']> | null;
  extractCalendarConfig(text: string): Partial<CalendarWidgetMetadata['config']> | null;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class WidgetError extends Error {
  constructor(
    message: string,
    public code: string,
    public elementId?: string,
    public widgetType?: WidgetType
  ) {
    super(message);
    this.name = 'WidgetError';
  }
}

export enum WidgetErrorCode {
  INVALID_METADATA = 'INVALID_METADATA',
  UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE',
  STORAGE_ERROR = 'STORAGE_ERROR',
  PATTERN_MISMATCH = 'PATTERN_MISMATCH',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  DUPLICATE_ID = 'DUPLICATE_ID',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR'
}