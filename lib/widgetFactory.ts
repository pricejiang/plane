// Step 6: Widget Factory and Pattern Detection
// Creates widget metadata from patterns and manages widget detection

import { 
  WidgetType, 
  WidgetMetadata, 
  WidgetDetectionPattern, 
  WidgetDetectionResult,
  WidgetFactory,
  WidgetPatternExtractor,
  MapWidgetMetadata,
  VideoWidgetMetadata,
  IframeWidgetMetadata,
  ChartWidgetMetadata,
  CalendarWidgetMetadata,
  BoundingBox,
  WidgetError,
  WidgetErrorCode
} from '../types/widgets';

// =============================================================================
// WIDGET DETECTION PATTERNS
// =============================================================================

const WIDGET_PATTERNS: WidgetDetectionPattern[] = [
  // Map patterns
  {
    pattern: /\[MAP(?:\s*:\s*([^[\]]+))?\]/i,
    type: WidgetType.MAP,
    defaultConfig: {
      center: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
      zoom: 10,
      mapStyle: 'roadmap' as const,
      showControls: true,
      allowZoom: true,
      allowPan: true,
      markers: []
    },
    confidence: 0.95
  },
  {
    pattern: /(?:map|google\s*maps?|location|coordinates?)\s*[:\-]\s*(.+)/i,
    type: WidgetType.MAP,
    defaultConfig: {
      center: { latitude: 37.7749, longitude: -122.4194 },
      zoom: 10,
      mapStyle: 'roadmap' as const,
      showControls: true,
      allowZoom: true,
      allowPan: true,
      markers: []
    },
    confidence: 0.7
  },

  // Video patterns
  {
    pattern: /\[VIDEO(?:\s*:\s*([^[\]]+))?\]/i,
    type: WidgetType.VIDEO,
    defaultConfig: {
      url: '',
      provider: 'unknown' as const,
      autoplay: false,
      loop: false,
      muted: false,
      controls: true,
      aspectRatio: 16/9
    },
    confidence: 0.95
  },
  {
    pattern: /(?:youtube|vimeo|video)(?:\s*[:\-]\s*)?(.+)/i,
    type: WidgetType.VIDEO,
    defaultConfig: {
      url: '',
      provider: 'unknown' as const,
      autoplay: false,
      loop: false,
      muted: false,
      controls: true,
      aspectRatio: 16/9
    },
    confidence: 0.8
  },

  // IFrame patterns
  {
    pattern: /\[IFRAME(?:\s*:\s*([^[\]]+))?\]/i,
    type: WidgetType.IFRAME,
    defaultConfig: {
      url: '',
      allowFullscreen: true,
      sandbox: ['allow-same-origin', 'allow-scripts']
    },
    confidence: 0.9
  },
  {
    pattern: /(?:embed|iframe|website)(?:\s*[:\-]\s*)?(.+)/i,
    type: WidgetType.IFRAME,
    defaultConfig: {
      url: '',
      allowFullscreen: true,
      sandbox: ['allow-same-origin', 'allow-scripts']
    },
    confidence: 0.7
  },

  // Chart patterns
  {
    pattern: /\[CHART(?:\s*:\s*([^[\]]+))?\]/i,
    type: WidgetType.CHART,
    defaultConfig: {
      chartType: 'line' as const,
      data: null,
      options: {}
    },
    confidence: 0.9
  },
  {
    pattern: /(?:chart|graph|plot|analytics)(?:\s*[:\-]\s*)?(.+)/i,
    type: WidgetType.CHART,
    defaultConfig: {
      chartType: 'line' as const,
      data: null,
      options: {}
    },
    confidence: 0.75
  },

  // Calendar patterns
  {
    pattern: /\[CALENDAR(?:\s*:\s*([^[\]]+))?\]/i,
    type: WidgetType.CALENDAR,
    defaultConfig: {
      defaultView: 'month' as const,
      showWeekends: true,
      timeZone: 'UTC',
      events: []
    },
    confidence: 0.9
  },
  {
    pattern: /(?:calendar|schedule|events?)(?:\s*[:\-]\s*)?(.+)/i,
    type: WidgetType.CALENDAR,
    defaultConfig: {
      defaultView: 'month' as const,
      showWeekends: true,
      timeZone: 'UTC',
      events: []
    },
    confidence: 0.75
  }
];

// =============================================================================
// WIDGET FACTORY IMPLEMENTATION
// =============================================================================

