// Step 5: Multi-Stage Local Extraction Pipeline
// Comprehensive 5-stage processing of Excalidraw elements into semantic components

import { 
  ExtractionWorkerMessage, 
  ExtractionWorkerResponse, 
  ExtractionResult,
  SemanticComponent,
  ComponentRole,
  ComponentRelationship,
  RelationshipType,
  ExtractionRequest,
  ComponentMetadata
} from '../types/extraction';

import { 
  WidgetType, 
  WidgetMetadata, 
  WidgetDetectionResult 
} from '../types/widgets';

// =============================================================================
// STAGE 1: ELEMENT NORMALIZATION
// =============================================================================

interface NormalizedElement {
  id: string;
  type: string;
  originalElement: any;
  
  // Normalized geometry
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    area: number;
  };
  
  // Normalized styling
  style: {
    backgroundColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    roundness?: number;
    fontSize?: number;
    opacity?: number;
  };
  
  // Content
  text?: string;
  
  // Transformation
  angle: number;
  
  // Grouping
  groupId?: string;
  zIndex: number;
}

interface ElementGroups {
  rectangles: NormalizedElement[];
  diamonds: NormalizedElement[];
  ellipses: NormalizedElement[];
  arrows: NormalizedElement[];
  lines: NormalizedElement[];
  text: NormalizedElement[];
  images: NormalizedElement[];
  other: NormalizedElement[];
}

function normalizeElements(elements: any[]): ElementGroups {
  const groups: ElementGroups = {
    rectangles: [],
    diamonds: [],
    ellipses: [],
    arrows: [],
    lines: [],
    text: [],
    images: [],
    other: []
  };

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const normalized = normalizeElement(element, i);
    
    // Group by type
    switch (element.type) {
      case 'rectangle':
        groups.rectangles.push(normalized);
        break;
      case 'diamond':
        groups.diamonds.push(normalized);
        break;
      case 'ellipse':
        groups.ellipses.push(normalized);
        break;
      case 'arrow':
        groups.arrows.push(normalized);
        break;
      case 'line':
        groups.lines.push(normalized);
        break;
      case 'text':
        groups.text.push(normalized);
        break;
      case 'image':
        groups.images.push(normalized);
        break;
      default:
        groups.other.push(normalized);
    }
  }

  return groups;
}

function normalizeElement(element: any, index: number): NormalizedElement {
  // Calculate accurate bounding box (handle rotation)
  const boundingBox = calculateBoundingBox(element);
  
  // Extract style properties
  const style = {
    backgroundColor: element.backgroundColor || 'transparent',
    strokeColor: element.strokeColor || '#000000',
    strokeWidth: element.strokeWidth || 1,
    roundness: element.roundness || 0,
    fontSize: element.fontSize || 16,
    opacity: element.opacity || 1
  };

  return {
    id: element.id,
    type: element.type,
    originalElement: element,
    boundingBox,
    style,
    text: element.text || undefined,
    angle: element.angle || 0,
    groupId: element.groupIds?.[0], // First group ID if multiple
    zIndex: index // Use array position as z-index
  };
}

function calculateBoundingBox(element: any) {
  let { x, y, width, height } = element;
  
  // Handle rotation if present
  if (element.angle && element.angle !== 0) {
    // For rotated elements, calculate the axis-aligned bounding box
    const cos = Math.cos(element.angle);
    const sin = Math.sin(element.angle);
    
    // Calculate rotated corner points
    const corners = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
    ];
    
    const rotatedCorners = corners.map(corner => ({
      x: corner.x * cos - corner.y * sin,
      y: corner.x * sin + corner.y * cos
    }));
    
    // Find the bounding box of rotated corners
    const minX = Math.min(...rotatedCorners.map(c => c.x));
    const maxX = Math.max(...rotatedCorners.map(c => c.x));
    const minY = Math.min(...rotatedCorners.map(c => c.y));
    const maxY = Math.max(...rotatedCorners.map(c => c.y));
    
    width = maxX - minX;
    height = maxY - minY;
    x = x + minX;
    y = y + minY;
  }
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const area = width * height;
  
  return { x, y, width, height, centerX, centerY, area };
}

// =============================================================================
// STAGE 2: CONTAINER DETECTION
// =============================================================================

interface ContainerHierarchy {
  containers: NormalizedElement[];
  containmentMap: Map<string, string[]>; // containerId -> [childIds]
  parentMap: Map<string, string>; // childId -> parentId
}

