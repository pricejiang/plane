"use client";

import { OverlayProps } from "@/types";

export default function Overlay({ 
  labels, 
  viewTransform, 
  onLabelClick 
}: OverlayProps) {
  const transformLabel = (label: any) => {
    const { zoom, offsetX, offsetY } = viewTransform;
    return {
      x: (label.x + offsetX) * zoom,
      y: (label.y + offsetY) * zoom,
      width: label.width * zoom,
      height: label.height * zoom,
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {labels.map((label) => {
        const transformed = transformLabel(label);
        return (
          <div
            key={label.id}
            className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-auto cursor-pointer"
            style={{
              left: transformed.x,
              top: transformed.y,
              width: transformed.width,
              height: transformed.height,
            }}
            onClick={() => onLabelClick?.(label)}
          >
            <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {label.label} ({Math.round(label.confidence * 100)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}