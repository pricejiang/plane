// Phase 3: GPT-4o Semantic Enhancement System
// Intelligent semantic understanding, compression, and relationship detection

import OpenAI from 'openai';
import { SemanticComponent, ComponentRole, RelationshipType, ExtractionResult } from '@/types/extraction';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

export interface GPTEnhancementOptions {
  enableRelationshipDetection: boolean;
  enableRoleRefinement: boolean;
  enableNameGeneration: boolean;
  enableCompression: boolean;
  maxComponentsPerBatch: number;
  compressionTarget: number; // Target reduction percentage (e.g., 70)
}

export interface GPTEnhancementResult {
  enhancedComponents: SemanticComponent[];
  relationships: ComponentRelationship[];
  compressionAchieved: number;
  humanReadableNames: Map<string, string>;
  processingTime: number;
  tokensSaved: number;
}

interface ComponentRelationship {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  type: RelationshipType;
  confidence: number;
  description: string;
}

interface ComponentBatch {
  components: SemanticComponent[];
  batchId: string;
  totalTokens: number;
}

/**
 * Main GPT-4o enhancement pipeline
 */
export async function enhanceWithGPT(
  components: SemanticComponent[],
  options: GPTEnhancementOptions
): Promise<GPTEnhancementResult> {
  const startTime = performance.now();
  
  console.log(`🧠 GPT Enhancement: Processing ${components.length} components`);
  
  // Step 1: Intelligent batching to reduce API calls
  const batches = createIntelligentBatches(components, options.maxComponentsPerBatch);
  console.log(`📦 Created ${batches.length} intelligent batches`);
  
  // Step 2: Process each batch with GPT-4o
  const enhancedComponents: SemanticComponent[] = [];
  const allRelationships: ComponentRelationship[] = [];
  const humanReadableNames = new Map<string, string>();
  let totalTokensSaved = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.components.length} components)`);
    
    try {
      const batchResult = await processBatchWithGPT(batch, options);
      
      enhancedComponents.push(...batchResult.enhancedComponents);
      allRelationships.push(...batchResult.relationships);
      
      // Merge human readable names
      batchResult.humanReadableNames.forEach((name, id) => {
        humanReadableNames.set(id, name);
      });
      
      totalTokensSaved += batchResult.tokensSaved;
      
      // Minimal delay between batches (reduce from 100ms)
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
    } catch (error) {
      console.error(`❌ Batch ${i + 1} failed:`, error);
      // Fallback: include original components
      enhancedComponents.push(...batch.components);
    }
  }
  
  // Step 3: Global relationship analysis (if enabled)
  let globalRelationships: ComponentRelationship[] = [];
  if (options.enableRelationshipDetection && enhancedComponents.length > 1) {
    try {
      globalRelationships = await detectGlobalRelationships(enhancedComponents);
      console.log(`🔗 Detected ${globalRelationships.length} global relationships`);
    } catch (error) {
      console.error('❌ Global relationship detection failed:', error);
    }
  }
  
  // Merge all relationships
  const allFinalRelationships = [...allRelationships, ...globalRelationships];
  
  // Step 4: Calculate compression metrics
  const compressionAchieved = calculateCompressionAchieved(components, enhancedComponents);
  
  const processingTime = performance.now() - startTime;
  
  console.log(`✅ GPT Enhancement completed: ${compressionAchieved.toFixed(1)}% compression in ${processingTime.toFixed(0)}ms`);
  
  return {
    enhancedComponents,
    relationships: allFinalRelationships,
    compressionAchieved,
    humanReadableNames,
    processingTime,
    tokensSaved: totalTokensSaved
  };
}

/**
 * Create intelligent batches that group related components together
 */
function createIntelligentBatches(
  components: SemanticComponent[],
  maxPerBatch: number
): ComponentBatch[] {
  const batches: ComponentBatch[] = [];
  
  // Group components by spatial proximity and type similarity
  const spatialGroups = groupComponentsSpatially(components);
  
  for (const group of spatialGroups) {
    // Further subdivide large groups
    while (group.length > 0) {
      const batchComponents = group.splice(0, maxPerBatch);
      const tokenEstimate = estimateBatchTokens(batchComponents);
      
      batches.push({
        components: batchComponents,
        batchId: `batch-${batches.length + 1}`,
        totalTokens: tokenEstimate
      });
    }
  }
  
  return batches;
}

/**
 * Group components by spatial proximity for better context
 */
function groupComponentsSpatially(components: SemanticComponent[]): SemanticComponent[][] {
  const groups: SemanticComponent[][] = [];
  const processed = new Set<string>();
  
  for (const component of components) {
    if (processed.has(component.id)) continue;
    
    const group = [component];
    processed.add(component.id);
    
    // Find nearby components within reasonable distance
    const proximityThreshold = 200; // pixels
    
    for (const other of components) {
      if (processed.has(other.id)) continue;
      
      const distance = calculateDistance(
        component.boundingBox,
        other.boundingBox
      );
      
      if (distance <= proximityThreshold) {
        group.push(other);
        processed.add(other.id);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

function calculateDistance(box1: any, box2: any): number {
  const centerX1 = box1.x + box1.width / 2;
  const centerY1 = box1.y + box1.height / 2;
  const centerX2 = box2.x + box2.width / 2;
  const centerY2 = box2.y + box2.height / 2;
  
  return Math.sqrt(
    Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2)
  );
}

function estimateBatchTokens(components: SemanticComponent[]): number {
  // Rough estimation: base tokens + tokens per component
  return 200 + (components.length * 100);
}

/**
 * Process a batch of components with GPT-4o
 */
async function processBatchWithGPT(
  batch: ComponentBatch,
  options: GPTEnhancementOptions
): Promise<{
  enhancedComponents: SemanticComponent[];
  relationships: ComponentRelationship[];
  humanReadableNames: Map<string, string>;
  tokensSaved: number;
}> {
  
  // Create concise input for GPT
  const componentSummaries = batch.components.map(comp => ({
    id: comp.id,
    role: comp.role,
    position: `${comp.boundingBox.x},${comp.boundingBox.y}`,
    size: `${comp.boundingBox.width}x${comp.boundingBox.height}`,
    text: comp.metadata.visualProperties.textContent || '',
    confidence: comp.confidence
  }));
  
  const prompt = createEnhancementPrompt(componentSummaries, options);
  
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('GPT API timeout')), 10000) // 10 second timeout
    );
    
    const apiPromise = openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini for cost efficiency
      messages: [
        {
          role: "system",
          content: "You are an expert UI/UX analyzer. Provide concise, structured responses in JSON format only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    const response = await Promise.race([apiPromise, timeoutPromise]) as any;
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    return processBatchResponse(result, batch.components);
    
  } catch (error) {
    console.error('GPT API error:', error);
    throw error;
  }
}

/**
 * Create enhancement prompt for GPT
 */
function createEnhancementPrompt(
  components: any[],
  options: GPTEnhancementOptions
): string {
  return `
