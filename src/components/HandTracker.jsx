import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* =========================
   CONFIG
========================= */
const STABLE_FRAMES = 6;

/* =========================
   MAPA GESTO → ACCIÓN
========================= */
const gestureActions = {
  "✊ PUÑO": () => console.log("Acción: PUÑO"),
  "✋ MANO ABIERTA": () => console.log("Acción: MANO ABIERTA"),
  "✌️ PAZ": () => console.log("Acción: PAZ"),
  "👍 PULGAR ARRIBA": () => console.log("Acción: LIKE"),
  "👎 PULGAR ABAJO": () => console.log("Acción: DISLIKE"),
};

export default function HandTracker({ onGestureChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const lastGestureRef = useRef(null);
  const stableCountRef = useRef(0);

  const [gesture, setGesture] = useState("Detectando...");

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
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
      width: 640,
      height: 480,
    });

    camera.start();
  }, []);

  /* =========================
     RESULTADOS
  ========================= */
  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks?.length) {
      updateGesture("Sin mano");
      return;
    }

    const lm = results.multiHandLandmarks[0];
    drawLandmarks(ctx, lm);

    const detectedGesture = detectGesture(lm);
    updateGesture(detectedGesture);
  };

  /* =========================
     SUAVIZADO
  ========================= */
  const updateGesture = (newGesture) => {
    if (newGesture === lastGestureRef.current) {
      stableCountRef.current++;
    } else {
      lastGestureRef.current = newGesture;
      stableCountRef.current = 1;
    }

    if (
      stableCountRef.current >= STABLE_FRAMES &&
      newGesture !== gesture
    ) {
      setGesture(newGesture);

      if (onGestureChange) onGestureChange(newGesture);
      if (gestureActions[newGesture]) gestureActions[newGesture]();
    }
  };

  /* =========================
     DETECCIÓN
  ========================= */
  const isFingerUp = (tip, pip) => tip.y < pip.y;

  const distance = (a, b) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const detectGesture = (lm) => {
    const indexUp = isFingerUp(lm[8], lm[6]);
    const middleUp = isFingerUp(lm[12], lm[10]);
    const ringUp = isFingerUp(lm[16], lm[14]);
    const pinkyUp = isFingerUp(lm[20], lm[18]);

    const fingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean)
      .length;

    /* ===== PULGAR PROFESIONAL ===== */

    // Pulgar extendido (forma)
    const thumbExtended = distance(lm[4], lm[2]) > 0.08;

    // Dirección del pulgar (vector)
    const thumbVectorY = lm[4].y - lm[2].y;
    const thumbUp = thumbVectorY < -0.04;
    const thumbDown = thumbVectorY > 0.04;

    /* ===== ORDEN CRÍTICO ===== */

    // ✌️ PAZ
    if (indexUp && middleUp && !ringUp && !pinkyUp) {
      return "✌️ PAZ";
    }

    // 👍 PULGAR ARRIBA
    if (thumbExtended && thumbUp && fingersUp === 0) {
      return "👍 PULGAR ARRIBA";
    }

    // 👎 PULGAR ABAJO
    if (thumbExtended && thumbDown && fingersUp === 0) {
      return "👎 PULGAR ABAJO";
    }

    // ✊ PUÑO
    if (fingersUp === 0 && !thumbExtended) {
      return "✊ PUÑO";
    }

    // ✋ MANO ABIERTA
    if (fingersUp === 4 && thumbExtended) {
      return "✋ MANO ABIERTA";
    }

    return "🤔 DESCONOCIDO";
  };

  /* =========================
     DIBUJO
  ========================= */
  const drawLandmarks = (ctx, lm) => {
    ctx.fillStyle = "#00ffcc";
    lm.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x * 640, p.y * 480, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  return (
    <div style={{ textAlign: "center" }}>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width={640} height={480} />
      <h2>{gesture}</h2>
    </div>
  );
}
