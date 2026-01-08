import { useRef } from "react";
import { useHandTracker } from "../hooks/useHandTracker";

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useHandTracker(videoRef, canvasRef);

  return (
    <div style={{ minHeight: "100vh", background: "#020617", padding: 24 }}>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width={640} height={480} />
    </div>
  );
}