Analyze these UI components and provide enhanced semantic understanding:

Components: ${JSON.stringify(components, null, 2)}

Please provide a JSON response with:
1. Enhanced role assignments (more specific than current roles)
2. Human-readable names for each component 
3. Relationships between components
4. Compression opportunities

Requirements:
- Keep descriptions under 20 words each
- Focus on semantic meaning over visual details
- Identify functional relationships
- Provide concise but meaningful names

Response format:
{
  "enhancedComponents": [
    {
      "id": "component-id",
      "enhancedRole": "specific_role_name",
      "humanName": "Short meaningful name",
      "description": "Brief semantic description",
      "importance": 0.8
    }
  ],
  "relationships": [
    {
      "source": "comp1",
      "target": "comp2", 
      "type": "contains|triggers|validates|etc",
      "description": "Brief relationship description"
    }
  ]
}
`.trim();
}

/**
 * Process GPT response and enhance components
 */
function processBatchResponse(
  gptResult: any,
  originalComponents: SemanticComponent[]
): {
  enhancedComponents: SemanticComponent[];
  relationships: ComponentRelationship[];
  humanReadableNames: Map<string, string>;
  tokensSaved: number;
} {
  const enhancedComponents: SemanticComponent[] = [];
  const relationships: ComponentRelationship[] = [];
  const humanReadableNames = new Map<string, string>();
  
  // Process enhanced components
  for (const original of originalComponents) {
    const enhanced = gptResult.enhancedComponents?.find((e: any) => e.id === original.id);
    
    if (enhanced) {
      // Create enhanced version with compressed metadata
      const enhancedComponent: SemanticComponent = {
        ...original,
        role: mapEnhancedRole(enhanced.enhancedRole) || original.role,
        confidence: Math.max(original.confidence, enhanced.importance || 0),
        metadata: {
          ...original.metadata,
          // Compress semantic hints to just the essential description
          semanticHints: enhanced.description ? [enhanced.description] : original.metadata.semanticHints.slice(0, 1),
          analysisMetadata: {
            ...original.metadata.analysisMetadata,
            extractionMethod: 'ml_classification',
            version: '3.0.0'
          }
        }
      };
      
      enhancedComponents.push(enhancedComponent);
      
      if (enhanced.humanName) {
        humanReadableNames.set(original.id, enhanced.humanName);
      }
    } else {
      // Fallback: compress original component
      enhancedComponents.push({
        ...original,
        metadata: {
          ...original.metadata,
          semanticHints: original.metadata.semanticHints.slice(0, 1) // Keep only most important hint
        }
      });
    }
  }
  
  // Process relationships
  if (gptResult.relationships) {
    for (const rel of gptResult.relationships) {
      relationships.push({
        id: `rel-${rel.source}-${rel.target}`,
        sourceComponentId: rel.source,
        targetComponentId: rel.target,
        type: mapRelationshipType(rel.type) || RelationshipType.ADJACENT_TO,
        confidence: 0.8,
        description: rel.description || ''
      });
    }
  }
  
  // Estimate tokens saved through compression
  const tokensSaved = estimateTokensSaved(originalComponents, enhancedComponents);
  
  return {
    enhancedComponents,
    relationships,
    humanReadableNames,
    tokensSaved
  };
}

/**
 * Map GPT role names to our ComponentRole enum
 */
function mapEnhancedRole(gptRole: string): ComponentRole | null {
  const roleMapping: Record<string, ComponentRole> = {
    'button': ComponentRole.BUTTON,
    'input': ComponentRole.INPUT_FIELD,
    'input_field': ComponentRole.INPUT_FIELD,
    'text_input': ComponentRole.INPUT_FIELD,
    'dropdown': ComponentRole.DROPDOWN,
    'select': ComponentRole.DROPDOWN,
    'checkbox': ComponentRole.CHECKBOX,
    'radio': ComponentRole.RADIO_BUTTON,
    'toggle': ComponentRole.TOGGLE,
    'switch': ComponentRole.TOGGLE,
    'card': ComponentRole.CARD,
    'container': ComponentRole.CONTAINER,
    'modal': ComponentRole.MODAL,
    'dialog': ComponentRole.MODAL,
    'sidebar': ComponentRole.SIDEBAR,
    'header': ComponentRole.HEADER,
    'navigation': ComponentRole.NAVIGATION_BAR,
    'nav': ComponentRole.NAVIGATION_BAR,
    'title': ComponentRole.TITLE,
    'heading': ComponentRole.TITLE,
    'text': ComponentRole.TEXT_BLOCK,
    'label': ComponentRole.LABEL,
    'icon': ComponentRole.ICON,
    'image': ComponentRole.IMAGE_PLACEHOLDER,
    'chart': ComponentRole.CHART,
    'graph': ComponentRole.CHART,
    'table': ComponentRole.TABLE,
    'list': ComponentRole.LIST,
    'menu': ComponentRole.MENU,
    'widget': ComponentRole.WIDGET,
    'decision': ComponentRole.DECISION_POINT,
    'process': ComponentRole.PROCESS_STEP,
    'step': ComponentRole.PROCESS_STEP
  };
  
  const normalized = gptRole.toLowerCase().replace(/[_\s-]+/g, '_');
  return roleMapping[normalized] || null;
}

/**
 * Map GPT relationship types to our enum
 */
function mapRelationshipType(gptType: string): RelationshipType | null {
  const relationshipMapping: Record<string, RelationshipType> = {
    'contains': RelationshipType.CONTAINS,
    'contained_by': RelationshipType.CONTAINED_BY,
    'triggers': RelationshipType.TRIGGERS,
    'validates': RelationshipType.VALIDATES,
    'links_to': RelationshipType.LINKS_TO,
    'flows_to': RelationshipType.FLOWS_TO,
    'above': RelationshipType.ABOVE,
    'below': RelationshipType.BELOW,
    'left_of': RelationshipType.LEFT_OF,
    'right_of': RelationshipType.RIGHT_OF,
    'adjacent': RelationshipType.ADJACENT_TO,
    'aligned': RelationshipType.ALIGNED_WITH,
    'populates': RelationshipType.POPULATES,
    'filters': RelationshipType.FILTERS
  };
  
  const normalized = gptType.toLowerCase().replace(/[_\s-]+/g, '_');
  return relationshipMapping[normalized] || null;
}

/**
 * Detect global relationships between components
 */
async function detectGlobalRelationships(
  components: SemanticComponent[]
): Promise<ComponentRelationship[]> {
  if (components.length < 2) return [];
  
  // Create a simplified view for global analysis
  const componentSummary = components.map(comp => ({
    id: comp.id,
    role: comp.role,
    name: comp.metadata.visualProperties.textContent || `${comp.role}_${comp.id.slice(-4)}`,
    x: comp.boundingBox.x,
    y: comp.boundingBox.y,
    width: comp.boundingBox.width,
    height: comp.boundingBox.height
  }));
  
  const prompt = `
