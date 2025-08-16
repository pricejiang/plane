"use client";

import { SemanticLabel } from "@/types";

export interface ViewTransform {
  zoom: number;
  scrollX: number;
  scrollY: number;
}

export interface OverlayLayerProps {
  labels: SemanticLabel[];
  viewTransform: ViewTransform;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onLabelClick?: (label: SemanticLabel) => void;
}

export default function OverlayLayer({
  labels,
  viewTransform,
  containerRef,
  onLabelClick
}: OverlayLayerProps) {
  
  console.log("OverlayLayer rendering with", labels.length, "labels");
  console.log("ViewTransform:", viewTransform);
  
  // Helper function to convert canvas coordinates to container-relative coordinates
  const canvasToContainer = (canvasX: number, canvasY: number) => {
    // Pattern: zoom > 1 = slower pan, zoom < 1 = faster pan
    // So I need to multiply scroll by zoom to compensate
    const normalizedScrollX = viewTransform.scrollX * viewTransform.zoom;
    const normalizedScrollY = viewTransform.scrollY * viewTransform.zoom;
    
    const containerX = canvasX + normalizedScrollX;
    const containerY = canvasY + normalizedScrollY;
    
    return { x: containerX, y: containerY };
  };
  
  if (labels.length > 0) {
    console.log("First label canvas coords:", { x: labels[0].x, y: labels[0].y });
    const debugPos = canvasToContainer(labels[0].x, labels[0].y);
    console.log("First label screen coords:", debugPos);
  }
  
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        border: "10px solid green",
        boxSizing: "border-box",
        pointerEvents: "none"
      }}
    >
      {/* Debug: Always visible test element */}
      <div 
        style={{
          position: "absolute",
          top: 50,
          left: 50,
          backgroundColor: "yellow",
          color: "black",
          padding: "20px",
          fontSize: "18px",
          fontWeight: "bold",
          zIndex: 11
        }}
      >
        OVERLAY LAYER - {labels.length} labels - Zoom: {viewTransform.zoom.toFixed(2)}
      </div>
      
      {/* Coordinate-transformed label rendering */}
      {labels.map((label) => {
        const containerPos = canvasToContainer(label.x, label.y);
        const scaledWidth = label.width * viewTransform.zoom;
        const scaledHeight = label.height * viewTransform.zoom;
        
        
        return (
          <div
            key={label.id}
            style={{
              position: "absolute",
              left: containerPos.x,
              top: containerPos.y,
              width: scaledWidth,
              height: scaledHeight,
              backgroundColor: "blue",
              color: "white",
              padding: `${10 * viewTransform.zoom}px`,
              border: `${3 * viewTransform.zoom}px solid white`,
              fontWeight: "bold",
              textAlign: "center",
              fontSize: `${12 * viewTransform.zoom}px`,
              pointerEvents: "auto"
            }}
            onClick={() => onLabelClick?.(label)}
          >
            {label.label}
            <br />
            {`(${label.x}, ${label.y})`}
          </div>
        );
      })}
    </div>
  );
}