function detectContainers(groups: ElementGroups): ContainerHierarchy {
  // Potential containers: rectangles, ellipses above size threshold
  const sizeThreshold = 5000; // 5000 square pixels
  
  const potentialContainers = [
    ...groups.rectangles.filter(el => el.boundingBox.area > sizeThreshold),
    ...groups.ellipses.filter(el => el.boundingBox.area > sizeThreshold)
  ];
  
  // Sort by z-index (later elements are on top)
  potentialContainers.sort((a, b) => a.zIndex - b.zIndex);
  
  // All elements that could be contained
  const allElements = [
    ...groups.rectangles,
    ...groups.diamonds,
    ...groups.ellipses,
    ...groups.text,
    ...groups.images,
    ...groups.other
  ];
  
  const containmentMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  
  // For each potential container, find what it contains
  for (const container of potentialContainers) {
    const contained: string[] = [];
    
    for (const element of allElements) {
      if (element.id === container.id) continue; // Skip self
      if (parentMap.has(element.id)) continue; // Already has a parent
      
      if (isContained(element, container)) {
        contained.push(element.id);
        parentMap.set(element.id, container.id);
      }
    }
    
    if (contained.length > 0) {
      containmentMap.set(container.id, contained);
    }
  }
  
  // Handle native Excalidraw groups
  const groupedElements = allElements.filter(el => el.groupId);
  const groups_by_id = new Map<string, NormalizedElement[]>();
  
  for (const element of groupedElements) {
    if (!element.groupId) continue;
    
    if (!groups_by_id.has(element.groupId)) {
      groups_by_id.set(element.groupId, []);
    }
    groups_by_id.get(element.groupId)!.push(element);
  }
  
  // Treat each native group as a container
  groups_by_id.forEach((groupElements, groupId) => {
    const groupElementIds = groupElements.map((el: NormalizedElement) => el.id);
    containmentMap.set(`group-${groupId}`, groupElementIds);
    
    for (const elementId of groupElementIds) {
      parentMap.set(elementId, `group-${groupId}`);
    }
  });
  
  return {
    containers: potentialContainers,
    containmentMap,
    parentMap
  };
}

function isContained(element: NormalizedElement, container: NormalizedElement): boolean {
  // Method 1: Center point containment
  const centerInside = 
    element.boundingBox.centerX >= container.boundingBox.x &&
    element.boundingBox.centerX <= container.boundingBox.x + container.boundingBox.width &&
    element.boundingBox.centerY >= container.boundingBox.y &&
    element.boundingBox.centerY <= container.boundingBox.y + container.boundingBox.height;
  
  if (centerInside) return true;
  
  // Method 2: Area overlap >50%
  const overlap = calculateOverlap(element.boundingBox, container.boundingBox);
  const overlapRatio = overlap / element.boundingBox.area;
  
  return overlapRatio > 0.5;
}

function calculateOverlap(box1: any, box2: any): number {
  const left = Math.max(box1.x, box2.x);
  const right = Math.min(box1.x + box1.width, box2.x + box2.width);
  const top = Math.max(box1.y, box2.y);
  const bottom = Math.min(box1.y + box1.height, box2.y + box2.height);
  
  if (left >= right || top >= bottom) return 0;
  
  return (right - left) * (bottom - top);
}

// =============================================================================
// STAGE 3: TEXT ATTACHMENT
// =============================================================================

interface TextAttachment {
  textId: string;
  attachedTo: string | null; // Element ID or null for standalone
  attachmentType: 'title' | 'body' | 'annotation' | 'standalone';
  confidence: number;
}

function attachText(
  textElements: NormalizedElement[],
  allElements: NormalizedElement[],
  hierarchy: ContainerHierarchy
): TextAttachment[] {
  const attachments: TextAttachment[] = [];
  
  for (const textElement of textElements) {
    const attachment = findTextAttachment(textElement, allElements, hierarchy);
    attachments.push(attachment);
  }
  
  return attachments;
}

function findTextAttachment(
  textElement: NormalizedElement,
  allElements: NormalizedElement[],
  hierarchy: ContainerHierarchy
): TextAttachment {
  // Check if text is inside any container
  const parentId = hierarchy.parentMap.get(textElement.id);
  
  if (parentId) {
    // Text inside container
    const container = allElements.find(el => el.id === parentId);
    if (container) {
      // Determine if title or body based on position
      const isTitle = isTextTitle(textElement, container, hierarchy);
      return {
        textId: textElement.id,
        attachedTo: parentId,
        attachmentType: isTitle ? 'title' : 'body',
        confidence: 0.9
      };
    }
  }
  
  // Check if text is just above any shape (title text)
  const titleThreshold = 20; // pixels
  
  for (const element of allElements) {
    if (element.id === textElement.id) continue;
    if (element.type === 'text') continue;
    
    const distanceAbove = element.boundingBox.y - (textElement.boundingBox.y + textElement.boundingBox.height);
    const horizontalOverlap = calculateHorizontalOverlap(textElement.boundingBox, element.boundingBox);
    
    if (distanceAbove > 0 && distanceAbove <= titleThreshold && horizontalOverlap > 0.5) {
      return {
        textId: textElement.id,
        attachedTo: element.id,
        attachmentType: 'title',
        confidence: 0.8
      };
    }
  }
  
  // Standalone text
  return {
    textId: textElement.id,
    attachedTo: null,
    attachmentType: 'standalone',
    confidence: 1.0
  };
}

