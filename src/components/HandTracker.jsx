import { useRef } from "react";
import { useHandTracker } from "../hooks/useHandTracker";

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useHandTracker(videoRef, canvasRef);

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
        gap: "12px",
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          color: "#94a3b8",
          fontWeight: 500,
          fontSize: "14px",
          margin: 0,
          letterSpacing: "0.4px",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        Autor: Jorge Patricio Santamaría Cherrez
      </h3>

      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          aspectRatio: "4 / 3",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.4)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          background: "#000",
        }}
      >
        <video ref={videoRef} style={{ display: "none" }} />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>
    </div>
  );
}
