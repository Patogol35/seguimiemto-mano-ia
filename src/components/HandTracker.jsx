import { useRef } from "react";
import { useHandTracker } from "../hooks/useHandTracker";
import "../styles/handTracker.css";

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useHandTracker(videoRef, canvasRef);

  return (
    <div className="ht-root">
      {/* Título */}
      <h3 className="ht-title">
        Autor: Jorge Patricio Santamaría Cherrez
      </h3>

      {/* Video oculto */}
      <video ref={videoRef} className="ht-video" />

      {/* Contenedor cámara */}
      <div className="ht-camera">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="ht-canvas"
        />
      </div>
    </div>
  );
}
