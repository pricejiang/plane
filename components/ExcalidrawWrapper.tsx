"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import OverlayLayer from "./OverlayLayer";
import SimpleTestOverlay from "./SimpleTestOverlay";
import ControlPanel from "./ControlPanel";
import { 
  SemanticLabel, 
  AnalysisResult, 
  ViewportBounds,
  SceneState 
} from "@/types";
import { extractForOverlay, getExtractionWorkerManager } from "@/lib/extractionWorkerManager";
import { analyzeTokenUsage } from "@/lib/tokenAnalyzer";

import type { ExcalidrawImperativeAPI, AppState } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  }
);

export default function ExcalidrawWrapper() {
  // UI state
  const [labels, setLabels] = useState<SemanticLabel[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | undefined>();
  const [tokenAnalysis, setTokenAnalysis] = useState<{
    originalTokens: number;
    optimizedTokens: number;
    reduction: number;
  } | undefined>();
  
  // Scene state - use proper default values from Excalidraw
  const [sceneState, setSceneState] = useState<SceneState>({
    elements: [],
    appState: {
      zoom: { value: 1 }, // Will be replaced by actual Excalidraw state
      scrollX: 0,
      scrollY: 0,
    } as AppState,
    viewport: {
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0,
      width: 0,
      height: 0,
    },
    lastUpdate: Date.now(),
  });
  
  // Ref to access Excalidraw API
  const excalidrawRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Throttled update function
  const throttledUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate viewport bounds based on scroll position and zoom level
  const calculateViewportBounds = useCallback((appState: AppState): ViewportBounds => {
    const container = containerRef.current;
    if (!container) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    
    const rect = container.getBoundingClientRect();
    const zoom = appState.zoom.value;
    const { scrollX, scrollY } = appState;
    
    const width = rect.width / zoom;
    const height = rect.height / zoom;
    const minX = -scrollX;
    const minY = -scrollY;
    const maxX = minX + width;
    const maxY = minY + height;
    
    return { minX, minY, maxX, maxY, width, height };
  }, []);

  // Get scene elements
  const getSceneElements = useCallback(() => {
    if (!excalidrawRef.current) {
      console.warn("Excalidraw API not available yet");
      return [];
    }
    return excalidrawRef.current.getSceneElements();
  }, []);

  // Get app state
  const getAppState = useCallback((): AppState => {
    if (!excalidrawRef.current) {
      console.warn("Excalidraw API not available yet");
      return sceneState.appState;
    }
    return excalidrawRef.current.getAppState();
  }, [sceneState.appState]);

  // Fast overlay transform updates (60fps)
  const updateOverlayTransform = useCallback(() => {
    if (!excalidrawRef.current) return;
    
    // Use requestAnimationFrame for optimal browser rendering
    requestAnimationFrame(() => {
      if (!excalidrawRef.current) return;
      
      const appState = getAppState();
      
      // Update only the transform part immediately for smooth overlay
      setSceneState(prev => ({
        ...prev,
        appState: {
          ...prev.appState,
          zoom: appState.zoom,
          scrollX: appState.scrollX,
          scrollY: appState.scrollY,
        },
        lastUpdate: Date.now(),
      }));
    });
  }, [getAppState]);

  // Heavy state updates with throttling (for elements, analysis, etc.)
  const updateSceneState = useCallback(() => {
    if (!excalidrawRef.current) return;
    
    // Clear existing throttle
    if (throttledUpdateRef.current) {
      clearTimeout(throttledUpdateRef.current);
    }
    
    // Throttle expensive updates only
    throttledUpdateRef.current = setTimeout(() => {
      const elements = getSceneElements();
      const appState = getAppState();
      const viewport = calculateViewportBounds(appState);
      
      setSceneState(prev => ({
        elements: [...elements], // Convert readonly to mutable array
        appState,
        viewport,
        lastUpdate: Date.now(),
      }));
    }, 100); // Keep throttle for expensive operations
  }, [getSceneElements, getAppState, calculateViewportBounds]);

  // Subscribe to changes
  const subscribeToChanges = useCallback(() => {
    // This will be called on every Excalidraw change
    
    // Immediately update overlay transform for smooth 60fps movement
    updateOverlayTransform();
    
    // Also trigger throttled heavy updates for elements, analysis, etc.
    updateSceneState();
  }, [updateOverlayTransform, updateSceneState]);


  // Handle Excalidraw initialization
  useEffect(() => {
    // Initial scene state update when component mounts
    const initTimer = setTimeout(() => {
      if (excalidrawRef.current) {
        console.log("Excalidraw API initialized successfully");
        updateOverlayTransform();
        updateSceneState();
      } else {
        console.warn("Excalidraw API not available after initialization timeout");
      }
    }, 1000); // Give Excalidraw time to initialize

    return () => {
      clearTimeout(initTimer);
      if (throttledUpdateRef.current) {
        clearTimeout(throttledUpdateRef.current);
      }
    };
  }, [updateOverlayTransform, updateSceneState]);

  const handleScan = async () => {
    console.log("handleScan called, current labels:", labels.length);
    setIsScanning(true);
    
    try {
      // Get current scene data
      const currentElements = getSceneElements();
      
      console.log("Scanning canvas with local extraction pipeline:", {
        elementsCount: currentElements.length,
        viewport: sceneState.viewport,
      });
      
      if (currentElements.length === 0) {
        console.log("No elements to analyze");
        setLabels([]);
        setResults({
          labels: [],
          summary: "No elements found on canvas",
          timestamp: Date.now(),
        });
        setIsScanning(false);
        return;
      }
      
      // Use local extraction pipeline (convert readonly array to mutable)
      const extractionResult = await extractForOverlay([...currentElements], sceneState.viewport);
      
      // Get full extraction result for token analysis
      const manager = getExtractionWorkerManager();
      const fullExtractionResult = await manager.extractThorough([...currentElements], sceneState.viewport);
      
      // Calculate token analysis
      const tokenAnalysisResult = analyzeTokenUsage([...currentElements], fullExtractionResult);
      
      const analysisResult: AnalysisResult = {
        labels: extractionResult.labels,
        summary: `Local extraction identified ${extractionResult.labels.length} semantic components with ${(extractionResult.confidence * 100).toFixed(1)}% average confidence. Token reduction: ${tokenAnalysisResult.reduction.percentage.toFixed(1)}%`,
        timestamp: Date.now(),
      };
      
      console.log("Local extraction completed:", {
        componentsFound: extractionResult.labels.length,
        averageConfidence: extractionResult.confidence,
        tokenReduction: tokenAnalysisResult.reduction.percentage,
        labels: extractionResult.labels
      });
      
      setLabels(analysisResult.labels);
      setResults(analysisResult);
      setTokenAnalysis({
        originalTokens: tokenAnalysisResult.rawElements.estimatedTokens,
        optimizedTokens: tokenAnalysisResult.semanticComponents.estimatedTokens,
        reduction: tokenAnalysisResult.reduction.percentage
      });
      setIsScanning(false);
      
    } catch (error) {
      console.error("Extraction failed:", error);
      
      // Fallback to basic element detection
      const currentElements = getSceneElements();
      const fallbackLabels: SemanticLabel[] = currentElements.map((element, index) => ({
        id: `fallback-${index}`,
        elementId: element.id,
        label: `${element.type} (fallback)`,
        confidence: 0.5,
        category: 'unknown' as const,
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      }));
      
      setLabels(fallbackLabels);
      setResults({
        labels: fallbackLabels,
        summary: `Fallback mode: detected ${fallbackLabels.length} basic elements`,
        timestamp: Date.now(),
      });
      setIsScanning(false);
    }
  };

  const handleClear = () => {
    setLabels([]);
    setResults(undefined);
    setTokenAnalysis(undefined);
  };

  const handleLabelClick = (label: SemanticLabel) => {
    console.log("Label clicked:", label);
  };

  return (
    <div 
      ref={containerRef}
      style={{ height: "100vh", width: "100%", position: "relative" }}
    >
      <Excalidraw
        excalidrawAPI={(api: ExcalidrawImperativeAPI) => {
          excalidrawRef.current = api;
          if (api) {
            console.log("Excalidraw API ref set");
          }
        }}
        onChange={subscribeToChanges}
        initialData={{
          elements: [],
          appState: {
            viewBackgroundColor: "#ffffff",
          },
        }}
      />
      
      <OverlayLayer
        labels={labels}
        viewTransform={{ 
          zoom: sceneState.appState.zoom.value, 
          scrollX: sceneState.appState.scrollX, 
          scrollY: sceneState.appState.scrollY 
        }}
        containerRef={containerRef}
        onLabelClick={handleLabelClick}
      />
      
      
      <ControlPanel
        onScan={handleScan}
        isScanning={isScanning}
        results={results}
        onClear={handleClear}
        tokenAnalysis={tokenAnalysis}
      />
    </div>
  );
}