function isTextTitle(
  textElement: NormalizedElement,
  container: NormalizedElement,
  hierarchy: ContainerHierarchy
): boolean {
  // Title text is typically:
  // 1. In the upper portion of the container
  // 2. Larger font size
  // 3. Only text element at the top
  
  const relativeY = (textElement.boundingBox.centerY - container.boundingBox.y) / container.boundingBox.height;
  const isInUpperPortion = relativeY < 0.3;
  
  const isLargerFont = (textElement.style.fontSize || 16) > 16;
  
  return isInUpperPortion || isLargerFont;
}

function calculateHorizontalOverlap(box1: any, box2: any): number {
  const left = Math.max(box1.x, box2.x);
  const right = Math.min(box1.x + box1.width, box2.x + box2.width);
  
  if (left >= right) return 0;
  
  const overlap = right - left;
  const minWidth = Math.min(box1.width, box2.width);
  
  return overlap / minWidth;
}

// =============================================================================
// STAGE 4: CONNECTOR ANALYSIS
// =============================================================================

interface Connector {
  elementId: string;
  startAttachment: ShapeAttachment | null;
  endAttachment: ShapeAttachment | null;
  direction: 'bidirectional' | 'start-to-end' | 'end-to-start';
  label?: string;
  confidence: number;
}

interface ShapeAttachment {
  shapeId: string;
  attachmentPoint: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  distance: number;
}

function analyzeConnectors(
  arrows: NormalizedElement[],
  lines: NormalizedElement[],
  allShapes: NormalizedElement[]
): Connector[] {
  const connectors: Connector[] = [];
  const snapThreshold = 15; // pixels
  
  // Analyze arrows
  for (const arrow of arrows) {
    const connector = analyzeArrowConnector(arrow, allShapes, snapThreshold);
    if (connector) {
      connectors.push(connector);
    }
  }
  
  // Analyze lines
  for (const line of lines) {
    const connector = analyzeLineConnector(line, allShapes, snapThreshold);
    if (connector) {
      connectors.push(connector);
    }
  }
  
  return connectors;
}

function analyzeArrowConnector(
  arrow: NormalizedElement,
  shapes: NormalizedElement[],
  threshold: number
): Connector | null {
  const startPoint = getArrowStartPoint(arrow);
  const endPoint = getArrowEndPoint(arrow);
  
  const startAttachment = findNearestShapeAttachment(startPoint, shapes, threshold, arrow.id);
  const endAttachment = findNearestShapeAttachment(endPoint, shapes, threshold, arrow.id);
  
  // Only consider it a connector if both ends attach to shapes
  if (!startAttachment || !endAttachment) {
    return null;
  }
  
  return {
    elementId: arrow.id,
    startAttachment,
    endAttachment,
    direction: 'start-to-end', // Arrows have direction
    label: extractConnectorLabel(arrow),
    confidence: 0.9
  };
}

function analyzeLineConnector(
  line: NormalizedElement,
  shapes: NormalizedElement[],
  threshold: number
): Connector | null {
  const startPoint = getLineStartPoint(line);
  const endPoint = getLineEndPoint(line);
  
  const startAttachment = findNearestShapeAttachment(startPoint, shapes, threshold, line.id);
  const endAttachment = findNearestShapeAttachment(endPoint, shapes, threshold, line.id);
  
  // Only consider it a connector if both ends attach to shapes
  if (!startAttachment || !endAttachment) {
    return null;
  }
  
  return {
    elementId: line.id,
    startAttachment,
    endAttachment,
    direction: 'bidirectional', // Lines are bidirectional
    label: extractConnectorLabel(line),
    confidence: 0.8
  };
}

function getArrowStartPoint(arrow: NormalizedElement): { x: number; y: number } {
  // For arrows, start point is typically the beginning of the arrow
  return {
    x: arrow.boundingBox.x,
    y: arrow.boundingBox.y + arrow.boundingBox.height / 2
  };
}

function getArrowEndPoint(arrow: NormalizedElement): { x: number; y: number } {
  // For arrows, end point is typically where the arrowhead is
  return {
    x: arrow.boundingBox.x + arrow.boundingBox.width,
    y: arrow.boundingBox.y + arrow.boundingBox.height / 2
  };
}

function getLineStartPoint(line: NormalizedElement): { x: number; y: number } {
  return {
    x: line.boundingBox.x,
    y: line.boundingBox.y
  };
}

function getLineEndPoint(line: NormalizedElement): { x: number; y: number } {
  return {
    x: line.boundingBox.x + line.boundingBox.width,
    y: line.boundingBox.y + line.boundingBox.height
  };
}