export class WidgetFactoryImpl implements WidgetFactory {
  private patternExtractor: WidgetPatternExtractor;

  constructor() {
    this.patternExtractor = new WidgetPatternExtractorImpl();
  }

  createFromPattern(text: string, elementId: string, bounds: BoundingBox): WidgetMetadata | null {
    const detection = this.detectWidgetFromText(text);
    
    if (!detection.isWidget || !detection.type) {
      return null;
    }

    try {
      const baseMetadata = {
        elementId,
        title: this.extractTitleFromText(text),
        description: `Auto-detected ${detection.type} widget`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: '1.0.0'
      };

      switch (detection.type) {
        case WidgetType.MAP:
          return this.createMapWidget(baseMetadata, text, bounds);
        case WidgetType.VIDEO:
          return this.createVideoWidget(baseMetadata, text, bounds);
        case WidgetType.IFRAME:
          return this.createIframeWidget(baseMetadata, text, bounds);
        case WidgetType.CHART:
          return this.createChartWidget(baseMetadata, text, bounds);
        case WidgetType.CALENDAR:
          return this.createCalendarWidget(baseMetadata, text, bounds);
        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to create widget from pattern:', error);
      return null;
    }
  }

  createFromMetadata(metadata: Partial<WidgetMetadata>, elementId: string): WidgetMetadata {
    if (!metadata.type) {
      throw new WidgetError('Widget type is required', WidgetErrorCode.INVALID_METADATA);
    }

    const baseMetadata = {
      elementId,
      title: metadata.title || `${metadata.type} widget`,
      description: metadata.description || `${metadata.type} widget`,
      createdAt: metadata.createdAt || Date.now(),
      updatedAt: Date.now(),
      version: metadata.version || '1.0.0'
    };

    const config = metadata.config || this.generateDefaultConfig(metadata.type);

    return {
      ...baseMetadata,
      type: metadata.type,
      config
    } as WidgetMetadata;
  }

  validateMetadata(metadata: any): boolean {
    try {
      if (!metadata || typeof metadata !== 'object') {
        return false;
      }

      if (!metadata.elementId || typeof metadata.elementId !== 'string') {
        return false;
      }

      if (!metadata.type || !Object.values(WidgetType).includes(metadata.type)) {
        return false;
      }

      if (!metadata.createdAt || typeof metadata.createdAt !== 'number') {
        return false;
      }

      if (!metadata.config || typeof metadata.config !== 'object') {
        return false;
      }

      // Type-specific validation
      switch (metadata.type) {
        case WidgetType.MAP:
          return this.validateMapConfig(metadata.config);
        case WidgetType.VIDEO:
          return this.validateVideoConfig(metadata.config);
        case WidgetType.IFRAME:
          return this.validateIframeConfig(metadata.config);
        case WidgetType.CHART:
          return this.validateChartConfig(metadata.config);
        case WidgetType.CALENDAR:
          return this.validateCalendarConfig(metadata.config);
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  generateDefaultConfig(type: WidgetType): any {
    const pattern = WIDGET_PATTERNS.find(p => p.type === type);
    return pattern ? { ...pattern.defaultConfig } : {};
  }

  extractPatternConfig(text: string, type: WidgetType): any {
    switch (type) {
      case WidgetType.MAP:
        return this.patternExtractor.extractMapConfig(text);
      case WidgetType.VIDEO:
        return this.patternExtractor.extractVideoConfig(text);
      case WidgetType.IFRAME:
        return this.patternExtractor.extractIframeConfig(text);
      case WidgetType.CHART:
        return this.patternExtractor.extractChartConfig(text);
      case WidgetType.CALENDAR:
        return this.patternExtractor.extractCalendarConfig(text);
      default:
        return null;
    }
  }

  // =============================================================================
  // WIDGET DETECTION
  // =============================================================================

  detectWidgetFromText(text: string): WidgetDetectionResult {
    if (!text || typeof text !== 'string') {
      return {
        isWidget: false,
        confidence: 0,
        detectionMethod: 'none',
        reasoning: ['No text provided']
      };
    }

    const cleanText = text.trim();
    let bestMatch: { pattern: WidgetDetectionPattern; confidence: number; extractedConfig?: any } | null = null;

    // Test each pattern
    for (const pattern of WIDGET_PATTERNS) {
      const match = cleanText.match(pattern.pattern);
      if (match) {
        const extractedConfig = this.extractPatternConfig(cleanText, pattern.type);
        const confidence = pattern.confidence * (extractedConfig ? 1.1 : 1.0); // Boost if config extracted
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { pattern, confidence: Math.min(confidence, 1.0), extractedConfig };
        }
      }
    }

    if (bestMatch) {
      return {
        isWidget: true,
        type: bestMatch.pattern.type,
        confidence: bestMatch.confidence,
        extractedConfig: bestMatch.extractedConfig,
        detectionMethod: 'pattern',
        reasoning: [`Matched pattern for ${bestMatch.pattern.type}`, `Confidence: ${(bestMatch.confidence * 100).toFixed(1)}%`]
      };
    }

    return {
      isWidget: false,
      confidence: 0,
      detectionMethod: 'none',
      reasoning: ['No widget patterns matched']
    };
  }

  // =============================================================================
  // WIDGET TYPE CREATORS
  // =============================================================================

  private createMapWidget(baseMetadata: any, text: string, bounds: BoundingBox): MapWidgetMetadata {
    const extractedConfig = this.patternExtractor.extractMapConfig(text);
    const defaultConfig = this.generateDefaultConfig(WidgetType.MAP);
    
    return {
      ...baseMetadata,
      type: WidgetType.MAP,
      config: {
        ...defaultConfig,
        ...extractedConfig
      }
    };
  }

  private createVideoWidget(baseMetadata: any, text: string, bounds: BoundingBox): VideoWidgetMetadata {
    const extractedConfig = this.patternExtractor.extractVideoConfig(text);
    const defaultConfig = this.generateDefaultConfig(WidgetType.VIDEO);
    
    // Calculate aspect ratio from bounds if not specified
    const aspectRatio = extractedConfig?.aspectRatio || (bounds.width / bounds.height);
    
    return {
      ...baseMetadata,
      type: WidgetType.VIDEO,
      config: {
        ...defaultConfig,
        ...extractedConfig,
        aspectRatio
      }
    };
  }

  private createIframeWidget(baseMetadata: any, text: string, bounds: BoundingBox): IframeWidgetMetadata {
    const extractedConfig = this.patternExtractor.extractIframeConfig(text);
    const defaultConfig = this.generateDefaultConfig(WidgetType.IFRAME);
    
    return {
      ...baseMetadata,
      type: WidgetType.IFRAME,
      config: {
        ...defaultConfig,
        ...extractedConfig
      }
    };
  }

  private createChartWidget(baseMetadata: any, text: string, bounds: BoundingBox): ChartWidgetMetadata {
    const extractedConfig = this.patternExtractor.extractChartConfig(text);
    const defaultConfig = this.generateDefaultConfig(WidgetType.CHART);
    
    return {
      ...baseMetadata,
      type: WidgetType.CHART,
      config: {
        ...defaultConfig,
        ...extractedConfig
      }
    };
  }

  private createCalendarWidget(baseMetadata: any, text: string, bounds: BoundingBox): CalendarWidgetMetadata {
    const extractedConfig = this.patternExtractor.extractCalendarConfig(text);
    const defaultConfig = this.generateDefaultConfig(WidgetType.CALENDAR);
    
    return {
      ...baseMetadata,
      type: WidgetType.CALENDAR,
      config: {
        ...defaultConfig,
        ...extractedConfig
      }
    };
  }

  // =============================================================================
  // VALIDATION HELPERS
  // =============================================================================

  private validateMapConfig(config: any): boolean {
    return !!(config.center?.latitude && config.center?.longitude && 
             typeof config.zoom === 'number' && config.zoom > 0);
  }

  private validateVideoConfig(config: any): boolean {
    return !!(config.url && typeof config.url === 'string' && config.url.length > 0);
  }

  private validateIframeConfig(config: any): boolean {
    return !!(config.url && typeof config.url === 'string' && config.url.length > 0);
  }

  private validateChartConfig(config: any): boolean {
    return !!(config.chartType && typeof config.chartType === 'string');
  }

  private validateCalendarConfig(config: any): boolean {
    return !!(config.defaultView && typeof config.defaultView === 'string');
  }

  private extractTitleFromText(text: string): string {
    // Extract a clean title from the text
    const cleaned = text.replace(/\[[^\]]*\]/g, '').trim();
    return cleaned.substring(0, 50) || 'Widget';
  }
}

// =============================================================================
// PATTERN EXTRACTOR IMPLEMENTATION
// =============================================================================

class WidgetPatternExtractorImpl implements WidgetPatternExtractor {
  extractMapConfig(text: string): Partial<MapWidgetMetadata['config']> | null {
    const config: Partial<MapWidgetMetadata['config']> = {};
    
    // Extract coordinates
    const coordPattern = /(?:lat|latitude)[:\s]*(-?\d+\.?\d*)[,\s]+(?:lng|lon|longitude)[:\s]*(-?\d+\.?\d*)/i;
    const coordMatch = text.match(coordPattern);
    if (coordMatch) {
      config.center = {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2])
      };
    }
    
    // Extract zoom level
    const zoomPattern = /zoom[:\s]*(\d+)/i;
    const zoomMatch = text.match(zoomPattern);
    if (zoomMatch) {
      config.zoom = parseInt(zoomMatch[1], 10);
    }
    
    // Extract map style
    const stylePattern = /(?:style|type)[:\s]*(\w+)/i;
    const styleMatch = text.match(stylePattern);
    if (styleMatch) {
      const style = styleMatch[1].toLowerCase();
      if (['roadmap', 'satellite', 'hybrid', 'terrain'].includes(style)) {
        config.mapStyle = style as any;
      }
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }

  extractVideoConfig(text: string): Partial<VideoWidgetMetadata['config']> | null {
    const config: Partial<VideoWidgetMetadata['config']> = {};
    
    // Extract URL
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|.*\.(mp4|webm|ogg|avi|mov))/i;
    const urlMatch = text.match(urlPattern);
    if (urlMatch) {
      config.url = urlMatch[0];
      
      // Detect provider
      if (urlMatch[0].includes('youtube') || urlMatch[0].includes('youtu.be')) {
        config.provider = 'youtube';
      } else if (urlMatch[0].includes('vimeo')) {
        config.provider = 'vimeo';
      } else {
        config.provider = 'direct';
      }
    }
    
    // Extract autoplay setting
    if (/autoplay/i.test(text)) {
      config.autoplay = true;
    }
    
    // Extract time markers
    const timePattern = /(?:start|t)[:\s]*(\d+)(?:[:\s]*(\d+))?/i;
    const timeMatch = text.match(timePattern);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      config.startTime = minutes * 60 + seconds;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }

