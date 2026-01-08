import { useRef } from "react";
import { useHandTracker } from "../hooks/useHandTracker";

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useHandTracker(videoRef, canvasRef);

  return (
    <div
      style={{
        minHeight: "100svh",          // ✔️ viewport real móvil
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "16px",
        gap: "12px",
        boxSizing: "border-box",
        overflow: "hidden",           // ✔️ evita zoom raro
      }}
    >
      {/* Video oculto */}
      <video ref={videoRef} style={{ display: "none" }} />

      {/* Contenedor cámara */}
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          aspectRatio: "4 / 3",       // ✔️ mantiene proporción
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(34,197,94,0.4)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          background: "#000",
          display: "flex",
        }}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",     // ✔️ NO recorta en horizontal
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