function findNearestShapeAttachment(
  point: { x: number; y: number },
  shapes: NormalizedElement[],
  threshold: number,
  excludeId: string
): ShapeAttachment | null {
  let closestAttachment: ShapeAttachment | null = null;
  let minDistance = threshold;
  
  for (const shape of shapes) {
    if (shape.id === excludeId) continue;
    if (shape.type === 'arrow' || shape.type === 'line') continue;
    
    const attachmentPoints = getShapeAttachmentPoints(shape);
    
    for (const [pointName, pointCoords] of Object.entries(attachmentPoints)) {
      const distance = Math.sqrt(
        Math.pow(point.x - pointCoords.x, 2) + 
        Math.pow(point.y - pointCoords.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestAttachment = {
          shapeId: shape.id,
          attachmentPoint: pointName as any,
          distance
        };
      }
    }
  }
  
  return closestAttachment;
}

function getShapeAttachmentPoints(shape: NormalizedElement): Record<string, { x: number; y: number }> {
  const { x, y, width, height, centerX, centerY } = shape.boundingBox;
  
  return {
    center: { x: centerX, y: centerY },
    top: { x: centerX, y },
    bottom: { x: centerX, y: y + height },
    left: { x, y: centerY },
    right: { x: x + width, y: centerY },
    'top-left': { x, y },
    'top-right': { x: x + width, y },
    'bottom-left': { x, y: y + height },
    'bottom-right': { x: x + width, y: y + height }
  };
}

function extractConnectorLabel(connector: NormalizedElement): string | undefined {
  // Look for text near the connector midpoint
  return connector.text || undefined;
}

// =============================================================================
// STAGE 5: PATTERN-BASED ROLE ASSIGNMENT
// =============================================================================

interface RoleAssignment {
  elementId: string;
  role: ComponentRole;
  confidence: number;
  reasoning: string[];
}

function assignRoles(
  groups: ElementGroups,
  hierarchy: ContainerHierarchy,
  textAttachments: TextAttachment[],
  connectors: Connector[]
): RoleAssignment[] {
  const assignments: RoleAssignment[] = [];
  
  // Process each element type
  assignments.push(...analyzeRectangles(groups.rectangles, hierarchy, textAttachments, connectors));
  assignments.push(...analyzeDiamonds(groups.diamonds));
  assignments.push(...analyzeEllipses(groups.ellipses));
  assignments.push(...analyzeTextElements(groups.text, textAttachments));
  assignments.push(...analyzeImages(groups.images));
  assignments.push(...analyzeConnectorRoles(connectors));
  
  return assignments;
}

// =============================================================================
// STAGE 6: WIDGET DETECTION AND ENHANCEMENT
// =============================================================================

interface WidgetDetection {
  elementId: string;
  isWidget: boolean;
  widgetType?: WidgetType;
  confidence: number;
  widgetMetadata?: WidgetMetadata;
  detectionMethod: 'metadata' | 'pattern' | 'none';
  reasoning: string[];
}

function detectWidgets(
  elements: NormalizedElement[],
  roleAssignments: RoleAssignment[]
): WidgetDetection[] {
  const detections: WidgetDetection[] = [];
  
  // Check both rectangles AND text elements for widget patterns
  const candidateElements = elements.filter(el => 
    el.type === 'rectangle' || el.type === 'text'
  );
  
  console.log(`🔍 WIDGET-DEBUG: Checking ${candidateElements.length} candidate elements (rectangles + text)`);
  
  for (const element of candidateElements) {
    const detection = detectWidgetFromElement(element, roleAssignments);
    detections.push(detection);
  }
  
  return detections;
}

function detectWidgetFromElement(
  element: NormalizedElement,
  roleAssignments: RoleAssignment[]
): WidgetDetection {
  // Check if element has text that might indicate a widget
  if (!element.text) {
    return {
      elementId: element.id,
      isWidget: false,
      confidence: 0,
      detectionMethod: 'none',
      reasoning: ['No text content to analyze']
    };
  }
  
  const text = element.text.trim();
  const detection = detectWidgetFromText(text);
  
  if (detection.isWidget && detection.type) {
    // Create widget metadata
    const widgetMetadata = createWidgetMetadata(element, detection.type, text);
    
    return {
      elementId: element.id,
      isWidget: true,
      widgetType: detection.type,
      confidence: detection.confidence,
      widgetMetadata,
      detectionMethod: 'pattern',
      reasoning: detection.reasoning
    };
  }
  
  return {
    elementId: element.id,
    isWidget: false,
    confidence: 0,
    detectionMethod: 'none',
    reasoning: ['No widget patterns matched']
  };
}

// Widget pattern detection (simplified version for worker)
function detectWidgetFromText(text: string): WidgetDetectionResult {
  console.log(`🔍 WIDGET-DEBUG: Checking text: "${text}"`);
  
  const patterns = [
    // Bracket patterns (highest confidence)
    { pattern: /\[MAP(?:\s*:\s*([^[\]]+))?\]/i, type: WidgetType.MAP, confidence: 0.95 },
    { pattern: /\[VIDEO(?:\s*:\s*([^[\]]+))?\]/i, type: WidgetType.VIDEO, confidence: 0.95 },
    { pattern: /\[IFRAME(?:\s*:\s*([^[\]]+))?\]/i, type: WidgetType.IFRAME, confidence: 0.9 },
    { pattern: /\[CHART(?:\s*:\s*([^[\]]+))?\]/i, type: WidgetType.CHART, confidence: 0.9 },
    { pattern: /\[CALENDAR(?:\s*:\s*([^[\]]+))?\]/i, type: WidgetType.CALENDAR, confidence: 0.9 },
    
    // Non-bracket patterns (without brackets - like your test case)
    { pattern: /^CHART\s*:\s*(.+)/i, type: WidgetType.CHART, confidence: 0.8 },
    { pattern: /^MAP\s*:\s*(.+)/i, type: WidgetType.MAP, confidence: 0.8 },
    { pattern: /^VIDEO\s*:\s*(.+)/i, type: WidgetType.VIDEO, confidence: 0.8 },
    { pattern: /^IFRAME\s*:\s*(.+)/i, type: WidgetType.IFRAME, confidence: 0.8 },
    { pattern: /^CALENDAR\s*:\s*(.+)/i, type: WidgetType.CALENDAR, confidence: 0.8 },
    
    // General keyword patterns (lower confidence)
    { pattern: /(?:map|google\s*maps?|location)/i, type: WidgetType.MAP, confidence: 0.7 },
    { pattern: /(?:youtube|vimeo|video)/i, type: WidgetType.VIDEO, confidence: 0.8 },
    { pattern: /(?:embed|iframe|website)/i, type: WidgetType.IFRAME, confidence: 0.7 },
    { pattern: /(?:chart|graph|plot|analytics)/i, type: WidgetType.CHART, confidence: 0.75 },
    { pattern: /(?:calendar|schedule|events?)/i, type: WidgetType.CALENDAR, confidence: 0.75 }
  ];
  
  for (const { pattern, type, confidence } of patterns) {
    if (pattern.test(text)) {
      console.log(`🎯 WIDGET-DEBUG: ✅ MATCH! "${text}" → ${type} (${confidence})`);
      return {
        isWidget: true,
        type,
        confidence,
        detectionMethod: 'pattern',
        reasoning: [`Matched pattern for ${type}`, `Confidence: ${(confidence * 100).toFixed(1)}%`]
      };
    }
  }
  
  console.log(`❌ WIDGET-DEBUG: No match for: "${text}"`);
  return {
    isWidget: false,
    confidence: 0,
    detectionMethod: 'none',
    reasoning: ['No widget patterns matched']
  };
}

function createWidgetMetadata(
  element: NormalizedElement,
  widgetType: WidgetType,
  text: string
): WidgetMetadata {
  const baseMetadata = {
    type: widgetType,
    elementId: element.id,
    title: extractTitleFromText(text),
    description: `Auto-detected ${widgetType} widget`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: '1.0.0'
  };
  
  // Generate default config based on widget type
  let config: any = {};
  
  switch (widgetType) {
    case WidgetType.MAP:
      config = {
        center: { latitude: 37.7749, longitude: -122.4194 },
        zoom: 10,
        mapStyle: 'roadmap',
        showControls: true,
        allowZoom: true,
        allowPan: true,
        markers: []
      };
      break;
      
    case WidgetType.VIDEO:
      config = {
        url: extractUrlFromText(text) || '',
        provider: 'unknown',
        autoplay: false,
        loop: false,
        muted: false,
        controls: true,
        aspectRatio: element.boundingBox.width / element.boundingBox.height
      };
      break;
      
    case WidgetType.IFRAME:
      config = {
        url: extractUrlFromText(text) || '',
        allowFullscreen: true,
        sandbox: ['allow-same-origin', 'allow-scripts']
      };
      break;
      
    case WidgetType.CHART:
      config = {
        chartType: 'line',
        data: null,
        options: {}
      };
      break;
      
    case WidgetType.CALENDAR:
      config = {
        defaultView: 'month',
        showWeekends: true,
        timeZone: 'UTC',
        events: []
      };
      break;
  }
  
  return {
    ...baseMetadata,
    config
  } as WidgetMetadata;
}

function extractTitleFromText(text: string): string {
  const cleaned = text.replace(/\[[^\]]*\]/g, '').trim();
  return cleaned.substring(0, 50) || 'Widget';
}

