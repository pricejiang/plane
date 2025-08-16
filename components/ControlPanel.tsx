"use client";

import { ControlPanelProps } from "@/types";

export default function ControlPanel({ 
  onScan, 
  isScanning, 
  results, 
  onClear,
  tokenAnalysis 
}: ControlPanelProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      padding: '16px',
      width: '320px',
      zIndex: 20,
      border: '1px solid #d1d5db'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'black' }}>Canvas Scanner</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={onScan}
          disabled={isScanning}
          style={{
            width: '100%',
            backgroundColor: isScanning ? '#60a5fa' : '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: '500',
            border: 'none',
            cursor: isScanning ? 'not-allowed' : 'pointer'
          }}
        >
          {isScanning ? "Scanning..." : "Scan Canvas"}
        </button>

        {results && (
          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Results ({results.labels.length} items)
              </span>
              {onClear && (
                <button
                  onClick={onClear}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="max-h-40 overflow-y-auto space-y-2">
              {results.labels.map((label) => (
                <div
                  key={label.id}
                  className="text-xs bg-gray-50 p-2 rounded border"
                >
                  <div className="font-medium">{label.label}</div>
                  <div className="text-gray-600">
                    {label.category} • {Math.round(label.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
            
            {tokenAnalysis && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Token Optimization:
                </div>
                <div className="text-xs text-gray-600 bg-green-50 p-2 rounded border-green-200 border">
                  <div className="flex justify-between">
                    <span>Original:</span>
                    <span className="font-mono">{tokenAnalysis.originalTokens} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Optimized:</span>
                    <span className="font-mono">{tokenAnalysis.optimizedTokens} tokens</span>
                  </div>
                  <div className="flex justify-between font-medium text-green-700 mt-1 pt-1 border-t border-green-200">
                    <span>Reduction:</span>
                    <span className="font-mono">{tokenAnalysis.reduction.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {results.summary && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Summary:
                </div>
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  {results.summary}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}