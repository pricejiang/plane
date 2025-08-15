"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import Overlay from "./Overlay";
import ControlPanel from "./ControlPanel";
import { 
  SemanticLabel, 
  AnalysisResult, 
  ViewportBounds,
  SceneState 
} from "@/types";

// Use our own types
import type { 
  ExcalidrawElement,
  AppState
} from "@/types";

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
  
  // Scene state
  const [sceneState, setSceneState] = useState<SceneState>({
    elements: [],
    appState: {
      viewBackgroundColor: "#ffffff",
      gridSize: 20,
      zoom: { value: 1 },
      scrollX: 0,
      scrollY: 0,
    },
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
  const excalidrawRef = useRef<any>(null);
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
  const getSceneElements = useCallback((): any[] => {
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

  // Update scene state with throttling
  const updateSceneState = useCallback(() => {
    if (!excalidrawRef.current) return;
    
    // Clear existing throttle
    if (throttledUpdateRef.current) {
      clearTimeout(throttledUpdateRef.current);
    }
    
    // Throttle updates to avoid excessive re-renders
    throttledUpdateRef.current = setTimeout(() => {
      const elements = getSceneElements();
      const appState = getAppState();
      const viewport = calculateViewportBounds(appState);
      
      console.log("Scene state updated:", {
        elementsCount: elements.length,
        zoom: appState.zoom.value,
        scroll: { x: appState.scrollX, y: appState.scrollY },
        selectedElements: appState.selectedElementIds ? Object.keys(appState.selectedElementIds) : [],
        viewport,
      });
      
      setSceneState({
        elements: elements as any[],
        appState,
        viewport,
        lastUpdate: Date.now(),
      });
    }, 100); // 100ms throttle
  }, [getSceneElements, getAppState, calculateViewportBounds]);

  // Subscribe to changes
  const subscribeToChanges = useCallback(() => {
    // This will be called on every Excalidraw change
    updateSceneState();
  }, [updateSceneState]);

  // Handle Excalidraw initialization
  useEffect(() => {
    // Initial scene state update when component mounts
    const initTimer = setTimeout(() => {
      if (excalidrawRef.current) {
        console.log("Excalidraw API initialized successfully");
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
  }, [updateSceneState]);

  const handleScan = async () => {
    setIsScanning(true);
    
    // Get current scene data for potential integration with GPT-4o
    const currentElements = getSceneElements();
    const currentAppState = getAppState();
    
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
            label: "User Interface Mockup",
            confidence: 0.92,
            category: "diagram",
            x: 100,
            y: 100,
            width: 200,
            height: 150,
          },
          {
            id: "2", 
            elementId: "mock-2",
            label: "Login Button",
            confidence: 0.87,
            category: "widget",
            x: 350,
            y: 200,
            width: 80,
            height: 30,
          }
        ],
        summary: `Canvas contains ${currentElements.length} elements including UI mockup with interactive elements`,
        timestamp: Date.now(),
      };
      
      setLabels(mockResults.labels);
      setResults(mockResults);
      setIsScanning(false);
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
        excalidrawAPI={(api: any) => {
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
      
      <Overlay
        labels={labels}
        viewTransform={{ 
          zoom: sceneState.appState.zoom.value, 
          offsetX: sceneState.appState.scrollX, 
          offsetY: sceneState.appState.scrollY 
        }}
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