function extractUrlFromText(text: string): string | null {
  const urlPattern = /https?:\/\/[^\s\]]+/i;
  const match = text.match(urlPattern);
  return match ? match[0] : null;
}

function analyzeRectangles(
  rectangles: NormalizedElement[],
  hierarchy: ContainerHierarchy,
  textAttachments: TextAttachment[],
  connectors: Connector[]
): RoleAssignment[] {
  const assignments: RoleAssignment[] = [];
  
  for (const rect of rectangles) {
    const assignment = classifyRectangle(rect, hierarchy, textAttachments, connectors);
    assignments.push(assignment);
  }
  
  return assignments;
}

function classifyRectangle(
  rect: NormalizedElement,
  hierarchy: ContainerHierarchy,
  textAttachments: TextAttachment[],
  connectors: Connector[]
): RoleAssignment {
  const reasoning: string[] = [];
  let role = ComponentRole.UNKNOWN;
  let confidence = 0.0;
  
  // Get attached text
  const attachedText = textAttachments.filter(ta => ta.attachedTo === rect.id);
  const hasText = attachedText.length > 0;
  const text = hasText ? attachedText.map(ta => 
    textAttachments.find(t => t.textId === ta.textId)
  ).filter(Boolean).join(' ') : '';
  
  // Check if it's a container
  const isContainer = hierarchy.containmentMap.has(rect.id);
  const containedCount = isContainer ? hierarchy.containmentMap.get(rect.id)!.length : 0;
  
  // Check if it's in a flow (has connectors)
  const hasConnectors = connectors.some(c => 
    c.startAttachment?.shapeId === rect.id || c.endAttachment?.shapeId === rect.id
  );
  
  // Apply heuristic rules
  
  // Button: Rounded rectangle + short centered text
  if (rect.style.roundness && rect.style.roundness > 0.1 && hasText) {
    const textLength = text.length;
    const aspectRatio = rect.boundingBox.width / rect.boundingBox.height;
    
    if (textLength < 50 && aspectRatio > 1.5 && aspectRatio < 6) {
      role = ComponentRole.BUTTON;
      confidence = 0.9;
      reasoning.push('Rounded rectangle with short text');
      reasoning.push(`Aspect ratio ${aspectRatio.toFixed(1)} suitable for button`);
    }
  }
  
  // Card: Rectangle + title text + contained elements
  if (isContainer && containedCount > 1) {
    const hasTitle = attachedText.some(ta => ta.attachmentType === 'title');
    
    if (hasTitle || hasText) {
      role = ComponentRole.CARD;
      confidence = 0.7;
      reasoning.push(`Contains ${containedCount} elements`);
      if (hasTitle) reasoning.push('Has title text');
    }
  }
  
  // Process Node: Rounded rectangle in a flow
  if (hasConnectors && rect.style.roundness && rect.style.roundness > 0.1) {
    role = ComponentRole.PROCESS_STEP;
    confidence = 0.8;
    reasoning.push('Rounded rectangle with connectors (flow element)');
  }
  
  // Database: Specific aspect ratio patterns
  const aspectRatio = rect.boundingBox.width / rect.boundingBox.height;
  if (aspectRatio > 0.8 && aspectRatio < 1.2 && rect.boundingBox.area > 10000) {
    // Square-ish and large could be database
    if (text.toLowerCase().includes('database') || text.toLowerCase().includes('db')) {
      role = ComponentRole.UNKNOWN; // We don't have DATABASE role defined
      confidence = 0.85;
      reasoning.push('Square aspect ratio with database keywords');
    }
  }
  
  // Container: Large rectangle containing multiple elements
  if (isContainer && containedCount > 0 && role === ComponentRole.UNKNOWN) {
    role = ComponentRole.CONTAINER;
    confidence = 0.8;
    reasoning.push(`Large container with ${containedCount} child elements`);
  }
  
  // Default to container for large rectangles
  if (role === ComponentRole.UNKNOWN && rect.boundingBox.area > 20000) {
    role = ComponentRole.CONTAINER;
    confidence = 0.6;
    reasoning.push('Large rectangle (default container)');
  }
  
  // If still unknown, classify as generic component
  if (role === ComponentRole.UNKNOWN) {
    role = ComponentRole.COMPONENT;
    confidence = 0.3;
    reasoning.push('Rectangle with unclear purpose');
  }
  
  return {
    elementId: rect.id,
    role,
    confidence,
    reasoning
  };
}

