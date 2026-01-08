import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
UTILS DRAW
====================== */
const drawLandmarks = (ctx, landmarks) => {
  ctx.fillStyle = "#22c55e";
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(
      p.x * ctx.canvas.width,
      p.y * ctx.canvas.height,
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
};

const drawConnectors = (ctx, landmarks, connections) => {
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  for (const [a, b] of connections) {
    const p1 = landmarks[a];
    const p2 = landmarks[b];
    ctx.beginPath();
    ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
    ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
    ctx.stroke();
  }
};

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* ======================
GESTOS BASE
====================== */
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

/* Pulgar extendido (horizontal, mano izq / der) */
const thumbExtended = (l) => {
  const wrist = l[0];
  const tip = l[4];
  const mcp = l[2];

  const isRightHand = tip.x < wrist.x;

  return isRightHand
    ? tip.x < mcp.x - 0.04
    : tip.x > mcp.x + 0.04;
};

/* Pulgar arriba PRO */
const thumbUp = (l) => {
  const thumb = thumbExtended(l);

  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);

  const thumbAway =
    dist(l[4], l[0]) > dist(l[5], l[0]) * 1.3;

  return thumb && !index && !middle && !ring && !pinky && thumbAway;
};

/* ======================
COMPONENTE
====================== */
export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (f) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
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
    return () => camera.stop();
  }, []);

  /* ======================
DETECTAR GESTO
====================== */
  const detectGesture = (l) => {
    const index = fingerUp(l, 8, 6);
    const middle = fingerUp(l, 12, 10);
    const ring = fingerUp(l, 16, 14);
    const pinky = fingerUp(l, 20, 18);
    const thumb = thumbExtended(l);

    // 👊 PUÑO
    if (!thumb && !index && !middle && !ring && !pinky) {
      return "PUÑO ✊";
    }

    // 👍 PULGAR ARRIBA (MEJORADO)
    if (thumbUp(l)) return "PULGAR ARRIBA 👍";

    const count = [thumb, index, middle, ring, pinky].filter(Boolean).length;

    if (index && middle && count === 2) return "PAZ ✌️";
    if (index && count === 1) return "APUNTAR ☝️";
    if (index && pinky && count === 2) return "ROCK 🤟";
    if (count === 5) return "MANO ABIERTA 🖐️";

    // 👌 CLICK
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
        drawConnectors(ctx, l, HAND_CONNECTIONS);
        drawLandmarks(ctx, l);
        gesture = detectGesture(l);
      }
    }

    ctx.font = "bold 32px Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.strokeText(gesture, canvas.width / 2, 48);

    ctx.fillStyle = "#fff";
    ctx.fillText(gesture, canvas.width / 2, 48);
  };

  /* ======================
UI
====================== */
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
      }}
    >
      <h3
        style={{
          color: "#94a3b8",
          fontSize: "14px",
          margin: 0,
          textAlign: "center",
          fontFamily: "Segoe UI, Arial",
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
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
