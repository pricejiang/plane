// Excalidraw types
export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  textAlign?: string;
  verticalAlign?: string;
}

// Import AppState from Excalidraw
import type { AppState } from "@excalidraw/excalidraw/types";

// Viewport calculation types
export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

// Scene state management  
export interface SceneState {
  elements: ExcalidrawElement[];
  appState: AppState;
  viewport: ViewportBounds;
  lastUpdate: number;
}

// Semantic analysis types
export interface SemanticLabel {
  id: string;
  elementId: string;
  label: string;
  confidence: number;
  category: 'widget' | 'text' | 'shape' | 'diagram' | 'unknown';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnalysisResult {
  labels: SemanticLabel[];
  summary: string;
  timestamp: number;
}

// LLM types
export interface LLMRequest {
  prompt: string;
  imageData?: string;
  elements?: ExcalidrawElement[];
}

export interface LLMResponse {
  analysis: AnalysisResult;
  error?: string;
}

// Component props (OverlayProps replaced by OverlayLayerProps in OverlayLayer.tsx)

export interface ViewTransform {
  zoom: number;
  scrollX: number;
  scrollY: number;
}

export interface ControlPanelProps {
  onScan: () => void;
  isScanning: boolean;
  results?: AnalysisResult;
  onClear?: () => void;
  tokenAnalysis?: {
    originalTokens: number;
    optimizedTokens: number;
    reduction: number;
  };
}

// Re-export extraction types for convenience
export * from './extraction';