function analyzeDiamonds(diamonds: NormalizedElement[]): RoleAssignment[] {
  return diamonds.map(diamond => ({
    elementId: diamond.id,
    role: ComponentRole.DECISION_POINT,
    confidence: 0.95,
    reasoning: ['Diamond shape indicates decision point']
  }));
}

function analyzeEllipses(ellipses: NormalizedElement[]): RoleAssignment[] {
  return ellipses.map(ellipse => {
    const aspectRatio = ellipse.boundingBox.width / ellipse.boundingBox.height;
    
    // Nearly circular ellipses
    if (aspectRatio > 0.8 && aspectRatio < 1.2) {
      if (ellipse.boundingBox.area < 2000) {
        return {
          elementId: ellipse.id,
          role: ComponentRole.RADIO_BUTTON,
          confidence: 0.7,
          reasoning: ['Small circular shape']
        };
      } else {
        return {
          elementId: ellipse.id,
          role: ComponentRole.ICON,
          confidence: 0.6,
          reasoning: ['Medium circular shape']
        };
      }
    }
    
    return {
      elementId: ellipse.id,
      role: ComponentRole.COMPONENT,
      confidence: 0.5,
      reasoning: ['Elliptical shape with unclear purpose']
    };
  });
}

function analyzeTextElements(
  textElements: NormalizedElement[],
  textAttachments: TextAttachment[]
): RoleAssignment[] {
  return textElements.map(textEl => {
    const attachment = textAttachments.find(ta => ta.textId === textEl.id);
    
    if (attachment && attachment.attachmentType === 'title') {
      return {
        elementId: textEl.id,
        role: ComponentRole.TITLE,
        confidence: 0.9,
        reasoning: ['Text positioned as title']
      };
    }
    
    if (attachment && attachment.attachmentType === 'body') {
      return {
        elementId: textEl.id,
        role: ComponentRole.TEXT_BLOCK,
        confidence: 0.8,
        reasoning: ['Text within container (body text)']
      };
    }
    
    // Standalone text
    return {
      elementId: textEl.id,
      role: ComponentRole.TEXT_BLOCK,
      confidence: 1.0,
      reasoning: ['Standalone text element']
    };
  });
}

