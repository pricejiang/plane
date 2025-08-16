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
    
    // Get current scene data for potential integration with GPT-4o
    const currentElements = getSceneElements();
    
    console.log("Scanning canvas with:", {
      elementsCount: currentElements.length,
      viewport: sceneState.viewport,
      elements: currentElements,
    });
    
    // Mock scan for now - this will be replaced with actual GPT-4o integration
    setTimeout(() => {
      const mockResults: AnalysisResult = {
        labels: [
          {
            id: "1",
            elementId: "mock-1",
            label: "Performance Test Marker",
            confidence: 0.95,
            category: "diagram",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
          {
            id: "2", 
            elementId: "mock-2",
            label: "60fps Test",
            confidence: 0.90,
            category: "widget",
            x: 200,
            y: 200,
            width: 120,
            height: 60,
          },
          {
            id: "3", 
            elementId: "mock-3",
            label: "Smooth Movement",
            confidence: 0.88,
            category: "widget",
            x: -150,
            y: -100,
            width: 140,
            height: 50,
          }
        ],
        summary: `Canvas contains ${currentElements.length} elements including UI mockup with interactive elements`,
        timestamp: Date.now(),
      };
      
      console.log("Setting labels:", mockResults.labels);
      setLabels(mockResults.labels);
      setResults(mockResults);
      setIsScanning(false);
      console.log("Scan completed, labels set:", mockResults.labels.length);
    }, 2000);
  };

  const handleClear = () => {
    setLabels([]);
    setResults(undefined);
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
      />
    </div>
  );
}