import { useEffect, useRef } from "react";
import { Hands, HAND_CONNECTIONS } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

/* ======================
DRAW
====================== */
const drawLandmarks = (ctx, landmarks) => {
  ctx.fillStyle = "#22c55e";
  for (const p of landmarks) {
    ctx.beginPath();
    ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, 4, 0, Math.PI * 2);
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
GESTOS (CORRECTOS)
====================== */
const fingerUp = (l, tip, pip) => l[tip].y < l[pip].y;

// 👉 PULGAR: eje X (CLAVE)
const thumbUp = (l) =>
  Math.abs(l[4].x - l[2].x) > 0.08 && // pulgar extendido
  l[4].y < l[2].y + 0.05;             // un poco hacia arriba

const detectGesture = (l) => {
  const thumb = thumbUp(l);
  const index = fingerUp(l, 8, 6);
  const middle = fingerUp(l, 12, 10);
  const ring = fingerUp(l, 16, 14);
  const pinky = fingerUp(l, 20, 18);

  // 👊 PUÑO
  if (!thumb && !index && !middle && !ring && !pinky) {
    return "PUÑO ✊";
  }

  // 👍 PULGAR ARRIBA (AISLADO)
  if (thumb && !index && !middle && !ring && !pinky) {
    return "PULGAR ARRIBA 👍";
  }

  if (index && middle && !ring && !pinky) return "PAZ ✌️";
  if (index && !middle && !ring && !pinky) return "APUNTAR ☝️";
  if (index && pinky && !middle && !ring) return "ROCK 🤟";
  if (thumb && index && middle && ring && pinky) return "MANO ABIERTA 🖐️";
  if (dist(l[4], l[8]) < 0.035) return "CLICK 👌";

  return "GESTO";
};

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

    hands.onResults((results) => {
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

      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.strokeText(gesture, canvas.width / 2, 40);
      ctx.fillStyle = "#fff";
      ctx.fillText(gesture, canvas.width / 2, 40);
    });

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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 16,
        gap: 12,
      }}
    >
      <h3 style={{ color: "#94a3b8", fontSize: 15 }}>
        Autor: Jorge Patricio Santamaría Cherrez
      </h3>

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