function analyzeImages(images: NormalizedElement[]): RoleAssignment[] {
  return images.map(image => ({
    elementId: image.id,
    role: ComponentRole.IMAGE_PLACEHOLDER,
    confidence: 1.0,
    reasoning: ['Image element']
  }));
}

function analyzeConnectorRoles(connectors: Connector[]): RoleAssignment[] {
  return connectors.map(connector => ({
    elementId: connector.elementId,
    role: ComponentRole.CONNECTOR,
    confidence: connector.confidence,
    reasoning: ['Line/arrow connecting shapes']
  }));
}

// =============================================================================
// WEBWORKER MESSAGE HANDLING
// =============================================================================

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
    const result = await runExtractionPipeline(request);
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

async function runExtractionPipeline(request: ExtractionRequest): Promise<ExtractionResult> {
  const { elements, viewport, options } = request;
  
  console.log(`🚀 WIDGET-DEBUG: Starting extraction pipeline with ${elements.length} elements`);
  
  // STAGE 1: Element Normalization
  const normalizedGroups = normalizeElements(elements);
  console.log('Stage 1 complete: Element normalization');
  
  // STAGE 2: Container Detection
  const hierarchy = detectContainers(normalizedGroups);
  console.log(`Stage 2 complete: Found ${hierarchy.containers.length} containers`);
  
  // STAGE 3: Text Attachment
  const textAttachments = attachText(
    normalizedGroups.text,
    [...normalizedGroups.rectangles, ...normalizedGroups.diamonds, ...normalizedGroups.ellipses],
    hierarchy
  );
  console.log(`Stage 3 complete: Attached ${textAttachments.length} text elements`);
  
  // STAGE 4: Connector Analysis
  const connectors = analyzeConnectors(
    normalizedGroups.arrows,
    normalizedGroups.lines,
    [...normalizedGroups.rectangles, ...normalizedGroups.diamonds, ...normalizedGroups.ellipses]
  );
  console.log(`Stage 4 complete: Found ${connectors.length} connectors`);
  
  // STAGE 5: Pattern-Based Role Assignment
  const roleAssignments = assignRoles(normalizedGroups, hierarchy, textAttachments, connectors);
  console.log(`Stage 5 complete: Assigned roles to ${roleAssignments.length} elements`);
  
  // STAGE 6: Widget Detection (if enabled)
  let widgetDetections: WidgetDetection[] = [];
  if (options.enableWidgetDetection !== false) {
    const allElements = [
      ...normalizedGroups.rectangles,
      ...normalizedGroups.diamonds,
      ...normalizedGroups.ellipses,
      ...normalizedGroups.text,
      ...normalizedGroups.images,
      ...normalizedGroups.other
    ];
    
    // Debug: Log all elements with text
    console.log(`🔍 WIDGET-DEBUG: Processing ${allElements.length} elements for widget detection:`);
    allElements.forEach(el => {
      if (el.text && (el.text.includes('CHART') || el.text.includes('MAP'))) {
        console.log(`🔍 WIDGET-DEBUG: Element ${el.id} (${el.type}): "${el.text}"`);
      }
    });
    
    widgetDetections = detectWidgets(allElements, roleAssignments);
    console.log(`🎯 WIDGET-DEBUG: Stage 6 complete: Found ${widgetDetections.filter(w => w.isWidget).length} widgets`);
    
    // Debug: Log widget detection results
    widgetDetections.forEach(wd => {
      if (wd.isWidget) {
        console.log(`🎯 WIDGET-DEBUG: Widget found: ${wd.elementId} → ${wd.widgetType} (${wd.confidence})`);
      }
    });
  }
  
  // Convert to SemanticComponent format
  const components = convertToSemanticComponents(
    roleAssignments,
    normalizedGroups,
    hierarchy,
    textAttachments,
    connectors,
    widgetDetections
  );
  
  // Filter by confidence
  const filteredComponents = components.filter(comp => comp.confidence >= options.minConfidence);
  
  console.log(`Pipeline complete: ${filteredComponents.length} components after filtering`);
  
  return {
    components: filteredComponents,
    summary: {
      totalComponents: filteredComponents.length,
      componentBreakdown: {} as any, // Will be calculated
      relationshipBreakdown: {} as any, // Will be calculated
      averageConfidence: filteredComponents.reduce((sum, c) => sum + c.confidence, 0) / filteredComponents.length,
      highConfidenceComponents: filteredComponents.filter(c => c.confidence > 0.8).length,
      mediumConfidenceComponents: filteredComponents.filter(c => c.confidence > 0.5 && c.confidence <= 0.8).length,
      lowConfidenceComponents: filteredComponents.filter(c => c.confidence <= 0.5).length
    },
    tokenOptimization: {
      originalTokenCount: elements.length * 50, // Rough estimate
      optimizedTokenCount: filteredComponents.length * 30, // Rough estimate
      reductionPercentage: 40, // Will be calculated properly
      compressionRatio: 1.67 // Will be calculated properly
    },
    timestamp: Date.now(),
    processingTime: 0 // Will be set by caller
  };
}

