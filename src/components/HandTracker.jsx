import { useRef } from "react";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import { useHandTracker } from "../hooks/useHandTracker";

/* ======================
UTILS (IGUAL QUE ANTES)
====================== */
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  /* ======================
  GESTOS — NO SE TOCA
  ====================== */
  const detectGesture = (l) => {
    const thumbOpen = dist(l[4], l[5]) > dist(l[3], l[5]) * 1.2;
    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);

    const count = [thumbOpen, index, middle, ring, pinky].filter(Boolean).length;

    if (count === 0) return "PUÑO ✊";
    if (thumbOpen && count === 1) return "PULGAR ARRIBA 👍";
    if (index && middle && count === 2) return "PAZ ✌️";
    if (index && count === 1) return "APUNTAR ☝️";
    if (index && pinky && count === 2) return "ROCK 🤟";
    if (count === 5) return "MANO ABIERTA 🖐️";
    if (dist(l[4], l[8]) < 0.035) return "CLICK 👌";

    return `DEDOS: ${count}`;
  };

  /* ======================
  RESULTADOS
  ====================== */
  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    let gesture = "Sin mano";

    if (results.multiHandLandmarks) {
      for (const l of results.multiHandLandmarks) {
        gesture = detectGesture(l);
      }
    }

    // Texto visible
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.strokeText(gesture, canvas.width / 2, 48);
    ctx.fillStyle = "#fff";
    ctx.fillText(gesture, canvas.width / 2, 48);
  };

  /* ======================
  HOOK
  ====================== */
  useHandTracker(videoRef, onResults);

  /* ======================
  UI
  ====================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 16,
      }}
    >
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ width: "100%", maxWidth: 640 }}
      />
    </div>
  );
}
