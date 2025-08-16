"use client";

export default function SimpleTestOverlay() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255, 0, 0, 0.3)",
        border: "20px solid red",
        zIndex: 2147483647,
        pointerEvents: "none",
        boxSizing: "border-box"
      }}
    >
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "black",
        color: "white",
        padding: "20px",
        fontSize: "24px",
        fontWeight: "bold"
      }}>
        SIMPLE TEST OVERLAY - CENTER OF SCREEN
      </div>
    </div>
  );
}