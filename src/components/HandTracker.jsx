import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* =========================
   CONFIG
========================= */
const STABLE_FRAMES = 6;

/* =========================
   ACCIONES
========================= */
const gestureActions = {
  "👍 PULGAR ARRIBA": () => console.log("LIKE"),
  "👎 PULGAR ABAJO": () => console.log("DISLIKE"),
  "✌️ PAZ": () => console.log("PAZ"),
  "✋ MANO ABIERTA": () => console.log("OPEN"),
  "✊ PUÑO": () => console.log("FIST"),
};

export default function HandTracker({ onGestureChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const lastGesture = useRef(null);
  const stableCount = useRef(0);

  const [gesture, setGesture] = useState("Detectando...");

  useEffect(() => {
    const hands = new Hands({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.75,
      minTrackingConfidence: 0.75,
    });

    hands.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current });
      },
    });

    camera.start();
  }, []);

  /* =========================
     RESULTADOS
  ========================= */
  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    resizeCanvas(canvas);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks?.length) {
      updateGesture("Sin mano");
      return;
    }

    const lm = results.multiHandLandmarks[0];
    drawLandmarks(ctx, lm);

    const g = detectGesture(lm);
    updateGesture(g);
  };

  /* =========================
     SUAVIZADO
  ========================= */
  const updateGesture = (g) => {
    if (g === lastGesture.current) {
      stableCount.current++;
    } else {
      lastGesture.current = g;
      stableCount.current = 1;
    }

    if (stableCount.current >= STABLE_FRAMES && g !== gesture) {
      setGesture(g);
      onGestureChange?.(g);
      gestureActions[g]?.();
    }
  };

  /* =========================
     UTILIDADES MATEMÁTICAS
  ========================= */
  const angle = (a, b, c) => {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const mag =
      Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
    return Math.acos(dot / mag) * (180 / Math.PI);
  };

  const isFingerUp = (tip, pip) => tip.y < pip.y;

  /* =========================
     DETECCIÓN REAL
  ========================= */
  const detectGesture = (lm) => {
    const indexUp = isFingerUp(lm[8], lm[6]);
    const middleUp = isFingerUp(lm[12], lm[10]);
    const ringUp = isFingerUp(lm[16], lm[14]);
    const pinkyUp = isFingerUp(lm[20], lm[18]);

    const fingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean)
      .length;

    // Ángulo del pulgar (CMC–MCP–TIP)
    const thumbAngle = angle(lm[1], lm[2], lm[4]);
    const thumbExtended = thumbAngle > 150;

    const thumbDirection = lm[4].y - lm[2].y;

    // ✌️ PAZ
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "✌️ PAZ";

    // 👍 PULGAR ARRIBA
    if (thumbExtended && thumbDirection < -0.02 && fingersUp === 0)
      return "👍 PULGAR ARRIBA";

    // 👎 PULGAR ABAJO
    if (thumbExtended && thumbDirection > 0.02 && fingersUp === 0)
      return "👎 PULGAR ABAJO";

    // ✋ MANO ABIERTA
    if (fingersUp === 4 && thumbExtended) return "✋ MANO ABIERTA";

    // ✊ PUÑO
    if (fingersUp === 0 && !thumbExtended) return "✊ PUÑO";

    return "🤔 DESCONOCIDO";
  };

  /* =========================
     CANVAS RESPONSIVE
  ========================= */
  const resizeCanvas = (canvas) => {
    const parent = canvas.parentElement;
    const size = Math.min(parent.offsetWidth, 420);
    canvas.width = size;
    canvas.height = size * 0.75;
  };

  const drawLandmarks = (ctx, lm) => {
    ctx.fillStyle = "#22d3ee";
    lm.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  /* =========================
     UI
  ========================= */
  return (
    <div style={styles.wrapper}>
      <video ref={videoRef} style={{ display: "none" }} />

      <div style={styles.card}>
        <canvas ref={canvasRef} />
        <div style={styles.gesture}>{gesture}</div>
      </div>
    </div>
  );
}

/* =========================
   ESTILOS
========================= */
const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#020617",
    borderRadius: 16,
    boxShadow: "0 0 40px rgba(34,211,238,.25)",
    padding: 12,
    textAlign: "center",
  },
  gesture: {
    marginTop: 12,
    fontSize: "1.3rem",
    fontWeight: 600,
    color: "#e5e7eb",
  },
};
