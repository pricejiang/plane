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

export interface AppState {
  viewBackgroundColor: string;
  gridSize: number;
  zoom: {
    value: number;
  };
  scrollX: number;
  scrollY: number;
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

// Component props
export interface OverlayProps {
  labels: SemanticLabel[];
  viewTransform: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  onLabelClick?: (label: SemanticLabel) => void;
}

export interface ControlPanelProps {
  onScan: () => void;
  isScanning: boolean;
  results?: AnalysisResult;
  onClear?: () => void;
}