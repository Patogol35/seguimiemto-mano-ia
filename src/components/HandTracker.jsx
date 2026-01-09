import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* =========================
   CONFIGURACIÓN
========================= */
const STABLE_FRAMES = 6; // frames necesarios para confirmar gesto
const THUMB_MARGIN = 0.035; // tolerancia pulgar

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
  const frameCountRef = useRef(0);

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

    const detected = detectGesture(lm);
    updateGesture(detected);
  };

  /* =========================
     SUAVIZADO ANTI PARPADEO
  ========================= */
  const updateGesture = (newGesture) => {
    if (newGesture === lastGestureRef.current) {
      frameCountRef.current++;
    } else {
      lastGestureRef.current = newGesture;
      frameCountRef.current = 1;
    }

    if (frameCountRef.current >= STABLE_FRAMES && newGesture !== gesture) {
      setGesture(newGesture);

      // Callback externo
      if (onGestureChange) onGestureChange(newGesture);

      // Acción asociada
      if (gestureActions[newGesture]) {
        gestureActions[newGesture]();
      }
    }
  };

  /* =========================
     DETECCIÓN DE GESTOS
  ========================= */
  const isFingerUp = (tip, pip) => tip.y < pip.y;

  const detectGesture = (lm) => {
    const indexUp = isFingerUp(lm[8], lm[6]);
    const middleUp = isFingerUp(lm[12], lm[10]);
    const ringUp = isFingerUp(lm[16], lm[14]);
    const pinkyUp = isFingerUp(lm[20], lm[18]);

    const fingersUp = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean)
      .length;

    // 👍 / 👎 pulgar (con tolerancia)
    const thumbUp = lm[4].y < lm[3].y - THUMB_MARGIN;
    const thumbDown = lm[4].y > lm[3].y + THUMB_MARGIN;

    // ✌️ PAZ
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "✌️ PAZ";

    // 👍 PULGAR ARRIBA
    if (thumbUp && fingersUp === 0) return "👍 PULGAR ARRIBA";

    // 👎 PULGAR ABAJO
    if (thumbDown && fingersUp === 0) return "👎 PULGAR ABAJO";

    // ✊ PUÑO
    if (fingersUp === 0) return "✊ PUÑO";

    // ✋ MANO ABIERTA
    if (fingersUp === 4) return "✋ MANO ABIERTA";

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
