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

/**
 * Overlay layer component that renders semantic labels over the Excalidraw canvas
 * with perfect synchronization to pan/zoom operations at 60fps performance
 * @param labels - Array of semantic labels to render
 * @param viewTransform - Current zoom and scroll state from Excalidraw
 * @param containerRef - Reference to the Excalidraw container (for future container bounds)
 * @param onLabelClick - Optional callback when a label is clicked
 */
export default function OverlayLayer({
  labels,
  viewTransform,
  containerRef: _containerRef, // Prefix with underscore to indicate intentionally unused
  onLabelClick
}: OverlayLayerProps) {
  
  console.log("OverlayLayer rendering with", labels.length, "labels");
  console.log("ViewTransform:", viewTransform);
  
  /**
   * Converts canvas coordinates to container-relative screen coordinates
   * Accounts for Excalidraw's zoom-dependent scroll behavior
   * @param canvasX - X coordinate in canvas space
   * @param canvasY - Y coordinate in canvas space
   * @returns Screen coordinates relative to the container
   */
  const canvasToContainer = (canvasX: number, canvasY: number) => {
    try {
      // Validate inputs
      if (!isFinite(canvasX) || !isFinite(canvasY)) {
        console.warn("Invalid canvas coordinates:", { canvasX, canvasY });
        return { x: 0, y: 0 };
      }
      
      if (!viewTransform || !isFinite(viewTransform.zoom) || viewTransform.zoom === 0) {
        console.warn("Invalid view transform:", viewTransform);
        return { x: canvasX, y: canvasY };
      }
      
      // Pattern: zoom > 1 = slower pan, zoom < 1 = faster pan
      // So we multiply scroll by zoom to normalize movement speed across zoom levels
      const normalizedScrollX = viewTransform.scrollX * viewTransform.zoom;
      const normalizedScrollY = viewTransform.scrollY * viewTransform.zoom;
      
      const containerX = canvasX + normalizedScrollX;
      const containerY = canvasY + normalizedScrollY;
      
      return { x: containerX, y: containerY };
    } catch (error) {
      console.error("Error in coordinate transformation:", error);
      return { x: canvasX, y: canvasY }; // Fallback to original coordinates
    }
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
        
        // Determine if this is a widget and style accordingly
        const isWidget = label.category === 'widget' || label.label.toLowerCase().includes('widget');
        const widgetType = getWidgetTypeFromLabel(label.label);
        
        const style = getWidgetStyle(isWidget, widgetType, viewTransform.zoom);
        
        return (
          <div
            key={label.id}
            style={{
              position: "absolute",
              left: containerPos.x,
              top: containerPos.y,
              width: scaledWidth,
              height: scaledHeight,
              ...style,
              padding: `${8 * viewTransform.zoom}px`,
              fontWeight: "bold",
              textAlign: "center",
              fontSize: `${11 * viewTransform.zoom}px`,
              pointerEvents: "auto",
              borderRadius: `${4 * viewTransform.zoom}px`,
              boxShadow: `0 ${2 * viewTransform.zoom}px ${8 * viewTransform.zoom}px rgba(0,0,0,0.2)`
            }}
            onClick={() => onLabelClick?.(label)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
              {getWidgetIcon(widgetType, viewTransform.zoom)}
              <div style={{ marginTop: `${4 * viewTransform.zoom}px` }}>
                {label.label}
              </div>
              {viewTransform.zoom > 0.5 && (
                <div style={{ fontSize: `${9 * viewTransform.zoom}px`, opacity: 0.8, marginTop: `${2 * viewTransform.zoom}px` }}>
                  {Math.round(label.confidence * 100)}% confidence
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper functions for widget-specific styling
function getWidgetTypeFromLabel(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('map')) return 'map';
  if (lower.includes('video')) return 'video';
  if (lower.includes('iframe') || lower.includes('embed')) return 'iframe';
  if (lower.includes('chart') || lower.includes('graph')) return 'chart';
  if (lower.includes('calendar')) return 'calendar';
  return 'unknown';
}

function getWidgetStyle(isWidget: boolean, widgetType: string, zoom: number) {
  if (!isWidget) {
    return {
      backgroundColor: "rgba(59, 130, 246, 0.9)", // Blue
      color: "white",
      border: `${2 * zoom}px solid rgba(59, 130, 246, 1)`
    };
  }

  const styles = {
    map: {
      backgroundColor: "rgba(34, 197, 94, 0.9)", // Green
      color: "white",
      border: `${2 * zoom}px solid rgba(34, 197, 94, 1)`
    },
    video: {
      backgroundColor: "rgba(239, 68, 68, 0.9)", // Red
      color: "white", 
      border: `${2 * zoom}px solid rgba(239, 68, 68, 1)`
    },
    iframe: {
      backgroundColor: "rgba(168, 85, 247, 0.9)", // Purple
      color: "white",
      border: `${2 * zoom}px solid rgba(168, 85, 247, 1)`
    },
    chart: {
      backgroundColor: "rgba(245, 158, 11, 0.9)", // Amber
      color: "white",
      border: `${2 * zoom}px solid rgba(245, 158, 11, 1)`
    },
    calendar: {
      backgroundColor: "rgba(6, 182, 212, 0.9)", // Cyan
      color: "white",
      border: `${2 * zoom}px solid rgba(6, 182, 212, 1)`
    }
  };

  return styles[widgetType as keyof typeof styles] || {
    backgroundColor: "rgba(156, 163, 175, 0.9)", // Gray
    color: "white",
    border: `${2 * zoom}px solid rgba(156, 163, 175, 1)`
  };
}

function getWidgetIcon(widgetType: string, zoom: number) {
  const iconSize = Math.max(12, 16 * zoom);
  const iconStyle = { fontSize: `${iconSize}px`, lineHeight: 1 };

  const icons = {
    map: <span style={iconStyle}>🗺️</span>,
    video: <span style={iconStyle}>🎥</span>,
    iframe: <span style={iconStyle}>🌐</span>,
    chart: <span style={iconStyle}>📊</span>,
    calendar: <span style={iconStyle}>📅</span>
  };

  return icons[widgetType as keyof typeof icons] || <span style={iconStyle}>📱</span>;
}