function convertToSemanticComponents(
  roleAssignments: RoleAssignment[],
  groups: ElementGroups,
  hierarchy: ContainerHierarchy,
  textAttachments: TextAttachment[],
  connectors: Connector[],
  widgetDetections: WidgetDetection[] = []
): SemanticComponent[] {
  const components: SemanticComponent[] = [];
  
  for (const assignment of roleAssignments) {
    const element = findElementById(assignment.elementId, groups);
    if (!element) continue;
    
    // Check if this element is a widget
    const widgetDetection = widgetDetections.find(w => w.elementId === assignment.elementId);
    
    // Debug logging for widget detection
    if (element.text && (element.text.includes('CHART') || element.text.includes('MAP'))) {
      console.log(`[Widget Debug] Element ${assignment.elementId}:`);
      console.log(`  Text: "${element.text}"`);
      console.log(`  Original role: ${assignment.role}`);
      console.log(`  Widget detection found: ${!!widgetDetection}`);
      if (widgetDetection) {
        console.log(`  Is widget: ${widgetDetection.isWidget}`);
        console.log(`  Widget type: ${widgetDetection.widgetType}`);
        console.log(`  Widget confidence: ${widgetDetection.confidence}`);
      }
    }
    
    // Override role if it's a widget
    const finalRole = widgetDetection?.isWidget ? ComponentRole.WIDGET : assignment.role;
    
    // Continue debug logging
    if (element.text && (element.text.includes('CHART') || element.text.includes('MAP'))) {
      console.log(`  Final role: ${finalRole}`);
      console.log(`  Final role === 'widget': ${finalRole === 'widget'}`);
      console.log('---');
    }
    
    const component: SemanticComponent = {
      id: assignment.elementId,
      elementIds: [assignment.elementId],
      role: finalRole,
      relationships: [], // Will be populated
      confidence: assignment.confidence,
      boundingBox: element.boundingBox,
      metadata: createComponentMetadata(element, assignment, textAttachments, widgetDetection)
    };
    
    components.push(component);
  }
  
  return components;
}

function findElementById(id: string, groups: ElementGroups): NormalizedElement | null {
  const allElements = [
    ...groups.rectangles,
    ...groups.diamonds,
    ...groups.ellipses,
    ...groups.arrows,
    ...groups.lines,
    ...groups.text,
    ...groups.images,
    ...groups.other
  ];
  
  return allElements.find(el => el.id === id) || null;
}

function createComponentMetadata(
  element: NormalizedElement,
  assignment: RoleAssignment,
  textAttachments: TextAttachment[],
  widgetDetection?: WidgetDetection
): ComponentMetadata {
  const attachedText = textAttachments.find(ta => ta.attachedTo === element.id);
  
  return {
    visualProperties: {
      hasText: !!element.text || !!attachedText,
      textContent: element.text || undefined,
      hasShape: element.type !== 'text',
      shapeType: element.type,
      size: element.boundingBox.area > 50000 ? 'large' : 
            element.boundingBox.area > 10000 ? 'medium' : 'small'
    },
    interactionPattern: {
      isClickable: assignment.role === ComponentRole.BUTTON,
      isInputField: assignment.role === ComponentRole.INPUT_FIELD,
      hasStates: assignment.role === ComponentRole.CHECKBOX || assignment.role === ComponentRole.TOGGLE,
      stateCount: assignment.role === ComponentRole.CHECKBOX || assignment.role === ComponentRole.TOGGLE ? 2 : undefined
    },
    layoutContext: {
      position: 'isolated', // Will be enhanced
      alignment: 'left', // Will be enhanced
      spacing: 'normal' // Will be enhanced
    },
    semanticHints: assignment.reasoning,
    analysisMetadata: {
      extractionMethod: 'pattern_matching',
      processingTime: 0,
      version: '2.0.0'
    },
    
    // Add widget metadata if this is a widget
    widgetMetadata: widgetDetection?.isWidget ? {
      widgetType: widgetDetection.widgetType!,
      confidence: widgetDetection.confidence,
      detectionMethod: widgetDetection.detectionMethod,
      config: widgetDetection.widgetMetadata?.config
    } : undefined
  };
}

// Export for testing
export {
  normalizeElements,
  detectContainers,
  attachText,
  analyzeConnectors,
  assignRoles,
  runExtractionPipeline
};