  extractIframeConfig(text: string): Partial<IframeWidgetMetadata['config']> | null {
    const config: Partial<IframeWidgetMetadata['config']> = {};
    
    // Extract URL
    const urlPattern = /https?:\/\/[^\s\]]+/i;
    const urlMatch = text.match(urlPattern);
    if (urlMatch) {
      config.url = urlMatch[0];
    }
    
    // Extract fullscreen setting
    if (/fullscreen/i.test(text)) {
      config.allowFullscreen = true;
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }

  extractChartConfig(text: string): Partial<ChartWidgetMetadata['config']> | null {
    const config: Partial<ChartWidgetMetadata['config']> = {};
    
    // Extract chart type
    const typePattern = /(?:type|chart)[:\s]*(\w+)/i;
    const typeMatch = text.match(typePattern);
    if (typeMatch) {
      const type = typeMatch[1].toLowerCase();
      if (['line', 'bar', 'pie', 'scatter', 'area'].includes(type)) {
        config.chartType = type as any;
      }
    }
    
    // Extract data URL
    const urlPattern = /(?:data|url)[:\s]*(https?:\/\/[^\s\]]+)/i;
    const urlMatch = text.match(urlPattern);
    if (urlMatch) {
      config.dataUrl = urlMatch[1];
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }

  extractCalendarConfig(text: string): Partial<CalendarWidgetMetadata['config']> | null {
    const config: Partial<CalendarWidgetMetadata['config']> = {};
    
    // Extract view type
    const viewPattern = /(?:view|display)[:\s]*(\w+)/i;
    const viewMatch = text.match(viewPattern);
    if (viewMatch) {
      const view = viewMatch[1].toLowerCase();
      if (['month', 'week', 'day'].includes(view)) {
        config.defaultView = view as any;
      }
    }
    
    // Extract calendar URL
    const urlPattern = /(?:calendar|url)[:\s]*(https?:\/\/[^\s\]]+)/i;
    const urlMatch = text.match(urlPattern);
    if (urlMatch) {
      config.calendarUrl = urlMatch[1];
    }
    
    return Object.keys(config).length > 0 ? config : null;
  }
}

// Export singleton instance
export const widgetFactory = new WidgetFactoryImpl();