"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import Overlay from "./Overlay";
import ControlPanel from "./ControlPanel";
import { SemanticLabel, AnalysisResult } from "@/types";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  }
);

export default function ExcalidrawWrapper() {
  const [labels, setLabels] = useState<SemanticLabel[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | undefined>();

  // Debug log to verify component is mounting
  console.log("ExcalidrawWrapper rendering", { labels: labels.length, isScanning });

  const handleScan = async () => {
    setIsScanning(true);
    
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
        summary: "Canvas contains a UI mockup with interactive elements",
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
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <Excalidraw />
      
      <Overlay
        labels={labels}
        viewTransform={{ zoom: 1, offsetX: 0, offsetY: 0 }}
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