Analyze spatial and functional relationships between these UI components:
${JSON.stringify(componentSummary, null, 2)}

Identify key relationships like:
- Layout relationships (above, below, contains)
- Functional relationships (button triggers form, input validates against field)
- Data flow relationships (form populates table, filter affects list)

Provide JSON response:
{
  "relationships": [
    {
      "source": "comp1",
      "target": "comp2",
      "type": "contains|triggers|validates|above|below|etc",
      "confidence": 0.8,
      "description": "Brief explanation"
    }
  ]
}

Focus on the most important relationships only (max 5).
  `.trim();
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system", 
          content: "You are a UI relationship analyst. Provide concise JSON responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return (result.relationships || []).map((rel: any, index: number) => ({
      id: `global-rel-${index}`,
      sourceComponentId: rel.source,
      targetComponentId: rel.target,
      type: mapRelationshipType(rel.type) || RelationshipType.ADJACENT_TO,
      confidence: rel.confidence || 0.7,
      description: rel.description || ''
    }));
    
  } catch (error) {
    console.error('Global relationship detection failed:', error);
    return [];
  }
}

/**
 * Calculate compression achieved
 */
function calculateCompressionAchieved(
  original: SemanticComponent[],
  enhanced: SemanticComponent[]
): number {
  const originalTokens = estimateComponentTokens(original);
  const enhancedTokens = estimateComponentTokens(enhanced);
  
  if (originalTokens === 0) return 0;
  
  return ((originalTokens - enhancedTokens) / originalTokens) * 100;
}

function estimateComponentTokens(components: SemanticComponent[]): number {
  return components.reduce((total, comp) => {
    // More accurate token estimation based on actual content
    const baseTokens = 20; // Base overhead per component
    const roleTokens = 3; // Role name
    const boundsTokens = 8; // Bounding box coords
    const hintsTokens = comp.metadata.semanticHints.reduce((sum, hint) => sum + Math.ceil(hint.length / 4), 0);
    const textTokens = comp.metadata.visualProperties.textContent ? Math.ceil(comp.metadata.visualProperties.textContent.length / 4) : 0;
    
    return total + baseTokens + roleTokens + boundsTokens + hintsTokens + textTokens;
  }, 0);
}

function estimateTokensSaved(
  original: SemanticComponent[],
  enhanced: SemanticComponent[]
): number {
  return estimateComponentTokens(original) - estimateComponentTokens(enhanced);
}

/**
 * Create default GPT enhancement options
 */
export function createDefaultGPTOptions(): GPTEnhancementOptions {
  return {
    enableRelationshipDetection: true,
    enableRoleRefinement: true,
    enableNameGeneration: true,
    enableCompression: true,
    maxComponentsPerBatch: 8,
    compressionTarget: 70
  };
}

export function createFastGPTOptions(): GPTEnhancementOptions {
  return {
    enableRelationshipDetection: false, // Skip for speed
    enableRoleRefinement: true,
    enableNameGeneration: true,
    enableCompression: true,
    maxComponentsPerBatch: 12, // Larger batches for efficiency
    compressionTarget: 70
  };
}